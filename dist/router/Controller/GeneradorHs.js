"use strict";
// ============================================================
// TIPOS Y DEFINICIONES
// ============================================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdmissionRaw = exports.GeneradorHs = void 0;
const buscarIdAdmision_1 = require("./buscador/buscarIdAdmision");
// ============================================================
// IMPORTACIÓN DINÁMICA DE CATÁLOGOS
// ============================================================
let primeraInfancia = null;
let infancia = null;
let adolescencia = null;
let juventud = null;
let adultez = null;
let vejez = null;
function extraerFuncionDelModulo(mod) {
    if (typeof mod === 'function')
        return mod;
    if (mod && typeof mod === 'object') {
        for (const key of Object.keys(mod)) {
            if (typeof mod[key] === 'function') {
                return mod[key];
            }
        }
    }
    return null;
}
async function cargarCatalogos() {
    try {
        const modPrimeraInfancia = await Promise.resolve().then(() => __importStar(require('./catalogos/primeraInfancia')));
        primeraInfancia = extraerFuncionDelModulo(modPrimeraInfancia);
    }
    catch (e) {
        console.warn('⚠️ No se pudo importar catálogo primeraInfancia:', e.message);
    }
    try {
        const modInfancia = await Promise.resolve().then(() => __importStar(require('./catalogos/infancia')));
        infancia = extraerFuncionDelModulo(modInfancia);
    }
    catch (e) {
        console.warn('⚠️ No se pudo importar catálogo infancia:', e.message);
    }
    try {
        const modAdolescencia = await Promise.resolve().then(() => __importStar(require('./catalogos/adolescencia')));
        adolescencia = extraerFuncionDelModulo(modAdolescencia);
    }
    catch (e) {
        console.warn('⚠️ No se pudo importar catálogo adolescencia:', e.message);
    }
    try {
        const modJuventud = await Promise.resolve().then(() => __importStar(require('./catalogos/juventud')));
        juventud = extraerFuncionDelModulo(modJuventud);
    }
    catch (e) {
        console.warn('⚠️ No se pudo importar catálogo juventud:', e.message);
    }
    try {
        const modAdultez = await Promise.resolve().then(() => __importStar(require('./catalogos/adultez')));
        adultez = extraerFuncionDelModulo(modAdultez);
    }
    catch (e) {
        console.warn('⚠️ No se pudo importar catálogo adultez:', e.message);
    }
    try {
        const modVejez = await Promise.resolve().then(() => __importStar(require('./catalogos/vejez')));
        vejez = extraerFuncionDelModulo(modVejez);
    }
    catch (e) {
        console.warn('⚠️ No se pudo importar catálogo vejez:', e.message);
    }
}
(async () => {
    await cargarCatalogos();
})();
// ============================================================
// PLACEHOLDER PARA CATÁLOGOS FALTANTES
// ============================================================
function placeholderCatalogo(tipo, data) {
    return {
        mensaje: `Catálogo "${tipo}" en proceso de implementación.`,
        tipo_catalogo: tipo,
        edad_paciente: data.edad ?? 0,
        genero: data.generoTexto,
        genero_id: data.generoId,
        sexo_id: data.sexoId,
        id_historia: Number(data?.historia?.id_historia ?? 0),
        numero_historia: Number(data?.historia?.numero_historia ?? 0),
        fk_admision: Number(data?.admision?.id_admision ?? 0),
        numero_admision: Number(data?.admision?.numero_admision ?? 0),
        fk_paciente: Number(data?.paciente?.id_paciente ?? 0),
        fecha_registro: new Date().toISOString().split('T')[0],
        estado: 'EN_PROCESO',
    };
}
// ============================================================
// FUNCIONES AUXILIARES
// ============================================================
function parsearFechaAdmision(fechaInput) {
    if (fechaInput instanceof Date) {
        return fechaInput.toISOString().split('T')[0];
    }
    if (typeof fechaInput === 'string' && fechaInput.startsWith('/Date(') && fechaInput.endsWith(')/')) {
        const ms = parseInt(fechaInput.slice(6, -2), 10);
        if (!isNaN(ms)) {
            return new Date(ms).toISOString().split('T')[0];
        }
    }
    if (typeof fechaInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fechaInput)) {
        return fechaInput.split('T')[0];
    }
    const date = new Date(fechaInput);
    if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
    }
    console.warn('Fecha no reconocida, usando hoy:', fechaInput);
    return new Date().toISOString().split('T')[0];
}
// ============================================================
// CONTROLADOR PRINCIPAL
// ============================================================
const GeneradorHs = async (req, res) => {
    try {
        const token = req.body?.token;
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token de autenticación requerido en el cuerpo de la solicitud (campo "token").',
            });
        }
        const numeroAdmision = req.params?.numeroAdmision ??
            req.body?.numeroAdmision ??
            req.query?.numeroAdmision;
        if (!numeroAdmision) {
            return res.status(400).json({
                success: false,
                error: 'Debe proporcionar el parámetro "numeroAdmision".',
            });
        }
        const numAdmisionStr = String(numeroAdmision).trim();
        if (!/^\d+$/.test(numAdmisionStr)) {
            return res.status(400).json({
                success: false,
                error: 'El número de admisión debe contener solo dígitos.',
            });
        }
        // Obtener datos enriquecidos
        const resultado = await (0, buscarIdAdmision_1.obtenerDatosAdmisionEnriquecidos)(numAdmisionStr, 'admision');
        const data = resultado.data;
        const edad = data.edad;
        if (edad === null || edad === undefined) {
            return res.status(400).json({
                success: false,
                error: 'No se pudo obtener la edad del paciente. Verifique que la fecha de nacimiento esté registrada.',
            });
        }
        const sexoId = data.sexoId;
        const generoId = data.generoId;
        const generoTexto = data.generoTexto;
        // Selección de catálogo
        let admisionFormateada;
        let catalogoUsado = '';
        if (edad < 6) {
            catalogoUsado = 'primeraInfancia';
            admisionFormateada = primeraInfancia
                ? primeraInfancia(data)
                : placeholderCatalogo('primeraInfancia', data);
        }
        else if (edad >= 6 && edad < 12) {
            catalogoUsado = 'infancia';
            admisionFormateada = infancia
                ? infancia(data)
                : placeholderCatalogo('infancia', data);
        }
        else if (edad >= 12 && edad < 18) {
            catalogoUsado = 'adolescencia';
            admisionFormateada = adolescencia
                ? adolescencia(data)
                : placeholderCatalogo('adolescencia', data);
        }
        else if (edad >= 18 && edad < 29) {
            catalogoUsado = 'juventud';
            admisionFormateada = juventud
                ? juventud(data)
                : placeholderCatalogo('juventud', data);
        }
        else if (edad >= 29 && edad < 60) {
            catalogoUsado = 'adultez';
            admisionFormateada = adultez
                ? adultez(data)
                : placeholderCatalogo('adultez', data);
        }
        else if (edad >= 60) {
            catalogoUsado = 'vejez';
            admisionFormateada = vejez
                ? vejez(data)
                : placeholderCatalogo('vejez', data);
        }
        else {
            return res.status(400).json({
                success: false,
                error: `Edad ${edad} no válida.`,
            });
        }
        // Asegurar campos de género en la raíz
        admisionFormateada.genero = generoTexto;
        admisionFormateada.genero_id = generoId;
        admisionFormateada.sexo_id = sexoId;
        // Asignar hora si no viene
        if (!admisionFormateada.hora_historia) {
            const horaAdmision = data.admision.hora_admision;
            let horaStr = '00:00';
            if (horaAdmision && typeof horaAdmision === 'object' && 'Hours' in horaAdmision) {
                const h = horaAdmision.Hours || 0;
                const m = horaAdmision.Minutes || 0;
                horaStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            }
            else if (typeof horaAdmision === 'string' && horaAdmision.includes(':')) {
                horaStr = horaAdmision.substring(0, 5);
            }
            admisionFormateada.hora_historia = horaStr;
        }
        // ✅ CORREGIDO: Eliminar duplicación de edad_paciente
        return res.status(200).json({
            success: true,
            catalogo: catalogoUsado,
            sexo_id: sexoId,
            genero_id: generoId,
            genero_texto: generoTexto,
            ...admisionFormateada // ← Esto ya incluye edad_paciente
        });
    }
    catch (error) {
        console.error('Error en GeneradorHs:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Error al procesar la admisión',
            message: error.message,
        });
    }
};
exports.GeneradorHs = GeneradorHs;
// ============================================================
// CONTROLADOR PARA DATOS CRUDOS
// ============================================================
const getAdmissionRaw = async (req, res) => {
    try {
        const numeroAdmision = req.params?.numeroAdmision ??
            req.body?.numeroAdmision ??
            req.query?.numeroAdmision;
        if (!numeroAdmision) {
            return res.status(400).json({
                success: false,
                error: 'Debe proporcionar el parámetro "numeroAdmision".',
            });
        }
        const resultado = await (0, buscarIdAdmision_1.obtenerDatosAdmisionEnriquecidos)(numeroAdmision, 'admision');
        return res.status(200).json({
            success: true,
            admision: resultado.data,
        });
    }
    catch (error) {
        console.error('Error en getAdmissionRaw:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Error interno en el servidor.',
            message: error.message,
        });
    }
};
exports.getAdmissionRaw = getAdmissionRaw;
