// src/controllers/catalogos/adultez.ts

import { Request, Response } from 'express';

// ============================================================
// 1. FUNCIONES AUXILIARES (mantenidas)
// ============================================================
function parseFechaAdmision(fecha: any): Date | null {
  if (!fecha) return null;
  try {
    if (typeof fecha === 'string' && fecha.startsWith('/Date(')) {
      const ms = parseInt(fecha.slice(6, -2), 10);
      if (!isNaN(ms)) return new Date(ms);
    }
    const d = new Date(fecha);
    if (!isNaN(d.getTime())) return d;
  } catch (e) { /* ignore */ }
  return null;
}

function formatFecha(fecha: Date | string | null): string {
  if (!fecha) return '';
  let d: Date;
  if (typeof fecha === 'string') {
    const parsed = parseFechaAdmision(fecha);
    if (parsed) d = parsed;
    else {
      const maybe = new Date(fecha);
      if (!isNaN(maybe.getTime())) d = maybe;
      else return '';
    }
  } else {
    d = fecha;
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getFechaAdmisionFormateada(admision: any): string {
  if (admision?.fecha_admision) {
    const d = parseFechaAdmision(admision.fecha_admision);
    if (d) return formatFecha(d);
  }
  return formatFecha(new Date());
}

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

function generarValorLaboratorio(tipo: string, valorOriginal: any, esHombre: boolean = false): number | null {
  const val = Number(valorOriginal);
  if (!isNaN(val) && val > 0 && val !== 998) return val;
  // Si no hay dato real, devolvemos null (se usará comodín)
  return null;
}

function obtenerFechaReferencia(datosClinicos: any, fechaAdmisionStr: string): string {
  const fuentes = [
    datosClinicos?.laboratorios?.hemoglobina?.fecha,
    datosClinicos?.laboratorios?.glicemia_basal?.fecha,
    datosClinicos?.laboratorios?.ldl?.fecha,
    datosClinicos?.laboratorios?.hdl?.fecha,
    datosClinicos?.laboratorios?.trigliceridos?.fecha,
    datosClinicos?.laboratorios?.creatinina?.fecha,
    datosClinicos?.pruebas_rapidas?.vih?.fecha,
    datosClinicos?.pruebas_rapidas?.sifilis?.fecha,
    datosClinicos?.pruebas_rapidas?.hepatitis_b?.fecha,
    datosClinicos?.pruebas_rapidas?.hepatitis_c?.fecha,
  ];
  const admisionDate = new Date(fechaAdmisionStr);
  if (isNaN(admisionDate.getTime())) {
    return formatFecha(new Date());
  }
  for (const f of fuentes) {
    if (f && typeof f === 'string' && f.trim() !== '') {
      const d = new Date(f);
      if (!isNaN(d.getTime()) && d.getTime() <= admisionDate.getTime()) {
        const day = d.getDay();
        if (day === 0 || day === 6) {
          d.setDate(d.getDate() - (day === 0 ? 2 : 1));
        }
        return formatFecha(d);
      }
    }
  }
  const base = new Date(admisionDate);
  base.setDate(base.getDate() - 3);
  const day = base.getDay();
  if (day === 0 || day === 6) {
    base.setDate(base.getDate() - (day === 0 ? 2 : 1));
  }
  return formatFecha(base);
}

function procesarFechaLaboratorio(fechaOriginal: any, fechaAdmisionStr: string, fechaReferencia: string): string {
  const admisionDate = new Date(fechaAdmisionStr);
  if (isNaN(admisionDate.getTime())) {
    return formatFecha(new Date());
  }
  let fechaBase: Date | null = null;
  if (fechaOriginal && typeof fechaOriginal === 'string' && fechaOriginal.trim() !== '') {
    const parsed = new Date(fechaOriginal);
    if (!isNaN(parsed.getTime()) && parsed.getTime() <= admisionDate.getTime()) {
      fechaBase = parsed;
    }
  }
  if (!fechaBase) {
    fechaBase = new Date(fechaReferencia);
    if (isNaN(fechaBase.getTime())) {
      fechaBase = new Date(admisionDate);
      fechaBase.setDate(fechaBase.getDate() - 3);
    }
  }
  const day = fechaBase.getDay();
  if (day === 0 || day === 6) {
    fechaBase.setDate(fechaBase.getDate() - (day === 0 ? 2 : 1));
  }
  return formatFecha(fechaBase);
}

function procesarFechaMetodoAnticonceptivo(fechaAdmisionStr: string): string {
  const admisionDate = new Date(fechaAdmisionStr);
  if (isNaN(admisionDate.getTime())) {
    return formatFecha(new Date());
  }
  const fechaBase = new Date(admisionDate);
  fechaBase.setFullYear(fechaBase.getFullYear() - 1);
  const day = fechaBase.getDay();
  if (day === 0 || day === 6) {
    fechaBase.setDate(fechaBase.getDate() - (day === 0 ? 2 : 1));
  }
  return formatFecha(fechaBase);
}

function ajustarFechaNoMenorQueNacimiento(fechaStr: string, fechaNacimientoStr: string): string {
  if (!fechaNacimientoStr) return fechaStr;
  const fecha = new Date(fechaStr);
  const nacimiento = new Date(fechaNacimientoStr);
  if (isNaN(fecha.getTime()) || isNaN(nacimiento.getTime())) return fechaStr;
  if (fecha.getTime() < nacimiento.getTime()) {
    const ajustada = new Date(nacimiento);
    ajustada.setDate(ajustada.getDate() + 1);
    return formatFecha(ajustada);
  }
  return fechaStr;
}

// ============================================================
// 2. FUNCIÓN AUXILIAR PARA OBTENER LABORATORIOS CON COMODINES
// ============================================================
function obtenerLaboratorio(
  key: string,
  datosClinicos: any,
  fechaAdmisionStr: string,
  fechaReferencia: string,
  esNoAplica: boolean = false // true para hemoglobina (no aplica), false para riesgo no evaluado
): { valor: number; fecha: string } {
  const lab = datosClinicos?.laboratorios?.[key];
  let valor = null;
  let fecha = '';

  if (lab && lab.valor !== undefined && lab.valor !== null && lab.valor !== 0 && lab.valor !== 998) {
    const num = Number(lab.valor);
    if (!isNaN(num) && num > 0) {
      valor = num;
      fecha = procesarFechaLaboratorio(lab.fecha, fechaAdmisionStr, fechaReferencia);
    }
  }

  if (valor === null) {
    if (esNoAplica) {
      return { valor: 0, fecha: '1845-01-01' };
    } else {
      return { valor: 998, fecha: '1800-01-01' };
    }
  }
  return { valor, fecha };
}

// ============================================================
// 3. FUNCIÓN PRINCIPAL
// ============================================================
export const adultez = (data: any) => {
  // ==========================================================
  // 1. Extraer datos básicos
  // ==========================================================
  const { admision, paciente, historia, facturacion, edad, datosClinicos } = data;

  const generoId = data.generoId ?? data.sexoId ?? data.paciente?.sexoId ?? 0;
  const esMujer = generoId === 2;
  const esHombre = generoId === 1;

  const fechaNacimientoStr = paciente?.fecha_nacimiento ? formatFecha(paciente.fecha_nacimiento) : '';
  const fechaAdmisionStr = getFechaAdmisionFormateada(admision);
  const fechaReferencia = obtenerFechaReferencia(datosClinicos, fechaAdmisionStr);

  // ==========================================================
  // 2. Antropometría y signos vitales
  // ==========================================================
  const peso = datosClinicos?.antropometricos?.peso ?? 70;
  const talla = datosClinicos?.antropometricos?.talla ?? 160;
  const imc = peso / ((talla / 100) ** 2);

  let frecuenciaCardiaca = Number(datosClinicos?.signos_vitales?.fc);
  if (isNaN(frecuenciaCardiaca) || frecuenciaCardiaca <= 0) {
    frecuenciaCardiaca = 80;
  }

  // ==========================================================
  // 3. Laboratorios (con comodines)
  // ==========================================================
  const labGlicemia = obtenerLaboratorio('glicemia_basal', datosClinicos, fechaAdmisionStr, fechaReferencia, false);
  const labLDL = obtenerLaboratorio('ldl', datosClinicos, fechaAdmisionStr, fechaReferencia, false);
  const labHDL = obtenerLaboratorio('hdl', datosClinicos, fechaAdmisionStr, fechaReferencia, false);
  const labTrig = obtenerLaboratorio('trigliceridos', datosClinicos, fechaAdmisionStr, fechaReferencia, false);
  const labCreat = obtenerLaboratorio('creatinina', datosClinicos, fechaAdmisionStr, fechaReferencia, false);
  // Hemoglobina: NO aplica en adultez (se usa solo si hay dato real)
  const labHemo = obtenerLaboratorio('hemoglobina', datosClinicos, fechaAdmisionStr, fechaReferencia, true);

  // PSA (solo hombres, y solo si hay dato real)
  const psaOrig = datosClinicos?.tamizajes_especifos?.psa?.resultado ?? null;
  let psaValor = 0;
  let psaFecha = '1845-01-01';
  if (esHombre && psaOrig !== null && psaOrig !== undefined && psaOrig !== 0 && psaOrig !== 998) {
    const num = Number(psaOrig);
    if (!isNaN(num) && num > 0) {
      psaValor = num;
      psaFecha = procesarFechaLaboratorio(datosClinicos?.tamizajes_especifos?.psa?.fecha, fechaAdmisionStr, fechaReferencia);
    }
  }

  // ==========================================================
  // 4. Pruebas rápidas (con comodines, no obligatorias en adultez)
  // ==========================================================
  const rapidas = datosClinicos?.pruebas_rapidas || {};

  function obtenerResultadoPrueba(
    resultado: string | null,
    fecha: any,
    esMujer: boolean,
    esObligatoria: boolean = false
  ): { resultado: string; fecha: string } {
    // En adultez, las pruebas rápidas no son obligatorias, usamos comodines a menos que vengan datos reales
    if (resultado) {
      const r = resultado.trim().toLowerCase();
      let codigo = '0';
      if (r === 'negativo' || r === 'no reactivo') codigo = '5';
      else if (r === 'positivo' || r === 'reactivo') codigo = '4';
      else codigo = '0';

      if (codigo === '4' || codigo === '5') {
        const fechaProcesada = procesarFechaLaboratorio(fecha, fechaAdmisionStr, fechaReferencia);
        if (fechaProcesada > '1900-01-01') {
          return { resultado: codigo, fecha: fechaProcesada };
        }
      }
    }
    return { resultado: '0', fecha: '1845-01-01' };
  }

  const vih = obtenerResultadoPrueba(rapidas.vih?.resultado, rapidas.vih?.fecha, esMujer, false);
  const sifilis = obtenerResultadoPrueba(rapidas.sifilis?.resultado, rapidas.sifilis?.fecha, esMujer, false);
  const hepatitisB = obtenerResultadoPrueba(rapidas.hepatitis_b?.resultado, rapidas.hepatitis_b?.fecha, esMujer, false);
  const hepatitisC = obtenerResultadoPrueba(rapidas.hepatitis_c?.resultado, rapidas.hepatitis_c?.fecha, esMujer, false);

  // ==========================================================
  // 5. Fecha método anticonceptivo y hora
  // ==========================================================
  const fechaMetodoAnticonceptivo = procesarFechaMetodoAnticonceptivo(fechaAdmisionStr);
  const hora = admision?.hora_admision || { Hours: 13, Minutes: 23 };
  const horaStr = `${String(hora.Hours).padStart(2, '0')}:${String(hora.Minutes).padStart(2, '0')}`;

  // ==========================================================
  // 6. Construcción del objeto final
  // ==========================================================
  const resultado = {
    id_historia: String(historia?.id_historia || 0),
    numero_historia: String(historia?.numero_historia || 0),
    fk_servicio_ingreso: "2",
    fk_admision: String(admision?.id_admision || 0),
    fk_procedimiento: "8138",
    motivo_consulta_historia: "RUTA_ADULTEZ",
    fk_finalidad_consulta: "12",
    IdActividad: "5",
    enfermedad_actual_historia: `Paciente de ${edad} años en control de promoción y mantenimiento (PYM). Sin síntomas ni signos de alarma. `,
    fk_paciente: String(paciente?.id_paciente || 0),
    numero_admision: String(admision?.numero_admision || 0),
    fk_factura_consultas: String(facturacion?.id_factura_consultas || 0),
    motivo_consulta_consulta_externa: esHombre ? `Control del adulto (${edad} años)` : `Control de la adulta (${edad} años)`,
    antecedentes_toxicos_consumo_alcohol: "2",
    antecedentes_toxicos_consumo_psicoactiva: "2",
    hora_historia: horaStr,
    diagnostico_ingreso_tipo_historia: "1",
    diagnostico_ingreso_fk_causa_externa: "40",
    diagnostico_ingreso_observaciones_historia: "",
    diagnostico_principales_observaciones_consulta_externa: "Paciente asintomático en control de rutina.",
    historia_clinica_enfermedades_diagnostico_ingreso: [
      {
        id_historia_enfermedad_diagnostico_ingreso: 0,
        fk_historia: 0,
        fk_enfermedad: "Z000",
        fk_institucion: 0,
      },
    ],
    facturacion_admisiones: {
      fk_paciente: String(paciente?.id_paciente || 0),
      numero_admision: String(admision?.numero_admision || 0),
      nombre_acompanante: admision?.nombre_acompanante || "",
      direccion_acompanante: paciente?.direccion || "VDA LACOQUERA",
      telefono_acompanante: admision?.telefono_acompanante || "",
      nombre_responsable: admision?.nombre_responsable || "",
      parentesco_responsable: admision?.parentesco_responsable || "",
      telefono_responsable: admision?.telefono_responsable || "",
      pacientes: {
        direccion_paciente: paciente?.direccion || "VDA LACOQUERA",
        fk_ocupacion: "999",
        fk_nivel_educativo: "13",
        fk_grupo_etnico: "6",
        fk_discapacidad: "6",
        EnfoqueDiferencialIdGenero: String(generoId),
        IdOrientacionSexualEnfoqueDiferencial: "5",
        enfoque_diferencial_religion: "",
        enfoque_diferencial_consumo_spa: "0",
        enfoque_diferencial_gestacion: "0",
        enfoque_resguardo_indigena: "",
        enfoque_diferencial_victima_conflicto_armado: "0",
        enfoque_minas_antipersonas: "",
        enfoque_minas_municion_sinexplotar: "",
        enfoque_diferencial_desplazado: "0",
        enfoque_diferencial_ruv: "0",
        enfoque_diferencial_victima_maltrato: "0",
        enfoque_diferencial_abandono_social: "0",
        enfoque_diferencial_carcelario: "0",
        enfoque_diferencial_migrante: "0",
        enfoque_diferencial_desescolarizado: "0",
        enfoque_diferencial_trabajadora_sexual: "0",
        enfoque_diferencial_poblacion_lgbti: "0",
        enfoque_diferencial_desempleado: "0",
        enfoque_diferencial_mujer_nino_menor_ano: "0",
        enfoque_diferencial_adulto_mayor: "0",
        EnfoqueDiferencialHabitanteCalle: "0",
        EnfoqueMadreComunitaria: "0",
        EnfoqueDesmovilizado: "0",
        EnfoqueCentroPsiquiatrico: "0",
        EnfoqueOtroGrupoPoblacional: "0",
      },
    },
    historia_clinica_articulos: [],

    // ==========================================================
    // historia_pym_adultez
    // ==========================================================
    historia_pym_adultez: [
      {
        hallazgos_fisicos_signos_vitales_ta_adultez: "120/80",
        hallazgos_fisicos_signos_vitales_fc__adultez: frecuenciaCardiaca,
        hallazgos_fisicos_signos_vitales_t_adultez: "",
        hallazgos_fisicos_signos_vitales_fr_adultez: 18,
        hallazgos_fisicos_signos_vitales_tallaPym_adultez: talla,
        hallazgos_fisicos_signos_vitales_pesoPym_adultez: peso,
        hallazgos_fisicos_signos_vitales_idmcPym_adultez: parseFloat(imc.toFixed(2)),
        hallazgos_fisicos_signos_vitales_circunferencia_muslo_adultez: 0,
        hallazgos_fisicos_signos_vitales_perimetro_abdominal_adultez: 95,
        practicas_alimentarias_observaciones_adultez: "Refiere consumo y hábitos alimentarios adecuados, no se evidencia ingesta excesiva o deficiente de calorías o nutrientes.",
        estructuras_dentomaxilofaciales_adultez: "Estructuras dentomaxilofaciales sin alteraciones evidentes al examen físico, procesos de masticación, deglución, habla y fonación sin déficit o alteración.",
        auditiva_comunicativa_observaciones_adultez: " Se evidencia integridad del oído izquierdo y derecho conservada, funciones de la articulación, voz, habla y desempeño comunicativo sin alteraciones. ",
        valoracion_salud_visual_adultez: "Durante la exploración oftalmoscópica no se evidencia alteraciones oculares de la conjuntiva, cornea o retina ni derecha ni izquierda. ",
        salud_sexual_observaciones_adultez: "No se evidencia signos de violencia sexual y de género, se descarta la presencia de criptorquidia y/o EPI o hipospadias.",
        examen_salud_mental_apariencia_general_adultez: "NORMAL",
        examen_salud_mental_actitud_adultez: "NORMAL",
        examen_salud_mental_atencion_adultez: "NORMAL",
        examen_salud_mental_orientacion_adultez: "NORMAL",
        examen_salud_mental_conciencia_adultez: "NORMAL",
        examen_salud_mental_lenguaje_adultez: "NORMAL",
        examen_salud_mental_afecto_adultez: "NORMAL",
        examen_salud_mental_memoria_adultez: "NORMAL",
        examen_salud_mental_habito_adultez: "NORMAL",
        examen_salud_mental_sueno_o_dormir_adultez: "NORMAL",
        examen_salud_mental_alimentacion_adultez: "NORMAL",
        examen_salud_mental_inteligencia_adultez: "NORMAL",
        examen_salud_mental_retardo_mental_adultez: "NORMAL",
        examen_salud_mental_introyeccion_adultez: "NORMAL",
        examen_salud_mental_prospeccion_adultez: "NORMAL",
        examen_salud_mental_somatizacion_adultez: "NORMAL",
        dinamica_familiar_observaciones_adultez: "Trae interpretación del familiograma.",
        escala_findrisc_realiza_normalmente_30_minutos_de_actividad_fisica: true,
        escala_findrisc_con_que_frecuencia_come_frutas_verduras: "0",
        escala_findrisc_le_han_recetado_alguna_vez_nedicamentos_contra_la_hta: false,
        escala_findrisc_le_han_detectado_alguna_vez_niveles_altos_de_glucosa: false,
        escala_findrisc_ha_habido_algun_diagnostico_de_DM_en_su_familia: "0",
        InformacionSalud: [],
      },
    ],

    // ==========================================================
    // resolucion4505 (con laboratorios y hemoglobina corregidos)
    // ==========================================================
    resolucion4505: [
      {
        gestacion: (esMujer && edad >= 29 && edad <= 59) ? "2" : "0",
        sintomatico_respiratorio: "2",
        fecha_toma_baciloscopia_diagnostico: "1845-01-01",
        resultado_baciloscopia_diagnostico: "4",
        // Hemoglobina: ahora usa comodines si no hay dato real
        resultado_hemoglobina: labHemo.valor,
        fecha_toma_hemoglobina: labHemo.fecha,
        agudeza_visual_lejana_ojo_izquierdo: "3",
        agudeza_visual_lejana_ojo_derecho: "3",
        valoracion_agudeza_visual: fechaAdmisionStr,
        codigo_pais: "170",
        resultado_tamizaje_VALE: "",
        fecha_tamizaje_VALE: "",
        tamizaje_cancer_cuello_uterino: (esMujer && edad >= 29 && edad <= 59) ? "1" : "0",
        citologia_cervicouterina: (esMujer && edad >= 29 && edad <= 59) ? ajustarFechaNoMenorQueNacimiento(fechaAdmisionStr, fechaNacimientoStr) : "1845-01-01",
        resultado_tamizaje_cancer_cuello_uterino: (esMujer && edad >= 29 && edad <= 59) ? "17" : "0",
        fecha_tamizaje_cancer_cuello_uterino: (esMujer && edad >= 29 && edad <= 59) ? ajustarFechaNoMenorQueNacimiento(fechaAdmisionStr, fechaNacimientoStr) : "1845-01-01",
        calidad_muestra_citologia_cervicouterina: (esMujer && edad >= 29 && edad <= 59) ? "1" : "0",
        codigo_habilitacion_IPS_citologia_cervicouterina: (esMujer && edad >= 29 && edad <= 59) ? "21" : "0",
        fecha_colposcopia: "1845-01-01",
        fecha_biopsia_cervical: (esMujer && edad >= 29 && edad <= 59) ? "1800-01-01" : "1845-01-01",
        resultado_biopsia_cervicouterina: (esMujer && edad >= 29 && edad <= 59) ? "21" : "0",
        fecha_consulta_valoracion_integral: fechaAdmisionStr,
        // Pruebas rápidas
        resultado_antigeno_superficie_hepatitisB_toda: hepatitisB.resultado,
        fecha_antigeno_superficie_hepatitisB_toda: hepatitisB.fecha,
        resultado_prueba_tamizaje_sifilis: sifilis.resultado,
        fecha_serologia_sifilis: sifilis.fecha,
        resultado_prueba_VIH: vih.resultado,
        fecha_tomae_elisa_VIH: vih.fecha,
        resultado_tamizaje_hepatitis_C: hepatitisC.resultado,
        fecha_toma_tamizaje_hepatitis_C: hepatitisC.fecha,
        // Planificación familiar
        planificación_familiar_primera_vez: fechaMetodoAnticonceptivo,
        suministro_metodo_anticonceptivo: "21",
        fecha_suministro_metodo_anticonceptivo: fechaMetodoAnticonceptivo,
        consumo_tabaco: "99",
        // Glicemia, lípidos, creatinina (con comodines)
        resultado_glicemia_basal: labGlicemia.valor,
        fecha_toma_glicemia_basal: labGlicemia.fecha,
        resultado_LDL: labLDL.valor,
        fecha_toma_LDL: labLDL.fecha,
        resultado_HDL: labHDL.valor,
        fecha_toma_HDL: labHDL.fecha,
        resultado_trigliceridos: labTrig.valor,
        fecha_toma_trigliceridos: labTrig.fecha,
        resultado_creatinina: labCreat.valor,
        fecha_creatinina: labCreat.fecha,
        clasificacion_riesgo_cardiovascular: "21",
        clasificación_riesgo_metabolico: "21",
        // Tacto rectal y PSA
        resultado_tacto_rectal: (esHombre && edad >= 45 && edad <= 59) ? "21" : "0",
        fecha_tacto_rectal: (esHombre && edad >= 45 && edad <= 59) ? fechaAdmisionStr : "1845-01-01",
        resultado_PSA: (esHombre && edad >= 45 && edad <= 59) ? psaValor : 0,
        fecha_toma_PSA: (esHombre && edad >= 45 && edad <= 59) ? psaFecha : "1845-01-01",
        // Sangre oculta y colonoscopia
        resultado_prueba_sangre_oculta_materia_fecal: (edad >= 50 && edad <= 59) ? "21" : "0",
        fecha_prueba_sangre_oculta_materia_feca: (edad >= 50 && edad <= 59) ? fechaAdmisionStr : "1845-01-01",
        resultado_colonoscopia_tamizaje: (edad >= 50 && edad <= 59) ? "21" : "0",
        fecha_colonoscopia_tamizaje: (edad >= 50 && edad <= 59) ? fechaAdmisionStr : "1845-01-01",
        // Mamografía
        resultado_mamografia_res202: (esMujer && edad >= 50 && edad <= 59) ? "2" : "1845-01-01",
        fecha_mamografía: (esMujer && edad >= 50 && edad <= 59) ? fechaAdmisionStr : "1845-01-01",
        // Biopsia de mama (siempre no aplica)
        resultado_biopsia_mama: "0",
        fecha_toma_biopsia_seno_BACAF: "1845-01-01",
        fecha_resultado_biopsia_seno_BACAF: "1845-01-01",
        resultado_prueba_mini_mental_state: "",
      },
    ],
  };

  return resultado;
};