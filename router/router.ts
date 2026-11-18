import { Router } from 'express';

import routerFacturacion from './Facturacion/routerFacturacion';

import { buscar202 } from './Controller/buscador/buscar202';
import { buscarAdmisionMiddleware } from './Controller/buscador/buscarIdAdmision';
import { ConsultaIdFacturaController } from './Controller/miherramienta/ConsultaIdFactura';
import subirdirecto from './Controller/subirdirecto';
import { buscarAdmision } from './Controller/miherramienta/Buscardor';

const routerHistoria = Router();

// ── Rutas propias ──
routerHistoria.post('/buscar', buscarAdmisionMiddleware);
routerHistoria.get('/buscar202', buscar202);
routerHistoria.post('/subirdirecto', subirdirecto);
routerHistoria.post('/buscarAdmision', buscarAdmision);
routerHistoria.get('/ConsultaIdFactura', ConsultaIdFacturaController);

// ── Router de facturación montado como sub-ruta ──
routerHistoria.use('/facturacion', routerFacturacion);

export default routerHistoria;