// controllers/listas.controller.ts

import { Request, Response } from 'express';

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────
interface ConsultaDiagnostico {
  id: string;
  text: string;
}

interface Consulta {
  id: number;
  id_factura_consultas: number;
  IdActividad: number;
  fk_finalida_consulta: string;
  fk_causa_externa: number;
  fk_procedimiento: string;
  fk_procedimiento_soat: string;
  fk_procedimiento_iss: string;
  nombre_soat_procedimiento: string;
  fk_consulta_externa: string;
  fk_cita_asignada: string;
  nombre_procedimiento: string;
  fecha_atencion: string;
  hora_atencion: string;
  autorizacion: string;
  tipo_diagnostico: string;
  cuota_moderadora: string;
  cantidad_consulta: string;
  valor_unitario_consulta: string;
  valor_unitario_cuota_moderadora: string;
  fk_centro_costos: string;
  fk_centro_servicios: string;
  fk_usuario: string;
  fk_consultorio: string;
  valor_consulta: string;
  neto_pagar: string;
  tipo_atencion: string;
  facturar: boolean;
  fk_recurso: string;
  paginacion: string;
  datosSoat: unknown[];
  listaUsuarios: unknown[];
  listaConsultorios: unknown[];
  IdServicio: string;
  IdModalidadAtencion: number;
  consultasDiagnosticosPrincipales: ConsultaDiagnostico[];
  consultasDiagnosticosRelacionales: ConsultaDiagnostico[];
}

interface Actividad {
  id: number;
  text: string;
  EdadInicial: number;
  EdadFinal: number;
  IdSexo: number;
  Morbilidad: boolean;
  Pym: boolean;
  Cronicos: boolean;
  Diagnosticos: boolean;
}

interface Finalidad {
  id: number;
  text: string;
  IdActividad: number;
  IdCausaExterna: number;
  EdadInicial: number;
  EdadFinal: number;
  IdSexo: number;
}

interface ListaItem {
  id: string;
  text: string;
}

// ─────────────────────────────────────────────
// Datos estáticos
// ─────────────────────────────────────────────
const consultas: Consulta[] = [
  {
    id: 0,
    id_factura_consultas: 7187239,
    IdActividad: 10,
    fk_finalida_consulta: '12',
    fk_causa_externa: 38,
    fk_procedimiento: '8440',
    fk_procedimiento_soat: '39145',
    fk_procedimiento_iss: '',
    nombre_soat_procedimiento: '39145 - Consulta de urgencias',
    fk_consulta_externa: '',
    fk_cita_asignada: '',
    nombre_procedimiento: '890701 - CONSULTA DE URGENCIAS POR MEDICINA GENERAL',
    fecha_atencion: '17/11/2026',
    hora_atencion: '12:20',
    autorizacion: '',
    tipo_diagnostico: '1',
    cuota_moderadora: '0',
    cantidad_consulta: '1',
    valor_unitario_consulta: '93500',
    valor_unitario_cuota_moderadora: '0',
    fk_centro_costos: '518',
    fk_centro_servicios: '744',
    fk_usuario: '11369',
    fk_consultorio: '',
    valor_consulta: '93500',
    neto_pagar: '93500',
    tipo_atencion: '0',
    facturar: true,
    fk_recurso: '4',
    paginacion: 'Consulta 1 de 1',
    datosSoat: [],
    listaUsuarios: [],
    listaConsultorios: [],
    IdServicio: '1102',
    IdModalidadAtencion: 1,
    consultasDiagnosticosPrincipales: [{ id: 'R51X', text: 'R51X - CEFALEA' }],
    consultasDiagnosticosRelacionales: []
  }
];

const actividades: Actividad[] = [
  { id: 1,  text: 'PRIMERA INFANCIA', EdadInicial: 8, EdadFinal: 2191, IdSexo: 0, Morbilidad: false, Pym: true,  Cronicos: false, Diagnosticos: true },
  { id: 2,  text: 'INFANCIA', EdadInicial: 2183, EdadFinal: 4383, IdSexo: 0, Morbilidad: false, Pym: true,  Cronicos: false, Diagnosticos: true },
  { id: 3,  text: 'ADOLESCENCIA', EdadInicial: 4375, EdadFinal: 6574, IdSexo: 0, Morbilidad: false, Pym: true,  Cronicos: false, Diagnosticos: true },
  { id: 4,  text: 'JUVENTUD', EdadInicial: 6565, EdadFinal: 10592, IdSexo: 0, Morbilidad: false, Pym: true,  Cronicos: false, Diagnosticos: true },
  { id: 5,  text: 'ADULTEZ', EdadInicial: 10580, EdadFinal: 21915, IdSexo: 0, Morbilidad: false, Pym: true,  Cronicos: false, Diagnosticos: true },
  { id: 6,  text: 'VEJEZ', EdadInicial: 21895, EdadFinal: 54754, IdSexo: 0, Morbilidad: false, Pym: true,  Cronicos: false, Diagnosticos: true },
  { id: 7,  text: 'PRENATAL', EdadInicial: 3650, EdadFinal: 21899, IdSexo: 1, Morbilidad: false, Pym: true,  Cronicos: false, Diagnosticos: true },
  { id: 8,  text: 'SALUD ORAL', EdadInicial: 0, EdadFinal: 54750, IdSexo: 0, Morbilidad: false, Pym: true,  Cronicos: false, Diagnosticos: true },
  { id: 9,  text: 'CRONICOS', EdadInicial: 365, EdadFinal: 54750, IdSexo: 0, Morbilidad: false, Pym: false, Cronicos: true,  Diagnosticos: true },
  { id: 10, text: 'MORBILIDAD', EdadInicial: 0, EdadFinal: 54750, IdSexo: 0, Morbilidad: true,  Pym: false, Cronicos: false, Diagnosticos: false },
  { id: 11, text: 'EVENTO', EdadInicial: 0, EdadFinal: 54750, IdSexo: 0, Morbilidad: true,  Pym: false, Cronicos: false, Diagnosticos: false },
  { id: 12, text: 'PRECONCEPCIONAL', EdadInicial: 3650, EdadFinal: 21899, IdSexo: 1, Morbilidad: false, Pym: true,  Cronicos: false, Diagnosticos: true },
  { id: 13, text: 'RECIEN NACIDO', EdadInicial: 0, EdadFinal: 7, IdSexo: 0, Morbilidad: false, Pym: true,  Cronicos: false, Diagnosticos: true },
  { id: 14, text: 'PUERPERIO', EdadInicial: 3650, EdadFinal: 21899, IdSexo: 1, Morbilidad: false, Pym: true,  Cronicos: false, Diagnosticos: true },
  { id: 16, text: 'LACTANCIA MATERNA MADRE', EdadInicial: 3650, EdadFinal: 21899, IdSexo: 1, Morbilidad: false, Pym: true,  Cronicos: false, Diagnosticos: true },
  { id: 17, text: 'LACTANCIA MATERNA NIÑOS Y NIÑAS', EdadInicial: 0, EdadFinal: 210, IdSexo: 0, Morbilidad: false, Pym: true,  Cronicos: false, Diagnosticos: true },
  { id: 15, text: 'PARTO', EdadInicial: 3650, EdadFinal: 21899, IdSexo: 1, Morbilidad: true,  Pym: true,  Cronicos: false, Diagnosticos: true }
];

const finalidades: Finalidad[] = [
  { id: 20, text: '20 - Promoción y apoyo a la lactancia materna', IdActividad: 16, IdCausaExterna: 40, EdadInicial: 0, EdadFinal: 150, IdSexo: 0 },
  { id: 20, text: '20 - Promoción y apoyo a la lactancia materna', IdActividad: 17, IdCausaExterna: 40, EdadInicial: 0, EdadFinal: 150, IdSexo: 0 },
  { id: 27, text: '27 - Atención para el seguimiento del recién nacido', IdActividad: 13, IdCausaExterna: 42, EdadInicial: 0, EdadFinal: 150, IdSexo: 0 },
  { id: 11, text: '11 - VALORACION INTEGRAL PARA LA PROMOCION Y MANTENIMIENTO', IdActividad: 1, IdCausaExterna: 40, EdadInicial: 0, EdadFinal: 150, IdSexo: 0 },
  { id: 11, text: '11 - VALORACION INTEGRAL PARA LA PROMOCION Y MANTENIMIENTO', IdActividad: 2, IdCausaExterna: 40, EdadInicial: 0, EdadFinal: 150, IdSexo: 0 },
  { id: 11, text: '11 - VALORACION INTEGRAL PARA LA PROMOCION Y MANTENIMIENTO', IdActividad: 3, IdCausaExterna: 40, EdadInicial: 0, EdadFinal: 150, IdSexo: 0 },
  { id: 19, text: '19 - Planificación familiar y anticoncepción', IdActividad: 3, IdCausaExterna: 40, EdadInicial: 0, EdadFinal: 150, IdSexo: 0 },
  { id: 11, text: '11 - VALORACION INTEGRAL PARA LA PROMOCION Y MANTENIMIENTO', IdActividad: 4, IdCausaExterna: 40, EdadInicial: 0, EdadFinal: 150, IdSexo: 0 },
  { id: 19, text: '19 - Planificación familiar y anticoncepción', IdActividad: 4, IdCausaExterna: 40, EdadInicial: 0, EdadFinal: 150, IdSexo: 0 },
  { id: 11, text: '11 - VALORACION INTEGRAL PARA LA PROMOCION Y MANTENIMIENTO', IdActividad: 5, IdCausaExterna: 40, EdadInicial: 0, EdadFinal: 150, IdSexo: 0 },
  { id: 19, text: '19 - Planificación familiar y anticoncepción', IdActividad: 5, IdCausaExterna: 40, EdadInicial: 0, EdadFinal: 150, IdSexo: 0 },
  { id: 11, text: '11 - VALORACION INTEGRAL PARA LA PROMOCION Y MANTENIMIENTO', IdActividad: 6, IdCausaExterna: 40, EdadInicial: 0, EdadFinal: 150, IdSexo: 0 },
  { id: 11, text: '11 - VALORACION INTEGRAL PARA LA PROMOCION Y MANTENIMIENTO', IdActividad: 8, IdCausaExterna: 40, EdadInicial: 0, EdadFinal: 150, IdSexo: 0 },
  { id: 23, text: '23 - Atención para el cuidado prenatal', IdActividad: 7, IdCausaExterna: 42, EdadInicial: 10, EdadFinal: 150, IdSexo: 1 },
  { id: 22, text: '22 - Atención para el cuidado preconcepcional', IdActividad: 12, IdCausaExterna: 42, EdadInicial: 0, EdadFinal: 150, IdSexo: 0 },
  { id: 25, text: '25 - Atención del parto y puerperio', IdActividad: 15, IdCausaExterna: 42, EdadInicial: 0, EdadFinal: 150, IdSexo: 0 },
  { id: 25, text: '25 - Atención del parto y puerperio', IdActividad: 14, IdCausaExterna: 42, EdadInicial: 0, EdadFinal: 150, IdSexo: 0 },
  { id: 12, text: '12 - Detección temprana de enfermedad general', IdActividad: 9, IdCausaExterna: 38, EdadInicial: 0, EdadFinal: 150, IdSexo: 0 },
  { id: 12, text: '12 - Detección temprana de enfermedad general', IdActividad: 10, IdCausaExterna: 38, EdadInicial: 0, EdadFinal: 150, IdSexo: 0 },
  { id: 13, text: '13 - Detección temprana de enfermedad laboral', IdActividad: 10, IdCausaExterna: 39, EdadInicial: 0, EdadFinal: 150, IdSexo: 0 },
  { id: 15, text: '15 - Diagnóstico', IdActividad: 10, IdCausaExterna: 0, EdadInicial: 0, EdadFinal: 150, IdSexo: 0 },
  { id: 16, text: '16 - Tratamiento', IdActividad: 10, IdCausaExterna: 0, EdadInicial: 0, EdadFinal: 150, IdSexo: 0 },
  { id: 17, text: '17 - Rehabilitación', IdActividad: 10, IdCausaExterna: 0, EdadInicial: 0, EdadFinal: 150, IdSexo: 0 },
  { id: 18, text: '18 - Paliación', IdActividad: 10, IdCausaExterna: 0, EdadInicial: 0, EdadFinal: 150, IdSexo: 0 },
  { id: 24, text: '24 - Interrupción Voluntaria del Embarazo', IdActividad: 10, IdCausaExterna: 0, EdadInicial: 10, EdadFinal: 150, IdSexo: 1 },
  { id: 43, text: '43 - Modificación de la estética corporal  (fines estéticos)', IdActividad: 10, IdCausaExterna: 0, EdadInicial: 0, EdadFinal: 150, IdSexo: 0 },
  { id: 44, text: '44 - Otra', IdActividad: 10, IdCausaExterna: 0, EdadInicial: 0, EdadFinal: 150, IdSexo: 0 },
  { id: 12, text: '12 - Detección temprana de enfermedad general', IdActividad: 11, IdCausaExterna: 38, EdadInicial: 0, EdadFinal: 150, IdSexo: 0 },
  { id: 13, text: '13 - Detección temprana de enfermedad laboral', IdActividad: 11, IdCausaExterna: 39, EdadInicial: 0, EdadFinal: 150, IdSexo: 0 },
  { id: 12, text: '12 - Detección temprana de enfermedad general', IdActividad: 18, IdCausaExterna: 40, EdadInicial: 0, EdadFinal: 150, IdSexo: 0 },
  { id: 23, text: '23 - Atención para el cuidado prenatal', IdActividad: 8, IdCausaExterna: 42, EdadInicial: 10, EdadFinal: 150, IdSexo: 1 },
  { id: 15, text: '15 - Diagnóstico', IdActividad: 11, IdCausaExterna: 0, EdadInicial: 0, EdadFinal: 150, IdSexo: 0 },
  { id: 16, text: '16 - Tratamiento', IdActividad: 11, IdCausaExterna: 0, EdadInicial: 0, EdadFinal: 150, IdSexo: 0 },
  { id: 17, text: '17 - Rehabilitación', IdActividad: 11, IdCausaExterna: 0, EdadInicial: 0, EdadFinal: 150, IdSexo: 0 },
  { id: 18, text: '18 - Paliación', IdActividad: 11, IdCausaExterna: 0, EdadInicial: 0, EdadFinal: 150, IdSexo: 0 },
  { id: 43, text: '43 - Modificación de la estética corporal  (fines estéticos)', IdActividad: 11, IdCausaExterna: 0, EdadInicial: 0, EdadFinal: 150, IdSexo: 0 },
  { id: 44, text: '44 - Otra', IdActividad: 11, IdCausaExterna: 0, EdadInicial: 0, EdadFinal: 150, IdSexo: 0 }
];

const centrosServicios: ListaItem[] = [
  { id: '739', text: 'MEDICINA GENERAL' },
  { id: '741', text: 'ODONTOLOGÍA' },
  { id: '744', text: 'CONSULTA DE URGENCIAS' },
  { id: '747', text: 'P Y M' },
  { id: '822', text: 'PSICOLOGIA' }
];

const servicios: ListaItem[] = [
  { id: '201', text: '201 - CIRUGIA DE CABEZA Y CUELLO' },
  { id: '202', text: '202 - CIRUGIA CARDIOVASCULAR' },
  { id: '203', text: '203 - CIRUGIA GENERAL' },
  { id: '204', text: '204 - CIRUGIA GINECOLOGICA' },
  { id: '205', text: '205 - CIRUGIA MAXILOFACIAL' },
  { id: '207', text: '207 - CIRUGIA ORTOPEDICA' },
  { id: '208', text: '208 - CIRUGIA OFTALMOLOGICA' },
  { id: '209', text: '209 - CIRUGIA OTORRINOLARINGOLOGIA' },
  { id: '210', text: '210 - CIRUGIA ONCOLOGICA' },
  { id: '211', text: '211 - CIRUGIA ORAL' },
  { id: '212', text: '212 - CIRUGIA PEDIATRICA' },
  { id: '213', text: '213 - CIRUGIA PLASTICA Y ESTETICA' },
  { id: '214', text: '214 - CIRUGIA VASCULAR Y ANGIOLOGICA' },
  { id: '215', text: '215 - CIRUGIA UROLOGICA' },
  { id: '217', text: '217 - OTRAS CIRUGIAS' },
  { id: '218', text: '218 - CIRUGIA ENDOVASCULAR NEUROLOGICA' },
  { id: '227', text: '227 - CIRUGIA ONCOLOGICA PEDIATRICA' },
  { id: '231', text: '231 - CIRUGIA DE LA MANO' },
  { id: '232', text: '232 - CIRUGIA DE MAMA Y TUMORES TEJIDOS BLANDOS' },
  { id: '233', text: '233 - CIRUGIA DERMATOLOGICA' },
  { id: '234', text: '234 - CIRUGIA DE TORAX' },
  { id: '235', text: '235 - CIRUGIA GASTROINTESTINAL' },
  { id: '237', text: '237 - CIRUGIA PLASTICA ONCOLOGICA' },
  { id: '245', text: '245 - NEUROCIRUGIA' },
  { id: '301', text: '301 - ANESTESIA' },
  { id: '302', text: '302 - CARDIOLOGIA' },
  { id: '303', text: '303 - CIRUGIA CARDIOVASCULAR' },
  { id: '304', text: '304 - CIRUGIA GENERAL' },
  { id: '306', text: '306 - CIRUGIA PEDIATRICA' },
  { id: '308', text: '308 - DERMATOLOGIA' },
  { id: '309', text: '309 - DOLOR Y CUIDADOS PALIATIVOS' },
  { id: '310', text: '310 - ENDOCRINOLOGIA' },
  { id: '311', text: '311 - ENDODONCIA' },
  { id: '312', text: '312 - ENFERMERIA' },
  { id: '313', text: '313 - ESTOMATOLOGIA' },
  { id: '316', text: '316 - GASTROENTEROLOGIA' },
  { id: '317', text: '317 - GENETICA' },
  { id: '318', text: '318 - GERIATRIA' },
  { id: '320', text: '320 - GINECOBSTETRICIA' },
  { id: '321', text: '321 - HEMATOLOGIA' },
  { id: '323', text: '323 - INFECTOLOGIA' },
  { id: '324', text: '324 - INMUNOLOGIA' },
  { id: '325', text: '325 - MEDICINA FAMILIAR' },
  { id: '326', text: '326 - MEDICINA FISICA Y DEL DEPORTE' },
  { id: '327', text: '327 - MEDICINA FISICA Y REHABILITACION' },
  { id: '328', text: '328 - MEDICINA GENERAL' },
  { id: '329', text: '329 - MEDICINA INTERNA' },
  { id: '330', text: '330 - NEFROLOGIA' },
  { id: '331', text: '331 - NEUMOLOGIA' },
  { id: '332', text: '332 - NEUROLOGIA' },
  { id: '333', text: '333 - NUTRICIÓN Y DIETÉTICA' },
  { id: '334', text: '334 - ODONTOLOGIA GENERAL' },
  { id: '335', text: '335 - OFTALMOLOGIA' },
  { id: '336', text: '336 - ONCOLOGIA CLINICA' },
  { id: '337', text: '337 - OPTOMETRIA' },
  { id: '338', text: '338 - ORTODONCIA' },
  { id: '339', text: '339 - ORTOPEDIA Y/O TRAUMATOLOGIA' },
  { id: '340', text: '340 - OTORRINOLARINGOLOGIA' },
  { id: '342', text: '342 - PEDIATRIA' },
  { id: '343', text: '343 - PERIODONCIA' },
  { id: '344', text: '344 - PSICOLOGÍA' },
  { id: '345', text: '345 - PSIQUIATRIA' },
  { id: '346', text: '346 - REHABILITACION ONCOLOGICA' },
  { id: '347', text: '347 - REHABILITACION ORAL' },
  { id: '348', text: '348 - REUMATOLOGIA' },
  { id: '354', text: '354 - TOXICOLOGIA' },
  { id: '355', text: '355 - UROLOGIA' },
  { id: '356', text: '356 - OTRAS CONSULTAS DE ESPECIALIDAD' },
  { id: '361', text: '361 - CARDIOLOGIA PEDIATRICA' },
  { id: '362', text: '362 - CIRUGIA DE CABEZA Y CUELLO' },
  { id: '363', text: '363 - CIRUGIA DE MANO' },
  { id: '364', text: '364 - CIRUGIA DE MAMA Y TUMORES TEJIDOS BLANDOS' },
  { id: '365', text: '365 - CIRUGIA DERMATOLOGICA' },
  { id: '366', text: '366 - CIRUGIA DE TORAX' },
  { id: '367', text: '367 - CIRUGIA GASTROINTESTINAL' },
  { id: '368', text: '368 - CIRUGIA GINECOLOGICA LAPAROSCOPICA' },
  { id: '369', text: '369 - CIRUGIA PLASTICA Y ESTETICA' },
  { id: '370', text: '370 - CIRUGIA PLASTICA ONCOLOGICA' },
  { id: '371', text: '371 - OTRAS CONSULTAS GENERALES' },
  { id: '372', text: '372 - CIRUGIA VASCULAR' },
  { id: '373', text: '373 - CIRUGIA ONCOLOGICA' },
  { id: '374', text: '374 - CIRUGIA ONCOLOGICA PEDIATRICA' },
  { id: '375', text: '375 - DERMATOLOGIA ONCOLOGICA' },
  { id: '377', text: '377 - COLOPROCTOLOGIA' },
  { id: '379', text: '379 - GINECOLOGIA ONCOLOGICA' },
  { id: '383', text: '383 - MEDICINA NUCLEAR' },
  { id: '384', text: '384 - NEFROLOGIA PEDIATRICA' },
  { id: '385', text: '385 - NEONATOLOGIA' },
  { id: '386', text: '386 - NEUMOLOGIA PEDIATRICA' },
  { id: '387', text: '387 - NEUROCIRUGIA' },
  { id: '388', text: '388 - NEUROPEDIATRIA' },
  { id: '390', text: '390 - OFTALMOLOGIA ONCOLOGICA' },
  { id: '391', text: '391 - ONCOLOGIA Y HEMATOLOGIA PEDIATRICA' },
  { id: '393', text: '393 - ORTOPEDIA ONCOLOGICA' },
  { id: '395', text: '395 - UROLOGIA ONCOLOGICA' },
  { id: '396', text: '396 - ODONTOPEDIATRIA' },
  { id: '397', text: '397 - MEDICINA ESTETICA' },
  { id: '406', text: '406 - HEMATOLOGIA ONCOLOGICA' },
  { id: '407', text: '407 - MEDICINA DEL TRABAJO Y MEDICINA LABORAL' },
  { id: '408', text: '408 - RADIOTERAPIA' },
  { id: '409', text: '409 - ORTOPEDIA PEDIATRICA' },
  { id: '410', text: '410 - CIRUGIA ORAL' },
  { id: '411', text: '411 - CIRUGIA MAXILOFACIAL' },
  { id: '412', text: '412 - MEDICINA ALTERNATIVA Y COMPLEMENTARIA - HOMEOPATICA' },
  { id: '413', text: '413 - MEDICINA ALTERNATIVA Y COMPLEMENTARIA - AYURVEDICA' },
  { id: '414', text: '414 - MEDICINA ALTERNATIVA Y COMPLEMENTARIA - TRADICIONAL CHINA' },
  { id: '415', text: '415 - MEDICINA ALTERNATIVA Y COMPLEMENTARIA - NATUROPATICA' },
  { id: '416', text: '416 - MEDICINA ALTERNATIVA Y COMPLEMENTARIA - NEURALTERAPEUTICA' },
  { id: '417', text: '417 - TERAPIAS ALTERNATIVAS Y COMPLEMENTARIAS - BIOENERGETICA' },
  { id: '418', text: '418 - TERAPIAS ALTERNATIVAS Y COMPLEMENTARIAS - TERAPIA  CON FILTROS' },
  { id: '419', text: '419 - TERAPIAS ALTERNATIVAS Y COMPLEMENTARIAS - TERAPIAS  MANUALES' },
  { id: '420', text: '420 - VACUNACION' },
  { id: '421', text: '421 - PATOLOGIA' },
  { id: '422', text: '422 - MEDICINA ALTERNATIVA Y COMPLEMENTARIA - OSTEOPATICA' },
  { id: '423', text: '423 - SEGURIDAD Y SALUD EN EL TRABAJO' },
  { id: '706', text: '706 - LABORATORIO CLINICO' },
  { id: '709', text: '709 - QUIMIOTERAPIA' },
  { id: '711', text: '711 - RADIOTERAPIA' },
  { id: '712', text: '712 - TOMA DE MUESTRAS DE LABORATORIO CLINICO' },
  { id: '714', text: '714 - SERVICIO FARMACEUTICO' },
  { id: '715', text: '715 - MEDICINA NUCLEAR' },
  { id: '717', text: '717 - LABORATORIO CITOLOGIAS CERVICO-UTERINAS' },
  { id: '728', text: '728 - TERAPIA OCUPACIONAL' },
  { id: '729', text: '729 - TERAPIA RESPIRATORIA' },
  { id: '731', text: '731 - LABORATORIO DE HISTOTECNOLOGIA' },
  { id: '733', text: '733 - HEMODIALISIS' },
  { id: '734', text: '734 - DIALISIS PERITONEAL' },
  { id: '739', text: '739 - FISIOTERAPIA' },
  { id: '740', text: '740 - FONOAUDIOLOGIA Y/O TERAPIA DEL LENGUAJE' },
  { id: '742', text: '742 - DIAGNOSTICO VASCULAR' },
  { id: '743', text: '743 - HEMODINAMIA E INTERVENCIONISMO' },
  { id: '744', text: '744 - IMAGENES DIAGNOSTICAS- IONIZANTES' },
  { id: '745', text: '745 - IMAGENES DIAGNOSTICAS - NO IONIZANTES' },
  { id: '746', text: '746 - GESTION PRE-TRANSFUSIONAL' },
  { id: '747', text: '747 - PATOLOGIA' },
  { id: '748', text: '748 - RADIOLOGIA ODONTOLOGICA' },
  { id: '749', text: '749 - TOMA DE MUESTRAS DE CUELLO UTERINO Y GINECOLOGICAS' },
  { id: '1101', text: '1101 - ATENCION DEL PARTO' },
  { id: '1102', text: '1102 - URGENCIAS' },
  { id: '1103', text: '1103 - TRANSPORTE ASISTENCIAL BASICO' },
  { id: '1104', text: '1104 - TRANSPORTE ASISTENCIAL MEDICALIZADO' },
  { id: '1105', text: '1105 - ATENCION PREHOSPITALARIA' }
];

const modalidadesAtencion: ListaItem[] = [
  { id: '1', text: 'Intramural' },
  { id: '2', text: 'Extramural unidad móvil' },
  { id: '3', text: 'Extramural domiciliaria' },
  { id: '4', text: 'Extramural jornada de salud' },
  { id: '6', text: 'Telemedicina interactiva' },
  { id: '7', text: 'Telemedicina no interactiva' },
  { id: '8', text: 'Telemedicina telexperticia' },
  { id: '9', text: 'Telemedicina telemonitoreo' }
];

const causasExternas: ListaItem[] = [
  { id: '21', text: '21 - Accidente de trabajo' },
  { id: '22', text: '22 - Accidente en el hogar' },
  { id: '23', text: '23 - Accidente de tránsito de origen común' },
  { id: '24', text: '24 - Accidente de tránsito de origen  laboral' },
  { id: '25', text: '25 - Accidente en el entorno educativo' },
  { id: '26', text: '26 - Otro tipo de accidente' },
  { id: '27', text: '27 - Evento catastrófico de origen natural' },
  { id: '28', text: '28 - Lesión por agresión' },
  { id: '29', text: '29 - Lesión auto infligida' },
  { id: '30', text: '30 - Sospecha de violencia física' },
  { id: '31', text: '31 - Sospecha de violencia psicológica' },
  { id: '32', text: '32 - Sospecha de violencia sexual' },
  { id: '33', text: '33 - Sospecha de negligencia y abandono' },
  { id: '34', text: '34 - IVE relacionado con peligro a la Salud o  vida de la mujer' },
  { id: '35', text: '35 - IVE por malformación congénita  incompatible con la vida' },
  { id: '36', text: '36 - IVE por violencia sexual, incesto o por inseminación artificial o  transferencia de ovulo fecundado no consentida' },
  { id: '37', text: '37 - Evento adverso en salud' },
  { id: '38', text: '38 - Enfermedad general' },
  { id: '39', text: '39 - Enfermedad laboral' },
  { id: '40', text: '40 - PROMOCION Y MANTENIMIENTO DE LA SALUD - INTERVENCIONES INDIVIDUALES' },
  { id: '41', text: '41 - Intervención colectiva' },
  { id: '42', text: '42 - Atención de población materno perinatal' },
  { id: '43', text: '43 - Riesgo ambiental' },
  { id: '44', text: '44 - Otros eventos Catastróficos' },
  { id: '45', text: '45 - Accidente de mina antipersonal – MAP' },
  { id: '46', text: '46 - Accidente de Artefacto Explosivo Improvisado – AEI' },
  { id: '47', text: '47 - Accidente de Munición Sin Explotar- MUSE' },
  { id: '48', text: '48 - Otra víctima de conflicto armado colombiano' }
];

const tiposDiagnostico: ListaItem[] = [
  { id: '1', text: 'IMPRESION DIAGNOSTICA' },
  { id: '2', text: 'CONFIRMADO NUEVO' },
  { id: '3', text: 'CONFIRMADO REPETIDO' }
];

const usuarios: ListaItem[] = [
  { id: '6861', text: 'IVANA  MARIA BELTRAN  YANEZ' },
  { id: '6880', text: 'PAOLA  ANDREA  AGUIRRE  CORRALES' },
  { id: '6881', text: 'JOHANA VANESA ACOSTA VERGARA' },
  { id: '6882', text: 'ANGIE  PAOLA FLOREZ PALENCIA' },
  { id: '6883', text: 'MILLER ALBERTO MONCALEANO SUAREZ' },
  { id: '6885', text: 'NELYS  DEL CARMEN PRASCA  AVILES' },
  { id: '6886', text: 'MILAGRO  ISABEL RUDIÑO DELGADO' },
  { id: '6887', text: 'DIOMARA   MENDIS  LOPEZ' },
  { id: '6889', text: 'KENDY  GARCIA  AGAMEZ' },
  { id: '6890', text: 'NELCY  ESTRELLA  PEREZ  BETUN' },
  { id: '6891', text: 'VIVIAN  DAJANNA  MENDOZA  MUÑOZ' },
  { id: '6892', text: 'GLORIA  TEREZA VEGA  CAMPOS' },
  { id: '6893', text: 'NABID  GARAY SEVERICHE' },
  { id: '6894', text: 'MAINIS DEL CARMEN SFEIR GALVÁN' },
  { id: '6895', text: 'CRISTINA   CERMEÑO CARRANZA' },
  { id: '6896', text: 'EIDER ANTONIO QUIÑONEZ MONTERROZA' },
  { id: '6899', text: 'DANIELA  ESTHER GONZÁLEZ  CASTRO' },
  { id: '6903', text: 'ELVER  DANIEL  PARDO  POSADA' },
  { id: '6904', text: 'MARGARITA  ROSA ALVAREZ MATOS' },
  { id: '6905', text: 'ANDREA  BUELVAS SALABARRIA' },
  { id: '6911', text: 'EDA  DE JESUS  MADERA  DIAZ' },
  { id: '6912', text: 'EDUAR  JOSE  MADERA  BRACAMONTE' },
  { id: '6931', text: 'DAYANA  MOLINA DITTA' },
  { id: '6932', text: 'JOSE MANUEL HERNANDEZ MORELO' },
  { id: '6933', text: 'RENE SANTIAGO ORDOÑEZ' },
  { id: '6947', text: 'NATALIA   RODRÍGUEZ  BLANQUICET' },
  { id: '6948', text: ' MELKIN  MENDOZA   COGOLLO' },
  { id: '6950', text: 'JULIO ALBERTO GARAVITO ALVAREZ' },
  { id: '6951', text: 'LEDIS CARLOTA VILLARREAL ARCIA' },
  { id: '6952', text: 'MIRLEIDE EDITH VIDES GUERRERO' },
  { id: '6953', text: 'JUAN  RICARDO ORDOÑEZ CURIEL' },
  { id: '6954', text: 'EDITH ISABEL OJEDA LOPEZ' },
  { id: '6955', text: 'LUDIS CRISTINA VERGARA ARRIETA' },
  { id: '6956', text: 'RIDT MALVINA AGAMEZ AVILA' },
  { id: '6957', text: 'ZOILA MARGARITA MONTIEL DAGER' },
  { id: '6958', text: 'ANA  FRANCISCA  ORTEGA MARTINEZ' },
  { id: '6959', text: 'RUBY  MARIA  ARGUMEDO  CHOPERENA' },
  { id: '6960', text: 'NUBIA  CRISTINA  DOMINGUEZ  CORREA' },
  { id: '6961', text: 'ANGEL JAVIER PADILLA QUIÑONEZ' },
  { id: '6962', text: 'PATRICIA  DEL SOCORRO CASTRO  DELGADO' },
  { id: '6963', text: 'ROBERTO   CARLOS RODRÍGUEZ   GONZÁLEZ' },
  { id: '6964', text: 'LUISA FERNANDA PACHECO BELLO' },
  { id: '6966', text: 'NORELIS ISABEL  SIERRA  MEJIA' },
  { id: '6967', text: 'SOL MARINA DAUDER MONTIEL' },
  { id: '6968', text: 'LUCY   TATIANA   BENAVIDES   DAUDER' },
  { id: '6971', text: 'ANGELA LUCIA DELGADO FUENTES' },
  { id: '7006', text: 'LUIS FERNANDO ALZATE REGINO' },
  { id: '7008', text: 'ANDREA  PAOLA  GUARNEZ CAMARGO' },
  { id: '7010', text: 'TATIANA PAOLA CARDEÑO PINEDA' },
  { id: '7013', text: 'LUIS  CARLOS  LANCE  LOBO' },
  { id: '7017', text: 'NAYETH SOFIA MONTES DIAZ' },
  { id: '7018', text: 'ROSA MONICA DURANTE GONZALEZ' },
  { id: '7021', text: 'MELIDA  DEL CARMEN  PERTUZ   OCHOA' },
  { id: '7022', text: 'LUZ  ENITH TAPIAS  POLO' },
  { id: '7023', text: 'ARIEL DARIO DELGADO DOMINGUEZ' },
  { id: '7030', text: 'ESPERANZA   MARTINEZ SALCEDO' },
  { id: '7055', text: 'EDMANUEL   ROMERO USTARIZ' },
  { id: '7067', text: 'OMAIRA  MARMOLEJO AVILEZ' },
  { id: '7068', text: 'WALBER EMIRO VELASQUEZ CORREA' },
  { id: '7069', text: 'NOIRDIRIS ELENA CALDERON ESCOBAR' },
  { id: '7070', text: 'ANETH DEL ROSARIO ARRIETA MARTINEZ' },
  { id: '7071', text: 'YULIANA  GONZALEZ ARIAS' },
  { id: '7078', text: 'MEDICO  OTROS' },
  { id: '7111', text: 'JHOCELYN  ROA RUIZ' },
  { id: '7187', text: 'MARIA  DE LOS ANGELES  FLOREZ  VIDES' },
  { id: '7196', text: 'MARIA  ALEJANDRA DIAZ CORREA' },
  { id: '7223', text: 'HELIODORO ENRIQUE CHIMA MARTÍNEZ' },
  { id: '7315', text: 'VALERIA  DEL CARMEN  ARTEAGA  HERNÁNDEZ' },
  { id: '7366', text: 'PAULA  ANDREA  CUELLO CALUME' },
  { id: '7367', text: 'DEIVYS SUSANA ANDRADES BURGOS' },
  { id: '7468', text: 'JERONIMO RENE CONTRERAS SIERRA' },
  { id: '7562', text: 'ANA  ISABEL  ORTEGA  MARTINEZ' },
  { id: '7564', text: 'LINA MARCELA MARTINEZ CHACON' },
  { id: '7586', text: 'YURLEIDIS MARIA  RIVERA MUÑOZ' },
  { id: '7587', text: 'LEIDY  DEL CARMEN  OBVIEDO  BOHORQUEZ' },
  { id: '7592', text: 'CINDY  PAOLA HERRERA RUIZ' },
  { id: '7598', text: 'NERY  GONZALES SORACA' },
  { id: '7601', text: 'AURAE MARIA  NAVARRO ALVARADO' },
  { id: '7641', text: 'MICHAEL   GONZALEZ PEINADO' },
  { id: '7653', text: 'PABLA ROSA DIAZ REQUENA' },
  { id: '7656', text: 'MAYERLIN  CHIMA LOPEZ' },
  { id: '7659', text: 'YEIMIS YOLANIS AVILA MANCHEGO' },
  { id: '7662', text: 'MARIA JOSE RICARDO BELLO' },
  { id: '7673', text: 'MARYCRUZ  QUINTERO BURGOS' },
  { id: '7674', text: 'YELEINA MARIA  LOPEZ MERCADO' },
  { id: '7685', text: 'DINA MARCELA  ARRIETA MARTINEZ' },
  { id: '7721', text: 'RICHARD JAVIER GALVIS MARTÍNEZ' },
  { id: '7767', text: 'CARMEN JULIA QUINTERO CALDERON' },
  { id: '8007', text: 'GISELA SOFIA CABRALES BOHORQUEZ' },
  { id: '8045', text: 'VIVIANA PATRICIA GUEVARA ARIAS' },
  { id: '8075', text: 'DIEGO DE JESUS HERNANDEZ LUNA' },
  { id: '9249', text: 'MARIA MERCEDES VERGARA CAMPO' },
  { id: '9594', text: 'SHARON MELISSA PEÑATE  OVIEDO' },
  { id: '9629', text: 'PAOLA  DORIA BERROCAL' },
  { id: '9630', text: 'SALIME SALOME CAMARGO  HERNANDEZ' },
  { id: '9631', text: 'JOSE MIGUEL GUERRA AYOLA' },
  { id: '9632', text: 'WALTER  ALVAREZ' },
  { id: '9643', text: 'CARLOS ANDRES NEGRETE GONZALES' },
  { id: '9644', text: 'ANDRES  MARCELO CALDERON PUMAREJO' },
  { id: '9645', text: 'ALCIBIADES ALI ECHEVERRIA SILVA' },
  { id: '9854', text: 'NAIRA  ANDREA OSORIO  CORONADO' },
  { id: '9978', text: 'JUAN  ABEL  MARTINEZ   PAYARES' },
  { id: '9979', text: 'JUAN  CAMILO  SALAS  DAVID' },
  { id: '10023', text: 'DANIELA  ANDREA LAVERDE SARMIENTO' },
  { id: '10073', text: 'OMAR  DAVID  MENDEZ BAENA' },
  { id: '10179', text: 'JHON RAMON VELEZ PASSOS' },
  { id: '10200', text: 'LUZ DENIS LUNA JALLER' },
  { id: '10236', text: 'VANESSA MARIA  TIRADO RAMIREZ' },
  { id: '10527', text: 'KEREN ESTER MARTINEZ CASTILLO' },
  { id: '10911', text: 'MARIA  JOSE  CUELLO ARRIETA' },
  { id: '10994', text: 'JESUS DAVID RICARDO ARGUMEDO' },
  { id: '10999', text: 'MARIO MIGUEL MARTINEZ PATERNINA' },
  { id: '11042', text: 'KAREN  FABIANA VERGARA  PEREZ' },
  { id: '11043', text: 'DANIELA   CURIEL BRIEVA' },
  { id: '11044', text: 'MAURA  PIEDAD MARQUEZ PERCY' },
  { id: '11056', text: 'LEIDYS LORENA MARQUEZ ALVAREZ' },
  { id: '11065', text: 'YERLY  DIANA MARTINEZ ARRIETA' },
  { id: '11118', text: 'EVIN  SOFIA PEREZ  ATENCIA' },
  { id: '11354', text: 'LUIS ENRIQUE PEÑARANDA ANDRADE' },
  { id: '11355', text: 'PAOLA CRISTINA    HERAZO MIRANDA' },
  { id: '11356', text: 'DEIVER  PIEDRAITA ATENCIA' },
  { id: '11357', text: 'LEIDY   VALENTINA   HERNANDEZ  AREIZA' },
  { id: '11358', text: 'DOMINGO  JOSE  ROMANO ALMANZA' },
  { id: '11359', text: 'MARTHA  RIVAS  ATENCIA' },
  { id: '11360', text: 'DAYANA  NADER  MORFIL' },
  { id: '11361', text: 'JOSE  ARMANDO SANCHEZ  BARRIOS' },
  { id: '11362', text: 'BETSY  LILIANA  MARTINEZ BERROCAL' },
  { id: '11363', text: 'MARIO  DE JESUS  MARTINEZ PATERNINA' },
  { id: '11368', text: 'SANTIAGO JOSE TAFUR CHAVEZ' },
  { id: '11369', text: 'JUAN SEBASTIAN GOMEZ VERGARA' },
  { id: '11522', text: 'WENDY VANESSA  DIAZ CONTRERAS' },
  { id: '11524', text: 'ANA MABEL  MIRANDA  VILLERA' },
  { id: '11643', text: 'NINI YOHANA OSORIO RIVERA' },
  { id: '11980', text: 'ANGELICA  VANESSA SIMANCA VEGA' },
  { id: '12027', text: 'JULIO CESAR DOMINGUEZ ESPINOSA' },
  { id: '12154', text: 'SINDY MARCELA MONTIEL GUZMAN' },
  { id: '12170', text: 'MARYORETH DEL CARMEN GUZMAN LOPEZ' },
  { id: '12228', text: 'ADRIANYS PAOLA TRUJILLO MEDINA' },
  { id: '12270', text: 'YENITH DEL CARMEN DIAZ CONDE' },
  { id: '12658', text: 'NATHALY  NEGRETTE VELILLA' },
  { id: '12659', text: 'KARINA ANDREA SIERRA SANCHEZ' },
  { id: '12855', text: 'RAUL   MENDEZ PEREZ' },
  { id: '12896', text: 'NATALIA   MARTINEZ  BEDOYA' },
  { id: '12924', text: 'Fidel  Guillermo  Camargo Delgado' },
  { id: '12962', text: 'VALENTINA   VERGARA  GONZALEZ' },
  { id: '12966', text: 'ADRIANA  ALVAREZ FUENTES' },
  { id: '13024', text: 'MARIA DEL CARMEN OVIEDO SANCHEZ' }
];

const consultorios: ListaItem[] = [
  { id: '438', text: ' CONSULTORIO MED GEN 1' },
  { id: '439', text: 'CONSULTORIO MED GEN 2' },
  { id: '441', text: ' CONSULTORIO MED GEN 3' },
  { id: '442', text: ' CONSULTORIO MED GEN 4' },
  { id: '443', text: ' CONSULTORIO MED GEN 5' },
  { id: '444', text: ' CONSULTORIO MED GEN 6' },
  { id: '445', text: 'CONSULTORIO PYM 1' },
  { id: '446', text: 'CONSULTORIO CRONICOS' },
  { id: '447', text: 'CONSULTORIO PRENATAL' },
  { id: '448', text: 'COSULTORIO PLANIFICACIÓN' },
  { id: '449', text: 'CONSULTORIO CYD 1' },
  { id: '450', text: ' CONSULTORIO CYD 2' },
  { id: '451', text: 'CONSULTORIO ODONTOLOGÍA 1' },
  { id: '452', text: 'CONSULTORIO ODONTOLOGIA 2' },
  { id: '453', text: 'CONSULTORIO ODONTOLOGIA 3' },
  { id: '454', text: 'CONSULTORIO ODONTOLOGIA 4' },
  { id: '460', text: 'CONSULTORIO ODONTOLOGIA 5' },
  { id: '478', text: 'CONSULTORIO PLANIFICAIÓN 2' },
  { id: '792', text: 'CONSULTORIO ROSA' },
  { id: '798', text: 'CITAS VIRTUAL' },
  { id: '887', text: 'CONSULTORIO PSICOLOGIA' },
  { id: '1009', text: 'CONSULTORIO C' },
  { id: '1057', text: 'CONSULTORIO MED GEN 7' }
];

// ─────────────────────────────────────────────
// Objeto agregado
// ─────────────────────────────────────────────
const listas = {
  consultas,
  actividades,
  finalidades,
  centrosServicios,
  servicios,
  modalidadesAtencion,
  causasExternas,
  tiposDiagnostico,
  usuarios,
  consultorios
};

// ─────────────────────────────────────────────
// Controladores
// ─────────────────────────────────────────────

/**
 * GET /Listas/Consultas
 */
export const consultasController = (_req: Request, res: Response): void => {
  res.json(listas.consultas);
};

/**
 * GET /Listas/Actividades
 */
export const actividadesController = (_req: Request, res: Response): void => {
  res.json(listas.actividades);
};

/**
 * GET /Listas/Finalidades
 * Acepta query opcional: ?idActividad=10
 */
export const finalidadesController = (req: Request, res: Response): void => {
  const { idActividad } = req.query;
  if (idActividad) {
    res.json(listas.finalidades.filter(f => f.IdActividad == Number(idActividad)));
    return;
  }
  res.json(listas.finalidades);
};

/**
 * GET /Listas/CentrosServicios
 */
export const centrosServiciosController = (_req: Request, res: Response): void => {
  res.json(listas.centrosServicios);
};

/**
 * GET /Listas/Servicios
 */
export const serviciosController = (_req: Request, res: Response): void => {
  res.json(listas.servicios);
};

/**
 * GET /Listas/ModalidadesAtencion
 */
export const modalidadesAtencionController = (_req: Request, res: Response): void => {
  res.json(listas.modalidadesAtencion);
};

/**
 * GET /Listas/CausasExternas
 * (Aquí está "PROMOCION Y MANTENIMIENTO DE LA SALUD - INTERVENCIONES INDIVIDUALES" con id 40)
 */
export const causasExternasController = (_req: Request, res: Response): void => {
  res.json(listas.causasExternas);
};

/**
 * GET /Listas/TiposDiagnostico
 */
export const tiposDiagnosticoController = (_req: Request, res: Response): void => {
  res.json(listas.tiposDiagnostico);
};

/**
 * GET /Listas/Usuarios
 */
export const usuariosController = (_req: Request, res: Response): void => {
  res.json(listas.usuarios);
};

/**
 * GET /Listas/Consultorios
 */
export const consultoriosController = (_req: Request, res: Response): void => {
  res.json(listas.consultorios);
};

/**
 * GET /Listas/Todas
 * Devuelve todas las listas juntas en un solo objeto
 */
export const todasController = (_req: Request, res: Response): void => {
  res.json(listas);
};