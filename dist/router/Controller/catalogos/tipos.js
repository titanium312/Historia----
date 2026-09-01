"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.construirBaseHistoria = construirBaseHistoria;
/**
 * Datos base comunes a todos los catálogos.
 */
function construirBaseHistoria(genero, edad, tipoCatalogo) {
    return {
        fecha_registro: new Date().toISOString().split('T')[0],
        tipo_catalogo: tipoCatalogo,
        edad_paciente: edad,
        genero: genero,
        estado: 'EN_PROCESO',
    };
}
