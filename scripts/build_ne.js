// Para cada mapa do Oriente Próximo: escolhe a base mundial mais próxima e lista as feições da base a remover
// (as que têm centroide dentro da caixa da região redesenhada). Gera data/ne_meta.json.
const fs = require('fs'), path = require('path');
const topojson = require('topojson-client');
const d3 = require('d3');
const ROOT = path.join(__dirname, '..');
const BOX = {x0: 33, x1: 62.5, y0: 27, y1: 41.5};
// feições da base que ficam mesmo dentro da caixa (fora da área redesenhada)
const KEEP = new Set(['Namazga']);
const custom = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/ne_custom.json')));
const real = fs.readdirSync(path.join(ROOT, 'data/borders')).map(f => { const m = f.match(/world_(bc)?(\d+)\.json/); return m ? (m[1] ? -1 : 1) * +m[2] : null; }).filter(v => v != null).sort((a, b) => a - b);
const anos = [...new Set(custom.features.map(f => f.properties.ano))].sort((a, b) => a - b);
const meta = {};
for (const ano of anos) {
  let base = real.reduce((b, y) => Math.abs(y - ano) < Math.abs(b - ano) || (Math.abs(y - ano) === Math.abs(b - ano) && y < b) ? y : b, real[0]);
  const name = (base < 0 ? 'world_bc' + (-base) : 'world_' + base) + '.json';
  const t = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/borders', name)));
  const fc = topojson.feature(t, t.objects[Object.keys(t.objects)[0]]);
  const remove = new Set();
  for (const f of fc.features) {
    if (!f.geometry || !f.properties.NAME) continue;
    const g = f.geometry; const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
    let best = null, ba = -1; // centroide do maior polígono, em graus (aproximado)
    for (const p of polys) { const r = p[0]; let a = 0, cx = 0, cy = 0; for (let i = 0; i < r.length - 1; i++) { const k = r[i][0]*r[i+1][1] - r[i+1][0]*r[i][1]; a += k; cx += (r[i][0]+r[i+1][0])*k; cy += (r[i][1]+r[i+1][1])*k; } if (Math.abs(a) > ba) { ba = Math.abs(a); best = [cx/(3*a), cy/(3*a)]; } }
    if (best && best[0] > BOX.x0 && best[0] < BOX.x1 && best[1] > BOX.y0 && best[1] < BOX.y1 && ba < 400 && !KEEP.has(f.properties.NAME.trim())) remove.add(f.properties.NAME.trim());
  }
  meta[ano] = {base, remove: [...remove].sort()};
  console.log(ano, '<- base', base, 'remove:', meta[ano].remove.join(' | '));
}
fs.writeFileSync(path.join(ROOT, 'data/ne_meta.json'), JSON.stringify(meta));
