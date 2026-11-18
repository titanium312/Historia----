// src/buscador/5-datosUsuario.ts
import { Request, Response } from 'express';
import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'https://balance.saludplus.co';
const TOKEN_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IlJiYXJyZXRvIiwianRpIjoiYTY2NWRkYjItOGJkMi00MzI5LWI2MGUtMDUwOWMzNWU0MDQyIiwidXNlcm5hbWUiOiJSYmFycmV0byIsImVtYWlsIjoicmIucm9iZXJ0by5iYXJyZXRvQGdtYWlsLmNvbSIsImFkbWluIjoiTiIsInVzZXJpZCI6IjY4NzQiLCJpbnN0aXR1dGlvbiI6IjIwIiwicGFnb3MiOiIwIiwidmVyc2lvbiI6IjEuMC4wLjAiLCJlbnZpcm9ubWVudCI6IlByb2R1Y3Rpb24iLCJleHAiOjE3ODc4NjM1MzUsImlzcyI6InRlZ2V0dC5sb2dpbiIsImF1ZCI6InRlZ2V0dC5jb20ifQ.HGY52TK4wxrlTWVW9ELlybd7eN0blAQOMs5XsDu8jk4';
const TOKEN_DATA = 'RyYCH1Lu3RaWjAwjq79h9YnHmVGtZiiHoILsunKhJgM=.1SS9/UCeyjpq9PyT8MBqPg==.wcFkBNOeMUO3EbN8I4nUXw==';

/** Función pura reutilizable: devuelve el JSON crudo de la API (array) */
export async function obtenerDatosUsuarioRaw(idAdmision: string | number): Promise<any[]> {
  const url = `${API_BASE_URL}/admisiones/AdmisionesBuscar`;
  const params = {
    idAdmision,
    numeroAdmision: '0',
    fechaAdmision: '*',
    inicialFechaAdmision: '*',
    finalFechaAdmision: '*',
    idEntidad: '0',
    idPaciente: '0',
    estados: '',
    idrecurso: '0',
    idUsuario: '0',
    idCama: '0',
  };

  const { data } = await axios.get(url, {
    params,
    headers: {
      accept: 'application/json, text/javascript, */*; q=0.01',
      authorization: `Bearer ${TOKEN_JWT}`,
      data: TOKEN_DATA,
      'x-requested-with': 'XMLHttpRequest',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36',
    },
  });

  return Array.isArray(data) ? data : [];
}

/** Helper: extrae sexo/genero normalizados desde la respuesta cruda */
export function extraerSexoGenero(
  admisiones: any[]
): { sexoId: number | null; sexoNombre: string; generoId: number | null; generoTexto: string } {
  const pac = admisiones?.[0]?.pacientes ?? {};
  const sexoId: number | null = pac.fk_sexo ?? null;

  const MAPA_SEXO: Record<number, string> = {
    1: 'FEMENINO',
    2: 'MASCULINO',
    3: 'INDEFINIDO',
  };
  const sexoNombre = sexoId ? MAPA_SEXO[sexoId] ?? 'No especificado' : 'No especificado';

  // Regla de negocio: IDs invertidos para género
  const generoId = sexoId === 1 ? 2 : sexoId === 2 ? 1 : sexoId;

  // El campo "Genero" del paciente puede venir null; hacemos fallback al sexo
  const generoTexto = pac.Genero ?? sexoNombre;

  return { sexoId, sexoNombre, generoId, generoTexto };
}

/** Handler Express (se mantiene igual para no romper rutas existentes) */
export const datosUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    const idAdmision = req.query.idAdmision ?? req.body?.idAdmision ?? '0';
    const data = await obtenerDatosUsuarioRaw(idAdmision);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Error consultando AdmisionesBuscar',
      message: error.message,
    });
  }
};