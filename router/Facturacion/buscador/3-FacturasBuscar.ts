// src/controllers/buscarDatosAdmision.ts
import { Request, Response } from 'express';
import axios from 'axios';

// ====== Valores tomados del curl (producción) ======
const API_BASE = 'https://balance.saludplus.co';

const API_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiUmJhcnJldG8iLCJ1c2VybmFtZSI6IlJiYXJyZXRvIiwiZW1haWwiOiJyYi5yb2JlcnRvLmJhcnJldG9AZ21haWwuY29tIiwiYWRtaW4iOiJOIiwidXNlcmlkIjoiNjg3NCIsImluc3RpdHV0aW9uIjoiMjAiLCJwYWdvcyI6IjAiLCJ2ZXJzaW9uIjoiMS4wLjAuMCIsImVudmlyb25tZW50IjoiUHJvZHVjdGlvbiIsImV4cCI6MTc5NTAyMDg3NCwiaXNzIjoidGVnZXR0LmxvZ2luIiwiYXVkIjoidGVnZXR0LmNvbSJ9.vp5MVgehv34ntRi45iqh3sVghrWUWEpxXmvdDJrqs7s';

const API_COOKIE =
  '_ga=GA1.1.433661464.1772468883; cf_zaraz_client=; _clck=2l4g58%5E2%5Egb8%5E0%5E2252; _ga_581YHK4S33=GS2.1.s1794934447$o293$g1$t1794934474$j33$l0$h0; _clsk=rii0tq%5E1794934557247%5E3%5E1%5Eq.clarity.ms%2Fcollect';

const API_DATA_HEADER =
  'TZjpXqYBkd/jlGV6vibVr92rv6YJyAwR0bkt6jGA7x0=.1SS9/UCeyjpq9PyT8MBqPg==.wcFkBNOeMUO3EbN8I4nUXw==';

const API_REFERER =
  'https://balance.saludplus.co/instituciones/?origen=1&theme=false&time=1794934474291';

// ====== Helpers ======
function parseDotNetDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const m = /\/Date\((-?\d+)(?:[+-]\d+)?\)\//.exec(value);
  return m ? new Date(Number(m[1])).toISOString() : null;
}

function formatHora(h: any): string | null {
  if (!h || typeof h.Hours !== 'number') return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h.Hours)}:${pad(h.Minutes)}:${pad(h.Seconds)}`;
}

function mapFactura(f: any) {
  const {
    facturas_consultas,
    facturas_procedimientos,
    facturas_hospitalizaciones,
    facturas_medicamentos,
    facturas_articulos,
    facturas_otros_conceptos_facturacion,
    facturas_enfermedades_diagnostico_ingreso,
    facturas_enfermedades_diagnostico_relacional,
    facturas_enfermedades_complicaciones,
    facturas_enfermedades_diagnostico_muerte,
    facturas_enfermedades_diagnostico_relacional_egreso,
    facturas_enfermedades_diagnostico_egreso,
    facturas_enfermedades_diagnostico_egreso_urgencias,
    facturas_enfermedades_diagnostico_relacional_egreso_urgencias,
    facturas_enfermedades_diagnostico_muerte_urgencias,
    facturas_recien_nacidos_enfermedad_diagnostico,
    facturas_recien_nacidos_enfermedad_causa_muerte,
    pacientes,
    ...rest
  } = f;

  return {
    ...rest,
    fecha_emision: parseDotNetDate(f.fecha_emision),
    fecha_creacion: parseDotNetDate(f.fecha_creacion),
    hora_emision: formatHora(f.hora_emision),
  };
}

// ====== Controlador ======
export async function FacturasBuscar(req: Request, res: Response) {
  try {
    const idAdmision = req.params.idAdmision ?? req.query.idAdmision;
    if (!idAdmision) {
      return res.status(400).json({ error: 'idAdmision es requerido' });
    }

    const { data } = await axios.get(`${API_BASE}/facturas/FacturasBuscar`, {
      params: {
        idFactura: 0,
        numeroFactura: 0,
        idPaciente: 0,
        idEntidad: 0,
        idContratoEntidad: 0,
        fechaFactura: '*',
        inicialFechaFactura: '*',
        finalFechaFactura: '*',
        idUsuario: 0,
        idAdmision,
      },
      headers: {
        accept: 'application/json, text/javascript, */*; q=0.01',
        'accept-language': 'es-419,es;q=0.9,en;q=0.8',
        authorization: `Bearer ${process.env.SALUDPLUS_TOKEN ?? API_TOKEN}`,
        cookie: process.env.SALUDPLUS_COOKIE ?? API_COOKIE,
        data: API_DATA_HEADER,
        priority: 'u=1, i',
        referer: API_REFERER,
        'sec-ch-ua': '"Not-A.Brand";v="99", "Google Chrome";v="157", "Chromium";v="157"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36',
        'x-requested-with': 'XMLHttpRequest',
      },
      timeout: 20_000,
    });

    const facturas: any[] = Array.isArray(data) ? data : [];
    if (facturas.length === 0) {
      return res.status(404).json({ error: 'No se encontraron facturas para esa admisión' });
    }

    facturas.sort((a, b) => {
      const ta = parseDotNetDate(a.fecha_creacion) ?? '';
      const tb = parseDotNetDate(b.fecha_creacion) ?? '';
      return tb.localeCompare(ta);
    });

    const factura = facturas[0];
    const consulta = factura.facturas_consultas?.[0] ?? null;
    const paciente = factura.pacientes ?? {};

    const Admision = {
      id_admision: factura.fk_admision ?? '',
      numero_admision: '',
      fecha_admision: parseDotNetDate(consulta?.fecha_atencion) ?? '',
      hora_admision: formatHora(consulta?.hora_atencion) ?? '',
      hora_remision: '',
      hora_emision: formatHora(factura.hora_emision) ?? '',
      fecha_remision: '',
      fecha_emision: parseDotNetDate(factura.fecha_emision) ?? '',
      metodo_pago: '',
      fk_entidad: factura.fk_entidad ?? '',
      fk_paciente: factura.fk_paciente ?? '',
      fk_usuario: factura.fk_usuario ?? null,
      fk_contrato_entidad: factura.fk_contrato_entidad ?? null,
      IdTipoAtencionSinContrato: '',
      pacientes: {
        direccion_paciente: paciente.direccion_paciente?.trim() ?? '',
        fk_ocupacion: paciente.fk_ocupacion ?? '',
        fk_nivel_educativo: paciente.fk_nivel_educativo ?? '',
        fk_grupo_etnico: paciente.fk_grupo_etnico ?? '',
        fk_discapacidad: paciente.fk_discapacidad ?? '',
        EnfoqueDiferencialIdGenero: paciente.EnfoqueDiferencialIdGenero ?? '',
        IdOrientacionSexualEnfoqueDiferencial:
          paciente.IdOrientacionSexualEnfoqueDiferencial ?? '',
        fk_tipo_paciente: paciente.fk_tipo_paciente ?? '',
      },
    };

    // 1) Construye TODOS los arrays
    const todos: Record<string, any[]> = {
      FacturasF: facturas.map(mapFactura),
      FacturasConsultasF: facturas.flatMap((f) => f.facturas_consultas ?? []),
      FacturasProcedimientosF: facturas.flatMap((f) => f.facturas_procedimientos ?? []),
      FacturasHospitalizacionesF: facturas.flatMap((f) => f.facturas_hospitalizaciones ?? []),
      FacturasEnfermedadesDiagnosticoIngresoF: facturas.flatMap(
        (f) => f.facturas_enfermedades_diagnostico_ingreso ?? [],
      ),
      FacturasEnfermedadesDiagnosticoRelacionalF: facturas.flatMap(
        (f) => f.facturas_enfermedades_diagnostico_relacional ?? [],
      ),
      FacturasEnfermedadeComplicacionesF: facturas.flatMap(
        (f) => f.facturas_enfermedades_complicaciones ?? [],
      ),
      FacturasEnfermedadesDiagnosticoMuerteF: facturas.flatMap(
        (f) => f.facturas_enfermedades_diagnostico_muerte ?? [],
      ),
      FacturasEnfermedadesDiagnosticoRelacionalEgresoF: facturas.flatMap(
        (f) => f.facturas_enfermedades_diagnostico_relacional_egreso ?? [],
      ),
      FacturasEnfermedadesDiagnosticoEgresoF: facturas.flatMap(
        (f) => f.facturas_enfermedades_diagnostico_egreso ?? [],
      ),
      FacturasEnfermedadesDiagnosticoEgresoUrgenciasF: facturas.flatMap(
        (f) => f.facturas_enfermedades_diagnostico_egreso_urgencias ?? [],
      ),
      FacturasEnfermedadesDiagnosticoRelacionalEgresoUrgenciasF: facturas.flatMap(
        (f) => f.facturas_enfermedades_diagnostico_relacional_egreso_urgencias ?? [],
      ),
      FacturasEnfermedadesDiagnosticoMuerteUrgenciasF: facturas.flatMap(
        (f) => f.facturas_enfermedades_diagnostico_muerte_urgencias ?? [],
      ),
      FacturasMedicamentosF: facturas.flatMap((f) => f.facturas_medicamentos ?? []),
      FacturasArticulosF: facturas.flatMap((f) => f.facturas_articulos ?? []),
      FacturasOtrosConceptosFacturacionF: facturas.flatMap(
        (f) => f.facturas_otros_conceptos_facturacion ?? [],
      ),
      FacturasRecienNacidosEnfermedadDiagnosticoF: facturas.flatMap(
        (f) => f.facturas_recien_nacidos_enfermedad_diagnostico ?? [],
      ),
      FacturasRecienNacidosEnfermedadCausaMuerteF: facturas.flatMap(
        (f) => f.facturas_recien_nacidos_enfermedad_causa_muerte ?? [],
      ),
    };

    // 2) Filtra: solo los que tienen elementos
    const FacturasCompletasPasar: Record<string, any[]> = {};
    for (const [key, value] of Object.entries(todos)) {
      if (value.length > 0) FacturasCompletasPasar[key] = value;
    }

    return res.json({ Admision, FacturasCompletasPasar });
  } catch (err: any) {
    const status = err?.response?.status ?? 500;
    return res.status(status).json({
      error: 'Error consultando FacturasBuscar',
      detail: err?.response?.data ?? err?.message,
    });
  }
}