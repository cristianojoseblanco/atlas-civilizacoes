(() => {
const $ = s => document.querySelector(s);
const esc = x => String(x ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const md = x => esc(x).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches;
const L = DADOS.licao, M = DADOS.mapa, VJ = DADOS.vj;
const st = {xp: 0, en: 5, secoesFeitas: 0, seq: 3};

// ---------- ícones ----------
const IC = {
  livro: '<svg class="ic" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4.5 5h5.8a2 2 0 0 1 2 2v12.2a1.7 1.7 0 0 0-1.7-1.7H4.5zM19.5 5h-5.8a2 2 0 0 0-2 2v12.2a1.7 1.7 0 0 1 1.7-1.7h6.1z" fill="#fff"/></svg>',
  feito: '<svg class="ic" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5.5 12.5l4.2 4.2L18.5 8" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  cadeado: '<svg class="ic" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="6" y="10.5" width="12" height="9.5" rx="2.4" fill="#AEAEB2"/><path d="M9 10.5V8a3 3 0 0 1 6 0v2.5" stroke="#AEAEB2" stroke-width="2.2"/></svg>',
  breve: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="6.5" cy="12" r="1.9" fill="#FF9500"/><circle cx="12" cy="12" r="1.9" fill="#FF9500"/><circle cx="17.5" cy="12" r="1.9" fill="#FF9500"/></svg>',
};

// ---------- árvore de lições (B: trilha | mapa sincronizados) ----------
const CORES = ['#A2845E', '#007AFF', '#30B0C7', '#FF9500', '#AF52DE', '#FF2D55'];
const U = DADOS.unidades, TODAS = [], POR_ID = {};
U.forEach((u, ui) => u.licoes.forEach((l, li) => { l.ui = ui; l.li = li; l.gi = TODAS.length; TODAS.push(l); POR_ID[l.id] = l; }));
const PUB = TODAS.find(l => l.publicada) || TODAS[0];
const celular = () => innerWidth < 900;
const OK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CAD = '<svg width="13" height="14" viewBox="0 0 24 26" fill="none" aria-hidden="true"><rect x="4" y="11" width="16" height="12" rx="3" fill="currentColor"/><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="3"/></svg>';

// progresso: fica no navegador; o menu "Simular" serve para ver a árvore em outros momentos
const CHAVE = 'atlas-prototipo-d-feitos';
let feitos = new Set();
try { feitos = new Set(JSON.parse(localStorage.getItem(CHAVE) || '[]').filter(id => POR_ID[id])); } catch (e) {}
const salva = () => { try { localStorage.setItem(CHAVE, JSON.stringify([...feitos])); } catch (e) {} };
const aberta = l => l.requisitos.every(r => feitos.has(r));
const estado = l => feitos.has(l.id) ? 'feito' : !aberta(l) ? 'trancado' : l.publicada ? 'atual' : 'proxima';
const NOME_EST = {feito: 'concluída', atual: 'disponível', proxima: 'desbloqueada, em preparação', trancado: 'bloqueada'};
let focoGi = -1, modoArvore = false;

const chipReq = r => { const ok = feitos.has(r); return `<span class="req${ok ? ' ok' : ''}">${ok ? OK : CAD}${esc(POR_ID[r].titulo)}</span>`; };
function caminho(){
  let h = '';
  U.forEach((u, ui) => {
    const ls = u.licoes, nf = ls.filter(l => feitos.has(l.id)).length;
    const externos = [...new Set(ls.flatMap(l => l.requisitos).filter(r => POR_ID[r].ui !== ui))];
    const aberto = ls.some(l => estado(l) !== 'trancado');
    const status = nf === ls.length ? `${OK} Concluída` : aberto ? `${nf} de ${ls.length} feitas` : `${CAD} Bloqueada`;
    const pct = nf / ls.length, rr = 15, cc = 2 * Math.PI * rr;
    const aro = `<svg class="aro" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="${rr}" stroke="rgba(120,120,128,.16)"/><circle cx="18" cy="18" r="${rr}" stroke="${CORES[ui]}" stroke-dasharray="${cc}" stroke-dashoffset="${cc * (1 - pct)}" transform="rotate(-90 18 18)"/></svg>`;
    h += `<section class="galho${aberto ? '' : ' fechado'}" data-ui="${ui}" style="--cor:${CORES[ui]}"><div class="unidade">${aro}<div><span>Galho ${ui + 1} · ${esc(u.periodo)}</span><b>${esc(u.titulo)}</b></div><span class="estado-u">${status}</span></div>`;
    h += externos.length ? `<div class="req-galho"><span>Nasce de</span>${externos.map(chipReq).join('')}</div>` : `<div class="req-galho"><span>Começo de galho: não precisa de nada antes</span></div>`;
    const nivel = {};
    const lv = l => nivel[l.id] ?? (nivel[l.id] = Math.max(0, ...l.requisitos.filter(r => POR_ID[r].ui === ui).map(r => lv(POR_ID[r]) + 1)));
    ls.forEach(lv);
    const linhas = []; ls.forEach(l => (linhas[nivel[l.id]] ??= []).push(l));
    h += `<div class="arvore"><svg class="ramos" aria-hidden="true"></svg>${linhas.map(row => `<div class="linha-arv${row.length >= 4 ? ' larga' : row.length === 3 ? ' media' : ''}">${row.map(no).join('')}</div>`).join('')}</div></section>`;
  });
  $('#caminho').innerHTML = h;
  document.querySelectorAll('.nowrap').forEach(w => {
    const l = POR_ID[w.dataset.id], b = w.querySelector('.no');
    b.onclick = e => { e.stopPropagation(); foco(l.gi); abreCartao(b, l); };
    if (matchMedia('(hover:hover)').matches) w.addEventListener('mouseenter', () => foco(l.gi));
  });
  requestAnimationFrame(ramos);
}
function no(l){
  const est = estado(l);
  const anel = est === 'atual' ? anelSvg(st.secoesFeitas / L.secoes.length) : '';
  const ic = est === 'atual' ? IC.livro : est === 'feito' ? IC.feito : est === 'trancado' ? IC.cadeado : IC.breve;
  const balao = est === 'atual' ? `<span class="balao">${st.secoesFeitas ? 'Continuar' : 'Começar'}</span>` : '';
  return `<div class="nowrap" data-gi="${l.gi}" data-id="${l.id}">${balao}<button class="no ${est}" aria-label="${esc(l.titulo)}, ${NOME_EST[est]}, ${esc(l.lugar)}, ${anoTxt(l.ano)}">${anel}${ic}</button><span class="rotulo-no">${esc(l.titulo)}</span></div>`;
}
// ramos entre lições do mesmo galho: saem de baixo do rótulo e chegam no topo do nó
function ramos(){
  document.querySelectorAll('.galho').forEach(g => {
    const arv = g.querySelector('.arvore'), svg = arv.querySelector('.ramos'), R = arv.getBoundingClientRect();
    svg.setAttribute('width', R.width); svg.setAttribute('height', R.height);
    let p = '';
    g.querySelectorAll('.nowrap').forEach(w => {
      const l = POR_ID[w.dataset.id];
      l.requisitos.filter(r => POR_ID[r].ui === l.ui).forEach(r => {
        const a = g.querySelector(`.nowrap[data-id="${r}"]`).getBoundingClientRect(), b = w.querySelector('.no').getBoundingClientRect();
        const x1 = a.left + a.width / 2 - R.left, y1 = a.bottom - R.top + 6, x2 = b.left + b.width / 2 - R.left, y2 = b.top - R.top - 4, my = (y1 + y2) / 2;
        const cls = feitos.has(r) ? (feitos.has(l.id) ? 'feita' : 'aberta') : 'fechada';
        p += `<path class="${cls}" d="M${x1} ${y1}C${x1} ${my} ${x2} ${my} ${x2} ${y2}"/>`;
      });
    });
    svg.innerHTML = p;
  });
}
function anelSvg(f){
  const r = 52, c = 2 * Math.PI * r;
  return `<svg class="anel" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="${r}" stroke="rgba(0,122,255,.15)"/><circle id="anelP" cx="60" cy="60" r="${r}" stroke="#007AFF" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - f)}" transform="rotate(-90 60 60)" style="transition:stroke-dashoffset 900ms cubic-bezier(0.23,1,0.32,1)"/></svg>`;
}
function fechaCartao(){ const c = $('.cartao'); if (c) { c.parentElement.style.zIndex = ''; c.remove(); } document.body.classList.remove('com-folha'); }
function abreCartao(btn, l){
  const aberto = $('.cartao'), mesmo = aberto && aberto.parentElement === btn.parentElement; fechaCartao(); if (mesmo) return;
  const c = document.createElement('div'); c.className = 'cartao';
  const est = estado(l), s = st.secoesFeitas;
  const reqs = l.requisitos.length ? `<div class="reqs"><b>Requisitos</b>${l.requisitos.map(chipReq).join('')}</div>` : `<div class="reqs"><b>Sem requisitos: começa um galho.</b></div>`;
  let corpo;
  if (est === 'atual') corpo = `<p>Seção ${s + 1} de ${L.secoes.length} · ${esc(L.secoes[s].titulo)}</p><button class="b3 azul" id="comecar">${s ? 'Continuar' : 'Começar'} · gasta 1 energia</button><a class="b3 tinto link-c" href="prototipo-c.html">Testar como atividades (protótipo C)</a>`;
  else if (est === 'feito') corpo = `<p>${l.publicada ? 'Concluída. Revisar não gasta energia.' : 'Concluída na simulação.'}</p>${l.publicada ? '<button class="b3 azul" id="comecar">Revisar</button>' : ''}`;
  else if (est === 'proxima') corpo = `<p>Desbloqueada. O texto desta lição ainda está sendo escrito.</p><button class="b3" disabled>Em breve</button>`;
  else corpo = `<p>Para abrir, conclua ${l.requisitos.filter(r => !feitos.has(r)).length === 1 ? 'a lição marcada com cadeado' : 'as lições marcadas com cadeado'}.</p><button class="b3" disabled>Bloqueada</button>`;
  c.dataset.est = est;
  c.innerHTML = `<h3>${esc(l.titulo)}</h3><p class="onde">${esc(l.lugar)} · ${anoTxt(l.ano)}</p>${reqs}${corpo}`;
  const wrap = btn.parentElement; wrap.appendChild(c); wrap.style.zIndex = 40; if (celular()) { document.body.classList.add('com-folha'); c.insertAdjacentHTML('afterbegin', '<span class="alca" aria-hidden="true"></span>'); }
  c.style.left = '50%'; c.style.top = 'calc(100% + 14px)'; c.style.translate = '-50% 0';
  const r = c.getBoundingClientRect(), col = $('#caminho').getBoundingClientRect(), m = 8;
  const dx = r.left < col.left + m ? col.left + m - r.left : r.right > col.right - m ? col.right - m - r.right : 0;
  if (dx) { c.style.translate = `calc(-50% + ${dx}px) 0`; c.style.setProperty('--seta', `${-dx}px`); }
  const b = $('#comecar'); if (b) b.onclick = () => { fechaCartao(); if (est === 'atual') { st.en = Math.max(0, st.en - 1); $('#en').textContent = st.en; } abreLicao(); };
}
document.addEventListener('click', e => { const c = $('.cartao'); if (c && !c.contains(e.target)) fechaCartao(); if (!e.target.closest('#simMenu, #simBtn')) $('#simMenu').hidden = true; });

// ---------- progresso: aplicar, simular, celebrar ----------
const ate = n => TODAS.filter(l => l.ui < n).map(l => l.id);
const SIMULACOES = [
  ['Do zero', () => []],
  ['Galho 2 concluído', () => ate(2)],
  ['No meio do galho 3', () => [...ate(2), 'crise-2000', 'isin-larsa', 'mari']],
  ['Galho 4 concluído', () => ate(4)],
  ['Tudo concluído', () => ate(6)],
];
function aplicaProgresso(novos){
  const antes = new Set(TODAS.filter(l => estado(l) !== 'trancado').map(l => l.id));
  feitos = new Set(novos); salva();
  const abriu = TODAS.filter(l => !antes.has(l.id) && estado(l) !== 'trancado' && !feitos.has(l.id));
  caminho(); pintaPainel();
  const alvo = abriu[0] || TODAS.find(l => estado(l) === 'atual') || TODAS.find(l => estado(l) === 'proxima') || PUB;
  const w = document.querySelector(`.nowrap[data-id="${alvo.id}"]`);
  travaScroll = Date.now() + 900; w.scrollIntoView({behavior: reduzir ? 'auto' : 'smooth', block: 'center'});
  focoGi = -1; foco(alvo.gi);
  if (abriu.length && abriu.length < 20) {
    abriu.forEach(l => document.querySelector(`.nowrap[data-id="${l.id}"]`).classList.add('abriu'));
    aviso(abriu.length === 1 ? `Abriu: ${abriu[0].titulo}` : `Abriram ${abriu.length} lições: ${abriu.slice(0, 3).map(l => l.titulo).join(', ')}${abriu.length > 3 ? '…' : ''}`);
  }
}
function aviso(txt){
  const a = document.createElement('div'); a.className = 'aviso'; a.setAttribute('role', 'status'); a.innerHTML = `${IC.feito}<span>${esc(txt)}</span>`;
  document.body.appendChild(a); setTimeout(() => a.classList.add('sai'), 3200); setTimeout(() => a.remove(), 3600);
}
function menuSimular(){
  const m = $('#simMenu');
  m.innerHTML = `<b>Ver a árvore em outro momento</b>${SIMULACOES.map(([t], k) => `<button data-k="${k}">${t}</button>`).join('')}<small>Só neste protótipo. O progresso fica salvo neste navegador.</small>`;
  m.querySelectorAll('button').forEach(b => b.onclick = () => { m.hidden = true; aplicaProgresso(SIMULACOES[+b.dataset.k][1]()); });
  $('#simBtn').onclick = e => { e.stopPropagation(); m.hidden = !m.hidden; };
}

// ---------- painel do mapa em 3D: chão inclinado, arcos de requisito, pinos em pé ----------
// O mundo é um plano com o mapa desenhado; a câmera inclina (rotateX), gira (rotateZ) e aproxima (scale).
// Pinos, Viajante e etiquetas ficam "em pé" (desfazem a rotação da câmera) e mantêm o tamanho na tela.
const Q = 3; // o mapa é desenhado 3x maior para continuar nítido quando a câmera aproxima
let cam = {s: 1, cx: 0, cy: 0, T: 0, R: 0}, passoT = null, modo3d = true, giro = 0, inclina = null;
const proj0 = l => [(l.lon - M.lon0) * M.kx * Q, (M.lat1 - l.lat) * M.k * Q];
const AFASTA = {};
(() => { const grupos = {}; TODAS.forEach(l => (grupos[l.lon + ',' + l.lat] ??= []).push(l)); Object.values(grupos).forEach(g => g.forEach((l, k) => { AFASTA[l.id] = (k - (g.length - 1) / 2) * 26; })); })();
const proj = l => { const [x, y] = proj0(l); return [x + (AFASTA[l.id] || 0), y]; };
const ICP = {
  feito: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 12.5l4 4L18 8" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  atual: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 5.5h5.5a2 2 0 0 1 2 2V19a1.6 1.6 0 0 0-1.6-1.6H5zM19 5.5h-5.5a2 2 0 0 0-2 2V19a1.6 1.6 0 0 1 1.6-1.6H19z" fill="#fff"/></svg>',
  proxima: '<svg viewBox="0 0 24 24"><circle cx="6.5" cy="12" r="2" fill="#FF9500"/><circle cx="12" cy="12" r="2" fill="#FF9500"/><circle cx="17.5" cy="12" r="2" fill="#FF9500"/></svg>',
  trancado: '<svg viewBox="0 0 24 24" fill="none"><rect x="6" y="11" width="12" height="9" rx="2.4" fill="#8E8E93"/><path d="M9 11V8.5a3 3 0 0 1 6 0V11" stroke="#8E8E93" stroke-width="2.2"/></svg>',
};
function painel(){
  const el = $('#painel');
  let arcos = '';
  TODAS.forEach(l => l.requisitos.forEach(r => {
    const [x1, y1] = proj(POR_ID[r]), [x2, y2] = proj(l), dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy);
    if (d < 4) return;
    const h = Math.min(d * .32, 520), a = Math.atan2(dy, dx) * 180 / Math.PI;
    arcos += `<div class="arco" data-de="${r}" data-para="${l.id}" style="width:${d}px;height:${h + 20}px;left:${-d / 2}px;top:${-(h + 20)}px;transform:translate3d(${(x1 + x2) / 2}px,${(y1 + y2) / 2}px,0) rotateZ(${a}deg) rotateX(-90deg)"><svg viewBox="0 0 ${d} ${h + 20}" preserveAspectRatio="none"><path pathLength="100" d="M0 ${h + 20}Q${d / 2} ${20 - h} ${d} ${h + 20}"/></svg></div>`;
  }));
  el.innerHTML = `<div class="ceu" aria-hidden="true"></div>
    <div class="cena" aria-hidden="true"><div class="mundo3d" id="m3">
      <div class="mar-fundo"></div>
      <svg class="chao" width="${M.w * Q}" height="${M.h * Q}" viewBox="0 0 ${M.w} ${M.h}">${M.svg}</svg>
      ${arcos}
      ${TODAS.map(l => `<div class="sombra bb-chao" data-gi="${l.gi}"></div>`).join('')}
      ${TODAS.map(l => `<div class="pin3 bb" data-gi="${l.gi}"><div class="haste"></div><span class="cab"></span></div>`).join('')}
      <div class="vjb bb" id="vjb"><div class="corpo" id="vjCorpo"><span class="p">${VJ.parado}</span><span class="a">${VJ.andando}</span></div></div>
      <div class="etiqueta bb" id="etq"><span></span></div>
    </div></div>
    <div class="nevoa" aria-hidden="true"></div>
    <div class="alvos" id="alvos">${TODAS.map(l => `<button class="alvo" data-gi="${l.gi}"></button>`).join('')}</div>
    <span class="epoca" id="epoca" aria-live="polite"></span>
    <div class="controles"><div class="seg" role="group" aria-label="Visão do mapa"><button data-v="2" aria-pressed="false">2D</button><button data-v="3" aria-pressed="true">3D</button></div><button class="b-arvore" id="bArv" aria-pressed="false">${ICA}<span>Árvore</span></button></div>
    <div class="placa" id="placa"></div>
    <div class="regua" aria-hidden="true">${U.map((u, ui) => `<i style="--cor:${CORES[ui]}"></i>`).join('')}<span class="marca-t" id="marcaT"></span></div>`;
  // botões invisíveis por cima dos pinos: o toque funciona mesmo com o mapa em 3D
  el.querySelectorAll('.alvo').forEach(p => p.onclick = () => {
    const gi = +p.dataset.gi, w = document.querySelector(`.nowrap[data-gi="${gi}"]`);
    travaScroll = Date.now() + 900; foco(gi);
    w.scrollIntoView({behavior: reduzir ? 'auto' : 'smooth', block: 'center'});
    w.classList.remove('realce'); void w.offsetWidth; w.classList.add('realce');
  });
  $('#bArv').onclick = () => { modoArvore = !modoArvore; $('#bArv').setAttribute('aria-pressed', modoArvore); $('#bArv').classList.toggle('on', modoArvore); const g = focoGi; focoGi = -1; foco(g); };
  el.querySelectorAll('.seg button').forEach(b => b.onclick = () => {
    modo3d = b.dataset.v === '3'; giro = 0; inclina = null;
    el.querySelectorAll('.seg button').forEach(x => x.setAttribute('aria-pressed', x === b));
    el.classList.toggle('plano', !modo3d); const g = focoGi; focoGi = -1; foco(g);
  });
  // arrastar gira e inclina o mapa (só no 3D)
  let arr = null;
  el.addEventListener('pointerdown', e => { if (!modo3d || e.target.closest('button, .placa, .regua')) return; arr = {x: e.clientX, y: e.clientY, g: giro, t: inclina ?? cam.T}; el.setPointerCapture(e.pointerId); el.classList.add('arrastando'); });
  el.addEventListener('pointermove', e => { if (!arr) return; giro = arr.g + (e.clientX - arr.x) * .25; inclina = Math.max(20, Math.min(68, arr.t - (e.clientY - arr.y) * .2)); cam.R = giro - 8; cam.T = inclina; aplica(false); });
  const solta = () => { if (!arr) return; arr = null; el.classList.remove('arrastando'); };
  el.addEventListener('pointerup', solta); el.addEventListener('pointercancel', solta);
  pintaPainel();
}
const ICA = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="4.5" r="2.6" fill="currentColor"/><circle cx="5" cy="19.5" r="2.6" fill="currentColor"/><circle cx="19" cy="19.5" r="2.6" fill="currentColor"/><circle cx="12" cy="12" r="2.6" fill="currentColor"/><path d="M12 7v3M10.5 14l-4 3.5M13.5 14l4 3.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
function pintaPainel(){
  document.querySelectorAll('.pin3').forEach(p => { const l = TODAS[+p.dataset.gi], e = estado(l); p.classList.remove('feito', 'atual', 'proxima', 'trancado'); p.classList.add(e); p.querySelector('.cab').innerHTML = ICP[e]; });
  document.querySelectorAll('.alvo').forEach(p => { const l = TODAS[+p.dataset.gi]; p.setAttribute('aria-label', `${l.titulo} · ${l.lugar} · ${NOME_EST[estado(l)]}`); });
  document.querySelectorAll('.arco').forEach(a => { const de = feitos.has(a.dataset.de), para = feitos.has(a.dataset.para); a.classList.remove('feita', 'aberta', 'fechada'); a.classList.add(de ? (para ? 'feita' : 'aberta') : 'fechada'); });
}
function alvoCamera(l){
  const el = $('#painel'), cw = el.clientWidth, ch = el.clientHeight, base = cw / (M.w * Q);
  const enquadra = ls => {
    const ps = ls.map(proj), xs = ps.map(p => p[0]), ys = ps.map(p => p[1]), pad = 160;
    const bw = Math.max(...xs) - Math.min(...xs) + pad * 2, bh = Math.max(...ys) - Math.min(...ys) + pad * 2;
    return [Math.min(base * 4, cw / bw, ch / bh * (modo3d ? 1.25 : .85)), (Math.max(...xs) + Math.min(...xs)) / 2, (Math.max(...ys) + Math.min(...ys)) / 2];
  };
  let s, cx, cy;
  if (modoArvore) [s, cx, cy] = enquadra(TODAS);
  else if (celular()) [s, cx, cy] = enquadra(U[l.ui].licoes);
  else { s = base * (modo3d ? 2.6 : 2.2); [cx, cy] = proj(l); }
  return {s, cx, cy, T: modo3d ? (inclina ?? (celular() ? 40 : modoArvore ? 46 : 54)) : 0, R: modo3d ? giro - 8 : 0};
}
function aplica(anima){
  const el = $('#painel'), m3 = $('#m3');
  el.classList.toggle('sem-trans', !anima);
  const {s, cx, cy, T, R} = cam;
  m3.style.transform = `rotateX(${T}deg) rotateZ(${R}deg) scale3d(${s}, ${s}, ${s}) translate(${-cx}px, ${-cy}px)`;
  m3.style.setProperty('--k', 1 / s);
  const em = (x, y) => `translate3d(${x}px, ${y}px, 3px) rotateZ(${-R}deg) rotateX(${-T}deg) scale3d(${1 / s}, ${1 / s}, ${1 / s})`;
  el.querySelectorAll('.pin3').forEach(p => { const [x, y] = proj(TODAS[+p.dataset.gi]); p.style.transform = em(x, y); });
  el.querySelectorAll('.sombra').forEach(p => { const [x, y] = proj(TODAS[+p.dataset.gi]); p.style.transform = `translate3d(${x}px, ${y}px, 1px) scale3d(${1 / s}, ${1 / s}, ${1 / s})`; });
  const l = TODAS[focoGi], [x, y] = proj(l);
  $('#vjb').style.transform = em(x, y); $('#etq').style.transform = em(x, y);
  if (!anima) requestAnimationFrame(() => requestAnimationFrame(() => { el.classList.remove('sem-trans'); posAlvos(); }));
  else setTimeout(posAlvos, 1250);
}
// os botões de toque seguem a posição real dos pinos na tela
function posAlvos(){
  const r0 = $('#painel').getBoundingClientRect();
  document.querySelectorAll('.pin3').forEach(p => {
    const c = p.querySelector('.cab').getBoundingClientRect(), a = document.querySelector(`.alvo[data-gi="${p.dataset.gi}"]`);
    const vis = !p.classList.contains('longe') && c.width > 0;
    a.style.display = vis ? '' : 'none';
    a.style.transform = `translate(${c.left - r0.left + c.width / 2}px, ${c.top - r0.top + c.height / 2}px)`;
  });
}
function foco(gi, instantaneo){
  if (gi === focoGi && !instantaneo) return;
  const l = TODAS[gi], ant = TODAS[focoGi]; focoGi = gi;
  const el = $('#painel'); if (!$('#m3')) return;
  const ligar = !instantaneo && !reduzir;
  cam = alvoCamera(l);
  el.querySelectorAll('.pin3').forEach(p => { const x = TODAS[+p.dataset.gi]; p.classList.toggle('foco', x.gi === gi); p.classList.toggle('longe', !modoArvore && x.ui !== l.ui); });
  el.querySelectorAll('.sombra').forEach(p => p.classList.toggle('longe', !modoArvore && TODAS[+p.dataset.gi].ui !== l.ui));
  let k = 0;
  el.querySelectorAll('.arco').forEach(a => { const on = modoArvore || POR_ID[a.dataset.para].ui === l.ui; if (on && !a.classList.contains('on')) a.style.setProperty('--d', (k++ * 40) + 'ms'); a.classList.toggle('on', on); });
  aplica(ligar);
  const vj = $('#vjb');
  if (ant && ligar && (ant.lon !== l.lon || ant.lat !== l.lat)) {
    const [ax] = proj(ant), [bx] = proj(l);
    $('#vjCorpo').classList.toggle('esq', bx < ax);
    vj.classList.add('andando'); clearInterval(passoT);
    passoT = setInterval(() => vj.classList.toggle('passo'), 160);
    clearTimeout(vj._t); vj._t = setTimeout(() => { clearInterval(passoT); vj.classList.remove('andando', 'passo'); }, 1200);
  }
  const sp = $('#etq').firstChild; if (sp.textContent !== l.lugar) { sp.textContent = l.lugar; sp.classList.remove('troca'); if (ligar) { void sp.offsetWidth; sp.classList.add('troca'); } }
  const ep = $('#epoca'), a0 = ant ? ant.ano : l.ano;
  if (ligar && a0 !== l.ano) contaAno(ep, a0, l.ano, 1100); else ep.textContent = anoTxt(l.ano);
  const pl = $('#placa'), est = estado(l);
  if (modoArvore) {
    const nf = feitos.size, ab = TODAS.filter(x => estado(x) === 'atual' || estado(x) === 'proxima').length;
    pl.innerHTML = `<div class="rot">Árvore do curso</div><b>${nf} de ${TODAS.length} lições concluídas (${Math.round(nf / TODAS.length * 100)}%)</b><div class="sub">${ab} ${ab === 1 ? 'aberta' : 'abertas'} agora</div><div class="legenda-arv"><span><i class="feito"></i>Concluída</span><span><i class="atual"></i>Disponível</span><span><i class="proxima"></i>Em preparação</span><span><i class="trancado"></i>Bloqueada</span></div>`;
  } else pl.innerHTML = `<div class="rot">Galho ${l.ui + 1} · Lição ${l.li + 1}</div><b>${esc(l.titulo)}</b><div class="sub est-${est}">${NOME_EST[est][0].toUpperCase() + NOME_EST[est].slice(1)}</div>${l.requisitos.length ? `<div class="reqs-placa">${l.requisitos.map(chipReq).join('')}</div>` : ''}`;
  pl.classList.remove('troca'); if (ligar) { void pl.offsetWidth; pl.classList.add('troca'); }
  document.querySelectorAll('.regua i').forEach((r, k) => r.classList.toggle('ativa', k <= l.ui));
  const reg = $('.regua'), mt = $('#marcaT'), n = U[l.ui].licoes.length;
  mt.style.left = (5 + (reg.clientWidth - 10) * (l.ui + (l.li + .5) / n) / U.length) + 'px';
}
function contaAno(el, de, para, ms){
  const t0 = performance.now(); cancelAnimationFrame(el._f);
  const f = t => { const k = Math.min(1, (t - t0) / ms), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; el.textContent = anoTxt(Math.round((de + (para - de) * e) / 10) * 10); if (k < 1) el._f = requestAnimationFrame(f); else el.textContent = anoTxt(para); };
  el._f = requestAnimationFrame(f);
}
// o nó mais perto da linha de leitura comanda o mapa
let travaScroll = 0, rafS = 0;
function pelaRolagem(){
  if (Date.now() < travaScroll || $('#licao')) return;
  const linha = celular() ? 68 + 210 + (innerHeight - 278) * .35 : innerHeight * .45;
  let melhor = -1, dm = 1e9;
  document.querySelectorAll('.nowrap').forEach(w => { const r = w.getBoundingClientRect(), d = Math.abs(r.top + 40 - linha); if (d < dm - 2) { dm = d; melhor = +w.dataset.gi; } });
  if (melhor >= 0) foco(melhor);
}
addEventListener('scroll', () => { cancelAnimationFrame(rafS); rafS = requestAnimationFrame(() => { clearTimeout(pelaRolagem._t); pelaRolagem._t = setTimeout(pelaRolagem, 90); }); }, {passive: true});
addEventListener('resize', () => { clearTimeout(foco._r); foco._r = setTimeout(() => { ramos(); const g = focoGi; focoGi = -1; foco(g, true); }, 150); });
addEventListener('scroll', () => { clearTimeout(posAlvos._t); posAlvos._t = setTimeout(posAlvos, 120); }, {passive: true});

// ---------- lição ----------
let P = null;
function abreLicao(){
  const sec = L.secoes[st.secoesFeitas];
  P = {sec, passo: 0, fila: sec.perguntas.map(q => ({q, revisao: false})), escolha: null, verificado: false, acertos: 0, total: 0, ganho: 0, t0: Date.now()};
  P.totalPassos = 1 + P.fila.length;
  const el = document.createElement('div'); el.className = 'licao'; el.id = 'licao';
  el.innerHTML = `<div class="licao-topo"><button class="fechar" id="fechar" aria-label="Sair da lição"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="#8E8E93" stroke-width="2.6" stroke-linecap="round"/></svg></button><div class="barra" role="progressbar" aria-label="Progresso da seção" aria-valuemin="0" aria-valuemax="100"><i id="barra"></i></div><span class="chip"><svg width="16" height="18" viewBox="0 0 18 20" aria-hidden="true"><path d="M9 1l8 4.5v9L9 19l-8-4.5v-9z" fill="#34C759"/></svg><span>${st.en}</span></span></div>
    <div class="licao-corpo"><div class="palco" id="palco"></div><div class="licao-mapa" id="lmapa" aria-label="Mapa da seção"></div></div>
    <div class="licao-base" id="base"><div class="dentro" id="baseDentro"></div></div>`;
  document.body.appendChild(el); document.body.style.overflow = 'hidden';
  $('#fechar').onclick = fechaLicao;
  montaMapa(); passo();
}
function fechaLicao(){ $('#licao').remove(); document.body.style.overflow = ''; caminho(); const w = document.querySelector(`.nowrap[data-id="${PUB.id}"]`); if (w) w.scrollIntoView({block: 'center'}); }
function barra(){ const f = Math.min(1, P.passo / P.totalPassos); $('#barra').style.width = (f * 100) + '%'; $('#barra').parentElement.setAttribute('aria-valuenow', Math.round(f * 100)); }
function passo(){
  barra(); const palco = $('#palco'), base = $('#base'), bd = $('#baseDentro');
  base.className = 'licao-base'; P.escolha = null; P.verificado = false;
  if (P.passo === 0) {
    palco.innerHTML = `<div class="rot">${anoTxt(P.sec.ano)} · seção ${st.secoesFeitas + 1} de ${L.secoes.length}</div><h1>${esc(P.sec.titulo)}</h1>` + P.sec.paragrafos.map(p => `<p class="txt">${md(p)}</p>`).join('');
    bd.innerHTML = `<span style="font-weight:800;color:var(--suave)">Leia com calma. Depois vêm ${P.fila.length} perguntas.</span><button class="b3 ouro" id="acao">Continuar</button>`;
    $('#acao').onclick = () => { P.passo++; passo(); };
  } else if (P.fila.length) {
    const it = P.fila[0], q = it.q;
    palco.innerHTML = `<div class="rot">${it.revisao ? 'Revisão · ' : ''}Pergunta</div><h2>${esc(q.p)}</h2><div class="opcoes">${q.ops.map((o, k) => `<button class="op" data-k="${k}"><span class="letra">${'ABCD'[k]}</span>${esc(o)}</button>`).join('')}</div>`;
    bd.innerHTML = `<button class="b3 simples" id="pular">Pular</button><button class="b3 ouro" id="acao" disabled>Verificar</button>`;
    palco.querySelectorAll('.op').forEach(b => b.onclick = () => { if (P.verificado) return; palco.querySelectorAll('.op').forEach(x => x.classList.remove('escolhida')); b.classList.add('escolhida'); P.escolha = +b.dataset.k; $('#acao').disabled = false; });
    $('#acao').onclick = () => P.verificado ? proxima() : verifica();
    $('#pular').onclick = () => { P.escolha = -1; verifica(); };
  } else fim();
  palco.scrollTop = 0;
}
function verifica(){
  const it = P.fila[0], q = it.q, certo = P.escolha === q.ok; P.verificado = true;
  if (!it.revisao) { P.total++; if (certo) P.acertos++; }
  const g = certo ? (it.revisao ? 5 : 10) : 0;
  $('#palco').querySelectorAll('.op').forEach(b => { b.disabled = true; const k = +b.dataset.k; if (k === q.ok) b.classList.add('certa'); else if (k === P.escolha) b.classList.add('errada'); b.classList.remove('escolhida'); });
  const base = $('#base'); base.classList.add(certo ? 'certo' : 'errado');
  const selo = certo ? '<svg width="30" height="30" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M10 21l7 7 14-15" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/></svg>';
  $('#baseDentro').innerHTML = `<div class="retorno" role="status"><span class="selo" style="background:${certo ? 'var(--feito)' : 'var(--alerta)'}">${selo}</span><div><b>${certo ? frase() : 'Não foi essa.'}${g ? ` +${g} XP` : ''}</b><span>${esc(q.ex)}${!certo && !it.revisao ? ' Ela volta no fim, valendo 5 XP.' : ''}</span></div></div><button class="b3 ${certo ? 'verde' : 'vermelho'}" id="acao">Continuar</button>`;
  $('#acao').onclick = proxima; $('#acao').focus();
  if (g) { P.ganho += g; voaMoeda($('#acao'), g); }
  if (!certo && !it.revisao) P.fila.push({q, revisao: true});
}
const FRASES = ['Isso mesmo!', 'Mandou bem!', 'Certinho!', 'Exato!'];
const frase = () => FRASES[Math.floor(Math.random() * FRASES.length)];
function proxima(){ P.fila.shift(); P.passo++; if (P.passo > P.totalPassos) P.totalPassos = P.passo + P.fila.length; passo(); }
function voaMoeda(de, g){
  const a = de.getBoundingClientRect(), b = $('#chipXp').getBoundingClientRect();
  const m = document.createElement('div'); m.className = 'moeda-voa'; m.textContent = 'XP'; document.body.appendChild(m);
  const x0 = a.left + a.width / 2 - 14, y0 = a.top, x1 = b.left + 8, y1 = b.top + 6;
  const fimMoeda = () => { m.remove(); st.xp += g; const el = $('#xp'); conta(el, st.xp - g, st.xp, 400); const c = $('#chipXp'); c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); };
  if (reduzir) return fimMoeda();
  const anim = m.animate([
    {transform: `translate(${x0}px, ${y0}px) scale(.6)`, opacity: 0},
    {transform: `translate(${(x0 + x1) / 2}px, ${Math.min(y0, y1) - 120}px) scale(1.15)`, opacity: 1, offset: .45},
    {transform: `translate(${x1}px, ${y1}px) scale(.8)`, opacity: 1}
  ], {duration: 700, easing: 'cubic-bezier(0.77,0,0.175,1)'});
  anim.onfinish = fimMoeda;
}
function conta(el, de, para, ms){
  if (reduzir) { el.textContent = para; return; }
  const t0 = performance.now();
  const f = t => { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(de + (para - de) * e).toLocaleString('pt-BR'); if (k < 1) requestAnimationFrame(f); };
  requestAnimationFrame(f);
}
function fim(){
  P.passo = P.totalPassos; barra();
  const min = Math.max(1, Math.round((Date.now() - P.t0) / 60000));
  const pct = P.total ? Math.round(P.acertos / P.total * 100) : 0;
  const concluiu = st.secoesFeitas + 1 >= L.secoes.length;
  st.secoesFeitas = concluiu ? 0 : st.secoesFeitas + 1;
  $('#palco').innerHTML = `<div class="fim"><div class="vj" aria-hidden="true">${VJ.comemorando}</div><h1 class="titulo">Seção concluída!</h1>
    <div class="stats"><div class="stat" style="background:var(--ouro)"><span style="color:var(--tinta)">XP ganho</span><b id="sXp">0</b></div><div class="stat" style="background:var(--feito)"><span>De primeira</span><b>${P.acertos} de ${P.total}</b></div><div class="stat" style="background:var(--noite)"><span>Tempo</span><b>${min} min</b></div></div>
    <p style="font-size:17px;font-weight:700;color:var(--suave)">${pct}% das perguntas certas de primeira (${P.acertos} de ${P.total}).</p></div>`;
  conta($('#sXp'), 0, P.ganho, 900);
  $('#base').className = 'licao-base';
  $('#baseDentro').innerHTML = `<span style="font-weight:800;color:var(--suave)">${concluiu ? 'Lição concluída! Novos galhos vão se abrir.' : 'Próxima: ' + esc(L.secoes[st.secoesFeitas].titulo)}</span><button class="b3 ouro" id="acao">Continuar</button>`;
  $('#acao').onclick = () => { fechaLicao(); if (concluiu) return aplicaProgresso([...feitos, PUB.id]); requestAnimationFrame(() => { const p = $('#anelP'); if (p) { const c = 2 * Math.PI * 52; p.style.strokeDashoffset = c; requestAnimationFrame(() => requestAnimationFrame(() => { p.style.strokeDashoffset = c * (1 - st.secoesFeitas / L.secoes.length); })); } }); };
  confete();
}
function confete(){
  if (reduzir) return;
  const box = document.createElement('div'); box.className = 'confete'; document.body.appendChild(box);
  const cores = ['#007AFF', '#34C759', '#FF9500', '#FF2D55', '#AF52DE', '#FFCC00'];
  for (let i = 0; i < 46; i++) {
    const p = document.createElement('i'); p.style.left = (Math.random() * 100) + 'vw'; p.style.background = cores[i % cores.length]; box.appendChild(p);
    const dx = (Math.random() - .5) * 160, rot = (Math.random() - .5) * 720;
    p.animate([{transform: 'translate(0,0) rotate(0deg)'}, {transform: `translate(${dx}px, ${innerHeight + 60}px) rotate(${rot}deg)`}], {duration: 1400 + Math.random() * 1000, delay: Math.random() * 300, easing: 'cubic-bezier(0.23,1,0.32,1)', fill: 'forwards'});
  }
  setTimeout(() => box.remove(), 3000);
}
const anoTxt = a => a == null ? '' : a < 0 ? `${Math.abs(a)} a.C.` : `${a} d.C.`;

// ---------- mapa da lição ----------
function montaMapa(){
  const el = $('#lmapa');
  el.innerHTML = `<svg class="campo" aria-hidden="true"><g id="cam">${M.svg}<g>${M.cidades.map(c => `<g class="cid" data-n="${esc(c.n)}"><circle cx="${c.x}" cy="${c.y}" r="4"/><text x="${c.x + 8}" y="${c.y + 5}" font-size="14">${esc(c.n)}</text></g>`).join('')}</g></g></svg><span class="epoca">${anoTxt(P.sec.ano)}</span>`;
  const cw = el.clientWidth, ch = el.clientHeight, svg = el.querySelector('svg');
  svg.setAttribute('viewBox', `0 0 ${cw} ${ch}`);
  const f = (P.sec.foco || [[45.64, 31.32]]).slice(-1)[0], px = (f[0] - M.lon0) * M.kx, py = (M.lat1 - f[1]) * M.k;
  const base = Math.max(cw / M.w, ch / M.h), s = base * 2.6;
  const cl = (tx, ty, s) => [Math.min(0, Math.max(cw - M.w * s, tx)), Math.min(0, Math.max(ch - M.h * s, ty))];
  const g = el.querySelector('#cam');
  const [ax, ay] = cl(cw / 2 - M.w * base / 2, ch / 2 - M.h * base / 2, base);
  g.style.transition = 'none'; g.style.transform = `translate(${ax}px, ${ay}px) scale(${base})`;
  const [tx, ty] = cl(cw / 2 - px * s, ch / 2 - py * s, s);
  requestAnimationFrame(() => requestAnimationFrame(() => { g.style.transition = ''; g.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`; }));
  el.querySelectorAll('.cid text').forEach(t => { const c = t.previousElementSibling; t.style.fontSize = (14 / s) + 'px'; t.setAttribute('x', +c.getAttribute('cx') + 8 / s); t.setAttribute('y', +c.getAttribute('cy') + 5 / s); t.style.strokeWidth = (3 / s) + 'px'; });
  el.querySelectorAll('.cid circle').forEach(c => c.setAttribute('r', 4 / s));
  let perto = null, dm = 18 / s; M.cidades.forEach(c => { const d = Math.hypot(c.x - px, c.y - py); if (d < dm) { dm = d; perto = c; } });
  if (perto) el.querySelector(`.cid[data-n="${perto.n}"]`).style.display = 'none';
  const sx = px * s + tx, sy = py * s + ty;
  const vj = document.createElement('div'); vj.className = 'vj-mapa'; vj.innerHTML = VJ.parado; vj.style.left = sx + 'px'; vj.style.top = sy + 'px'; el.appendChild(vj);
  if (perto) { const lb = document.createElement('span'); lb.className = 'lugar'; lb.textContent = perto.n; lb.style.left = (sx + 40) + 'px'; lb.style.top = (sy - 40) + 'px'; el.appendChild(lb); }
}

$('#xp').textContent = st.xp; $('#en').textContent = st.en;
caminho(); painel(); menuSimular();
const inicio = TODAS.find(l => estado(l) === 'atual') || TODAS.find(l => estado(l) === 'proxima') || PUB;
document.querySelector(`.nowrap[data-id="${inicio.id}"]`).scrollIntoView({block: 'center'});
foco(inicio.gi, true);
})();
