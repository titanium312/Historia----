"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = subirdirecto;
const axios_1 = __importDefault(require("axios"));
const GeneradorHs_1 = require("./GeneradorHs");
// ============================================
// CONTROLADOR SIMPLIFICADO - SOLO RECIBE numeroAdmision y token
// ============================================
async function subirdirecto(req, res) {
    try {
        const { token, numeroAdmision } = req.body;
        // ============================================
        // VALIDACIONES BÁSICAS
        // ============================================
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token de autenticación requerido'
            });
        }
        if (!numeroAdmision) {
            return res.status(400).json({
                success: false,
                error: 'Número de admisión requerido'
            });
        }
        console.log(`[subirdirecto] 📥 Procesando admisión: ${numeroAdmision}`);
        // ============================================
        // GENERAR JSON USANDO GeneradorHs
        // ============================================
        let jsonGenerado = null;
        let statusCode = 200;
        // Crear un mock de Response para capturar el JSON
        const mockRes = {
            status: (code) => {
                statusCode = code;
                return mockRes;
            },
            json: (data) => {
                jsonGenerado = data;
                return data;
            }
        };
        // Ejecutar GeneradorHs con los parámetros
        await (0, GeneradorHs_1.GeneradorHs)(req, mockRes);
        // Verificar si hubo error en la generación
        if (statusCode !== 200 || !jsonGenerado) {
            return res.status(statusCode || 500).json({
                success: false,
                error: 'Error al generar el JSON desde GeneradorHs',
                details: jsonGenerado || 'No se recibió respuesta de GeneradorHs',
                statusCode
            });
        }
        console.log(`[subirdirecto] ✅ JSON generado correctamente`);
        // ============================================
        // LIMPIAR CAMPOS DE WRAPPER
        // ============================================
        const datosParaSaludPlus = { ...jsonGenerado };
        // Eliminar campos de wrapper (no son necesarios para SaludPlus)
        delete datosParaSaludPlus.success;
        delete datosParaSaludPlus.catalogo;
        delete datosParaSaludPlus.sexo_id;
        delete datosParaSaludPlus.genero_id;
        delete datosParaSaludPlus.genero_texto;
        delete datosParaSaludPlus.genero;
        delete datosParaSaludPlus.telefono_paciente;
        delete datosParaSaludPlus.motivo_consulta_consulta_externa;
        delete datosParaSaludPlus.mensaje;
        delete datosParaSaludPlus.tipo_catalogo;
        delete datosParaSaludPlus.edad_paciente;
        delete datosParaSaludPlus.fecha_registro;
        delete datosParaSaludPlus.estado;
        // ============================================
        // ENVIAR A SALUDPLUS
        // ============================================
        const url = 'https://balance.saludplus.co/historiaClinicaUnificada/historiaCompletaEditar?auto=0';
        const headers = {
            'data': token,
        };
        console.log(`[subirdirecto] 📤 Enviando a SaludPlus...`);
        console.log(`[subirdirecto] 📦 ID Historia: ${datosParaSaludPlus.id_historia || '0'}`);
        console.log(`[subirdirecto] 🏥 Admisión: ${datosParaSaludPlus.fk_admision || numeroAdmision}`);
        const responseSaludPlus = await axios_1.default.post(url, datosParaSaludPlus, {
            headers,
            timeout: 60000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });
        // ============================================
        // RESPUESTA
        // ============================================
        const respuesta = responseSaludPlus.data;
        console.log(`[subirdirecto] 📥 Respuesta de SaludPlus:`, respuesta);
        return res.status(200).json({
            success: true,
            jsonEnviado: datosParaSaludPlus,
            respuestaSaludPlus: respuesta
        });
    }
    catch (error) {
        console.error('❌ Error en subirdirecto:', error);
        if (axios_1.default.isAxiosError(error)) {
            const status = error.response?.status || 500;
            const data = error.response?.data;
            // Si es un error HTML
            if (typeof data === 'string' && data.includes('<html>')) {
                const titleMatch = data.match(/<title>(.*?)<\/title>/);
                const errorTitle = titleMatch ? titleMatch[1] : 'Error desconocido';
                return res.status(status).json({
                    success: false,
                    error: 'Error en el servidor de SaludPlus',
                    tipo: 'server_error',
                    titulo: errorTitle,
                    mensaje: `El servidor de SaludPlus retornó un error: ${errorTitle}`,
                    detalles: {
                        status,
                        html: data.substring(0, 500) + '...'
                    }
                });
            }
            return res.status(status).json({
                success: false,
                error: 'Error al comunicarse con SaludPlus',
                mensaje: error.message,
                respuesta: data || null,
                codigo: error.code
            });
        }
        return res.status(500).json({
            success: false,
            error: 'Error interno en subirdirecto',
            mensaje: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
