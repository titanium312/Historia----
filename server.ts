import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fileUpload from 'express-fileupload';
import path from 'path';
import router from './router/router';

dotenv.config();

const app: Application = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());

// Ruta raíz - sirve html.html (copiado a dist/html/)
app.get('/', (req, res) => {
  const htmlPath = path.join(__dirname, 'html', 'html.html');
  res.sendFile(htmlPath, (err) => {
    if (err) {
      console.error('Error al enviar html.html:', err);
      res.status(404).send('Archivo html.html no encontrado');
    }
  });
});

// Ruta /Tupapa - sirve subir.html
app.get('/Tupapa', (req, res) => {
  const htmlPath = path.join(__dirname, 'html', 'subir.html');
  res.sendFile(htmlPath, (err) => {
    if (err) {
      console.error('Error al enviar subir.html:', err);
      res.status(404).send('Archivo subir.html no encontrado');
    }
  });
});

// Rutas de la API
app.use('/', router);

const PORT: number = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🚀 Marter en http://localhost:${PORT}/Tupapa`);
});