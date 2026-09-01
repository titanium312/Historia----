"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const path_1 = __importDefault(require("path"));
const router_1 = __importDefault(require("./router/router"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, express_fileupload_1.default)());
// Ruta raíz - sirve html.html (copiado a dist/html/)
app.get('/', (req, res) => {
    const htmlPath = path_1.default.join(__dirname, 'html', 'html.html');
    res.sendFile(htmlPath, (err) => {
        if (err) {
            console.error('Error al enviar html.html:', err);
            res.status(404).send('Archivo html.html no encontrado');
        }
    });
});
// Ruta /Tupapa - sirve subir.html
app.get('/Tupapa', (req, res) => {
    const htmlPath = path_1.default.join(__dirname, 'html', 'subir.html');
    res.sendFile(htmlPath, (err) => {
        if (err) {
            console.error('Error al enviar subir.html:', err);
            res.status(404).send('Archivo subir.html no encontrado');
        }
    });
});
// Rutas de la API
app.use('/', router_1.default);
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`🚀 Marter en http://localhost:${PORT}/Tupapa`);
});
