// src/utils/ripsMapper.ts

import fs from 'fs';
import path from 'path';

// ============================================================
// CARGA DEL ARCHIVO RIPS (datos202.json)
// ============================================================
const jsonPath = path.join(process.cwd(), 'datos', 'datos202.json');

let ripsRegistros: any[] = [];
try {
  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  ripsRegistros = JSON.parse(rawData);
  console.log(`✅ RIPS cargados: ${ripsRegistros.length} registros`);
} catch (error) {
  console.error('❌ Error al cargar datos202.json:', error);
  ripsRegistros = [];
}

// ============================================================
// FUNCIONES DE TRANSFORMACIÓN (sin cambios)
// ============================================================

function excelDateToISO(excelDate: number | string | null | undefined): string | null {
  if (excelDate === null || excelDate === undefined) return null;
  const num = typeof excelDate === 'string' ? parseFloat(excelDate) : excelDate;
  if (isNaN(num) || num <= 0) return null;
  const fecha = new Date((num - 25569) * 86400 * 1000);
  if (isNaN(fecha.getTime())) return null;
  return fecha.toISOString().split('T')[0];
}

function traducirAgudezaVisual(codigo: number | string | null | undefined): string | null {
  if (codigo === null || codigo === undefined) return null;
  const num = typeof codigo === 'string' ? parseInt(codigo, 10) : codigo;
  if (isNaN(num)) return null;
  switch (num) {
    case 3: return '20/20';
    case 2: return '20/40';
    case 1: return '20/70';
    default: return null;
  }
}

function traducirResultadoPrueba(codigo: number | string | null | undefined): string | null {
  if (codigo === null || codigo === undefined) return null;
  const num = typeof codigo === 'string' ? parseInt(codigo, 10) : codigo;
  if (isNaN(num)) return null;
  switch (num) {
    case 0: return 'Negativo';
    case 1: return 'Positivo';
    default: return null;
  }
}

function traducirClasificacionRiesgo(codigo: number | string | null | undefined): string | null {
  if (codigo === null || codigo === undefined) return null;
  const num = typeof codigo === 'string' ? parseInt(codigo, 10) : codigo;
  if (isNaN(num)) return null;
  switch (num) {
    case 1: return 'Bajo';
    case 2: return 'Moderado';
    case 3: return 'Alto';
    default: return null;
  }
}

function fechaNoAplica(fecha: string | null | undefined): string | null {
  if (!fecha) return null;
  return fecha === '1845-01-01' || fecha === '1800-01-01' ? null : fecha;
}

// ============================================================
// MAPEO PRINCIPAL: RIPS → ESTRUCTURA CLÍNICA
// ============================================================

export interface DatosClinicos {
  // --- Estructura existente (sin cambios) ---
  antropometricos: {
    peso: number | null;
    talla: number | null;
    fecha_peso: string | null;
    fecha_talla: string | null;
  };
  laboratorios: {
    glicemia_basal: { valor: number | null; fecha: string | null };
    ldl: { valor: number | null; fecha: string | null };
    hdl: { valor: number | null; fecha: string | null };
    trigliceridos: { valor: number | null; fecha: string | null };
    hemoglobina: { valor: number | null; fecha: string | null };
    creatinina: { valor: number | null; fecha: string | null };
  };
  pruebas_rapidas: {
    vih: { resultado: string | null; fecha: string | null };
    sifilis: { resultado: string | null; fecha: string | null };
    hepatitis_b: { resultado: string | null; fecha: string | null };
    hepatitis_c: { resultado: string | null; fecha: string | null };
  };
  clasificaciones_riesgo: {
    cardiovascular: string | null;
    metabolico: string | null;
  };
  salud_visual: {
    ojo_derecho: string | null;
    ojo_izquierdo: string | null;
  };
  atenciones: {
    salud_bucal: string | null;
    asesoria_anticoncepcion: string | null;
  };

  // --- NUEVOS CAMPOS SOLICITADOS (exactamente los nombres que aparecen en los errores) ---
  resultado_tacto_rectal?: number | null;                        // Error 237
  resultado_prueba_sangre_oculta_materia_fecal?: number | null; // Error 516
  resultado_colonoscopia_tamizaje?: number | null;              // Error 535
  resultado_PSA?: number | null;                                // Error 649
  agudeza_visual_lejana_ojo_derecho?: number | null;            // Agudeza OD
  agudeza_visual_lejana_ojo_izquierdo?: number | null;          // Agudeza OI
}

function mapearRipsAClinicos(registro: any): DatosClinicos | null {
  if (!registro || typeof registro !== 'object') return null;

  // --- Mapeo de la estructura existente (sin cambios) ---
  const peso = registro['30 - Peso en KIlogramos'] ?? null;
  const talla = registro['32 - Talla en centImetros'] ?? null;
  const fechaPeso = excelDateToISO(registro['29 - Fecha del peso']);
  const fechaTalla = excelDateToISO(registro['31 - Fecha de la talla']);

  const glicemia = {
    valor: registro['57 - Resultado de glIcemIa basal AplI. >= 18 aNos y Gestantes  va con la 105'] ?? null,
    fecha: excelDateToISO(registro['105 - Fecha de toma glIcemIa basal AplI. >= 18 aNos y Gestantes  va con la 57']),
  };
  const ldl = {
    valor: registro['92 - Resultado de LDL AplI. >= 29 aNos va con la 72'] ?? null,
    fecha: excelDateToISO(registro['72 - Fecha de toma LDL  AplI. >= 29 aNos  Va con la 92']),
  };
  const hdl = {
    valor: registro['95 - Resultado de HDL  AplI  >= 29 aNos  Va con la  111'] ?? null,
    fecha: excelDateToISO(registro['111 - Fecha de toma HDL  AplI. >= 29 aNos  Va con la  95']),
  };
  const trigliceridos = {
    valor: registro['98 - Resultado de trIglIcErIdos AplI. >= 29 aNos  va con la 118'] ?? null,
    fecha: excelDateToISO(registro['118 - Fecha de toma trIglIcErIdos AplI. >= 29 aNos  va con la 98']),
  };
  const hemoglobina = {
    valor: registro['104 - Resultado de hemoglobIna'] ?? null,
    fecha: excelDateToISO(registro['103 - Fecha de toma hemoglobIna AplI. >= 10 toda  F y M']),
  };
  const creatinina = {
    valor: registro['107 - Resultado de creatInIna'] ?? null,
    fecha: excelDateToISO(registro['106 - Fecha de toma creatInIna']),
  };

  const vih = {
    resultado: traducirResultadoPrueba(registro['83 - Resultado de prueba para VIH  (Toda la poblacIOn)']),
    fecha: excelDateToISO(registro['82 - Fecha de toma de prueba para VIH  (Toda la poblacIOn)']),
  };
  const sifilis = {
    resultado: traducirResultadoPrueba(registro['81 - Resultado de prueba tamIzaje para sIfIlIs  (Toda la poblacIOn)']),
    fecha: excelDateToISO(registro['80 - Fecha de toma de prueba tamIzaje para sIfIlIs  (Toda la poblacIOn)']),
  };
  const hepatitisB = {
    resultado: traducirResultadoPrueba(registro['79 - Resultado de antIgeno de superfIcIe hepatItIs B']),
    fecha: excelDateToISO(registro['78 - Fecha de antIgeno de superfIcIe hepatItIs B']),
  };
  const hepatitisC = {
    resultado: traducirResultadoPrueba(registro['42 - Resultado de tamIzaje para hepatItIs C  ????   va con la 110']),
    fecha: excelDateToISO(registro['110 - Fecha de toma  de tamIzaje hepatItIs C   ??? va con la 42']),
  };

  const riesgoCardio = traducirClasificacionRiesgo(registro['114 - ClasIfIcacIOn del rIesgo cardIovascular']);
  const riesgoMetabolico = traducirClasificacionRiesgo(registro['117 - ClasIfIcacIOn del rIesgo metabOlIco']);

  const ojoDerecho = traducirAgudezaVisual(registro['28 - Agudeza vIsual lejana ojo derecho AplI.  >= 3 aNos =21    va con la 62']);
  const ojoIzquierdo = traducirAgudezaVisual(registro['27 - Agudeza vIsual lejana ojo IzquIerdo  AplI.  >= 3 aNos =21  va con la 62']);

  const saludBucal = fechaNoAplica(excelDateToISO(registro['76 - Fecha de atencIOn en salud bucal por profesIonal en odontologIa aplI. >=6 mese Va con la 102 C-PLA']));
  const asesoriaAnticoncepcion = fechaNoAplica(excelDateToISO(registro['53 Fecha de atencIOn en salud para la asesorIa en antIconcepcIOn AplI. 10 aNos hasta 59 aNos toda la poblacIon']));

  // --- NUEVOS CAMPOS: extraer valores numéricos directamente del registro ---
  const resultado_tacto_rectal = registro['22 - Resultado del tacto rectal'] ?? null;
  const resultado_prueba_sangre_oculta_materia_fecal = registro['24 - Resultado de la prueba sangre oculta en materIa fecal (tamIzaje Ca de colon) AplI /50 a 76 aNos   va con la 67'] ?? null;
  const resultado_colonoscopia_tamizaje = registro['36 - Resultado de colonoscopIa tamIzaje AplI / 50 y 75 aNos  va con la 66'] ?? null;
  const resultado_PSA = registro['109 - Resultado de PSA  va con la 73 prostata'] ?? null;
  const agudeza_visual_lejana_ojo_derecho = registro['28 - Agudeza vIsual lejana ojo derecho AplI.  >= 3 aNos =21    va con la 62'] ?? null;
  const agudeza_visual_lejana_ojo_izquierdo = registro['27 - Agudeza vIsual lejana ojo IzquIerdo  AplI.  >= 3 aNos =21  va con la 62'] ?? null;

  // Convertir a número si son strings numéricos (por si acaso)
  const toNumber = (val: any): number | null => {
    if (val === null || val === undefined) return null;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? null : num;
  };

  return {
    antropometricos: {
      peso: typeof peso === 'number' ? peso : null,
      talla: typeof talla === 'number' ? talla : null,
      fecha_peso: fechaPeso,
      fecha_talla: fechaTalla,
    },
    laboratorios: { glicemia_basal: glicemia, ldl, hdl, trigliceridos, hemoglobina, creatinina },
    pruebas_rapidas: { vih, sifilis, hepatitis_b: hepatitisB, hepatitis_c: hepatitisC },
    clasificaciones_riesgo: { cardiovascular: riesgoCardio, metabolico: riesgoMetabolico },
    salud_visual: { ojo_derecho: ojoDerecho, ojo_izquierdo: ojoIzquierdo },
    atenciones: { salud_bucal: saludBucal, asesoria_anticoncepcion: asesoriaAnticoncepcion },

    // Asignar los nuevos campos (con valor numérico o null)
    resultado_tacto_rectal: toNumber(resultado_tacto_rectal),
    resultado_prueba_sangre_oculta_materia_fecal: toNumber(resultado_prueba_sangre_oculta_materia_fecal),
    resultado_colonoscopia_tamizaje: toNumber(resultado_colonoscopia_tamizaje),
    resultado_PSA: toNumber(resultado_PSA),
    agudeza_visual_lejana_ojo_derecho: toNumber(agudeza_visual_lejana_ojo_derecho),
    agudeza_visual_lejana_ojo_izquierdo: toNumber(agudeza_visual_lejana_ojo_izquierdo),
  };
}

// ============================================================
// FILTRADO POR IDENTIFICACIÓN Y OBTENCIÓN DE CLÍNICOS
// ============================================================

export function filtrarYMapgearRips(identificacion: string | number): DatosClinicos[] {
  const idStr = String(identificacion).trim();
  if (!idStr) return [];

  const filtrados = ripsRegistros.filter(p =>
    p["4 - Número de IdentIfIcacIOn del usuarIo"] !== undefined &&
    String(p["4 - Número de IdentIfIcacIOn del usuarIo"]) === idStr
  );

  return filtrados.map(mapearRipsAClinicos).filter(r => r !== null) as DatosClinicos[];
}