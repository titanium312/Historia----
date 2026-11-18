// src/buscador/Array/Facturacion/routerFacturacionLista.ts
import { Router } from 'express';
import * as C from './listas.controller';
import { listarViasIngreso } from './viasIngreso';


const routerFacturacion = Router();




/**
 * GET /Listas/Consultas
 */
routerFacturacion.get('/Listas/viasIngreso', listarViasIngreso);


/**
 * GET /Listas/Consultas
 */
routerFacturacion.get('/Listas/Consultas', C.consultasController);

/**
 * GET /Listas/Actividades
 */
routerFacturacion.get('/Listas/Actividades', C.actividadesController);

/**
 * GET /Listas/Finalidades
 * Acepta query opcional: ?idActividad=10
 */
routerFacturacion.get('/Listas/Finalidades', C.finalidadesController);

/**
 * GET /Listas/CentrosServicios
 */
routerFacturacion.get('/Listas/CentrosServicios', C.centrosServiciosController);

/**
 * GET /Listas/Servicios
 */
routerFacturacion.get('/Listas/Servicios', C.serviciosController);

/**
 * GET /Listas/ModalidadesAtencion
 */
routerFacturacion.get('/Listas/ModalidadesAtencion', C.modalidadesAtencionController);

/**
 * GET /Listas/CausasExternas
 */
routerFacturacion.get('/Listas/CausasExternas', C.causasExternasController);

/**
 * GET /Listas/TiposDiagnostico
 */
routerFacturacion.get('/Listas/TiposDiagnostico', C.tiposDiagnosticoController);

/**
 * GET /Listas/Usuarios
 */
routerFacturacion.get('/Listas/Usuarios', C.usuariosController);

/**
 * GET /Listas/Consultorios
 */
routerFacturacion.get('/Listas/Consultorios', C.consultoriosController);

/**
 * GET /Listas/Todas
 * Devuelve todas las listas juntas en un solo objeto
 */
routerFacturacion.get('/Listas/Todas', C.todasController);

export default routerFacturacion;