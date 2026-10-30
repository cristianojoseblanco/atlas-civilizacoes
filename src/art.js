// Padrões ornamentais desenhados para o atlas, inspirados em tradições artísticas (não são cópias de peças).
// ART e ART_RULES vêm de data/conteudo/artes_estilos.csv e artes_regras.csv (gerados por scripts/conteudo.py).
// A primeira regra que casar com o lugar (grupo, caixa de lon/lat e intervalo de anos) define o estilo.
function artStyle(lon, lat, y, g){
  for (const r of ART_RULES){
    if (r.g && r.g !== g) continue;
    if (r.box && !(lon >= r.box[0] && lon <= r.box[1] && lat >= r.box[2] && lat <= r.box[3])) continue;
    if (r.a != null && y < r.a) continue;
    if (r.b != null && y > r.b) continue;
    return r.s;
  }
  return 'espiral';
}
function artTile(style, color){
  const a = ART[style];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${a.w}" height="${a.h}" viewBox="0 0 ${a.w} ${a.h}"><g fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">${a.d}</g></svg>`;
}
