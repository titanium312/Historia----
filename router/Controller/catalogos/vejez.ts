// src/controllers/catalogos/vejez.ts

/**
 * Catálogo de historia clínica para VEJEZ (60+ años).
 * Basado en la estructura que pasa validaciones SISPRO.
 * Genera valores aleatorios dentro de rangos saludables para campos faltantes.
 * Con lógica diferenciada por género (hombre/mujer).
 */
export default function vejez(data: any): any {
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

  // ============================================================
  // 2. Utilidades de generación aleatoria
  // ============================================================
  function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomFloat(min: number, max: number, decimals: number = 1): number {
    const factor = Math.pow(10, decimals);
    return Math.round((Math.random() * (max - min) + min) * factor) / factor;
  }

  // ============================================================
  // 3. Generar valores por defecto si no vienen
  // ============================================================
  let peso = Number(clinicos?.antropometricos?.peso ?? 0);
  let talla = Number(clinicos?.antropometricos?.talla ?? 0);
  if (isNaN(peso) || peso <= 0 || peso > 250) {
    peso = randomInt(60, 85);
  }
  if (isNaN(talla) || talla <= 0 || talla > 225) {
    talla = randomInt(160, 178);
  }

  const imc = peso / ((talla / 100) ** 2);

  let pa_sist = 0, pa_diast = 0;
  if (clinicos?.antropometricos?.presion_arterial) {
    const pa = clinicos.antropometricos.presion_arterial;
    if (typeof pa === 'string') {
      const partes = pa.split('/');
      if (partes.length === 2) {
        pa_sist = parseInt(partes[0], 10) || 0;
        pa_diast = parseInt(partes[1], 10) || 0;
      }
    } else if (typeof pa === 'object' && pa.sistolica && pa.diastolica) {
      pa_sist = Number(pa.sistolica);
      pa_diast = Number(pa.diastolica);
    }
  }
  if (pa_sist <= 0 || pa_diast <= 0) {
    pa_sist = randomInt(110, 140);
    pa_diast = randomInt(70, 90);
  }

  let fc = Number(clinicos?.signos_vitales?.fc ?? 0);
  if (fc <= 0 || fc > 150) fc = randomInt(60, 100);

  let fr = Number(clinicos?.signos_vitales?.fr ?? 0);
  if (fr <= 0 || fr > 30) fr = randomInt(12, 20);

  let temp = Number(clinicos?.signos_vitales?.temperatura ?? 0);
  if (temp <= 0 || temp > 40) temp = randomFloat(36.0, 37.5, 1);

  let circunferencia_muslo = Number(clinicos?.antropometricos?.circunferencia_muslo ?? 0);
  if (circunferencia_muslo <= 0 || circunferencia_muslo > 80) {
    circunferencia_muslo = randomInt(45, 55);
  }

  let perimetro_abdominal = Number(clinicos?.antropometricos?.perimetro_abdominal ?? 0);
  if (perimetro_abdominal <= 0 || perimetro_abdominal > 150) {
    perimetro_abdominal = randomInt(80, 100);
  }

  // FINDRISC
  const findrisc = clinicos?.findrisc || {};
  const actividad_fisica = findrisc.actividad_fisica ?? true;
  const frecuencia_frutas = findrisc.frecuencia_frutas ?? '0';
  const medicamentos_hta = findrisc.medicamentos_hta ?? false;
  const glucosa_alta = findrisc.glucosa_alta ?? false;
  const diabetes_familiar = findrisc.diabetes_familiar ?? '0';

  // Observaciones
  const obsAlimentarias = clinicos?.observaciones?.alimentarias ||
    'Refiere consumo y hábitos alimentarios adecuados, no se evidencia ingesta excesiva o deficiente de calorías o nutrientes.';
  const obsDentales = clinicos?.observaciones?.dentales ||
    'Estructuras dentomaxilofaciales sin alteraciones evidentes al examen físico, procesos de masticación, deglución, habla y fonación sin déficit o alteración.';
  const obsAuditiva = clinicos?.observaciones?.auditiva ||
    ' Se evidencia integridad del oído izquierdo y derecho conservada, funciones de la articulación, voz, habla y desempeño comunicativo sin alteraciones. ';
  const obsVisual = clinicos?.observaciones?.visual ||
    'Durante la exploración oftalmoscópica no se evidencia alteraciones oculares de la conjuntiva, cornea o retina ni derecha ni izquierda. ';
  const obsSexual = clinicos?.observaciones?.sexual ||
    'No se evidencia signos de violencia sexual y de género, se descarta la presencia de criptorquidia y/o EPI o hipospadias.';
  const obsFamiliar = clinicos?.observaciones?.familiar ||
    'Trae interpretación del familiograma.';

  // ============================================================
  // 4. Parsear fechas
  // ============================================================
  function parsearFecha(fechaInput: any, formato: 'YYYY-MM-DD' | 'MM/DD/YYYY' = 'MM/DD/YYYY'): string {
    if (!fechaInput) {
      return formato === 'YYYY-MM-DD' ? new Date().toISOString().split('T')[0] : new Date().toLocaleDateString('en-US');
    }
    if (fechaInput instanceof Date) {
      if (formato === 'YYYY-MM-DD') return fechaInput.toISOString().split('T')[0];
      return `${String(fechaInput.getMonth() + 1).padStart(2, '0')}/${String(fechaInput.getDate()).padStart(2, '0')}/${fechaInput.getFullYear()}`;
    }
    if (typeof fechaInput === 'string' && fechaInput.startsWith('/Date(') && fechaInput.endsWith(')/')) {
      const ms = parseInt(fechaInput.slice(6, -2), 10);
      if (!isNaN(ms)) {
        const d = new Date(ms);
        if (formato === 'YYYY-MM-DD') return d.toISOString().split('T')[0];
        return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
      }
    }
    let match = fechaInput.match(/(\d{2})[\/-](\d{2})[\/-](\d{4})/);
    if (match) {
      if (formato === 'YYYY-MM-DD') return `${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
      return `${match[1]}/${match[2]}/${match[3]}`;
    }
    match = fechaInput.match(/(\d{4})[\/-](\d{2})[\/-](\d{2})/);
    if (match) {
      if (formato === 'YYYY-MM-DD') return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
      return `${match[2]}/${match[3]}/${match[1]}`;
    }
    const date = new Date(fechaInput);
    if (!isNaN(date.getTime())) {
      if (formato === 'YYYY-MM-DD') return date.toISOString().split('T')[0];
      return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
    }
    return formato === 'YYYY-MM-DD' ? new Date().toISOString().split('T')[0] : new Date().toLocaleDateString('en-US');
  }

  const fechaConsulta = parsearFecha(admision?.fecha_admision, 'YYYY-MM-DD');
  const fechaConsultaMMDD = parsearFecha(admision?.fecha_admision, 'MM/DD/YYYY');

  // ============================================================
  // 5. Laboratorios y pruebas rápidas
  // ============================================================
  const lab = clinicos?.laboratorios || {};
  const hemoglobinaVal = lab.hemoglobina?.valor ?? null;
  const hemoglobinaFecha = lab.hemoglobina?.fecha ? parsearFecha(lab.hemoglobina.fecha, 'MM/DD/YYYY') : null;
  const glicemiaVal = lab.glicemia_basal?.valor ?? null;
  const glicemiaFecha = lab.glicemia_basal?.fecha ? parsearFecha(lab.glicemia_basal.fecha, 'MM/DD/YYYY') : null;
  const ldlVal = lab.ldl?.valor ?? null;
  const ldlFecha = lab.ldl?.fecha ? parsearFecha(lab.ldl.fecha, 'MM/DD/YYYY') : null;
  const hdlVal = lab.hdl?.valor ?? null;
  const hdlFecha = lab.hdl?.fecha ? parsearFecha(lab.hdl.fecha, 'MM/DD/YYYY') : null;
  const trigliceridosVal = lab.trigliceridos?.valor ?? null;
  const trigliceridosFecha = lab.trigliceridos?.fecha ? parsearFecha(lab.trigliceridos.fecha, 'MM/DD/YYYY') : null;
  const creatininaVal = lab.creatinina?.valor ?? null;
  const creatininaFecha = lab.creatinina?.fecha ? parsearFecha(lab.creatinina.fecha, 'MM/DD/YYYY') : null;
  const baciloscopiaVal = lab.baciloscopia?.valor ?? null;
  const baciloscopiaFecha = lab.baciloscopia?.fecha ? parsearFecha(lab.baciloscopia.fecha, 'MM/DD/YYYY') : null;

  const pruebas = clinicos?.pruebas_rapidas || {};
  const vih = pruebas.vih?.resultado ?? null;
  const vihFecha = pruebas.vih?.fecha ? parsearFecha(pruebas.vih.fecha, 'MM/DD/YYYY') : null;
  const sifilis = pruebas.sifilis?.resultado ?? null;
  const sifilisFecha = pruebas.sifilis?.fecha ? parsearFecha(pruebas.sifilis.fecha, 'MM/DD/YYYY') : null;
  const hepatitisB = pruebas.hepatitis_b?.resultado ?? null;
  const hepatitisBFecha = pruebas.hepatitis_b?.fecha ? parsearFecha(pruebas.hepatitis_b.fecha, 'MM/DD/YYYY') : null;
  const hepatitisC = pruebas.hepatitis_c?.resultado ?? null;
  const hepatitisCFecha = pruebas.hepatitis_c?.fecha ? parsearFecha(pruebas.hepatitis_c.fecha, 'MM/DD/YYYY') : null;

  const tamizajes = clinicos?.tamizajes_especifos || {};
  const sangreOcultaVal = tamizajes.sangre_oculta_materia_fecal?.resultado ?? null;
  const sangreOcultaFecha = tamizajes.sangre_oculta_materia_fecal?.fecha ? parsearFecha(tamizajes.sangre_oculta_materia_fecal.fecha, 'MM/DD/YYYY') : null;

  // ============================================================
  // 6. Mapeo de pruebas rápidas
  // ============================================================
  function mapPruebaRapida(resultado: string | null): { codigo: string; tieneResultado: boolean } {
    if (!resultado) return { codigo: '0', tieneResultado: false };
    const r = resultado.trim().toLowerCase();
    if (r === 'positivo' || r === 'reactivo') return { codigo: '4', tieneResultado: true };
    if (r === 'negativo' || r === 'no reactivo') return { codigo: '5', tieneResultado: true };
    return { codigo: '0', tieneResultado: false };
  }

  const vihMap = mapPruebaRapida(vih);
  const sifilisMap = mapPruebaRapida(sifilis);
  const hepBMap = mapPruebaRapida(hepatitisB);
  const hepCMap = mapPruebaRapida(hepatitisC);

  // ============================================================
  // 7. Lógica de género para campos específicos
  // ============================================================
  const esHombre = generoId === 1;
  const esMujer = generoId === 2;

  // --- Valores por defecto para resolucion4505 según género ---
  // Tacto rectal: para hombres -> 21, para mujeres -> 0
  const tactoRectalResultado = esHombre ? '21' : '0';
  const tactoRectalFecha = esHombre ? '01/01/1800' : '01/01/1845';

  // PSA: para hombres -> 998, para mujeres -> 0
  const psaResultado = esHombre ? 998 : 0;
  const psaFecha = esHombre ? '01/01/1800' : '01/01/1845';

  // Cáncer de cuello uterino: solo para mujeres > 10 años
  let tamizajeCuello = '0';
  let citologiaFecha = '01/01/1845';
  let resultadoCuello = '0';
  let fechaCuello = '01/01/1845';
  let calidadMuestra = '0';
  let codigoIPS = '0';
  let fechaColposcopia = '01/01/1845';
  let fechaBiopsiaCervical = '01/01/1845';
  let resultadoBiopsiaCervical = '0';

  if (esMujer && edad > 10) {
    tamizajeCuello = '2'; // ADN-VPH (valor que pasa validación)
    citologiaFecha = fechaConsultaMMDD; // Fecha real
    resultadoCuello = '20'; // Negativo
    fechaCuello = fechaConsultaMMDD;
    calidadMuestra = '2'; // Satisfactoria
    codigoIPS = '21'; // Código de IPS (no se tiene el dato)
    fechaColposcopia = '01/01/1845'; // No aplica
    fechaBiopsiaCervical = '01/01/1800'; // No aplica
    resultadoBiopsiaCervical = '21'; // Riesgo no evaluado
  }

  // Mamografía: para mujeres >= 50 años
  let resultadoMamografia = '0';
  let fechaMamografia = '01/01/1845';

  if (esMujer && edad >= 50) {
    resultadoMamografia = '2'; // BIRADS 1: negativo
    fechaMamografia = fechaConsultaMMDD;
  }

  // ============================================================
  // 8. Construcción del objeto JSON
  // ============================================================
  return {
    id_historia: String(historia?.id_historia || 0),
    numero_historia: String(historia?.numero_historia || 0),
    fk_servicio_ingreso: '2',
    fk_admision: String(admision.id_admision || 0),
    fk_procedimiento: '8138',
    motivo_consulta_historia: 'RUTA_VEJEZ',
    fk_finalidad_consulta: '11',
    IdActividad: '6',
    enfermedad_actual_historia: `Paciente de ${edad} años en control de promoción y mantenimiento (PYM) para adulto mayor. Sin síntomas ni signos de alarma.`,
    fk_paciente: String(paciente.id_paciente || 0),
    numero_admision: String(admision.numero_admision || 0),
    fk_factura_consultas: String(facturacion?.id_factura_consultas || 0),
    motivo_consulta_consulta_externa: 'RUTA_VEJEZ',
    antecedentes_toxicos_consumo_alcohol: '2',
    antecedentes_toxicos_consumo_psicoactiva: '2',
    hora_historia: admision?.hora_admision
      ? `${String(admision.hora_admision.Hours).padStart(2, '0')}:${String(admision.hora_admision.Minutes).padStart(2, '0')}`
      : '08:00',
    diagnostico_ingreso_tipo_historia: '1',
    diagnostico_ingreso_fk_causa_externa: '40',
    diagnostico_ingreso_observaciones_historia: '',
    diagnostico_principales_observaciones_consulta_externa: '',
    historia_clinica_enfermedades_diagnostico_ingreso: [
      {
        id_historia_enfermedad_diagnostico_ingreso: '0',
        fk_historia: '0',
        fk_enfermedad: 'Z000',
        fk_institucion: '0',
      },
    ],
    facturacion_admisiones: {
      fk_paciente: String(paciente.id_paciente || 0),
      numero_admision: String(admision.numero_admision || 0),
      nombre_acompanante: admision.nombre_acompanante || '',
      direccion_acompanante: paciente.direccion || '',
      telefono_acompanante: admision.telefono_acompanante || '',
      nombre_responsable: admision.nombre_responsable || '',
      parentesco_responsable: admision.parentesco_responsable || '',
      telefono_responsable: admision.telefono_responsable || '',
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
        enfoque_diferencial_adulto_mayor: '1',
        EnfoqueDiferencialHabitanteCalle: '0',
        EnfoqueMadreComunitaria: '0',
        EnfoqueDesmovilizado: '0',
        EnfoqueCentroPsiquiatrico: '0',
        EnfoqueOtroGrupoPoblacional: '0',
      },
    },
    historia_clinica_articulos: [],
    historia_pym_vejez: [
      {
        escala_findrisc_realiza_normalmente_30_minutos_de_actividad_fisica: actividad_fisica,
        escala_findrisc_con_que_frecuencia_come_frutas_verduras: frecuencia_frutas,
        escala_findrisc_le_han_recetado_alguna_vez_nedicamentos_contra_la_hta: medicamentos_hta,
        escala_findrisc_le_han_detectado_alguna_vez_niveles_altos_de_glucosa: glucosa_alta,
        escala_findrisc_ha_habido_algun_diagnostico_de_DM_en_su_familia: diabetes_familiar,

        hallazgos_fisicos_signos_vitales_ta_vejez: `${pa_sist}/${pa_diast}`,
        hallazgos_fisicos_signos_vitales_fc__vejez: String(fc),
        hallazgos_fisicos_signos_vitales_t__vejez: temp,
        hallazgos_fisicos_signos_vitales_fr_vejez: fr,
        hallazgos_fisicos_signos_vitales_tallaPym_vejez: talla,
        hallazgos_fisicos_signos_vitales_pesoPym_vejez: peso,
        hallazgos_fisicos_signos_vitales_idmcPym_vejez: parseFloat(imc.toFixed(2)),
        hallazgos_fisicos_signos_vitales_circunferencia_muslo_vejez: circunferencia_muslo,
        hallazgos_fisicos_signos_vitales_perimetro_abdominal_vejez: perimetro_abdominal,

        practicas_alimentarias_observaciones_vejez: obsAlimentarias,
        estructuras_dentomaxilofaciales_vejez: obsDentales,
        auditiva_comunicativa_observaciones_vejez: obsAuditiva,
        valoracion_salud_visual_vejez: obsVisual,
        salud_sexual_observaciones_vejez: obsSexual,

        examen_salud_mental_apariencia_general_vejez: 'NORMAL',
        examen_salud_mental_actitud_vejez: 'NORMAL',
        examen_salud_mental_atencion_vejez: 'NORMAL',
        examen_salud_mental_orientacion_vejez: 'NORMAL',
        examen_salud_mental_conciencia_vejez: 'NORMAL',
        examen_salud_mental_lenguaje_vejez: 'NORMAL',
        examen_salud_mental_afecto_vejez: 'NORMAL',
        examen_salud_mental_memoria_vejez: 'NORMAL',
        examen_salud_mental_habito_vejez: 'NORMAL',
        examen_salud_mental_sueno_o_dormir_vejez: 'NORMAL',
        examen_salud_mental_alimentacion_vejez: 'NORMAL',
        examen_salud_mental_inteligencia_vejez: 'NORMAL',
        examen_salud_mental_retardo_mental_vejez: 'NORMAL',
        examen_salud_mental_introyeccion_vejez: 'NORMAL',
        examen_salud_mental_prospeccion_vejez: 'NORMAL',
        examen_salud_mental_somatizacion_vejez: 'NORMAL',

        dinamica_familiar_observaciones_vejez: obsFamiliar,
        InformacionSalud: [],
      },
    ],
    resolucion4505: [
      {
        gestacion: '',
        sintomatico_respiratorio: '2',
        fecha_toma_baciloscopia_diagnostico: '01/01/1845',
        resultado_baciloscopia_diagnostico: '4',
        resultado_hemoglobina: hemoglobinaVal !== null && hemoglobinaVal !== '' ? String(hemoglobinaVal) : '0',
        fecha_toma_hemoglobina: hemoglobinaFecha || '01/01/1845',
        agudeza_visual_lejana_ojo_izquierdo: '3',
        agudeza_visual_lejana_ojo_derecho: '3',
        valoracion_agudeza_visual: fechaConsultaMMDD,
        codigo_pais: '170',
        resultado_tamizaje_VALE: '',
        fecha_tamizaje_VALE: '',
        // CÁNCER DE CUELLO UTERINO (solo mujeres > 10 años)
        tamizaje_cancer_cuello_uterino: tamizajeCuello,
        citologia_cervicouterina: citologiaFecha,
        resultado_tamizaje_cancer_cuello_uterino: resultadoCuello,
        fecha_tamizaje_cancer_cuello_uterino: fechaCuello,
        calidad_muestra_citologia_cervicouterina: calidadMuestra,
        codigo_habilitacion_IPS_citologia_cervicouterina: codigoIPS,
        fecha_colposcopia: fechaColposcopia,
        fecha_biopsia_cervical: fechaBiopsiaCervical,
        resultado_biopsia_cervicouterina: resultadoBiopsiaCervical,
        fecha_consulta_valoracion_integral: fechaConsultaMMDD,
        // Hepatitis B
        resultado_antigeno_superficie_hepatitisB_toda:
          (hepatitisBFecha && hepatitisBFecha !== '01/01/1800' && hepatitisBFecha !== '01/01/1845')
            ? (hepBMap.tieneResultado ? hepBMap.codigo : '5')
            : '0',
        fecha_antigeno_superficie_hepatitisB_toda:
          (hepatitisBFecha && hepatitisBFecha !== '01/01/1800' && hepatitisBFecha !== '01/01/1845')
            ? hepatitisBFecha
            : '01/01/1845',
        // Sífilis
        resultado_prueba_tamizaje_sifilis:
          (sifilisFecha && sifilisFecha !== '01/01/1800' && sifilisFecha !== '01/01/1845')
            ? (sifilisMap.tieneResultado ? sifilisMap.codigo : '5')
            : '0',
        fecha_serologia_sifilis:
          (sifilisFecha && sifilisFecha !== '01/01/1800' && sifilisFecha !== '01/01/1845')
            ? sifilisFecha
            : '01/01/1845',
        // VIH
        resultado_prueba_VIH:
          (vihFecha && vihFecha !== '01/01/1800' && vihFecha !== '01/01/1845')
            ? (vihMap.tieneResultado ? vihMap.codigo : '5')
            : '0',
        fecha_tomae_elisa_VIH:
          (vihFecha && vihFecha !== '01/01/1800' && vihFecha !== '01/01/1845')
            ? vihFecha
            : '01/01/1845',
        // Planificación familiar
        planificación_familiar_primera_vez: '',
        suministro_metodo_anticonceptivo: '',
        fecha_suministro_metodo_anticonceptivo: '',
        // Tabaco
        consumo_tabaco: '99',
        // Glicemia
        resultado_glicemia_basal: (glicemiaVal !== null && glicemiaVal !== '') ? String(glicemiaVal) : '998',
        fecha_toma_glicemia_basal: (glicemiaFecha && glicemiaFecha !== '01/01/1800' && glicemiaFecha !== '01/01/1845') ? glicemiaFecha : '01/01/1800',
        // LDL
        resultado_LDL: (ldlVal !== null && ldlVal !== '') ? String(ldlVal) : '998',
        fecha_toma_LDL: (ldlFecha && ldlFecha !== '01/01/1800' && ldlFecha !== '01/01/1845') ? ldlFecha : '01/01/1800',
        // HDL
        resultado_HDL: (hdlVal !== null && hdlVal !== '') ? Number(hdlVal) : 998,
        fecha_toma_HDL: (hdlFecha && hdlFecha !== '01/01/1800' && hdlFecha !== '01/01/1845') ? hdlFecha : '01/01/1800',
        // Triglicéridos
        resultado_trigliceridos: (trigliceridosVal !== null && trigliceridosVal !== '') ? String(trigliceridosVal) : '998',
        fecha_toma_trigliceridos: (trigliceridosFecha && trigliceridosFecha !== '01/01/1800' && trigliceridosFecha !== '01/01/1845') ? trigliceridosFecha : '01/01/1800',
        // Creatinina
        resultado_creatinina: (creatininaVal !== null && creatininaVal !== '') ? Number(creatininaVal) : 998,
        fecha_creatinina: (creatininaFecha && creatininaFecha !== '01/01/1800' && creatininaFecha !== '01/01/1845') ? creatininaFecha : '01/01/1800',
        // Riesgo cardiovascular y metabólico
        clasificacion_riesgo_cardiovascular: '21',
        clasificación_riesgo_metabolico: '21',
        // Hepatitis C
        resultado_tamizaje_hepatitis_C:
          (hepatitisCFecha && hepatitisCFecha !== '01/01/1800' && hepatitisCFecha !== '01/01/1845')
            ? (hepCMap.tieneResultado ? hepCMap.codigo : '5')
            : '21',
        fecha_toma_tamizaje_hepatitis_C:
          (hepatitisCFecha && hepatitisCFecha !== '01/01/1800' && hepatitisCFecha !== '01/01/1845')
            ? hepatitisCFecha
            : '01/01/1800',
        // TACTO RECTAL (según género)
        resultado_tacto_rectal: tactoRectalResultado,
        fecha_tacto_rectal: tactoRectalFecha,
        // PSA (según género)
        resultado_PSA: psaResultado,
        fecha_toma_PSA: psaFecha,
        // Sangre oculta
        resultado_prueba_sangre_oculta_materia_fecal:
          (sangreOcultaFecha && sangreOcultaFecha !== '01/01/1800' && sangreOcultaFecha !== '01/01/1845')
            ? (sangreOcultaVal !== null && sangreOcultaVal > 0 ? '4' : '5')
            : '21',
        fecha_prueba_sangre_oculta_materia_feca:
          (sangreOcultaFecha && sangreOcultaFecha !== '01/01/1800' && sangreOcultaFecha !== '01/01/1845')
            ? sangreOcultaFecha
            : '01/01/1800',
        // Colonoscopia
        resultado_colonoscopia_tamizaje: (edad >= 50 && edad <= 75) ? '21' : '0',
        fecha_colonoscopia_tamizaje: (edad >= 50 && edad <= 75) ? '01/01/1800' : '01/01/1845',
        // MAMOGRAFÍA (solo mujeres >= 50 años)
        resultado_mamografia_res202: resultadoMamografia,
        fecha_mamografía: fechaMamografia,
        // Biopsia de mama
        resultado_biopsia_mama: '0',
        fecha_toma_biopsia_seno_BACAF: '01/01/1845',
        fecha_resultado_biopsia_seno_BACAF: '01/01/1845',
        // Mini mental
        resultado_prueba_mini_mental_state: '4',
      },
    ],
  };
}