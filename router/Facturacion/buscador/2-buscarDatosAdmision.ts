// src/controllers/buscarDatosAdmision.ts
import { Request, Response } from 'express';

const BASE_URL = 'https://balance.saludplus.co';

// ⚠️ Token embebido (hardcodeado). Rótalo cuando puedas y muévelo a .env
const TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiUmJhcnJldG8iLCJ1c2VybmFtZSI6IlJiYXJyZXRvIiwiZW1haWwiOiJyYi5yb2JlcnRvLmJhcnJldG9AZ21haWwuY29tIiwiYWRtaW4iOiJOIiwidXNlcmlkIjoiNjg3NCIsImluc3RpdHV0aW9uIjoiMjAiLCJwYWdvcyI6IjAiLCJ2ZXJzaW9uIjoiMS4wLjAuMCIsImVudmlyb25tZW50IjoiUHJvZHVjdGlvbiIsImV4cCI6MTc5NTAxMjM0NCwiaXNzIjoidGVnZXR0LmxvZ2luIiwiYXVkIjoidGVnZXR0LmNvbSJ9.' +
  'B5c6BiRGjqgnkApcdpAPtBSqypz__nvWLUn3KvSE6v0';

type AdmisionQuery = {
  idAdmision?: string;
  numeroAdmision?: string;
  fechaAdmision?: string;
  inicialFechaAdmision?: string;
  finalFechaAdmision?: string;
  idEntidad?: string;
  idPaciente?: string;
  estados?: string;
  idrecurso?: string;
  idUsuario?: string;
  idCama?: string;
};

// Campos de la admisión que SÍ queremos devolver
const ADMISION_FIELDS = [
  'id_admision',
  'numero_admision',
  'fecha_admision',
  'hora_admision',
  'hora_remision',
  'fecha_remision',
  'metodo_pago',
  'fk_entidad',
  'fk_paciente',
  'fk_usuario',
  'fk_contrato_entidad',
  'IdTipoAtencionSinContrato',
] as const;

// Campos del paciente que SÍ queremos devolver
const PACIENTE_FIELDS = [
  'direccion_paciente',
  'fk_ocupacion',
  'fk_nivel_educativo',
  'fk_grupo_etnico',
  'fk_discapacidad',
  'EnfoqueDiferencialIdGenero',
  'IdOrientacionSexualEnfoqueDiferencial',
  'fk_tipo_paciente',
] as const;

function pick<T extends Record<string, any>>(obj: T, keys: readonly (keyof T)[]) {
  const out: Record<string, any> = {};
  if (!obj || typeof obj !== 'object') return out;
  for (const k of keys) {
    if (k in obj) out[k as string] = obj[k];
  }
  return out;
}

function filtrarAdmision(item: any) {
  if (!item || typeof item !== 'object') return item;

  const admision = pick(item, ADMISION_FIELDS as unknown as (keyof typeof item)[]);

  // Conservar el objeto `pacientes` pero solo con los campos pedidos
  if (item.pacientes && typeof item.pacientes === 'object') {
    admision.pacientes = pick(
      item.pacientes,
      PACIENTE_FIELDS as unknown as (keyof typeof item.pacientes)[]
    );
  } else {
    admision.pacientes = null;
  }

  return admision;
}

export async function buscarDatosAdmision(req: Request, res: Response) {
  try {
    if (!TOKEN) {
      return res.status(500).json({ error: 'SALUDPLUS_TOKEN no configurado' });
    }

    const q = req.query as AdmisionQuery;
    const params = new URLSearchParams({
      idAdmision:           q.idAdmision           ?? '0',
      numeroAdmision:       q.numeroAdmision       ?? '0',
      fechaAdmision:        q.fechaAdmision        ?? '*',
      inicialFechaAdmision: q.inicialFechaAdmision ?? '*',
      finalFechaAdmision:   q.finalFechaAdmision   ?? '*',
      idEntidad:            q.idEntidad            ?? '0',
      idPaciente:           q.idPaciente           ?? '0',
      estados:              q.estados              ?? '',
      idrecurso:            q.idrecurso            ?? '0',
      idUsuario:            q.idUsuario            ?? '0',
      idCama:               q.idCama               ?? '0',
    });

    const upstream = await fetch(
      `${BASE_URL}/admisiones/AdmisionesBuscar?${params}`,
      {
        method: 'GET',
        headers: {
          accept: 'application/json, text/javascript, */*; q=0.01',
          authorization: `Bearer ${TOKEN}`,
          'x-requested-with': 'XMLHttpRequest',
        },
      }
    );

    if (!upstream.ok) {
      const detail = await upstream.text();
      return res.status(upstream.status).json({
        error: 'Error consultando AdmisionesBuscar',
        upstreamStatus: upstream.status,
        detail,
      });
    }

    const data = await upstream.json();

    // El upstream devuelve un array; filtramos cada admisión
    const filtrado = Array.isArray(data)
      ? data.map(filtrarAdmision)
      : filtrarAdmision(data);

    return res.json(filtrado);
  } catch (err) {
    console.error('[buscarDatosAdmision]', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}