// Padrões ornamentais desenhados para o atlas, inspirados em tradições artísticas (não são cópias de peças).
// ART e ART_RULES vêm de data/conteudo/artes_estilos.csv e artes_regras.csv (gerados por scripts/conteudo.py).
// A primeira regra que casar define o estilo: regras com alvo (id da civilização ou do lugar) vêm antes;
// depois grupo, caixa de lon/lat e intervalo de anos.
function artStyle(lon, lat, y, g, alvo){
  for (const r of ART_RULES){
    if (r.alvo && r.alvo !== alvo) continue;
    if (r.g && r.g !== g) continue;
    if (r.box && !(lon >= r.box[0] && lon <= r.box[1] && lat >= r.box[2] && lat <= r.box[3])) continue;
    if (r.a != null && y < r.a) continue;
    if (r.b != null && y > r.b) continue;
    return r.s;
  }
  return 'espiral';
}
// Faixa animada: os ladrilhos se desenham traço a traço, da esquerda para a direita, nas cores da cultura.
function artBand(style, width, height){
  const a = ART[style], cols = Math.ceil(width / a.w) + 1, rows = Math.ceil(height / a.h);
  const ox = Math.round((width - cols * a.w) / 2), oy = 0;
  const d = a.d.replace(/<(path|circle|rect|ellipse|polyline|polygon|line)(?![^>]*stroke-dasharray)/g, '<$1 pathLength="1"');
  let s = '';
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++){
    const c = a.cores[(i + j) % a.cores.length];
    s += `<g transform="translate(${ox + i * a.w},${oy + j * a.h})" stroke="${c}" style="--d:${(i * 0.07 + j * 0.12).toFixed(2)}s">${d}</g>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g fill="none" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">${s}</g></svg>`;
}
