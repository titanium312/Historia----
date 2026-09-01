"use strict";
// services/adultez.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.adultez = void 0;
/**
 * Convierte una fecha en formato /Date(ms)/ a string AAAA-MM-DD
 * Si no es válida, retorna null
 */
function parseFechaAdmision(fecha) {
    if (!fecha)
        return null;
    try {
        if (typeof fecha === 'string' && fecha.startsWith('/Date(')) {
            const ms = parseInt(fecha.slice(6, -2), 10);
            if (!isNaN(ms))
                return new Date(ms);
        }
        const d = new Date(fecha);
        if (!isNaN(d.getTime()))
            return d;
    }
    catch (e) { /* ignore */ }
    return null;
}
/**
 * Formatea una fecha a AAAA-MM-DD
 */
function formatFecha(fecha) {
    if (!fecha)
        return '';
    let d;
    if (typeof fecha === 'string') {
        const parsed = parseFechaAdmision(fecha);
        if (parsed)
            d = parsed;
        else {
            const maybe = new Date(fecha);
            if (!isNaN(maybe.getTime()))
                d = maybe;
            else
                return '';
        }
    }
    else {
        d = fecha;
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
/**
 * Obtiene la fecha de admisión en formato AAAA-MM-DD (fallback a fecha actual)
 */
function getFechaAdmisionFormateada(admision) {
    if (admision?.fecha_admision) {
        const d = parseFechaAdmision(admision.fecha_admision);
        if (d)
            return formatFecha(d);
    }
    return formatFecha(new Date());
}
/**
 * Resta un año a una fecha en formato AAAA-MM-DD
 * Si la fecha es especial (1845-01-01) la devuelve igual
 */
function restarUnAnio(fechaStr) {
    if (!fechaStr || fechaStr === '1845-01-01')
        return '1845-01-01';
    const partes = fechaStr.split('-');
    if (partes.length === 3) {
        const year = parseInt(partes[0], 10) - 1;
        return `${year}-${partes[1]}-${partes[2]}`;
    }
    return fechaStr;
}
/**
 * Ajusta consistencia entre fecha y resultado de laboratorio
 * Regla: si el resultado es válido, la fecha debe ser válida (no especial).
 *        si el resultado no es válido, se fuerza fecha especial y valor por defecto.
 */
function ajustarLaboratorio(valor, fecha, fechaAdmision, esHemoglobina = false) {
    const fechasEspeciales = ['1800-01-01', '1805-01-01', '1810-01-01', '1825-01-01', '1830-01-01', '1835-01-01'];
    const fechaNoAplica = '1845-01-01';
    let valorNum = Number(valor);
    if (isNaN(valorNum))
        valorNum = esHemoglobina ? 0 : 998;
    const esValido = !esHemoglobina
        ? (valorNum > 0 && valorNum < 998 && valorNum !== 998)
        : (valorNum > 0);
    if (esValido) {
        if (!fecha || fecha === '' || fechasEspeciales.includes(fecha) || fecha === fechaNoAplica) {
            return { valor: valorNum, fecha: fechaAdmision };
        }
        else {
            return { valor: valorNum, fecha };
        }
    }
    else {
        if (esHemoglobina) {
            return { valor: 0, fecha: fechaNoAplica };
        }
        else {
            return { valor: 998, fecha: '1800-01-01' };
        }
    }
}
const adultez = (data) => {
    // ==========================================================
    // 1. Extraer datos básicos
    // ==========================================================
    const { admision, paciente, historia, facturacion, edad, sexoId, generoTexto, datosClinicos } = data;
    const esMasculino = (sexoId === 2 || generoTexto?.toUpperCase() === 'MASCULINO');
    const esMujer = !esMasculino;
    // ==========================================================
    // 2. Datos antropométricos
    // ==========================================================
    const peso = datosClinicos?.antropometricos?.peso ?? 70;
    const talla = datosClinicos?.antropometricos?.talla ?? 160;
    const imc = peso / ((talla / 100) ** 2);
    const fechaAdmisionStr = getFechaAdmisionFormateada(admision);
    // ==========================================================
    // 3. Laboratorios ajustados
    // ==========================================================
    const glicemiaOrig = datosClinicos?.laboratorios?.glicemia_basal?.valor ?? 0;
    const fechaGlicemiaOrig = datosClinicos?.laboratorios?.glicemia_basal?.fecha || '';
    const ldlOrig = datosClinicos?.laboratorios?.ldl?.valor ?? 0;
    const fechaLDLOrig = datosClinicos?.laboratorios?.ldl?.fecha || '';
    const hdlOrig = datosClinicos?.laboratorios?.hdl?.valor ?? 0;
    const fechaHDLOrig = datosClinicos?.laboratorios?.hdl?.fecha || '';
    const trigOrig = datosClinicos?.laboratorios?.trigliceridos?.valor ?? 0;
    const fechaTrigOrig = datosClinicos?.laboratorios?.trigliceridos?.fecha || '';
    const creatOrig = datosClinicos?.laboratorios?.creatinina?.valor ?? 0;
    const fechaCreatOrig = datosClinicos?.laboratorios?.creatinina?.fecha || '';
    const hemoOrig = datosClinicos?.laboratorios?.hemoglobina?.valor ?? 0;
    const fechaHemoOrig = datosClinicos?.laboratorios?.hemoglobina?.fecha || '';
    const labGlicemia = ajustarLaboratorio(glicemiaOrig, fechaGlicemiaOrig, fechaAdmisionStr, false);
    const labLDL = ajustarLaboratorio(ldlOrig, fechaLDLOrig, fechaAdmisionStr, false);
    const labHDL = ajustarLaboratorio(hdlOrig, fechaHDLOrig, fechaAdmisionStr, false);
    const labTrig = ajustarLaboratorio(trigOrig, fechaTrigOrig, fechaAdmisionStr, false);
    const labCreat = ajustarLaboratorio(creatOrig, fechaCreatOrig, fechaAdmisionStr, false);
    const labHemo = ajustarLaboratorio(hemoOrig, fechaHemoOrig, fechaAdmisionStr, true);
    const glicemia = labGlicemia.valor;
    const fechaGlicemia = labGlicemia.fecha;
    const ldl = labLDL.valor;
    const fechaLDL = labLDL.fecha;
    const hdl = labHDL.valor;
    const fechaHDL = labHDL.fecha;
    const trigliceridos = labTrig.valor;
    const fechaTrigliceridos = labTrig.fecha;
    const creatinina = labCreat.valor;
    const fechaCreatinina = labCreat.fecha;
    const hemoglobina = labHemo.valor;
    const fechaHemoglobina = labHemo.fecha;
    // ==========================================================
    // 4. Salud visual, riesgos, estado nutricional
    // ==========================================================
    const agudezaVisual = datosClinicos?.salud_visual?.ojo_derecho || "20/20";
    const riesgoCV = datosClinicos?.clasificaciones_riesgo?.cardiovascular ?? "21";
    const riesgoMet = datosClinicos?.clasificaciones_riesgo?.metabolico ?? "21";
    let estadoNutricional = "normal";
    if (imc >= 25 && imc < 30)
        estadoNutricional = "sobrepeso";
    else if (imc >= 30)
        estadoNutricional = "obesidad";
    else if (imc < 18.5)
        estadoNutricional = "bajo peso";
    // ==========================================================
    // 5. Diagnósticos y plan de tamizajes según edad y sexo
    // ==========================================================
    const diagnosticos = ["Z000"];
    if (imc >= 30)
        diagnosticos.push("E660");
    const esMujer50a69 = esMujer && edad >= 50 && edad <= 69;
    const plan = {
        glicemia: esMujer50a69 ? 1 : 0,
        creatinina: esMujer50a69 ? 1 : 0,
        colesterol: esMujer50a69 ? 1 : 0,
        trigliceridos: esMujer50a69 ? 1 : 0,
        citologia: (esMujer && edad >= 10) ? 1 : 0,
        mamografia: esMujer50a69 ? 1 : 0,
        sangre_oculta: (edad >= 50) ? 1 : 0,
        uroanalisis: esMujer50a69 ? 1 : 0,
        hepatitisB: esMujer50a69 ? 1 : 0,
        hepatitisC: esMujer50a69 ? 1 : 0,
        VIH: esMujer50a69 ? 1 : 0,
        sifilis: esMujer50a69 ? 1 : 0,
        antigeno_prostatico: (esMasculino && edad >= 45) ? 1 : 0,
        colposcopia: 0,
        colonoscopia: (edad >= 50) ? 1 : 0,
        tacto_rectal: (edad >= 45) ? 1 : 0,
        PSA: (esMasculino && edad >= 45) ? 1 : 0,
    };
    // ==========================================================
    // 6. Gineco-obstétricos (solo mujeres)
    // ==========================================================
    const gineco = esMujer ? {
        menarca: "12 años",
        duracion_ciclo: "28 días",
        inicio_relaciones: "20 años",
        embarazos: "2",
        partos: "2",
        gemelar: "0",
        abortos: "0",
        mamografias: "No registra previas, se ordena primera.",
        citologia: "No registra previas, se ordena primera.",
        ecografia: "No registra.",
        flujos: "Negados.",
        mestruacion: "Regular, sin alteraciones.",
        cesarias: "0",
        menopausia: "50 años (actualmente en menopausia)",
        primer_parto: "25 años",
        ultimo_parto: "30 años",
        observaciones: "Antecedente obstétrico sin complicaciones. Partos vaginales. Menopausia a los 50 años.",
        nacidos_vivos: "2",
        nacidos_muertos: "0",
        viven: "2",
        muertos: "0",
        muertos_primera_semana: "0",
        muertos_despues_primera_semana: "0",
        recien_nacido_peso_menor_2500: "0",
        embarazos_ectopicos: "0",
        mola: "0"
    } : {};
    // ==========================================================
    // 7. Hora de admisión
    // ==========================================================
    const hora = admision?.hora_admision || { Hours: 13, Minutes: 23 };
    const horaStr = `${String(hora.Hours).padStart(2, '0')}:${String(hora.Minutes).padStart(2, '0')}`;
    // ==========================================================
    // 8. Textos dinámicos
    // ==========================================================
    const enfermedadActual = `Paciente de ${edad} años en control de promoción y mantenimiento (PYM). Sin síntomas ni signos de alarma. `;
    const analisis = `Examen físico sin alteraciones. IMC ${imc.toFixed(1)} (${estadoNutricional}). `;
    // ==========================================================
    // 9. CONSTRUCCIÓN DEL OBJETO FINAL
    // ==========================================================
    const resultado = {
        // ---------- Campos principales ----------
        id_historia: String(historia?.id_historia || 0),
        numero_historia: String(historia?.numero_historia || 0),
        hora_historia: horaStr,
        fk_servicio_ingreso: "2",
        fk_admision: String(admision?.id_admision || 0),
        fk_procedimiento: "8138",
        motivo_consulta_historia: "RUTA_ADULTEZ",
        fk_finalidad_consulta: "12",
        IdActividad: "5",
        fk_paciente: String(paciente?.id_paciente || 0),
        telefono_paciente: paciente?.telefono || "",
        numero_admision: String(admision?.numero_admision || 0),
        fk_factura_consultas: String(facturacion?.id_factura_consultas || 0),
        motivo_consulta_consulta_externa: esMasculino ? `Control del adulto (${edad} años)` : `Control de la adulta (${edad} años)`,
        // ---------- Facturación / acompañantes ----------
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
                EnfoqueDiferencialIdGenero: esMasculino ? "2" : "1",
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
                EnfoqueOtroGrupoPoblacional: "0"
            }
        },
        // ---------- Enfermedad actual y análisis ----------
        enfermedad_actual_historia: enfermedadActual,
        analisis_historia: analisis,
        // ---------- Revisiones por sistemas (textos fijos) ----------
        revision_sistema_general_historia: "Sin alteraciones. Paciente refiere encontrarse en su estado habitual, sin fiebre, sin pérdida de peso, sin astenia, sin adinamia.",
        revision_sistema_organos_sentidos_historia: "Sin alteraciones. Visión y audición conservadas para la edad, sin tinnitus, sin vértigo.",
        revision_sistema_cabeza_historia: "Sin alteraciones. Niega cefalea, mareo, sincope, o trauma craneoencefálico.",
        revision_sistema_cuello_historia: "Sin alteraciones. Niega dolor cervical, adenopatías, bocio o disfagia.",
        revision_sistema_cavidad_bucal_historia: "Sin alteraciones. Refiere higiene oral diaria, niega sangrado gingival, lesiones o prótesis.",
        revision_sistema_piel_faneras_historia: "Sin alteraciones. Piel hidratada, sin lesiones, sin prurito, sin cambios de coloración, uñas y cabello normales.",
        revision_sistema_cardiovascular_historia: "Sin alteraciones. Niega dolor torácico, palpitaciones, edema de miembros inferiores o disnea de esfuerzo.",
        revision_sistema_respitatorio_historia: "Sin alteraciones. Niega tos, expectoración, hemoptisis, disnea, sibilancias o dolor torácico respiratorio.",
        revision_sistema_gastrointestinal_historia: "Sin alteraciones. Niega náuseas, vómitos, pirosis, dolor abdominal, cambios del hábito intestinal o sangrado digestivo.",
        revision_sistema_genitourinario_historia: "Sin alteraciones. Niega disuria, polaquiuria, tenesmo, hematuria, incontinencia o flujo vaginal anormal.",
        revision_sistema_osteomoscular_articular_historia: "Sin alteraciones. Niega artralgias, mialgias, limitación funcional, deformidades o fracturas previas.",
        revision_sistema_nervioso_historia: "Sin alteraciones. Niega alteraciones sensitivas, motoras, de la coordinación, temblores o alteración del nivel de conciencia.",
        revision_sistema_endocrino_historia: "Sin alteraciones. Niega intolerancia al frío/calor, alteración del peso, polidipsia, poliuria, polifagia, hirsutismo o galactorrea.",
        revision_sistema_psiquico_mental_historia: "Sin alteraciones. Niega alteración del estado de ánimo, ansiedad, ideación suicida, alucinaciones o trastornos del sueño.",
        revision_sistema_hematopoyetico_historia: "Sin alteraciones. Niega sangrados, hematomas espontáneos, petequias, ictericia o palidez.",
        // ---------- Valoraciones ----------
        valoracion_espiritual: "No se evidencian conflictos espirituales significativos. Refiere apoyo en su comunidad religiosa.",
        valoracion_emocional: "Paciente en aparente estabilidad emocional. Manifiesta sentirse bien consigo misma.",
        valoracion_emocional_tristeza: "Negada.",
        valoracion_emocional_ideacion_muerte: "Negada.",
        valoracion_emocional_anciedad: "Negada.",
        valoracion_emocional_angustia: "Negada.",
        valoracion_emocional_miedo: "Negado.",
        valoracion_emocional_panico: "Negado.",
        valoracion_emocional_estres: "Niega estrés significativo actual.",
        valoracion_emocional_viviencias: "Sin eventos vitales estresantes recientes.",
        valoracion_emocional_deseo_adelantar_muerte: "Negado.",
        valoracion_emocional_preocupaciones_principales: "Refiere preocupación por su peso, pero con disposición a mejorar hábitos.",
        valoracion_emocional_asuntos_pendientes: "Ninguno referido.",
        // ---------- Barthel / Norton ----------
        barthel_comer: "-1",
        barthel_lavarse: "-1",
        barthel_vestirse: "-1",
        barthel_arreglarse: "-1",
        barthel_deposiciones: "-1",
        barthel_miccion: "-1",
        barthel_retrete: "-1",
        barthel_trasladarse: "-1",
        barthel_deambular: "-1",
        barthel_escalones: "-1",
        norton_estado_fisico: "-1",
        norton_estado_mental: "-1",
        norton_actividad: "-1",
        norton_movilidad: "-1",
        norton_incontinencia: "-1",
        // ---------- Conducta y plan ----------
        conducta_historia: "Se realiza valoración integral de promoción y mantenimiento en adultez. Se generan órdenes de tamizajes preventivos completos (glicemia, perfil lipídico, creatinina, citología cervicouterina, mamografía, sangre oculta en heces, uroanálisis, pruebas rápidas VIH, Hepatitis B, Hepatitis C, Sífilis). Se educa en signos de alarma, hábitos saludables y prevención de COVID-19. Se remite a consulta de Nutrición y Dietética por obesidad Grado I (IMC 32.09). Se agenda cita de control para entrega de resultados en 15 días.",
        signos_de_alarma_educacion: "Se educó a la paciente sobre signos de alarma: dolor en el pecho, cefalea intensa, dolor abdominal severo, edema de pies y manos, fiebre persistente, hemorragia vaginal anormal, pérdida de peso inexplicable, cambios en hábitos intestinales o urinarios. Se instruyó para consultar ante la aparición de cualquiera de estos síntomas.",
        plan_tratamiento_descripcion_historia: "1. Tamizajes preventivos según Resolución 3280: glicemia, perfil lipídico, creatinina, citología cervicouterina, mamografía, sangre oculta en heces, uroanálisis, pruebas rápidas VIH, Hepatitis B, Hepatitis C y Sífilis. 2. Remisión a consulta de Nutrición y Dietética para manejo de obesidad Grado I. 3. Educación en hábitos de vida saludable (actividad física, alimentación balanceada, hidratación adecuada). 4. Control en 15 días para entrega de resultados.",
        // ---------- Antecedentes tóxicos ----------
        antecedentes_toxicos_cigarrillo_cantidad_dia_historia: "0",
        antecedentes_toxicos_cigarrillo_annos_uso_historia: "0",
        antecedentes_toxicos_humo_lenna_annos_uso_historia: "0",
        antecedentes_toxicos_alcohol_annos_uso_historia: "0",
        antecedentes_toxicos_farmaco_cual_historia: "",
        antecedentes_toxicos_otro_cual_historia: "",
        antecedentes_toxicos_observaciones_historia: "Niega consumo de tabaco, alcohol o sustancias psicoactivas.",
        antecedentes_toxicos_consumo_alcohol: "2",
        antecedentes_toxicos_consumo_psicoactiva: "2",
        antecedentes_toxicos_fumador_pasivo: false,
        antecedentes_toxicos_estimulantes: "",
        // ---------- Antecedentes personales ----------
        historiaClinicaPrincipiosActivosAntecedentesPersonales: [],
        fk_hemoclasificacion: "",
        antecedetes_personales_hospitalizaciones_historia: "Ninguna.",
        antecedetes_personales_tranfusiones_historia: "Ninguna.",
        antecedetes_personales_otro_cual_historia: "",
        antecedetes_personales_observaciones_historia: "Sin antecedentes personales de importancia.",
        antecedetes_personales_habitos_saludables: "Alimentación variada, sin ejercicio regular.",
        antecedetes_personales_comportamiento_general: "Paciente colaboradora y consciente.",
        antecedetes_personales_traumatologicos: "Niega fracturas o cirugías ortopédicas.",
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
        // ---------- Antecedentes familiares ----------
        antecedentes_familiares_observaciones_historia: "Madre hipertensa, padre fallecido por accidente. Sin antecedentes de diabetes o cáncer.",
        historia_clinica_enfermedades_antecedentes_familiares: null,
        antecedentes_familiares_muerte_hermanos: false,
        antecedentes_exposicion_violencia: false,
        antecedentes_familiares_preeclampcia: false,
        antecedentes_familiares_enfermedad_cardiaca: false,
        antecedentes_familiares_malformaciones: false,
        antecedentes_familiares_consumo_alcohol: false,
        antecedentes_familiares_sustancias_psicoactivas: false,
        antecedentes_familiares_estructura_familiar: "Familia nuclear de 4 integrantes, conyuge y dos hijos.",
        antecedentes_familiares_condiciones_socioeconomicas: "Estrato socioeconómico medio-bajo, vivienda propia.",
        antecedentes_familiares_redes_apoyo: "Cuenta con apoyo familiar y vecinal.",
        antecedentes_familiares_situacion_escolar_laboral: "Ama de casa, escolaridad básica.",
        // ---------- Hereditarios ----------
        hemofilia_el: "0", hemofilia_familia_el: "0", hemofilia_ella: "0", hemofilia_familia_ella: "0",
        trast_coagulacion_el: "0", trast_coagulacion_familia_el: "0", trast_coagulacion_ella: "0", trast_coagulacion_familia_ella: "0",
        anemia_falciforme_el: "0", anemia_falciforme_familia_el: "0", anemia_falciforme_ella: "0", anemia_falciforme_familia_ella: "0",
        talasemia_el: "0", talasemia_familia_el: "0", talasemia_ella: "0", talasemia_familia_ella: "0",
        sindrome_down_el: "0", sindrome_down_familia_el: "0", sindrome_down_ella: "0", sindrome_down_familia_ella: "0",
        retardomental_el: "0", retardomental_familia_el: "0", retardomental_ella: "0", retardomental_familia_ella: "0",
        otrascromosopatias_el: "0", otrascromosopatias_familia_el: "0", otrascromosopatias_ella: "0", otrascromosopatias_familia_ella: "0",
        enfermedad_taysachs_el: "0", enfermedad_taysachs_familia_el: "0", enfermedad_taysachs_ella: "0", enfermedad_taysachs_familia_ella: "0",
        distrofia_muscular_el: "0", distrofia_muscular_familia_el: "0", distrofia_muscular_ella: "0", distrofia_muscular_familia_ella: "0",
        fibrosis_quistica_el: "0", fibrosis_quistica_familia_el: "0", fibrosis_quisticar_ella: "0", fibrosis_quistica_familia_ella: "0",
        defectos_tubo_neural_el: "0", defectos_tubo_neural_familia_el: "0", defectos_tubo_neural_ella: "0", defectos_tubo_neural_familia_ella: "0",
        otros_el: "0", otros_familia_el: "0", otros_ella: "0", otros_familia_ella: "0",
        // ---------- Patológicos y alergias ----------
        historia_clinica_enfermedades_antecedentes_patologicos: [],
        antecedetes_patologicos_observaciones_historia: "",
        historiaClinicaPrincipiosActivosAntecedentesAlergicos: [],
        antecedentes_alergicos_otras_alergias_historia: "Negadas.",
        antecedentes_alergicos_observaciones_historia: "No refiere alergias medicamentosas, alimentarias o ambientales.",
        antecedentes_alergicos_alimentos: "Negados.",
        antecedentes_alergicos_ambientales: "Negados.",
        antecedentesAlergicosPiel: "Negados.",
        antecedentesAlergicosPicaduraInsectos: "Negados.",
        // ---------- Vacunación y quirúrgicos ----------
        historia_clinica_procedimientos_antecedentes_vacunacion: [],
        antecedentes_vacunacion_esquema_historia: "0",
        antecedetes_vacunacion_observaciones_historia: "Esquema de vacunación completo para la edad (COVID-19, influenza, neumococo, Tdap, etc.).",
        historia_clinica_procedimientos_antecedentes_quirurgicos: [],
        antecedetes_quirurgicos_observaciones_historia: "Niega intervenciones quirúrgicas previas.",
        // ---------- Gineco-obstétricos ----------
        antecedentes_gineco_obstetricos_menarca: esMujer ? (gineco.menarca || "") : "",
        antecedentes_gineco_obstetricos_duracion_ciclo: esMujer ? (gineco.duracion_ciclo || "") : "",
        antecedentes_gineco_obstetricos_inicio_relaciones: esMujer ? (gineco.inicio_relaciones || "") : "",
        antecedentes_gineco_obstetricos_embarazos: esMujer ? (gineco.embarazos || "") : "",
        antecedentes_gineco_obstetricos_partos: esMujer ? (gineco.partos || "") : "",
        antecedentes_gineco_obstetricos_gemelar: esMujer ? (gineco.gemelar || "") : "",
        antecedentes_gineco_obstetricos_abortos: esMujer ? (gineco.abortos || "") : "",
        antecedentes_gineco_obstetricos_mamografias: esMujer ? (gineco.mamografias || "") : "",
        antecedentes_gineco_obstetricos_citologia: esMujer ? (gineco.citologia || "") : "",
        antecedentes_gineco_obstetricos_ecografia: esMujer ? (gineco.ecografia || "") : "",
        antecedentes_gineco_obstetricos_flujos: esMujer ? (gineco.flujos || "") : "",
        antecedentes_gineco_obstetricos_mestruacion: esMujer ? (gineco.mestruacion || "") : "",
        antecedentes_gineco_obstetricos_cesarias: esMujer ? (gineco.cesarias || "") : "",
        antecedentes_gineco_obstetricos_menopausia: esMujer ? (gineco.menopausia || "") : "",
        antecedentes_gineco_obstetricos_primer_parto: esMujer ? (gineco.primer_parto || "") : "",
        antecedentes_gineco_obstetricos_ultimo_parto: esMujer ? (gineco.ultimo_parto || "") : "",
        fk_metodo_anticonceptivo: "0",
        antecedentes_gineco_obstetricos_grupo_sanguineo_pareja: "0",
        antecedentes_gineco_obstetricos_observaciones: esMujer ? (gineco.observaciones || "") : "",
        antecedentes_gineco_obstetricos_fecha_terminacion_ultimo_embarazo: "",
        antecedentes_gineco_obstetricos_embarazos_ectopicos: esMujer ? (gineco.embarazos_ectopicos || "") : "",
        antecedentes_gineco_obstetricos_mola: esMujer ? (gineco.mola || "") : "",
        antecedentes_gineco_obstetricos_nacidos_vivos: esMujer ? (gineco.nacidos_vivos || "") : "",
        antecedentes_gineco_obstetricos_nacidos_muertos: esMujer ? (gineco.nacidos_muertos || "") : "",
        antecedentes_gineco_obstetricos_viven: esMujer ? (gineco.viven || "") : "",
        antecedentes_gineco_obstetricos_muertos: esMujer ? (gineco.muertos || "") : "",
        antecedentes_gineco_obstetricos_muertos_primera_semana: esMujer ? (gineco.muertos_primera_semana || "") : "",
        antecedentes_gineco_obstetricos_muertos_despues_primera_semana: esMujer ? (gineco.muertos_despues_primera_semana || "") : "",
        antecedentes_gineco_obstetricos_recien_nacido_peso_menor_2500: esMujer ? (gineco.recien_nacido_peso_menor_2500 || "") : "",
        antecedentes_gineco_obstetricos_fecha_mamografias: "",
        antecedentes_gineco_obstetricos_resultado_ultima_citologia: "",
        antecedentes_reproductivos_ciclo_menstrual_preconcepcional: "1",
        antecedentes_reproductivos_duracion_ciclo_preconcepcional: "",
        antecedentes_reproductivos_vida_sexual_activa_preconcepcional: "0",
        antecedentes_reproductivos_utiliza_preservativos_preconcepcional: "0",
        antecedentes_reproductivos_numero_companeros_sexuales_preconcepcional: "",
        antecedentes_reproductivos_peso_ultimo_recien_nacido_preconcepcional: "0",
        antecedentes_reproductivos_muerte_fetal_previa_preconcepcional: "0",
        antecedentes_reproductivos_gran_multiparidad_preconcepcional: "0",
        antecedentes_reproductivos_periodo_intergesico_menor_24_preconcepcional: "0",
        antecedentes_reproductivos_imcompatibilida_rh_preconcepcional: "0",
        antecedentes_reproductivos_preeclampsia_embarazo_anterior_preconcepcional: "0",
        antecedentes_reproductivos_antecedente_nacido_macrosimico_preconcepcional: "0",
        antecedentes_reproductivos_hemorragia_postparto_preconcepcional: "0",
        antecedentes_reproductivos_embarazo_molar_preconcepcional: "0",
        antecedentes_reproductivos_depresion_postparto_preconcepcional: "0",
        antecedentes_reproductivos_recien_nacido_tubo_neural_preconcepcional: "0",
        antecedentes_reproductivos_planea_embarazo_3_meses_preconcepcional: "0",
        antecedentes_reproductivos_ordena_acido_folico_preconcepcional: "0",
        antecedentes_vejez_deterioro_cognitivo: false,
        antecedentes_vejez_inmobilidad: false,
        antecedentes_vejez_inestabilidad_caidas: false,
        antecedentes_vejez_fragilidad: false,
        antecedentes_vejez_control_esfinteres: false,
        antecedentes_vejez_depresion: false,
        antecedentes_vejez_iatogenia: false,
        antecedentes_vejes_observaciones: "Paciente autónoma, sin síndromes geriátricos.",
        // ---------- Signos vitales y antropometría ----------
        hallazgos_fisicos_signos_vitales_ta_historia: "120/80",
        hallazgos_fisicos_signos_vitales_fr_historia: 18,
        hallazgos_fisicos_signos_vitales_t_historia: 36.5,
        hallazgos_fisicos_signos_vitales_fc_historia: 80,
        hallazgos_fisicos_signos_vitales_talla_historia: talla,
        hallazgos_fisicos_signos_vitales_peso_historia: peso,
        hallazgos_fisicos_signos_vitales_sc_historia: "1.30",
        hallazgos_fisicos_signos_vitales_perimetro_cefalico_historia: "",
        hallazgos_fisicos_signos_vitales_saturacion_oxigeno: 97,
        hallazgos_fisicos_signos_vitales_idmc_historia: parseFloat(imc.toFixed(2)),
        // ---------- Hallazgos físicos ----------
        hallazgos_fisicos_otros_cabeza_historia: "Normocéfalo, pupilas isocóricas normorreactivas, fosas nasales permeables, cavidad oral normal.",
        hallazgos_fisicos_otros_cuello_historia: "Simétrico, móvil, sin adenopatías, sin ingurgitación yugular.",
        hallazgos_fisicos_otros_torax_historia: "Simétrico, sin deformidades. RSC: rítmicos, sin soplos, bien timbrados. CSPS: ventilados, sin estertores.",
        hallazgos_fisicos_otros_abdomen_historia: "Blando, depresible, sin masas palpables, sin visceromegalias, no doloroso. RSHS: normales.",
        hallazgos_fisicos_otros_genitourinario_historia: "Genitales externos normales. Puñopercusión negativa.",
        hallazgos_fisicos_otros_pelvis_historia: "Simétrica, sin deformidades, buena movilidad coxofemoral.",
        hallazgos_fisicos_otros_dorso_historia: "Simétrico, sin deformidades, sin edemas.",
        hallazgos_fisicos_otros_neurologico_historia: "Glasgow 15/15, consciente, orientada en tiempo y espacio, motricidad y sensibilidad general conservadas.",
        hallazgos_fisicos_otros_piel_historia: "Hidratada, aspecto y coloración normal, sin lesiones.",
        hallazgos_fisicos_otros_otro_historia: "Emuntorios normales.",
        // ---------- Diagnósticos ----------
        diagnostico_ingreso_tipo_historia: "2",
        diagnostico_ingreso_fk_causa_externa: "1",
        diagnostico_ingreso_observaciones_historia: "",
        historia_clinica_enfermedades_diagnostico_ingreso: diagnosticos.map(d => ({
            id_historia_enfermedad_diagnostico_ingreso: 0,
            fk_historia: 0,
            fk_enfermedad: d,
            fk_institucion: 0
        })),
        diagnostico_principales_observaciones_consulta_externa: `Paciente asintomática en control de rutina.${imc >= 30 ? ' Se detecta obesidad Grado I y se inicia tamizaje completo.' : ''}`,
        diagnostico_relacional_tipo_historia: "0",
        diagnostico_relacional_fk_causa_externa: "0",
        diagnostico_relacional_observaciones_historia: "",
        historia_clinica_enfermedades_diagnostico_relacional: [],
        // ---------- Remisiones, insumos, etc. ----------
        remisiones: null,
        historia_clinica_articulos: [],
        EntregaMedicamentosObservaciones: "",
        HistoriaClinicaMaterialesInsumos: [
            { IdHistoriaClinicaArticulo: 0, fk_historia: String(historia?.id_historia || 0), fk_institucion: 0 }
        ],
        materialesInsumosObservaciones: "",
        historia_clinica_procedimientos_diagnosticos: [],
        historia_clinica_procedimientos_terapeuticos: [],
        IdCentroCostos: "",
        fk_cama: 0,
        camas: null,
        AltaUrgencias: false,
        historia_clinica_odontograma: [
            { id_odontograma: null, fk_institucion: 0 }
        ],
        historia_clinica_placa_bacteriana: [
            { id_placa_bacteria: null, porcentaje_placa_bacteriana: 0, interpretacion_placa_bacteriana: "", fk_institucion: 0 }
        ],
        observaciones_historia: "",
        observaciones_odontograma: "",
        observaciones_placa_bacteriana: "",
        fk_usuario: historia?.fk_usuario_historia || 6905,
        fk_institucion: admision?.fk_institucion || 20,
        bloqueada: true,
        prescripcion_medicamentos: [],
        // ==========================================================
        //  historia_pym_adultez
        // ==========================================================
        historia_pym_adultez: [{
                hallazgos_fisicos_signos_vitales_ta_adultez: "120/80",
                hallazgos_fisicos_signos_vitales_fc__adultez: 80,
                hallazgos_fisicos_signos_vitales_fr_adultez: 18,
                hallazgos_fisicos_signos_vitales_tallaPym_adultez: talla,
                hallazgos_fisicos_signos_vitales_pesoPym_adultez: peso,
                hallazgos_fisicos_signos_vitales_idmcPym_adultez: parseFloat(imc.toFixed(2)),
                hallazgos_fisicos_signos_vitales_circunferencia_muslo_adultez: 0,
                hallazgos_fisicos_signos_vitales_perimetro_abdominal_adultez: 95,
                hallazgos_fisicos_otros_cabezaPym_adultez: "SIN ALTNORMOCEFALO, PUPILAS ISOCORICAS NORMOREACTIVAS A LA LUZ, FOSAS NASALES PERMEABLES, CAVIDAD ORAL NORMAL",
                hallazgos_fisicos_otros_cuelloPym_adultez: "SIMETRICO, MOVIL, NO ADENOPATIAS, NO INGURGITACION YUGULAR",
                hallazgos_fisicos_otros_toraxPym_adultez: "SIMETRICO, NO DEFORMIDADES, RSCS: RITMICOS, NO SOPLOS, BIEN TIMBRADOS; CSPS: VENTILADOS, NO ESTERTORES",
                hallazgos_fisicos_otros_abdomenPym_adultez: "BLANDO, DEPRESIBLE, NO MASAS PALPABLES, NO VICEROMEGALIAS, NO DOLOROSO A LA PALPACION, RSHS: NORMALES",
                hallazgos_fisicos_otros_genitourinarioPym_adultez: "GENITALES EXTERNOS NORMALES, PUÑOPERCUSION NEGATIVA",
                hallazgos_fisicos_otros_pelvisPym_adultez: "SIMETRICA, NO DEFORMIDADES, BUENA MOVILIDAD COXOFEMORAL",
                hallazgos_fisicos_otros_dorsoPym_adultez: "SIMETRICAS, NO DEFORMIDADES, NO EDEMAS",
                hallazgos_fisicos_otros_neurologicoPym_adultez: "GLASGOW 15/15, CONCIENTE, ORIENTADO EN TIEMPO Y ESPACIO, MOTRICIDAD Y SENSIBILIDAD GENERAL CONSERVADAS",
                hallazgos_fisicos_otros_pielPym_adultez: "HIDRATADA, ASPECTO Y COLORACION NORMAL, SIN LESIONES",
                hallazgos_fisicos_otros_otro_adultez: "EMUNTORIOS NORMALES",
                hallazgos_fisicos_otros_mamaPym_adultez: "MAMAS PÉNDULAS, SIN PRESENCIA DE LESIONES VISIBLES, PIEL DE ASPECTO NORMAL, SIN DETECCIÓN DE MASAS NI ADENOPATÍAS, SIN DOLOR A LA PALPACIÓN, NO SE EVIDENCIA SALIDA DE SECRECIONES DE LOS PEZONES",
                hallazgos_fisicos_otros_tacto_rectalPym_adultez: (esMasculino && edad >= 45) || (esMujer && edad >= 50)
                    ? "NO SE REALIZA TACTO RECTAL POR SER PACIENTE FEMENINA. NIEGA SÍNTOMAS URINARIOS (DISURIA, POLIURIA O HEMATURIA)."
                    : "",
                cuestionario_srq_dolores_cabeza_adultez: false,
                cuestionario_srq_mal_apetito_adultez: false,
                cuestionario_srq_duerme_mal_adultez: false,
                cuestionario_srq_asusta_facilidad_adultez: false,
                cuestionario_srq_sufre_temblor_manos_adultez: false,
                cuestionario_srq_nervioso_tenso_aburrido_adultez: false,
                cuestionario_srq_mala_digestion_adultez: false,
                cuestionario_srq_no_piensa_claridad_adultez: false,
                cuestionario_srq_se_siente_triste_adultez: false,
                cuestionario_srq_llora_mucha_frecuencia_adultez: false,
                cuestionario_srq_dificultad_disfrutar_actividad_diaria_adultez: false,
                cuestionario_srq_dificultad_tomar_decision_adultez: false,
                cuestionario_srq_dificultad_hacer_trabajo_adultez: false,
                cuestionario_srq_incapaz_desempenar_util_vida_adultez: false,
                cuestionario_srq_perdido_interes_cosas_adultez: false,
                cuestionario_srq_persona_inutill_adultez: false,
                cuestionario_srq_idea_acabar_vida_adultez: false,
                cuestionario_srq_cansado_todo_tiempo_adultez: false,
                cuestionario_srq_sensacion_desagradable_estomago_adultez: false,
                cuestionario_srq_se_cansa_facilidad_adultezs: false,
                cuestionario_srq_han_tratado_herirlo_adultez: false,
                cuestionario_srq_mas_importante_piensa_demas_adultez: false,
                cuestionario_srq_interferencia_pensamiento_adultez: false,
                cuestionario_srq_oye_voces_adultez: false,
                cuestionario_srq_convulsismo_ataques_caidas_adultez: false,
                cuestionario_srq_bebido_demasiado_licor_adultez: false,
                cuestionario_srq_dejar_beber_no_podido_adultez: false,
                cuestionario_srq_difilcultad_trabajo_bebida_adultez: false,
                cuestionario_srq_rinas_detenido_borracho_adultez: false,
                cuestionario_srq_parecido_bebia_demasiado_adultez: false,
                valoracion_srq_salud_mental: "Cuestionario SRQ negativo para síntomas psicopatológicos. No se evidencia depresión, ansiedad, psicosis o trastorno convulsivo.",
                valoracion_srq_psicosis: "Sin evidencia de síntomas psicóticos. Niega alucinaciones, ideas delirantes o pensamiento incoherente.",
                valoracion_srq_trastorno_convulsivo: "Niega antecedentes ni síntomas sugestivos de crisis convulsivas.",
                valoracion_srq_alcoholismo: "Niega consumo de alcohol. Cuestionario AUDIT no aplica (0 puntos).",
                Cancer_de_mama_Dolor: false,
                Cancer_de_mama_secrecion_del_pezon: false,
                Cancer_de_mama_Hinchazon_mama: false,
                Cancer_de_mama_Ganglios: false,
                Cancer_de_mama_Masa: false,
                Cancer_de_mama_Retraccion: false,
                Cancer_de_mama_Nodulo_superficial: false,
                Cancer_de_mama_Nodulo_profundo: false,
                Cancer_de_mama_Cambios_en_la_piel: false,
                Cancer_de_mama_Piel_naranja: false,
                Cancer_de_mama_Red_venosa_dilatada: false,
                Cancer_de_mama_Retraccion_del_pezon: false,
                Cancer_de_mama_Secrecion_pezon: false,
                Cancer_de_mama_Adenopatias_axilares: false,
                Cancer_de_mama_Adenopatias_claviculares: false,
                Cancer_de_mama_observaciones: "Exploración mamaria sin hallazgos patológicos.",
                practicas_alimentarias_obsevaciones_adultez: "Refiere consumo y hábitos alimentarios adecuados, no se evidencia ingesta excesiva o deficiente de calorías o nutrientes.",
                estructuras_dentomaxilofaciales_adultez: "Estructuras dentomaxilofaciales sin alteraciones evidentes al examen físico, procesos de masticación, deglución, habla y fonación sin déficit o alteración.",
                estructura_dentomaxilofacial_tiene_dolor_al_comer_masticar_adultez: "2",
                estructura_dentomaxilofacial_dolor_en_diente_o_molares_adultez: "2",
                estructura_dentomaxilofacial_se_cepilla_en_la_manana_adultez: false,
                estructura_dentomaxilofacial_se_cepilla_en_la_noche_adultez: false,
                estructura_dentomaxilofacial_se_cepilla_en_el_medio_dia_adultez: false,
                estructura_dentomaxilofacial_enrojecimiento_encia_adultez: "2",
                estructura_dentomaxilofacial_deformacion_contorno_encia_adultez: "2",
                estructura_dentomaxilofacial_vesiculas_ulceras_placas_adultez: "2",
                estructura_dentomaxilofacial_presecia_caries_adultez: "2",
                estructura_dentomaxilofacial_presencia_placa_bacteriana_adultez: "2",
                estructura_dentomaxilofacial_cuando_fue_la_ultima_consulta_odontologica_adultez: "",
                auditiva_comunicativa_observaciones_adultez: " Se evidencia integridad del oído izquierdo y derecho conservada, funciones de la articulación, voz, habla y desempeño comunicativo sin alteraciones. ",
                factor_riesgo_auditivo_infeccion_en_el_oido_adultez: "2",
                factor_riesgo_auditivo_malformaciones_anatomicas_auricular_y_cae_adultez: "2",
                factor_riesgo_auditivo_inhalacion_de_quimicos_adultez: "2",
                factor_riesgo_auditivo_exposicion_a_ruido_adultez: "2",
                factor_riesgo_auditivo_trastornos_auditivos_con_cambios_presion_atmosferica_adultez: "2",
                factor_riesgo_auditivo_trauma_en_zona_temporal_de_la_cabeza_adultez: "2",
                factor_riesgo_auditivo_r_auditivos_disminuidos_adultez: "2",
                factor_riesgo_auditivo_sensacion_de_presion_o_dolor_de_oido_adultez: "2",
                factor_riesgo_auditivo_antecedentes_de_supuracion_de_oido_adultez: "2",
                factor_riesgo_auditivo_estenosis_de_conducto_auditivo_externo_adultez: "2",
                factor_riesgo_auditivo_audicion_fluctuante_adultez: "2",
                factor_riesgo_auditivo_problemas_de_socializacion_adultez: "2",
                factor_riesgo_auditivo_trastornos_de_comportamientos_adultez: "2",
                factor_riesgo_auditivo_sindrome_de_goldenhar_adultez: "2",
                factor_riesgo_auditivo_labio_o_paladar_hendido_adultez: "2",
                factor_riesgo_auditivo_trauma_craneocefalico_adultez: "2",
                factor_riesgo_auditivo_ingesta_de_sustancias_toxicas_adultez: "2",
                factor_riesgo_auditivo_falta_de_orientacion_auditiva_adultez: "2",
                factor_riesgo_auditivo_antecedentes_familiares_de_sordera_adultez: "2",
                factor_riesgo_auditivo_bajo_peso_al_nacer_adultez: "2",
                factor_riesgo_auditivo_incompativilidad_sanguinea_adultez: "2",
                factor_riesgo_auditivo_proceso_bacterioso_tratado_con_antibioticos_adultez: "2",
                factor_riesgo_auditivo_procesos_virales_prenatales_adultez: "2",
                factor_riesgo_auditivo_bajo_rendimiento_escolar_adultez: "2",
                factor_riesgo_auditivo_trastornos_perinatales_adultez: "2",
                factor_riesgo_auditivo_secuelas_meninguitis_adultez: "2",
                factor_riesgo_auditivo_retraso_del_desarrollo_motor_o_del_lenguaje_adultez: "2",
                factor_riesgo_auditivo_sindrome_de_down_adultezint: "2",
                factor_riesgo_auditivo_sindrome_relacionado_con_desordenes_auditivos_adultez: "2",
                factor_riesgo_auditivo_trastornos_respiratorios_adultez: "2",
                factor_riesgo_auditivo_trastornos_prenatales_adultez: "2",
                valoracion_salud_visual_ojo_derecho_adultez: agudezaVisual,
                valoracion_salud_visual_ojo_izquierdo_adultez: agudezaVisual,
                valoracion_salud_visual_adultez: "Durante la exploración oftalmoscópica no se evidencia alteraciones oculares de la conjuntiva, cornea o retina ni derecha ni izquierda. ",
                valoracion_salud_sexual_observaciones_adultez: "No se evidencia signos de violencia sexual y de género, se descarta la presencia de criptorquidia y/o EPI o hipospadias.",
                salud_sexual_toma_decisiones_alrededor_de_la_sexualidad_adultez: "1",
                salud_sexual_identidad_de_genero_adultez: "2",
                salud_sexual_violencia_contra_la_mujer_o_genero_adultez: "2",
                salud_sexual_maternidad_y_paternidad_planeada_uso_anticonceptivos_adultez: "1",
                salud_sexual_cuidado_del_cuerpo_y_uso_de_proteccion_contra_its_adultez: "1",
                salud_sexual_conocimiento_de_fisiologia_y_anatomia_de_la_sexualidad_adultez: "1",
                salud_sexual_conocimiento_sobre_its_y_formas_de_proteccion_adultez: "1",
                salud_sexual_conocimientos_creencias_actitudes_sobre_uso_anticoncepcion_adultez: "1",
                salud_sexual_creencias_ctitudes_sobre_el_inicio_de_relaciones_sexuales_adultez: "1",
                salud_sexual_creencias_y_actitudes_sobre_las_relaciones_de_pareja_adultez: "1",
                salud_sexual_conocimientos_sobre_derechos_en_salud_adultez: "1",
                salud_sexual_transgenero_que_no_han_accedido_a_acompanamiento_en_salud_de_transito_en_el_genero_adultez: "3",
                salud_sexual_heterosexual_hijo_de_victimas_de_violencia_de_pareja_adultez: "3",
                salud_sexual_adolecentes_en_contexto_de_alto_riesto_de_escnna_adultez: "2",
                salud_sexual_victimas_de_violencia_sexual_adultez: "2",
                salud_sexual_observaciones_condiciones_particulares_adultez: " ",
                salud_sexual_usted_conoce_alguna_its_adultez: "1",
                salud_sexual_usted_ha_recibido_tratamiento_de_its_adultez: "2",
                salud_sexual_usted_tiene_alguna_its_adultez: "2",
                salud_sexual_su_pareja_ha_tenido_alguna_its_adultez: "2",
                salud_sexual_su_pareja_ha_recibido_tratamiento_its_adultez: "2",
                salud_mental_sospecha_de_maltrato_fisico_adultez: "2",
                salud_mental_sospecha_de_violencia_sexual_adultez: "2",
                salud_mental_sospecha_de_violencia_intrafamiliar_adultez: "2",
                salud_mental_conducta_agresiva_o_violenta_adultez: "2",
                salud_mental_sintomatologia_depresiva_adultez: "2",
                salud_mental_sintomatologia_de_ansiedad_adultez: "2",
                salud_mental_ideas_o_intento_de_suicida_adultez: "2",
                salud_mental_consumo_de_alcohol_o_sustancias_psicoactivas_adultez: "2",
                salud_mental_pensamientos_o_ideas_incoherentes_adultez: "2",
                salud_mental_victima_de_desplazamiento_adultez: "2",
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
                sucesos_vitales_muerte_del_conjuge_adultez: false,
                sucesos_vitales_divorcio_adultez: false,
                sucesos_vitales_separacion_matrimoonial_adultez: false,
                sucesos_vitales_encarcelacion_adultez: false,
                sucesos_vitales_muerte_de_un_familiar_cercano_adultez: false,
                sucesos_vitales_lesion_o_enfermedad_personal_adultez: false,
                sucesos_vitales_matrimonio_adultez: false,
                sucesos_vitales_despido_del_trabajo_adultez: false,
                sucesos_vitales_paro_adultez: false,
                sucesos_vitales_reconciliacion_matrimonial_adultez: false,
                sucesos_vitales_jubilacion_adultez: false,
                sucesos_vitales_cambio_de_salud_de_un_miembro_de_la_familia_adultez: false,
                sucesos_vitales_drogadiccion_alcoholismo_adultez: false,
                sucesos_vitales_embarazo_adultez: false,
                sucesos_vitales_dificultad_sexual_adultez: false,
                sucesos_vitales_incorporacion_de_un_nuevo_miembro_a_la_familia_adultez: false,
                sucesos_vitales_reajuste_de_negocio_adultez: false,
                sucesos_vitales_cambio_de_situacion_economica_adultez: false,
                sucesos_vitales_muerte_de_un_amigo_intimo_adultez: false,
                sucesos_vitales_cambio_en_el_tipo_de_trabajo_adultez: false,
                sucesos_vitales_mala_relacion_con_el_conyugue_adultez: false,
                sucesos_vitales_juicio_por_credito_o_hipoteca_adultez: false,
                sucesos_vitales_cambio_de_responsabilidad_en_el_trabajo_adultez: false,
                sucesos_vitales_hijo_hija_deja_el_hogar_adultez: false,
                sucesos_vitales_problemas_legales_adultez: false,
                sucesos_vitales_logro_personal_notable_adultez: false,
                sucesos_vitales_la_esposa_comienza_o_deja_de_trabajar_adultez: false,
                sucesos_vitales_comienzo_fin_de_escolaridad_adultez: false,
                sucesos_vitales_cambio_condiciones_de_vida_adultez: false,
                sucesos_vitales_revision_de_habitos_personales_adultez: false,
                sucesos_vitales_problemas_con_el_jefe_adultez: false,
                sucesos_vitales_cambio_turno_o_condiciones_laborales_adultez: false,
                sucesos_vitales_cambio_de_residencia_adultez: false,
                sucesos_vitales_cambio_de_colegio_adultez: false,
                sucesos_vitales_cambio_actividad_de_ocio_adultez: false,
                sucesos_vitales_cambio_de_actividad_religuiosa_adultez: false,
                sucesos_vitales_cambio_actividades_sociales_adultez: false,
                sucesos_vitales_cambio_habito_de_dormir_adultez: false,
                sucesos_vitales_cambio_en_el_numero_de_reuniones_familiares_adultez: false,
                sucesos_vitales_cambio_de_habitos_alimentarios_adultez: false,
                sucesos_vitales_vacaciones_adultez: false,
                sucesos_vitales_navidades_adultez: false,
                sucesos_vitales_leves_transgresiones_de_ley_adultez: false,
                label_sucesos_vitales_numero_items_marcados_adultez: "0",
                label_sucesos_vitales_puntuacion_total_adultez: "0",
                relacion_con_el_trabajo_antecedentes_de_trabajo_infantil_adultez: "2",
                relacion_con_el_trabajo_tipo_de_vinculacion_laboral_adultez: "0",
                relacion_con_el_trabajo_edad_inicio_de_su_actividad_laboral_adultez: "",
                relacion_con_el_trabajo_tipo_de_actividad_laboral_adultez: "",
                dinamica_familiar_observaciones_adultez: "Trae interpretación del familiograma.",
                relacion_con_el_trabajo_observaciones_adultez: "",
                apoyo_social_las_relaciones_interpersonales_mas_significativas_adultez: "0",
                apoyo_social_educacion_adultez: "0",
                apoyo_social_salud_adultez: "0",
                apoyo_social_trabajo_adultez: "0",
                apoyo_social_grupos_sociales_y_de_espiritualidad_adultez: "0",
                apoyo_social_servicios_dentro_de_la_comunidad_adultez: "0",
                apoyo_social_las_relaciones_interpersonales_mas_significativas_descripcion_adultez: "",
                apoyo_social_educacion_descripcion_adultez: "",
                apoyo_social_salud_descripcion_adultez: "",
                apoyo_social_trabajo_descripcion_adultez: "",
                apoyo_social_grupos_sociales_y_de_espiritualidad_descripcion_adultez: "",
                apoyo_social_servicios_dentro_de_la_comunidad_descripcion_adultez: "",
                apoyo_social_interpretacion_de_ecomapa_adultez: "",
                itemsMarcadosSucesosVitalesAdultez: null,
                puntuacionTotalSucesosVitalesAdultez: null,
                informacion_salud_adultez: "Se educa en signos de alarma (Dolor en el Pecho, Cefalea intensa, Dolor Abdominal, Edema de pies y manos), en hábitos de vida saludables, importancia del ejercicio, importancia de cumplir el tratamiento, no consumo de AINES, bebidas energeticas o antigripales. Se educa en medidas de prevención para infección con Covid 19: uso de mascarillas, lavado de manos frecuente, evitar aglomeraciones, consultar y aislarse en caso de síntomas respiratorios (Tos, Fiebre, Malestar General). Se remite a consulta de Nutrición y Dietética para manejo de obesidad Grado I (IMC 32.09) y educación en hábitos alimentarios.",
                plan_cuidado_atencion_en_salud_bucal_por_profesional_odontologia_adultez: 0,
                plan_cuidado_glicemia_adultez: plan.glicemia,
                prueba_rapida_VIH_adultez: plan.VIH,
                plan_cuidado_creatinina_adultez: plan.creatinina,
                prueba_rapida_serologia_adultez: plan.sifilis,
                plan_cuidado_colesterol_total_adultez: plan.colesterol,
                plan_cuidado_citologia_cervico_uterina_adultez: plan.citologia,
                plan_cuidado_trigliceridos_adultez: plan.trigliceridos,
                plan_cuidado_colposcopia_adultez: plan.colposcopia,
                plan_cuidado_uroanalisis_adultez: plan.uroanalisis,
                prueba_rapida_hepatitis_B_adultez: plan.hepatitisB,
                prueba_rapida_hepatitis_C_adultez: plan.hepatitisC,
                antigenos_prostatico_adultez: plan.antigeno_prostatico,
                sangre_oculta_heces_adultez: plan.sangre_oculta,
                plan_cuidado_prueba_otros_adultez: "",
                metodo_elegido_adultez: null,
                criterio_elegibilidad_OMS_adultez: "1",
                laboratorio_clinico_resultado_sangre_oculta_adultez: "21",
                laboratorio_clinico_fecha_sangre_oculta_adultez: "",
                laboratorio_clinico_observacion_sangre_oculta_adultezo: "",
                laboratorio_clinico_resultado_colesterol_LDL_adultez: ldl,
                laboratorio_clinico_fecha_colesterol_LDL_adultez: fechaLDL,
                laboratorio_clinico_observacion_colesterol_LDL_adultez: "",
                laboratorio_clinico_resultado_colesterol_total_adultez: 0,
                laboratorio_clinico_fecha_colesterol_total_adultez: "",
                laboratorio_clinico_observacion_colesterol_total_adultez: "",
                laboratorio_clinico_resultado_antigeno_prostatico_adultez: 0,
                laboratorio_clinico_fecha_antigeno_prostatico_adultez: "",
                laboratorio_clinico_observacion_antigeno_prostatico_adultez: "",
                laboratorio_clinico_resultado_colesterol_HDL_adultez: hdl,
                laboratorio_clinico_fecha_colesterol_HDL_adultez: fechaHDL,
                laboratorio_clinico_observacion_colesterol_HDL_adultez: "",
                laboratorio_clinico_resultado_mamografia_adultez: plan.mamografia ? "2" : "0",
                laboratorio_clinico_fecha_mamografia_adultez: "",
                laboratorio_clinico_observacion_mamografia_adultez: "",
                laboratorio_clinico_resultado_trigliceridos_adultez: trigliceridos,
                laboratorio_clinico_fecha_trigliceridos_adultez: fechaTrigliceridos,
                laboratorio_clinico_observacion_trigliceridos_adultez: "",
                laboratorio_clinico_resultado_glicemia_basal_adultez: glicemia,
                laboratorio_clinico_fecha_glicemia_basal_adultez: fechaGlicemia,
                laboratorio_clinico_observacion_glicemia_basal_adultez: "",
                laboratorio_clinico_resultado_creatinina_sangre_adultez: creatinina,
                laboratorio_clinico_fecha_creatinina_sangre_adultez: fechaCreatinina,
                laboratorio_clinico_observacion_creatinina_sangre_adultez: "",
                laboratorio_resultado_clinico_hepatitis_C_adultez: null,
                laboratorio_clinico_fecha_hepatitis_C_adultez: "",
                laboratorio_clinico_observacion_hepatitis_C_adultez: "",
                laboratorio_clinico_resultado_prueba_rapida_hepatitis_B_adultez: "0",
                laboratorio_clinico_fecha_prueba_rapida_hepatitis_B_adultez: "",
                laboratorio_clinico_observacion_prueba_rapida_hepatitis_B_adultez: "",
                laboratorio_paraclinico_laboratorio_prueba_treponemica_rapida_sifilis_adultez: "0",
                laboratorio_paraclinico_laboratorio_fecha_prueba_treponemica_rapida_sifilis_adultez: "",
                laboratorio_clinico_observacion_prueba_treponemica_rapida_sifilis_adultez: "",
                laboratorio_clinico_resultado_prueba_rapida_VIH_adultez: "0",
                laboratorio_clinico_fecha_prueba_rapida_VIH_adultez: "",
                laboratorio_clinico_observacion_prueba_rapida_VIH_adultez: "",
                laboratorio_clinico_resultado_hemoglobina_adultez: hemoglobina,
                laboratorio_clinico_fecha_hemoglobina_adultez: fechaHemoglobina,
                laboratorio_clinico_observacion_hemoglobina_adultez: "",
                laboratorio_clinico_resultado_uroanalisis_adultez: "",
                laboratorio_clinico_fecha_uroanalisis_adultez: "",
                laboratorio_clinico_observacion_uroanalisis_adultez: "",
                test_audit_1: "", test_audit_2: "", test_audit_3: "", test_audit_4: "",
                test_audit_5: "", test_audit_6: "", test_audit_7: "", test_audit_8: "",
                test_audit_9: "", test_audit_10: "", test_audit: null,
                test_assits_1_a: "", test_assits_1_b: "", test_assits_1_c: "",
                test_assits_1_d: "", test_assits_1_e: "", test_assits_1_f: "",
                test_assits_1_g: "", test_assits_1_h: "", test_assits_1_i: "",
                test_assits_1_j: "", test_assits_1_j_texto: "",
                test_assits_2_a: "0", test_assits_2_b: "0", test_assits_2_c: "0",
                test_assits_2_d: "0", test_assits_2_e: "0", test_assits_2_f: "0",
                test_assits_2_g: "0", test_assits_2_h: "0", test_assits_2_i: "0",
                test_assits_2_j: "0", test_assits_2_j_texto: "",
                test_assits_3_a: "0", test_assits_3_b: "0", test_assits_3_c: "0",
                test_assits_3_d: "0", test_assits_3_e: "0", test_assits_3_f: "0",
                test_assits_3_g: "0", test_assits_3_h: "0", test_assits_3_i: "0",
                test_assits_3_j: "0", test_assits_3_j_texto: "",
                test_assits_4_a: "0", test_assits_4_b: "0", test_assits_4_c: "0",
                test_assits_4_d: "0", test_assits_4_e: "0", test_assits_4_f: "0",
                test_assits_4_g: "0", test_assits_4_h: "0", test_assits_4_i: "0",
                test_assits_4_j: "0", test_assits_4_j_texto: "",
                test_assits_5_b: "0", test_assits_5_c: "0", test_assits_5_d: "0",
                test_assits_5_e: "0", test_assits_5_f: "0", test_assits_5_g: "0",
                test_assits_5_h: "0", test_assits_5_i: "0", test_assits_5_j: "0",
                test_assits_5_j_texto: "",
                test_assits_6_a: "0", test_assits_6_b: "0", test_assits_6_c: "0",
                test_assits_6_d: "0", test_assits_6_e: "0", test_assits_6_f: "0",
                test_assits_6_g: "0", test_assits_6_h: "0", test_assits_6_i: "0",
                test_assits_6_j: "0", test_assits_6_j_texto: "",
                test_assits_7_a: "0", test_assits_7_b: "0", test_assits_7_c: "0",
                test_assits_7_d: "0", test_assits_7_e: "0", test_assits_7_f: "0",
                test_assits_7_g: "0", test_assits_7_h: "0", test_assits_7_i: "0",
                test_assits_7_j: "0", test_assits_7_j_texto: "",
                test_assint_a: null, test_assint_b: null, test_assint_c: null,
                test_assint_d: null, test_assint_e: null, test_assint_f: null,
                test_assint_g: null, test_assint_h: null, test_assint_i: null,
                test_assint_j: null, test_assint_8: null,
                test_assint_patron_inyeccion: null, test_assint_guia_intervencion: null,
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
                resultadoTestEpoc: null,
                HistoriasPymAdultezInformacionSalud: [],
                preguntas_de_whooley_p1_durante_los_ultimos_dias_se_ha_sentido_desanimado_a_menudo: false,
                preguntas_de_whooley_p2_durante_los_ultimos_dias_ha_sentido_poco_interes: false,
                puntuacion_test_whooley: "0",
                escala_findrisc_realiza_normalmente_30_minutos_de_actividad_fisica: false,
                escala_findrisc_con_que_frecuencia_come_frutas_verduras: "1",
                escala_findrisc_le_han_recetado_alguna_vez_nedicamentos_contra_la_hta: false,
                escala_findrisc_le_han_detectado_alguna_vez_niveles_altos_de_glucosa: false,
                escala_findrisc_ha_habido_algun_diagnostico_de_DM_en_su_familia: "2",
                puntuacion_escala_findrisc: "4",
                porcentaje_escala_findrisc: "1",
                riesgo_cardiovascular_edad_oms_adultez: String(edad),
                riesgo_cardiovascular_sexo_oms_adultez: esMasculino ? "MASCULINO" : "FEMENINO",
                riesgo_cardiovascular_presion_arterial_oms_adultez: "120/80",
                riesgo_cardiovascular_fumador_oms_adultez: false,
                riesgo_cardiovascular_imc_oms_adultez: parseFloat(imc.toFixed(2)),
                riesgo_cardiovascular_porcentaje_oms_adultez: "Pendiente de cálculo (requiere perfil lipídico completo)",
                escala_gad_2_sentirse_nervioso_ansioso_inquieto_PARA_NADA: false,
                escala_gad_2_sentirse_nervioso_ansioso_inquieto_ALGUNOS_DIAS: false,
                escala_gad_2_sentirse_nervioso_ansioso_inquieto_MAS_DE_LA_MITAD_DE_LOS_DIAS: false,
                escala_gad_2_sentirse_nervioso_ansioso_inquieto_CASI_TODOS_LOS_DIAS: false,
                escala_gad_2_no_poder_parar_o_controlar_la_preocupacion_PARA_NADA: false,
                escala_gad_2_no_poder_parar_o_controlar_la_preocupacion_ALGUNOS_DIAS: false,
                escala_gad_2_no_poder_parar_o_controlar_la_preocupacion_MAS_DE_LA_MITAD_DE_LOS_DIAS: false,
                escala_gad_2_no_poder_parar_o_controlar_la_preocupacion_CASI_TODOS_LOS_DIAS: false,
                puntuacion_escala_gad_2: "0",
                resultadoTestApgarAdultos: null,
                calificacion_riesgo_cardiovascular_edad_adultez: "54",
                calificacion_riesgo_cardiovascular_fumador_adultez: 0,
                calificacion_riesgo_cardiovascular_colesterol_total_adultez: "",
                calificacion_riesgo_cardiovascular_colesterol_hdl_adultez: "",
                calificacion_riesgo_cardiovascular_presion_arterial_adultez: "",
                calificacion_riesgo_cardiovascular_recibe_tratamiento_adultez: false,
                value_tab_adultez: 0
            }],
        // ==========================================================
        // RESOLUCIÓN 4505 – CONSTRUCCIÓN DINÁMICA SEGÚN SEXO Y EDAD
        // ==========================================================
        resolucion4505: [
            {
                // --- Campos generales ---
                gestacion: esMasculino ? "0" : "2",
                sintomatico_respiratorio: "2",
                fecha_toma_baciloscopia_diagnostico: "1845-01-01",
                resultado_baciloscopia_diagnostico: "4",
                consumo_tabaco: "99",
                clasificacion_riesgo_cardiovascular: riesgoCV,
                clasificación_riesgo_metabolico: riesgoMet,
                codigo_pais: "170",
                fecha_consulta_valoracion_integral: fechaAdmisionStr,
                valoracion_agudeza_visual: fechaAdmisionStr,
                agudeza_visual_lejana_ojo_izquierdo: "3",
                agudeza_visual_lejana_ojo_derecho: "3",
                // --- Laboratorios ---
                resultado_glicemia_basal: glicemia,
                fecha_toma_glicemia_basal: fechaGlicemia,
                resultado_LDL: ldl,
                fecha_toma_LDL: fechaLDL,
                resultado_HDL: hdl,
                fecha_toma_HDL: fechaHDL,
                resultado_trigliceridos: trigliceridos,
                fecha_toma_trigliceridos: fechaTrigliceridos,
                resultado_hemoglobina: hemoglobina,
                fecha_toma_hemoglobina: fechaHemoglobina,
                resultado_creatinina: creatinina,
                fecha_creatinina: fechaCreatinina,
                // --- Hepatitis B ---
                resultado_antigeno_superficie_hepatitisB_toda: "0",
                fecha_antigeno_superficie_hepatitisB_toda: "1845-01-01",
                // --- CÁNCER DE CÉRVIX (según sexo) ---
                tamizaje_cancer_cuello_uterino: esMujer ? "21" : "0",
                citologia_cervicouterina: esMujer ? "1800-01-01" : "1845-01-01",
                resultado_tamizaje_cancer_cuello_uterino: esMujer ? "21" : "0",
                calidad_muestra_citologia_cervicouterina: "0",
                codigo_habilitacion_IPS_citologia_cervicouterina: "0",
                fecha_colposcopia: esMujer ? "1800-01-01" : "1845-01-01",
                fecha_biopsia_cervical: esMujer ? "1800-01-01" : "1845-01-01",
                resultado_biopsia_cervicouterina: esMujer ? "21" : "0",
                tratamiento_ablativo_escision_inspeccion_visual: "0",
                // --- Mamografía ---
                resultado_mamografia_res202: esMujer ? "21" : "0",
                fecha_mamografía: esMujer ? (plan.mamografia ? fechaAdmisionStr : "1845-01-01") : "1845-01-01",
                resultado_biopsia_mama: esMujer ? "21" : "0",
                fecha_toma_biopsia_seno_BACAF: esMujer ? "1800-01-01" : "1845-01-01",
                fecha_resultado_biopsia_seno_BACAF: esMujer ? "1800-01-01" : "1845-01-01",
                // --- PSA y tacto rectal (solo hombres ≥45) ---
                resultado_PSA: (esMasculino && edad >= 45) ? "0" : "0",
                fecha_toma_PSA: (esMasculino && edad >= 45) ? fechaAdmisionStr : "1845-01-01",
                resultado_tacto_rectal: (esMasculino && edad >= 45) ? "0" : "0",
                fecha_tacto_rectal: (esMasculino && edad >= 45) ? fechaAdmisionStr : "1845-01-01",
                // --- Sangre oculta y colonoscopia (≥50 años) ---
                resultado_prueba_sangre_oculta_materia_fecal: (edad >= 50) ? "21" : "0",
                fecha_prueba_sangre_oculta_materia_feca: (edad >= 50) ? fechaAdmisionStr : "1845-01-01",
                resultado_colonoscopia_tamizaje: (edad >= 50) ? "21" : "0",
                fecha_colonoscopia_tamizaje: (edad >= 50) ? fechaAdmisionStr : "1845-01-01",
                // --- PLANIFICACIÓN FAMILIAR (corregido para ambos sexos) ---
                // Para hombres o mujeres <10: se resta un año a la fecha de admisión (fecha válida)
                // Para mujeres >=10: se usa la fecha de admisión real
                planificación_familiar_primera_vez: esMujer ? (edad >= 10 ? fechaAdmisionStr : restarUnAnio(fechaAdmisionStr)) : restarUnAnio(fechaAdmisionStr),
                suministro_metodo_anticonceptivo: "21",
                fecha_suministro_metodo_anticonceptivo: esMujer ? (edad >= 10 ? fechaAdmisionStr : restarUnAnio(fechaAdmisionStr)) : restarUnAnio(fechaAdmisionStr),
                // --- Hepatitis C, sífilis, VIH (según plan) ---
                resultado_tamizaje_hepatitis_C: plan.hepatitisC ? "21" : "0",
                fecha_toma_tamizaje_hepatitis_C: plan.hepatitisC ? fechaAdmisionStr : "1845-01-01",
                resultado_prueba_tamizaje_sifilis: plan.sifilis ? "21" : "0",
                fecha_serologia_sifilis: plan.sifilis ? fechaAdmisionStr : "1845-01-01",
                resultado_prueba_VIH: plan.VIH ? "21" : "0",
                fecha_tomae_elisa_VIH: plan.VIH ? fechaAdmisionStr : "1845-01-01",
            }
        ],
        historia_clinica_procedimientos_vacunacion: []
    };
    return resultado;
};
exports.adultez = adultez;
