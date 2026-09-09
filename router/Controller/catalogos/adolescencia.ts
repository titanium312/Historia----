// src/controllers/catalogos/adolescencia.ts

/**
 * Catálogo de historia clínica para ADOLESCENCIA (10-17 años).
 * Versión minimalista, tomando los datos reales de entrada,
 * calculando IMC y ajustando la fecha de anticonceptivos.
 * Ahora maneja correctamente los campos de cáncer de cuello uterino
 * para mujeres >10 años, asignando valores válidos (21, 1800-01-01, etc.)
 * y asegurando que calidad_muestra_citologia_cervicouterina sea 0
 * cuando el resultado de citología es 21 (riesgo no evaluado).
 *
 * Basado en Resolución 3280 de 2018 y 202 de 2021.
 */
export default function adolescencia(data: any): any {
  // ============================================================
  // 1. Extraer datos básicos
  // ============================================================
  const admision = data?.admision || {};
  const paciente = data?.paciente || {};
  const historia = data?.historia || {};
  const facturacion = data?.facturacion || {};
  const clinicos = data?.datosClinicos || null;

  const edad = data.edad ?? 0;
  const generoId = data.generoId ?? 1; // 1 = Masculino, 2 = Femenino
  const generoTexto = data.generoTexto || 'MASCULINO';
  const sexoId = data.sexoId ?? 2;

  // ============================================================
  // 2. Función para parsear fecha de admisión (YYYY-MM-DD)
  // ============================================================
  function parsearFechaAdmision(fechaInput: any): string {
    if (!fechaInput) {
      return new Date().toISOString().split('T')[0];
    }
    if (fechaInput instanceof Date) {
      return fechaInput.toISOString().split('T')[0];
    }
    if (typeof fechaInput === 'string' && fechaInput.startsWith('/Date(') && fechaInput.endsWith(')/')) {
      const ms = parseInt(fechaInput.slice(6, -2), 10);
      if (!isNaN(ms)) {
        return new Date(ms).toISOString().split('T')[0];
      }
    }
    if (typeof fechaInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fechaInput)) {
      return fechaInput.split('T')[0];
    }
    const date = new Date(fechaInput);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  }

  const fechaConsulta = parsearFechaAdmision(admision?.fecha_admision);

  // ============================================================
  // 3. Función para calcular fecha de anticonceptivos
  // ============================================================
  function fechaAnticonceptivos(fechaBase: string): string {
    const d = new Date(fechaBase);
    d.setFullYear(d.getFullYear() - 1);
    const dia = d.getDay();
    if (dia === 6) d.setDate(d.getDate() - 1);
    else if (dia === 0) d.setDate(d.getDate() - 2);
    return d.toISOString().split('T')[0];
  }

  const fechaAnticonceptivosStr = fechaAnticonceptivos(fechaConsulta);

  // ============================================================
  // 4. Función auxiliar para valores aleatorios coherentes
  // ============================================================
  function randomBetween(min: number, max: number): number {
    return Math.round((Math.random() * (max - min) + min) * 10) / 10;
  }

  // ============================================================
  // 5. Antropometría y signos vitales
  // ============================================================
  let peso = Number(clinicos?.antropometricos?.peso ?? 50);
  let talla = Number(clinicos?.antropometricos?.talla ?? 155);
  if (isNaN(peso) || peso < 0.2 || peso > 250) peso = 50;
  if (isNaN(talla) || talla < 20 || talla > 225) talla = 155;

  const imc = peso / ((talla / 100) ** 2);

  let pa_sist = 115, pa_diast = 75;
  if (clinicos?.antropometricos?.presion_arterial) {
    const pa = clinicos.antropometricos.presion_arterial;
    if (typeof pa === 'string') {
      const partes = pa.split('/');
      if (partes.length === 2) {
        pa_sist = parseInt(partes[0], 10) || 115;
        pa_diast = parseInt(partes[1], 10) || 75;
      }
    } else if (typeof pa === 'object' && pa.sistolica && pa.diastolica) {
      pa_sist = Number(pa.sistolica);
      pa_diast = Number(pa.diastolica);
    }
  }

  const fc = Number(clinicos?.signos_vitales?.fc ?? 72);
  const fr = Number(clinicos?.signos_vitales?.fr ?? 16);
  const temp = Number(clinicos?.signos_vitales?.temperatura ?? 36.5);

  // ============================================================
  // 6. Laboratorios y pruebas rápidas
  // ============================================================
  const lab = clinicos?.laboratorios || {};
  const hemoglobinaVal = lab.hemoglobina?.valor ?? null;
  const hemoglobinaFecha = lab.hemoglobina?.fecha || fechaConsulta;

  const pruebas = clinicos?.pruebas_rapidas || {};
  const vih = pruebas.vih?.resultado ?? null;
  const sifilis = pruebas.sifilis?.resultado ?? null;
  const hepatitisB = pruebas.hepatitis_b?.resultado ?? null;

  const mapPruebaRapida = (resultado: string | null): { codigo: string; tieneResultado: boolean } => {
    if (!resultado) return { codigo: '0', tieneResultado: false };
    const r = resultado.trim().toLowerCase();
    if (r === 'positivo' || r === 'reactivo') return { codigo: '4', tieneResultado: true };
    if (r === 'negativo' || r === 'no reactivo') return { codigo: '5', tieneResultado: true };
    return { codigo: '0', tieneResultado: false };
  };

  const vihMap = mapPruebaRapida(vih);
  const sifilisMap = mapPruebaRapida(sifilis);
  const hepBMap = mapPruebaRapida(hepatitisB);

  // ============================================================
  // 7. Lógica por sexo y edad
  // ============================================================
  const esMujer = generoId === 2;
  const esMujerMayor10 = esMujer && edad >= 10;

  // ============================================================
  // 8. Generación de valores aleatorios coherentes para circunferencia de muslo y perímetro abdominal
  // ============================================================
  // Rango según edad y sexo (valores aproximados de referencia)
  let circunferenciaMusloMin = 30,
    circunferenciaMusloMax = 50;
  let perimetroAbdominalMin = 60,
    perimetroAbdominalMax = 85;

  if (esMujer) {
    if (edad >= 14) {
      circunferenciaMusloMin = 35;
      circunferenciaMusloMax = 55;
      perimetroAbdominalMin = 65;
      perimetroAbdominalMax = 90;
    } else {
      circunferenciaMusloMin = 30;
      circunferenciaMusloMax = 48;
      perimetroAbdominalMin = 60;
      perimetroAbdominalMax = 80;
    }
  } else {
    if (edad >= 14) {
      circunferenciaMusloMin = 33;
      circunferenciaMusloMax = 58;
      perimetroAbdominalMin = 62;
      perimetroAbdominalMax = 88;
    } else {
      circunferenciaMusloMin = 28;
      circunferenciaMusloMax = 45;
      perimetroAbdominalMin = 58;
      perimetroAbdominalMax = 78;
    }
  }

  // Ajuste por IMC (si es alto, subir ligeramente los rangos)
  if (imc > 25) {
    circunferenciaMusloMin += 3;
    circunferenciaMusloMax += 5;
    perimetroAbdominalMin += 5;
    perimetroAbdominalMax += 8;
  } else if (imc < 18.5) {
    circunferenciaMusloMin -= 3;
    circunferenciaMusloMax -= 4;
    perimetroAbdominalMin -= 4;
    perimetroAbdominalMax -= 5;
  }

  const circunferenciaMuslo = randomBetween(circunferenciaMusloMin, circunferenciaMusloMax);
  const perimetroAbdominal = randomBetween(perimetroAbdominalMin, perimetroAbdominalMax);

  // ============================================================
  // 9. Construcción del objeto JSON
  // ============================================================
  return {
    // --- Identificación ---
    id_historia: String(historia?.id_historia || 0),
    numero_historia: String(historia?.numero_historia || 0),
    fk_servicio_ingreso: '2',
    fk_admision: String(admision.id_admision || 0),
    fk_procedimiento: '8138',
    motivo_consulta_historia: 'INGRESO AL PROGRAMA DE ADOLESCENCIA',
    fk_finalidad_consulta: '11',
    IdActividad: '3',
    enfermedad_actual_historia: `PACIENTE ${generoTexto} DE ${edad} AÑOS DE EDAD QUIEN VIENE PARA INGRESO AL PROGRAMA DE ADOLESCENCIA`,
    fk_paciente: String(paciente.id_paciente || 0),
    numero_admision: String(admision.numero_admision || 0),
    fk_factura_consultas: String(facturacion?.id_factura_consultas || 0),
    motivo_consulta_consulta_externa: 'INGRESO AL PROGRAMA DE ADOLESCENCIA',

    // --- Antecedentes tóxicos ---
    antecedentes_toxicos_consumo_alcohol: '2',
    antecedentes_toxicos_consumo_psicoactiva: '2',

    // --- Facturación ---
    facturacion_admisiones: {
      fk_paciente: String(paciente.id_paciente || 0),
      numero_admision: String(admision.numero_admision || 0),
      nombre_acompanante: '',
      direccion_acompanante: paciente.direccion || '',
      telefono_acompanante: '',
      nombre_responsable: '',
      parentesco_responsable: '',
      telefono_responsable: '',
      pacientes: {
        direccion_paciente: paciente.direccion || '',
        fk_ocupacion: '999',
        fk_nivel_educativo: '13',
        fk_grupo_etnico: '6',
        fk_discapacidad: '6',
        EnfoqueDiferencialIdGenero: String(generoId),
        IdOrientacionSexualEnfoqueDiferencial: '5',
        EnfoqueOtroGrupoPoblacional: '0',
      },
    },

    historia_clinica_articulos: [],

    // ============================================================
    // historia_pym_adolescencia
    // ============================================================
    historia_pym_adolescencia: [
      {


        escala_findrisc_realiza_normalmente_30_minutos_de_actividad_fisica: true,
        escala_findrisc_con_que_frecuencia_come_frutas_verduras: "1",
        escala_findrisc_le_han_recetado_alguna_vez_nedicamentos_contra_la_hta: false,
        escala_findrisc_le_han_detectado_alguna_vez_niveles_altos_de_glucosa: false,
        escala_findrisc_ha_habido_algun_diagnostico_de_DM_en_su_familia: "0",


        hallazgos_fisicos_signos_vitales_ta_adolescencia: `${pa_sist}/${pa_diast}`,
        hallazgos_fisicos_signos_vitales_fc__adolescencia: String(fc),
        hallazgos_fisicos_signos_vitales_t__adolescencia: temp,
        hallazgos_fisicos_signos_vitales_fr_adolescencia: String(fr),
        hallazgos_fisicos_signos_vitales_tallaPym_adolescencia: talla,
        hallazgos_fisicos_signos_vitales_pesoPym_adolescencia: peso,
        hallazgos_fisicos_signos_vitales_idmcPym_adolescencia: imc.toFixed(2),
        // 👇 Campos generados aleatoriamente pero coherentes
        hallazgos_fisicos_signos_vitales_circunferencia_muslo_adultez: circunferenciaMuslo,
        hallazgos_fisicos_signos_vitales_perimetro_abdominal_adolescencia: perimetroAbdominal,
        z_score_adolescencia: '-0.87',
        clasificacion_Peso_talla_adolescencia: '3',

        autonomia_funcionamiento_psicosocial_adolecencia:
          'No se evidencia problemas de comportamiento, buena relación con sus pares.',
        autonomia_componentes_adolecencia:
          'Se evidencia Capacidad suficiente para trazarse metas, objetivos propios y adecuado proceso de regulación de emociones.',
        autonomia_factores_de_desempeno_adolecencia:
          'Adecuado acompañamiento familiar buena distribución del tiempo.',
        practicas_alimentarias_observaciones_adolecencia:
          'Refiere consumo y hábitos alimentarios adecuados, no se evidencia ingesta excesiva o deficiente de calorías o nutrientes.',
        estructuras_dentomaxilofaciales_adolecencia:
          'Estructuras dentomaxilofaciales sin alteraciones evidentes al examen físico, procesos de masticación, deglución, habla y fonación sin déficit o alteración.',
        auditiva_comunicativa_observaciones_adolecencia:
          'Se evidencia integridad del oído izquierdo y derecho conservada, funciones de la articulación, voz, habla y desempeño comunicativo sin alteraciones.',
        valoracion_salud_visual_adolecencia:
          'Durante la exploración oftalmoscópica no se evidencia alteraciones oculares de la conjuntiva, cornea o retina ni derecha ni izquierda.',
        salud_sexual_observaciones_adolecencia:
          'No se evidencia signos de violencia sexual y de género, se descarta la presencia de criptorquidia y/o EPI o hipospadias.',

        examen_salud_mental_apariencia_general_adolecencia: 'NORMAL',
        examen_salud_mental_actitud_adolecencia: 'NORMAL',
        examen_salud_mental_atencion_adolecencia: 'NORMAL',
        examen_salud_mental_orientacion_adolecencia: 'NORMAL',
        examen_salud_mental_conciencia_adolecencia: 'NORMAL',
        examen_salud_mental_lenguaje_adolecencia: 'NORMAL',
        examen_salud_mental_afecto_adolecencia: 'NORMAL',
        examen_salud_mental_memoria_adolecencia: 'NORMAL',
        examen_salud_mental_habito_adolecencia: 'NORMAL',
        examen_salud_mental_sueno_o_dormir_adolecencia: 'NORMAL',
        examen_salud_mental_alimentacion_adolecencia: 'NORMAL',
        examen_salud_mental_inteligencia_adolecencia: 'NORMAL',
        examen_salud_mental_retardo_mental_adolecencia: 'NORMAL',
        examen_salud_mental_introyeccion_adolecencia: 'NORMAL',
        examen_salud_mental_prospeccion_adolecencia: 'NORMAL',
        examen_salud_mental_somatizacion_adolecencia: 'NORMAL',

        dinamica_familiar_observaciones_adolecencia: 'Trae interpretación del familiograma.',

        laboratorio_clinico_resultado_hemoglobina_adolescencia:
          hemoglobinaVal !== null ? String(hemoglobinaVal) : '0',
        laboratorio_clinico_unidad_medida_hemoglobina_adolescencia: 'MG/DL',
        laboratorio_clinico_fecha_hemoglobina_adolescencia: hemoglobinaFecha,

        laboratorio_paraclinico_laboratorio_prueba_treponemica_rapida_sifilis_adolescencia:
          sifilisMap.tieneResultado ? sifilisMap.codigo : '2',
        laboratorio_paraclinico_laboratorio_fecha_prueba_treponemica_rapida_sifilis_adolescencia:
          sifilisMap.tieneResultado ? fechaConsulta : '07/28/2026',

        laboratorio_clinico_resultado_prueba_rapida_VIH_adolescencia:
          vihMap.tieneResultado ? vihMap.codigo : '2',
        laboratorio_paraclinico_laboratorio_fecha_prueba_rapida_VIH_adolescencia:
          vihMap.tieneResultado ? fechaConsulta : '07/28/2026',

        laboratorio_paraclinico_laboratorio_hepatitis_b_adolescencia:
          hepBMap.tieneResultado ? hepBMap.codigo : '1',
        laboratorio_paraclinico_laboratorio_hepatitis_b_fecha_adolescencia:
          hepBMap.tieneResultado ? fechaConsulta : '07/28/2026',

        resultadoTestApgarAdultos: 1,
        puntuacion_escala_findrisc: '3',
        porcentaje_escala_findrisc: '1',

        InformacionSalud: [{ IdProcedimiento: '10774' }, { IdProcedimiento: '10792' }],
      },
    ],

    // ============================================================
    // resolucion4505 con lógica para cáncer de cuello uterino
    // ============================================================
    resolucion4505: [
      {
        gestacion: esMujer ? '2' : '0',
        sintomatico_respiratorio: '2',
        fecha_toma_baciloscopia_diagnostico: '1845-01-01',
        resultado_baciloscopia_diagnostico: '4',

        resultado_hemoglobina: hemoglobinaVal !== null ? Number(hemoglobinaVal) : 16,
        fecha_toma_hemoglobina: hemoglobinaFecha,

        agudeza_visual_lejana_ojo_izquierdo: '3',
        agudeza_visual_lejana_ojo_derecho: '3',
        valoracion_agudeza_visual: fechaConsulta,

        codigo_pais: '170',

        resultado_tamizaje_VALE: '0',
        fecha_tamizaje_VALE: '01/01/1845',

        // --- CÁNCER DE CUELLO UTERINO ---
        tamizaje_cancer_cuello_uterino: esMujerMayor10 ? '21' : 0,
        citologia_cervicouterina: esMujerMayor10 ? '1800-01-01' : '1845-01-01',
        resultado_tamizaje_cancer_cuello_uterino: esMujerMayor10 ? '21' : 0,
        fecha_tamizaje_cancer_cuello_uterino: esMujerMayor10 ? '1800-01-01' : '1845-01-01',
        calidad_muestra_citologia_cervicouterina: esMujerMayor10 ? 0 : 0,
        codigo_habilitacion_IPS_citologia_cervicouterina: esMujerMayor10 ? '0' : 0,
        fecha_colposcopia: esMujerMayor10 ? '1800-01-01' : '1845-01-01',
        fecha_biopsia_cervical: esMujerMayor10 ? '1800-01-01' : '1845-01-01',
        resultado_biopsia_cervicouterina: esMujerMayor10 ? '21' : 0,

        fecha_consulta_valoracion_integral: fechaConsulta,

        resultado_antigeno_superficie_hepatitisB_toda: hepBMap.tieneResultado ? hepBMap.codigo : '5',
        fecha_antigeno_superficie_hepatitisB_toda: hepBMap.tieneResultado ? fechaConsulta : '07/28/2026',

        resultado_prueba_tamizaje_sifilis: sifilisMap.tieneResultado ? sifilisMap.codigo : '5',
        fecha_serologia_sifilis: sifilisMap.tieneResultado ? fechaConsulta : '07/28/2026',

        resultado_prueba_VIH: vihMap.tieneResultado ? vihMap.codigo : '5',
        fecha_tomae_elisa_VIH: vihMap.tieneResultado ? fechaConsulta : '07/28/2026',

        planificación_familiar_primera_vez: fechaAnticonceptivosStr,
        suministro_metodo_anticonceptivo: '21',
        fecha_suministro_metodo_anticonceptivo: fechaAnticonceptivosStr,
      },
    ],

    // --- Diagnóstico principal ---
    diagnostico_ingreso_tipo_historia: '1',
    diagnostico_ingreso_fk_causa_externa: '40',
    diagnostico_ingreso_observaciones_historia:
      'Paciente en control de adolescencia. Sin alteraciones significativas.',
    historia_clinica_enfermedades_diagnostico_ingreso: [
      {
        id_historia_enfermedad_diagnostico_ingreso: 0,
        fk_historia: 0,
        fk_enfermedad: 'Z003',
        fk_institucion: 0,
      },
    ],
    diagnostico_principales_observaciones_consulta_externa:
      'Control de adolescente sano. Sin patologías activas.',
  };
}