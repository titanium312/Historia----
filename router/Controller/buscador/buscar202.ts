// src/controllers/buscar202.ts

import { Request, Response } from 'express';
import { filtrarYMapgearRips } from '../utils/ripsMapper';

export const buscar202 = (req: Request, res: Response) => {
  try {
    const { identificacion } = req.query;

    if (!identificacion) {
      return res.json({
        mensaje: 'No se proporcionó identificación. Envía el parámetro "identificacion" para filtrar.',
      });
    }

    const idNumber = Number(identificacion);
    if (isNaN(idNumber)) {
      return res.status(400).json({
        error: 'El parámetro "identificacion" debe ser un número válido.'
      });
    }

    const resultados = filtrarYMapgearRips(idNumber);

    res.json({
      totalRegistros: 0, // ya no tenemos el total global, pero puedes mantenerlo si quieres
      totalCoincidencias: resultados.length,
      resultados
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};