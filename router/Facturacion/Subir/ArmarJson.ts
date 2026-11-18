// src/buscador/ArmarJson.ts
import { Request, Response } from "express";
import { CombinarConsulta } from "../buscador/10-CombinarConsulta";

/* ---------- Keys de la plantilla ---------- */

const FACTURAS_KEYS = [
  "FacturasF",
  "FacturasConsultasF",
  "FacturasProcedimientosF",
] as const;

const PACIENTE_KEYS = [
  "direccion_paciente", "fk_ocupacion", "fk_nivel_educativo", "fk_grupo_etnico",
  "fk_discapacidad", "EnfoqueDiferencialIdGenero",
  "IdOrientacionSexualEnfoqueDiferencial", "fk_tipo_paciente",
  // Nuevos campos de enfoque diferencial solicitados
  "enfoque_diferencial_religion", "enfoque_diferencial_consumo_spa",
  "enfoque_diferencial_gestacion", "enfoque_resguardo_indigena",
  "enfoque_diferencial_victima_conflicto_armado", "enfoque_minas_antipersonas",
  "enfoque_minas_municion_sinexplotar", "enfoque_diferencial_desplazado",
  "enfoque_diferencial_ruv", "enfoque_diferencial_victima_maltrato",
  "enfoque_diferencial_abandono_social", "enfoque_diferencial_carcelario",
  "enfoque_diferencial_migrante", "enfoque_diferencial_desescolarizado",
  "enfoque_diferencial_trabajadora_sexual", "enfoque_diferencial_poblacion_lgbti",
  "enfoque_diferencial_desempleado", "enfoque_diferencial_mujer_nino_menor_ano",
  "enfoque_diferencial_adulto_mayor", "EnfoqueDiferencialHabitanteCalle",
  "EnfoqueMadreComunitaria", "EnfoqueDesmovilizado", "EnfoqueCentroPsiquiatrico",
  "EnfoqueOtroGrupoPoblacional"
] as const;

/* ---------- Helpers ---------- */

const str = (v: any): string => (v === null || v === undefined ? "" : String(v));

/** 
 * String monetario normalizado. 
 * IMPORTANTE: Para coincidir con tu JSON objetivo (" 38900"), NO hacemos trim() agresivo.
 * Solo aseguramos que null/undefined sean "0".
 */
const money = (v: any): string => {
  if (v === null || v === undefined) return "0";
  // Si es un número, lo convertimos a string
  if (typeof v === 'number') return String(v);
  const s = String(v);
  // Si viene vacío después de convertir, retornamos 0
  return s === "" ? "0" : s; 
};

const num0 = (v: any): number => {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Booleano robusto. */
const bool = (v: any): boolean => {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "true" || s === "1" || s === "si" || s === "sí";
  }
  return false;
};

/**
 * Convierte CUALQUIER fecha a DD/MM/YYYY invirtiendo día/mes cuando corresponde.
 */
function toDDMMYYYY(v: any): string {
  if (!v) return "";
  const s = String(v);

  // ISO: 2026-11-05T...
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const [, yyyy, mm, dd] = iso;
    return `${mm}/${dd}/${yyyy}`;
  }

  // DD/MM/YYYY (viene cruzado de datos[0]): invertir
  const dmy = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmy) {
    const [, a, b, yyyy] = dmy;
    return `${b}/${a}/${yyyy}`;
  }

  return s;
}

function toHHmm(v: any): string {
  if (!v) return "";
  const s = String(v);
  const m = s.match(/^(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : s;
}

function uniqBy<T>(arr: T[], keyFn: (x: T) => any): T[] {
  const seen = new Set<any>();
  const out: T[] = [];
  for (const it of arr) {
    const k = keyFn(it);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(it);
    }
  }
  return out;
}

/**
 * Helper para preservar objetos complejos (como fk_recurso) o convertir a string.
 * Si es un objeto, lo devuelve tal cual. Si es primitivo, lo convierte a string.
 */
const preserveObjectOrStr = (v: any): any => {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return v; // <--- CLAVE: Devuelve el objeto completo (jQuery context, etc)
  return String(v);
};

/* ---------- Constructores ---------- */

function armarAdmision(respuestaCombinar: any) {
  const datosAdm = Array.isArray(respuestaCombinar?.datos)
    ? respuestaCombinar.datos[0]
    : null;
  const factAdm = respuestaCombinar?.facturas?.Admision ?? {};
  const src = datosAdm ?? factAdm;

  // Fallback por campo: primero datos[0], si no existe la key, facturas.Admision
  const pick = (k: string) =>
    (src as any)?.[k] ?? (factAdm as any)?.[k];

  // Pacientes: idem, datos[0].pacientes si existe; si no, facturas.Admision.pacientes
  const pacSrc =
    (datosAdm as any)?.pacientes ??
    (factAdm as any)?.pacientes ??
    {};
  
  const pac: Record<string, any> = {};
  for (const k of PACIENTE_KEYS) {
    // Usamos str para los valores simples
    pac[k] = str((pacSrc as any)[k]);
  }

  return {
    id_admision: str(pick("id_admision")),
    numero_admision: str(pick("numero_admision")),
    fecha_admision: toDDMMYYYY(pick("fecha_admision")),
    hora_admision: toHHmm(pick("hora_admision")),
    hora_remision: toHHmm(pick("hora_remision")),
    hora_emision: toHHmm(pick("hora_emision")),
    fecha_remision: toDDMMYYYY(pick("fecha_remision")),
    fecha_emision: toDDMMYYYY(pick("fecha_emision")),
    fecha_vencimiento: str(pick("fecha_vencimiento")), 
    metodo_pago: str(pick("metodo_pago")),
    fk_entidad: str(pick("fk_entidad")),
    fk_paciente: str(pick("fk_paciente")),
    
    // Campos de acompañante/responsable
    nombre_acompanante: str(pick("nombre_acompanante")),
    direccion_acompanante: str(pick("direccion_acompanante")),
    telefono_acompanante: str(pick("telefono_acompanante")),
    nombre_responsable: str(pick("nombre_responsable")),
    parentesco_responsable: str(pick("parentesco_responsable")),
    telefono_responsable: str(pick("telefono_responsable")),

    fk_usuario: 0,
    // Nota: Mapeo seguro para error tipográfico posible en BD
    fk_institicion: str(pick("fk_institucion") ?? pick("fk_institicion")), 
    
    fk_cita_asignada: pick("fk_cita_asignada") ?? null,
    
    // CAMBIO: Usar preserveObjectOrStr para fk_recurso para mantener el objeto jQuery/context
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
    fecha_emision: toDDMMYYYY(src.fecha_emision),
    hora_emision: toHHmm(src.hora_emision),
    fecha_vencimiento: src.fecha_vencimiento ? toDDMMYYYY(src.fecha_vencimiento) : null,
    fk_paciente: str(src.fk_paciente),
    fk_admision: str(src.fk_admision),
    fk_usuario: 0,
    fk_entidad: str(src.fk_entidad),
    fk_contrato_entidad: num0(src.fk_contrato_entidad),
    
    // CAMBIOS: Usar preserveObjectOrStr para mantener objetos complejos (selectores jQuery, etc)
    fk_servicio_ingreso: preserveObjectOrStr(src.fk_servicio_ingreso),
    fk_cama: src.fk_cama ?? null,
    fecha_ingreso: str(src.fecha_ingreso),
    fecha_egreso: str(src.fecha_egreso),
    fk_causa_externa: preserveObjectOrStr(src.fk_causa_externa),
    estado_salida: preserveObjectOrStr(src.estado_salida),
    fk_destino: num0(src.fk_destino),

    // Valores monetarios y detalles
    valor_unitario: str(src.valor_unitario),
    valor_total: str(src.valor_total),
    fk_causa_externa_urgencias: str(src.fk_causa_externa_urgencias),
    fecha_ingreso_urgencias: str(src.fecha_ingreso_urgencias),
    hora_ingreso_urgencias: str(src.hora_ingreso_urgencias),
    fecha_egreso_urgencias: str(src.fecha_egreso_urgencias),
    hora_egreso_urgencias: str(src.hora_egreso_urgencias),
    estado_salida_urgencias: str(src.estado_salida_urgencias),
    fk_procedimiento_urgencias: str(src.fk_procedimiento_urgencias),
    horas_atencion_urgencias: str(src.horas_atencion_urgencias),
    
    // Recién nacido
    fecha_nacimiento_recien_nacido: str(src.fecha_nacimiento_recien_nacido),
    hora_nacimiento_recien_nacido: str(src.hora_nacimiento_recien_nacido),
    edad_gestacional_recien_nacido: str(src.edad_gestacional_recien_nacido),
    control_prenatal_recien_nacido: str(src.control_prenatal_recien_nacido),
    peso_recien_nacido: str(src.peso_recien_nacido),
    fk_sexo_recien_nacido: str(src.fk_sexo_recien_nacido),
    fecha_muerte_recien_nacido: str(src.fecha_muerte_recien_nacido),
    hora_muerte_recien_nacido: str(src.hora_muerte_recien_nacido),
    IdDestinoSalida: str(src.IdDestinoSalida),
    NumeroControlPrenatal: str(src.NumeroControlPrenatal),
    IdPacienteMadreRecienNacido: src.IdPacienteMadreRecienNacido ?? null,

    // Totales y pagos
    // La función money ahora preserva espacios si vienen en el string original
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

function armarFacturaConsulta(src: any, index: number, total: number) {
  const diagPrincRaw = Array.isArray(src.facturas_consultas_enfermedades_diagnostico_principal)
    ? src.facturas_consultas_enfermedades_diagnostico_principal
    : [];

  const diagPrinc = uniqBy(diagPrincRaw, (d: any) => d?.fk_enfermedad);

  // Mapeo mejorado para incluir el texto descriptivo si existe
  const consultasDiagPrinc = diagPrinc.map((d: any) => ({
    id: d.fk_enfermedad,
    // Intenta obtener el nombre/texto completo, si no, usa el código
    text: d.nombre || d.text || d.fk_enfermedad, 
  }));

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
    
    fecha_atencion: toDDMMYYYY(src.fecha_atencion),
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
    
    // Arrays y objetos auxiliares
    datosSoat: Array.isArray(src.datosSoat) ? src.datosSoat : [],
    listaUsuarios: Array.isArray(src.listaUsuarios) ? src.listaUsuarios : [],
    listaConsultorios: Array.isArray(src.listaConsultorios) ? src.listaConsultorios : [],
    
    IdServicio: str(src.IdServicio),
    // Aseguramos que IdModalidadAtencion sea número si el origen lo requiere, o string si es mixto.
    // En tu ejemplo perfecto era 1 (número) en algunos lados y "1" en otros. Aquí usamos str para consistencia general,
    // pero si necesitas número estricto cambia a num0. El ejemplo target mostraba mezcla, asumimos string por seguridad o num0 si es ID puro.
    // Basado en el target: "IdModalidadAtencion": 1 (número).
    IdModalidadAtencion: num0(src.IdModalidadAtencion),
    
    consultasDiagnosticosPrincipales: consultasDiagPrinc,
    consultasDiagnosticosRelacionales: [],
    facturas_consultas_enfermedades_diagnostico_principal: diagPrinc.map((d: any) => ({
      fk_enfermedad: d.fk_enfermedad,
    })),
    facturas_consultas_enfermedades_diagnostico_relacional: [],
  };
}

function armarFacturaProcedimiento(src: any) {
  return {
    id_facturas_procedimiento: str(src.id_facturas_procedimiento),
    fk_factura: str(src.fk_factura),
    fk_procedimiento: str(src.fk_procedimiento),
    fk_procedimiento_soat: str(src.fk_procedimiento_soat),
    fk_procedimiento_iss: str(src.fk_procedimiento_iss),
    
    nombre_procedimiento: str(src.nombre_procedimiento),
    
    fecha_procedimiento: toDDMMYYYY(src.fecha_procedimiento),
    hora_procedimiento: toHHmm(src.hora_procedimiento),
    autorizacion: str(src.autorizacion),
    cantidad: str(src.cantidad ?? 1),
    fk_recurso: str(src.fk_recurso),
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
    fk_usuario: str(src.fk_usuario),
    IdLiquidacionCirugia: src.IdLiquidacionCirugia ?? null,
    // IdModalidadAtencion como número según ejemplo target
    IdModalidadAtencion: num0(src.IdModalidadAtencion),
    IdViaIngreso: num0(src.IdViaIngreso),
    fk_institucion: num0(src.fk_institucion),
    IdMipres: str(src.IdMipres),
    IdServicio: str(src.IdServicio),
    cantidadOrdenada: str(src.cantidadOrdenada),
  };
}

function armarTemplate(respuestaCombinar: any) {
  const fcpSrc = respuestaCombinar?.facturas?.FacturasCompletasPasar ?? {};

  // Inicializamos todas las keys posibles
  const fcpOut: Record<string, any[]> = {
    FacturasF: [],
    FacturasHospitalizacionesF: [],
    FacturasEnfermedadesDiagnosticoIngresoF: [],
    FacturasEnfermedadesDiagnosticoRelacionalF: [],
    FacturasEnfermedadeComplicacionesF: [],
    FacturasEnfermedadesDiagnosticoMuerteF: [],
    FacturasEnfermedadesDiagnosticoRelacionalEgresoF: [],
    FacturasEnfermedadesDiagnosticoEgresoF: [],
    FacturasConsultasF: [],
    FacturasProcedimientosF: [],
    FacturasEnfermedadesDiagnosticoEgresoUrgenciasF: [],
    FacturasEnfermedadesDiagnosticoRelacionalEgresoUrgenciasF: [],
    FacturasEnfermedadesDiagnosticoMuerteUrgenciasF: [],
    FacturasMedicamentosF: [],
    FacturasArticulosF: [],
    FacturasOtrosConceptosFacturacionF: [],
    FacturasRecienNacidosEnfermedadDiagnosticoF: [],
    FacturasRecienNacidosEnfermedadCausaMuerteF: [],
  };

  const arrF = Array.isArray(fcpSrc.FacturasF) ? fcpSrc.FacturasF : [];
  fcpOut.FacturasF = arrF.map(armarFacturaF);

  const arrC = Array.isArray(fcpSrc.FacturasConsultasF) ? fcpSrc.FacturasConsultasF : [];
  fcpOut.FacturasConsultasF = arrC.map((it: any, i: number) =>
    armarFacturaConsulta(it, i, arrC.length)
  );

  const arrP = Array.isArray(fcpSrc.FacturasProcedimientosF) ? fcpSrc.FacturasProcedimientosF : [];
  fcpOut.FacturasProcedimientosF = arrP.map(armarFacturaProcedimiento);

  return {
    Admision: armarAdmision(respuestaCombinar),
    FacturasCompletasPasar: fcpOut,
  };
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
      json(payload: any)    { capturado = payload; return fakeRes; },
      send(payload: any)    { capturado = payload; return fakeRes; },
      end()                 { return fakeRes; },
    };

    const fakeReq: any = {
      body: { numeroAdmision: String(numeroAdmision) },
      query: {}, params: {},
    };

    await CombinarConsulta(fakeReq, fakeRes);

    if (statusCode !== 200) {
      res.status(statusCode).json(
        capturado ?? { error: `Error ${statusCode} al ejecutar CombinarConsulta` }
      );
      return;
    }

    res.status(200).json(armarTemplate(capturado));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[armarJson]", msg);
    res.status(500).json({ error: "Internal error", detalle: msg });
  }
}