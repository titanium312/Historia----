import { Router } from 'express';
import { GeneradorHs } from './Controller/GeneradorHs';
import { buscar202 } from './Controller/buscador/buscar202';
import { buscarAdmisionMiddleware } from './Controller/buscador/buscarIdAdmision';

// ✅ CORREGIDO: Importar con default (sin llaves)
import subirdirecto from './Controller/subirdirecto';

import { buscarAdmision } from './Controller/miherramienta/Buscardor';

const routerHistoria = Router();

routerHistoria.post('/GeneradorHs', GeneradorHs);
routerHistoria.post('/buscar', buscarAdmisionMiddleware);
routerHistoria.get('/buscar202', buscar202);
routerHistoria.post('/subirdirecto', subirdirecto);
routerHistoria.post('/buscarAdmision', buscarAdmision);

export default routerHistoria;