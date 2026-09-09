import fs from 'fs';
import path from 'path';




interface RipsRecord {
  num_doc?: string | number;
  peso_kg?: string | number;
  talla_cm?: string | number;
  glicemia_basal_res?: string | number;
  fecha_toma_glicemia?: string | number;
  ldl_res?: string | number;
  fecha_toma_ldl?: string | number;
  hdl_res?: string | number;
  fecha_toma_hdl?: string | number;
  trigliceridos_res?: string | number;
  fecha_toma_trigliceridos?: string | number;
  hemoglobina_res?: string | number;
  fecha_toma_hemoglobina?: string | number;
  creatinina_res?: string | number;
  fecha_toma_creatinina?: string | number;
  baciloscopia_res?: string | number;
  fecha_toma_baciloscopia?: string | number;
  vih_res?: string | number;
  fecha_toma_vih?: string | number;
  sifilis_tamizaje_res?: string | number;
  fecha_toma_sifilis?: string | number;
  hepatitis_b_res?: string | number;
  hepatitis_c_res?: string | number;
  sangre_oculta_res?: string | number;
  fecha_sangre_oculta?: string | number;
}

// Carga de datos
const jsonPath = path.join(process.cwd(), 'datos', 'datos202.json');
let ripsRegistros: RipsRecord[] = [];

try {
  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const parsedData = JSON.parse(rawData);

  if (Array.isArray(parsedData)) {
    ripsRegistros = parsedData;
  } else if (parsedData && Array.isArray(parsedData['202'])) {
    ripsRegistros = parsedData['202'];
  } else if (parsedData && typeof parsedData === 'object') {
    const possibleArray = Object.values(parsedData).find(val => Array.isArray(val));
    ripsRegistros = Array.isArray(possibleArray) ? possibleArray : [];
  }
} catch (error) {
  console.error('Error al cargar datos202.json:', error);
  ripsRegistros = [];
}

// Funciones de traducción (solo las que se usan)
function traducirResultadoPrueba(codigo: number | string | null | undefined): string | null {
  if (codigo == null) return null;
  const num = typeof codigo === 'string' ? parseInt(codigo, 10) : codigo;
  if (isNaN(num)) return null;
  switch (num) {
    case 0: return 'Negativo';
    case 1: return 'Positivo';
    default: return null;
  }
}

// Nota: traducirAgudezaVisual y traducirClasificacionRiesgo no se usan, se pueden eliminar.

function obtenerFecha(val: any): string | null {
  if (val == null) return null;
  const valStr = String(val).trim();
  if (valStr === '1845-01-01' || valStr === '1800-01-01' || valStr === '0' || valStr === '') {
    return null;
  }
  // Conversión de serial de Excel (ej: 46052)
  if (!isNaN(Number(valStr)) && valStr.length === 5) {
    const excelDays = Number(valStr);
    const date = new Date(Math.round((excelDays - 25569) * 86400 * 1000));
    return date.toISOString().split('T')[0];
  }
  return valStr;
}

// Interfaz de salida
export interface DatosClinicos {
  antropometricos: {
    peso: number | null;
    talla: number | null;
  };
  laboratorios: {
    glicemia_basal: { valor: number | null; fecha: string | null };
    ldl: { valor: number | null; fecha: string | null };
    hdl: { valor: number | null; fecha: string | null };
    trigliceridos: { valor: number | null; fecha: string | null };
    hemoglobina: { valor: number | null; fecha: string | null };
    creatinina: { valor: number | null; fecha: string | null };
    baciloscopia: { valor: number | null; fecha: string | null };
  };
  pruebas_rapidas: {
    vih: { resultado: string | null; fecha: string | null };
    sifilis: { resultado: string | null; fecha: string | null };
    hepatitis_b: { resultado: string | null; fecha: string | null };
    hepatitis_c: { resultado: string | null; fecha: string | null };
  };
  tamizajes_especifos: {
    sangre_oculta_materia_fecal: { resultado: number | null; fecha: string | null };
  };
}

// Función de mapeo
function mapearRipsAClinicos(registro: RipsRecord): DatosClinicos | null {
  if (!registro || typeof registro !== 'object') return null;

  const toNumber = (val: any): number | null => {
    if (val == null) return null;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? null : num;
  };

  const fechaIts = obtenerFecha(registro.fecha_toma_sifilis);

  return {
    antropometricos: {
      peso: toNumber(registro.peso_kg),
      talla: toNumber(registro.talla_cm),
    },
    laboratorios: {
      glicemia_basal: {
        valor: toNumber(registro.glicemia_basal_res),
        fecha: obtenerFecha(registro.fecha_toma_glicemia),
      },
      ldl: {
        valor: toNumber(registro.ldl_res),
        fecha: obtenerFecha(registro.fecha_toma_ldl),
      },
      hdl: {
        valor: toNumber(registro.hdl_res),
        fecha: obtenerFecha(registro.fecha_toma_hdl),
      },
      trigliceridos: {
        valor: toNumber(registro.trigliceridos_res),
        fecha: obtenerFecha(registro.fecha_toma_trigliceridos),
      },
      hemoglobina: {
        valor: toNumber(registro.hemoglobina_res),
        fecha: obtenerFecha(registro.fecha_toma_hemoglobina),
      },
      creatinina: {
        valor: toNumber(registro.creatinina_res),
        fecha: obtenerFecha(registro.fecha_toma_creatinina),
      },
      baciloscopia: {
        valor: toNumber(registro.baciloscopia_res),
        fecha: obtenerFecha(registro.fecha_toma_baciloscopia),
      },
    },
    pruebas_rapidas: {
      vih: {
        resultado: traducirResultadoPrueba(registro.vih_res),
        fecha: obtenerFecha(registro.fecha_toma_vih),
      },
      sifilis: {
        resultado: traducirResultadoPrueba(registro.sifilis_tamizaje_res),
        fecha: fechaIts,
      },
      hepatitis_b: {
        resultado: traducirResultadoPrueba(registro.hepatitis_b_res),
        fecha: fechaIts,
      },
      hepatitis_c: {
        resultado: traducirResultadoPrueba(registro.hepatitis_c_res),
        fecha: fechaIts,
      },
    },
    tamizajes_especifos: {
      sangre_oculta_materia_fecal: {
        resultado: toNumber(registro.sangre_oculta_res),
        fecha: obtenerFecha(registro.fecha_sangre_oculta),
      },
    },
  };
}

// Función de filtrado y mapeo
export function filtrarYMapgearRips(identificacion: string | number): DatosClinicos[] {
  // Manejo seguro de null/undefined
  const idStr = identificacion != null ? String(identificacion).trim() : '';
  if (!idStr) return [];

  const filtrados = ripsRegistros.filter(
    p => p.num_doc != null && String(p.num_doc).trim() === idStr
  );

  return filtrados.map(mapearRipsAClinicos).filter(r => r !== null) as DatosClinicos[];
}