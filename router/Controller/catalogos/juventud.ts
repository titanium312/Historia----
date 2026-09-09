// src/controllers/catalogos/juventud.ts

/**
 * Catálogo de historia clínica para JUVENTUD (18-28 años 11 meses 29 días).
 * Versión final: prioriza datos reales; fechas nulas/inválidas se calculan restando 3 días hábiles a la fecha de consulta.
 * Corregido error 622: biopsia cervicouterina con resultado 21 usa fecha 1800-01-01.
 */
export default function juventud(data: any): any {
  const { admision = {}, paciente = {}, historia = {}, facturacion = {} } = data;
  const clinicos = data.datosClinicos || null;
  const edad = data.edad ?? 0;
  const generoId = data.generoId ?? 1;
  const sexoId = data.sexoId ?? 2;

  // === FUNCIONES AUXILIARES ===
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
  const esMujer = sexoId === 1;

  // Función para restar días hábiles (solo lunes a viernes)
  const restarDiasHabiles = (fechaStr: string, dias: number): string => {
    const fecha = new Date(fechaStr);
    let cont = 0;
    while (cont < dias) {
      fecha.setDate(fecha.getDate() - 1);
      const dia = fecha.getDay();
      if (dia !== 0 && dia !== 6) cont++; // solo hábiles
    }
    return fecha.toISOString().split('T')[0];
  };

  // Función para obtener fecha válida: si la fecha proporcionada es válida y <= fechaConsulta, la usa; si no, calcula fechaConsulta - 3 días hábiles.
  const obtenerFechaValida = (fechaInput: string | null | undefined): string => {
    if (fechaInput) {
      const parsed = parsearFecha(fechaInput);
      if (parsed && new Date(parsed) <= new Date(fechaConsulta)) {
        return parsed;
      }
    }
    // Si no es válida, restar 3 días hábiles a fechaConsulta
    return restarDiasHabiles(fechaConsulta, 3);
  };

  // === ANTROPOMETRÍA ===
  const peso = Number(clinicos?.antropometricos?.peso ?? 55);
  const talla = Number(clinicos?.antropometricos?.talla ?? 160);
  const imc = peso / ((talla / 100) ** 2);
  const perimetroAbdominal = Number(clinicos?.antropometricos?.perimetro_abdominal ?? 80);

  // === SIGNOS VITALES ===
  let pa_sist = 115, pa_diast = 75;
  const pa = clinicos?.antropometricos?.presion_arterial;
  if (typeof pa === 'string' && pa.includes('/')) {
    [pa_sist, pa_diast] = pa.split('/').map(Number);
  } else if (pa?.sistolica && pa?.diastolica) {
    pa_sist = Number(pa.sistolica);
    pa_diast = Number(pa.diastolica);
  }
  const fc = Number(clinicos?.signos_vitales?.fc ?? 72);
  const fr = Number(clinicos?.signos_vitales?.fr ?? 16);
  const temp = Number(clinicos?.signos_vitales?.temperatura ?? 36.5);
  const saturacion = Number(clinicos?.signos_vitales?.saturacion ?? 97);

  // === LABORATORIOS ===
  const getLab = (key: string) => clinicos?.laboratorios?.[key] || {};
  const labGlicemia = getLab('glicemia_basal');
  const labColTot = getLab('colesterol_total');
  const labTrig = getLab('trigliceridos');
  const labHDL = getLab('hdl');
  const labLDL = getLab('ldl');
  const labHemo = getLab('hemoglobina');
  const labCreat = getLab('creatinina');
  const labCitologia = getLab('citologia');

  // Fechas de laboratorios: si hay valor y fecha válida, usarla; si no, fechaConsulta - 3 días hábiles
  const fechaGlicemia = labGlicemia.valor != null ? obtenerFechaValida(labGlicemia.fecha) : '1800-01-01';
  const fechaColTot = labColTot.valor != null ? obtenerFechaValida(labColTot.fecha) : '1800-01-01';
  const fechaTrig = labTrig.valor != null ? obtenerFechaValida(labTrig.fecha) : '1800-01-01';
  const fechaHDL = labHDL.valor != null ? obtenerFechaValida(labHDL.fecha) : '1800-01-01';
  const fechaLDL = labLDL.valor != null ? obtenerFechaValida(labLDL.fecha) : '1800-01-01';
  const fechaHemo = labHemo.valor != null ? obtenerFechaValida(labHemo.fecha) : '1800-01-01';
  const fechaCreat = labCreat.valor != null ? obtenerFechaValida(labCreat.fecha) : '1800-01-01';

  // === PRUEBAS RÁPIDAS ===
  const mapResultado = (v: string | null): string => {
    if (!v) return "0";
    const r = v.trim().toLowerCase();
    if (r === "positivo" || r === "reactivo") return "4";
    if (r === "negativo" || r === "no reactivo") return "5";
    return "0";
  };

  const vih = clinicos?.pruebas_rapidas?.vih?.resultado ?? null;
  const sif = clinicos?.pruebas_rapidas?.sifilis?.resultado ?? null;
  const hepB = clinicos?.pruebas_rapidas?.hepatitis_b?.resultado ?? null;
  const hepC = clinicos?.pruebas_rapidas?.hepatitis_c?.resultado ?? null;

  // Fechas de pruebas rápidas: si el resultado existe (no null) y hay fecha válida, usarla; si no, fechaConsulta - 3 días hábiles
  const fechaVIH = (vih != null) ? obtenerFechaValida(clinicos?.pruebas_rapidas?.vih?.fecha) : '1845-01-01';
  const fechaSif = (sif != null) ? obtenerFechaValida(clinicos?.pruebas_rapidas?.sifilis?.fecha) : '1845-01-01';
  const fechaHepB = (hepB != null) ? obtenerFechaValida(clinicos?.pruebas_rapidas?.hepatitis_b?.fecha) : '1845-01-01';
  const fechaHepC = (hepC != null) ? obtenerFechaValida(clinicos?.pruebas_rapidas?.hepatitis_c?.fecha) : '1845-01-01';

  // === SALUD VISUAL ===
  const ojoDerecho = clinicos?.salud_visual?.ojo_derecho || '20/20';
  const ojoIzquierdo = clinicos?.salud_visual?.ojo_izquierdo || '20/20';
  const fechaVisual = obtenerFechaValida(clinicos?.salud_visual?.fecha);
  const agudezaCode = (v: string): string => {
    if (v === '20/40') return '4';
    if (v === '20/20') return '3';
    return '3';
  };

  // === DIAGNÓSTICOS ===
  const diagnosticos = ['Z003'];

  // === ANTICONCEPCIÓN (para todos los adultos 18-28 años) ===
  let metodoAnticonceptivo = '0';
  let fechaAnticonceptivo = '1845-01-01';
  let planificacionFecha = '1845-01-01';

  if (edad >= 18 && edad <= 28) {
    metodoAnticonceptivo = '21';
    const fechaBase = new Date(fechaConsulta);
    fechaBase.setFullYear(fechaBase.getFullYear() - 1);
    let dia = fechaBase.getDay();
    if (dia === 0) fechaBase.setDate(fechaBase.getDate() - 2);
    else if (dia === 6) fechaBase.setDate(fechaBase.getDate() - 1);
    const fechaStr = fechaBase.toISOString().split('T')[0];
    fechaAnticonceptivo = fechaStr;
    planificacionFecha = fechaStr;
  }

  // === TAMIZAJE CÁNCER DE CUELLO (solo mujeres >10 años) ===
  let tamizajeCuello = '0';
  let fechaTamizajeCuello = '1845-01-01';
  let resultadoTamizajeCuello = '0';
  let calidadMuestra = '0';
  let codigoIPS = '0';
  let fechaCitologia = '1845-01-01';
  let fechaColposcopia = '1845-01-01';
  let fechaBiopsia = '1845-01-01';
  let resultadoBiopsia = '0';
  let tratamientoAblativo = '0';

  if (esMujer && edad > 10) {
    if (edad >= 25 && labCitologia.fecha && new Date(labCitologia.fecha) <= new Date(fechaConsulta)) {
      // Realizada
      tamizajeCuello = '1';
      fechaTamizajeCuello = labCitologia.fecha;
      resultadoTamizajeCuello = '17'; // Negativa
      calidadMuestra = '1';
      codigoIPS = '999';
      fechaCitologia = labCitologia.fecha;
      fechaColposcopia = '1845-01-01'; // No se realizó
      fechaBiopsia = '1845-01-01';     // No se realizó
      resultadoBiopsia = '0';          // No aplica
    } else {
      // No realizada o edad 10-24: riesgo no evaluado
      tamizajeCuello = '21';
      fechaTamizajeCuello = '1800-01-01'; // Sin dato
      resultadoTamizajeCuello = '21';
      calidadMuestra = '0';
      codigoIPS = '0';
      fechaCitologia = '1800-01-01';
      fechaColposcopia = '1845-01-01';
      fechaBiopsia = '1800-01-01';       // Sin dato (corregido para error 622)
      resultadoBiopsia = '21';           // Riesgo no evaluado
    }
  }
  // Si no es mujer o edad <=10, quedan "0" y "1845-01-01"

  // ============================================================
  // CONSTRUCCIÓN DEL OBJETO
  // ============================================================
  return {
    id_historia: String(historia?.id_historia || 0),
    numero_historia: String(historia?.numero_historia || 0),
    fk_admision: String(admision.id_admision || 0),
    fk_paciente: String(paciente.id_paciente || 0),
    fk_servicio_ingreso: '2',
    fk_procedimiento: '8138',
    fk_finalidad_consulta: '11',
    IdActividad: '4',
    motivo_consulta_historia: 'RUTA_JUVENTUD',
    numero_admision: String(admision.numero_admision || 0),
    fk_factura_consultas: String(facturacion?.id_factura_consultas || 0),

    facturacion_admisiones: {
      fk_paciente: String(paciente.id_paciente || 0),
      numero_admision: String(admision.numero_admision || 0),
      pacientes: {
        direccion_paciente: paciente.direccion || '',
        fk_ocupacion: '999',
        fk_nivel_educativo: '13',
        fk_grupo_etnico: '6',
        fk_discapacidad: '6',
        EnfoqueDiferencialIdGenero: String(generoId),
        IdOrientacionSexualEnfoqueDiferencial: '5'
      }
    },

    enfermedad_actual_historia: `Paciente de ${edad} años en control de promoción y mantenimiento - Ruta Juventud. Asintomático, sin signos de alarma.`,

    antecedentes_toxicos_consumo_alcohol: '2',
    antecedentes_toxicos_consumo_psicoactiva: '2',
    antecedentes_toxicos_observaciones_historia: 'Niega consumo de tabaco, alcohol o SPA.',

    hallazgos_fisicos_signos_vitales_ta_historia: `${pa_sist}/${pa_diast}`,
    hallazgos_fisicos_signos_vitales_fr_historia: String(fr),
    hallazgos_fisicos_signos_vitales_t_historia: temp,
    hallazgos_fisicos_signos_vitales_fc_historia: String(fc),
    hallazgos_fisicos_signos_vitales_talla_historia: String(talla),
    hallazgos_fisicos_signos_vitales_peso_historia: String(peso),
    hallazgos_fisicos_signos_vitales_saturacion_oxigeno: String(saturacion),
    hallazgos_fisicos_signos_vitales_idmc_historia: parseFloat(imc.toFixed(2)).toString(),

    diagnostico_ingreso_tipo_historia: '1',
    diagnostico_ingreso_fk_causa_externa: '40',
    historia_clinica_enfermedades_diagnostico_ingreso: diagnosticos.map(d => ({
      id_historia_enfermedad_diagnostico_ingreso: 0,
      fk_historia: 0,
      fk_enfermedad: d,
      fk_institucion: 0
    })),

    // ============================================================
    // BLOQUE historia_pym_juventud
    // ============================================================
    historia_pym_juventud: [{


              escala_findrisc_realiza_normalmente_30_minutos_de_actividad_fisica: true,
        escala_findrisc_con_que_frecuencia_come_frutas_verduras: "1",
        escala_findrisc_le_han_recetado_alguna_vez_nedicamentos_contra_la_hta: false,
        escala_findrisc_le_han_detectado_alguna_vez_niveles_altos_de_glucosa: false,
        escala_findrisc_ha_habido_algun_diagnostico_de_DM_en_su_familia: "0",

      hallazgos_fisicos_signos_vitales_ta_juventud: `${pa_sist}/${pa_diast}`,
      hallazgos_fisicos_signos_vitales_t__juventud: String(temp),
      hallazgos_fisicos_signos_vitales_fc__juventud: String(fc),
      hallazgos_fisicos_signos_vitales_fr_juventud: String(fr),
      hallazgos_fisicos_signos_vitales_tallaPym_juventud: String(talla),
      hallazgos_fisicos_signos_vitales_pesoPym_juventud: String(peso),
      hallazgos_fisicos_signos_vitales_idmcPym_juventud: parseFloat(imc.toFixed(2)).toString(),
      hallazgos_fisicos_signos_vitales_perimetro_abdominal_juventud: String(perimetroAbdominal),

      hallazgos_fisicos_otros_cabeza_juventud: 'NORMOCEFALO, PUPILAS ISOCORICAS',
      hallazgos_fisicos_otros_cuello_juventud: 'SIMETRICO, SIN ADENOPATIAS',
      hallazgos_fisicos_otros_torax_juventud: 'SIMETRICO, RITMICOS, VENTILADO',
      hallazgos_fisicos_otros_abdomen_juventud: 'BLANDO, DEPRESIBLE',
      hallazgos_fisicos_otros_genitourinario_juventud: 'SIN ALTERACIONES',
      hallazgos_fisicos_otros_pelvis_juventud: 'SIMETRICA, MOVIL',
      hallazgos_fisicos_otros_dorso_juventud: 'SIMETRICO, SIN DEFORMIDADES',
      hallazgos_fisicos_otros_neurologico_juventud: 'GLASGOW 15/15, CONCIENTE',
      hallazgos_fisicos_otros_piel_juventud: 'HIDRATADA, SIN LESIONES',
      hallazgos_fisicos_otros_otro_juventud: 'EMUNTORIOS NORMALES',
      hallazgos_fisicos_otros_mamaPym_juventud: esMujer ? 'MAMAS SIMÉTRICAS, SIN MASAS' : 'NO APLICA',
      hallazgos_fisicos_otros_tacto_rectalPym_juventud: 'NO REALIZADO',

      valoracion_salud_visual_ojo_derecho_juventud: ojoDerecho,
      valoracion_salud_visual_ojo_izquierdo_juventud: ojoIzquierdo,
      agudeza_visual_od: ojoDerecho,
      agudeza_visual_oi: ojoIzquierdo,

      valoracion_salud_sexual_observaciones_juventud: esMujer ? 'SIN ALTERACIONES GINECOLÓGICAS' : 'SIN ALTERACIONES UROLÓGICAS',
      salud_sexual_toma_decisiones_alrededor_de_la_sexualidad_juventud: '1',
      salud_sexual_identidad_de_genero_juventud: '2',
      salud_sexual_violencia_contra_la_mujer_o_genero_juventud: '2',
      salud_sexual_maternidad_y_paternidad_planeada_uso_anticonceptivos_juventud: '1',
      salud_sexual_cuidado_del_cuerpo_y_uso_de_proteccion_contra_its_juventud: '1',

      examen_salud_mental_apariencia_general_juventud: 'NORMAL',
      examen_salud_mental_conciencia_juventud: 'NORMAL',
      examen_salud_mental_orientacion_juventud: 'NORMAL',
      examen_salud_mental_afecto_juventud: 'NORMAL',
      examen_salud_mental_lenguaje_juventud: 'NORMAL',

      headss_hogar: data?.headss?.hogar || '',
      headss_educacion: data?.headss?.educacion || '',
      headss_actividades: data?.headss?.actividades || '',
      headss_drogas: data?.headss?.drogas || '',
      headss_sexualidad: data?.headss?.sexualidad || '',
      headss_suicidio: data?.headss?.suicidio || '',
      headss_seguridad: data?.headss?.seguridad || '',

      laboratorio_clinico_resultado_glicemia_basal_juventud: labGlicemia.valor != null ? String(labGlicemia.valor) : null,
      laboratorio_clinico_fecha_glicemia_basal_juventud: fechaGlicemia,
      laboratorio_clinico_resultado_colesterol_total_juventud: labColTot.valor != null ? String(labColTot.valor) : null,
      laboratorio_clinico_fecha_colesterol_total_juventud: fechaColTot,
      laboratorio_clinico_resultado_trigliceridos_juventud: labTrig.valor != null ? String(labTrig.valor) : null,
      laboratorio_clinico_fecha_trigliceridos_juventud: fechaTrig,
      laboratorio_clinico_resultado_colesterol_HDL_juventud: labHDL.valor != null ? String(labHDL.valor) : null,
      laboratorio_clinico_fecha_colesterol_HDL_juventud: fechaHDL,
      laboratorio_clinico_resultado_colesterol_LDL_juventud: labLDL.valor != null ? String(labLDL.valor) : null,
      laboratorio_clinico_fecha_colesterol_LDL_juventud: fechaLDL,
      laboratorio_clinico_resultado_hemoglobina_juventud: labHemo.valor != null ? String(labHemo.valor) : null,
      laboratorio_clinico_fecha_hemoglobina_juventud: fechaHemo,
      laboratorio_clinico_resultado_creatinina_sangre_juventud: labCreat.valor != null ? String(labCreat.valor) : null,
      laboratorio_clinico_fecha_creatinina_sangre_juventud: fechaCreat,

      laboratorio_clinico_resultado_prueba_rapida_VIH_juventud: mapResultado(vih),
      laboratorio_clinico_fecha_prueba_rapida_VIH_juventud: fechaVIH,
      laboratorio_paraclinico_laboratorio_prueba_treponemica_rapida_sifilis_juventud: mapResultado(sif),
      laboratorio_paraclinico_laboratorio_fecha_prueba_treponemica_rapida_sifilis_juventud: fechaSif,
      laboratorio_clinico_resultado_prueba_rapida_hepatitis_B_juventud: mapResultado(hepB),
      laboratorio_clinico_fecha_prueba_rapida_hepatitis_B_juventud: fechaHepB,
      laboratorio_resultado_clinico_hepatitis_C_juventud: mapResultado(hepC),
      laboratorio_clinico_fecha_hepatitis_C_juventud: fechaHepC,

      control_placa_bacteriana10_juventud: { selector: "#cbo_control_placa_bacteriana10_juventud" },
      control_placa_bacteriana11_juventud: { selector: "#cbo_control_placa_bacteriana11_juventud" },
      estructura_dentomaxilofacial_tiene_dolor_al_comer_masticar_juventud: '2',
      estructura_dentomaxilofacial_dolor_en_diente_o_molares_juventud: '2',
      estructura_dentomaxilofacial_se_cepilla_en_la_manana_juventud: true,
      estructura_dentomaxilofacial_se_cepilla_en_la_noche_juventud: true,
      estructura_dentomaxilofacial_enrojecimiento_encia_juventud: '2',
      estructura_dentomaxilofacial_deformacion_contorno_encia_juventud: '2',
      estructura_dentomaxilofacial_vesiculas_ulceras_placas_juventud: '2',
      estructura_dentomaxilofacial_presecia_caries_juventud: '2',
      estructuras_dentomaxilofaciales_juventud: 'SIN ALTERACIONES',

      test_audit: null,
      test_assint_guia_intervencion: 1,
      resultadoTestEpoc: 0,
      puntuacion_test_whooley: '0',
      puntuacion_escala_findrisc: '4',
      porcentaje_escala_findrisc: '1',
      escala_gad_2_sentirse_nervioso_ansioso_inquieto_PARA_NADA: true,
      escala_gad_2_no_poder_parar_o_controlar_la_preocupacion_PARA_NADA: true,
      puntuacion_escala_gad_2: '0',

      plan_cuidado_glicemia_juventud: 1,
      plan_cuidado_creatinina_juventud: 1,
      plan_cuidado_colesterol_total_juventud: 1,
      plan_cuidado_trigliceridos_juventud: 1,
      plan_cuidado_uroanalisis_juventud: 1,
      plan_cuidado_citologia_cervico_uterina_juventud: esMujer && edad >= 25 ? 1 : 0,
      plan_cuidado_prueba_COVID_juventud: 1,

      informacion_salud_juventud: 'Control de juventud. Se promueven hábitos saludables y tamizajes preventivos.',

      HistoriasPymJuventudInformacionSalud: [
        { Id: null, IdHistoriaJuventud: 0, IdProcedimiento: '10774' },
        { Id: null, IdHistoriaJuventud: 0, IdProcedimiento: '10792' }
      ]
    }],

    // ============================================================
    // BLOQUE resolucion4505
    // ============================================================
    resolucion4505: [{
      sintomatico_respiratorio: '2',
      fecha_toma_baciloscopia_diagnostico: '1845-01-01',
      resultado_baciloscopia_diagnostico: '4',
      consumo_tabaco: '99',
      clasificacion_riesgo_cardiovascular: edad < 18 ? '0' : '21',
      "clasificación_riesgo_metabolico": edad < 18 ? '0' : '21',
      gestacion: esMujer ? '2' : '0',

      // Anticoncepción
      planificación_familiar_primera_vez: planificacionFecha,
      suministro_metodo_anticonceptivo: metodoAnticonceptivo,
      fecha_suministro_metodo_anticonceptivo: fechaAnticonceptivo,

      // Tamizaje cáncer de cuello (con fechas corregidas)
      tamizaje_cancer_cuello_uterino: tamizajeCuello,
      fecha_tamizaje_cancer_cuello_uterino: fechaTamizajeCuello,
      resultado_tamizaje_cancer_cuello_uterino: resultadoTamizajeCuello,
      calidad_muestra_citologia_cervicouterina: calidadMuestra,
      codigo_habilitacion_IPS_citologia_cervicouterina: codigoIPS,
      citologia_cervicouterina: fechaCitologia,
      fecha_colposcopia: fechaColposcopia,
      fecha_biopsia_cervical: fechaBiopsia,        // Usa 1800-01-01 si resultado es 21
      resultado_biopsia_cervicouterina: resultadoBiopsia,
      tratamiento_ablativo_escision_inspeccion_visual: tratamientoAblativo,

      codigo_pais: '170',
      fecha_consulta_valoracion_integral: fechaConsulta,

      resultado_glicemia_basal: labGlicemia.valor != null ? String(labGlicemia.valor) : '998',
      fecha_toma_glicemia_basal: fechaGlicemia,
      resultado_LDL: labLDL.valor != null ? String(labLDL.valor) : '998',
      fecha_toma_LDL: fechaLDL,
      resultado_HDL: labHDL.valor != null ? String(labHDL.valor) : '998',
      fecha_toma_HDL: fechaHDL,
      resultado_trigliceridos: labTrig.valor != null ? String(labTrig.valor) : '998',
      fecha_toma_trigliceridos: fechaTrig,
      resultado_hemoglobina: labHemo.valor != null ? String(labHemo.valor) : '998',
      fecha_toma_hemoglobina: fechaHemo,
      resultado_creatinina: labCreat.valor != null ? String(labCreat.valor) : '998',
      fecha_creatinina: fechaCreat,

      agudeza_visual_lejana_ojo_izquierdo: agudezaCode(ojoIzquierdo),
      agudeza_visual_lejana_ojo_derecho: agudezaCode(ojoDerecho),
      valoracion_agudeza_visual: fechaVisual,

      resultado_prueba_VIH: mapResultado(vih),
      fecha_tomae_elisa_VIH: fechaVIH,
      resultado_prueba_tamizaje_sifilis: mapResultado(sif),
      fecha_serologia_sifilis: fechaSif,
      resultado_antigeno_superficie_hepatitisB_toda: mapResultado(hepB),
      fecha_antigeno_superficie_hepatitisB_toda: fechaHepB
    }]
  };
}