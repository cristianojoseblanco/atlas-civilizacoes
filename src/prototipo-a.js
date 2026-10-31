(() => {
const $ = s => document.querySelector(s);
const esc = x => String(x ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const md = x => esc(x).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches;
const L = DADOS.licao, M = DADOS.mapa, VJ = DADOS.vj;
const st = {xp: 0, en: 5, secoesFeitas: 0, seq: 3};

// ---------- ícones ----------
const IC = {
  livro: '<svg class="ic" viewBox="0 0 40 40" fill="none" aria-hidden="true"><rect x="9" y="7" width="22" height="27" rx="4" fill="#E9C99A" stroke="#0F1A22" stroke-width="3"/><path d="M14 14l4 2.5M21 14l4 2.5M14 21l4 2.5M21 21l4 2.5M14 28h10" stroke="#0F1A22" stroke-width="2.6" stroke-linecap="round"/></svg>',
  feito: '<svg class="ic" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M10 21l7 7 14-15" stroke="#FFF6E3" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  cadeado: '<svg class="ic" viewBox="0 0 40 40" fill="none" aria-hidden="true"><rect x="10" y="18" width="20" height="15" rx="4" fill="#B4AA93" stroke="#8A8170" stroke-width="2.6"/><path d="M14 18v-4a6 6 0 0 1 12 0v4" stroke="#8A8170" stroke-width="2.6"/></svg>',
  breve: '<svg class="ic" viewBox="0 0 40 40" fill="none" aria-hidden="true"><circle cx="12" cy="20" r="2.6" fill="#8A8170"/><circle cx="20" cy="20" r="2.6" fill="#8A8170"/><circle cx="28" cy="20" r="2.6" fill="#8A8170"/></svg>',
};

// ---------- caminho ----------
const OFF = [0, 64, 96, 64, 0, -64, -96, -64];
function caminho(){
  const fundo = $('#fundoMapa'); fundo.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(DADOS.mapaFundo)}")`;
  const u1 = DADOS.unidades[0], u2 = DADOS.unidades[1];
  let h = `<section><div class="unidade u1"><div><span>Unidade 1 · ${esc(u1.periodo)}</span><b>${esc(u1.titulo)}</b></div></div><div class="trilha">`;
  u1.licoes.forEach((l, i) => { h += no(l, 'breve', i); });
  h += `</div></section><section><div class="unidade u2"><div><span>Unidade 2 · ${esc(u2.periodo)}</span><b>${esc(u2.titulo)}</b></div><button class="guia" id="guia">Guia</button></div><div class="trilha">`;
  u2.licoes.forEach((l, i) => { h += no(l, i === 0 ? 'atual' : 'trancado', i + 3); });
  h += '</div></section>';
  $('#caminho').innerHTML = h;
  const atual = $('.no.atual');
  // o Viajante fica ao lado do nó atual
  const vj = document.createElement('div'); vj.className = 'vj-caminho'; vj.innerHTML = VJ.parado; vj.setAttribute('aria-hidden', 'true');
  atual.parentElement.appendChild(vj);
  const lado = parseFloat(atual.parentElement.style.transform.replace(/[^-\d.]/g, '')) || 0;
  vj.style.left = lado >= 0 ? '-128px' : '112px'; vj.style.top = '-30px';
  atual.onclick = e => { e.stopPropagation(); abreCartao(atual); };
  document.addEventListener('click', e => { const c = $('.cartao'); if (c && !c.contains(e.target)) { c.parentElement.style.zIndex = ''; c.remove(); } });
  $('#guia').onclick = () => alert('No app: um resumo da unidade com mapa e palavras-chave.');
}
function no(l, estado, i){
  const anel = estado === 'atual' ? anelSvg(st.secoesFeitas / L.secoes.length) : '';
  const ic = estado === 'atual' ? IC.livro : estado === 'feito' ? IC.feito : estado === 'trancado' ? IC.cadeado : IC.breve;
  const balao = estado === 'atual' ? `<span class="balao">${st.secoesFeitas ? 'Continuar' : 'Começar'}</span>` : '';
  const rotulo = `<span class="rotulo-no">${esc(l.titulo)}</span>`;
  return `<div style="position:relative;transform:translateX(${OFF[i % OFF.length]}px);margin-bottom:34px">${balao}<button class="no ${estado}"${estado === 'atual' ? '' : ' disabled'} aria-label="${esc(l.titulo)}${estado === 'trancado' ? ', trancada' : estado === 'breve' ? ', em preparação' : ''}">${anel}${ic}</button>${rotulo}</div>`;
}
function anelSvg(f){
  const r = 52, c = 2 * Math.PI * r;
  return `<svg class="anel" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="${r}" stroke="#2A3C4A"/><circle id="anelP" cx="60" cy="60" r="${r}" stroke="#2A9D8F" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - f)}" transform="rotate(-90 60 60)" style="transition:stroke-dashoffset 900ms cubic-bezier(0.23,1,0.32,1)"/></svg>`;
}
function abreCartao(btn){
  const c0 = $('.cartao'); if (c0) { c0.remove(); return; }
  const c = document.createElement('div'); c.className = 'cartao';
  const s = st.secoesFeitas;
  c.innerHTML = `<h3>${esc(L.titulo)}</h3><p>Seção ${s + 1} de ${L.secoes.length} · ${esc(L.secoes[s].titulo)}</p><button class="b3 ouro" style="background:var(--papel)" id="comecar">${s ? 'Continuar' : 'Começar'} · gasta 1 energia</button>`;
  const wrap = btn.parentElement; wrap.appendChild(c); wrap.style.zIndex = 40;
  c.style.left = '50%'; c.style.top = 'calc(100% + 18px)'; c.style.translate = '-50% 0';
  $('#comecar').onclick = () => { c.remove(); st.en = Math.max(0, st.en - 1); $('#en').textContent = st.en; abreLicao(); };
}

// ---------- lição ----------
let P = null;
function abreLicao(){
  const sec = L.secoes[st.secoesFeitas];
  P = {sec, passo: 0, fila: sec.perguntas.map(q => ({q, revisao: false})), escolha: null, verificado: false, acertos: 0, total: 0, ganho: 0, t0: Date.now()};
  P.totalPassos = 1 + P.fila.length;
  const el = document.createElement('div'); el.className = 'licao'; el.id = 'licao';
  el.innerHTML = `<div class="licao-topo"><button class="fechar" id="fechar" aria-label="Sair da lição"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="#5D5647" stroke-width="3" stroke-linecap="round"/></svg></button><div class="barra" role="progressbar" aria-label="Progresso da seção" aria-valuemin="0" aria-valuemax="100"><i id="barra"></i></div><span class="chip" style="background:var(--noite)"><svg width="18" height="20" viewBox="0 0 18 20" aria-hidden="true"><path d="M9 1l8 4.5v9L9 19l-8-4.5v-9z" fill="#2A9D8F" stroke="#FFF6E3" stroke-width="1.6"/></svg><span style="color:#FFF6E3">${st.en}</span></span></div>
    <div class="licao-corpo"><div class="palco" id="palco"></div><div class="licao-mapa" id="lmapa" aria-label="Mapa da seção"></div></div>
    <div class="licao-base" id="base"><div class="dentro" id="baseDentro"></div></div>`;
  document.body.appendChild(el); document.body.style.overflow = 'hidden';
  $('#fechar').onclick = fechaLicao;
  montaMapa(); passo();
}
function fechaLicao(){ $('#licao').remove(); document.body.style.overflow = ''; caminho(); }
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
    bd.innerHTML = `<button class="b3" style="background:transparent;box-shadow:none;border-color:#CFC6B0;color:var(--suave)" id="pular">Pular</button><button class="b3 ouro" id="acao" disabled>Verificar</button>`;
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
  st.secoesFeitas = Math.min(L.secoes.length - 1, st.secoesFeitas + 1);
  $('#palco').innerHTML = `<div class="fim"><div class="vj" aria-hidden="true">${VJ.comemorando}</div><h1 class="titulo">Seção concluída!</h1>
    <div class="stats"><div class="stat" style="background:var(--ouro)"><span style="color:var(--tinta)">XP ganho</span><b id="sXp">0</b></div><div class="stat" style="background:var(--feito)"><span>De primeira</span><b>${P.acertos} de ${P.total}</b></div><div class="stat" style="background:var(--noite)"><span>Tempo</span><b>${min} min</b></div></div>
    <p style="font-size:17px;font-weight:700;color:var(--suave)">${pct}% das perguntas certas de primeira (${P.acertos} de ${P.total}).</p></div>`;
  conta($('#sXp'), 0, P.ganho, 900);
  $('#base').className = 'licao-base';
  $('#baseDentro').innerHTML = `<span style="font-weight:800;color:var(--suave)">Próxima: ${esc(L.secoes[st.secoesFeitas].titulo)}</span><button class="b3 ouro" id="acao">Continuar</button>`;
  $('#acao').onclick = () => { fechaLicao(); requestAnimationFrame(() => { const p = $('#anelP'); if (p) { const c = 2 * Math.PI * 52; p.style.strokeDashoffset = c; requestAnimationFrame(() => requestAnimationFrame(() => { p.style.strokeDashoffset = c * (1 - st.secoesFeitas / L.secoes.length); })); } }); };
  confete();
}
function confete(){
  if (reduzir) return;
  const box = document.createElement('div'); box.className = 'confete'; document.body.appendChild(box);
  const cores = ['#F2B33D', '#2A9D8F', '#E5644A', '#FFF6E3', '#8E6BBF'];
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
caminho();
})();
