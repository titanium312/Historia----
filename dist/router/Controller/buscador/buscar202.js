"use strict";
// src/controllers/buscar202.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.buscar202 = void 0;
const ripsMapper_1 = require("../utils/ripsMapper");
const buscar202 = (req, res) => {
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
        const resultados = (0, ripsMapper_1.filtrarYMapgearRips)(idNumber);
        res.json({
            totalRegistros: 0, // ya no tenemos el total global, pero puedes mantenerlo si quieres
            totalCoincidencias: resultados.length,
            resultados
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};
exports.buscar202 = buscar202;
