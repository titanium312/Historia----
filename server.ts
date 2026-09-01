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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../html/html.html'));
});

app.get('/Tupapa', (req, res) => {
  res.sendFile(path.join(__dirname, '../html/subir.html'));
});


// Rutas de la API
app.use('/', router);

const PORT: number = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🚀 marter en http://localhost:${PORT}/Tupapa-<>-`);
});