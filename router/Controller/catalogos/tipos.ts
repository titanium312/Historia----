

/**
 * Datos que se envían a SaludPlus (historia clínica formateada).
 */
export interface HistoriaData {
  id_historia?: number;
  numero_historia?: number;
  fk_admision?: number;
  numero_admision?: number;
  fk_paciente?: number;
  hora_historia?: string;
  fecha_registro?: string;
  [key: string]: any;
}

/**
 * Tipo de función de catálogo (cada módulo exporta una función).
 */
export type CatalogFunction = (

  genero: string,
  edad: number
) => HistoriaData;

/**
 * Datos base comunes a todos los catálogos.
 */
export function construirBaseHistoria(

  genero: string,
  edad: number,
  tipoCatalogo: string
): HistoriaData {
  return {
  
    fecha_registro: new Date().toISOString().split('T')[0],
    tipo_catalogo: tipoCatalogo,
    edad_paciente: edad,
    genero: genero,
    estado: 'EN_PROCESO',
  };
}