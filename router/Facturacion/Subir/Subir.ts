// src/buscador/buscarIdAdmision.ts
import axios, { AxiosResponse } from 'axios';
import { Request, Response } from 'express';

const URL = 'https://balance.saludplus.co/admisiones/AdmisionesFacturasEditar';

// Token fijo del lado servidor (el cliente NO lo envía)
const DATA_TOKEN =
  'kC0YDHEUO0vlftrAtYHllfCjAqT8zXGwj/hFT8ULo8k=.1SS9/UCeyjpq9PyT8MBqPg==.wcFkBNOeMUO3EbN8I4nUXw==';

export async function Subir(req: Request, res: Response) {
  try {
    // El cliente envía el JSON COMPLETO tal cual (no se reconstruye)
    const body = req.body;

    // Validación mínima: debe existir Admision.id_admision
    if (!body?.Admision?.id_admision) {
      return res.status(400).json({
        ok: false,
        message: 'El body debe incluir Admision.id_admision',
      });
    }

    const response: AxiosResponse = await axios.post(URL, body, {
      headers: {
        'Content-Type': 'application/json',
        data: DATA_TOKEN,
      },
      timeout: 30_000,
    });

    // Se devuelve la respuesta de SaludPlus tal cual
    return res.status(response.status).json(response.data);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      return res.status(err.response?.status ?? 502).json({
        ok: false,
        message: 'Error consultando SaludPlus',
        upstream_status: err.response?.status,
        upstream_data: err.response?.data,
      });
    }

    return res.status(500).json({
      ok: false,
      message: (err as Error).message,
    });
  }
}