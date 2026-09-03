"use strict";
// src/buscador/buscarIdAdmision.ts
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdmissionRaw = exports.buscarAdmisionMiddleware = void 0;
exports.obtenerDatosAdmisionEnriquecidos = obtenerDatosAdmisionEnriquecidos;
const axios_1 = __importDefault(require("axios"));
const querystring = __importStar(require("querystring"));
const ripsMapper_1 = require("../utils/ripsMapper");
const dateUtils_1 = require("../utils/dateUtils");
// ============================================================
// CONFIGURACIÓN (COPIADA DEL CONTROLADOR FUNCIONAL)
// ============================================================
// Token JWT para el header Authorization (el que funciona)
const TOKEN_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IlJiYXJyZXRvIiwianRpIjoiYTY2NWRkYjItOGJkMi00MzI5LWI2MGUtMDUwOWMzNWU0MDQyIiwidXNlcm5hbWUiOiJSYmFycmV0byIsImVtYWlsIjoicmIucm9iZXJ0by5iYXJyZXRvQGdtYWlsLmNvbSIsImFkbWluIjoiTiIsInVzZXJpZCI6IjY4NzQiLCJpbnN0aXR1dGlvbiI6IjIwIiwicGFnb3MiOiIwIiwidmVyc2lvbiI6IjEuMC4wLjAiLCJlbnZpcm9ubWVudCI6IlByb2R1Y3Rpb24iLCJleHAiOjE3ODc4NjM1MzUsImlzcyI6InRlZ2V0dC5sb2dpbiIsImF1ZCI6InRlZ2V0dC5jb20ifQ.HGY52TK4wxrlTWVW9ELlybd7eN0blAQOMs5XsDu8jk4';
// Token para el header 'data' (el que funciona en el cURL)
const TOKEN_DATA = 'RyYCH1Lu3RaWjAwjq79h9YnHmVGtZiiHoILsunKhJgM=.1SS9/UCeyjpq9PyT8MBqPg==.wcFkBNOeMUO3EbN8I4nUXw==';
// Cookies (copiadas del cURL exitoso)
const COOKIES = [
    { name: '_ga', value: 'GA1.1.433661464.1772468883' },
    { name: 'twk_uuid_61e04197b84f7301d32ada9f', value: '%7B%22uuid%22%3A%221.Sx13ycH3BdSXIYC93nkLL7P8utiEspFsyRC6v3rFzyv77ldcjYzsfqXuaTaW6tP7MyONDncUjmMd30TSB8c9Dla5OxkxxYcDd40zCfLeLMuU9OX5R5TLE%22%2C%22version%22%3A3%2C%22domain%22%3A%22saludplus.co%22%2C%22ts%22%3A1773241450106%7D' },
    { name: '_clck', value: '2l4g58%5E2%5Eg8y%5E0%5E2252' },
    { name: '_ga_581YHK4S33', value: 'GS2.1.s1787861733%60o211%60g1%60t1787863517%60j59%60l0%60h0' },
    { name: '_clsk', value: '1htcdy1%5E1787863517441%5E8%5E1%5En.clarity.ms%2Fcollect' },
];
const API_BASE_URL = process.env.API_BASE_URL || 'https://balance.saludplus.co';
const FECHA_LIMITE = new Date(2025, 0, 1); // 2025-01-01
// ============================================================
// FUNCIÓN QUE CONSULTA LA API EXTERNA (COPIADA)
// ============================================================
async function peticionConFechas(valorBusqueda, fechaInicial, fechaFinal) {
    // Formato de fecha esperado por la API: MM/DD/YYYY
    const iniStr = `${(fechaInicial.getMonth() + 1).toString().padStart(2, '0')}/${fechaInicial.getDate().toString().padStart(2, '0')}/${fechaInicial.getFullYear()}`;
    const finStr = `${(fechaFinal.getMonth() + 1).toString().padStart(2, '0')}/${fechaFinal.getDate().toString().padStart(2, '0')}/${fechaFinal.getFullYear()}`;
    const bodyParams = {
        sEcho: '2',
        iColumns: '8',
        sColumns: ',CODIGO,DOCUMENTO,NOMBRE,Entidad,FECHA,HORA,ESTADO',
        iDisplayStart: '0',
        iDisplayLength: '10',
        mDataProp_0: '0',
        mDataProp_1: '1',
        mDataProp_2: '2',
        mDataProp_3: '3',
        mDataProp_4: '4',
        mDataProp_5: '5',
        mDataProp_6: '6',
        mDataProp_7: '7',
        sSearch: valorBusqueda,
        bRegex: 'false',
        sSearch_0: '',
        bRegex_0: 'false',
        bSearchable_0: 'true',
        sSearch_1: '',
        bRegex_1: 'false',
        bSearchable_1: 'false',
        sSearch_2: '',
        bRegex_2: 'false',
        bSearchable_2: 'false',
        sSearch_3: '',
        bRegex_3: 'false',
        bSearchable_3: 'false',
        sSearch_4: '',
        bRegex_4: 'false',
        bSearchable_4: 'false',
        sSearch_5: '',
        bRegex_5: 'false',
        bSearchable_5: 'false',
        sSearch_6: '',
        bRegex_6: 'false',
        bSearchable_6: 'false',
        sSearch_7: '',
        bRegex_7: 'false',
        bSearchable_7: 'false',
        iSortingCols: '1',
        iSortCol_0: '0',
        sSortDir_0: 'asc',
        bSortable_0: 'true',
        bSortable_1: 'false',
        bSortable_2: 'false',
        bSortable_3: 'false',
        bSortable_4: 'false',
        bSortable_5: 'false',
        bSortable_6: 'false',
        bSortable_7: 'false',
    };
    const encodedBody = querystring.stringify(bodyParams);
    const cookieString = COOKIES.map(c => `${c.name}=${c.value}`).join('; ');
    const url = `${API_BASE_URL}/admisiones/BucardorAdmisionesDatos?fechaInicial=${encodeURIComponent(iniStr)}&fechaFinal=${encodeURIComponent(finStr)}&idRecurso=0&SinCargo=False&idServicioIngreso=3&idCaracteristica=0&validarSede=True`;
    try {
        const response = await axios_1.default.post(url, encodedBody, {
            headers: {
                'authority': 'balance.saludplus.co',
                'accept': 'application/json, text/javascript, */*; q=0.01',
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept-language': 'es-419,es;q=0.9,en;q=0.8',
                'authorization': `Bearer ${TOKEN_JWT}`,
                'content-type': 'application/x-www-form-urlencoded',
                'cookie': cookieString,
                'data': TOKEN_DATA,
                'origin': 'https://balance.saludplus.co',
                'priority': 'u=1, i',
                'referer': 'https://balance.saludplus.co/instituciones/?origen=1&theme=false&time=1787863516036',
                'sec-ch-ua': '"Not=A?Brand";v="99", "Google Chrome";v="151", "Chromium";v="151"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36',
                'x-requested-with': 'XMLHttpRequest',
            },
        });
        return response.data?.aaData || [];
    }
    catch (error) {
        console.warn(`❌ Error en peticiónConFechas (${iniStr} - ${finStr}):`, error.message);
        return [];
    }
}
// ============================================================
// BÚSQUEDA CON RETROCESO DE FECHAS (COPIADA DEL CONTROLADOR FUNCIONAL)
// ============================================================
async function consultarBuscadorExterno(valorBusqueda, tipoBusqueda) {
    const busquedaStr = String(valorBusqueda).trim();
    if (!busquedaStr) {
        throw new Error('El campo "valorBusqueda" es requerido');
    }
    const hoy = new Date();
    let fin = new Date(hoy);
    let ini = new Date(hoy);
    ini.setMonth(ini.getMonth() - 6);
    let todosLosRegistros = [];
    let intentos = 0;
    const MAX_INTENTOS = 30;
    while (intentos < MAX_INTENTOS) {
        console.log(`🔍 Buscando "${busquedaStr}" en rango: ${ini.toLocaleDateString()} - ${fin.toLocaleDateString()}`);
        const registros = await peticionConFechas(busquedaStr, ini, fin);
        if (registros.length > 0) {
            // Buscar el registro que coincida exactamente con el tipo de búsqueda
            let encontrado;
            const busquedaNumerica = busquedaStr.replace(/\D/g, '');
            if (tipoBusqueda === 'admision') {
                encontrado = registros.find(fila => {
                    const numAdm = String(fila[1] || '').split(/\s+/)[0];
                    return numAdm === busquedaStr;
                });
            }
            else if (tipoBusqueda === 'documento') {
                encontrado = registros.find(fila => {
                    const doc = String(fila[2] || '').replace(/\D/g, '');
                    return doc === busquedaNumerica;
                });
            }
            else {
                // Buscar en ambas columnas
                encontrado = registros.find(fila => {
                    const numAdm = String(fila[1] || '').split(/\s+/)[0];
                    const doc = String(fila[2] || '').replace(/\D/g, '');
                    return numAdm === busquedaStr || doc === busquedaNumerica;
                });
            }
            if (encontrado) {
                return encontrado;
            }
            // Si no encontró coincidencia exacta, guardar todos para luego filtrar
            todosLosRegistros = todosLosRegistros.concat(registros);
        }
        // Retroceder 6 meses
        const nuevoFin = new Date(ini);
        const nuevoIni = new Date(ini);
        nuevoIni.setMonth(nuevoIni.getMonth() - 6);
        // Si el nuevo inicio es anterior a la fecha límite, hacemos un último intento hasta la límite
        if (nuevoIni < FECHA_LIMITE) {
            if (nuevoFin >= FECHA_LIMITE) {
                const ultimoIni = new Date(FECHA_LIMITE);
                console.log(`📅 Último intento hasta límite: ${ultimoIni.toLocaleDateString()} - ${nuevoFin.toLocaleDateString()}`);
                const ultimosRegistros = await peticionConFechas(busquedaStr, ultimoIni, nuevoFin);
                if (ultimosRegistros.length > 0) {
                    todosLosRegistros = todosLosRegistros.concat(ultimosRegistros);
                }
            }
            break;
        }
        ini = nuevoIni;
        fin = nuevoFin;
        intentos++;
    }
    // Si no se encontró coincidencia exacta, buscar en todos los registros acumulados
    if (todosLosRegistros.length === 0) {
        throw new Error(`No se encontraron registros para "${valorBusqueda}" después de varios rangos de fechas.`);
    }
    // Eliminar duplicados (por si el mismo registro aparece en varios rangos)
    const registrosUnicos = Array.from(new Map(todosLosRegistros.map(item => [item[0], item])).values());
    // Buscar el mejor candidato en los acumulados
    const busquedaNumerica = busquedaStr.replace(/\D/g, '');
    let mejorCandidato;
    if (tipoBusqueda === 'admision') {
        mejorCandidato = registrosUnicos.find(fila => {
            const numAdm = String(fila[1] || '').split(/\s+/)[0];
            return numAdm === busquedaStr;
        });
    }
    else if (tipoBusqueda === 'documento') {
        mejorCandidato = registrosUnicos.find(fila => {
            const doc = String(fila[2] || '').replace(/\D/g, '');
            return doc === busquedaNumerica;
        });
    }
    else {
        mejorCandidato = registrosUnicos.find(fila => {
            const numAdm = String(fila[1] || '').split(/\s+/)[0];
            const doc = String(fila[2] || '').replace(/\D/g, '');
            return numAdm === busquedaStr || doc === busquedaNumerica;
        });
    }
    if (!mejorCandidato) {
        // Si no hay coincidencia exacta, devolver el primero
        mejorCandidato = registrosUnicos[0];
    }
    return mejorCandidato;
}
// ============================================================
// FUNCIÓN PRINCIPAL EXPORTADA (SIN CAMBIOS)
// ============================================================
async function obtenerDatosAdmisionEnriquecidos(valorBusqueda, tipoBusqueda = 'admision') {
    if (!valorBusqueda) {
        throw new Error('El número de admisión o documento es requerido');
    }
    // 1. Obtener ID de admisión
    let idAdmision;
    try {
        const filaRegistro = await consultarBuscadorExterno(valorBusqueda, tipoBusqueda);
        const idStr = filaRegistro[0];
        if (idStr === undefined || idStr === null || isNaN(Number(idStr))) {
            throw new Error('El ID de admisión recuperado no tiene un formato válido.');
        }
        idAdmision = Number(idStr);
        console.log(`✅ Admisión encontrada con ID: ${idAdmision}`);
    }
    catch (e) {
        const error = e;
        console.error('Error en la fase de búsqueda:', error.message);
        throw new Error(`No se pudo localizar la admisión: ${error.message}`);
    }
    // 2. Obtener detalles de la API
    const urlDetalles = `${API_BASE_URL}/admisiones/AdmisionBuscarConAscendientes?idAdmision=${idAdmision}`;
    let detalles;
    try {
        const resp = await axios_1.default.get(urlDetalles, {
            headers: { data: TOKEN_DATA },
        });
        if (!resp.data || typeof resp.data !== 'object') {
            throw new Error('La API de detalles devolvió una respuesta vacía o inválida.');
        }
        detalles = {
            admision: resp.data.admision || {},
            paciente: resp.data.paciente || {},
            entidad: resp.data.entidad || {},
            historia: resp.data.historia || {},
        };
        console.log('✅ Detalles obtenidos correctamente');
    }
    catch (e) {
        const error = e;
        console.error('Error al invocar API de detalles:', error.message);
        throw new Error(`Error de comunicación con el servidor externo de historias clínicas: ${error.message}`);
    }
    const admision = detalles.admision;
    const paciente = detalles.paciente;
    const entidad = detalles.entidad;
    const historia = detalles.historia;
    const primeraFactura = admision.facturas?.length ? admision.facturas[0] : {};
    const primeraConsulta = primeraFactura.facturas_consultas?.length ? primeraFactura.facturas_consultas[0] : {};
    // 3. Calcular sexo y género
    const sexoNombre = obtenerNombreSexo(paciente.fk_sexo);
    const generoNombre = paciente.Genero ?? sexoNombre;
    const generoId = obtenerIdGenero(generoNombre);
    const pacienteConGenero = {
        ...paciente,
        sexo: paciente.fk_sexo ?? null,
        sexo_nombre: sexoNombre,
        genero: generoNombre,
        genero_id: generoId,
    };
    // 4. Calcular edad
    const edad = (0, dateUtils_1.calcularEdad)(paciente.fecha_nacimiento);
    // 5. Obtener datos clínicos del RIPS
    let datosClinicos = null;
    if (paciente.documento_paciente) {
        try {
            const clinicosArray = (0, ripsMapper_1.filtrarYMapgearRips)(paciente.documento_paciente);
            if (clinicosArray && clinicosArray.length > 0) {
                datosClinicos = clinicosArray[0];
            }
        }
        catch (error) {
            console.warn('No se pudieron obtener datos clínicos del RIPS:', error);
        }
    }
    // 6. Construir objeto enriquecido
    return {
        data: {
            admision: {
                id_admision: admision.id_admision ?? null,
                numero_admision: admision.numero_admision ?? null,
                fecha_admision: admision.fecha_admision ?? null,
                hora_admision: admision.hora_admision ?? null,
                fk_institucion: admision.fk_institucion ?? null,
                id_contrato_entidad: admision.fk_contrato_entidad ?? null,
                fk_usuario_admision: admision.fk_usuario ?? null,
                nombre_acompanante: admision.nombre_acompanante ?? null,
                telefono_acompanante: admision.telefono_acompanante ?? null,
                nombre_responsable: admision.nombre_responsable ?? null,
                parentesco_responsable: admision.parentesco_responsable ?? null,
                telefono_responsable: admision.telefono_responsable ?? null,
            },
            paciente: {
                id_paciente: pacienteConGenero.id_paciente ?? null,
                documento_paciente: pacienteConGenero.documento_paciente ?? null,
                tipo_documento: pacienteConGenero.tipo_documento_Paciente ?? null,
                nombres: `${pacienteConGenero.nombre1_paciente || ''} ${pacienteConGenero.nombre2_paciente || ''}`.trim() ||
                    null,
                apellidos: `${pacienteConGenero.apellido1_paciente || ''} ${pacienteConGenero.apellido2_paciente || ''}`.trim() ||
                    null,
                fecha_nacimiento: pacienteConGenero.fecha_nacimiento ?? null,
                telefono: pacienteConGenero.telefono_paciente ?? null,
                direccion: pacienteConGenero.direccion_paciente ?? null,
                sexo: pacienteConGenero.sexo,
                sexo_nombre: pacienteConGenero.sexo_nombre,
                genero: pacienteConGenero.genero,
                genero_id: pacienteConGenero.genero_id,
            },
            entidad: {
                id_entidad: entidad.id_entidad ?? null,
                nombre_entidad: entidad.nombre_entidad ?? null,
                nit: entidad.nit_entidad ?? null,
            },
            historia: {
                id_historia: historia.id_historia ?? null,
                numero_historia: historia.numero_historia ?? null,
                fk_usuario_historia: historia.fk_usuario ?? null,
            },
            facturacion: {
                id_factura: primeraFactura.id_factura ?? null,
                numero_factura: primeraFactura.numero_factura ?? null,
                id_factura_consultas: primeraConsulta.id_factura_consultas ?? null,
            },
            edad: edad,
            sexoId: paciente.fk_sexo ?? 0,
            generoId: generoId ?? 0,
            generoTexto: generoNombre,
            datosClinicos: datosClinicos,
        },
    };
}
// ============================================================
// MAPEO DE SEXOS Y GÉNERO (sin cambios)
// ============================================================
const MAPA_SEXO = {
    1: 'FEMENINO',
    2: 'MASCULINO',
    3: 'INDEFINIDO',
};
function obtenerNombreSexo(fk_sexo) {
    if (fk_sexo === null || fk_sexo === undefined)
        return 'No especificado';
    return MAPA_SEXO[fk_sexo] || 'No especificado';
}
const GENERO_ID_MAP = {
    'FEMENINO': 1,
    'MASCULINO': 2,
    'INDEFINIDO': null,
    'No especificado': null,
};
function obtenerIdGenero(sexoNombre) {
    return GENERO_ID_MAP[sexoNombre] ?? null;
}
// ============================================================
// MIDDLEWARE PARA BÚSQUEDA (solo por número de admisión)
// ============================================================
const buscarAdmisionMiddleware = async (req, res) => {
    try {
        const documento = req.body?.documento ?? req.query?.documento;
        const numeroAdmision = req.body?.numeroAdmision ?? req.query?.numeroAdmision;
        if (!numeroAdmision) {
            res.status(400).json({
                success: false,
                error: 'Debe proporcionar el parámetro "numeroAdmision"',
            });
            return;
        }
        const valor = numeroAdmision.toString().trim();
        if (!valor) {
            res.status(400).json({
                success: false,
                error: 'El número de admisión no puede estar vacío',
            });
            return;
        }
        const resultado = await obtenerDatosAdmisionEnriquecidos(valor, 'admision');
        res.status(200).json({
            success: true,
            data: resultado.data,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            const mensaje = error.message;
            if (mensaje.includes('No se encontraron registros') || mensaje.includes('No se halló una coincidencia')) {
                res.status(404).json({
                    success: false,
                    error: 'No se encontró la admisión',
                    message: mensaje,
                });
                return;
            }
            if (mensaje.includes('Error de comunicación') || mensaje.includes('Error al invocar API')) {
                res.status(503).json({
                    success: false,
                    error: 'Servicio externo no disponible',
                    message: mensaje,
                });
                return;
            }
            if (mensaje.includes('requerido') || mensaje.includes('válido') || mensaje.includes('inválida')) {
                res.status(400).json({
                    success: false,
                    error: 'Solicitud inválida',
                    message: mensaje,
                });
                return;
            }
        }
        console.error('Error crítico no controlado en buscarAdmision:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno de servidor',
            message: error instanceof Error ? error.message : 'Error desconocido',
        });
    }
};
exports.buscarAdmisionMiddleware = buscarAdmisionMiddleware;
// ============================================================
// CONTROLADOR PARA DATOS CRUDOS (solo admisión)
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
        const resultado = await obtenerDatosAdmisionEnriquecidos(numeroAdmision, 'admision');
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
