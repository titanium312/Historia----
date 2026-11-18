// src/buscador/ArmarJson.ts
import { Request, Response } from "express";
import { CombinarConsulta } from "../buscador/10-CombinarConsulta";
import { obtenerDatosUsuarioRaw, extraerSexoGenero } from "../buscador/5-datosUsuario";

/* ---------- Keys de la plantilla ---------- */

const PACIENTE_KEYS = [
  "direccion_paciente", "fk_ocupacion", "fk_nivel_educativo", "fk_grupo_etnico",
  "fk_discapacidad",
  "EnfoqueDiferencialIdGenero",
  "IdOrientacionSexualEnfoqueDiferencial",
  "fk_sexo",
  "Genero",
  "enfoque_diferencial_religion", "enfoque_diferencial_consumo_spa",
  "enfoque_diferencial_gestacion", "enfoque_resguardo_indigena",
  "enfoque_diferencial_victima_conflicto_armado", "enfoque_minas_antipersonas",
  "enfoque_minas_municion_sinexplotar", "enfoque_diferencial_desplazado",
  "enfoque_diferencial_ruv", "enfoque_diferencial_victima_maltrato",
  "enfoque_diferencial_abandono_social", "enfoque_diferencial_carcelario",
  "enfoque_diferencial_migrante", "enfoque_diferencial_desescolarizado",
  "enfoque_diferencial_trabajadora_sexual", "enfoque_diferencial_poblacion_lgbti",
  "enfoque_diferencial_desempleado", "enfoque_diferencial_mujer_nino_menor_ano",
  "enfoque_diferencial_adulto_mayor",
  "fk_tipo_paciente",              // ← AGREGAR ESTA LÍNEA
  "EnfoqueDiferencialHabitanteCalle",
  "EnfoqueMadreComunitaria", "EnfoqueDesmovilizado", "EnfoqueCentroPsiquiatrico",
  "EnfoqueOtroGrupoPoblacional"
] as const;

/* ---------- Helpers ---------- */

const str = (v: any): string => (v === null || v === undefined ? "" : String(v));

const money = (v: any): string => {
  if (v === null || v === undefined) return "0";
  if (typeof v === "number") return String(v);
  const s = String(v).trim();
  return s === "" ? "0" : s;
};

const num0 = (v: any): number => {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const bool = (v: any): boolean => {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "true" || s === "1" || s === "si" || s === "sí";
  }
  return false;
};

const hoyMMDDYYYY = (): string => {
  const d = new Date();
  return `${String(d.getUTCMonth() + 1).padStart(2, "0")}/${String(d.getUTCDate()).padStart(2, "0")}/${d.getUTCFullYear()}`;
};

/**
 * ⚠️ La API de salud que consume este JSON espera fechas en **MM/DD/YYYY**.
 * El origen (sistema colombiano) entrega fechas en **DD/MM/YYYY**.
 * Esta función normaliza CUALQUIER entrada a MM/DD/YYYY.
 *
 * Reglas:
 *   - Formato ISO (YYYY-MM-DD / YYYY/MM/DD) → se reordena a MM/DD/YYYY.
 *   - DD/MM/YYYY o MM/DD/YYYY:
 *       · Si el primero > 12 → seguro es día  → swap a MM/DD.
 *       · Si el segundo > 12 → seguro es día  → ya está en MM/DD.
 *       · Ambos ≤ 12 (ambiguo) → se asume origen DD/MM (Colombia) → swap.
 *   - .NET /Date(ms)/, Date nativo y fallback Date.parse también soportados.
 */
function toApiDate(v: any): string {
  if (v === null || v === undefined || v === "") return "";

  if (v instanceof Date) {
    if (isNaN(v.getTime())) return "";
    return `${String(v.getUTCMonth() + 1).padStart(2, "0")}/${String(v.getUTCDate()).padStart(2, "0")}/${v.getUTCFullYear()}`;
  }

  const s = String(v).trim();
  if (!s) return "";

  // 1. .NET: /Date(ms)/
  const dotNet = s.match(/\/Date\((-?\d+)/);
  if (dotNet) {
    const d = new Date(Number(dotNet[1]));
    if (isNaN(d.getTime())) return "";
    return `${String(d.getUTCMonth() + 1).padStart(2, "0")}/${String(d.getUTCDate()).padStart(2, "0")}/${d.getUTCFullYear()}`;
  }

  // 2. ISO: YYYY-MM-DD o YYYY/MM/DD (con sufijo de hora opcional)
  const ymd = s.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymd) {
    return `${ymd[2].padStart(2, "0")}/${ymd[3].padStart(2, "0")}/${ymd[1]}`;
  }

  // 3. D/M/YYYY o M/D/YYYY (con sufijo de hora opcional)
  const mdy = s.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (mdy) {
    const a = Number(mdy[1]);
    const b = Number(mdy[2]);
    const y = mdy[3];

    // Primero > 12 → seguro es día (DD/MM) → swap a MM/DD
    if (a > 12) {
      return `${String(b).padStart(2, "0")}/${String(a).padStart(2, "0")}/${y}`;
    }
    // Segundo > 12 → seguro es día (MM/DD) → ya está bien
    if (b > 12) {
      return `${String(a).padStart(2, "0")}/${String(b).padStart(2, "0")}/${y}`;
    }
    // Ambiguo → asumir origen DD/MM (Colombia) → swap a MM/DD
    return `${String(b).padStart(2, "0")}/${String(a).padStart(2, "0")}/${y}`;
  }

  // 4. Fallback: Date.parse
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    return `${String(parsed.getUTCMonth() + 1).padStart(2, "0")}/${String(parsed.getUTCDate()).padStart(2, "0")}/${parsed.getUTCFullYear()}`;
  }

  return "";
}

function toHHmm(v: any): string {
  if (!v) return "";
  if (typeof v === "object") {
    const h = (v as any).Hours;
    const m = (v as any).Minutes;
    if (typeof h === "number" && typeof m === "number") {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
    return "";
  }
  const s = String(v);
  const m = s.match(/^(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : s;
}

function uniqBy<T>(arr: T[], keyFn: (x: T) => any): T[] {
  const seen = new Set<any>();
  const out: T[] = [];
  for (const it of arr) {
    const k = keyFn(it);
    if (!seen.has(k)) { seen.add(k); out.push(it); }
  }
  return out;
}

const preserveObjectOrStr = (v: any): any => {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return v;
  return String(v);
};

/* ---------- Constructores ---------- */

async function armarAdmision(respuestaCombinar: any, idAdmisionFallback: string) {
  const datosAdm = Array.isArray(respuestaCombinar?.datos) ? respuestaCombinar.datos[0] : null;
  const factAdm = respuestaCombinar?.facturas?.Admision ?? {};
  const src = datosAdm ?? factAdm;
  const pick = (k: string) => (src as any)?.[k] ?? (factAdm as any)?.[k];
  const pacSrc = (datosAdm as any)?.pacientes ?? (factAdm as any)?.pacientes ?? {};

  const pac: Record<string, any> = {};
  for (const k of PACIENTE_KEYS) pac[k] = str((pacSrc as any)[k]);

  // ─── Enriquecimiento condicional sexo/género ───
  const sexoVacio = !pac.fk_sexo;
  const generoVacio = !pac.Genero;
  const enfoqueGeneroVacio = !pac.EnfoqueDiferencialIdGenero;
  const orientacionSexualVacio = !pac.IdOrientacionSexualEnfoqueDiferencial;

  if (sexoVacio || generoVacio || enfoqueGeneroVacio || orientacionSexualVacio) {
    const idAdmisionParaConsulta = str(pick("id_admision")) || idAdmisionFallback;
    if (idAdmisionParaConsulta) {
      try {
        const admisiones = await obtenerDatosUsuarioRaw(idAdmisionParaConsulta);
        const { sexoId, sexoNombre, generoId, generoTexto } = extraerSexoGenero(admisiones);
        if (sexoVacio && sexoId !== null) { pac.fk_sexo = String(sexoId); pac.sexo_nombre = sexoNombre; }
        if (generoVacio && generoTexto) { pac.Genero = generoTexto; pac.genero_texto = generoTexto; }
        if (enfoqueGeneroVacio && sexoId !== null) pac.EnfoqueDiferencialIdGenero = String(sexoId);
        if (orientacionSexualVacio && generoId !== null) pac.IdOrientacionSexualEnfoqueDiferencial = String(generoId);
      } catch (e) {
        console.warn("[armarAdmision] enriquecimiento sexo/género:", e instanceof Error ? e.message : e);
      }
    }
  }

  // ─── Fallback de fechas críticas ───
  const fcp = respuestaCombinar?.facturas?.FacturasCompletasPasar ?? {};

  let fechaAdmision = toApiDate(pick("fecha_admision"));
  if (!fechaAdmision) {
    const fac0 = Array.isArray(fcp.FacturasF) ? fcp.FacturasF[0] : null;
    fechaAdmision = toApiDate(fac0?.fecha_emision);
  }
  if (!fechaAdmision) {
    const con0 = Array.isArray(fcp.FacturasConsultasF) ? fcp.FacturasConsultasF[0] : null;
    fechaAdmision = toApiDate(con0?.fecha_atencion);
  }
  if (!fechaAdmision) fechaAdmision = hoyMMDDYYYY();

  const fechaRemision = toApiDate(pick("fecha_remision")) || fechaAdmision;
  const fechaEmision = toApiDate(pick("fecha_emision")) || fechaAdmision;

  return {
    id_admision: str(pick("id_admision")),
    numero_admision: str(pick("numero_admision")),
    fecha_admision: fechaAdmision,
    hora_admision: toHHmm(pick("hora_admision")),
    hora_remision: toHHmm(pick("hora_remision")),
    hora_emision: toHHmm(pick("hora_emision")),
    fecha_remision: fechaRemision,
    fecha_emision: fechaEmision,
    fecha_vencimiento: pick("fecha_vencimiento") ? toApiDate(pick("fecha_vencimiento")) : "",
    metodo_pago: str(pick("metodo_pago")),
    fk_entidad: str(pick("fk_entidad")),
    fk_paciente: str(pick("fk_paciente")),
    nombre_acompanante: str(pick("nombre_acompanante")),
    direccion_acompanante: str(pick("direccion_acompanante")),
    telefono_acompanante: str(pick("telefono_acompanante")),
    nombre_responsable: str(pick("nombre_responsable")),
    parentesco_responsable: str(pick("parentesco_responsable")),
    telefono_responsable: str(pick("telefono_responsable")),
    fk_usuario: 0,
    fk_institicion: str(pick("fk_institucion") ?? pick("fk_institicion")),
    fk_cita_asignada: pick("fk_cita_asignada") ?? null,
    fk_recurso: preserveObjectOrStr(pick("fk_recurso")),
    fk_contrato_entidad: num0(pick("fk_contrato_entidad")),
    IdTipoAtencionSinContrato: str(pick("IdTipoAtencionSinContrato") ?? "0"),
    fk_valoracion_triage: pick("fk_valoracion_triage") ?? null,
    observaciones: str(pick("observaciones")),
    pacientes: pac,
  };
}

function armarFacturaF(src: any) {
  return {
    id_factura: str(src.id_factura),
    numero_factura: str(src.numero_factura),
    autorizacion: str(src.autorizacion),
    poliza: str(src.poliza),
    fecha_emision: toApiDate(src.fecha_emision),
    hora_emision: toHHmm(src.hora_emision),
    fecha_vencimiento: src.fecha_vencimiento ? toApiDate(src.fecha_vencimiento) : null,
    fk_paciente: str(src.fk_paciente),
    fk_admision: str(src.fk_admision),
    fk_usuario: 0,
    fk_entidad: str(src.fk_entidad),
    fk_contrato_entidad: num0(src.fk_contrato_entidad),
    fk_servicio_ingreso: preserveObjectOrStr(src.fk_servicio_ingreso),
    fk_cama: src.fk_cama ?? null,
    fecha_ingreso: toApiDate(src.fecha_ingreso),
    fecha_egreso: toApiDate(src.fecha_egreso),
    fk_causa_externa: preserveObjectOrStr(src.fk_causa_externa),
    estado_salida: preserveObjectOrStr(src.estado_salida),
    fk_destino: num0(src.fk_destino),
    valor_unitario: str(src.valor_unitario),
    valor_total: str(src.valor_total),
    fk_causa_externa_urgencias: str(src.fk_causa_externa_urgencias),
    fecha_ingreso_urgencias: toApiDate(src.fecha_ingreso_urgencias),
    hora_ingreso_urgencias: str(src.hora_ingreso_urgencias),
    fecha_egreso_urgencias: toApiDate(src.fecha_egreso_urgencias),
    hora_egreso_urgencias: str(src.hora_egreso_urgencias),
    estado_salida_urgencias: str(src.estado_salida_urgencias),
    fk_procedimiento_urgencias: str(src.fk_procedimiento_urgencias),
    horas_atencion_urgencias: str(src.horas_atencion_urgencias),
    fecha_nacimiento_recien_nacido: toApiDate(src.fecha_nacimiento_recien_nacido),
    hora_nacimiento_recien_nacido: str(src.hora_nacimiento_recien_nacido),
    edad_gestacional_recien_nacido: str(src.edad_gestacional_recien_nacido),
    control_prenatal_recien_nacido: str(src.control_prenatal_recien_nacido),
    peso_recien_nacido: str(src.peso_recien_nacido),
    fk_sexo_recien_nacido: str(src.fk_sexo_recien_nacido),
    fecha_muerte_recien_nacido: toApiDate(src.fecha_muerte_recien_nacido),
    hora_muerte_recien_nacido: str(src.hora_muerte_recien_nacido),
    IdDestinoSalida: str(src.IdDestinoSalida),
    NumeroControlPrenatal: str(src.NumeroControlPrenatal),
    IdPacienteMadreRecienNacido: src.IdPacienteMadreRecienNacido ?? null,
    valor_urgencias: money(src.valor_urgencias),
    autorizacion_observaciones: str(src.autorizacion_observaciones),
    facturar_urgencias: bool(src.facturar_urgencias),
    fk_centro_servicios_urgencias: str(src.fk_centro_servicios_urgencias),
    IdProfesionalUrgencias: str(src.IdProfesionalUrgencias),
    fk_centro_costos_urgencias: src.fk_centro_costos_urgencias ?? null,
    cuota_moderadora: money(src.cuota_moderadora),
    valor_copago: money(src.valor_copago),
    valor_comision: str(src.valor_comision),
    valor_descuento: money(src.valor_descuento),
    valor_retefuente: str(src.valor_retefuente),
    valor_total_consultas: money(src.valor_total_consultas),
    valor_total_procedimientos: money(src.valor_total_procedimientos),
    valor_total_medicamentos: money(src.valor_total_medicamentos),
    valor_total_articulos: money(src.valor_total_articulos),
    valor_total_conceptos: money(src.valor_total_conceptos),
    valor_total_factura: money(src.valor_total_factura),
    IdEnfermedadDiagnosticoPrincipalUrgencias: str(src.IdEnfermedadDiagnosticoPrincipalUrgencias),
    numero_nacido_vivo_recien_nacido: str(src.numero_nacido_vivo_recien_nacido),
    fk_institucion: num0(src.fk_institucion),
  };
}

function armarFacturaConsulta(src: any, index: number, total: number, fechaAdmisionFallback: string) {
  const diagPrincRaw = Array.isArray(src.facturas_consultas_enfermedades_diagnostico_principal)
    ? src.facturas_consultas_enfermedades_diagnostico_principal : [];
  const diagPrinc = uniqBy(diagPrincRaw, (d: any) => d?.fk_enfermedad);
  const consultasDiagPrinc = diagPrinc.map((d: any) => ({
    id: d.fk_enfermedad,
    text: d.nombre || d.text || d.fk_enfermedad,
  }));

  const fechaAtencion = toApiDate(src.fecha_atencion) || fechaAdmisionFallback;

  return {
    id: 0,
    id_factura_consultas: num0(src.id_factura_consultas),
    IdActividad: num0(src.IdActividad),
    fk_finalida_consulta: num0(src.fk_finalida_consulta),
    fk_causa_externa: num0(src.fk_causa_externa),
    fk_procedimiento: str(src.fk_procedimiento),
    fk_procedimiento_soat: str(src.fk_procedimiento_soat),
    fk_procedimiento_iss: str(src.fk_procedimiento_iss),
    nombre_soat_procedimiento: str(src.nombre_soat_procedimiento),
    fk_consulta_externa: str(src.fk_consulta_externa),
    fk_cita_asignada: str(src.fk_cita_asignada),
    nombre_procedimiento: str(src.nombre_procedimiento),
    fecha_atencion: fechaAtencion,
    hora_atencion: toHHmm(src.hora_atencion),
    autorizacion: str(src.autorizacion),
    tipo_diagnostico: str(src.tipo_diagnostico),
    cuota_moderadora: money(src.cuota_moderadora),
    cantidad_consulta: str(src.cantidad_consulta ?? 1),
    valor_unitario_consulta: money(src.valor_unitario_consulta),
    valor_unitario_cuota_moderadora: money(src.valor_unitario_cuota_moderadora),
    fk_centro_costos: str(src.fk_centro_costos),
    fk_centro_servicios: str(src.fk_centro_servicios),
    fk_usuario: str(src.fk_usuario),
    fk_consultorio: str(src.fk_consultorio),
    valor_consulta: money(src.valor_consulta),
    neto_pagar: money(src.neto_pagar),
    tipo_atencion: str(src.tipo_atencion ?? 0),
    facturar: bool(src.facturar),
    fk_recurso: str(src.fk_recurso),
    paginacion: `Consulta ${index + 1} de ${total}`,
    datosSoat: Array.isArray(src.datosSoat) ? src.datosSoat : [],
    listaUsuarios: Array.isArray(src.listaUsuarios) ? src.listaUsuarios : [],
    listaConsultorios: Array.isArray(src.listaConsultorios) ? src.listaConsultorios : [],
    IdServicio: str(src.IdServicio),
    IdModalidadAtencion: num0(src.IdModalidadAtencion),
    consultasDiagnosticosPrincipales: consultasDiagPrinc,
    consultasDiagnosticosRelacionales: [],
    facturas_consultas_enfermedades_diagnostico_principal: diagPrinc.map((d: any) => ({
      fk_enfermedad: d.fk_enfermedad,
    })),
    facturas_consultas_enfermedades_diagnostico_relacional: [],
  };
}

function armarFacturaProcedimiento(
  src: any,
  fechaAdmisionFallback: string,
  usuarioFallback: string,
  recursoFallback: string
) {
  const fechaProc = toApiDate(src.fecha_procedimiento)
    || toApiDate(src.fecha_atencion)
    || fechaAdmisionFallback;

  const fkUsuarioProc = str(src.fk_usuario) || usuarioFallback;
  const fkRecursoProc = str(src.fk_recurso) || recursoFallback;

  return {
    id_facturas_procedimiento: str(src.id_facturas_procedimiento),
    fk_factura: str(src.fk_factura),
    fk_procedimiento: str(src.fk_procedimiento),
    fk_procedimiento_soat: str(src.fk_procedimiento_soat),
    fk_procedimiento_iss: str(src.fk_procedimiento_iss),
    nombre_procedimiento: str(src.nombre_procedimiento),
    fecha_procedimiento: fechaProc,
    hora_procedimiento: toHHmm(src.hora_procedimiento),
    autorizacion: str(src.autorizacion),
    cantidad: str(src.cantidad ?? 1),
    fk_recurso: fkRecursoProc,
    fk_centro_costos: str(src.fk_centro_costos),
    fk_centro_servicios: str(src.fk_centro_servicios),
    fk_finalidad_procedimiento: str(src.fk_finalidad_procedimiento),
    fk_enfermedad_diagnostico_principal: str(src.fk_enfermedad_diagnostico_principal),
    fk_enfermedad_diagnostico_relacional: str(src.fk_enfermedad_diagnostico_relacional),
    fk_enfermedad_complicacion: str(src.fk_enfermedad_complicacion),
    valorCirujano: money(src.valorCirujano),
    valorDerechoSala: money(src.valorDerechoSala),
    valorMaterialesInsumos: money(src.valorMaterialesInsumos),
    valorTarifaAyudantia: money(src.valorTarifaAyudantia),
    valorAnestesiologia: money(src.valorAnestesiologia),
    cuota_moderadora: money(src.cuota_moderadora),
    valor_unitario: money(src.valor_unitario),
    valor_total: money(src.valor_total),
    facturar: bool(src.facturar),
    fk_usuario: fkUsuarioProc,
    IdLiquidacionCirugia: src.IdLiquidacionCirugia ?? null,
    IdModalidadAtencion: num0(src.IdModalidadAtencion),
    IdViaIngreso: num0(src.IdViaIngreso),
    fk_institucion: num0(src.fk_institucion),
    IdMipres: str(src.IdMipres),
    IdServicio: str(src.IdServicio),
    cantidadOrdenada: str(src.cantidadOrdenada),
  };
}

async function armarTemplate(respuestaCombinar: any) {
  const fcpSrc = respuestaCombinar?.facturas?.FacturasCompletasPasar ?? {};
  const idAdmision = str(
    respuestaCombinar?.datos?.[0]?.id_admision ??
    respuestaCombinar?.facturas?.Admision?.id_admision ?? ""
  );

  const Admision = await armarAdmision(respuestaCombinar, idAdmision);
  const fechaAdmision = Admision.fecha_admision;

  const fcpOut: Record<string, any[]> = {
    FacturasF: [], FacturasHospitalizacionesF: [],
    FacturasEnfermedadesDiagnosticoIngresoF: [], FacturasEnfermedadesDiagnosticoRelacionalF: [],
    FacturasEnfermedadeComplicacionesF: [], FacturasEnfermedadesDiagnosticoMuerteF: [],
    FacturasEnfermedadesDiagnosticoRelacionalEgresoF: [], FacturasEnfermedadesDiagnosticoEgresoF: [],
    FacturasConsultasF: [], FacturasProcedimientosF: [],
    FacturasEnfermedadesDiagnosticoEgresoUrgenciasF: [],
    FacturasEnfermedadesDiagnosticoRelacionalEgresoUrgenciasF: [],
    FacturasEnfermedadesDiagnosticoMuerteUrgenciasF: [],
    FacturasMedicamentosF: [], FacturasArticulosF: [],
    FacturasOtrosConceptosFacturacionF: [],
    FacturasRecienNacidosEnfermedadDiagnosticoF: [],
    FacturasRecienNacidosEnfermedadCausaMuerteF: [],
  };

  const arrF = Array.isArray(fcpSrc.FacturasF) ? fcpSrc.FacturasF : [];
  fcpOut.FacturasF = arrF.map(armarFacturaF);

  const arrC = Array.isArray(fcpSrc.FacturasConsultasF) ? fcpSrc.FacturasConsultasF : [];
  fcpOut.FacturasConsultasF = arrC.map((it: any, i: number) =>
    armarFacturaConsulta(it, i, arrC.length, fechaAdmision)
  );

  // Fallbacks de profesional/recurso desde la primera consulta
  const usuarioFallback = str(arrC[0]?.fk_usuario) || "1";
  const recursoFallback = str(arrC[0]?.fk_recurso) || "1";

  const arrP = Array.isArray(fcpSrc.FacturasProcedimientosF) ? fcpSrc.FacturasProcedimientosF : [];
  fcpOut.FacturasProcedimientosF = arrP.map((it: any) =>
    armarFacturaProcedimiento(it, fechaAdmision, usuarioFallback, recursoFallback)
  );

  return { Admision, FacturasCompletasPasar: fcpOut };
}

/* ---------- Endpoint ---------- */

export async function armarJson(req: Request, res: Response): Promise<void> {
  try {
    const { numeroAdmision } = req.body ?? {};
    if (!numeroAdmision) {
      res.status(400).json({ error: "numeroAdmision es obligatorio" });
      return;
    }

    let capturado: any = null;
    let statusCode = 200;

    const fakeRes: any = {
      status(code: number) { statusCode = code; return fakeRes; },
      json(payload: any) { capturado = payload; return fakeRes; },
      send(payload: any) { capturado = payload; return fakeRes; },
      end() { return fakeRes; },
    };
    const fakeReq: any = { body: { numeroAdmision: String(numeroAdmision) }, query: {}, params: {} };

    await CombinarConsulta(fakeReq, fakeRes);

    if (statusCode !== 200) {
      res.status(statusCode).json(
        capturado ?? { error: `Error ${statusCode} al ejecutar CombinarConsulta` }
      );
      return;
    }

    const json = await armarTemplate(capturado);

    // Diagnóstico: toda fecha crítica debe ser MM/DD/YYYY
    const chequear = (label: string, val: string) => {
      if (val && !/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
        console.warn(`[armarJson] ${label} NO es MM/DD/YYYY: "${val}"`);
      }
    };
    chequear("Admision.fecha_admision", json.Admision.fecha_admision);
    chequear("Admision.fecha_remision", json.Admision.fecha_remision);
    chequear("Admision.fecha_emision", json.Admision.fecha_emision);
    json.FacturasCompletasPasar.FacturasConsultasF.forEach((c, i) =>
      chequear(`Consultas[${i}].fecha_atencion`, c.fecha_atencion)
    );
    json.FacturasCompletasPasar.FacturasProcedimientosF.forEach((p, i) =>
      chequear(`Procedimientos[${i}].fecha_procedimiento`, p.fecha_procedimiento)
    );

    res.status(200).json(json);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[armarJson]", msg);
    res.status(500).json({ error: "Internal error", detalle: msg });
  }
}