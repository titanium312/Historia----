// routerFacturacionLIsta.ts
import { Router } from 'express';
import routerFacturacion from './Facturacion/routerFacturacionLista';

const routerFacturacionLIsta = Router();



routerFacturacionLIsta.use('/', routerFacturacion);

export { routerFacturacionLIsta };  // ← Export NOMBRADO