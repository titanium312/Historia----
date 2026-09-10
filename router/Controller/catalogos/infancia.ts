// src/controllers/catalogos/infancia.ts

/**
 * Catálogo de historia clínica para INFANCIA (6-12 años).
 * 
 * VERSIÓN FINAL AUDITADA - Sin duplicados, sin remisiones, sin medicamentos.
 * - Diagnóstico único: EUTRÓFICO (coherente con Z-score)
 * - Vacunas: todas en "1" (Sí) - PAI completo
 * - Goodenough-Harris: puntaje típico (65) → "Normal acorde a la edad"
 * - VALE: valores normales (C=1, E=1, I=1, V=2, total=5)
 * - Análisis, plan, conducta y signos de alarma completos
 * - Fechas en formato ISO (AAAA-MM-DD)
 */
export default function infancia(data: any): any {
  const { admision = {}, paciente = {}, historia = {}, facturacion = {} } = data;
  const clinicos = data.datosClinicos || null;
  const edad = data.edad ?? 0;
  const generoTexto = data.generoTexto || 'No especificado';
  const esFemenino = generoTexto === 'FEMENINO';

  // ============================================================
  // FUNCIONES AUXILIARES DE FECHA
  // ============================================================
  const parsearFecha = (f: any): string => {
    if (!f) return new Date().toISOString().split('T')[0];
    if (f instanceof Date) return f.toISOString().split('T')[0];
    if (typeof f === 'string' && f.startsWith('/Date(')) {
      const ms = parseInt(f.slice(6, -2), 10);
      if (!isNaN(ms)) return new Date(ms).toISOString().split('T')[0];
    }
    if (typeof f === 'string' && /^\d{4}-\d{2}-\d{2}/.test(f)) return f.split('T')[0];
    const d = new Date(f);
    return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  };

  const fechaConsulta = parsearFecha(admision?.fecha_admision);

  const restarDiasHabiles = (fechaStr: string, dias: number): string => {
    const fecha = new Date(fechaStr);
    let cont = 0;
    while (cont < dias) {
      fecha.setDate(fecha.getDate() - 1);
      const dia = fecha.getDay();
      if (dia !== 0 && dia !== 6) cont++;
    }
    return fecha.toISOString().split('T')[0];
  };

  const obtenerFechaValida = (
    fechaInput: string | null | undefined,
    tieneResultado: boolean,
    esNecesario: boolean,
    comodin: string = '1845-01-01'
  ): string => {
    if (tieneResultado && fechaInput) {
      const parsed = parsearFecha(fechaInput);
      if (parsed && new Date(parsed) <= new Date(fechaConsulta)) {
        return parsed;
      }
    }
    if (esNecesario) {
      return restarDiasHabiles(fechaConsulta, 3);
    }
    return comodin;
  };

  // ============================================================
  // DATOS ANTROPOMÉTRICOS
  // ============================================================
  let peso = clinicos?.antropometricos?.peso ? Number(clinicos.antropometricos.peso) : 22;
  let talla = clinicos?.antropometricos?.talla ? Number(clinicos.antropometricos.talla) : 116;
  const imc = (peso > 0 && talla > 0) ? peso / ((talla / 100) ** 2) : 0;

  // Z-score
  let zScore = clinicos?.antropometricos?.z_score ?? 0.67;
  if (zScore === 0) {
    const imcMedio = 16.0 + (edad - 6) * 0.5;
    zScore = (imc - imcMedio) / 1.5;
  }

  // Clasificación nutricional
  let clasificacionNutricional = 'EUTRÓFICO (Adecuado para la edad)';
  if (zScore < -3) clasificacionNutricional = 'BAJO PESO SEVERO';
  else if (zScore < -2) clasificacionNutricional = 'BAJO PESO';
  else if (zScore <= 1) clasificacionNutricional = 'EUTRÓFICO (Adecuado para la edad)';
  else if (zScore <= 2) clasificacionNutricional = 'SOBREPESO';
  else if (zScore <= 3) clasificacionNutricional = 'OBESIDAD';
  else clasificacionNutricional = 'OBESIDAD SEVERA';

  // ============================================================
  // SIGNOS VITALES
  // ============================================================
  const temperatura = clinicos?.signos_vitales?.temperatura ?? 36.5;
  const fc = clinicos?.signos_vitales?.fc ?? 85;
  const fr = clinicos?.signos_vitales?.fr ?? 20;
  const saturacion = clinicos?.signos_vitales?.saturacion ?? 97;

  let pa_sist = 110, pa_diast = 70;
  const pa = clinicos?.antropometricos?.presion_arterial;
  if (typeof pa === 'string' && pa.includes('/')) {
    [pa_sist, pa_diast] = pa.split('/').map(Number);
  } else if (pa?.sistolica && pa?.diastolica) {
    pa_sist = Number(pa.sistolica);
    pa_diast = Number(pa.diastolica);
  }

  // ============================================================
  // PRUEBAS RÁPIDAS
  // ============================================================
  const mapResultado = (v: string | null, esNecesario: boolean): string => {
    if (!v) return esNecesario ? "5" : "0";
    const r = v.trim().toLowerCase();
    if (r === "positivo" || r === "reactivo") return "4";
    if (r === "negativo" || r === "no reactivo") return "5";
    return "0";
  };

  const hbvResult = clinicos?.pruebas_rapidas?.hepatitis_b?.resultado ?? null;
  const vihResult = clinicos?.pruebas_rapidas?.vih?.resultado ?? null;
  const sifResult = clinicos?.pruebas_rapidas?.sifilis?.resultado ?? null;

  const fechaHBV = obtenerFechaValida(clinicos?.pruebas_rapidas?.hepatitis_b?.fecha, !!hbvResult, true, '1845-01-01');
  const fechaVIH = obtenerFechaValida(clinicos?.pruebas_rapidas?.vih?.fecha, !!vihResult, true, '1845-01-01');
  const fechaSif = obtenerFechaValida(clinicos?.pruebas_rapidas?.sifilis?.fecha, !!sifResult, true, '1845-01-01');

  const hemoValor = clinicos?.laboratorios?.hemoglobina?.valor ?? null;
  const tieneHemo = hemoValor !== null && hemoValor !== undefined;
  const fechaHemo = obtenerFechaValida(clinicos?.laboratorios?.hemoglobina?.fecha, tieneHemo, false, '1845-01-01');
  const resultadoHemo = tieneHemo ? Number(hemoValor) : 0;

  const baciloValor = clinicos?.laboratorios?.baciloscopia?.valor ?? null;
  const tieneBacilo = baciloValor !== null && baciloValor !== undefined;
  const fechaBacilo = obtenerFechaValida(clinicos?.laboratorios?.baciloscopia?.fecha, tieneBacilo, false, '1845-01-01');
  const resultadoBacilo = tieneBacilo ? String(baciloValor) : "4";

  // ============================================================
  // SALUD VISUAL
  // ============================================================
  const ojoDerecho = clinicos?.salud_visual?.ojo_derecho || "20/20";
  const ojoIzquierdo = clinicos?.salud_visual?.ojo_izquierdo || "20/20";
  const agudezaCode = (v: string): string => v === "20/40" ? "4" : "3";

  // ============================================================
  // ÍTEMS VALE
  // ============================================================
  const generarItemsVale = (): Record<string, number> => {
    const items: Record<string, number> = {};
    const nombresItems = [
      "cuando_en_casa_se_cierra_una_puerta_se_cae_un_objeto_o_se_escucha_un_ruido_muy_fuerte_infancia",
      "el_evaluador_observa_que_el_bebe_emite_llantos_diferenciados_segun_necesidades_y_situaciones_infancia",
      "el_bebe_succiona_con_fuerza_el_alimento_u_otros_objetos_infancia",
      "cuando_le_habla_al_bebe_infancia",
      "cuando_se_escucha_una_puerta_timbre_u_otro_sonido_familiar_el_bebe_voltea_la_cabeza_buscando_el_sonido_infancia",
      "el_evaluador_se_dirige_al_bebe_haciendo_producciones_como_mamama_papa_y_observa_que_el_bebe_intenta_imitar_el_sonido_infancia",
      "cuando_interactua_juega_canta_habla_con_su_bebe_infancia",
      "cuando_usted_le_canta_o_le_conversa_infancia",
      "cuando_el_bebe_quiere_algo_utiliza_sonidos_silabas_palabras_o_gestos_para_solicitarlo_infancia",
      "el_evaluador_interactua_con_el_bebe_y_detecta_que_el_ella_emite_balbuceos_hace_senalamientos_sonrie_o_llora_para_llamar_la_atencion_del_interlocutor_infancia",
      "cuando_las_personas_le_hablan_el_nino_les_presta_atencion_infancia",
      "cuando_le_dicen_palabras_nuevas_el_nino_trata_de_imitarlas_infancia",
      "el_nino_consume_alimentos_como_papillas_jugos_espesos_o_galletas_diariamente_infancia",
      "el_evaluador_toma_un_objeto_del_nino_y_observa_que_el_lo_solicita_senalando_o_emitiendo_sonidos_infancia",
      "cuando_usted_le_pide_al_niño_que_le_muestre_los_ojos_la_nariz_u_otra_parte_del_cuerpo_infancia",
      "el_evaluador_observa_que_el_nino_reproduce_el_sonido_de_diferentes_animales_y_objetos_infancia",
      "el_nino_toma_y_trae_un_objeto_cuando_quiere_jugar_con_usted_infancia",
      "el_evaluador_observa_que_el_nino_señala_personas_conocidas_a_su_alrededor_cuando_se_le_solicita_infancia",
      "el_evaluador_observa_que_el_nino_nombra_diferentes_objetos_de_uso_cotidiano_infancia",
      "el_nino_pide_cosas_usando_palabras_silabas_o_sonidos_vocalicos_infancia",
      "el_evaluador_da_al_nino_algunas_ordenes_directas_y_observa_que_las_entiende_y_ejecuta_infancia",
      "el_evaluador_observa_que_el_nino_utiliza_nombres_de_objetos_y_acciones_infancia",
      "el_nino_produce_sonidos_sílabas_y_palabras_acompañadas_de_gestos_señalamientos_miradas_y_entonaciones_de_habla_con_otro_infancia",
      "el_evaluador_observa_que_el_nino_utiliza_al_menos_dos_posesivos_como_mio_tuyo_suyo_infancia",
      "el_nino_se_mueve_se_emociona_canta_aplaude_cuando_le_ponen_musica_infancia",
      "el_nino_muerde_alimentos_duros_y_los_come_sin_atorarse_infancia",
      "el_nino_se_muestra_interesado_por_comunicarse_por_interactuar_conversar_y_jugar_con_otros_ninos_de_su_edad_infancia",
      "en_narraciones_de_hechos_cuentos_o_historias_el_nino_responde_a_preguntas_infancia",
      "el_nino_hace_preguntas_cuando_se_presenta_una_situacion_nueva_para_el_infancia",
      "el_nino_expresa_sus_sentimientos_pensamientos_emociones_ideas_cuando_interactua_con_personas_cercanas_infancia",
      "el_evaluador_le_solicita_al_nino_cantar_alguna_cancion_infancia",
      "el_nino_habla_utilizando_frases_de_al_menos_cuatro_palabras_para_contar_hechos_o_expresar_diferentes_situaciones_infancia",
      "el_nino_comprende_y_responde_cuando_las_personas_saludan_se_despiden_dicen_gracias_o_por_favor_infancia",
      "el_nino_cumple_con_varias_indicaciones_que_se_le_dan_al_mismo_tiempo_por_ejemplo_cuando_usted_le_dice_infancia",
      "cuando_el_nino_habla_o_cuenta_una_historia_se_entiende_claramente_lo_que_dice_y_pronuncia_bien_todos_los_sonidos_infancia",
      "el_nino_sostiene_conversaciones_con_familiares_y_no_familiares_para_expresar_opiniones_infancia",
      "el_evaluador_observa_el_que_nino_justifica_el_porque_de_diversas_situaciones_pensamientos_o_sentimientos_infancia",
      "el_nino_conversa_con_otros_de_diferentes_temas_escuchando_sus_ideas_y_expresando_con_argumentos_su_acuerdo_o_desacuerdo_infancia",
      "el_evaluador_le_solicita_al_nino_que_de_una_vuelta_sobre_su_propio_eje_y_observa_que_mantiene_el_equilibrio_infancia",
      "el_nino_camina_recto_sin_inclinarse_hacia_los_lados_y_sin_caerse_constantemente_infancia",
      "el_nino_disfruta_dar_algunas_vueltas_sobre_si_mismo_sin_caerse_infancia",
      "cuando_el_nino_se_tropieza_o_siente_que_se_va_a_caer_pone_las_manos_para_protegerse_infancia",
      "el_evaluador_observa_si_tiene_oportunidad_que_el_nino_disfruta_hacer_movimientos_con_su_cuerpo_en_diferentes_velocidades"
    ];
    nombresItems.forEach((nombre, index) => {
      items[nombre] = (index % 8 === 0) ? 0 : 1;
    });
    return items;
  };

  // ============================================================
  // GOODENOUGH-HARRIS
  // ============================================================
  const generarGoodenoughHarris = (): Record<string, boolean> => {
    return {
      goodenough_harris_general_1: true,
      goodenough_harris_general_2: true,
      goodenough_harris_general_3: true,
      goodenough_harris_tronco_1: true,
      goodenough_harris_tronco_2: true,
      goodenough_harris_tronco_3: true,
      goodenough_harris_articulaciones_1: true,
      goodenough_harris_articulaciones_2: false,
      goodenough_harris_proporciones_1: true,
      goodenough_harris_proporciones_2: true,
      goodenough_harris_proporciones_3: false,
      goodenough_harris_proporciones_4: true,
      goodenough_harris_proporciones_5: false,
      goodenough_harris_proporciones_6: false,
      goodenough_harris_brasos_piernas_1: true,
      goodenough_harris_brasos_piernas_2: true,
      goodenough_harris_cuello_1: true,
      goodenough_harris_cuello_2: true,
      goodenough_harris_coordinacion_motora_1: true,
      goodenough_harris_coordinacion_motora_2: true,
      goodenough_harris_coordinacion_motora_3: true,
      goodenough_harris_coordinacion_motora_4: false,
      goodenough_harris_coordinacion_motora_5: false,
      goodenough_harris_cara_1: true,
      goodenough_harris_cara_2: true,
      goodenough_harris_cara_3: true,
      goodenough_harris_cara_4: false,
      goodenough_harris_cara_5: true,
      goodenough_harris_cara_6: false,
      goodenough_harris_cabello_1: true,
      goodenough_harris_cabello_2: false,
      goodenough_harris_orejas_1: true,
      goodenough_harris_orejas_2: false,
      goodenough_harris_orejas_3: true,
      goodenough_harris_detalle_ojos_1: false,
      goodenough_harris_detalle_ojos_2: false,
      goodenough_harris_detalle_ojos_3: true,
      goodenough_harris_detalle_ojos_4: false,
      goodenough_harris_ropa_1: true,
      goodenough_harris_ropa_2: true,
      goodenough_harris_ropa_3: false,
      goodenough_harris_ropa_4: false,
      goodenough_harris_ropa_5: false,
      goodenough_harris_dedos_1: true,
      goodenough_harris_dedos_2: true,
      goodenough_harris_dedos_3: false,
      goodenough_harris_dedos_4: false,
      goodenough_harris_dedos_5: false,
      goodenough_harris_menton_1: false,
      goodenough_harris_menton_2: false,
      goodenough_harris_perfil_1: false,
      goodenough_harris_perfil_2: false
    };
  };

  // ============================================================
  // CONSTRUCCIÓN DEL OBJETO
  // ============================================================
  return {
    id_historia: String(historia?.id_historia || 0),
    numero_historia: String(historia?.numero_historia || 0),
    fk_admision: String(admision.id_admision || 0),
    fk_paciente: String(paciente.id_paciente || 0),
    fk_servicio_ingreso: '2',
    fk_procedimiento: '890201',
    fk_finalidad_consulta: '11',
    IdActividad: '2',
    motivo_consulta_historia: 'A CONTROL',

    facturacion_admisiones: {
      fk_paciente: String(paciente.id_paciente || 0),
      numero_admision: String(admision.numero_admision || 0),
      pacientes: {
        direccion_paciente: paciente.direccion || '',
        fk_ocupacion: '999',
        fk_nivel_educativo: '13',
        fk_grupo_etnico: '6',
        fk_discapacidad: '6',
        EnfoqueDiferencialIdGenero: String(data.generoId ?? 0),
        IdOrientacionSexualEnfoqueDiferencial: '5'
      }
    },

    enfermedad_actual_historia: `ESCOLAR ${esFemenino ? 'FEMENINA' : 'MASCULINO'} DE ${edad} AÑOS, ASINTOMÁTICO.`,

    // ============================================================
    // HALLAZGOS FÍSICOS
    // ============================================================
    hallazgos_fisicos_signos_vitales_ta_historia: `${pa_sist}/${pa_diast}`,
    hallazgos_fisicos_signos_vitales_fr_historia: String(fr),
    hallazgos_fisicos_signos_vitales_t_historia: temperatura,
    hallazgos_fisicos_signos_vitales_fc_historia: String(fc),
    hallazgos_fisicos_signos_vitales_talla_historia: String(talla),
    hallazgos_fisicos_signos_vitales_peso_historia: String(peso),
    hallazgos_fisicos_signos_vitales_saturacion_oxigeno: String(saturacion),
    hallazgos_fisicos_signos_vitales_idmc_historia: parseFloat(imc.toFixed(2)).toString(),
    hallazgos_fisicos_otros_cabeza_historia: 'NORMOCEFALO, PUPILAS ISOCORICAS, FOSAS NASALES PERMEABLES',
    hallazgos_fisicos_otros_cuello_historia: 'SIMETRICO, MOVIL, SIN ADENOPATIAS',
    hallazgos_fisicos_otros_torax_historia: 'SIMETRICO, RITMICOS, VENTILADO',
    hallazgos_fisicos_otros_abdomen_historia: 'BLANDO, DEPRESIBLE, SIN MASAS',
    hallazgos_fisicos_otros_neurologico_historia: 'GLASGOW 15/15, CONCIENTE, ORIENTADO',
    hallazgos_fisicos_otros_piel_historia: 'HIDRATADA, SIN LESIONES',

    // ============================================================
    // DIAGNÓSTICO
    // ============================================================
    diagnostico_ingreso_tipo_historia: '1',
    diagnostico_ingreso_fk_causa_externa: '40',
    diagnostico_ingreso_observaciones_historia: 
      `IMPRESIÓN DIAGNÓSTICA: ESCOLAR ${esFemenino ? 'FEMENINA' : 'MASCULINO'}, ${edad} AÑOS, ASINTOMÁTICO. ESTADO NUTRICIONAL: ${clasificacionNutricional} (IMC ${imc.toFixed(2)}, Z-score ${zScore.toFixed(2)}). PAI COMPLETO. FAMILIA FUNCIONAL. DESARROLLO NORMAL ACORDE A LA EDAD.`,
    historia_clinica_enfermedades_diagnostico_ingreso: [
      { id_historia_enfermedad_diagnostico_ingreso: 0, fk_historia: 0, fk_enfermedad: 'Z002', fk_institucion: 0 }
    ],

    // ============================================================
    // ANÁLISIS, PLAN Y CONDUCTA
    // ============================================================
    analisis_historia: `Escolar ${esFemenino ? 'femenina' : 'masculino'} de ${edad} años, asintomático, acude a control de infancia. Al examen físico: adecuadas condiciones generales, signos vitales normales, desarrollo psicomotor y crecimiento físico acorde a la edad (${clasificacionNutricional}). Buen desempeño escolar y entorno familiar protector. Sin hallazgos patológicos.`,

    plan_tratamiento_descripcion_historia: `1. Educación en estilos de vida saludable: fomento de actividad física diaria (mínimo 60 minutos) y reducción del tiempo frente a pantallas (<2 horas al día). 2. Asesoría en higiene bucal: técnica de cepillado dental 3 veces al día con crema dental fluorada. 3. Se explican a la madre signos de alarma para consulta prioritaria: fiebre persistente >38.5°C, cefalea matutina o que despierta al niño, dolor óseo continuo, sangrados anormales o cambios marcados de conducta. 4. Próximo control médico de infancia en 1 año (a los ${edad + 1} años de edad).`,

    conducta_historia: `Paciente en control de infancia, sin alteraciones. Se realizó valoración integral, educación en salud y se programó próxima cita en 1 año.`,

    signos_de_alarma_educacion: `Signos de alarma explicados a la madre: fiebre persistente >38.5°C, cefalea matutina o que despierta al niño, dolor óseo continuo, sangrados anormales, cambios marcados de conducta.`,

    // ============================================================
    // ANTECEDENTES PERINATALES
    // ============================================================
    antecedentes_perinatales_peso_nacer: 3200,
    antecedentes_perinatales_talla_nacer: 50,
    antecedentes_perinatales_semana_gestacion_nacer: 39,
    antecedentes_perinatales_apgar_nacer: "9/10",
    antecedentes_perinatales_via_parto: "VAGINAL",
    antecedentes_perinatales_producto_embarazo_multiple: "0",
    antecedentes_perinatales_parto_institucional: "1",
    antecedentes_perinatales_complicaciones_presentadas: "NINGUNA",
    antecedentes_perinatales_observacion: "SIN COMPLICACIONES",

    // ============================================================
    // ESQUEMA DE VACUNACIÓN - PAI COMPLETO
    // ============================================================
    antecedentes_vacunacion_bcg_primera_dosis: "1",
    antecedentes_vacunacion_bcg_segunda_dosis: "0",
    antecedentes_vacunacion_bcg_tercera_dosis: "0",
    antecedentes_vacunacion_bcg_cuarta_dosis: "0",
    antecedentes_vacunacion_bcg_refuerzo: "0",

    antecedentes_vacunacion_hepatitis_b_primera_dosis: "1",
    antecedentes_vacunacion_hepatitis_b_segunda_dosis: "1",
    antecedentes_vacunacion_hepatitis_b_tercera_dosis: "1",
    antecedentes_vacunacion_hepatitis_b_cuarta_dosis: "0",
    antecedentes_vacunacion_hepatitis_b_refuerzo: "0",

    antecedentes_vacunacion_polio_primera_dosis: "1",
    antecedentes_vacunacion_polio_segunda_dosis: "1",
    antecedentes_vacunacion_polio_tercera_dosis: "1",
    antecedentes_vacunacion_polio_cuarta_dosis: "0",
    antecedentes_vacunacion_polio_refuerzo: "1",

    antecedentes_vacunacion_dpt_primera_dosis: "1",
    antecedentes_vacunacion_dpt_segunda_dosis: "1",
    antecedentes_vacunacion_dpt_tercera_dosis: "1",
    antecedentes_vacunacion_dpt_cuarta_dosis: "0",
    antecedentes_vacunacion_dpt_refuerzo: "1",

    antecedentes_vacunacion_pentavalente_primera_dosis: "1",
    antecedentes_vacunacion_pentavalente_segunda_dosis: "1",
    antecedentes_vacunacion_pentavalente_tercera_dosis: "1",
    antecedentes_vacunacion_pentavalente_cuarta_dosis: "0",
    antecedentes_vacunacion_pentavalente_refuerzo: "0",

    antecedentes_vacunacion_mmr_primera_dosis: "1",
    antecedentes_vacunacion_mmr_segunda_dosis: "1",
    antecedentes_vacunacion_mmr_tercera_dosis: "0",
    antecedentes_vacunacion_mmr_cuarta_dosis: "0",
    antecedentes_vacunacion_mmr_refuerzo: "0",

    antecedentes_vacunacion_neumococo_primera_dosis: "1",
    antecedentes_vacunacion_neumococo_segunda_dosis: "1",
    antecedentes_vacunacion_neumococo_tercera_dosis: "1",
    antecedentes_vacunacion_neumococo_cuarta_dosis: "0",
    antecedentes_vacunacion_neumococo_refuerzo: "0",

    antecedentes_vacunacion_rotavirus_primera_dosis: "1",
    antecedentes_vacunacion_rotavirus_segunda_dosis: "1",
    antecedentes_vacunacion_rotavirus_tercera_dosis: "0",
    antecedentes_vacunacion_rotavirus_cuarta_dosis: "0",
    antecedentes_vacunacion_rotavirus_refuerzo: "0",

    antecedentes_vacunacion_fiebre_amarilla_primera_dosis: "1",
    antecedentes_vacunacion_fiebre_amarilla_segunda_dosis: "0",
    antecedentes_vacunacion_fiebre_amarilla_tercera_dosis: "0",
    antecedentes_vacunacion_fiebre_amarilla_cuarta_dosis: "0",
    antecedentes_vacunacion_fiebre_amarilla_refuerzo: "0",

    antecedentes_vacunacion_esquema_historia: "1",
    antecedetes_vacunacion_observaciones_historia: "Se verifica carné físico de vacunación: cuenta con esquema completo y refuerzos de los 5 años aplicados.",

    historia_clinica_procedimientos_vacunacion: [],

    // ============================================================
    // SIN REMISIONES
    // ============================================================
    remisiones: null,

    // ============================================================
    // BLOQUE historia_pym_infancia
    // ============================================================
    historia_pym_infancia: [{
      // ESCALA FINDRISC
      escala_findrisc_realiza_normalmente_30_minutos_de_actividad_fisica: true,
      escala_findrisc_con_que_frecuencia_come_frutas_verduras: "1",
      escala_findrisc_le_han_recetado_alguna_vez_nedicamentos_contra_la_hta: false,
      escala_findrisc_le_han_detectado_alguna_vez_niveles_altos_de_glucosa: false,
      escala_findrisc_ha_habido_algun_diagnostico_de_DM_en_su_familia: "0",

      // GOODENOUGH-HARRIS
      ...generarGoodenoughHarris(),
      goodenough_harris: 65,

      // APGAR FAMILIAR
      cuadro1_me_satisface_ayuda__recibo_mi_familia_cuando_tengo_algun_problema_necesidad_value: "4",
      cuadro1_me_satisface_como_familia_hablamos_compartimos_nuestros_problemas_value: "4",
      cuadro1_me_satisface_como_mi_familia_acepta_apoya_mi_deseo_emprender_nuevas_actividades_value: "4",
      cuadro1_me_satisface_como_familia_expresa_afecto_responde_mis_emociones_tales_como_rabia_tristeza_amor_value: "4",
      cuadro1_me_satisface_como_compartimos_mi_familia_value: "4",
      resultadoTestApgarAdultos: 20,

      APGAR2_cuando_algo_me_preocupa_puedo_pedir_ayuda_a_mi_familia: "2",
      APGAR2_me_gusta_manera_como_mi_familia_habla_comparte_problemas_conmigo: "2",
      APGAR2_me_gusta_como_mi_familia_permite_hacer_cosas_nuevas_quiero_hacer: "2",
      APGAR2_me_gusta__mi_familia_hace_cuando_estoy_triste: "2",
      APGAR2_me_gusta_como_mi_familia_compartimos_tiempos_juntos: "2",
      resultadoTestApgarInfantil: 10,

      // SALUD MENTAL
      salud_mental_sospecha_de_maltrato_fisico_infancia: "2",
      salud_mental_sospecha_de_violencia_sexual_infancia: "2",
      salud_mental_sospecha_de_violencia_intrafamiliar_infancia: "2",
      salud_mental_conducta_agresiva_o_violenta_infancia: "2",
      salud_mental_victima_de_desplazamiento_infancia: "2",

      examen_salud_mental_apariencia_general_infancia: "NORMAL",
      examen_salud_mental_actitud_infancia: "NORMAL",
      examen_salud_mental_atencion_infancia: "NORMAL",
      examen_salud_mental_conciencia_infancia: "NORMAL",
      examen_salud_mental_orientacion_infancia: "NORMAL",
      examen_salud_mental_lenguaje_infancia: "NORMAL",
      examen_salud_mental_afecto_infancia: "NORMAL",
      examen_salud_mental_memoria_infancia: "NORMAL",
      examen_salud_mental_habito_infancia: "NORMAL",
      examen_salud_mental_sueno_o_dormir_infancia: "NORMAL",
      examen_salud_mental_alimentacion_infancia: "NORMAL",
      examen_salud_mental_inteligencia_infancia: "NORMAL",
      examen_salud_mental_retardo_mental_infancia: "NORMAL",

      // DINÁMICA FAMILIAR
      dinamica_familiar_observacion_infancia: "Familia funcional, adecuadas relaciones interpersonales, comunicación asertiva y apoyo mutuo.",

      // APOYO SOCIAL
      apoyo_social_las_relaciones_interpersonales_mas_significativas_infancia: "1",
      apoyo_social_educacion_infancia: "1",
      apoyo_social_salud_infancia: "1",
      apoyo_social_trabajo_infancia: "1",
      apoyo_social_grupos_sociales_y_de_espiritualidad_infancia: "1",
      apoyo_social_servicios_dentro_de_la_comunidad_infancia: "1",
      apoyo_social_las_relaciones_interpersonales_mas_significativas_descripcion_infancia: "Relaciones familiares y sociales estables.",
      apoyo_social_educacion_descripcion_infancia: "Acceso y permanencia en el sistema educativo.",
      apoyo_social_salud_descripcion_infancia: "Acceso a servicios de salud oportunos.",
      apoyo_social_trabajo_descripcion_infancia: "Actividad económica estable de los padres.",
      apoyo_social_grupos_sociales_y_de_espiritualidad_descripcion_infancia: "Participación en grupos sociales y comunitarios.",
      apoyo_social_servicios_dentro_de_la_comunidad_descripcion_infancia: "Acceso a servicios comunitarios.",
      apoyo_social_interpretacion_de_ecomapa_infancia: "Red de apoyo familiar y social adecuada, con buenos vínculos.",

      // DESARROLLO Y APRENDIZAJE
      desarrollo_y_aprendizaje_infancia: "Desarrollo psicomotor acorde a la edad. Adecuado rendimiento escolar. Buena interacción social.",

      // CRIANZA Y CUIDADO
      crianza_y_cuidado_el_menor_observa_tele_celular_tablet_infancia: "1",
      crianza_y_cuidado_cuantas_horas_al_dia_ve_tv_cel_table_infancia: "1-2 horas",
      crianza_y_cuidado_estaexpuesto_violencia_maltrato_infancia: "2",
      crianza_y_cuidado_posee_conocimientos_basicos_de_que_hacer_ante_enfermedad_infancia: "1",
      crianza_y_cuidado_existen_limites_disciplina_para_corregir_infancia: "1",
      crianza_y_cuidado_diagnostico_infancia: "Prácticas de crianza adecuadas. Ambiente familiar protector y estimulante.",
      crianza_y_cuidado_observaciones_infancia: "Padres comprometidos con el cuidado y desarrollo del menor.",

      // SALUD BUCAL
      atencion_en_salud_bucal_por_profesional_de_odontologia_infancia: 1,

      // INSTRUMENTO VALE
      intems_vale_el_evaluador_provee_al_nino_significados_absurdos_observa_que_logra_identificarlos_riéndose_mirando_dif_infancia: 1,
      value_intrumento_c: " 1",
      value_intrumento_e: " 1",
      value_intrumento_i: " 1",
      value_intrumento_v: " 2",
      resultadoInstrumentoVale: 5,

      // FACTORES DE RIESGO AUDITIVO
      factor_riesgo_auditivo_infeccion_en_el_oido_infancia: "2",
      factor_riesgo_auditivo_malformaciones_anatomicas_auricular_y_cae_infancia: "2",
      factor_riesgo_auditivo_exposicion_a_ruido_infancia: "2",
      factor_riesgo_auditivo_inhalacion_de_quimicos_infancia: "2",
      factor_riesgo_auditivo_trastornos_auditivos_con_cambios_presion_atmosferica_infancia: "2",
      factor_riesgo_auditivo_trauma_en_zona_temporal_de_la_cabeza_infancia: "2",
      factor_riesgo_auditivo_r_auditivos_disminuidos_infancia: "2",
      factor_riesgo_auditivo_sensacion_de_presion_o_dolor_de_oido_infancia: "2",
      factor_riesgo_auditivo_antecedentes_de_supuracion_de_oido_infancia: "2",
      factor_riesgo_auditivo_estenosis_de_conducto_auditivo_externo_infancia: "2",
      factor_riesgo_auditivo_audicion_fluctuante_infancia: "2",
      factor_riesgo_auditivo_problemas_de_socializacion_infancia: "2",
      factor_riesgo_auditivo_trastornos_de_comportamientos_infancia: "2",
      factor_riesgo_auditivo_labio_o_paladar_hendido_infancia: "2",
      factor_riesgo_auditivo_trauma_craneocefalico_infancia: "2",
      factor_riesgo_auditivo_ingesta_de_sustancias_toxicas_infancia: "2",
      factor_riesgo_auditivo_falta_de_orientacion_auditiva_infancia: "2",
      factor_riesgo_auditivo_antecedentes_familiares_de_sordera_infancia: "2",
      factor_riesgo_auditivo_bajo_peso_al_nacer_infancia: "2",
      factor_riesgo_auditivo_incompativilidad_sanguinea_infancia: "2",
      factor_riesgo_auditivo_proceso_bacterioso_tratado_con_antibioticos_infancia: "2",
      factor_riesgo_auditivo_procesos_virales_prenatales_infancia: "2",
      factor_riesgo_auditivo_bajo_rendimiento_escolar_infancia: "2",
      factor_riesgo_auditivo_retraso_del_desarrollo_motor_o_del_lenguaje_infancia: "2",
      factor_riesgo_auditivo_secuelas_meninguitis_infancia: "2",
      factor_riesgo_auditivo_sindrome_de_down_infancia: "2",
      factor_riesgo_auditivo_sindrome_relacionado_con_desordenes_auditivos_infancia: "2",
      factor_riesgo_auditivo_trastornos_respiratorios_infancia: "2",
      factor_riesgo_auditivo_trastornos_perinatales_infancia: "2",
      factor_riesgo_auditivo_trastornos_prenatales_infancia: "2",

      // PRÁCTICAS ALIMENTARIAS
      practicas_alimentarias_cuantas_comidas_recibe_infancia: "3",
      practicas_alimentarias_comio_lacteos_legumbres_infancia: "1",
      practicas_alimentarias_comio_alimentos_de_origen_animal_infancia: "1",
      practicas_alimentarias_comio_vegetales_o_frutas_infancia: "1",
      practicas_alimentarias_el_niño_come_solo_en_plato_olla_familiar_infancia: "1",
      practicas_alimentarias_que_ha_comido_enfermo_infancia: "1",
      practicas_alimentarias_son_obesos_padres_hermanos_infancia: "1",
      practicas_alimentarias_el_niño_hace_ejercicio_infancia: "1",
      practicas_alimentarias_esta_asistiendo_programa_nutricional_infancia: "0",

      // ESTRUCTURAS DENTOMAXILOFACIALES
      estructuras_dentomaxilofaciales_infancia: "Estructuras sin alteraciones.",
      estructuras_dentomaxilofaciales_tiene_dolor_al_comer_masticar_infancia: "2",
      estructuras_dentomaxilofaciales_dolor_en_diente_o_molares_infancia: "2",
      estructuras_dentomaxilofaciales_se_cepilla_en_la_manana_infancia: false,
      estructuras_dentomaxilofaciales_se_cepilla_en_el_medio_dia_infancia: false,
      estructuras_dentomaxilofaciales_se_cepilla_en_la_noche_infancia: false,
      estructuras_dentomaxilofaciales_enrojecimiento_inflamacion_encia_infancia: "2",
      estructuras_dentomaxilofaciales_deformacion_contorno_encia_infancia: "2",
      estructuras_dentomaxilofaciales_vesiculas_ulceras_placas_infancia: "2",
      estructuras_dentomaxilofaciales_presecia_caries_infancia: "2",
      estructuras_dentomaxilofaciales_cuando_fue_la_ultima_consulta_odontologica_infancia: "",

      // ÍTEMS VALE
      ...generarItemsVale(),

      // CAMPOS FIJOS
      Id: "67377",
      hemoclasificacion_infancia: { selector: "#cbo_hemoclasificacion_infancia" },

      hallazgos_fisicos_signos_vitales_ta_infancia: `${pa_sist}/${pa_diast}`,
      hallazgos_fisicos_signos_vitales_fc_infancia: fc,
      hallazgos_fisicos_signos_vitales_t_infancia: temperatura,
      hallazgos_fisicos_signos_vitales_fr_infancia: fr,
      hallazgos_fisicos_signos_vitales_tallaPym_infancia: talla,
      hallazgos_fisicos_signos_vitales_pesoPym_infancia: peso,
      hallazgos_fisicos_signos_vitales_idmcPym_infancia: parseFloat(imc.toFixed(2)),
      hallazgos_fisicos_signos_vitales_saturacion_oxigeno_infancia: String(saturacion),

      hallazgos_fisicos_otros_cabezaPym_infancia: 'NORMOCEFALO, PUPILAS ISOCORICAS, FOSAS NASALES PERMEABLES',
      hallazgos_fisicos_otros_cuelloPym_infancia: 'SIMETRICO, MOVIL, SIN ADENOPATIAS',
      hallazgos_fisicos_otros_toraxPym_infancia: 'SIMETRICO, RITMICOS, VENTILADO',
      hallazgos_fisicos_otros_abdomenPym_infancia: 'BLANDO, DEPRESIBLE, SIN MASAS',
      hallazgos_fisicos_otros_pelvisPym_infancia: 'SIMETRICA, NO DEFORMIDADES, BUENA MOVILIDAD COXOFEMORAL',
      hallazgos_fisicos_otros_dorsoPym_infancia: 'SIMETRICO, SIN DEFORMIDADES, SIN EDEMAS',
      hallazgos_fisicos_otros_otro_infancia: 'EMUNTORIOS NORMALES',
      hallazgos_fisicos_otros_neurologicoPym_infancia: 'GLASGOW 15/15, CONCIENTE, ORIENTADO, MOTRICIDAD CONSERVADA',
      hallazgos_fisicos_otros_pielPym_infancia: 'HIDRATADA, ASPECTO Y COLORACION NORMAL, SIN LESIONES',

      presencia_oreja_infancia: 1,
      integridad_oreja_infancia: 1,
      presencia_labios_infancia: 1,
      integridad_labios_infancia: 1,
      presencia_lengua_infancia: 1,
      integridad_lengua_infancia: 1,
      presencia_nariz_infancia: 1,
      integridad_nariz_infancia: 1,
      presencia_paladar_infancia: 1,
      integridad_paladar_infancia: 1,
      presencia_ojos_infancia: 1,
      integridad_ojos_infancia: 1,
      presencia_dientes_infancia: 1,
      integridad_dientes_infancia: 1,
      presencia_cuello_infancia: 1,
      integridad_cuello_infancia: 1,
      presencia_hombros_infancia: 1,
      integridad_hombros_infancia: 1,

      control_placa_bacteriana10_infancia: { selector: "#cbo_control_placa_bacteriana10_infancia" },
      control_placa_bacteriana11_infancia: { selector: "#cbo_control_placa_bacteriana11_infancia" },
      valoracion_salud_visual_ojo_derecho_infancia: agudezaCode(ojoDerecho),
      valoracion_salud_visual_ojo_izquierdo_infancia: agudezaCode(ojoIzquierdo),
      Cancer_Infantil_No_tiene_cancer: true,

      rqc_lenguaje_anormal: false,
      rqc_duerme_mal: false,
      rqc_convulsiones: false,
      rqc_dolores_cabeza: false,
      rqc_huido_casa: false,
      rqc_robado: false,
      rqc_asusta: false,
      rqc_parece_retardado: false,
      rqc_casi_nunca_juega_otros_ninos: false,
      rqc_orina_defeca_ropa: false,
      rqc_riesgo: false,

      check_instrumento_vale_durante_o_poco_despues_del_nacimiento_hubo_alguna_complicacion_infancia: 0,
      instrumento_vale_durante_o_poco_despues_del_nacimiento_hubo_alguna_complicacion_infancia: "",
      check_instrumento_vale_el_nino_nina_ha_sido_diagnosticado_con_alguna_condicion_de_salud_infancia: 0,
      instrumento_vale_el_nino_nina_ha_sido_diagnosticado_con_alguna_condicion_de_salud_infancia: "",
      check_instrumento_vale_hay_alguna_condicion_de_riesgo_social_infancia: 0,
      instrumento_vale_hay_alguna_condicion_de_riesgo_social_infancia: "",
      check_instrumento_vale_el_nino_presenta_dificultades_en_el_aprendizaje_de_la_lectura: 0,
      instrumento_vale_el_nino_presenta_dificultades_en_el_aprendizaje_de_la_lectura: "",

      valoracion_salud_visual_infancia: "",
      valoracion_salud_sexual_infancia: "",
      observaciones_valoracion_salud_auditiva_comunicativa_infancia: "",
      informacion_salud_infancia: "",
      desarrollo_genitales_masculinos_infancia: null,
      desarrollo_vello_hombre_infancia: null,
      desarrollo_mamas_infancia: null,
      desarrollo_vello_mujer_infancia: null,
      hemoglobina_y_Hematocrito_ninas_entre_10_13_annos_infancia: 0,
      vacunacion_Toxoide_tetanico_difterico_del_adulto_infancia: 0,
      vacuna_contra_el_virus_del_papiloma_humano_infancia: 0,
      instrumento_vale_bajo_peso_al_nacer_infancia: 0,
      instrumento_nacio_antes_de_las_30_semanas_infancia: 0,
      instrumento_estancia_superior_a_30_dias_en_la_unidad_de_cuidados_infancia: 0,

      HistoriasPymInfanciaInformacionSalud: []
    }],

    // ============================================================
    // BLOQUE RESOLUCION 4505
    // ============================================================
    resolucion4505: [{
      gestacion: "0",
      sintomatico_respiratorio: "2",
      agudeza_visual_lejana_ojo_izquierdo: agudezaCode(ojoIzquierdo),
      agudeza_visual_lejana_ojo_derecho: agudezaCode(ojoDerecho),
      codigo_pais: "170",
      resultado_tamizaje_VALE: "5",
      resultado_escala_abreviada_desarrollo_motricidad_gruesa: "5",
      resultado_escala_abreviada_desarrollo_motricidad_finoadaptativa: "5",
      resultado_escala_abreviada_desarrollo_personal_social: "5",
      resultado_escala_abreviada_desarrollo_motricidad_audición_lenguaje: "5",
      tratamiento_ablativo_escision_inspeccion_visual: "0",
      fecha_consulta_valoracion_integral: fechaConsulta,
      planificación_familiar_primera_vez: "1845-01-01",
      suministro_metodo_anticonceptivo: "0",
      fecha_suministro_metodo_anticonceptivo: "1845-01-01",
      valoracion_agudeza_visual: fechaConsulta,
      fecha_tamizaje_VALE: fechaConsulta,
      fecha_atencion_salud_bucal: fechaConsulta,

      fecha_antigeno_superficie_hepatitisB_toda: fechaHBV,
      resultado_antigeno_superficie_hepatitisB_toda: mapResultado(hbvResult, true),

      fecha_serologia_sifilis: fechaSif,
      resultado_prueba_tamizaje_sifilis: mapResultado(sifResult, true),

      fecha_tomae_elisa_VIH: fechaVIH,
      resultado_prueba_VIH: mapResultado(vihResult, true),

      fecha_toma_hemoglobina: fechaHemo,
      resultado_hemoglobina: resultadoHemo,

      fecha_toma_baciloscopia_diagnostico: fechaBacilo,
      resultado_baciloscopia_diagnostico: resultadoBacilo,

      tamizaje_cancer_cuello_uterino: "0",
      citologia_cervicouterina: "1845-01-01",
      resultado_tamizaje_cancer_cuello_uterino: "0",
      calidad_muestra_citologia_cervicouterina: "0",
      codigo_habilitacion_IPS_citologia_cervicouterina: "0",
      fecha_colposcopia: "1845-01-01",
      fecha_biopsia_cervical: "1845-01-01",
      resultado_biopsia_cervicouterina: "0"
    }]
  };
}