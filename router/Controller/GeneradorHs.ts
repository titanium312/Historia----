// ============================================================
// TIPOS Y DEFINICIONES
// ============================================================

import { Request, Response } from 'express';
import { obtenerDatosAdmisionEnriquecidos, AdmisionDataEnriquecida } from './buscador/buscarIdAdmision';

// ---------- Tipo para las funciones de catálogo ----------
type CatalogoFunc = (data: AdmisionDataEnriquecida) => AdmisionFormateada;

// ---------- Tipo para el objeto que se envía ----------
interface AdmisionFormateada {
    mensaje?: string;
    tipo_catalogo?: string;
    edad_paciente: number;
    genero: string;
    genero_id?: number | null;
    sexo_id?: number | null;
    id_historia: number;
    numero_historia: number;
    fk_admision: number;
    numero_admision: number;
    fk_paciente: number;
    fecha_registro: string;
    estado: string;
    hora_historia?: string;
    [key: string]: any;
}

// ============================================================
// IMPORTACIÓN DINÁMICA DE CATÁLOGOS
// ============================================================

let primeraInfancia: CatalogoFunc | null = null;
let infancia: CatalogoFunc | null = null;
let adolescencia: CatalogoFunc | null = null;
let juventud: CatalogoFunc | null = null;
let adultez: CatalogoFunc | null = null;
let vejez: CatalogoFunc | null = null;

function extraerFuncionDelModulo(mod: any): CatalogoFunc | null {
    if (typeof mod === 'function') return mod;
    if (mod && typeof mod === 'object') {
        for (const key of Object.keys(mod)) {
            if (typeof mod[key] === 'function') {
                return mod[key];
            }
        }
    }
    return null;
}

async function cargarCatalogos(): Promise<void> {
    try {
        const modPrimeraInfancia = await import('./catalogos/primeraInfancia');
        primeraInfancia = extraerFuncionDelModulo(modPrimeraInfancia);
    } catch (e) {
        console.warn('⚠️ No se pudo importar catálogo primeraInfancia:', (e as Error).message);
    }
    try {
        const modInfancia = await import('./catalogos/infancia');
        infancia = extraerFuncionDelModulo(modInfancia);
    } catch (e) {
        console.warn('⚠️ No se pudo importar catálogo infancia:', (e as Error).message);
    }
    try {
        const modAdolescencia = await import('./catalogos/adolescencia');
        adolescencia = extraerFuncionDelModulo(modAdolescencia);
    } catch (e) {
        console.warn('⚠️ No se pudo importar catálogo adolescencia:', (e as Error).message);
    }
    try {
        const modJuventud = await import('./catalogos/juventud');
        juventud = extraerFuncionDelModulo(modJuventud);
    } catch (e) {
        console.warn('⚠️ No se pudo importar catálogo juventud:', (e as Error).message);
    }
    try {
        const modAdultez = await import('./catalogos/adultez');
        adultez = extraerFuncionDelModulo(modAdultez);
    } catch (e) {
        console.warn('⚠️ No se pudo importar catálogo adultez:', (e as Error).message);
    }
    try {
        const modVejez = await import('./catalogos/vejez');
        vejez = extraerFuncionDelModulo(modVejez);
    } catch (e) {
        console.warn('⚠️ No se pudo importar catálogo vejez:', (e as Error).message);
    }
}

(async () => {
    await cargarCatalogos();
})();

// ============================================================
// PLACEHOLDER PARA CATÁLOGOS FALTANTES
// ============================================================

function placeholderCatalogo(tipo: string, data: AdmisionDataEnriquecida): AdmisionFormateada {
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

function parsearFechaAdmision(fechaInput: any): string {
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

export const GeneradorHs = async (req: Request, res: Response): Promise<Response> => {
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
        const resultado = await obtenerDatosAdmisionEnriquecidos(numAdmisionStr, 'admision');
        const data: AdmisionDataEnriquecida = resultado.data;

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
        let admisionFormateada: AdmisionFormateada;
        let catalogoUsado = '';

        if (edad < 6) {
            catalogoUsado = 'primeraInfancia';
            admisionFormateada = primeraInfancia
                ? primeraInfancia(data)
                : placeholderCatalogo('primeraInfancia', data);
        } else if (edad >= 6 && edad < 12) {
            catalogoUsado = 'infancia';
            admisionFormateada = infancia
                ? infancia(data)
                : placeholderCatalogo('infancia', data);
        } else if (edad >= 12 && edad < 18) {
            catalogoUsado = 'adolescencia';
            admisionFormateada = adolescencia
                ? adolescencia(data)
                : placeholderCatalogo('adolescencia', data);
        } else if (edad >= 18 && edad < 29) {
            catalogoUsado = 'juventud';
            admisionFormateada = juventud
                ? juventud(data)
                : placeholderCatalogo('juventud', data);
        } else if (edad >= 29 && edad < 60) {
            catalogoUsado = 'adultez';
            admisionFormateada = adultez
                ? adultez(data)
                : placeholderCatalogo('adultez', data);
        } else if (edad >= 60) {
            catalogoUsado = 'vejez';
            admisionFormateada = vejez
                ? vejez(data)
                : placeholderCatalogo('vejez', data);
        } else {
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
                const h = (horaAdmision as { Hours: number; Minutes: number }).Hours || 0;
                const m = (horaAdmision as { Hours: number; Minutes: number }).Minutes || 0;
                horaStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            } else if (typeof horaAdmision === 'string' && horaAdmision.includes(':')) {
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
            ...admisionFormateada  // ← Esto ya incluye edad_paciente
        });

    } catch (error) {
        console.error('Error en GeneradorHs:', (error as Error).message);
        return res.status(500).json({
            success: false,
            error: 'Error al procesar la admisión',
            message: (error as Error).message,
        });
    }
};

// ============================================================
// CONTROLADOR PARA DATOS CRUDOS
// ============================================================

export const getAdmissionRaw = async (req: Request, res: Response): Promise<Response> => {
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

        const resultado = await obtenerDatosAdmisionEnriquecidos(numeroAdmision, 'admision');
        return res.status(200).json({
            success: true,
            admision: resultado.data,
        });
    } catch (error) {
        console.error('Error en getAdmissionRaw:', (error as Error).message);
        return res.status(500).json({
            success: false,
            error: 'Error interno en el servidor.',
            message: (error as Error).message,
        });
    }
};