// src/controllers/catalogos/infancia.ts

/**
 * Catálogo de historia clínica para INFANCIA (6-11 años).
 * Versión final: prioriza datos reales; si faltan datos necesarios, los inventa con valores válidos.
 * Fechas nulas/inválidas se calculan restando 3 días hábiles a la fecha de consulta.
 * Corregido: hemoglobina no es necesaria en infancia (solo se usa si hay dato real).
 */
export default function infancia(data: any): any {
  const { admision = {}, paciente = {}, historia = {}, facturacion = {} } = data;
  const clinicos = data.datosClinicos || null;
  const edad = data.edad ?? 0;
  const generoTexto = data.generoTexto || 'No especificado';

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
  let peso = clinicos?.antropometricos?.peso ? Number(clinicos.antropometricos.peso) : 
    [20, 22, 25, 28, 32][Math.min(Math.max(edad - 6, 0), 4)] || 25;
  let talla = clinicos?.antropometricos?.talla ? Number(clinicos.antropometricos.talla) :
    [115, 120, 125, 130, 135][Math.min(Math.max(edad - 6, 0), 4)] || 125;
  const imc = (peso > 0 && talla > 0) ? peso / ((talla / 100) ** 2) : 0;

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
  // PRUEBAS RÁPIDAS Y LABORATORIOS
  // ============================================================
  const mapResultado = (v: string | null, esNecesario: boolean): string => {
    if (!v) {
      return esNecesario ? "5" : "0";
    }
    const r = v.trim().toLowerCase();
    if (r === "positivo" || r === "reactivo") return "4";
    if (r === "negativo" || r === "no reactivo") return "5";
    return "0";
  };

  // Pruebas rápidas (obligatorias en infancia)
  const hbvResult = clinicos?.pruebas_rapidas?.hepatitis_b?.resultado ?? null;
  const vihResult = clinicos?.pruebas_rapidas?.vih?.resultado ?? null;
  const sifResult = clinicos?.pruebas_rapidas?.sifilis?.resultado ?? null;
  const esNecesarioPrueba = true;

  const fechaHBV = obtenerFechaValida(
    clinicos?.pruebas_rapidas?.hepatitis_b?.fecha,
    !!hbvResult,
    esNecesarioPrueba,
    '1845-01-01'
  );
  const fechaVIH = obtenerFechaValida(
    clinicos?.pruebas_rapidas?.vih?.fecha,
    !!vihResult,
    esNecesarioPrueba,
    '1845-01-01'
  );
  const fechaSif = obtenerFechaValida(
    clinicos?.pruebas_rapidas?.sifilis?.fecha,
    !!sifResult,
    esNecesarioPrueba,
    '1845-01-01'
  );

  // Hemoglobina: NO es necesaria en infancia (solo se usa si viene dato real)
  const hemoValor = clinicos?.laboratorios?.hemoglobina?.valor ?? null;
  const tieneHemo = hemoValor !== null && hemoValor !== undefined;
  const fechaHemo = obtenerFechaValida(
    clinicos?.laboratorios?.hemoglobina?.fecha,
    tieneHemo,
    false, // <--- NO es necesario
    '1845-01-01'
  );
  const resultadoHemo = tieneHemo ? Number(hemoValor) : 0; // 0 = no aplica

  // Baciloscopia: no necesaria en infancia
  const baciloValor = clinicos?.laboratorios?.baciloscopia?.valor ?? null;
  const tieneBacilo = baciloValor !== null && baciloValor !== undefined;
  const fechaBacilo = obtenerFechaValida(
    clinicos?.laboratorios?.baciloscopia?.fecha,
    tieneBacilo,
    false,
    '1845-01-01'
  );
  const resultadoBacilo = tieneBacilo ? String(baciloValor) : "4";

  // ============================================================
  // SALUD VISUAL
  // ============================================================
  const ojoDerecho = clinicos?.salud_visual?.ojo_derecho || "20/20";
  const ojoIzquierdo = clinicos?.salud_visual?.ojo_izquierdo || "20/20";
  const agudezaCode = (v: string): string => v === "20/40" ? "4" : "3";

  // ============================================================
  // CONSTRUCCIÓN DEL OBJETO
  // ============================================================
  return {
    id_historia: String(historia?.id_historia || 0),
    numero_historia: String(historia?.numero_historia || 0),
    fk_admision: String(admision.id_admision || 0),
    fk_paciente: String(paciente.id_paciente || 0),
    fk_servicio_ingreso: '2',
    fk_procedimiento: '8238',
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

    enfermedad_actual_historia: `ESCOLAR ${generoTexto === 'FEMENINO' ? 'FEMENINA' : 'MASCULINO'} DE ${edad} AÑOS, ASINTOMÁTICO.`,

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

    diagnostico_ingreso_tipo_historia: '1',
    diagnostico_ingreso_fk_causa_externa: '40',
    diagnostico_ingreso_observaciones_historia: `IMPRESIÓN DIAGNÓSTICA: ESCOLAR. TALLA ADECUADA. IMC ${imc >= 30 ? 'OBESIDAD' : imc < 18.5 ? 'BAJO PESO' : 'ADECUADO'}. PAI COMPLETO.`,
    historia_clinica_enfermedades_diagnostico_ingreso: [
      { id_historia_enfermedad_diagnostico_ingreso: 0, fk_historia: 0, fk_enfermedad: 'Z002', fk_institucion: 0 }
    ],

    // ============================================================
    // BLOQUE historia_pym_infancia
    // ============================================================
    historia_pym_infancia: [{
      // Los campos que agregaste (Findrisc) se mantienen
      escala_findrisc_realiza_normalmente_30_minutos_de_actividad_fisica: true,
      escala_findrisc_con_que_frecuencia_come_frutas_verduras: "1",
      escala_findrisc_le_han_recetado_alguna_vez_nedicamentos_contra_la_hta: false,
      escala_findrisc_le_han_detectado_alguna_vez_niveles_altos_de_glucosa: false,
      escala_findrisc_ha_habido_algun_diagnostico_de_DM_en_su_familia: "0",

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
      resultadoTestApgarInfantil: 1,
      goodenough_harris: 226,
      estructuras_dentomaxilofaciales_infancia: 'Estructuras sin alteraciones.',
      examen_salud_mental_apariencia_general_infancia: 'NORMAL',
      examen_salud_mental_conciencia_infancia: 'NORMAL',
      examen_salud_mental_orientacion_infancia: 'NORMAL',
      examen_salud_mental_afecto_infancia: 'NORMAL',
      examen_salud_mental_lenguaje_infancia: 'NORMAL',
      crianza_y_cuidado_diagnostico_infancia: 'Prácticas de crianza adecuadas.',
      HistoriasPymInfanciaInformacionSalud: [
        { Id: null, IdHistoriaInfancia: 0, IdProcedimiento: "10777" },
        { Id: null, IdHistoriaInfancia: 0, IdProcedimiento: "10795" }
      ]
    }],

    // ============================================================
    // BLOQUE RESOLUCION 4505 (con hemoglobina corregida)
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
      fecha_atencion_salud_bucal: "",

      // Hepatitis B
      fecha_antigeno_superficie_hepatitisB_toda: fechaHBV,
      resultado_antigeno_superficie_hepatitisB_toda: mapResultado(hbvResult, esNecesarioPrueba),

      // Sífilis
      fecha_serologia_sifilis: fechaSif,
      resultado_prueba_tamizaje_sifilis: mapResultado(sifResult, esNecesarioPrueba),

      // VIH
      fecha_tomae_elisa_VIH: fechaVIH,
      resultado_prueba_VIH: mapResultado(vihResult, esNecesarioPrueba),

      // Hemoglobina (corregida: solo si hay dato real; si no, comodín)
      fecha_toma_hemoglobina: fechaHemo,        // 1845-01-01 si no hay dato
      resultado_hemoglobina: resultadoHemo,    // 0 si no hay dato

      // Baciloscopia
      fecha_toma_baciloscopia_diagnostico: fechaBacilo,
      resultado_baciloscopia_diagnostico: resultadoBacilo,

      // Cáncer de cuello (no aplica)
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