"use strict";
// src/controllers/catalogos/juventud.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = juventud;
/**
 * Catálogo de historia clínica para JUVENTUD (18-28 años).
 * Basado en Resolución 3280 de 2018 y 202 de 2021.
 * @param data - Objeto enriquecido que contiene:
 *   - admision, paciente, historia, facturacion, entidad (desde la API)
 *   - edad, generoId, generoTexto, sexoId (calculados)
 *   - datosClinicos (opcional, desde el RIPS)
 */
function juventud(data) {
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
    // 4. TOMAR VALORES DEL RIPS (SI EXISTEN) O USAR POR DEFECTO
    // ============================================================
    const peso = Number(clinicos?.antropometricos?.peso ?? 68.0);
    const talla = Number(clinicos?.antropometricos?.talla ?? 165);
    const imc = peso / ((talla / 100) ** 2);
    const perimetroAbdominal = Number(clinicos?.antropometricos?.perimetro_abdominal ?? 80);
    let pa_sist = 115;
    let pa_diast = 75;
    if (clinicos?.antropometricos?.presion_arterial) {
        const pa = clinicos.antropometricos.presion_arterial;
        if (typeof pa === 'string') {
            const partes = pa.split('/');
            if (partes.length === 2) {
                pa_sist = parseInt(partes[0], 10) || 115;
                pa_diast = parseInt(partes[1], 10) || 75;
            }
        }
        else if (typeof pa === 'object' && pa.sistolica && pa.diastolica) {
            pa_sist = Number(pa.sistolica);
            pa_diast = Number(pa.diastolica);
        }
    }
    const fc = Number(clinicos?.signos_vitales?.fc ?? 72);
    const fr = Number(clinicos?.signos_vitales?.fr ?? 16);
    const temp = Number(clinicos?.signos_vitales?.temperatura ?? 36.5);
    const saturacion = Number(clinicos?.signos_vitales?.saturacion ?? 97);
    const sc = 1.2;
    const glicemia = clinicos?.laboratorios?.glicemia_basal?.valor ?? null;
    const colesterolTotal = clinicos?.laboratorios?.colesterol_total?.valor ?? null;
    const trigliceridos = clinicos?.laboratorios?.trigliceridos?.valor ?? null;
    const hdl = clinicos?.laboratorios?.hdl?.valor ?? null;
    const ldl = clinicos?.laboratorios?.ldl?.valor ?? null;
    const hemoglobina = clinicos?.laboratorios?.hemoglobina?.valor ?? null;
    const creatinina = clinicos?.laboratorios?.creatinina?.valor ?? null;
    const vih = clinicos?.pruebas_rapidas?.vih?.resultado ?? null;
    const sifilis = clinicos?.pruebas_rapidas?.sifilis?.resultado ?? null;
    const hepatitisB = clinicos?.pruebas_rapidas?.hepatitis_b?.resultado ?? null;
    const hepatitisC = clinicos?.pruebas_rapidas?.hepatitis_c?.resultado ?? null;
    // Salud visual: si no hay datos, se pone null
    let ojoDerecho = null;
    let ojoIzquierdo = null;
    if (clinicos?.salud_visual?.ojo_derecho) {
        ojoDerecho = clinicos.salud_visual.ojo_derecho;
    }
    if (clinicos?.salud_visual?.ojo_izquierdo) {
        ojoIzquierdo = clinicos.salud_visual.ojo_izquierdo;
    }
    const riesgoCardiovascular = clinicos?.clasificaciones_riesgo?.cardiovascular ?? null;
    const riesgoMetabolico = clinicos?.clasificaciones_riesgo?.metabolico ?? null;
    // Estado nutricional
    let estadoNutricional = 'normal';
    if (imc >= 25 && imc < 30)
        estadoNutricional = 'sobrepeso';
    else if (imc >= 30)
        estadoNutricional = 'obesidad';
    else if (imc < 18.5)
        estadoNutricional = 'bajo peso';
    let labelIMC = 'Normal';
    if (imc >= 25 && imc < 30)
        labelIMC = 'Sobrepeso';
    else if (imc >= 30)
        labelIMC = 'Obesidad';
    else if (imc < 18.5)
        labelIMC = 'Bajo peso';
    const diagnosticos = ['Z000'];
    if (imc >= 30)
        diagnosticos.push('E660');
    // ============================================================
    // 5. TEXTOS Y VALORES FIJOS
    // ============================================================
    const planFijo = {
        atencion_bucal: 0,
        glicemia: 1,
        ekg: 0,
        creatinina: 1,
        radiografia_torax: 0,
        colesterol_total: 1,
        citologia: 0,
        trigliceridos: 1,
        colposcopia: 0,
        uroanalisis: 1,
        mamografia: 0,
        microalbuminuria: 1,
        biopsia: 0,
        prueba_covid: 1,
        otros: '',
    };
    let tamizajesTexto = 'Se solicitan tamizajes preventivos: glicemia, perfil lipídico, uroanálisis, pruebas rápidas para VIH, Hepatitis B y C, y Sífilis. ';
    if (generoId === 2)
        tamizajesTexto += 'Además, se solicita citología cervicouterina. ';
    // Textos de exploración física
    const exploracionCabeza = 'NORMOCEFALO, PUPILAS ISOCORICAS NORMOREACTIVAS A LA LUZ, FOSAS NASALES PERMEABLES, CAVIDAD ORAL NORMAL';
    const exploracionCuello = 'SIMETRICO, MOVIL, NO ADENOPATIAS, NO INGURGITACION YUGULAR';
    const exploracionTorax = 'SIMETRICO, NO DEFORMIDADES, RSCS: RITMICOS, NO SOPLOS, BIEN TIMBRADOS; CSPS: VENTILADOS, NO ESTERTORES';
    const exploracionAbdomen = 'BLANDO, DEPRESIBLE, NO MASAS PALPABLES, NO VICEROMEGALIAS, NO DOLOROSO A LA PALPACION, RSHS: NORMALES';
    const exploracionGenitourinario = 'GENITALES EXTERNOS NORMALES, PUÑOPERCUSION NEGATIVA';
    const exploracionPelvis = 'SIMETRICA, NO DEFORMIDADES, BUENA MOVILIDAD COXOFEMORAL';
    const exploracionDorso = 'SIMETRICAS, NO DEFORMIDADES, NO EDEMAS';
    const exploracionNeurologico = 'GLASGOW 15/15, CONCIENTE, ORIENTADO EN TIEMPO Y ESPACIO, MOTRICIDAD Y SENSIBILIDAD GENERAL CONSERVADAS';
    const exploracionPiel = 'HIDRATADA, ASPECTO Y COLORACION NORMAL, SIN LESIONES';
    const exploracionOtro = 'EMUNTORIOS NORMALES';
    const exploracionMamas = (generoId === 2)
        ? 'MAMAS SIMÉTRICAS, SIN LESIONES VISIBLES, PIEL DE ASPECTO NORMAL, SIN MASAS PALPABLES, SIN DOLOR, SIN SECRECIONES.'
        : 'EXPLORACIÓN MAMARIA NO APLICA (PACIENTE MASCULINO).';
    const exploracionTactoRectal = 'TACTO RECTAL NO REALIZADO (NO INDICADO PARA TAMIZAJE EN ESTE GRUPO ETARIO SIN SINTOMATOLOGÍA).';
    // ============================================================
    // 6. CONVERTIR VALORES NUMÉRICOS A STRINGS (para evitar problemas)
    // ============================================================
    const pesoStr = String(peso);
    const tallaStr = String(talla);
    const fcStr = String(fc);
    const frStr = String(fr);
    const tempStr = String(temp);
    const saturacionStr = String(saturacion);
    const imcStr = parseFloat(imc.toFixed(2)).toString();
    const perimetroAbdominalStr = String(perimetroAbdominal);
    const edadStr = String(edad);
    // ============================================================
    // 7. FUNCIONES DE MAPEO PARA RESOLUCION 4505 (CORREGIDAS)
    // ============================================================
    const agudezaToCode = (valor) => {
        if (!valor)
            return "21"; // Riesgo no evaluado
        return "3"; // 20/20 normal (se asume que si hay valor, es normal)
    };
    /**
     * Mapea resultado de prueba rápida (VIH, sífilis) a código RIPS.
     * Retorna { codigo, tieneResultado }
     */
    const mapPruebaRapida = (resultado) => {
        if (!resultado)
            return { codigo: "0", tieneResultado: false };
        const r = resultado.trim().toLowerCase();
        if (r === "positivo" || r === "reactivo")
            return { codigo: "4", tieneResultado: true };
        if (r === "negativo" || r === "no reactivo")
            return { codigo: "5", tieneResultado: true };
        // Si es otro valor (ej: "21", "0"), asumimos que no hay resultado válido
        return { codigo: "0", tieneResultado: false };
    };
    /**
     * Mapea resultado de Hepatitis B (similar a prueba rápida)
     */
    const mapHepatitisB = (resultado) => {
        if (!resultado)
            return { codigo: "0", tieneResultado: false };
        const r = resultado.trim().toLowerCase();
        if (r === "positivo" || r === "reactivo")
            return { codigo: "4", tieneResultado: true };
        if (r === "negativo" || r === "no reactivo")
            return { codigo: "5", tieneResultado: true };
        return { codigo: "0", tieneResultado: false };
    };
    // ============================================================
    // 8. DETERMINAR SEXO Y APLICAR LÓGICA CONDICIONAL
    // ============================================================
    const esHombre = (sexoId === 2 || generoId === 1);
    const esMujer = !esHombre;
    // Mapear resultados de pruebas
    const vihMap = mapPruebaRapida(vih);
    const sifilisMap = mapPruebaRapida(sifilis);
    const hepBMap = mapHepatitisB(hepatitisB);
    // Fechas de pruebas rápidas
    const fechaVIH = vihMap.tieneResultado ? fechaConsulta : "1845-01-01";
    const fechaSifilis = sifilisMap.tieneResultado ? fechaConsulta : "1845-01-01";
    const fechaHepB = hepBMap.tieneResultado ? fechaConsulta : "1845-01-01";
    // ============================================================
    // 8.1 LÓGICA PARA MUJERES EN EDAD REPRODUCTIVA (≥10 años)
    // ============================================================
    const esMujerReproductiva = esMujer && edad >= 10;
    // ============================================================
    // 9. CONSTRUCCIÓN DEL OBJETO FINAL
    // ============================================================
    return {
        // --- IDENTIFICACIÓN Y DATOS BÁSICOS ---
        id_historia: String(historia?.id_historia || 0),
        numero_historia: String(historia?.numero_historia || 0),
        hora_historia: '00:00',
        fk_servicio_ingreso: '2',
        fk_admision: String(admision.id_admision || 0),
        fk_procedimiento: '8138',
        motivo_consulta_historia: 'RUTA_JUVENTUD',
        fk_finalidad_consulta: '11',
        IdActividad: '4',
        fk_paciente: String(paciente.id_paciente || 0),
        telefono_paciente: paciente.telefono || '',
        numero_admision: String(admision.numero_admision || 0),
        fk_factura_consultas: String(facturacion?.id_factura_consultas || 0),
        motivo_consulta_consulta_externa: `Control de juventud (${edad} años)`,
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
        // --- ENFERMEDAD ACTUAL, ANÁLISIS Y REVISIONES ---
        enfermedad_actual_historia: `Paciente de ${edad} años en control de promoción y mantenimiento (PYM) - Ruta Juventud. Sin síntomas ni signos de alarma. ${tamizajesTexto}`,
        analisis_historia: `Examen físico sin alteraciones. IMC ${imcStr} (${estadoNutricional}). Se generan órdenes de tamizajes preventivos. Se recomienda continuar con controles anuales.`,
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
        // --- BARTHEL Y NORTON ---
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
        // --- CONDUCTA, EDUCACIÓN Y PLAN ---
        conducta_historia: `Se realiza valoración integral en ruta Juventud. Se generan órdenes de tamizajes. Se educa en estilos de vida saludable, prevención de ITS, y salud mental. Se agenda control anual.`,
        signos_de_alarma_educacion: 'Se educa en signos de alarma: cambios bruscos de peso, cefalea intensa, dolor torácico, síntomas depresivos, consumo de sustancias.',
        plan_tratamiento_descripcion_historia: `1. Tamizajes: ${tamizajesTexto} 2. Educación en vida saludable. 3. Control anual.`,
        // --- ANTECEDENTES TOXICOLÓGICOS ---
        antecedentes_toxicos_cigarrillo_cantidad_dia_historia: '0',
        antecedentes_toxicos_cigarrillo_annos_uso_historia: '0',
        antecedentes_toxicos_humo_lenna_annos_uso_historia: '0',
        antecedentes_toxicos_alcohol_annos_uso_historia: '0',
        antecedentes_toxicos_farmaco_cual_historia: '',
        antecedentes_toxicos_otro_cual_historia: '',
        antecedentes_toxicos_observaciones_historia: 'Niega consumo de tabaco, alcohol o SPA.',
        antecedentes_toxicos_consumo_alcohol: '2',
        antecedentes_toxicos_consumo_psicoactiva: '2',
        antecedentes_toxicos_fumador_pasivo: false,
        antecedentes_toxicos_estimulantes: '',
        // --- ANTECEDENTES PERSONALES ---
        historiaClinicaPrincipiosActivosAntecedentesPersonales: [],
        fk_hemoclasificacion: '',
        antecedetes_personales_hospitalizaciones_historia: 'Ninguna.',
        antecedetes_personales_tranfusiones_historia: 'Ninguna.',
        antecedetes_personales_otro_cual_historia: '',
        antecedetes_personales_observaciones_historia: 'Sin antecedentes.',
        antecedetes_personales_habitos_saludables: 'Actividad física ocasional, alimentación variada.',
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
        // --- ANTECEDENTES FAMILIARES ---
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
        // --- ENFERMEDADES HEREDITARIAS ---
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
        // --- PATOLÓGICOS Y ALÉRGICOS ---
        historia_clinica_enfermedades_antecedentes_patologicos: [],
        antecedetes_patologicos_observaciones_historia: '',
        historiaClinicaPrincipiosActivosAntecedentesAlergicos: [],
        antecedentes_alergicos_otras_alergias_historia: 'Negadas.',
        antecedentes_alergicos_observaciones_historia: 'No refiere alergias.',
        antecedentes_alergicos_alimentos: 'Negados.',
        antecedentes_alergicos_ambientales: 'Negados.',
        antecedentesAlergicosPiel: 'Negados.',
        antecedentesAlergicosPicaduraInsectos: 'Negados.',
        // --- VACUNACIÓN Y QUIRÚRGICOS ---
        historia_clinica_procedimientos_antecedentes_vacunacion: [],
        antecedentes_vacunacion_esquema_historia: '0',
        antecedetes_vacunacion_observaciones_historia: 'Esquema completo.',
        historia_clinica_procedimientos_antecedentes_quirurgicos: [],
        antecedetes_quirurgicos_observaciones_historia: 'Niega.',
        // --- GINECO-OBSTÉTRICOS ---
        antecedentes_gineco_obstetricos_menarca: (generoId === 2) ? '13 años' : '',
        antecedentes_gineco_obstetricos_duracion_ciclo: (generoId === 2) ? '28 días' : '',
        antecedentes_gineco_obstetricos_inicio_relaciones: (generoId === 2) ? '18 años' : '',
        antecedentes_gineco_obstetricos_embarazos: (generoId === 2) ? '0' : '',
        antecedentes_gineco_obstetricos_partos: (generoId === 2) ? '0' : '',
        antecedentes_gineco_obstetricos_gemelar: (generoId === 2) ? '0' : '',
        antecedentes_gineco_obstetricos_abortos: (generoId === 2) ? '0' : '',
        antecedentes_gineco_obstetricos_mamografias: 'No aplica',
        antecedentes_gineco_obstetricos_citologia: 'No aplica / se ordena.',
        antecedentes_gineco_obstetricos_ecografia: 'No aplica',
        antecedentes_gineco_obstetricos_flujos: 'Negados',
        antecedentes_gineco_obstetricos_mestruacion: (generoId === 2) ? 'Regular' : '',
        antecedentes_gineco_obstetricos_cesarias: '0',
        antecedentes_gineco_obstetricos_menopausia: 'No aplica',
        antecedentes_gineco_obstetricos_primer_parto: '',
        antecedentes_gineco_obstetricos_ultimo_parto: '',
        fk_metodo_anticonceptivo: '0',
        antecedentes_gineco_obstetricos_grupo_sanguineo_pareja: '0',
        antecedentes_gineco_obstetricos_observaciones: (generoId === 2) ? 'Sin antecedentes obstétricos.' : '',
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
        // --- REPRODUCTIVOS ---
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
        // --- VEJEZ (no aplica) ---
        antecedentes_vejez_deterioro_cognitivo: false,
        antecedentes_vejez_inmobilidad: false,
        antecedentes_vejez_inestabilidad_caidas: false,
        antecedentes_vejez_fragilidad: false,
        antecedentes_vejez_control_esfinteres: false,
        antecedentes_vejez_depresion: false,
        antecedentes_vejez_iatogenia: false,
        antecedentes_vejes_observaciones: '',
        // --- HALLAZGOS FÍSICOS (SIGNOS VITALES) - TODOS EN STRING ---
        hallazgos_fisicos_signos_vitales_ta_historia: `${pa_sist}/${pa_diast}`,
        hallazgos_fisicos_signos_vitales_fr_historia: frStr,
        hallazgos_fisicos_signos_vitales_t_historia: tempStr,
        hallazgos_fisicos_signos_vitales_fc_historia: fcStr,
        hallazgos_fisicos_signos_vitales_talla_historia: tallaStr,
        hallazgos_fisicos_signos_vitales_peso_historia: pesoStr,
        hallazgos_fisicos_signos_vitales_sc_historia: sc.toFixed(2),
        hallazgos_fisicos_signos_vitales_perimetro_cefalico_historia: '',
        hallazgos_fisicos_signos_vitales_saturacion_oxigeno: saturacionStr,
        hallazgos_fisicos_signos_vitales_idmc_historia: imcStr,
        // --- HALLAZGOS FÍSICOS (OTROS SISTEMAS) ---
        hallazgos_fisicos_otros_cabeza_historia: exploracionCabeza,
        hallazgos_fisicos_otros_cuello_historia: exploracionCuello,
        hallazgos_fisicos_otros_torax_historia: exploracionTorax,
        hallazgos_fisicos_otros_abdomen_historia: exploracionAbdomen,
        hallazgos_fisicos_otros_genitourinario_historia: exploracionGenitourinario,
        hallazgos_fisicos_otros_pelvis_historia: exploracionPelvis,
        hallazgos_fisicos_otros_dorso_historia: exploracionDorso,
        hallazgos_fisicos_otros_neurologico_historia: exploracionNeurologico,
        hallazgos_fisicos_otros_piel_historia: exploracionPiel,
        hallazgos_fisicos_otros_otro_historia: exploracionOtro,
        // --- DIAGNÓSTICOS (TODOS EN STRING) ---
        diagnostico_ingreso_tipo_historia: '2',
        diagnostico_ingreso_fk_causa_externa: '1',
        diagnostico_ingreso_observaciones_historia: '',
        historia_clinica_enfermedades_diagnostico_ingreso: diagnosticos.map((d) => ({
            id_historia_enfermedad_diagnostico_ingreso: 0,
            fk_historia: 0,
            fk_enfermedad: d,
            fk_institucion: 0,
        })),
        diagnostico_principales_observaciones_consulta_externa: `Paciente en control de juventud. ${imc >= 30 ? 'Obesidad detectada.' : 'Sin alteraciones.'}`,
        diagnostico_relacional_tipo_historia: '0',
        diagnostico_relacional_fk_causa_externa: '0',
        diagnostico_relacional_observaciones_historia: '',
        historia_clinica_enfermedades_diagnostico_relacional: [],
        // --- REMISIONES, ARTÍCULOS, INSUMOS ---
        remisiones: null,
        historia_clinica_articulos: [],
        EntregaMedicamentosObservaciones: '',
        HistoriaClinicaMaterialesInsumos: [
            {
                IdHistoriaClinicaArticulo: 0,
                fk_historia: String(historia?.id_historia || 0),
                fk_institucion: 0,
            },
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
            {
                id_placa_bacteria: null,
                porcentaje_placa_bacteriana: 0,
                interpretacion_placa_bacteriana: '',
                fk_institucion: 0,
            },
        ],
        observaciones_historia: '',
        observaciones_odontograma: '',
        observaciones_placa_bacteriana: '',
        fk_usuario: historia?.fk_usuario_historia || 0,
        fk_institucion: admision?.fk_institucion || 20,
        bloqueada: true,
        prescripcion_medicamentos: [],
        // ============================================================
        // BLOQUE `historia_pym_juventud`
        // ============================================================
        historia_pym_juventud: [
            {
                // --- Signos vitales ---
                hallazgos_fisicos_signos_vitales_ta_juventud: `${pa_sist}/${pa_diast}`,
                hallazgos_fisicos_signos_vitales_t__juventud: tempStr,
                hallazgos_fisicos_signos_vitales_fc__juventud: fcStr,
                hallazgos_fisicos_signos_vitales_fr_juventud: frStr,
                hallazgos_fisicos_signos_vitales_tallaPym_juventud: tallaStr,
                hallazgos_fisicos_signos_vitales_pesoPym_juventud: pesoStr,
                hallazgos_fisicos_signos_vitales_idmcPym_juventud: imcStr,
                label_hallazgos_fisicos_signos_vitales_idmcPym_juventud: labelIMC,
                hallazgos_fisicos_signos_vitales_circunferencia_muslo_juventud: 0,
                hallazgos_fisicos_signos_vitales_cincurferencia_muslo_juventud: 0,
                hallazgos_fisicos_signos_vitales_perimetro_abdominal_juventud: perimetroAbdominalStr,
                // --- Exploración física ---
                hallazgos_fisicos_otros_cabeza_juventud: '',
                hallazgos_fisicos_otros_cuello_juventud: '',
                hallazgos_fisicos_otros_torax_juventud: '',
                hallazgos_fisicos_otros_abdomen_juventud: '',
                hallazgos_fisicos_otros_genitourinario_juventud: '',
                hallazgos_fisicos_otros_pelvis_juventud: '',
                hallazgos_fisicos_otros_dorso_juventud: '',
                hallazgos_fisicos_otros_neurologico_juventud: '',
                hallazgos_fisicos_otros_piel_juventud: '',
                hallazgos_fisicos_otros_otro_juventud: 'EMUNTORIOS NORMALES',
                hallazgos_fisicos_otros_mamaPym_juventud: exploracionMamas,
                hallazgos_fisicos_otros_tacto_rectalPym_juventud: exploracionTactoRectal,
                // --- SRQ (todos false) ---
                cuestionario_srq_dolores_cabeza_juventud: false,
                cuestionario_srq_mal_apetito_juventud: false,
                cuestionario_srq_duerme_mal_juventud: false,
                cuestionario_srq_asusta_facilidad_juventud: false,
                cuestionario_srq_sufre_temblor_manos_juventud: false,
                cuestionario_srq_nervioso_tenso_aburrido_juventud: false,
                cuestionario_srq_mala_digestion_juventud: false,
                cuestionario_srq_no_piensa_claridad_juventud: false,
                cuestionario_srq_se_siente_triste_juventud: false,
                cuestionario_srq_llora_mucha_frecuencia_juventud: false,
                cuestionario_srq_dificultad_disfrutar_actividad_diaria_juventud: false,
                cuestionario_srq_dificultad_tomar_decision_juventud: false,
                cuestionario_srq_dificultad_hacer_trabajo_juventud: false,
                cuestionario_srq_incapaz_desempenar_util_vida_juventud: false,
                cuestionario_srq_perdido_interes_cosas_juventud: false,
                cuestionario_srq_persona_inutill_juventud: false,
                cuestionario_srq_idea_acabar_vida_juventud: false,
                cuestionario_srq_cansado_todo_tiempo_juventud: false,
                cuestionario_srq_sensacion_desagradable_estomago_juventud: false,
                cuestionario_srq_se_cansa_facilidad_juventuds: false,
                cuestionario_srq_han_tratado_herirlo_juventud: false,
                cuestionario_srq_mas_importante_piensa_demas_juventud: false,
                cuestionario_srq_interferencia_pensamiento_juventud: false,
                cuestionario_srq_oye_voces_juventud: false,
                cuestionario_srq_convulsismo_ataques_caidas_juventud: false,
                cuestionario_srq_bebido_demasiado_licor_juventud: false,
                cuestionario_srq_dejar_beber_no_podido_juventud: false,
                cuestionario_srq_difilcultad_trabajo_bebida_juventud: false,
                cuestionario_srq_rinas_detenido_borracho_juventud: false,
                cuestionario_srq_parecido_bebia_demasiado_juventud: false,
                valoracion_srq_salud_mental: 'SRQ negativo. Sin alteraciones.',
                valoracion_srq_psicosis: 'Negada.',
                valoracion_srq_trastorno_convulsivo: 'Negado.',
                valoracion_srq_alcoholismo: 'Negado.',
                // --- Prácticas alimentarias, dental, auditiva ---
                practicas_alimentarias_obsevaciones_juventud: 'Hábitos alimentarios adecuados.',
                estructuras_dentomaxilofaciales_juventud: 'Sin alteraciones.',
                estructura_dentomaxilofacial_tiene_dolor_al_comer_masticar_juventud: '2',
                estructura_dentomaxilofacial_dolor_en_diente_o_molares_juventud: '2',
                estructura_dentomaxilofacial_se_cepilla_en_la_manana_juventud: true,
                estructura_dentomaxilofacial_se_cepilla_en_la_noche_juventud: true,
                estructura_dentomaxilofacial_se_cepilla_en_el_medio_dia_juventud: false,
                estructura_dentomaxilofacial_enrojecimiento_encia_juventud: '2',
                estructura_dentomaxilofacial_deformacion_contorno_encia_juventud: '2',
                estructura_dentomaxilofacial_vesiculas_ulceras_placas_juventud: '2',
                estructura_dentomaxilofacial_presecia_caries_juventud: '2',
                estructura_dentomaxilofacial_presencia_placa_bacteriana_juventud: '2',
                estructura_dentomaxilofacial_cuando_fue_la_ultima_consulta_odontologica_juventud: '',
                auditiva_comunicativa_observaciones_juventud: 'Sin alteraciones auditivas ni del lenguaje.',
                factor_riesgo_auditivo_infeccion_en_el_oido_juventud: '2',
                factor_riesgo_auditivo_malformaciones_anatomicas_auricular_y_cae_juventud: '2',
                factor_riesgo_auditivo_inhalacion_de_quimicos_juventud: '2',
                factor_riesgo_auditivo_exposicion_a_ruido_juventud: '2',
                factor_riesgo_auditivo_trastornos_auditivos_con_cambios_presion_atmosferica_juventud: '2',
                factor_riesgo_auditivo_trauma_en_zona_temporal_de_la_cabeza_juventud: '2',
                factor_riesgo_auditivo_r_auditivos_disminuidos_juventud: '2',
                factor_riesgo_auditivo_sensacion_de_presion_o_dolor_de_oido_juventud: '2',
                factor_riesgo_auditivo_antecedentes_de_supuracion_de_oido_juventud: '2',
                factor_riesgo_auditivo_estenosis_de_conducto_auditivo_externo_juventud: '2',
                factor_riesgo_auditivo_audicion_fluctuante_juventud: '2',
                factor_riesgo_auditivo_problemas_de_socializacion_juventud: '2',
                factor_riesgo_auditivo_trastornos_de_comportamientos_juventud: '2',
                factor_riesgo_auditivo_sindrome_de_goldenhar_juventud: '2',
                factor_riesgo_auditivo_labio_o_paladar_hendido_juventud: '2',
                factor_riesgo_auditivo_trauma_craneocefalico_juventud: '2',
                factor_riesgo_auditivo_ingesta_de_sustancias_toxicas_juventud: '2',
                factor_riesgo_auditivo_falta_de_orientacion_auditiva_juventud: '2',
                factor_riesgo_auditivo_antecedentes_familiares_de_sordera_juventud: '2',
                factor_riesgo_auditivo_bajo_peso_al_nacer_juventud: '2',
                factor_riesgo_auditivo_incompativilidad_sanguinea_juventud: '2',
                factor_riesgo_auditivo_proceso_bacterioso_tratado_con_antibioticos_juventud: '2',
                factor_riesgo_auditivo_bajo_rendimiento_escolar_juventud: '2',
                factor_riesgo_auditivo_procesos_virales_prenatales_juventud: '2',
                factor_riesgo_auditivo_retraso_del_desarrollo_motor_o_del_lenguaje_juventud: '2',
                factor_riesgo_auditivo_secuelas_meninguitis_juventud: '2',
                factor_riesgo_auditivo_sindrome_de_down_juventudint: '1',
                factor_riesgo_auditivo_sindrome_relacionado_con_desordenes_auditivos_juventud: '2',
                factor_riesgo_auditivo_trastornos_respiratorios_juventud: '2',
                factor_riesgo_auditivo_trastornos_perinatales_juventud: '2',
                factor_riesgo_auditivo_trastornos_prenatales_juventud: '2',
                // --- Salud visual ---
                valoracion_salud_visual_ojo_derecho_juventud: ojoDerecho || '20/20',
                valoracion_salud_visual_ojo_izquierdo_juventud: ojoIzquierdo || '20/20',
                valoracion_salud_visual_juventud: 'Agudeza visual conservada.',
                // --- Salud sexual ---
                valoracion_salud_sexual_observaciones_juventud: (generoId === 2)
                    ? 'Sin antecedentes ginecológicos de riesgo.'
                    : 'Sin antecedentes urológicos de riesgo.',
                salud_sexual_toma_decisiones_alrededor_de_la_sexualidad_juventud: '1',
                salud_sexual_identidad_de_genero_juventud: '2',
                salud_sexual_violencia_contra_la_mujer_o_genero_juventud: '2',
                salud_sexual_maternidad_y_paternidad_planeada_uso_anticonceptivos_juventud: '1',
                salud_sexual_cuidado_del_cuerpo_y_uso_de_proteccion_contra_its_juventud: '1',
                salud_sexual_conocimiento_de_fisiologia_y_anatomia_de_la_sexualidad_juventud: '1',
                salud_sexual_conocimiento_sobre_its_y_formas_de_proteccion_juventud: '1',
                salud_sexual_conocimientos_creencias_actitudes_sobre_uso_anticoncepcion_juventud: '1',
                salud_sexual_creencias_ctitudes_sobre_el_inicio_de_relaciones_sexuales_juventud: '1',
                salud_sexual_creencias_y_actitudes_sobre_las_relaciones_de_pareja_juventud: '1',
                salud_sexual_conocimientos_sobre_derechos_en_salud_juventud: '1',
                salud_sexual_transgenero_que_no_han_accedido_a_acompanamiento_en_salud_de_transito_en_el_genero_juventud: '3',
                salud_sexual_heterosexual_hijo_de_victimas_de_violencia_de_pareja_juventud: '3',
                salud_sexual_adolecentes_en_contexto_de_alto_riesto_de_escnna_juventud: '2',
                salud_sexual_victimas_de_violencia_sexual_juventud: '2',
                salud_sexual_observaciones_condiciones_particulares_juventud: '',
                salud_sexual_usted_conoce_alguna_its_juventud: '1',
                salud_sexual_usted_ha_recibido_tratamiento_de_its_juventud: '2',
                salud_sexual_usted_tiene_alguna_its_juventud: '2',
                salud_sexual_su_pareja_ha_tenido_alguna_its_juventud: '2',
                salud_sexual_su_pareja_ha_recibido_tratamiento_its_juventud: '2',
                // --- Salud mental ---
                salud_mental_sospecha_de_maltrato_fisico_juventud: '2',
                salud_mental_sospecha_de_violencia_sexual_juventud: '2',
                salud_mental_sospecha_de_violencia_intrafamiliar_juventud: '2',
                salud_mental_conducta_agresiva_o_violenta_juventud: '2',
                salud_mental_sintomatologia_depresiva_juventud: '2',
                salud_mental_sintomatologia_de_ansiedad_juventud: '2',
                salud_mental_ideas_o_intento_de_suicida_juventud: '2',
                salud_mental_pensamientos_o_ideas_incoherentes_juventud: '2',
                salud_mental_victima_de_desplazamiento_juventud: '2',
                salud_mental_consumo_de_alcohol_o_sustancias_psicoactivas: '1',
                // --- Examen de salud mental ---
                examen_salud_mental_apariencia_general_juventud: 'NORMAL',
                examen_salud_mental_actitud_juventud: 'NORMAL',
                examen_salud_mental_atencion_juventud: 'NORMAL',
                examen_salud_mental_orientacion_juventud: 'NORMAL',
                examen_salud_mental_conciencia_juventud: 'NORMAL',
                examen_salud_mental_lenguaje_juventud: 'NORMAL',
                examen_salud_mental_afecto_juventud: 'NORMAL',
                examen_salud_mental_memoria_juventud: 'NORMAL',
                examen_salud_mental_habito_juventud: 'NORMAL',
                examen_salud_mental_sueno_o_dormir_juventud: 'NORMAL',
                examen_salud_mental_alimentacion_juventud: 'NORMAL',
                examen_salud_mental_inteligencia_juventud: 'NORMAL',
                examen_salud_mental_retardo_mental_juventud: 'NORMAL',
                examen_salud_mental_introyeccion_juventud: 'NORMAL',
                examen_salud_mental_prospeccion_juventud: 'NORMAL',
                examen_salud_mental_somatizacion_juventud: 'NORMAL',
                // --- Sucesos vitales (todos false) ---
                sucesos_vitales_muerte_del_conjuge_juventud: false,
                sucesos_vitales_divorcio_juventud: false,
                sucesos_vitales_separacion_matrimoonial_juventud: false,
                sucesos_vitales_encarcelacion_juventud: false,
                sucesos_vitales_muerte_de_un_familiar_cercano_juventud: false,
                sucesos_vitales_lesion_o_enfermedad_personal_juventud: false,
                sucesos_vitales_matrimonio_juventud: false,
                sucesos_vitales_despido_del_trabajo_juventud: false,
                sucesos_vitales_paro_juventud: false,
                sucesos_vitales_reconciliacion_matrimonial_juventud: false,
                sucesos_vitales_jubilacion_juventud: false,
                sucesos_vitales_cambio_de_salud_de_un_miembro_de_la_familia_juventud: false,
                sucesos_vitales_drogadiccion_alcoholismo_juventud: false,
                sucesos_vitales_embarazo_juventud: false,
                sucesos_vitales_dificultad_sexual_juventud: false,
                sucesos_vitales_incorporacion_de_un_nuevo_miembro_a_la_familia_juventud: false,
                sucesos_vitales_reajuste_de_negocio_juventud: false,
                sucesos_vitales_cambio_de_situacion_economica_juventud: false,
                sucesos_vitales_muerte_de_un_amigo_intimo_juventud: false,
                sucesos_vitales_cambio_en_el_tipo_de_trabajo_juventud: false,
                sucesos_vitales_mala_relacion_con_el_conyugue_juventud: false,
                sucesos_vitales_juicio_por_credito_o_hipoteca_juventud: false,
                sucesos_vitales_cambio_de_responsabilidad_en_el_trabajo_juventud: false,
                sucesos_vitales_hijo_hija_deja_el_hogar_juventud: false,
                sucesos_vitales_problemas_legales_juventud: false,
                sucesos_vitales_logro_personal_notable_juventud: false,
                sucesos_vitales_la_esposa_comienza_o_deja_de_trabajar_juventud: false,
                sucesos_vitales_comienzo_fin_de_escolaridad_juventud: false,
                sucesos_vitales_cambio_condiciones_de_vida_juventud: false,
                sucesos_vitales_revision_de_habitos_personales_juventud: false,
                sucesos_vitales_problemas_con_el_jefe_juventud: false,
                sucesos_vitales_cambio_turno_o_condiciones_laborales_juventud: false,
                sucesos_vitales_cambio_de_residencia_juventud: false,
                sucesos_vitales_cambio_de_colegio_juventud: false,
                sucesos_vitales_cambio_actividad_de_ocio_juventud: false,
                sucesos_vitales_cambio_de_actividad_religuiosa_juventud: false,
                sucesos_vitales_cambio_actividades_sociales_juventud: false,
                sucesos_vitales_cambio_habito_de_dormir_juventud: false,
                sucesos_vitales_cambio_en_el_numero_de_reuniones_familiares_juventud: false,
                sucesos_vitales_cambio_de_habitos_alimentarios_juventud: false,
                sucesos_vitales_vacaciones_juventud: false,
                sucesos_vitales_navidades_juventud: false,
                sucesos_vitales_leves_transgresiones_de_ley_juventud: false,
                label_sucesos_vitales_numero_items_marcados_juventud: '0',
                label_sucesos_vitales_puntuacion_total_juventud: '0',
                // --- Relación con el trabajo ---
                relacion_con_el_trabajo_antecedentes_de_trabajo_infantil_juventud: '2',
                relacion_con_el_trabajo_tipo_de_vinculacion_laboral_juventud: '0',
                relacion_con_el_trabajo_edad_inicio_de_su_actividad_laboral_juventud: '',
                relacion_con_el_trabajo_tipo_de_actividad_laboral_juventud: '',
                relacion_con_el_trabajo_observaciones_juventud: '',
                dinamica_familiar_observaciones_juventud: 'Familiograma sin alteraciones.',
                apoyo_social_las_relaciones_interpersonales_mas_significativas_juventud: '0',
                apoyo_social_educacion_juventud: '0',
                apoyo_social_salud_juventud: '0',
                apoyo_social_trabajo_juventud: '0',
                apoyo_social_grupos_sociales_y_de_espiritualidad_juventud: '0',
                apoyo_social_servicios_dentro_de_la_comunidad_juventud: '0',
                apoyo_social_las_relaciones_interpersonales_mas_significativas_descripcion_juventud: '',
                apoyo_social_educacion_descripcion_juventud: '',
                apoyo_social_salud_descripcion_juventud: '',
                apoyo_social_trabajo_descripcion_juventud: '',
                apoyo_social_grupos_sociales_y_de_espiritualidad_descripcion_juventud: '',
                apoyo_social_servicios_dentro_de_la_comunidad_descripcion_juventud: '',
                apoyo_social_interpretacion_de_ecomapa_juventud: '',
                itemsMarcadosSucesosVitalesJuventud: 0,
                puntuacionTotalSucesosVitalesjuventud: 0,
                // --- Asesoría en planificación familiar ---
                asesoria_en_planificacion_familiar_metodo_elegido_juventud: null,
                asesoria_en_planificacion_familiar_criterio_elegibilidad_OMS_juventud: '1',
                // --- Información de salud ---
                informacion_salud_juventud: 'Se educa en signos de alarma, hábitos de vida saludable, prevención de ITS y salud mental.',
                // --- Plan de cuidado ---
                plan_cuidado_atencion_en_salud_bucal_por_profesional_odontologia_juventud: planFijo.atencion_bucal,
                plan_cuidado_glicemia_juventud: planFijo.glicemia,
                plan_cuidado_EKG_juventud: planFijo.ekg,
                plan_cuidado_creatinina_juventud: planFijo.creatinina,
                plan_cuidado_radiografia_torax_juventud: planFijo.radiografia_torax,
                plan_cuidado_colesterol_total_juventud: planFijo.colesterol_total,
                plan_cuidado_citologia_cervico_uterina_juventud: planFijo.citologia,
                plan_cuidado_trigliceridos_juventud: planFijo.trigliceridos,
                plan_cuidado_colposcopia_juventud: planFijo.colposcopia,
                plan_cuidado_uroanalisis_juventud: planFijo.uroanalisis,
                plan_cuidado_mamografia_juventud: planFijo.mamografia,
                plan_cuidado_microalbuminuria_juventud: planFijo.microalbuminuria,
                plan_cuidado_biopsia_juventud: planFijo.biopsia,
                plan_cuidado_prueba_COVID_juventud: planFijo.prueba_covid,
                plan_cuidado_prueba_otros_juventud: planFijo.otros,
                // --- Laboratorios ---
                laboratorio_clinico_resultado_sangre_oculta_juventud: null,
                laboratorio_clinico_fecha_sangre_oculta_juventud: fechaConsulta,
                laboratorio_clinico_observacion_sangre_oculta_juventud: '',
                laboratorio_clinico_resultado_colesterol_LDL_juventud: ldl,
                laboratorio_clinico_fecha_colesterol_LDL_juventud: fechaConsulta,
                laboratorio_clinico_observacion_colesterol_LDL_juventud: '',
                laboratorio_clinico_resultado_colesterol_total_juventud: colesterolTotal,
                laboratorio_clinico_fecha_colesterol_total_juventud: fechaConsulta,
                laboratorio_clinico_observacion_colesterol_total_juventud: '',
                laboratorio_clinico_resultado_antigeno_prostatico_juventud: null,
                laboratorio_clinico_fecha_antigeno_prostatico_juventud: fechaConsulta,
                laboratorio_clinico_observacion_antigeno_prostatico_juventud: '',
                laboratorio_clinico_resultado_colesterol_HDL_juventud: hdl,
                laboratorio_clinico_fecha_colesterol_HDL_juventud: fechaConsulta,
                laboratorio_clinico_observacion_colesterol_HDL_juventud: '',
                laboratorio_clinico_resultado_mamografia_juventud: null,
                laboratorio_clinico_fecha_mamografia_juventud: fechaConsulta,
                laboratorio_clinico_observacion_mamografia_juventud: '',
                laboratorio_clinico_resultado_trigliceridos_juventud: trigliceridos,
                laboratorio_clinico_fecha_trigliceridos_juventud: fechaConsulta,
                laboratorio_clinico_observacion_trigliceridos_juventud: '',
                laboratorio_clinico_resultado_glicemia_basal_juventud: glicemia,
                laboratorio_clinico_fecha_glicemia_basal_juventud: fechaConsulta,
                laboratorio_clinico_observacion_glicemia_basal_juventud: '',
                laboratorio_clinico_resultado_creatinina_sangre_juventud: creatinina,
                laboratorio_clinico_fecha_creatinina_sangre_juventud: fechaConsulta,
                laboratorio_clinico_observacion_creatinina_sangre_juventud: '',
                laboratorio_resultado_clinico_hepatitis_C_juventud: hepatitisC,
                laboratorio_clinico_fecha_hepatitis_C_juventud: fechaConsulta,
                laboratorio_clinico_observacion_hepatitis_C_juventud: '',
                laboratorio_clinico_resultado_prueba_rapida_hepatitis_B_juventud: hepatitisB,
                laboratorio_clinico_fecha_prueba_rapida_hepatitis_B_juventud: fechaConsulta,
                laboratorio_clinico_observacion_prueba_rapida_hepatitis_B_juventud: '',
                laboratorio_paraclinico_laboratorio_prueba_treponemica_rapida_sifilis_juventud: sifilis,
                laboratorio_paraclinico_laboratorio_fecha_prueba_treponemica_rapida_sifilis_juventud: fechaConsulta,
                laboratorio_clinico_observacion_prueba_treponemica_rapida_sifilis_juventud: '',
                laboratorio_clinico_resultado_prueba_rapida_VIH_juventud: vih,
                laboratorio_clinico_fecha_prueba_rapida_VIH_juventud: fechaConsulta,
                laboratorio_clinico_observacion_prueba_rapida_VIH_juventud: '',
                laboratorio_clinico_resultado_hemoglobina_juventud: hemoglobina,
                laboratorio_clinico_fecha_hemoglobina_juventud: fechaConsulta,
                laboratorio_clinico_observacion_hemoglobina_juventud: '',
                laboratorio_clinico_resultado_uroanalisis_juventud: null,
                laboratorio_clinico_fecha_uroanalisis_juventud: fechaConsulta,
                laboratorio_clinico_observacion_uroanalisis_juventud: '',
                // --- Tests (inicializados vacíos) ---
                test_audit_1: '',
                test_audit_2: '',
                test_audit_3: '',
                test_audit_4: '',
                test_audit_5: '',
                test_audit_6: '',
                test_audit_7: '',
                test_audit_8: '',
                test_audit_9: '',
                test_audit_10: '',
                test_audit: null,
                test_assits_1_a: '',
                test_assits_1_b: '',
                test_assits_1_c: '',
                test_assits_1_d: '',
                test_assits_1_e: '',
                test_assits_1_f: '',
                test_assits_1_g: '',
                test_assits_1_h: '',
                test_assits_1_i: '',
                test_assits_1_j: '',
                test_assits_1_j_texto: '',
                test_assits_2_a: '0',
                test_assits_2_b: '0',
                test_assits_2_c: '0',
                test_assits_2_d: '0',
                test_assits_2_e: '0',
                test_assits_2_f: '0',
                test_assits_2_g: '0',
                test_assits_2_h: '0',
                test_assits_2_i: '0',
                test_assits_2_j: '0',
                test_assits_2_j_texto: '',
                test_assits_3_a: '0',
                test_assits_3_b: '0',
                test_assits_3_c: '0',
                test_assits_3_d: '0',
                test_assits_3_e: '0',
                test_assits_3_f: '0',
                test_assits_3_g: '0',
                test_assits_3_h: '0',
                test_assits_3_i: '0',
                test_assits_3_j: '0',
                test_assits_3_j_texto: '',
                test_assits_4_a: '0',
                test_assits_4_b: '0',
                test_assits_4_c: '0',
                test_assits_4_d: '0',
                test_assits_4_e: '0',
                test_assits_4_f: '0',
                test_assits_4_g: '0',
                test_assits_4_h: '0',
                test_assits_4_i: '0',
                test_assits_4_j: '0',
                test_assits_4_j_texto: '',
                test_assits_5_b: '0',
                test_assits_5_c: '0',
                test_assits_5_d: '0',
                test_assits_5_e: '0',
                test_assits_5_f: '0',
                test_assits_5_g: '0',
                test_assits_5_h: '0',
                test_assits_5_i: '0',
                test_assits_5_j: '0',
                test_assits_5_j_texto: '',
                test_assits_6_a: '0',
                test_assits_6_b: '0',
                test_assits_6_c: '0',
                test_assits_6_d: '0',
                test_assits_6_e: '0',
                test_assits_6_f: '0',
                test_assits_6_g: '0',
                test_assits_6_h: '0',
                test_assits_6_i: '0',
                test_assits_6_j: '0',
                test_assits_6_j_texto: '',
                test_assits_7_a: '0',
                test_assits_7_b: '0',
                test_assits_7_c: '0',
                test_assits_7_d: '0',
                test_assits_7_e: '0',
                test_assits_7_f: '0',
                test_assits_7_g: '0',
                test_assits_7_h: '0',
                test_assits_7_i: '0',
                test_assits_7_j: '0',
                test_assits_7_j_texto: '',
                test_assint_a: null,
                test_assint_b: null,
                test_assint_c: null,
                test_assint_d: null,
                test_assint_e: null,
                test_assint_f: null,
                test_assint_g: null,
                test_assint_h: null,
                test_assint_i: null,
                test_assint_j: null,
                test_assint_8: 0,
                test_assint_patron_inyeccion: null,
                test_assint_guia_intervencion: 1,
                // --- Escalas (Zarit, EPOC, Whooley, Findrisc, GAD-2) ---
                radio_Escala_Zarit_su_familia_solicita_mas_ayuda_de_la_necesaria_0: false,
                radio_Escala_Zarit_su_familia_solicita_mas_ayuda_de_la_necesaria_1: false,
                radio_Escala_Zarit_su_familia_solicita_mas_ayuda_de_la_necesaria_2: false,
                radio_Escala_Zarit_su_familia_solicita_mas_ayuda_de_la_necesaria_3: false,
                radio_Escala_Zarit_su_familia_solicita_mas_ayuda_de_la_necesaria_4: false,
                resultadoEscalaZarit: null,
                test_epoc_pregunta1_tose_mucho_al_dia: false,
                test_epoc_pregunta2_tiene_contantes_flemas_o_mocos: false,
                test_epoc_pregunta3_se_queda_sin_aire: false,
                test_epoc_pregunta4_es_mayor_de_40: false,
                test_epoc_pregunta5_fuma_actualmente_o_es_exfumador: false,
                resultadoTestEpoc: 0,
                HistoriasPymJuventudInformacionSalud: [
                    { Id: null, IdHistoriaJuventud: 0, IdProcedimiento: '10774' },
                    { Id: null, IdHistoriaJuventud: 0, IdProcedimiento: '10792' },
                ],
                preguntas_de_whooley_p1_durante_los_ultimos_dias_se_ha_sentido_desanimado_a_menudo: false,
                preguntas_de_whooley_p2_durante_los_ultimos_dias_ha_sentido_poco_interes: false,
                puntuacion_test_whooley: '0',
                escala_findrisc_realiza_normalmente_30_minutos_de_actividad_fisica: true,
                escala_findrisc_con_que_frecuencia_come_frutas_verduras: '4',
                escala_findrisc_le_han_recetado_alguna_vez_nedicamentos_contra_la_hta: false,
                escala_findrisc_le_han_detectado_alguna_vez_niveles_altos_de_glucosa: false,
                escala_findrisc_ha_habido_algun_diagnostico_de_DM_en_su_familia: '0',
                puntuacion_escala_findrisc: '0',
                porcentaje_escala_findrisc: '1',
                riesgo_cardiovascular_edad_oms_juventud: edadStr,
                riesgo_cardiovascular_sexo_oms_juventud: (generoId === 1) ? 'MASCULINO' : 'FEMENINO',
                riesgo_cardiovascular_presion_arterial_oms_juventud: `${pa_sist}/${pa_diast}`,
                riesgo_cardiovascular_fumador_oms_juventud: false,
                riesgo_cardiovascular_imc_oms_juventud: imcStr,
                riesgo_cardiovascular_porcentaje_oms_juventud: '',
                escala_gad_2_sentirse_nervioso_ansioso_inquieto_PARA_NADA: true,
                escala_gad_2_sentirse_nervioso_ansioso_inquieto_ALGUNOS_DIAS: false,
                escala_gad_2_sentirse_nervioso_ansioso_inquieto_MAS_DE_LA_MITAD_DE_LOS_DIAS: false,
                escala_gad_2_sentirse_nervioso_ansioso_inquieto_CASI_TODOS_LOS_DIAS: false,
                escala_gad_2_no_poder_parar_o_controlar_la_preocupacion_PARA_NADA: true,
                escala_gad_2_no_poder_parar_o_controlar_la_preocupacion_ALGUNOS_DIAS: false,
                escala_gad_2_no_poder_parar_o_controlar_la_preocupacion_MAS_DE_LA_MITAD_DE_LOS_DIAS: false,
                escala_gad_2_no_poder_parar_o_controlar_la_preocupacion_CASI_TODOS_LOS_DIAS: false,
                puntuacion_escala_gad_2: '0',
            },
        ],
        // ============================================================
        // 10. BLOQUE RESOLUCION 4505 (CORREGIDO CON VALIDACIONES)
        // ============================================================
        resolucion4505: [
            {
                // --- Campos fijos ---
                sintomatico_respiratorio: "2",
                fecha_toma_baciloscopia_diagnostico: "1845-01-01",
                resultado_baciloscopia_diagnostico: "4",
                consumo_tabaco: "99",
                clasificacion_riesgo_cardiovascular: riesgoCardiovascular ? String(riesgoCardiovascular) : "21",
                "clasificación_riesgo_metabolico": riesgoMetabolico ? String(riesgoMetabolico) : "21",
                tratamiento_ablativo_escision_inspeccion_visual: "0",
                // --- Gestación (solo mujeres ≥10) ---
                gestacion: esMujerReproductiva ? "2" : "0",
                // --- CÁNCER DE CÉRVIX (valores fijos según tabla) ---
                tamizaje_cancer_cuello_uterino: esMujerReproductiva ? "21" : "0",
                resultado_tamizaje_cancer_cuello_uterino: esMujerReproductiva ? "21" : "0",
                calidad_muestra_citologia_cervicouterina: "0",
                codigo_habilitacion_IPS_citologia_cervicouterina: "0",
                resultado_biopsia_cervicouterina: esMujerReproductiva ? "21" : "0",
                // --- Fechas de cuello uterino (biopsia siempre 1845 por validación) ---
                citologia_cervicouterina: esMujerReproductiva ? "1800-01-01" : "1845-01-01",
                fecha_colposcopia: esMujerReproductiva ? "1800-01-01" : "1845-01-01",
                fecha_biopsia_cervical: esMujerReproductiva ? "1800-01-01" : "1845-01-01", // Siempre comodín (no se realiza en juventud)
                // --- MAMA (para juventud: no aplica por edad) ---
                fecha_mamografía: "1845-01-01", // Corregido: 1845 (no 1800) para <35 años
                resultado_mamografia_res202: "21",
                fecha_toma_biopsia_seno_BACAF: "1845-01-01",
                fecha_resultado_biopsia_seno_BACAF: "1845-01-01",
                resultado_biopsia_mama: "21",
                // --- PLANIFICACIÓN FAMILIAR ---
                suministro_metodo_anticonceptivo: esMujer ? "21" : "1",
                planificación_familiar_primera_vez: "1800-01-01",
                fecha_suministro_metodo_anticonceptivo: "1800-01-01",
                // --- LABORATORIOS (corregidos: si no hay dato, fecha=1800 y resultado=998) ---
                codigo_pais: "170",
                fecha_consulta_valoracion_integral: fechaConsulta,
                // Glicemia
                resultado_glicemia_basal: (glicemia !== null && glicemia > 0 && glicemia < 998) ? String(glicemia) : "998",
                fecha_toma_glicemia_basal: (glicemia !== null && glicemia > 0 && glicemia < 998) ? fechaConsulta : "1800-01-01",
                // LDL
                resultado_LDL: (ldl !== null && ldl > 0 && ldl < 998) ? String(ldl) : "998",
                fecha_toma_LDL: (ldl !== null && ldl > 0 && ldl < 998) ? fechaConsulta : "1800-01-01",
                // HDL
                resultado_HDL: (hdl !== null && hdl > 0 && hdl < 998) ? String(hdl) : "998",
                fecha_toma_HDL: (hdl !== null && hdl > 0 && hdl < 998) ? fechaConsulta : "1800-01-01",
                // Triglicéridos
                resultado_trigliceridos: (trigliceridos !== null && trigliceridos > 0 && trigliceridos < 998) ? String(trigliceridos) : "998",
                fecha_toma_trigliceridos: (trigliceridos !== null && trigliceridos > 0 && trigliceridos < 998) ? fechaConsulta : "1800-01-01",
                // Hemoglobina (mantiene 1845 por ser validación especial)
                resultado_hemoglobina: (hemoglobina !== null && hemoglobina > 0) ? String(hemoglobina) : "0",
                fecha_toma_hemoglobina: (hemoglobina !== null && hemoglobina > 0) ? fechaConsulta : "1845-01-01",
                // Creatinina
                resultado_creatinina: (creatinina !== null && creatinina > 0 && creatinina < 998) ? String(creatinina) : "998",
                fecha_creatinina: (creatinina !== null && creatinina > 0 && creatinina < 998) ? fechaConsulta : "1800-01-01",
                // --- Agudeza visual ---
                agudeza_visual_lejana_ojo_izquierdo: agudezaToCode(ojoIzquierdo),
                agudeza_visual_lejana_ojo_derecho: agudezaToCode(ojoDerecho),
                valoracion_agudeza_visual: fechaConsulta,
                // --- Pruebas rápidas ---
                resultado_antigeno_superficie_hepatitisB_toda: hepBMap.codigo,
                fecha_antigeno_superficie_hepatitisB_toda: fechaHepB,
                resultado_prueba_tamizaje_sifilis: sifilisMap.codigo,
                fecha_serologia_sifilis: fechaSifilis,
                resultado_prueba_VIH: vihMap.codigo,
                fecha_tomae_elisa_VIH: fechaVIH,
            },
        ],
        historia_clinica_procedimientos_vacunacion: [],
    };
}
