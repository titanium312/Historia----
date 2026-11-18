import { Router } from 'express';
import { buscarIdAdmision } from './buscador/1-buscarIdAdmision';
import { buscarDatosAdmision } from './buscador/2-buscarDatosAdmision';
import { FacturasBuscar } from './buscador/3-FacturasBuscar';
import { buscarFacturaSelectUsuarios } from './buscador/4-Profecionales';
import { routerFacturacionLIsta } from './buscador/Array/routerFacturacionLIsta';


import { CombinarConsulta  } from './buscador/10-CombinarConsulta';
import { armarJson  } from './Subir/ArmarJson';
import { Subir  } from './Subir/Subir';

const routerFacturacion = Router();

routerFacturacion.post('/buscarIdAdmision', buscarIdAdmision);
routerFacturacion.post('/buscarDatosAdmision', buscarDatosAdmision);
routerFacturacion.post('/FacturasBuscar', FacturasBuscar);
routerFacturacion.post('/buscarFacturaSelectUsuarios', buscarFacturaSelectUsuarios);

routerFacturacion.use('/', routerFacturacionLIsta);




routerFacturacion.post('/CombinarConsulta', CombinarConsulta );
routerFacturacion.post('/armarJson', armarJson );
routerFacturacion.post('/Subir', Subir );


export default routerFacturacion;