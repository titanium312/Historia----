"use strict";
// services/vejez.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.vejez = void 0;
// ==========================================================
// FUNCIONES AUXILIARES (FECHAS, LABORATORIOS, ETC.)
// ==========================================================
/**
 * Convierte una fecha en formato /Date(ms)/ a objeto Date
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
 * Formatea una fecha a YYYY-MM-DD (formato estándar)
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
 * Obtiene fecha de admisión formateada (fallback a hoy)
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
 * Ajusta consistencia entre fecha y resultado de laboratorio
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
/**
 * Genera un valor aleatorio dentro de un rango
 */
function randomEntre(min, max, decimales = 2) {
    const r = Math.random() * (max - min) + min;
    return parseFloat(r.toFixed(decimales));
}
// ==========================================================
// FUNCIÓN PRINCIPAL – VERSIÓN DEFINITIVA CORREGIDA
// ==========================================================
const vejez = (data) => {
    // 1. Extraer datos básicos
    const { admision, paciente, historia, facturacion, edad, sexoId, generoTexto, datosClinicos } = data;
    const esMasculino = (sexoId === 2 || generoTexto?.toUpperCase() === 'MASCULINO');
    const esMujer = !esMasculino;
    const generoLabel = esMasculino ? 'MASCULINO' : 'FEMENINO';
    const generoId = esMasculino ? 1 : 2;
    // 2. Antropometría
    const peso = datosClinicos?.antropometricos?.peso ?? 70;
    const talla = datosClinicos?.antropometricos?.talla ?? 160;
    const imc = peso / ((talla / 100) ** 2);
    const fechaAdmisionStr = getFechaAdmisionFormateada(admision);
    // ✅ Nombre correcto del campo para perímetro abdominal
    const perimetroAbdominal = datosClinicos?.antropometricos?.perimetro_abdominal ?? 96;
    // 3. Laboratorios ajustados
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
    // 4. PSA
    let psaValor = 0;
    let psaFecha = '1845-01-01';
    if (esMasculino && edad >= 45) {
        const psaOrig = datosClinicos?.laboratorios?.psa?.valor;
        const psaFechaOrig = datosClinicos?.laboratorios?.psa?.fecha || '';
        if (psaOrig && psaOrig > 0 && psaOrig < 998) {
            psaValor = Number(psaOrig);
            psaFecha = psaFechaOrig || fechaAdmisionStr;
        }
        else {
            psaValor = randomEntre(0.5, 3.5);
            psaFecha = fechaAdmisionStr;
        }
    }
    // 5. Plan de tamizajes
    const esMujer50a69 = esMujer && edad >= 50 && edad <= 69;
    const plan = {
        glicemia: 1,
        creatinina: 1,
        colesterol: 1,
        trigliceridos: 1,
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
        mini_mental: (edad >= 60) ? 1 : 0,
    };
    // 6. Función para generar Lawton-Brody (CORREGIDA - basada en el JSON perfecto)
    const generarLawtonBrody = (masculino) => {
        // El JSON perfecto tiene MUJER=true, HOMBRE=false (es un paciente femenino en ese ejemplo)
        // Pero nosotros debemos generar según el sexo real
        return {
            [`lawton_brody_utiliza_el_telefono_por_iniciativa_propia_MUJER`]: !masculino,
            [`lawton_brody_utiliza_el_telefono_por_iniciativa_propia_HOMBRE`]: masculino,
            [`lawton_brody_es_capaz_de_marcar_bien_algunos_numeros_MUJER`]: false,
            [`lawton_brody_es_capaz_de_marcar_bien_algunos_numeros_HOMBRE`]: false,
            [`lawton_brody_es_capaz_de_contestar_el_telefeno_pero_no_marcar_MUJER`]: false,
            [`lawton_brody_es_capaz_de_contestar_el_telefeno_pero_no_marcar_HOMBRE`]: false,
            [`lawton_brody_no_utiliza_el_telefono_MUJER`]: false,
            [`lawton_brody_no_utiliza_el_telefono_HOMBRE`]: false,
            [`lawton_brody_Realiza_todas_las_compras_necesarias_con_independencia_MUJER`]: !masculino,
            [`lawton_brody_Realiza_todas_las_compras_necesarias_con_independencia_HOMBRE`]: masculino,
            [`lawton_brody_Compra_con_independencia_pequenas_cosas_MUJER`]: false,
            [`lawton_brody_Compra_con_independencia_pequenas_cosas_HOMBRE`]: false,
            [`lawton_brody_Necesita_compania_para_realizar_cualquier_compra_MUJER`]: false,
            [`lawton_brody_Necesita_compania_para_realizar_cualquier_compra_HOMBRE`]: false,
            [`lawton_brody_Completamente_incapaz_de_ir_de_compras_MUJER`]: false,
            [`lawton_brody_Completamente_incapaz_de_ir_de_compras_HOMBRE`]: false,
            [`lawton_brody_Planea_prepara_y_sirve_las_comidas_adecuadas_con_independencia_MUJER`]: !masculino,
            [`lawton_brody_Planea_prepara_y_sirve_las_comidas_adecuadas_con_independencia_HOMBRE`]: masculino,
            [`lawton_brody_Prepara_adecuadamente_las_comidas_si_se_le_proporciona_los_ingredientes_MUJER`]: false,
            [`lawton_brody_Prepara_adecuadamente_las_comidas_si_se_le_proporciona_los_ingredientes_HOMBRE`]: false,
            [`lawton_brody_Prepara_calienta_y_sirve_las_comidas_pero_no_siguen_una_dieta_adecuada_MUJER`]: false,
            [`lawton_brody_Prepara_calienta_y_sirve_las_comidas_pero_no_siguen_una_dieta_adecuada_HOMBRE`]: false,
            [`lawton_brody_Necesita_que_se_le_prepare_y_sirva_la_comida_MUJER`]: !masculino,
            [`lawton_brody_Necesita_que_se_le_prepare_y_sirva_la_comida_HOMBRE`]: masculino,
            [`lawton_brody_Cuida_la_casa_solo_o_con_ayuda_ocasional_MUJER`]: !masculino,
            [`lawton_brody_Cuida_la_casa_solo_o_con_ayuda_ocasional_HOMBRE`]: masculino,
            [`lawton_brody_Realiza_trabajos_domesticas_ligeras_como_fregar_o_hacer_cama_MUJER`]: false,
            [`lawton_brody_Realiza_trabajos_domesticas_ligeras_como_fregar_o_hacer_cama_HOMBRE`]: false,
            [`lawton_brody_Realiza_tareas_domesticas_ligeras_pero_no_puede_mantener_un_nivel_de_limpieza_aceptable_MUJER`]: false,
            [`lawton_brody_Realiza_tareas_domesticas_ligeras_pero_no_puede_mantener_un_nivel_de_limpieza_aceptable_HOMBRE`]: false,
            [`lawton_brody_Necesita_ayuda_en_todas_las_tareas_de_la_casa_MUJER`]: false,
            [`lawton_brody_Necesita_ayuda_en_todas_las_tareas_de_la_casa_HOMBRE`]: false,
            [`lawton_brody_No_participa_en_ninguna_tarea_domestica_MUJER`]: !masculino,
            [`lawton_brody_No_participa_en_ninguna_tarea_domestica_HOMBRE`]: masculino,
            [`lawton_brody_Lava_por_si_solo_toda_la_ropa_MUJER`]: !masculino,
            [`lawton_brody_Lava_por_si_solo_toda_la_ropa_HOMBRE`]: masculino,
            [`lawton_brody_Lava_por_si_solo_pequenas_prendas_MUJER`]: false,
            [`lawton_brody_Lava_por_si_solo_pequenas_prendas_HOMBRE`]: false,
            [`lawton_brody_Todo_el_lavado_de_ropa_debe_ser_realizado_por_otro_MUJER`]: !masculino,
            [`lawton_brody_Todo_el_lavado_de_ropa_debe_ser_realizado_por_otro_HOMBRE`]: masculino,
            [`lawton_brody_Viaja_solo_en_transporte_publico_o_conduce_su_propio_coche_MUJER`]: !masculino,
            [`lawton_brody_Viaja_solo_en_transporte_publico_o_conduce_su_propio_coche_HOMBRE`]: masculino,
            [`lawton_brody_Es_capaz_de_tomar_un_taxi_pero_no_usa_otro_medio_de_transporte_MUJER`]: false,
            [`lawton_brody_Es_capaz_de_tomar_un_taxi_pero_no_usa_otro_medio_de_transporte_HOMBRE`]: false,
            [`lawton_brody_Viaja_en_transportes_publicos_si_le_acompana_otra_persona_MUJER`]: false,
            [`lawton_brody_Viaja_en_transportes_publicos_si_le_acompana_otra_persona_HOMBRE`]: false,
            [`lawton_brody_Solo_viaja_en_taxi_o_automovil_con_ayuda_de_otros_MUJER`]: false,
            [`lawton_brody_Solo_viaja_en_taxi_o_automovil_con_ayuda_de_otros_HOMBRE`]: false,
            [`lawton_brody_No_viaja_en_absoluto_MUJER`]: false,
            [`lawton_brody_No_viaja_en_absoluto_HOMBRE`]: false,
            [`lawton_brody_Es_responsable_en_el_uso_de_la_medicacion_dosis_y_horas_correctas_MUJER`]: !masculino,
            [`lawton_brody_Es_responsable_en_el_uso_de_la_medicacion_dosis_y_horas_correctas_HOMBRE`]: masculino,
            [`lawton_brody_Toma_su_medicacion_si_la_dosis_es_preparada_previamente_MUJER`]: false,
            [`lawton_brody_Toma_su_medicacion_si_la_dosis_es_preparada_previamente_HOMBRE`]: false,
            [`lawton_brody_No_es_capaz_de_responsabilizarse_de_su_propia_medicacion_MUJER`]: false,
            [`lawton_brody_No_es_capaz_de_responsabilizarse_de_su_propia_medicacion_HOMBRE`]: false,
            [`lawton_brody_Se_encarga_de_sus_asuntos_economicos_por_si_solo_MUJER`]: !masculino,
            [`lawton_brody_Se_encarga_de_sus_asuntos_economicos_por_si_solo_HOMBRE`]: masculino,
            [`lawton_brody_Realiza_comprar_de_cada_dia_pero_necesita_ayuda_en_las_grandes_comprar_y_en_los_bancos_MUJER`]: false,
            [`lawton_brody_Realiza_comprar_de_cada_dia_pero_necesita_ayuda_en_las_grandes_comprar_y_en_los_bancos_HOMBRE`]: false,
            [`lawton_Incapaz_de_manejar_el_dinero_MUJER`]: false,
            [`lawton_Incapaz_de_manejar_el_dinero_HOMBRE`]: false,
        };
    };
    // 7. Construir objeto final
    const resultado = {
        // ========== CAMPOS PRINCIPALES ==========
        success: true,
        catalogo: "vejez",
        sexo_id: sexoId || (esMasculino ? 2 : 1),
        genero_id: generoId,
        genero_texto: generoLabel,
        id_historia: String(historia?.id_historia || 0),
        numero_historia: String(historia?.numero_historia || 0),
        fk_servicio_ingreso: "2",
        fk_admision: String(admision?.id_admision || 0),
        fk_procedimiento: "8138",
        motivo_consulta_historia: "RUTA_VEJEZ",
        fk_finalidad_consulta: "12",
        IdActividad: "4",
        fk_paciente: String(paciente?.id_paciente || 0),
        numero_admision: String(admision?.numero_admision || 0),
        fk_factura_consultas: String(facturacion?.id_factura_consultas || 0),
        motivo_consulta_consulta_externa: esMasculino
            ? `Control del adulto mayor (${edad} años)`
            : `Control de la adulta mayor (${edad} años)`,
        hora_historia: (() => {
            const hora = admision?.hora_admision || { Hours: 13, Minutes: 23 };
            return `${String(hora.Hours).padStart(2, '0')}:${String(hora.Minutes).padStart(2, '0')}`;
        })(),
        enfermedad_actual_historia: `Paciente de ${edad} años en control de promoción y mantenimiento (PYM) para adulto mayor. Sin síntomas ni signos de alarma.`,
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
                EnfoqueOtroGrupoPoblacional: "0",
                enfoque_diferencial_poblacion_lgbti: "0",
                enfoque_diferencial_mujer_nino_menor_ano: "0",
                enfoque_diferencial_adulto_mayor: "1"
            }
        },
        diagnostico_ingreso_tipo_historia: "1",
        diagnostico_ingreso_fk_causa_externa: "40",
        diagnostico_ingreso_observaciones_historia: "",
        diagnostico_principales_observaciones_consulta_externa: `Paciente asintomático en control de rutina.${imc >= 30 ? ' Se detecta obesidad Grado I y se inicia tamizaje completo.' : ''}`,
        historia_clinica_enfermedades_diagnostico_ingreso: [
            {
                id_historia_enfermedad_diagnostico_ingreso: 0,
                fk_historia: 0,
                fk_enfermedad: "Z000",
                fk_institucion: 0
            }
        ],
        historia_clinica_articulos: [],
        antecedentes_toxicos_consumo_alcohol: "2",
        antecedentes_toxicos_consumo_psicoactiva: "2",
        antecedentes_toxicos_cigarrillo_cantidad_dia_historia: "0",
        antecedentes_toxicos_cigarrillo_annos_uso_historia: "0",
        antecedentes_toxicos_humo_lenna_annos_uso_historia: "0",
        antecedentes_toxicos_alcohol_annos_uso_historia: "0",
        antecedentes_toxicos_farmaco_cual_historia: "",
        antecedentes_toxicos_otro_cual_historia: "",
        antecedentes_toxicos_observaciones_historia: "Niega consumo de tabaco, alcohol o sustancias psicoactivas.",
        antecedentes_toxicos_fumador_pasivo: false,
        antecedentes_toxicos_estimulantes: "",
        historia_pym_vejez: [
            {
                // --- Signos vitales ---
                hallazgos_fisicos_signos_vitales_ta_vejez: "120/80",
                hallazgos_fisicos_signos_vitales_fc__vejez: 80,
                hallazgos_fisicos_signos_vitales_t__vejez: null,
                hallazgos_fisicos_signos_vitales_fr_vejez: 18,
                hallazgos_fisicos_signos_vitales_tallaPym_vejez: talla,
                hallazgos_fisicos_signos_vitales_pesoPym_vejez: peso,
                hallazgos_fisicos_signos_vitales_idmcPym_vejez: parseFloat(imc.toFixed(2)),
                // ✅ Nombre correcto del campo (como en el JSON perfecto)
                hallazgos_fisicos_signos_vitales_perimetro_abdominal_vejez: perimetroAbdominal,
                z_score_vejez: null,
                clasificacion_Peso_talla_vejez: null,
                autonomia_funcionamiento_psicosocial_vejez: null,
                autonomia_componentes_vejez: null,
                autonomia_factores_de_desempeno_vejez: null,
                practicas_alimentarias_observaciones_vejez: "Refiere consumo y hábitos alimentarios adecuados, no se evidencia ingesta excesiva o deficiente de calorías o nutrientes.",
                estructuras_dentomaxilofaciales_vejez: "Estructuras dentomaxilofaciales sin alteraciones evidentes al examen físico, procesos de masticación, deglución, habla y fonación sin déficit o alteración.",
                auditiva_comunicativa_observaciones_vejez: "Se evidencia integridad del oído izquierdo y derecho conservada, funciones de la articulación, voz, habla y desempeño comunicativo sin alteraciones.",
                valoracion_salud_visual_vejez: "Durante la exploración oftalmoscópica no se evidencia alteraciones oculares de la conjuntiva, cornea o retina ni derecha ni izquierda.",
                salud_sexual_observaciones_vejez: "No se evidencia signos de violencia sexual y de género, se descarta la presencia de criptorquidia y/o EPI o hipospadias.",
                salud_sexual_toma_decisiones_alrededor_de_la_sexualidad_vejez: "1",
                salud_sexual_identidad_de_genero_vejez: "2",
                salud_sexual_violencia_contra_la_mujer_o_genero_vejez: "2",
                salud_sexual_maternidad_y_paternidad_planeada_uso_anticonceptivos_vejez: "1",
                salud_sexual_cuidado_del_cuerpo_y_uso_de_proteccion_contra_its_vejez: "1",
                salud_sexual_conocimiento_de_fisiologia_y_anatomia_de_la_sexualidad_vejez: "1",
                salud_sexual_conocimiento_sobre_its_y_formas_de_proteccion_vejez: "1",
                salud_sexual_conocimientos_creencias_actitudes_sobre_uso_anticoncepcion_vejez: "1",
                salud_sexual_creencias_ctitudes_sobre_el_inicio_de_relaciones_sexuales_vejez: "1",
                salud_sexual_creencias_y_actitudes_sobre_las_relaciones_de_pareja_vejez: "1",
                salud_sexual_conocimientos_sobre_derechos_en_salud_vejez: "1",
                salud_sexual_transgenero_que_no_han_accedido_a_acompanamiento_en_salud_de_transito_en_el_genero_vejez: "3",
                salud_sexual_heterosexual_hijo_de_victimas_de_violencia_de_pareja_vejez: "3",
                salud_sexual_adolecentes_en_contexto_de_alto_riesto_de_escnna_vejez: "2",
                salud_sexual_victimas_de_violencia_sexual_vejez: "2",
                salud_sexual_observaciones_condiciones_particulares_vejez: " ",
                salud_sexual_usted_conoce_alguna_its_vejez: "1",
                salud_sexual_usted_ha_recibido_tratamiento_de_its_vejez: "2",
                salud_sexual_usted_tiene_alguna_its_vejez: "2",
                salud_sexual_su_pareja_ha_tenido_alguna_its_vejez: "2",
                salud_sexual_su_pareja_ha_recibido_tratamiento_its_vejez: "2",
                examen_salud_mental_apariencia_general_vejez: "NORMAL",
                examen_salud_mental_actitud_vejez: "NORMAL",
                examen_salud_mental_atencion_vejez: "NORMAL",
                examen_salud_mental_orientacion_vejez: "NORMAL",
                examen_salud_mental_conciencia_vejez: "NORMAL",
                examen_salud_mental_lenguaje_vejez: "NORMAL",
                examen_salud_mental_afecto_vejez: "NORMAL",
                examen_salud_mental_memoria_vejez: "NORMAL",
                examen_salud_mental_habito_vejez: "NORMAL",
                examen_salud_mental_sueno_o_dormir_vejez: "NORMAL",
                examen_salud_mental_alimentacion_vejez: "NORMAL",
                examen_salud_mental_inteligencia_vejez: "NORMAL",
                examen_salud_mental_retardo_mental_vejez: "NORMAL",
                examen_salud_mental_introyeccion_vejez: "NORMAL",
                examen_salud_mental_prospeccion_vejez: "NORMAL",
                examen_salud_mental_somatizacion_vejez: "NORMAL",
                dinamica_familiar_observaciones_vejez: "Trae interpretación del familiograma.",
                laboratorio_clinico_resultado_hemoglobina_vejez: hemoglobina,
                laboratorio_clinico_unidad_medida_hemoglobina_vejez: null,
                laboratorio_clinico_fecha_hemoglobina_vejez: fechaHemoglobina,
                laboratorio_paraclinico_laboratorio_prueba_treponemica_rapida_sifilis_vejez: "0",
                laboratorio_paraclinico_laboratorio_fecha_prueba_treponemica_rapida_sifilis_vejez: "",
                laboratorio_clinico_resultado_prueba_rapida_VIH_vejez: "0",
                laboratorio_paraclinico_laboratorio_fecha_prueba_rapida_VIH_vejez: "",
                laboratorio_paraclinico_laboratorio_hepatitis_b_vejez: null,
                laboratorio_paraclinico_laboratorio_hepatitis_b_fecha_vejez: null,
                resultadoTestApgarAdultos: null,
                // ========== ESCALA FINDRISC COMPLETA (como en el JSON perfecto) ==========
                escala_findrisc_realiza_normalmente_30_minutos_de_actividad_fisica: false,
                escala_findrisc_con_que_frecuencia_come_frutas_verduras: "0",
                escala_findrisc_le_han_recetado_alguna_vez_nedicamentos_contra_la_hta: false,
                escala_findrisc_le_han_detectado_alguna_vez_niveles_altos_de_glucosa: false,
                escala_findrisc_ha_habido_algun_diagnostico_de_DM_en_su_familia: "5",
                puntuacion_escala_findrisc: "4",
                porcentaje_escala_findrisc: "1",
                riesgo_cardiovascular_sexo_oms_vejez: generoLabel,
                ...generarLawtonBrody(esMasculino),
                InformacionSalud: [
                    { IdProcedimiento: "10774" },
                    { IdProcedimiento: "10792" }
                ]
            }
        ],
        resolucion4505: [
            {
                gestacion: "0",
                sintomatico_respiratorio: "2",
                fecha_toma_baciloscopia_diagnostico: "1845-01-01",
                resultado_baciloscopia_diagnostico: "4",
                resultado_hemoglobina: hemoglobina,
                fecha_toma_hemoglobina: fechaHemoglobina,
                agudeza_visual_lejana_ojo_izquierdo: "3",
                agudeza_visual_lejana_ojo_derecho: "3",
                valoracion_agudeza_visual: fechaAdmisionStr,
                codigo_pais: "170",
                resultado_tamizaje_VALE: "0",
                fecha_tamizaje_VALE: "1845-01-01",
                tamizaje_cancer_cuello_uterino: "0",
                citologia_cervicouterina: "1845-01-01",
                resultado_tamizaje_cancer_cuello_uterino: "0",
                fecha_tamizaje_cancer_cuello_uterino: "1800-01-01",
                calidad_muestra_citologia_cervicouterina: "0",
                codigo_habilitacion_IPS_citologia_cervicouterina: "0",
                fecha_colposcopia: "1845-01-01",
                fecha_biopsia_cervical: "1845-01-01",
                resultado_biopsia_cervicouterina: "0",
                fecha_consulta_valoracion_integral: fechaAdmisionStr,
                resultado_antigeno_superficie_hepatitisB_toda: "0",
                fecha_antigeno_superficie_hepatitisB_toda: "1845-01-01",
                resultado_prueba_tamizaje_sifilis: "0",
                fecha_serologia_sifilis: "1845-01-01",
                resultado_prueba_VIH: "0",
                fecha_tomae_elisa_VIH: "1845-01-01",
                planificación_familiar_primera_vez: "2025-12-08",
                suministro_metodo_anticonceptivo: "21",
                fecha_suministro_metodo_anticonceptivo: "2025-12-08",
                consumo_tabaco: "99",
                resultado_glicemia_basal: glicemia,
                fecha_toma_glicemia_basal: fechaGlicemia,
                resultado_LDL: ldl,
                fecha_toma_LDL: fechaLDL,
                resultado_HDL: hdl,
                fecha_toma_HDL: fechaHDL,
                resultado_trigliceridos: trigliceridos,
                fecha_toma_trigliceridos: fechaTrigliceridos,
                resultado_creatinina: creatinina,
                fecha_creatinina: fechaCreatinina,
                clasificacion_riesgo_cardiovascular: "21",
                clasificación_riesgo_metabolico: "21",
                resultado_tamizaje_hepatitis_C: "0",
                fecha_toma_tamizaje_hepatitis_C: "1845-01-01",
                resultado_tacto_rectal: "21",
                fecha_tacto_rectal: "1800-01-01",
                resultado_PSA: psaValor,
                fecha_toma_PSA: psaFecha,
                resultado_prueba_sangre_oculta_materia_fecal: "21",
                fecha_prueba_sangre_oculta_materia_feca: "1800-01-01",
                resultado_colonoscopia_tamizaje: "21",
                fecha_colonoscopia_tamizaje: "1800-01-01",
                resultado_mamografia_res202: "0",
                fecha_mamografía: "1845-01-01",
                resultado_biopsia_mama: "0",
                fecha_toma_biopsia_seno_BACAF: "1845-01-01",
                fecha_resultado_biopsia_seno_BACAF: "1845-01-01",
                resultado_prueba_mini_mental_state: "21"
            }
        ],
        genero: generoLabel
    };
    return resultado;
};
exports.vejez = vejez;
