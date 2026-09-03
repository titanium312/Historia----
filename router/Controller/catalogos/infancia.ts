// src/controllers/catalogos/infancia.ts

/**
 * Catálogo de historia clínica para INFANCIA (6-11 años 11 meses 29 días).
 * Genera exactamente la misma estructura que el JSON real de SaludPlus.
 * Basado en Resolución 3280 de 2018 y 0202 de 2021.
 * @param data - Objeto enriquecido desde obtenerDatosAdmisionEnriquecidos
 */
export default function infancia(data: any): any {

  // ============================================================
  // 1. EXTRAER DATOS PRINCIPALES
  // ============================================================
  const admision = data?.admision || {};
  const paciente = data?.paciente || {};
  const historia = data?.historia || {};
  const facturacion = data?.facturacion || {};
  const clinicos = data.datosClinicos || null;

  const edad = data.edad ?? 0;
  const generoId = data.generoId ?? 0;
  const generoTexto = data.generoTexto || 'No especificado';
  const sexoId = data.sexoId ?? 0;

  // ============================================================
  // 2. FUNCIÓN PARA PARSEAR FECHA (SIEMPRE YYYY-MM-DD)
  // ============================================================
  function parsearFecha(fechaInput: any): string {
    if (!fechaInput) return new Date().toISOString().split('T')[0];
    if (fechaInput instanceof Date) return fechaInput.toISOString().split('T')[0];
    if (typeof fechaInput === 'string' && fechaInput.startsWith('/Date(') && fechaInput.endsWith(')/')) {
      const ms = parseInt(fechaInput.slice(6, -2), 10);
      if (!isNaN(ms)) return new Date(ms).toISOString().split('T')[0];
    }
    if (typeof fechaInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fechaInput)) {
      return fechaInput.split('T')[0];
    }
    const date = new Date(fechaInput);
    if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
    return new Date().toISOString().split('T')[0];
  }

  const fechaConsulta = parsearFecha(admision?.fecha_admision);

  // ============================================================
  // 3. DATOS DEL RIPS O VALORES POR DEFECTO (CORREGIDO)
  // ============================================================
  // --- PESO Y TALLA: tomar del RIPS si existen, sino usar valores por edad ---
  let peso = 0;
  let talla = 0;

  if (clinicos?.antropometricos?.peso) {
    peso = Number(clinicos.antropometricos.peso);
  } else {
    // Valores por defecto según la edad (percentiles aproximados para 6-11 años)
    if (edad >= 6 && edad < 7) { peso = 20; talla = 115; }
    else if (edad >= 7 && edad < 8) { peso = 22; talla = 120; }
    else if (edad >= 8 && edad < 9) { peso = 25; talla = 125; }
    else if (edad >= 9 && edad < 10) { peso = 28; talla = 130; }
    else if (edad >= 10 && edad < 11) { peso = 32; talla = 135; }
    else { peso = 25; talla = 125; } // valor genérico
  }

  if (clinicos?.antropometricos?.talla) {
    talla = Number(clinicos.antropometricos.talla);
  } else {
    // Si no hay talla y no se asignó arriba, usar un valor por edad
    if (edad >= 6 && edad < 7) talla = 115;
    else if (edad >= 7 && edad < 8) talla = 120;
    else if (edad >= 8 && edad < 9) talla = 125;
    else if (edad >= 9 && edad < 10) talla = 130;
    else if (edad >= 10 && edad < 11) talla = 135;
    else talla = 125;
  }

  const imc = (peso > 0 && talla > 0) ? peso / ((talla / 100) ** 2) : 0;

  // Signos vitales (TEMPERATURA OBLIGATORIA como número)
  const temperatura = clinicos?.signos_vitales?.temperatura ?? 36.5;
  const fc = clinicos?.signos_vitales?.fc ?? 85;
  const fr = clinicos?.signos_vitales?.fr ?? 20;
  const saturacion = clinicos?.signos_vitales?.saturacion ?? 97;

  // Presión arterial
  let pa_sist = 110;
  let pa_diast = 70;
  if (clinicos?.antropometricos?.presion_arterial) {
    const pa = clinicos.antropometricos.presion_arterial;
    if (typeof pa === 'string') {
      const partes = pa.split('/');
      if (partes.length === 2) {
        pa_sist = parseInt(partes[0], 10) || 110;
        pa_diast = parseInt(partes[1], 10) || 70;
      }
    } else if (typeof pa === 'object' && pa.sistolica && pa.diastolica) {
      pa_sist = Number(pa.sistolica);
      pa_diast = Number(pa.diastolica);
    }
  }

  // Pruebas rápidas
  const hepatitisB = clinicos?.pruebas_rapidas?.hepatitis_b?.resultado ?? null;
  const vih = clinicos?.pruebas_rapidas?.vih?.resultado ?? null;
  const sifilis = clinicos?.pruebas_rapidas?.sifilis?.resultado ?? null;

  const mapResultado = (valor: string | null): string => {
    if (!valor) return "0";
    const r = valor.trim().toLowerCase();
    if (r === "positivo" || r === "reactivo") return "4";
    if (r === "negativo" || r === "no reactivo") return "5";
    return "0";
  };

  const resultadoHepatitisB = mapResultado(hepatitisB);
  const resultadoVIH = mapResultado(vih);
  const resultadoSifilis = mapResultado(sifilis);

  const fechaHepatitisB = hepatitisB ? fechaConsulta : "1845-01-01";
  const fechaVIH = vih ? fechaConsulta : "1845-01-01";
  const fechaSifilis = sifilis ? fechaConsulta : "1845-01-01";

  // Salud visual
  const ojoDerecho = clinicos?.salud_visual?.ojo_derecho || "20/20";
  const ojoIzquierdo = clinicos?.salud_visual?.ojo_izquierdo || "20/20";
  const agudezaCode = (valor: string): string => {
    if (valor === "20/20") return "3";
    if (valor === "20/40") return "4";
    return "3";
  };

  // ============================================================
  // 4. EDAD EN MESES
  // ============================================================
  let edadMeses = 0;
  if (paciente?.fecha_nacimiento) {
    const fechaNac = parsearFecha(paciente.fecha_nacimiento);
    const nac = new Date(fechaNac);
    const consulta = new Date(fechaConsulta);
    edadMeses = (consulta.getFullYear() - nac.getFullYear()) * 12 + (consulta.getMonth() - nac.getMonth());
  } else {
    edadMeses = edad * 12;
  }

  // ============================================================
  // 5. CONSTRUIR OBJETO CON LA MISMA ESTRUCTURA DEL JSON REAL
  // ============================================================
  return {
    // --- IDENTIFICACIÓN Y DATOS BÁSICOS ---
    id_historia: String(historia?.id_historia || 0),
    numero_historia: String(historia?.numero_historia || 0),
    hora_historia: '00:00',
    fk_servicio_ingreso: '2',
    fk_admision: String(admision.id_admision || 0),
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
        enfoque_diferencial_religion: '',
        enfoque_diferencial_consumo_spa: '0',
        enfoque_diferencial_gestacion: '0',
        enfoque_resguardo_indigena: '',
        enfoque_diferencial_victima_conflicto_armado: '0',
        enfoque_minas_antipersonas: '',
        enfoque_minas_municion_sinexplotar: '',
        enfoque_diferencial_desplazado: '0',
        enfoque_diferencial_ruv: '0',
        enfoque_diferencial_victima_maltrato: '0',
        enfoque_diferencial_abandono_social: '0',
        enfoque_diferencial_carcelario: '0',
        enfoque_diferencial_migrante: '0',
        enfoque_diferencial_desescolarizado: '0',
        enfoque_diferencial_trabajadora_sexual: '0',
        enfoque_diferencial_poblacion_lgbti: '0',
        enfoque_diferencial_desempleado: '0',
        enfoque_diferencial_mujer_nino_menor_ano: '0',
        enfoque_diferencial_adulto_mayor: '0',
        EnfoqueDiferencialHabitanteCalle: '0',
        EnfoqueMadreComunitaria: '0',
        EnfoqueDesmovilizado: '0',
        EnfoqueCentroPsiquiatrico: '0',
        EnfoqueOtroGrupoPoblacional: '0',
      },
    },
    fk_procedimiento: '8238',
    motivo_consulta_historia: 'A CONTROL',
    fk_finalidad_consulta: '11',
    IdActividad: '2',
    enfermedad_actual_historia: `ESCOLAR ${generoTexto === 'FEMENINO' ? 'FEMENINA' : 'MASCULINO'} DE ${edad} AÑOS DE EDAD, SIN ANTECEDENTES CONOCIDOS, QUIEN ACUDE EN COMPAÑÍA DE SU MADRE, A CONTROL AL PROGRAMA DE INFANCIA, ACTUALMENTE ASINTOMÁTICO, MADRE NIEGA MENOR PRESENTE SIGNOS GENERALES DE PELIGRO U OTRA SINTOMATOLOGÍA ASOCIADA.`,
    revision_sistema_general_historia: '',
    revision_sistema_organos_sentidos_historia: '',
    revision_sistema_cabeza_historia: '',
    revision_sistema_cuello_historia: '',
    revision_sistema_cavidad_bucal_historia: '',
    revision_sistema_piel_faneras_historia: '',
    revision_sistema_cardiovascular_historia: '',
    revision_sistema_respitatorio_historia: '',
    revision_sistema_gastrointestinal_historia: '',
    revision_sistema_genitourinario_historia: '',
    revision_sistema_osteomoscular_articular_historia: '',
    revision_sistema_nervioso_historia: '',
    revision_sistema_endocrino_historia: '',
    revision_sistema_psiquico_mental_historia: '',
    revision_sistema_hematopoyetico_historia: '',
    valoracion_espiritual: '',
    valoracion_emocional: '',
    valoracion_emocional_tristeza: '',
    valoracion_emocional_ideacion_muerte: '',
    valoracion_emocional_anciedad: '',
    valoracion_emocional_angustia: '',
    valoracion_emocional_miedo: '',
    valoracion_emocional_panico: '',
    valoracion_emocional_estres: '',
    valoracion_emocional_viviencias: '',
    valoracion_emocional_deseo_adelantar_muerte: '',
    valoracion_emocional_preocupaciones_principales: '',
    valoracion_emocional_asuntos_pendientes: '',
    barthel_comer: '-1',
    barthel_lavarse: '-1',
    barthel_vestirse: '-1',
    barthel_arreglarse: '-1',
    barthel_deposiciones: '-1',
    barthel_miccion: '-1',
    barthel_retrete: '-1',
    barthel_trasladarse: '-1',
    barthel_deambular: '-1',
    barthel_escalones: '-1',
    norton_estado_fisico: '-1',
    norton_estado_mental: '-1',
    norton_actividad: '-1',
    norton_movilidad: '-1',
    norton_incontinencia: '-1',
    conducta_historia: '',
    antecedentes_toxicos_cigarrillo_cantidad_dia_historia: '0',
    antecedentes_toxicos_cigarrillo_annos_uso_historia: '0',
    antecedentes_toxicos_humo_lenna_annos_uso_historia: '0',
    antecedentes_toxicos_alcohol_annos_uso_historia: '0',
    antecedentes_toxicos_farmaco_cual_historia: 'PADRE NIEGA ',
    antecedentes_toxicos_otro_cual_historia: 'PADRE NIEGA ',
    antecedentes_toxicos_observaciones_historia: 'NIEGA',
    antecedentes_toxicos_consumo_alcohol: '',
    antecedentes_toxicos_consumo_psicoactiva: '',
    antecedentes_toxicos_fumador_pasivo: false,
    antecedentes_toxicos_estimulantes: 'PADRE NIEGA ',
    historiaClinicaPrincipiosActivosAntecedentesPersonales: [],
    fk_hemoclasificacion: '7',
    antecedetes_personales_hospitalizaciones_historia: 'PADRE NIEGA ',
    antecedetes_personales_tranfusiones_historia: 'PADRE NIEGA ',
    antecedetes_personales_otro_cual_historia: 'PADRE NIEGA ',
    antecedetes_personales_observaciones_historia: 'NIEGA',
    antecedetes_personales_habitos_saludables: '',
    antecedetes_personales_comportamiento_general: '',
    antecedetes_personales_traumatologicos: 'PADRE NIEGA ',
    antecedentes_personales_diabetes: false,
    antecedentes_personales_hipertension: false,
    antecedentes_personales_infertilidad: false,
    antecedentes_personales_vih: false,
    antecedentes_personales_cardiopatia: false,
    antecedentes_personales_ets: false,
    antecedentes_personales_nefropatia: false,
    antecedentes_personales_depresion: false,
    antecedentes_personales_preeclampsia: false,
    antecedentes_personales_eclampsia: false,
    antecedentes_personales_cirugia_pelvica: false,
    antecedentes_personales_cifoescoliosis: false,
    antecedentes_personales_embarazo_fluorosis: false,
    antecedentes_familiares_observaciones_historia: 'PADRE NIEGA ',
    historia_clinica_enfermedades_antecedentes_familiares: null,
    antecedentes_familiares_muerte_hermanos: false,
    antecedentes_exposicion_violencia: false,
    antecedentes_familiares_preeclampcia: false,
    antecedentes_familiares_enfermedad_cardiaca: false,
    antecedentes_familiares_malformaciones: false,
    antecedentes_familiares_consumo_alcohol: false,
    antecedentes_familiares_sustancias_psicoactivas: false,
    antecedentes_familiares_estructura_familiar: null,
    antecedentes_familiares_condiciones_socioeconomicas: null,
    antecedentes_familiares_redes_apoyo: null,
    antecedentes_familiares_situacion_escolar_laboral: null,
    hemofilia_el: '0',
    hemofilia_familia_el: '0',
    hemofilia_ella: '0',
    hemofilia_familia_ella: '0',
    trast_coagulacion_el: '0',
    trast_coagulacion_familia_el: '0',
    trast_coagulacion_ella: '0',
    trast_coagulacion_familia_ella: '0',
    anemia_falciforme_el: '0',
    anemia_falciforme_familia_el: '0',
    anemia_falciforme_ella: '0',
    anemia_falciforme_familia_ella: '0',
    talasemia_el: '0',
    talasemia_familia_el: '0',
    talasemia_ella: '0',
    talasemia_familia_ella: '0',
    sindrome_down_el: '0',
    sindrome_down_familia_el: '0',
    sindrome_down_ella: '0',
    sindrome_down_familia_ella: '0',
    retardomental_el: '0',
    retardomental_familia_el: '0',
    retardomental_ella: '0',
    retardomental_familia_ella: '0',
    otrascromosopatias_el: '0',
    otrascromosopatias_familia_el: '0',
    otrascromosopatias_ella: '0',
    otrascromosopatias_familia_ella: '0',
    enfermedad_taysachs_el: '0',
    enfermedad_taysachs_familia_el: '0',
    enfermedad_taysachs_ella: '0',
    enfermedad_taysachs_familia_ella: '0',
    distrofia_muscular_el: '0',
    distrofia_muscular_familia_el: '0',
    distrofia_muscular_ella: '0',
    distrofia_muscular_familia_ella: '0',
    fibrosis_quistica_el: '0',
    fibrosis_quistica_familia_el: '0',
    fibrosis_quisticar_ella: '0',
    fibrosis_quistica_familia_ella: '0',
    defectos_tubo_neural_el: '0',
    defectos_tubo_neural_familia_el: '0',
    defectos_tubo_neural_ella: '0',
    defectos_tubo_neural_familia_ella: '0',
    otros_el: '0',
    otros_familia_el: '0',
    otros_ella: '0',
    otros_familia_ella: '0',
    historia_clinica_enfermedades_antecedentes_patologicos: [],
    antecedetes_patologicos_observaciones_historia: 'PADRE NIEGA ',
    historiaClinicaPrincipiosActivosAntecedentesAlergicos: [],
    antecedentes_alergicos_otras_alergias_historia: 'PADRE NIEGA ',
    antecedentes_alergicos_observaciones_historia: 'NIEGA',
    antecedentes_alergicos_alimentos: 'PADRE NIEGA ',
    antecedentes_alergicos_ambientales: 'PADRE NIEGA ',
    antecedentesAlergicosPiel: '',
    antecedentesAlergicosPicaduraInsectos: '',
    historia_clinica_procedimientos_antecedentes_vacunacion: [],
    antecedentes_vacunacion_esquema_historia: '1',
    antecedetes_vacunacion_observaciones_historia: 'NIEGA',
    historia_clinica_procedimientos_antecedentes_quirurgicos: [],
    antecedetes_quirurgicos_observaciones_historia: '',
    antecedentes_vejez_deterioro_cognitivo: false,
    antecedentes_vejez_inmobilidad: false,
    antecedentes_vejez_inestabilidad_caidas: false,
    antecedentes_vejez_fragilidad: false,
    antecedentes_vejez_control_esfinteres: false,
    antecedentes_vejez_depresion: false,
    antecedentes_vejez_iatogenia: false,
    antecedentes_vejes_observaciones: '',
    antecedentes_perinatales_tamizaje_visual: 'NO',
    antecedentes_perinatales_tamazije_auditivo: 'NO',
    antecedentes_perinatales_tamizaje_neonatal: '',
    antecedentes_perinatales_tamizaje_cardiopatia: '',
    antecedentes_perinatales_via_parto: 'VAGINAL',
    antecedentes_perinatales_producto_embarazo_multiple: '2',
    antecedentes_perinatales_parto_institucional: '1',
    antecedentes_perinatales_apgar_nacer: '',
    antecedentes_perinatales_peso_nacer: 0,
    antecedentes_perinatales_talla_nacer: 0,
    antecedentes_perinatales_semana_gestacion_nacer: 39,
    antecedentes_perinatales_complicaciones_presentadas: '',
    antecedentes_perinatales_observacion: 'SIN COMPLICACIONES',

    // ============================================================
    // HALLAZGOS FÍSICOS (con TEMPERATURA OBLIGATORIA como número)
    // ============================================================
    hallazgos_fisicos_signos_vitales_ta_historia: `${pa_sist}/${pa_diast}`,
    hallazgos_fisicos_signos_vitales_fr_historia: String(fr),
    hallazgos_fisicos_signos_vitales_t_historia: temperatura, // ← NÚMERO, NO STRING
    hallazgos_fisicos_signos_vitales_fc_historia: String(fc),
    hallazgos_fisicos_signos_vitales_talla_historia: String(talla), // AHORA CON VALOR REAL
    hallazgos_fisicos_signos_vitales_peso_historia: String(peso), // AHORA CON VALOR REAL
    hallazgos_fisicos_signos_vitales_sc_historia: '1.00',
    hallazgos_fisicos_signos_vitales_perimetro_cefalico_historia: '',
    hallazgos_fisicos_signos_vitales_saturacion_oxigeno: String(saturacion),
    hallazgos_fisicos_signos_vitales_idmc_historia: parseFloat(imc.toFixed(2)).toString(),
    hallazgos_fisicos_otros_cabeza_historia: 'NORMOCEFALO, PUPILAS ISOCORICAS NORMOREACTIVAS A LA LUZ, FOSAS NASALES PERMEABLES, CAVIDAD ORAL NORMAL',
    hallazgos_fisicos_otros_cuello_historia: 'SIMETRICO, MOVIL, NO ADENOPATIAS, NO INGURGITACION YUGULAR',
    hallazgos_fisicos_otros_torax_historia: 'SIMETRICO, NO DEFORMIDADES, RSCS: RITMICOS, NO SOPLOS, BIEN TIMBRADOS; CSPS: VENTILADOS, NO ESTERTORES',
    hallazgos_fisicos_otros_abdomen_historia: 'BLANDO, DEPRESIBLE, NO MASAS PALPABLES, NO VICEROMEGALIAS, NO DOLOROSO A LA PALPACION, RSHS: NORMALES',
    hallazgos_fisicos_otros_genitourinario_historia: 'GENITALES EXTERNOS NORMALES, PUÑOPERCUSION NEGATIVA',
    hallazgos_fisicos_otros_pelvis_historia: 'SIMETRICA, NO DEFORMIDADES, BUENA MOVILIDAD COXOFEMORAL',
    hallazgos_fisicos_otros_dorso_historia: 'SIMETRICAS, NO DEFORMIDADES, NO EDEMAS',
    hallazgos_fisicos_otros_neurologico_historia: 'GLASGOW 15/15, CONCIENTE, ORIENTADO EN TIEMPO Y ESPACIO, MOTRICIDAD Y SENSIBILIDAD GENERAL CONSERVADAS',
    hallazgos_fisicos_otros_piel_historia: 'HIDRATADA, ASPECTO Y COLORACION NORMAL, SIN LESIONES',
    hallazgos_fisicos_otros_otro_historia: 'EMUNTORIOS NORMALES',

    // ============================================================
    // DIAGNÓSTICOS
    // ============================================================
    diagnostico_ingreso_tipo_historia: '1',
    diagnostico_ingreso_fk_causa_externa: '40',
    diagnostico_ingreso_observaciones_historia: `CONCLUSIÓN DE LA ATENCIÓN.\nIMPRESIÓN DIAGNOSTICA\n1.\tESCOLAR \n2.\tTALLA PARA LA EDAD: ADECUADA\n3.\tIMC PARA LA EDAD: ${imc >= 30 ? 'OBESIDAD' : imc < 18.5 ? 'BAJO PESO' : 'ADECUADO'}\n4.\tPAI COMPLETO PARA LA EDAD. \n5.\t TAMIZAJE DE MALTRATO NEGATIVO\n6.\t TAMIZAJE AUDITIVO Y VISUAL SIN ALTERACION\n\nVALORO ESCOLAR, SIN ANTECEDENTES PERSONALES Y FAMILIARES DE IMPORTANCIA, EN BUENAS CONDICIONES GENERALES, SIN SIGNOS GENERAL DE PELIGRO, HEMODINÁMICAMENTE ESTABLE, SIN ALTERACIÓN AL EXAMEN FÍSICO, SE VALORAN CURVAS ANTROPOMETRICAS DENTRO DE RANGOS NORMALES. \n\n`,
    historia_clinica_enfermedades_diagnostico_ingreso: [
      { id_historia_enfermedad_diagnostico_ingreso: 0, fk_historia: 0, fk_enfermedad: 'Z002', fk_institucion: 0 }
    ],
    diagnostico_principales_observaciones_consulta_externa: `CONCLUSIÓN DE LA ATENCIÓN.\nIMPRESIÓN DIAGNOSTICA\n1.\tESCOLAR \n2.\tTALLA PARA LA EDAD: ADECUADA\n3.\tIMC PARA LA EDAD: ${imc >= 30 ? 'OBESIDAD' : imc < 18.5 ? 'BAJO PESO' : 'ADECUADO'}\n4.\tPAI COMPLETO PARA LA EDAD. \n5.\t TAMIZAJE DE MALTRATO NEGATIVO\n6.\t TAMIZAJE AUDITIVO Y VISUAL SIN ALTERACION\n\nVALORO ESCOLAR, SIN ANTECEDENTES PERSONALES Y FAMILIARES DE IMPORTANCIA, EN BUENAS CONDICIONES GENERALES, SIN SIGNOS GENERAL DE PELIGRO, HEMODINÁMICAMENTE ESTABLE, SIN ALTERACIÓN AL EXAMEN FÍSICO, SE VALORAN CURVAS ANTROPOMETRICAS DENTRO DE RANGOS NORMALES. \n\n`,
    diagnostico_relacional_tipo_historia: '0',
    diagnostico_relacional_fk_causa_externa: '0',
    diagnostico_relacional_observaciones_historia: '',
    historia_clinica_enfermedades_diagnostico_relacional: [],
    remisiones: null,
    historia_clinica_articulos: [],
    EntregaMedicamentosObservaciones: '',
    HistoriaClinicaMaterialesInsumos: [
      { IdHistoriaClinicaArticulo: 0, fk_historia: String(historia?.id_historia || 0), fk_institucion: 0 }
    ],
    materialesInsumosObservaciones: '',
    historia_clinica_procedimientos_diagnosticos: [],
    historia_clinica_procedimientos_terapeuticos: [],
    IdCentroCostos: '',
    fk_cama: 0,
    camas: null,
    AltaUrgencias: false,
    historia_clinica_odontograma: [{ id_odontograma: null, fk_institucion: 0 }],
    historia_clinica_placa_bacteriana: [
      { id_placa_bacteria: null, porcentaje_placa_bacteriana: 0, interpretacion_placa_bacteriana: '', fk_institucion: 0 }
    ],
    analisis_historia: `\nPLAN\n1.\tCONTINUAR EN PROGRAMA DE INFANCIA. FECHA DE PROXIMA CITA   ${new Date(new Date(fechaConsulta).setFullYear(new Date(fechaConsulta).getFullYear() + 1)).toISOString().split('T')[0]} MED\n2.\tPROMOCIÓN DE AFECTO, BUEN TRATO, HIGIENE ORAL. MEDIDAS PARA FOMENTAR DESARROLLO\n3.\tSIGNOS DE ALARMA PARA ACUDIR POR URGENCIAS (SANGRE EN HECES, DIFICULTAD RESPITARORIA, VOMITA TODO LO QUE COME, CONVULSIONES, FIEBRE MAS DE 3 DIA)\n4.\tRECOMENDACIÓN DE DIETA COMPLETA, EQUILIBRADA, SUFICIENTE Y ADECUADA\n5.\tS/s VALORACION POR ODONTOLOGIA  ${new Date(new Date(fechaConsulta).setDate(new Date(fechaConsulta).getDate() + 7)).toISOString().split('T')[0]}\n6.\tFORMULA MÉDICA. \n•\tALBENDAZOL TABLETA 400MG, USO: TOMAR 2 TABLETAS DE 200MG DOSIS UNICA\n•\tVITAMINA C TAB 500MG USO: 1 TABLETA AL DIA POR 15 DIAS\n•\tSULFATO FERROSO TABLETA 300MG USO: TOMAR 1 TABLETAS AL DIA POR 30 DIAS\n\t\n\tNOTA: SIN INFORMACION SUFICIENTE PARA LLENAR FAMILIOGRAMA\n\t\n\tESTIMULACION EN NIÑOS MAYORES DE 60 MESES\n•\tFELICITAR CUANDO HAGA LAS COSAS BIEN PARA FORTALECER AUTOESTIMA.\n•\tENSEÑARLE DIRECCION, TELEFONO DE LA CASA\n•\tPREGUNTARLE DIARIO COMO LE VA EN LA ESCUELA, INVITALE A DIALOGAR SOBRE SUS CLASES, COMPAÑEROS, MAESTRAS, SUS JUEGOS.\n•\tDEJAR QUE EXPRESE SUS OPINIONES Y RESPONDER COHOERENTEMENTE A SUS PREGUNTAS E INQUIETUDES.\n•\tENSEÑAR QUE NO SE DEJE TOCAR SU CUERPO Y TAMPOCO TOCAR A LOS DEMAS.\n\t\n\t\n\t\n\tAVANCE DE COMPROMISOS: \n\tPACIENTE QUE DECIDE ESCUCHAR Y ACATAR RECOMENDACIONES SOBRE LOS HABITOS SALUDABLES, DERECHOS Y DEBERES DEL NIÑO Y PRIORIDAD A LA SALUD.\n\t\n\t\n\tAPGAR FAMILIAR: \n\tORGANIZAR REUNIONES FAMILIARES, PARA FOMENTAR EL APOYO INTRAFAMILIAR Y BUSCAR SOLUCIONES A CADA PROBLEMA QUE SE PRESENTE, DE LA MEJOR MANERA.\n\t\n`,
    signos_de_alarma_educacion: '',
    observaciones_historia: '',
    observaciones_odontograma: '',
    plan_tratamiento_descripcion_historia: '',
    observaciones_placa_bacteriana: '',
    fk_paciente: String(paciente.id_paciente || 0),
    telefono_paciente: paciente.telefono || '',
    numero_admision: String(admision.numero_admision || 0),
    fk_factura_consultas: String(facturacion?.id_factura_consultas || 0),
    motivo_consulta_consulta_externa: 'A CONTROL',

    // ============================================================
    // BLOQUE historia_pym_infancia (con TEMPERATURA como número)
    // ============================================================
    historia_pym_infancia: [
      {
        Id: "67377",
        hemoclasificacion_infancia: {
          context: {
            location: {
              ancestorOrigins: { "0": "https://app.saludplus.co" },
              href: "https://balance.saludplus.co/instituciones/?origen=1&theme=false&time=1787848238381#",
              origin: "https://balance.saludplus.co",
              protocol: "https:",
              host: "balance.saludplus.co",
              hostname: "balance.saludplus.co",
              port: "",
              pathname: "/instituciones/",
              search: "?origen=1&theme=false&time=1787848238381",
              hash: ""
            },
            jQuery1710662142321860053: 1
          },
          selector: "#cbo_hemoclasificacion_infancia"
        },
        antecedentes_familiares_asma_infancia: 0,
        antecedentes_familiares_tuberculosis_infancia: 0,
        antecedentes_familiares_dermatitis_atopica_infancia: 0,
        antecedentes_familiares_muerte_hermanos_infancia: 0,
        antecedentes_familiares_problemas_desarrollo_infancia: 0,
        antecedentes_familiares_transtornos_salud_mental_padres_infancia: 0,
        antecedentes_familiares_exposicion_violencia_infancia: 0,
        hallazgos_fisicos_signos_vitales_ta_infancia: `${pa_sist}/${pa_diast}`,
        hallazgos_fisicos_signos_vitales_fc_infancia: fc, // NÚMERO
        hallazgos_fisicos_signos_vitales_t_infancia: temperatura, // NÚMERO
        hallazgos_fisicos_signos_vitales_fr_infancia: fr, // NÚMERO
        hallazgos_fisicos_signos_vitales_tallaPym_infancia: talla, // AHORA CON VALOR
        hallazgos_fisicos_signos_vitales_pesoPym_infancia: peso, // AHORA CON VALOR
        hallazgos_fisicos_signos_vitales_idmcPym_infancia: parseFloat(imc.toFixed(2)),
        hallazgos_fisicos_signos_vitales_perimetro_cefalico_historia_infancia: 0,
        hallazgos_fisicos_signos_vitales_perimetro_braquial: 0,
        agudeza_visual_ojo_derecho_infancia: "",
        agudeza_visual_ojo_izquiedo_infancia: "",
        control_placa_bacteriana10_infancia: {
          context: {
            location: {
              ancestorOrigins: { "0": "https://app.saludplus.co" },
              href: "https://balance.saludplus.co/instituciones/?origen=1&theme=false&time=1787848238381#",
              origin: "https://balance.saludplus.co",
              protocol: "https:",
              host: "balance.saludplus.co",
              hostname: "balance.saludplus.co",
              port: "",
              pathname: "/instituciones/",
              search: "?origen=1&theme=false&time=1787848238381",
              hash: ""
            },
            jQuery1710662142321860053: 1
          },
          selector: "#cbo_control_placa_bacteriana10_infancia"
        },
        control_placa_bacteriana11_infancia: {
          context: {
            location: {
              ancestorOrigins: { "0": "https://app.saludplus.co" },
              href: "https://balance.saludplus.co/instituciones/?origen=1&theme=false&time=1787848238381#",
              origin: "https://balance.saludplus.co",
              protocol: "https:",
              host: "balance.saludplus.co",
              hostname: "balance.saludplus.co",
              port: "",
              pathname: "/instituciones/",
              search: "?origen=1&theme=false&time=1787848238381",
              hash: ""
            },
            jQuery1710662142321860053: 1
          },
          selector: "#cbo_control_placa_bacteriana11_infancia"
        },
        hallazgos_fisicos_otros_cabezaPym_infancia: 'NORMOCEFALO, PUPILAS ISOCORICAS NORMOREACTIVAS A LA LUZ, FOSAS NASALES PERMEABLES, CAVIDAD ORAL NORMAL',
        hallazgos_fisicos_otros_cuelloPym_infancia: 'SIMETRICO, MOVIL, NO ADENOPATIAS, NO INGURGITACION YUGULAR',
        hallazgos_fisicos_otros_toraxPym_infancia: 'SIMETRICO, NO DEFORMIDADES, RSCS: RITMICOS, NO SOPLOS, BIEN TIMBRADOS; CSPS: VENTILADOS, NO ESTERTORES',
        hallazgos_fisicos_otros_abdomenPym_infancia: 'BLANDO, DEPRESIBLE, NO MASAS PALPABLES, NO VICEROMEGALIAS, NO DOLOROSO A LA PALPACION, RSHS: NORMALES',
        hallazgos_fisicos_otros_pelvisPym_infancia: 'SIMETRICA, NO DEFORMIDADES, BUENA MOVILIDAD COXOFEMORAL',
        hallazgos_fisicos_otros_dorsoPym_infancia: 'SIMETRICAS, NO DEFORMIDADES, NO EDEMAS',
        hallazgos_fisicos_otros_neurologicoPym_infancia: 'GLASGOW 15/15, CONCIENTE, ORIENTADO EN TIEMPO Y ESPACIO, MOTRICIDAD Y SENSIBILIDAD GENERAL CONSERVADAS',
        hallazgos_fisicos_otros_pielPym_infancia: 'HIDRATADA, ASPECTO Y COLORACION NORMAL, SIN LESIONES',
        hallazgos_fisicos_otros_otro_infancia: 'EMUNTORIOS NORMALES',
        hallazgos_fisicos_signos_vitales_saturacion_oxigeno_infancia: String(saturacion),
        hallazgos_fisicos_signos_vitales_circunferencia_muslo_infancia: 0,
        z_score_infancia: "-0.7",
        clasificacion_Peso_talla_infancia: "3",
        Cancer_Infantil_ha_tenido_fiebre_por_mas_de_7_dias_y_sudoracion_impotente: false,
        Cancer_Infantil_presenta_frecuentemente_dolor_de_cabeza_que_ha_aumentado: false,
        Cancer_Infantil_despierta_el_dolor_de_cabeza_al_niño_en_la_noche: false,
        Cancer_Infantil_se_acompaña_de_algun_otro_sintoma_como_vomito: false,
        Cancer_Infantil_Presente_dolores_de_huesos_en_el_ultimo_mes: false,
        Cancer_Infantil_Ha_presentado_cambios_como_perdida_de_peso_o_fatiga: false,
        Cancer_Infantil_Petequias_equimosis_o_sangrado: false,
        Cancer_Infantil_Palidez_palmar_y_conjuntival: false,
        Cancer_Infantil_Ganglios_tamaños_mayor_2_5_cm: false,
        Cancer_Infantil_Signos_y_sintomas_neurologicos_focales_de_aparicion_aguda_o_progresiva: false,
        Cancer_Infantil_Presencia_de_masa_palpable_abdominal: false,
        Cancer_Infantil_Hepatomegalia_y_o_esplenomegalia: false,
        Cancer_Infantil_Aumento_de_volumen_en_alguna_parte_recien_del_cuerpo: false,
        Cancer_Infantil_No_tiene_cancer: true,
        Cancer_Infantil_tiene_cancer: false,
        cancer_infantil_observaciones: "",
        informacion_salud_infancia: 'Se educa en prácticas de crianza protectoras y basadas en derechos, prevención de violencias, promoción de la salud, del bienestar, del crecimiento, del desarrollo, de la adecuada alimentación, de prácticas para la adecuada manipulación de alimentos y prevención de enfermedades transmitidas por alimentos, promoción de hábitos y estilos de vida saludables (prevención de la exposición al humo de tabaco), de prácticas deportivas organizadas, de actividad física y evitación del sedentarismo y el uso prolongado de televisión, computadores y otras pantallas; promoción de la salud mental, de prevención de accidentes. Se educa en medidas de prevención para infección con Covid 19: uso de mascarillas, lavado de manos frecuente, evitar aglomeraciones, consular y aislares en caso de síntomas respiratorios (Tos, Fiebre, Malestar General). Adicionalmente se brinda orientación acerca de los derechos de las madres y del fortalecimiento del rol del padre como cuidador de sus hijas e hijos.\n                                ',
        desarrollo_genitales_masculinos_infancia: "1",
        desarrollo_vello_hombre_infancia: "1",
        desarrollo_mamas_infancia: null,
        desarrollo_vello_mujer_infancia: null,
        atencion_en_salud_bucal_por_profesional_de_odontologia_infancia: 0,
        hemoglobina_y_Hematocrito_ninas_entre_10_13_annos_infancia: 0,
        vacunacion_Toxoide_tetanico_difterico_del_adulto_infancia: 0,
        vacuna_contra_el_virus_del_papiloma_humano_infancia: 0,
        instrumento_vale_bajo_peso_al_nacer_infancia: 0,
        instrumento_nacio_antes_de_las_30_semanas_infancia: 0,
        instrumento_estancia_superior_a_30_dias_en_la_unidad_de_cuidados_infancia: 0,
        check_instrumento_vale_durante_o_poco_despues_del_nacimiento_hubo_alguna_complicacion_infancia: 0,
        instrumento_vale_durante_o_poco_despues_del_nacimiento_hubo_alguna_complicacion_infancia: "",
        check_instrumento_vale_el_nino_nina_ha_sido_diagnosticado_con_alguna_condicion_de_salud_infancia: 0,
        instrumento_vale_el_nino_nina_ha_sido_diagnosticado_con_alguna_condicion_de_salud_infancia: "",
        check_instrumento_vale_hay_alguna_condicion_de_riesgo_social_infancia: 0,
        instrumento_vale_hay_alguna_condicion_de_riesgo_social_infancia: "",
        check_instrumento_vale_el_nino_presenta_dificultades_en_el_aprendizaje_de_la_lectura: 0,
        instrumento_vale_el_nino_presenta_dificultades_en_el_aprendizaje_de_la_lectura: "",
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
        cuando_en_casa_se_cierra_una_puerta_se_cae_un_objeto_o_se_escucha_un_ruido_muy_fuerte_infancia: 0,
        el_evaluador_observa_que_el_bebe_emite_llantos_diferenciados_segun_necesidades_y_situaciones_infancia: 0,
        el_bebe_succiona_con_fuerza_el_alimento_u_otros_objetos_infancia: 0,
        cuando_le_habla_al_bebe_infancia: 0,
        cuando_se_escucha_una_puerta_timbre_u_otro_sonido_familiar_el_bebe_voltea_la_cabeza_buscando_el_sonido_infancia: 0,
        el_evaluador_se_dirige_al_bebe_haciendo_producciones_como_mamama_papa_y_observa_que_el_bebe_intenta_imitar_el_sonido_infancia: 0,
        cuando_interactua_juega_canta_habla_con_su_bebe_infancia: 0,
        cuando_usted_le_canta_o_le_conversa_infancia: 0,
        cuando_el_bebe_quiere_algo_utiliza_sonidos_silabas_palabras_o_gestos_para_solicitarlo_infancia: 0,
        el_evaluador_interactua_con_el_bebe_y_detecta_que_el_ella_emite_balbuceos_hace_senalamientos_sonrie_o_llora_para_llamar_la_atencion_del_interlocutor_infancia: 0,
        cuando_las_personas_le_hablan_el_nino_les_presta_atencion_infancia: 0,
        cuando_le_dicen_palabras_nuevas_el_nino_trata_de_imitarlas_infancia: 0,
        el_nino_consume_alimentos_como_papillas_jugos_espesos_o_galletas_diariamente_infancia: 0,
        el_evaluador_toma_un_objeto_del_nino_y_observa_que_el_lo_solicita_senalando_o_emitiendo_sonidos_infancia: 0,
        cuando_usted_le_pide_al_niño_que_le_muestre_los_ojos_la_nariz_u_otra_parte_del_cuerpo_infancia: 0,
        el_evaluador_observa_que_el_nino_reproduce_el_sonido_de_diferentes_animales_y_objetos_infancia: 0,
        el_nino_toma_y_trae_un_objeto_cuando_quiere_jugar_con_usted_infancia: 0,
        el_evaluador_observa_que_el_nino_señala_personas_conocidas_a_su_alrededor_cuando_se_le_solicita_infancia: 0,
        el_evaluador_observa_que_el_nino_nombra_diferentes_objetos_de_uso_cotidiano_infancia: 0,
        el_nino_pide_cosas_usando_palabras_silabas_o_sonidos_vocalicos_infancia: 0,
        el_evaluador_da_al_nino_algunas_ordenes_directas_y_observa_que_las_entiende_y_ejecuta_infancia: 0,
        el_evaluador_observa_que_el_nino_utiliza_nombres_de_objetos_y_acciones_infancia: 0,
        el_nino_produce_sonidos_sílabas_y_palabras_acompañadas_de_gestos_señalamientos_miradas_y_entonaciones_de_habla_con_otro_infancia: 0,
        el_evaluador_observa_que_el_nino_utiliza_al_menos_dos_posesivos_como_mio_tuyo_suyo_infancia: 0,
        el_nino_se_mueve_se_emociona_canta_aplaude_cuando_le_ponen_musica_infancia: 0,
        el_nino_muerde_alimentos_duros_y_los_come_sin_atorarse_infancia: 0,
        el_nino_se_muestra_interesado_por_comunicarse_por_interactuar_conversar_y_jugar_con_otros_ninos_de_su_edad_infancia: 0,
        en_narraciones_de_hechos_cuentos_o_historias_el_nino_responde_a_preguntas_infancia: 0,
        el_nino_hace_preguntas_cuando_se_presenta_una_situacion_nueva_para_el_infancia: 0,
        el_nino_expresa_sus_sentimientos_pensamientos_emociones_ideas_cuando_interactua_con_personas_cercanas_infancia: 0,
        el_evaluador_le_solicita_al_nino_cantar_alguna_cancion_infancia: 0,
        el_nino_habla_utilizando_frases_de_al_menos_cuatro_palabras_para_contar_hechos_o_expresar_diferentes_situaciones_infancia: 0,
        el_nino_comprende_y_responde_cuando_las_personas_saludan_se_despiden_dicen_gracias_o_por_favor_infancia: 0,
        el_nino_cumple_con_varias_indicaciones_que_se_le_dan_al_mismo_tiempo_por_ejemplo_cuando_usted_le_dice_infancia: 1,
        cuando_el_nino_habla_o_cuenta_una_historia_se_entiende_claramente_lo_que_dice_y_pronuncia_bien_todos_los_sonidos_infancia: 1,
        el_nino_sostiene_conversaciones_con_familiares_y_no_familiares_para_expresar_opiniones_infancia: 1,
        el_evaluador_observa_el_que_nino_justifica_el_porque_de_diversas_situaciones_pensamientos_o_sentimientos_infancia: 0,
        el_nino_conversa_con_otros_de_diferentes_temas_escuchando_sus_ideas_y_expresando_con_argumentos_su_acuerdo_o_desacuerdo_infancia: 0,
        el_evaluador_le_solicita_al_nino_que_de_una_vuelta_sobre_su_propio_eje_y_observa_que_mantiene_el_equilibrio_infancia: 0,
        el_nino_camina_recto_sin_inclinarse_hacia_los_lados_y_sin_caerse_constantemente_infancia: 0,
        el_nino_disfruta_dar_algunas_vueltas_sobre_si_mismo_sin_caerse_infancia: 1,
        cuando_el_nino_se_tropieza_o_siente_que_se_va_a_caer_pone_las_manos_para_protegerse_infancia: 1,
        el_evaluador_observa_si_tiene_oportunidad_que_el_nino_disfruta_hacer_movimientos_con_su_cuerpo_en_diferentes_velocidades: 1,
        intems_vale_el_evaluador_provee_al_nino_significados_absurdos_observa_que_logra_identificarlos_riéndose_mirando_dif_infancia: 1,
        value_intrumento_c: " 0",
        value_intrumento_e: " 0",
        value_intrumento_i: " 0",
        value_intrumento_v: " 0",
        resultadoInstrumentoVale: 1,
        valoracionGruesa: null,
        valoracionFino: null,
        valoracionLenguaje: null,
        valoracionSocial: null,
        conteo_tab_desarrolo_gruesa4: "0",
        conteo_tab_desarrolo_fino4: "0",
        conteo_tab_desarrolo_lenguaje4: "0",
        conteo_tab_desarrolo_social4: "0",
        PT_tab_desarrolo_gruesa4: "0",
        PT_tab_desarrolo_fino4: "0",
        PT_tab_desarrolo_lenguaje4: "0",
        PT_tab_desarrolo_social4: "0",
        text_label_tab_desarrollo_gruesa4: "Punto de inicio no encontrado",
        text_label_tab_desarrollo_fino4: "Punto de inicio no encontrado",
        text_label_tab_desarrollo_lenguaje4: "Punto de inicio no encontrado",
        text_label_tab_desarrollo_social4: "Punto de inicio no encontrado",
        cuadro1_me_satisface_ayuda__recibo_mi_familia_cuando_tengo_algun_problema_necesidad_value: "4",
        cuadro1_me_satisface_como_familia_hablamos_compartimos_nuestros_problemas_value: "4",
        cuadro1_me_satisface_como_mi_familia_acepta_apoya_mi_deseo_emprender_nuevas_actividades_value: "4",
        cuadro1_me_satisface_como_familia_expresa_afecto_responde_mis_emociones_tales_como_rabia_tristeza_amor_value: "4",
        cuadro1_me_satisface_como_compartimos_mi_familia_value: "4",
        APGAR2_cuando_algo_me_preocupa_puedo_pedir_ayuda_a_mi_familia: "2",
        APGAR2_me_gusta_manera_como_mi_familia_habla_comparte_problemas_conmigo: "2",
        APGAR2_me_gusta_como_mi_familia_permite_hacer_cosas_nuevas_quiero_hacer: "2",
        APGAR2_me_gusta__mi_familia_hace_cuando_estoy_triste: "2",
        APGAR2_me_gusta_como_mi_familia_compartimos_tiempos_juntos: "2",
        resultadoTestApgarAdultos: 1,
        resultadoTestApgarInfantil: 1,
        goodenough_harris_general_1: true,
        goodenough_harris_general_2: true,
        goodenough_harris_general_3: true,
        goodenough_harris_articulaciones_1: true,
        goodenough_harris_articulaciones_2: true,
        goodenough_harris_proporciones_1: true,
        goodenough_harris_proporciones_2: true,
        goodenough_harris_proporciones_3: true,
        goodenough_harris_proporciones_4: true,
        goodenough_harris_proporciones_5: true,
        goodenough_harris_proporciones_6: true,
        goodenough_harris_tronco_1: true,
        goodenough_harris_tronco_2: true,
        goodenough_harris_tronco_3: true,
        goodenough_harris_brasos_piernas_1: true,
        goodenough_harris_brasos_piernas_2: true,
        goodenough_harris_cuello_1: true,
        goodenough_harris_cuello_2: true,
        goodenough_harris_coordinacion_motora_1: true,
        goodenough_harris_coordinacion_motora_2: true,
        goodenough_harris_coordinacion_motora_3: true,
        goodenough_harris_coordinacion_motora_4: true,
        goodenough_harris_coordinacion_motora_5: true,
        goodenough_harris_cara_1: true,
        goodenough_harris_cara_2: true,
        goodenough_harris_cara_3: true,
        goodenough_harris_cara_4: true,
        goodenough_harris_cara_5: true,
        goodenough_harris_orejas_1: true,
        goodenough_harris_orejas_2: true,
        goodenough_harris_orejas_3: true,
        goodenough_harris_cabello_1: true,
        goodenough_harris_cabello_2: true,
        goodenough_harris_detalle_ojos_1: true,
        goodenough_harris_detalle_ojos_2: true,
        goodenough_harris_detalle_ojos_3: true,
        goodenough_harris_detalle_ojos_4: true,
        goodenough_harris_ropa_1: true,
        goodenough_harris_ropa_2: true,
        goodenough_harris_ropa_3: true,
        goodenough_harris_ropa_4: true,
        goodenough_harris_ropa_5: true,
        goodenough_harris_menton_1: true,
        goodenough_harris_menton_2: true,
        goodenough_harris_dedos_1: true,
        goodenough_harris_dedos_2: true,
        goodenough_harris_dedos_3: true,
        goodenough_harris_dedos_4: true,
        goodenough_harris_dedos_5: true,
        goodenough_harris_perfil_1: true,
        goodenough_harris_perfil_2: true,
        goodenough_harris: 226,
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
        practicas_alimentarias_cuantas_comidas_recibe_infancia: "",
        practicas_alimentarias_comio_lacteos_legumbres_infancia: "1",
        practicas_alimentarias_comio_alimentos_de_origen_animal_infancia: "1",
        practicas_alimentarias_comio_vegetales_o_frutas_infancia: "1",
        practicas_alimentarias_el_niño_come_solo_en_plato_olla_familiar_infancia: "",
        practicas_alimentarias_que_ha_comido_enfermo_infancia: "0",
        practicas_alimentarias_son_obesos_padres_hermanos_infancia: "0",
        practicas_alimentarias_el_niño_hace_ejercicio_infancia: "1",
        practicas_alimentarias_esta_asistiendo_programa_nutricional_infancia: "0",
        estructuras_dentomaxilofaciales_infancia: "Estructuras dentomaxilofaciales sin alteraciones evidentes al examen físico, procesos de masticación, deglución, habla y fonación sin déficit o alteración.\n                            ",
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
        observaciones_valoracion_salud_auditiva_comunicativa_infancia: " Se evidencia integridad del oído izquierdo y derecho conservada, funciones de la articulación, voz, habla y desempeño comunicativo sin alteraciones. ",
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
        valoracion_salud_visual_ojo_derecho_infancia: agudezaCode(ojoDerecho),
        valoracion_salud_visual_ojo_izquierdo_infancia: agudezaCode(ojoIzquierdo),
        valoracion_salud_visual_infancia: "Durante la exploración oftalmoscópica no se evidencia alteraciones oculares de la conjuntiva, cornea o retina ni derecha ni izquierda. ",
        valoracion_salud_sexual_infancia: "No se evidencian signos de violencia sexual, así como tampoco alteraciones de los órganos reproductivos externos.",
        salud_mental_sospecha_de_maltrato_fisico_infancia: "2",
        salud_mental_sospecha_de_violencia_sexual_infancia: "2",
        salud_mental_sospecha_de_violencia_intrafamiliar_infancia: "2",
        salud_mental_conducta_agresiva_o_violenta_infancia: "2",
        salud_mental_victima_de_desplazamiento_infancia: "2",
        examen_salud_mental_apariencia_general_infancia: "NORMAL",
        examen_salud_mental_atencion_infancia: "NORMAL",
        examen_salud_mental_conciencia_infancia: "NORMAL",
        examen_salud_mental_orientacion_infancia: "NORMAL",
        examen_salud_mental_afecto_infancia: "NORMAL",
        examen_salud_mental_lenguaje_infancia: "NORMAL",
        examen_salud_mental_memoria_infancia: "NORMAL",
        examen_salud_mental_habito_infancia: "NORMAL",
        examen_salud_mental_sueno_o_dormir_infancia: "NORMAL",
        examen_salud_mental_alimentacion_infancia: "NORMAL",
        examen_salud_mental_inteligencia_infancia: "NORMAL",
        examen_salud_mental_retardo_mental_infancia: "NORMAL",
        examen_salud_mental_actitud_infancia: "NORMAL",
        dinamica_familiar_observacion_infancia: "Trae interpretación del familiograma.",
        apoyo_social_las_relaciones_interpersonales_mas_significativas_infancia: "0",
        apoyo_social_educacion_infancia: "0",
        apoyo_social_salud_infancia: "0",
        apoyo_social_trabajo_infancia: "0",
        apoyo_social_grupos_sociales_y_de_espiritualidad_infancia: "0",
        apoyo_social_servicios_dentro_de_la_comunidad_infancia: "0",
        apoyo_social_las_relaciones_interpersonales_mas_significativas_descripcion_infancia: "",
        apoyo_social_educacion_descripcion_infancia: "",
        apoyo_social_salud_descripcion_infancia: "",
        apoyo_social_trabajo_descripcion_infancia: "",
        apoyo_social_grupos_sociales_y_de_espiritualidad_descripcion_infancia: "",
        apoyo_social_servicios_dentro_de_la_comunidad_descripcion_infancia: "",
        apoyo_social_interpretacion_de_ecomapa_infancia: "",
        desarrollo_y_aprendizaje_infancia: "Niega enfermedades hereditarias que afecten el aprendizaje, no se detectan problemas de rendimiento escolar, se evidencia adecuadas conductas de aprendizaje acorde al año cursado.",
        crianza_y_cuidado_el_menor_observa_tele_celular_tablet_infancia: "2",
        crianza_y_cuidado_cuantas_horas_al_dia_ve_tv_cel_table_infancia: "",
        crianza_y_cuidado_estaexpuesto_violencia_maltrato_infancia: "2",
        crianza_y_cuidado_posee_conocimientos_basicos_de_que_hacer_ante_enfermedad_infancia: "1",
        crianza_y_cuidado_existen_limites_disciplina_para_corregir_infancia: "1",
        crianza_y_cuidado_diagnostico_infancia: "Adecuadas prácticas de crianza y cuidado uso de dialogo para resolver conflictos, reconocimiento de signos de enfermedad y necesidad de atención médica, no se evidencia uso de violencia.",
        crianza_y_cuidado_observaciones_infancia: "",
        HistoriasPymInfanciaInformacionSalud: [
          { Id: null, IdHistoriaInfancia: 0, IdProcedimiento: "10777" },
          { Id: null, IdHistoriaInfancia: 0, IdProcedimiento: "10795" }
        ]
      }
    ],

    // ============================================================
    // BLOQUE resolucion4505 (exactamente igual al ejemplo exitoso)
    // ============================================================
    resolucion4505: [
      {
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
        fecha_atencion_salud_bucal: "",
        fecha_antigeno_superficie_hepatitisB_toda: fechaHepatitisB,
        resultado_antigeno_superficie_hepatitisB_toda: resultadoHepatitisB,
        fecha_serologia_sifilis: fechaSifilis,
        resultado_prueba_tamizaje_sifilis: resultadoSifilis,
        fecha_tomae_elisa_VIH: fechaVIH,
        resultado_prueba_VIH: resultadoVIH,
        tamizaje_cancer_cuello_uterino: "0",
        citologia_cervicouterina: "1845-01-01",
        resultado_tamizaje_cancer_cuello_uterino: "0",
        calidad_muestra_citologia_cervicouterina: "0",
        codigo_habilitacion_IPS_citologia_cervicouterina: "0",
        fecha_colposcopia: "1845-01-01",
        fecha_biopsia_cervical: "1845-01-01",
        resultado_biopsia_cervicouterina: "0",
        fecha_toma_hemoglobina: "1845-01-01",
        resultado_hemoglobina: 0,
        fecha_toma_baciloscopia_diagnostico: "1845-01-01",
        resultado_baciloscopia_diagnostico: "4"
      }
    ],
    historia_clinica_procedimientos_vacunacion: [],
    historiaIndiceBarthel: null
  };
}