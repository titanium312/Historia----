// node editar3.js
const fs = require('fs');
const path = require('path');
const ARCHIVO = path.join(__dirname, 'Facturas.html');
const BACKUP  = ARCHIVO + '.bak3';
if (!fs.existsSync(BACKUP)) fs.copyFileSync(ARCHIVO, BACKUP);

let buf = fs.readFileSync(ARCHIVO);
let enc = 'utf8';
try { new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch { enc = 'latin1'; }
let html = buf.toString(enc);
const NL = html.indexOf('\r\n') !== -1 ? '\r\n' : '\n';
console.log('Line endings:', NL === '\r\n' ? 'CRLF' : 'LF');

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
console.log('Sintaxis ANTES:', before.ok ? 'OK' : ('MAL -> ' + before.msg));

if (html.indexOf('.tipo-bloque{') >= 0) {
  console.error('[ABORTA] Ya aplicado. Rollback: copy /Y Facturas.html.bak3 Facturas.html');
  process.exit(1);
}

// ───── CSS: bloques por tipo ─────
const cssAnchor = '  #tipoConsultaSel:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(59,130,246,.18)}';
if (html.indexOf(cssAnchor) < 0) { console.error('[ABORTA] CSS anchor no encontrado'); process.exit(1); }
const cssNuevo = cssAnchor + [
  '',
  '  .tipo-bloque{background:#0b1427;border:1px solid var(--line);border-radius:8px;padding:12px;margin-bottom:10px}',
  '  .tipo-bloque:last-child{margin-bottom:0}',
  '  .tipo-bloque-head{font-size:13px;color:var(--text);margin-bottom:10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
  '  .tipo-bloque-head b{color:#93c5fd;font-family:ui-monospace,monospace}',
  '  .tipo-bloque-head .cuenta{font-size:11px;padding:1px 8px;border-radius:999px;background:#111c33;border:1px solid var(--line);color:var(--muted)}',
  '  .tipo-bloque-campos{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:4px;margin-bottom:10px}'
].join(NL);
html = html.replace(cssAnchor, cssNuevo);
console.log('[OK] CSS agregado.');

// ───── Reemplazar generación del panel ─────
const rxPanel = /  if \(consultas\.length\)\{\r?\n    const porTipo = \{\};[\s\S]*?\+ '<\/div><\/div><\/details>' \+ html;\r?\n  \}/;
if (!rxPanel.test(html)) { console.error('[ABORTA] bloque del panel no encontrado'); process.exit(1); }
const panelNuevo = [
  '  if (consultas.length){',
  '    const porTipo = {};',
  '    consultas.forEach(c => {',
  "      const t = detectarTipoConsulta(c) || 'OTRO';",
  '      porTipo[t] = (porTipo[t] || 0) + 1;',
  '    });',
  '    const bloques = Object.keys(TIPOS_CONSULTA).map(t => {',
  '      const n = porTipo[t] || 0;',
  '      const preset = TIPOS_CONSULTA[t];',
  '      const config = leerConfigTipo(t);',
  '      const camposHtml = Object.entries(preset.campos).map(([k, v]) => {',
  "        const checked = config[k] !== false;",
  "        return '<label class=\"campo-preset-row\"><input type=\"checkbox\" data-tipo=\"' + escapeHtml(t) + '\" data-key=\"' + escapeHtml(k) + '\"' + (checked ? ' checked' : '') + ' /><span class=\"campo-preset-key\">' + escapeHtml(k) + '</span><span class=\"campo-preset-val\">' + escapeHtml(String(v)) + '</span></label>';",
  "      }).join('');",
  "      return '<div class=\"tipo-bloque\" data-tipo=\"' + escapeHtml(t) + '\">'",
  "        + '<div class=\"tipo-bloque-head\"><b>' + escapeHtml(t) + '</b> · ' + escapeHtml(preset.nombre) + ' <span class=\"cuenta\">' + n + ' en esta admisión</span></div>'",
  "        + '<div class=\"tipo-bloque-campos\">' + camposHtml + '</div>'",
  "        + '<div class=\"row\">'",
  "        + '<button type=\"button\" class=\"btn preset-tipo-apply\" data-tipo=\"' + escapeHtml(t) + '\"' + (n ? '' : ' disabled') + '>⚡ Aplicar a ' + n + ' consulta(s)</button>'",
  "        + '<button type=\"button\" class=\"btn ghost small preset-tipo-all\" data-tipo=\"' + escapeHtml(t) + '\">☑ Marcar todos</button>'",
  "        + '<button type=\"button\" class=\"btn ghost small preset-tipo-none\" data-tipo=\"' + escapeHtml(t) + '\">☐ Desmarcar todos</button>'",
  "        + '</div></div>';",
  "    }).join('');",
  "    html = '<details class=\"section\" open><summary><span>🏷 Editar por tipo de consulta</span><span class=\"subtitle\">' + consultas.length + ' consulta(s) en esta admisión</span></summary>'",
  "      + '<div class=\"body\">' + bloques + '</div></details>' + html;",
  '  }'
].join(NL);
html = html.replace(rxPanel, panelNuevo);
console.log('[OK] panel de 3 bloques generado.');

// ───── Reemplazar wiring del dropdown por wiring por bloque ─────
const rxWire = /  const tipoSel = wrap\.querySelector\('#tipoConsultaSel'\);[\s\S]*?\n  \}\r?\n\r?\n  wrap\.querySelectorAll\('\.searchsel'\)/;
if (!rxWire.test(html)) { console.error('[ABORTA] wiring anterior no encontrado'); process.exit(1); }
const wireNuevo = [
  "  wrap.querySelectorAll('.tipo-bloque').forEach(bloque => {",
  '    const tipo = bloque.dataset.tipo;',
  "    const camposWrap = bloque.querySelector('.tipo-bloque-campos');",
  "    const btnAplicar = bloque.querySelector('.preset-tipo-apply');",
  "    const btnMarcarTodos = bloque.querySelector('.preset-tipo-all');",
  "    const btnDesmarcarTodos = bloque.querySelector('.preset-tipo-none');",
  '',
  "    camposWrap.addEventListener('change', () => {",
  '      const config = {};',
  "      camposWrap.querySelectorAll('input[type=checkbox]').forEach(c => { config[c.dataset.key] = c.checked; });",
  '      guardarConfigTipo(tipo, config);',
  '    });',
  '',
  "    btnMarcarTodos.addEventListener('click', () => {",
  "      camposWrap.querySelectorAll('input[type=checkbox]').forEach(c => c.checked = true);",
  "      camposWrap.dispatchEvent(new Event('change', { bubbles: true }));",
  '    });',
  "    btnDesmarcarTodos.addEventListener('click', () => {",
  "      camposWrap.querySelectorAll('input[type=checkbox]').forEach(c => c.checked = false);",
  "      camposWrap.dispatchEvent(new Event('change', { bubbles: true }));",
  '    });',
  '',
  "    btnAplicar.addEventListener('click', () => {",
  "      const camposSel = Array.from(camposWrap.querySelectorAll('input[type=checkbox]:checked')).map(c => c.dataset.key);",
  "      if (!camposSel.length){ toast('Marca al menos un campo', 'err'); return; }",
  '      const admActiva = getActiva(); if (!admActiva) return;',
  '      const consultasAdm = admActiva.editada.FacturasCompletasPasar?.FacturasConsultasF || [];',
  '      const idxs = [];',
  '      consultasAdm.forEach((c, i) => { if (detectarTipoConsulta(c) === tipo) idxs.push(i); });',
  "      if (!idxs.length){ toast('No hay consultas de ese tipo en la admisión', 'err'); return; }",
  "      if (!confirm('¿Aplicar ' + camposSel.length + ' campo(s) del preset ' + tipo + ' a ' + idxs.length + ' consulta(s)?')) return;",
  '      idxs.forEach(i => aplicarPresetConCampos(admActiva, i, tipo, camposSel));',
  '      renderEditor(); updatePreview(); renderListaAdmisiones();',
  "      toast('Aplicado a ' + idxs.length + ' consulta(s)', 'ok');",
  '    });',
  '  });',
  '',
  "  wrap.querySelectorAll('.searchsel')"
].join(NL);
html = html.replace(rxWire, wireNuevo);
console.log('[OK] wiring por bloque.');

// ───── Validación ─────
const after = sintaxisOk(html);
console.log('\nSintaxis DESPUES:', after.ok ? 'OK' : ('MAL -> ' + after.msg + ' (linea ~' + after.linea + ')'));
if (!after.ok) {
  console.error('\n❌ NO se guardó nada.');
  process.exit(1);
}

fs.writeFileSync(ARCHIVO, Buffer.from(html, enc));
console.log('\n✅ Guardado. Rollback: copy /Y Facturas.html.bak3 Facturas.html');