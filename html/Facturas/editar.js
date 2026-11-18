const fs = require('fs');
const path = require('path');
const ARCHIVO = path.join(__dirname, 'Facturas.html');
const BACKUP  = ARCHIVO + '.bak';
if (!fs.existsSync(BACKUP)) fs.copyFileSync(ARCHIVO, BACKUP);

let buf = fs.readFileSync(ARCHIVO);
let enc = 'utf8';
try { new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch { enc = 'latin1'; }
let html = buf.toString(enc);

// Verificar sintaxis de un bloque <script> completo
function sintaxisOk(h) {
  const m = h.match(/<script>([\s\S]*?)<\/script>/);
  if (!m) return { ok: false, msg: 'sin <script>' };
  try { new Function(m[1]); return { ok: true }; }
  catch (e) {
    const lm = e.stack && e.stack.match(/:(\d+):(\d+)/);
    return { ok: false, msg: e.message, linea: lm ? +lm[1] : null };
  }
}

const before = sintaxisOk(html);
console.log('Sintaxis ANTES:', before.ok ? 'OK' : ('MAL -> ' + before.msg + ' (linea ~' + before.linea + ')'));

// === CAMBIO 1: reemplazar SOLO la funcion evaluarExito completa ===
const rxEval = /function evaluarExito\(res, body\) \{[\s\S]*?\n\}/;
const m = html.match(rxEval);
if (!m) { console.error('[ABORTA] no encontre evaluarExito'); process.exit(1); }
const evalOriginal = m[0];
console.log('\n--- evaluarExito ORIGINAL (' + evalOriginal.length + ' chars) ---');
console.log(evalOriginal);

const evalNuevo =
`function evaluarExito(res, body) {
  if (!res.ok) return { exito: false, msg: \`HTTP \${res.status}\` };
  if (!body || typeof body !== 'object') return { exito: false, msg: 'Respuesta invalida del servidor' };
  if (body.errores > 0) return { exito: false, msg: body.mensajeRetorno || \`Errores: \${body.errores}\` };

  const msg = String(body.mensajeRetorno || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
  if (!/actualiz(o|o)\\s+correctamente/.test(msg)) {
    return { exito: false, msg: body.mensajeRetorno || 'No se recibio mensaje de exito' };
  }
  return { exito: true, msg: body.mensajeRetorno };
}`;

html = html.replace(rxEval, evalNuevo);
console.log('\n[OK] evaluarExito reemplazado.');

// === CAMBIO 4: insertar auto-inclusion dx despues de recalcularProcedimiento(path); ===
const ancla = "if (/FacturasProcedimientosF\\[\\d+\\]\\.(cantidad|valor_unitario|cuota_moderadora)$/.test(path)) recalcularProcedimiento(path);";
if (html.indexOf(ancla) < 0) { console.error('[ABORTA] no encontre ancla de cambio 4'); process.exit(1); }

const inserto =
`  if (/FacturasProcedimientosF\\[\\d+\\]\\.(cantidad|valor_unitario|cuota_moderadora)$/.test(path)) recalcularProcedimiento(path);

  const _mC = path.match(/^(FacturasCompletasPasar\\.FacturasConsultasF\\[\\d+\\])\\./);
  if (_mC) {
    const _base = _mC[1];
    ['consultasDiagnosticosPrincipales','facturas_consultas_enfermedades_diagnostico_principal','consultasDiagnosticosRelacionales','facturas_consultas_enfermedades_diagnostico_relacional'].forEach(_suf => {
      const _p = _base + '.' + _suf;
      const _chk = document.querySelector('[data-incluir="' + _p + '"]');
      if (_chk && !_chk.checked) { _chk.checked = true; adm.incluir.add(_p); const _f = _chk.closest('.field'); if (_f) _f.classList.add('incluido'); }
    });
    updatePreview();
    renderListaAdmisiones();
    syncCheckboxesSeccion();
  }`;
html = html.replace(ancla, inserto);
console.log('[OK] auto-incluir dx en consulta.');

const after = sintaxisOk(html);
console.log('\nSintaxis DESPUES:', after.ok ? 'OK' : ('MAL -> ' + after.msg + ' (linea ~' + after.linea + ')'));

if (!after.ok) {
  console.error('\n\u274C La sintaxis quedo mal. NO se guardo nada. Abortando.');
  process.exit(1);
}

fs.writeFileSync(ARCHIVO, Buffer.from(html, enc), );
console.log('\n\u2705 Guardado. Cambios aplicados y sintaxis verificada.');
console.log('Rollback: copy /Y Facturas.html.bak Facturas.html');