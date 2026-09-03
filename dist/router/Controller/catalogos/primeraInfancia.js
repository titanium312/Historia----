"use strict";
// src/controllers/catalogos/primeraInfancia.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = primeraInfancia;
/**
 * Catálogo de historia clínica para PRIMERA INFANCIA (0-5 años).
 * Basado en Resolución 3280 de 2018 y 0202 de 2021.
 * @param data - Objeto enriquecido que contiene:
 *   - admision, paciente, historia, facturacion, entidad (desde la API)
 *   - edad, generoId, generoTexto, sexoId (calculados)
 *   - datosClinicos (opcional, desde el RIPS)
 */
function primeraInfancia(data) {
    // ============================================================
    // 1. EXTRAER TODOS LOS DATOS DESDE EL OBJETO data
    // ============================================================
    const admision = data?.admision || {};
    const paciente = data?.paciente || {};
    const historia = data?.historia || {};
    const facturacion = data?.facturacion || {};
    const entidad = data?.entidad || {};
    const edad = data.edad ?? 0;
    const generoId = data.generoId ?? 0;
    const generoTexto = data.generoTexto || 'No especificado';
    const sexoId = data.sexoId ?? 0;
    const clinicos = data.datosClinicos || null;
    // ============================================================
    // 2. FUNCIÓN PARA PARSEAR FECHA DE ADMISIÓN (SIEMPRE YYYY-MM-DD)
    // ============================================================
    function parsearFechaAdmision(fechaInput) {
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
        console.warn('Fecha no reconocida, usando hoy:', fechaInput);
        return new Date().toISOString().split('T')[0];
    }
    // ============================================================
    // 3. CALCULAR FECHA DE CONSULTA (SIEMPRE LA DE ADMISIÓN)
    // ============================================================
    const fechaConsulta = parsearFechaAdmision(admision?.fecha_admision);
    // ============================================================
    // 4. TOMAR VALORES DEL RIPS O USAR POR DEFECTO
    // ============================================================
    const peso = Number(clinicos?.antropometricos?.peso ?? 0);
    const talla = Number(clinicos?.antropometricos?.talla ?? 0);
    const perimetroCefalico = Number(clinicos?.antropometricos?.perimetro_cefalico ?? 0);
    const imc = (peso > 0 && talla > 0) ? peso / ((talla / 100) ** 2) : 0;
    // Fechas de medición (si existen)
    const fechaPeso = clinicos?.antropometricos?.fecha_peso ? parsearFechaAdmision(clinicos.antropometricos.fecha_peso) : fechaConsulta;
    const fechaTalla = clinicos?.antropometricos?.fecha_talla ? parsearFechaAdmision(clinicos.antropometricos.fecha_talla) : fechaConsulta;
    // Signos vitales (valores típicos para niños)
    const fc = Number(clinicos?.signos_vitales?.fc ?? 100);
    const fr = Number(clinicos?.signos_vitales?.fr ?? 25);
    const temp = Number(clinicos?.signos_vitales?.temperatura ?? 36.5);
    const saturacion = Number(clinicos?.signos_vitales?.saturacion ?? 97);
    const sc = 0.5;
    // ============================================================
    // 5. DATOS ESPECÍFICOS DE PRIMERA INFANCIA
    // ============================================================
    const tshNeonatal = clinicos?.laboratorios?.tsh_neonatal?.valor ?? null;
    const fechaTsh = clinicos?.laboratorios?.tsh_neonatal?.fecha || null;
    const vale = clinicos?.tamizajes?.vale?.resultado ?? null;
    const fechaVale = clinicos?.tamizajes?.vale?.fecha || null;
    const auditivo = clinicos?.tamizajes?.auditivo_neonatal?.resultado ?? null;
    const fechaAuditivo = clinicos?.tamizajes?.auditivo_neonatal?.fecha || null;
    const visual = clinicos?.tamizajes?.visual_neonatal?.resultado ?? null;
    const fechaVisual = clinicos?.tamizajes?.visual_neonatal?.fecha || null;
    const dpt = clinicos?.vacunas?.dpt ?? null;
    const neumococo = clinicos?.vacunas?.neumococo ?? null;
    const fortificacion = clinicos?.micronutrientes?.fortificacion_casera ?? null;
    const vitaminaA = clinicos?.micronutrientes?.vitamina_a ?? null;
    const hierro = clinicos?.micronutrientes?.hierro ?? null;
    // ============================================================
    // 6. EDAD EN MESES (para lógica condicional)
    // ============================================================
    let edadMeses = 0;
    if (paciente?.fecha_nacimiento) {
        const fechaNac = parsearFechaAdmision(paciente.fecha_nacimiento);
        const nac = new Date(fechaNac);
        const consulta = new Date(fechaConsulta);
        edadMeses = (consulta.getFullYear() - nac.getFullYear()) * 12 + (consulta.getMonth() - nac.getMonth());
    }
    else {
        edadMeses = edad * 12;
    }
    // ============================================================
    // 7. FUNCIONES DE MAPEO
    // ============================================================
    const mapTamizaje = (valor) => {
        if (!valor)
            return { codigo: "0", tiene: false };
        const r = valor.trim().toLowerCase();
        if (r === "pasa" || r === "normal" || r === "negativo")
            return { codigo: "5", tiene: true };
        if (r === "falla" || r === "no pasa" || r === "alterado")
            return { codigo: "4", tiene: true };
        return { codigo: "0", tiene: false };
    };
    const tshMap = mapTamizaje(tshNeonatal);
    const valeMap = mapTamizaje(vale);
    const auditivoMap = mapTamizaje(auditivo);
    const visualMap = mapTamizaje(visual);
    const fechaTshFinal = tshMap.tiene ? (fechaTsh || fechaConsulta) : "1845-01-01";
    const fechaValeFinal = valeMap.tiene ? (fechaVale || fechaConsulta) : "1845-01-01";
    const fechaAuditivoFinal = auditivoMap.tiene ? (fechaAuditivo || fechaConsulta) : "1845-01-01";
    const fechaVisualFinal = visualMap.tiene ? (fechaVisual || fechaConsulta) : "1845-01-01";
    // ============================================================
    // 8. CONSTRUCCIÓN DEL OBJETO FINAL (con todos los campos)
    // ============================================================
    return {
        // --- IDENTIFICACIÓN Y DATOS BÁSICOS ---
        genero: generoTexto,
        genero_id: generoId,
        sexo_id: sexoId,
        id_historia: String(historia?.id_historia || 0),
        numero_historia: String(historia?.numero_historia || 0),
        hora_historia: '00:00',
        fk_servicio_ingreso: '2',
        fk_admision: String(admision.id_admision || 0),
        fk_procedimiento: '890207',
        motivo_consulta_historia: 'RUTA_PRIMERA_INFANCIA',
        fk_finalidad_consulta: '11',
        IdActividad: '4',
        fk_paciente: String(paciente.id_paciente || 0),
        telefono_paciente: paciente.telefono || '',
        numero_admision: String(admision.numero_admision || 0),
        fk_factura_consultas: String(facturacion?.id_factura_consultas || 0),
        motivo_consulta_consulta_externa: `Control de crecimiento y desarrollo (${edad} años, ${edadMeses} meses)`,
        // --- FACTURACIÓN Y DATOS DE ADMISIÓN ---
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
                fk_ocupacion: '9999',
                fk_nivel_educativo: '0',
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
        // --- ENFERMEDAD ACTUAL, ANÁLISIS Y REVISIONES ---
        enfermedad_actual_historia: `Paciente de ${edad} años (${edadMeses} meses) en control de crecimiento y desarrollo - Ruta Primera Infancia. Sin síntomas ni signos de alarma. Se realiza valoración integral.`,
        analisis_historia: `Examen físico sin alteraciones. Peso: ${peso} kg, Talla: ${talla} cm, Perímetro cefálico: ${perimetroCefalico} cm. Desarrollo psicomotor acorde a la edad.`,
        revision_sistema_general_historia: 'Sin alteraciones. Buen estado general.',
        revision_sistema_organos_sentidos_historia: 'Sin alteraciones. Visión y audición conservadas.',
        revision_sistema_cabeza_historia: 'Sin alteraciones.',
        revision_sistema_cuello_historia: 'Sin alteraciones.',
        revision_sistema_cavidad_bucal_historia: 'Sin alteraciones.',
        revision_sistema_piel_faneras_historia: 'Sin alteraciones.',
        revision_sistema_cardiovascular_historia: 'Sin alteraciones.',
        revision_sistema_respitatorio_historia: 'Sin alteraciones.',
        revision_sistema_gastrointestinal_historia: 'Sin alteraciones.',
        revision_sistema_genitourinario_historia: 'Sin alteraciones.',
        revision_sistema_osteomoscular_articular_historia: 'Sin alteraciones.',
        revision_sistema_nervioso_historia: 'Sin alteraciones.',
        revision_sistema_endocrino_historia: 'Sin alteraciones.',
        revision_sistema_psiquico_mental_historia: 'Sin alteraciones.',
        revision_sistema_hematopoyetico_historia: 'Sin alteraciones.',
        // --- VALORACIONES ---
        valoracion_espiritual: 'No se evidencian conflictos.',
        valoracion_emocional: 'Estable.',
        valoracion_emocional_tristeza: 'Negada.',
        valoracion_emocional_ideacion_muerte: 'Negada.',
        valoracion_emocional_anciedad: 'Negada.',
        valoracion_emocional_angustia: 'Negada.',
        valoracion_emocional_miedo: 'Negado.',
        valoracion_emocional_panico: 'Negado.',
        valoracion_emocional_estres: 'Niega estrés significativo.',
        valoracion_emocional_viviencias: 'Sin eventos recientes.',
        valoracion_emocional_deseo_adelantar_muerte: 'Negado.',
        valoracion_emocional_preocupaciones_principales: 'Sin preocupaciones mayores.',
        valoracion_emocional_asuntos_pendientes: 'Ninguno.',
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
        conducta_historia: `Se realiza valoración integral en ruta Primera Infancia. Se evalúa crecimiento y desarrollo. Se educa a los padres en cuidados generales, alimentación saludable, estimulación temprana, prevención de accidentes y signos de alarma. Se agenda próximo control.`,
        signos_de_alarma_educacion: 'Se educa en signos de alarma: fiebre persistente, dificultad respiratoria, somnolencia excesiva, convulsiones, deshidratación, falta de peso o talla adecuada.',
        plan_tratamiento_descripcion_historia: `1. Control de crecimiento y desarrollo. 2. Evaluación de hitos del desarrollo. 3. Educación a padres. 4. Próximo control según edad.`,
        antecedentes_toxicos_cigarrillo_cantidad_dia_historia: '0',
        antecedentes_toxicos_cigarrillo_annos_uso_historia: '0',
        antecedentes_toxicos_humo_lenna_annos_uso_historia: '0',
        antecedentes_toxicos_alcohol_annos_uso_historia: '0',
        antecedentes_toxicos_farmaco_cual_historia: '',
        antecedentes_toxicos_otro_cual_historia: '',
        antecedentes_toxicos_observaciones_historia: 'No aplica (paciente pediátrico).',
        antecedentes_toxicos_consumo_alcohol: '2',
        antecedentes_toxicos_consumo_psicoactiva: '2',
        antecedentes_toxicos_fumador_pasivo: false,
        antecedentes_toxicos_estimulantes: '',
        historiaClinicaPrincipiosActivosAntecedentesPersonales: [],
        fk_hemoclasificacion: '',
        antecedetes_personales_hospitalizaciones_historia: 'Ninguna.',
        antecedetes_personales_tranfusiones_historia: 'Ninguna.',
        antecedetes_personales_otro_cual_historia: '',
        antecedetes_personales_observaciones_historia: 'Sin antecedentes de importancia.',
        antecedetes_personales_habitos_saludables: 'Lactancia materna/alimentación adecuada según edad.',
        antecedetes_personales_comportamiento_general: 'Paciente colaborador.',
        antecedetes_personales_traumatologicos: 'Niega.',
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
        antecedentes_familiares_observaciones_historia: 'Niega antecedentes familiares de importancia.',
        historia_clinica_enfermedades_antecedentes_familiares: null,
        antecedentes_familiares_muerte_hermanos: false,
        antecedentes_exposicion_violencia: false,
        antecedentes_familiares_preeclampcia: false,
        antecedentes_familiares_enfermedad_cardiaca: false,
        antecedentes_familiares_malformaciones: false,
        antecedentes_familiares_consumo_alcohol: false,
        antecedentes_familiares_sustancias_psicoactivas: false,
        antecedentes_familiares_estructura_familiar: 'Familia nuclear.',
        antecedentes_familiares_condiciones_socioeconomicas: 'Media.',
        antecedentes_familiares_redes_apoyo: 'Cuenta con apoyo.',
        antecedentes_familiares_situacion_escolar_laboral: 'Estudia/trabaja.',
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
        antecedetes_patologicos_observaciones_historia: '',
        historiaClinicaPrincipiosActivosAntecedentesAlergicos: [],
        antecedentes_alergicos_otras_alergias_historia: 'Negadas.',
        antecedentes_alergicos_observaciones_historia: 'No refiere alergias.',
        antecedentes_alergicos_alimentos: 'Negados.',
        antecedentes_alergicos_ambientales: 'Negados.',
        antecedentesAlergicosPiel: 'Negados.',
        antecedentesAlergicosPicaduraInsectos: 'Negados.',
        historia_clinica_procedimientos_antecedentes_vacunacion: [],
        antecedentes_vacunacion_esquema_historia: '0',
        antecedetes_vacunacion_observaciones_historia: 'Esquema de vacunación según edad.',
        historia_clinica_procedimientos_antecedentes_quirurgicos: [],
        antecedetes_quirurgicos_observaciones_historia: 'Niega.',
        antecedentes_gineco_obstetricos_menarca: '',
        antecedentes_gineco_obstetricos_duracion_ciclo: '',
        antecedentes_gineco_obstetricos_inicio_relaciones: '',
        antecedentes_gineco_obstetricos_embarazos: '',
        antecedentes_gineco_obstetricos_partos: '',
        antecedentes_gineco_obstetricos_gemelar: '',
        antecedentes_gineco_obstetricos_abortos: '',
        antecedentes_gineco_obstetricos_mamografias: 'No aplica',
        antecedentes_gineco_obstetricos_citologia: 'No aplica',
        antecedentes_gineco_obstetricos_ecografia: 'No aplica',
        antecedentes_gineco_obstetricos_flujos: 'Negados',
        antecedentes_gineco_obstetricos_mestruacion: '',
        antecedentes_gineco_obstetricos_cesarias: '0',
        antecedentes_gineco_obstetricos_menopausia: 'No aplica',
        antecedentes_gineco_obstetricos_primer_parto: '',
        antecedentes_gineco_obstetricos_ultimo_parto: '',
        fk_metodo_anticonceptivo: '0',
        antecedentes_gineco_obstetricos_grupo_sanguineo_pareja: '0',
        antecedentes_gineco_obstetricos_observaciones: '',
        antecedentes_gineco_obstetricos_fecha_terminacion_ultimo_embarazo: '',
        antecedentes_gineco_obstetricos_embarazos_ectopicos: '0',
        antecedentes_gineco_obstetricos_mola: '0',
        antecedentes_gineco_obstetricos_nacidos_vivos: '0',
        antecedentes_gineco_obstetricos_nacidos_muertos: '0',
        antecedentes_gineco_obstetricos_viven: '0',
        antecedentes_gineco_obstetricos_muertos: '0',
        antecedentes_gineco_obstetricos_muertos_primera_semana: '0',
        antecedentes_gineco_obstetricos_muertos_despues_primera_semana: '0',
        antecedentes_gineco_obstetricos_recien_nacido_peso_menor_2500: '0',
        antecedentes_gineco_obstetricos_fecha_mamografias: '',
        antecedentes_gineco_obstetricos_resultado_ultima_citologia: '',
        antecedentes_reproductivos_ciclo_menstrual_preconcepcional: '1',
        antecedentes_reproductivos_duracion_ciclo_preconcepcional: '',
        antecedentes_reproductivos_vida_sexual_activa_preconcepcional: '0',
        antecedentes_reproductivos_utiliza_preservativos_preconcepcional: '0',
        antecedentes_reproductivos_numero_companeros_sexuales_preconcepcional: '',
        antecedentes_reproductivos_peso_ultimo_recien_nacido_preconcepcional: '0',
        antecedentes_reproductivos_muerte_fetal_previa_preconcepcional: '0',
        antecedentes_reproductivos_gran_multiparidad_preconcepcional: '0',
        antecedentes_reproductivos_periodo_intergesico_menor_24_preconcepcional: '0',
        antecedentes_reproductivos_imcompatibilida_rh_preconcepcional: '0',
        antecedentes_reproductivos_preeclampsia_embarazo_anterior_preconcepcional: '0',
        antecedentes_reproductivos_antecedente_nacido_macrosimico_preconcepcional: '0',
        antecedentes_reproductivos_hemorragia_postparto_preconcepcional: '0',
        antecedentes_reproductivos_embarazo_molar_preconcepcional: '0',
        antecedentes_reproductivos_depresion_postparto_preconcepcional: '0',
        antecedentes_reproductivos_recien_nacido_tubo_neural_preconcepcional: '0',
        antecedentes_reproductivos_planea_embarazo_3_meses_preconcepcional: '0',
        antecedentes_reproductivos_ordena_acido_folico_preconcepcional: '0',
        antecedentes_vejez_deterioro_cognitivo: false,
        antecedentes_vejez_inmobilidad: false,
        antecedentes_vejez_inestabilidad_caidas: false,
        antecedentes_vejez_fragilidad: false,
        antecedentes_vejez_control_esfinteres: false,
        antecedentes_vejez_depresion: false,
        antecedentes_vejez_iatogenia: false,
        antecedentes_vejes_observaciones: '',
        // --- SIGNOS VITALES ---
        hallazgos_fisicos_signos_vitales_ta_historia: '',
        hallazgos_fisicos_signos_vitales_fr_historia: String(fr),
        hallazgos_fisicos_signos_vitales_t_historia: String(temp),
        hallazgos_fisicos_signos_vitales_fc_historia: String(fc),
        hallazgos_fisicos_signos_vitales_talla_historia: String(talla),
        hallazgos_fisicos_signos_vitales_peso_historia: String(peso),
        hallazgos_fisicos_signos_vitales_sc_historia: sc.toFixed(2),
        hallazgos_fisicos_signos_vitales_perimetro_cefalico_historia: String(perimetroCefalico),
        hallazgos_fisicos_signos_vitales_saturacion_oxigeno: String(saturacion),
        hallazgos_fisicos_signos_vitales_idmc_historia: imc.toFixed(2),
        hallazgos_fisicos_otros_cabeza_historia: 'NORMOCEFALO, FONTANELA ANTERIOR CERRADA (según edad), PUPILAS ISOCORICAS NORMOREACTIVAS A LA LUZ, FOSAS NASALES PERMEABLES, CAVIDAD ORAL NORMAL',
        hallazgos_fisicos_otros_cuello_historia: 'SIMETRICO, MOVIL, NO ADENOPATIAS, NO INGURGITACION YUGULAR',
        hallazgos_fisicos_otros_torax_historia: 'SIMETRICO, NO DEFORMIDADES, RSCS: RITMICOS, NO SOPLOS, BIEN TIMBRADOS; CSPS: VENTILADOS, NO ESTERTORES',
        hallazgos_fisicos_otros_abdomen_historia: 'BLANDO, DEPRESIBLE, NO MASAS PALPABLES, NO VICEROMEGALIAS, NO DOLOROSO A LA PALPACION, RSHS: NORMALES',
        hallazgos_fisicos_otros_genitourinario_historia: 'GENITALES EXTERNOS NORMALES, PUÑOPERCUSION NEGATIVA',
        hallazgos_fisicos_otros_pelvis_historia: 'NO APLICA',
        hallazgos_fisicos_otros_dorso_historia: 'SIMETRICAS, NO DEFORMIDADES, NO EDEMAS',
        hallazgos_fisicos_otros_neurologico_historia: 'GLASGOW 15/15, CONCIENTE, ORIENTADO EN TIEMPO Y ESPACIO, MOTRICIDAD Y SENSIBILIDAD GENERAL CONSERVADAS',
        hallazgos_fisicos_otros_piel_historia: 'HIDRATADA, ASPECTO Y COLORACION NORMAL, SIN LESIONES',
        hallazgos_fisicos_otros_otro_historia: 'EMUNTORIOS NORMALES',
        diagnostico_ingreso_tipo_historia: '1',
        diagnostico_ingreso_fk_causa_externa: '40',
        diagnostico_ingreso_observaciones_historia: '',
        historia_clinica_enfermedades_diagnostico_ingreso: [
            { id_historia_enfermedad_diagnostico_ingreso: 0, fk_historia: 0, fk_enfermedad: 'Z001', fk_institucion: 0 }
        ],
        diagnostico_principales_observaciones_consulta_externa: 'Paciente en control de crecimiento y desarrollo. Sin alteraciones.',
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
        observaciones_historia: '',
        observaciones_odontograma: '',
        observaciones_placa_bacteriana: '',
        fk_usuario: historia?.fk_usuario_historia || 0,
        fk_institucion: admision?.fk_institucion || 20,
        bloqueada: true,
        prescripcion_medicamentos: [],
        // ============================================================
        // BLOQUE `historia_pym_primera_infancia`
        // ============================================================
        historia_pym_primera_infancia: [
            {
                peso: String(peso),
                talla: String(talla),
                perimetro_cefalico: String(perimetroCefalico),
                imc: imc.toFixed(2),
                fc: String(fc),
                fr: String(fr),
                temperatura: String(temp),
                saturacion: String(saturacion),
                desarrollo_motricidad_gruesa: '5',
                desarrollo_motricidad_fina: '5',
                desarrollo_personal_social: '5',
                desarrollo_audicion_lenguaje: '5',
                salud_visual: 'Sin alteraciones.',
                salud_auditiva: 'Sin alteraciones.',
                vacunacion_esquema_completo: '1',
                suministro_vitamina_a: (edadMeses >= 24 && edadMeses <= 60) ? (vitaminaA ? '1' : '21') : '0',
                suministro_hierro: (edadMeses >= 24 && edadMeses <= 59) ? (hierro ? '1' : '21') : '0',
                suministro_fortificacion: (edadMeses >= 6 && edadMeses <= 23) ? (fortificacion ? '1' : '21') : '0',
                observaciones_crecimiento: 'Peso, talla y perímetro cefálico dentro de parámetros normales.',
                observaciones_desarrollo: 'Desarrollo psicomotor acorde a la edad.',
                observaciones_generales: 'Sin alteraciones.',
            },
        ],
        // ============================================================
        // BLOQUE RESOLUCION 4505 (ADAPTADO PARA PRIMERA INFANCIA)
        // ============================================================
        resolucion4505: [
            {
                // --- Campos fijos ---
                gestacion: "0",
                sintomatico_respiratorio: "2",
                fecha_toma_baciloscopia_diagnostico: "1845-01-01",
                resultado_baciloscopia_diagnostico: "4",
                consumo_tabaco: "98",
                clasificacion_riesgo_cardiovascular: "21",
                "clasificación_riesgo_metabolico": "21",
                tratamiento_ablativo_escision_inspeccion_visual: "0",
                // --- Cuello uterino (no aplica) ---
                tamizaje_cancer_cuello_uterino: "0",
                resultado_tamizaje_cancer_cuello_uterino: "0",
                calidad_muestra_citologia_cervicouterina: "0",
                codigo_habilitacion_IPS_citologia_cervicouterina: "0",
                resultado_biopsia_cervicouterina: "0",
                // --- Planificación familiar ---
                suministro_metodo_anticonceptivo: "0",
                codigo_pais: "170",
                fecha_consulta_valoracion_integral: fechaConsulta,
                // --- Laboratorios (no aplican) ---
                resultado_glicemia_basal: "0",
                fecha_toma_glicemia_basal: "1845-01-01",
                resultado_LDL: "0",
                fecha_toma_LDL: "1845-01-01",
                resultado_HDL: "0",
                fecha_toma_HDL: "1845-01-01",
                resultado_trigliceridos: "0",
                fecha_toma_trigliceridos: "1845-01-01",
                resultado_hemoglobina: "0",
                fecha_toma_hemoglobina: "1845-01-01",
                resultado_creatinina: "0",
                fecha_creatinina: "1845-01-01",
                // --- Agudeza visual ---
                agudeza_visual_lejana_ojo_izquierdo: "21",
                agudeza_visual_lejana_ojo_derecho: "21",
                valoracion_agudeza_visual: "1845-01-01",
                // --- Pruebas rápidas ---
                resultado_antigeno_superficie_hepatitisB_toda: "0",
                fecha_antigeno_superficie_hepatitisB_toda: "1845-01-01",
                resultado_prueba_tamizaje_sifilis: "0",
                fecha_serologia_sifilis: "1845-01-01",
                resultado_prueba_VIH: "0",
                fecha_tomae_elisa_VIH: "1845-01-01",
                // --- Fechas de cuello uterino ---
                citologia_cervicouterina: "1845-01-01",
                fecha_colposcopia: "1845-01-01",
                fecha_biopsia_cervical: "1845-01-01",
                // --- Planificación familiar ---
                "planificación_familiar_primera_vez": "1845-01-01",
                fecha_suministro_metodo_anticonceptivo: "1845-01-01",
                // --- Campos específicos de Primera Infancia ---
                "15 - SIfIlIs GestacIonal o congEnIta -": "0",
                "16 - Resultado de la prueba  mInI - mental state AplI. >= 60aNos": "0",
                "17 - HIpotIroIdIsmo CongEnIto -": tshMap.codigo,
                "20 - Lepra": "0",
                "21 - ObesIdad o DesnutrIcIOn ProteIco CalOrIca": "21",
                "22 - Resultado del tacto rectal": "0",
                "23 - AcIdo fOlIco preconcepcIonal AplI. Para Gesttantes": "0",
                "24 - Resultado de la prueba sangre oculta en materIa fecal": "0",
                "25 - Enfermedad Mental": "0",
                "26 - CAncer de CErvIx": "0",
                "27 - Agudeza vIsual lejana ojo IzquIerdo": "21",
                "28 - Agudeza vIsual lejana ojo derecho": "21",
                "29 - Fecha del peso": fechaPeso,
                "30 - Peso en KIlogramos": String(peso),
                "31 - Fecha de la talla": fechaTalla,
                "32 - Talla en centImetros": String(talla),
                "33 - Fecha probable de parto": "1845-01-01",
                "34 - COdIgo paIs": "170",
                "35- ClasIfIcacIOn del rIesgo gestacIonal para Gestantes": "0",
                "36 - Resultado de colonoscopIa": "0",
                "37 - Resultado de tamIzaje audItIvo neonatal": auditivoMap.codigo,
                "38 -Resultado de tamIzaje vIsual neonatal": visualMap.codigo,
                "39 - DPT menores de 5 aNos": dpt ? (dpt === "si" ? "1" : "2") : "0",
                "40- Resultado de tamIzaje VALE": edadMeses <= 12 ? valeMap.codigo : "0",
                "41 -Neumococo": neumococo ? (neumococo === "si" ? "1" : "2") : "0",
                "42 - Resultado de tamIzaje para hepatItIs C": "0",
                "43 - Resultado de escala abrevIada de desarrollo Area de motrIcIdad gruesa": "5",
                "44 - Resultado de escala abrevIada de desarrollo Area de motrIcIdad fInoadaptatIva": "5",
                "45 - Resultado de escala abrevIada de desarrollo Area personal socIal": "5",
                "46 - Resultado de escala abrevIada de desarrollo Area de motrIcIdad audIcIOn lenguaje": "5",
                "47 - TratamIento ablatIvo": "0",
                "48 - Resultado de tamIzacIOn con oxImetrIa": "0",
                "49 - Fecha de atencIOn parto o cesArea": "1845-01-01",
                "50 - Fecha de salIda de atencIOn parto o cesArea": "1845-01-01",
                "51 - Fecha de atencIOn en salud para la promocIOn y apoyo de la lactancIa materna": "1845-01-01",
                "52 - Fecha de consulta de valoracIOn Integral": fechaConsulta,
                "53 - Fecha de atencIOn en salud para la asesorIa en antIconcepcIOn": "1845-01-01",
                "54 - SumInIstro de mEtodo antIconceptIvo": "0",
                "55 - Fecha de sumInIstro de mEtodo antIconceptIvo": "1845-01-01",
                "56 - Fecha de prImera consulta prenatal": "1845-01-01",
                "57 - Resultado de glIcemIa basal": "0",
                "58 - Fecha de últImo control prenatal": "1845-01-01",
                "59- SumInIstro de acIdo fOlIco": "0",
                "60 - SumInIstro de sulfato ferroso": "0",
                "61 - SumInIstro de carbonato de calcIo": "0",
                "62 - Fecha de valoracIOn agudeza vIsual": "1845-01-01",
                "63 - Fecha de tamIzaje VALE": edadMeses <= 12 ? fechaValeFinal : "1845-01-01",
                "64 - Fecha del tacto rectal": "1845-01-01",
                "65 - Fecha de tamIzacIOn con oxImetrIa": "1845-01-01",
                "66 - Fecha de realIzacIOn colonoscopIa": "1845-01-01",
                "67 - Fecha de la prueba sangre oculta": "1845-01-01",
                "68 - Consulta de PsIcologIa": "1845-01-01",
                "69 - Fecha de tamIzaje audItIvo neonatal": fechaAuditivoFinal,
                "70 - SumInIstro de fortIfIcacIOn casera": (edadMeses >= 6 && edadMeses <= 23) ? (fortificacion ? "1" : "21") : "0",
                "71 - SumInIstro de vItamIna A": (edadMeses >= 24 && edadMeses <= 60) ? (vitaminaA ? "1" : "21") : "0",
                "72 - Fecha de toma LDL": "1845-01-01",
                "73 - Fecha de toma PSA": "1845-01-01",
                "74 - PreservatIvos entregados": "0",
                "75 - Fecha de tamIzaje vIsual neonatal": fechaVisualFinal,
                "76 - Fecha de atencIOn en salud bucal": "1845-01-01",
                "77 - SumInIstro de hIerro": (edadMeses >= 24 && edadMeses <= 59) ? (hierro ? "1" : "21") : "0",
                "78 - Fecha de antIgeno de superfIcIe hepatItIs B": "1845-01-01",
                "79 - Resultado de antIgeno de superfIcIe hepatItIs B": "0",
                "80 - Fecha de toma de prueba tamIzaje para sIfIlIs": "1845-01-01",
                "81 - Resultado de prueba tamIzaje para sIfIlIs": "0",
                "82 - Fecha de toma de prueba para VIH": "1845-01-01",
                "83 - Resultado de prueba para VIH": "0",
                "84 -Fecha de TSH neonatal": fechaTshFinal,
                "85 - Resultado de TSH neonatal": tshMap.codigo,
                "86 - TamIzaje del cAncer de cuello uterIno": "0",
                "87 - Fecha de tamIzaje cAncer de cuello uterIno": "1845-01-01",
                "88- Resultado tamIzaje cAncer de cuello uterIno": "0",
                "89 - CalIdad en la muestra de cItologIa": "0",
                "90 - COdIgo de habIlItacIOn IPS": "0",
                "91 - Fecha de colposcopIa": "1845-01-01",
                "92 - Resultado de LDL": "0",
                "93 - Fecha de bIopsIa cervIcouterIna": "1845-01-01",
                "94 - Resultado de bIopsIa cervIcouterIna": "0",
                "95 - Resultado de HDL": "0",
                "96 - Fecha de toma de mamografIa": "1845-01-01",
                "97- Resultado de mamografIa": "0",
                "98 - Resultado de trIglIcErIdos": "0",
                "99 - Fecha de toma bIopsIa de mama": "1845-01-01",
                "100 - Fecha de resultado bIopsIa de mama": "1845-01-01",
                "101 - Resultado de bIopsIa de mama": "0",
                "102 COP por persona": "0",
                "103 - Fecha de toma hemoglobIna": "1845-01-01",
                "104 - Resultado de hemoglobIna": "0",
                "105 - Fecha de toma glIcemIa basal": "1845-01-01",
                "106 - Fecha de toma creatInIna": "1845-01-01",
                "107 - Resultado de creatInIna": "0",
                "108 - PreservatIvos entregados a pacIentes con ITS -": "1845-01-01",
                "109 - Resultado de PSA": "0",
                "110 - Fecha de toma de tamIzaje hepatItIs C": "1845-01-01",
                "111 - Fecha de toma HDL": "1845-01-01",
                "112 - Fecha de toma de bacIloscopIa dIagnOstIco": "1845-01-01",
                "113 - Resultado de bacIloscopIa dIagnOstIco": "4",
                "114 - ClasIfIcacIOn del rIesgo cardIovascular": "21",
                "115 - TratamIento para sIfIlIs gestacIonal": "0",
                "116 - TratamIento para SIfIlIs CongEnIta-": "0",
                "117 - ClasIfIcacIOn del rIesgo metabOlIco": "21",
                "118 - Fecha de toma trIglIcErIdos": "1845-01-01",
                "FECHA DE CORTE": fechaConsulta,
                "EDAD ANOS": edad,
                "EDAD EN MESE": edadMeses,
            },
        ],
        historia_clinica_procedimientos_vacunacion: [],
    };
}
