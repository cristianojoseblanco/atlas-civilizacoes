(() => {
// Três direções visuais para a home do curso: mapa 3D em tela cheia + folha com a árvore do galho.
const U = DADOS.unidades, M = DADOS.mapa, VJ = DADOS.vj, TODAS = [], POR = {};
U.forEach((u, ui) => u.licoes.forEach((l, li) => { l.ui = ui; l.li = li; TODAS.push(l); POR[l.id] = l; }));
const feitos = new Set([...TODAS.filter(l => l.ui < 2).map(l => l.id), 'crise-2000', 'isin-larsa', 'mari']);
const est = l => feitos.has(l.id) ? 'feito' : l.requisitos.every(r => feitos.has(r)) ? (l.publicada ? 'atual' : 'aberta') : 'trancado';
const Q = 3, proj = l => [(l.lon - M.lon0) * M.kx * Q, (M.lat1 - l.lat) * M.k * Q];
const FOCO = POR['hamurabi'], GALHO = U[2];
const anoTxt = a => a < 0 ? `${-a} a.C.` : `${a} d.C.`;

function mapa(el, t){
  const w = el.clientWidth, h = el.clientHeight;
  const ls = GALHO.licoes, ps = ls.map(proj), xs = ps.map(p => p[0]), ys = ps.map(p => p[1]);
  const s = Math.min(w / (Math.max(...xs) - Math.min(...xs) + 120), 1.6), cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  let arcos = '';
  TODAS.filter(l => l.ui === 2).forEach(l => l.requisitos.forEach(r => {
    const a = proj(POR[r]), b = proj(l), dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy); if (d < 4) return;
    const hh = Math.min(d * .34, 520), ang = Math.atan2(dy, dx) * 180 / Math.PI, k = feitos.has(r) ? (feitos.has(l.id) ? 'feita' : 'aberta') : 'fechada';
    arcos += `<div class="arco ${k}" style="width:${d}px;height:${hh + 20}px;left:${-d / 2}px;top:${-(hh + 20)}px;transform:translate3d(${(a[0] + b[0]) / 2}px,${(a[1] + b[1]) / 2}px,0) rotateZ(${ang}deg) rotateX(-90deg)"><svg viewBox="0 0 ${d} ${hh + 20}" preserveAspectRatio="none"><path pathLength="100" d="M0 ${hh + 20}Q${d / 2} ${20 - hh} ${d} ${hh + 20}"/></svg></div>`;
  }));
  const T = t.tilt, R = -10;
  const bb = (x, y) => `translate3d(${x}px,${y}px,3px) rotateZ(${-R}deg) rotateX(${-T}deg) scale3d(${1 / s},${1 / s},${1 / s})`;
  const pins = TODAS.filter(l => l.ui >= 1 && l.ui <= 3).map(l => { const [x, y] = proj(l); return `<div class="pin bb ${est(l)}${l === FOCO ? ' foco' : ''}${l.ui !== 2 ? ' longe' : ''}" style="transform:${bb(x, y)}"><i></i><b></b></div>`; }).join('');
  const [fx, fy] = proj(FOCO);
  el.innerHTML = `<div class="cena"><div class="mundo" style="transform:rotateX(${T}deg) rotateZ(${R}deg) scale3d(${s},${s},${s}) translate(${-cx}px,${-cy + 40 / s}px)">
    <div class="marfundo"></div>${t.espessura ? `<svg class="chao base" width="${M.w * Q}" height="${M.h * Q}" viewBox="0 0 ${M.w} ${M.h}">${M.svg}</svg>` : ''}
    <svg class="chao" width="${M.w * Q}" height="${M.h * Q}" viewBox="0 0 ${M.w} ${M.h}">${M.svg}</svg>${arcos}${pins}
    <div class="vj bb" style="transform:${bb(fx, fy)}"><div>${VJ.parado}</div></div>
    <div class="etq bb" style="transform:${bb(fx, fy)}"><span>Babilônia</span></div></div></div><div class="ceu"></div>`;
}
function folha(l){
  const ls = GALHO.licoes, nv = {}; const lv = x => nv[x.id] ?? (nv[x.id] = Math.max(0, ...x.requisitos.filter(r => POR[r].ui === 2).map(r => lv(POR[r]) + 1)));
  ls.forEach(lv); const linhas = []; ls.forEach(x => (linhas[nv[x.id]] ??= []).push(x));
  const nf = ls.filter(x => feitos.has(x.id)).length;
  return `<div class="folha"><span class="alca"></span>
    <div class="cab"><div><span class="per">${GALHO.periodo}</span><h2>${GALHO.titulo}</h2></div><span class="prog">${nf}/${ls.length}</span></div>
    <div class="arv">${linhas.map(r => `<div class="ln">${r.map(x => `<div class="nd ${est(x)}${x === FOCO ? ' sel' : ''}"><i></i><span>${x.titulo}</span></div>`).join('')}</div>`).join('')}</div>
    <div class="acao"><div><b>${FOCO.titulo}</b><span>${FOCO.lugar} · ${anoTxt(FOCO.ano)}</span></div><button>Começar</button></div></div>`;
}
document.querySelectorAll('.tel').forEach(tel => {
  const t = {tilt: +tel.dataset.tilt, espessura: tel.dataset.esp === '1'};
  tel.innerHTML = `<div class="topo"><span class="marca">Atlas</span><span class="ch">⬢ 5</span><span class="ch">1.240 XP</span></div><div class="mapa"></div><span class="ano">1760 a.C.</span>${folha()}`;
  mapa(tel.querySelector('.mapa'), t);
});
})();
