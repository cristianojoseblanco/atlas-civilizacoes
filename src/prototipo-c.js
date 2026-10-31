(() => {
// Protótipo C: aprender mexendo (referência: Brilliant).
// Cada tela tem um contexto curto, uma pergunta e uma peça para manipular. O conteúdo vem da lição 2.1 (A revolução urbana).
const $ = s => document.querySelector(s);
const esc = x => String(x ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const md = x => esc(x).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches;
const M = DADOS.mapa, VJ = DADOS.vj, URUK = DADOS.uruk;
const st = {xp: 0, xpVisto: 0, i: 0, acertosDePrimeira: 0, t0: Date.now()};
const fmt = n => n.toLocaleString('pt-BR');

// ---------- telas ----------
const TELAS = [
  {
    rot: 'Uma virada em poucos séculos',
    ctx: 'Por volta de **3500 a.C.**, uma povoação cresceu até virar a primeira cidade de verdade, com templos, oficinas, armazéns e milhares de pessoas que não plantavam a própria comida. O nome dela era **Uruk**.',
    perg: 'Arraste o marcador até onde você acha que Uruk ficava.',
    monta: mapaArrastar,
  },
  {
    rot: 'Quem planta e quem não planta',
    ctx: 'A cidade separou dois tipos de gente: os **produtores de comida**, nas aldeias, e os **especialistas**, na cidade: oleiros, tecelões, escribas, sacerdotes.',
    perg: 'De cada 5 pessoas, quantas você acha que ainda produziam comida no campo?',
    monta: pessoas,
  },
  {
    rot: 'Cidade ou aldeia?',
    ctx: 'O centro da cidade eram as **grandes organizações**: o templo e, mais tarde, o palácio. As famílias das aldeias eram donas das suas terras e entregavam parte da colheita.',
    perg: 'Toque numa carta e depois no lugar a que ela pertence.',
    monta: separar,
  },
  {
    rot: 'Uma cidade que aprendeu a contar',
    ctx: 'Para pagar rações a milhares de pessoas, a administração precisou de medidas fixas. Ela contava em **base 60**, e 60 tem uma vantagem: se reparte em muitos grupos iguais.',
    perg: 'Toque em todos os números que dividem 60 grãos em grupos iguais, sem sobrar nenhum.',
    monta: graos,
  },
  {
    rot: 'Do selo ao tablete',
    ctx: 'A escrita não apareceu de uma vez. Ela saiu, passo a passo, das ferramentas que os funcionários já usavam para guardar e controlar bens.',
    perg: 'Toque nas etapas na ordem em que aconteceram.',
    monta: ordem,
  },
  {
    rot: 'O passo decisivo',
    ctx: 'No começo, cada sinal era um desenho de uma coisa. Mas como escrever algo que não dá para desenhar, como "vida"?',
    perg: 'Em sumério, "flecha" soava parecido com "vida". Que sinal um escriba usaria para escrever "vida"?',
    monta: rebus,
  },
];

// ---------- moldura ----------
let T = null; // tela atual: {pronto, verifica, revela}
function segs(){
  $('#segs').innerHTML = TELAS.map((_, k) => `<i class="${k < st.i ? 'feito' : k === st.i ? 'atual' : ''}"></i>`).join('');
  $('#segs').setAttribute('aria-valuenow', Math.round(st.i / TELAS.length * 100));
}
function mostra(){
  segs();
  if (st.i >= TELAS.length) return fim();
  const t = TELAS[st.i];
  $('#palco').innerHTML = `<div class="c-rot">${esc(t.rot)} · ${st.i + 1} de ${TELAS.length}</div><p class="c-contexto">${md(t.ctx)}</p><h1 class="c-pergunta">${esc(t.perg)}</h1><div class="tela" id="tela"></div>`;
  T = {tentativas: 0};
  Object.assign(T, t.monta($('#tela')));
  base('verificar');
  scrollTo({top: 0, behavior: reduzir ? 'auto' : 'smooth'});
}
function atualiza(){ const b = $('#acao'); if (b && b.dataset.modo === 'verificar') b.disabled = !T.pronto(); }
function base(modo, r){
  const el = $('#base'), bd = $('#baseDentro');
  el.className = 'licao-base' + (modo === 'certo' ? ' certo' : modo === 'errado' ? ' errado' : '');
  if (modo === 'verificar') {
    bd.innerHTML = `<button class="b3 ouro" id="acao" data-modo="verificar" disabled style="margin-left:auto">Verificar</button>`;
    $('#acao').onclick = verifica; atualiza(); return;
  }
  const selo = modo === 'certo' ? '<svg width="30" height="30" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M10 21l7 7 14-15" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/></svg>';
  const acoes = modo === 'errado'
    ? `<button class="b3" id="ver" style="background:var(--carta)">Ver resposta</button><button class="b3 vermelho" id="denovo">Tentar de novo</button>`
    : `<button class="b3 ${modo === 'certo' ? 'verde' : 'ouro'}" id="acao" data-modo="seguir">Continuar</button>`;
  bd.innerHTML = `<div class="retorno" role="status"><span class="selo" style="background:${modo === 'certo' ? 'var(--feito)' : modo === 'errado' ? 'var(--alerta)' : 'var(--noite)'}">${modo === 'revelado' ? '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8" stroke="#fff" stroke-width="3"/><path d="M12 8v5M12 16v.5" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>' : selo}</span><div><b>${esc(r.titulo)}</b><span>${md(r.msg)}</span></div></div><div class="acoes">${acoes}</div>`;
  if (modo === 'errado') {
    $('#denovo').onclick = () => { T.limpa && T.limpa(); base('verificar'); };
    $('#ver').onclick = () => { const rr = T.revela(); base('revelado', rr); requestAnimationFrame(() => { const t = $('#tela').getBoundingClientRect(), b = $('#base').getBoundingClientRect(); if (t.bottom > b.top - 12) scrollBy({top: Math.min(t.bottom - b.top + 16, t.top - 80)}); }); };
    $('#denovo').focus();
  } else { $('#acao').onclick = () => { st.i++; mostra(); }; $('#acao').focus(); }
}
const FRASES = ['Isso mesmo!', 'Mandou bem!', 'Exato!', 'Certinho!'];
function verifica(){
  const r = T.verifica(); T.tentativas++;
  requestAnimationFrame(() => { const t = $('#tela').getBoundingClientRect(), b = $('#base').getBoundingClientRect(); if (t.bottom > b.top - 12) scrollBy({top: Math.min(t.bottom - b.top + 16, t.top - 80), behavior: reduzir ? 'auto' : 'smooth'}); });
  if (r.certo) {
    const g = T.tentativas === 1 ? 10 : 5; if (T.tentativas === 1) st.acertosDePrimeira++;
    base('certo', {titulo: (r.titulo || FRASES[st.i % FRASES.length]) + ` +${g} XP`, msg: r.msg});
    voaMoeda($('#acao'), g);
  } else base('errado', {titulo: r.titulo || 'Ainda não.', msg: r.msg});
}

// ---------- 1. mapa: arrastar Uruk ----------
function mapaArrastar(el){
  const vb = {x: 370, y: 190, w: 270, h: 230};
  el.innerHTML = `<div class="mapa-c" id="mc"><svg viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${M.svg}</svg>
    <span class="rot-rio" style="left:24%;top:34%">EUFRATES</span><span class="rot-rio" style="left:52%;top:26%">TIGRE</span>
    <button class="alfinete solto" id="alf" aria-label="Marcador de Uruk. Use as setas para mover."><span class="cab"></span><span class="nome">Uruk</span></button>
    <span class="dica-mapa" id="dica">Arraste ou toque no mapa</span></div>`;
  const mc = el.querySelector('#mc'), alf = el.querySelector('#alf');
  let pos = null, travado = false;
  const poe = (x, y) => {
    const r = mc.getBoundingClientRect();
    x = Math.max(8, Math.min(r.width - 8, x)); y = Math.max(8, Math.min(r.height - 8, y));
    pos = {x, y}; alf.classList.remove('solto'); alf.style.transform = `translate(${x}px, ${y}px)`;
    $('#dica').style.opacity = 0; atualiza();
  };
  const local = e => { const r = mc.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  let arrasta = false;
  alf.addEventListener('pointerdown', e => { if (travado) return; e.preventDefault(); e.stopPropagation(); arrasta = true; alf.setPointerCapture(e.pointerId); alf.classList.add('pega'); });
  alf.addEventListener('pointermove', e => { if (arrasta) poe(...local(e)); });
  alf.addEventListener('pointerup', () => { arrasta = false; alf.classList.remove('pega'); });
  mc.addEventListener('pointerdown', e => { if (travado || e.target.closest('.alfinete')) return; poe(...local(e)); });
  alf.addEventListener('keydown', e => {
    if (travado) return; const d = {ArrowLeft: [-8, 0], ArrowRight: [8, 0], ArrowUp: [0, -8], ArrowDown: [0, 8]}[e.key]; if (!d) return;
    e.preventDefault(); const r = mc.getBoundingClientRect(); const p = pos || {x: r.width / 2, y: r.height / 2}; poe(p.x + d[0], p.y + d[1]);
  });
  // tela -> lon/lat (o SVG usa "slice": escala pelo lado que cobre)
  const escala = () => { const r = mc.getBoundingClientRect(); const s = Math.max(r.width / vb.w, r.height / vb.h); return {s, ox: (r.width - vb.w * s) / 2, oy: (r.height - vb.h * s) / 2}; };
  const paraGeo = p => { const {s, ox, oy} = escala(); const x = vb.x + (p.x - ox) / s, y = vb.y + (p.y - oy) / s; return [x / M.kx + M.lon0, M.lat1 - y / M.k]; };
  const paraTela = (lon, lat) => { const {s, ox, oy} = escala(); return [((lon - M.lon0) * M.kx - vb.x) * s + ox, ((M.lat1 - lat) * M.k - vb.y) * s + oy]; };
  const km = (a, b) => { const R = 6371, r = Math.PI / 180, dl = (b[1] - a[1]) * r, dn = (b[0] - a[0]) * r; const h = Math.sin(dl / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
  const mostraVerdade = () => {
    const [vx, vy] = paraTela(URUK.lon, URUK.lat);
    mc.insertAdjacentHTML('beforeend', `<svg class="linha" aria-hidden="true"><line x1="${pos.x}" y1="${pos.y}" x2="${vx}" y2="${vy}"/></svg><span class="verdade" style="left:${vx}px;top:${vy}px"><b>Uruk</b></span>`);
  };
  return {
    pronto: () => !!pos,
    verifica(){
      const d = Math.round(km(paraGeo(pos), [URUK.lon, URUK.lat]) / 10) * 10;
      if (d <= 120) { travado = true; mostraVerdade(); return {certo: true, titulo: d <= 40 ? 'Na mosca!' : 'Bem perto!', msg: `Seu palpite ficou a cerca de ${fmt(d)} km. Uruk ficava no **sul da Mesopotâmia**, junto ao Eufrates, perto de onde os dois rios se aproximam do Golfo.`}; }
      return {certo: false, msg: `Seu palpite ficou a cerca de ${fmt(d)} km. Dica: procure no **sul**, entre os dois rios, mais perto do Golfo.`};
    },
    revela(){ travado = true; mostraVerdade(); return {titulo: 'Aqui ficava Uruk.', msg: 'No **sul da Mesopotâmia**, junto ao Eufrates, perto de onde os dois rios se aproximam do Golfo.'}; },
    limpa(){},
  };
}

// ---------- 2. pessoas: 4 em cada 5 ----------
const BONECO = '<svg viewBox="0 0 40 64" aria-hidden="true"><circle cx="20" cy="13" r="10" fill="#D9A27C" stroke="#0F1A22" stroke-width="3"/><path class="roupa" d="M6 58V36q0-12 14-12t14 12v22z" fill="#E9DCC2" stroke="#0F1A22" stroke-width="3" stroke-linejoin="round"/></svg>';
function pessoas(el){
  el.innerHTML = `<div class="pessoas" id="ps">${Array.from({length: 5}, () => `<div class="pessoa">${BONECO}</div>`).join('')}</div>
    <div class="legenda"><span><i style="background:var(--ouro)"></i>Produz comida</span><span><i style="background:var(--feito)"></i>Especialista</span></div>
    <div class="regulador"><input type="range" min="0" max="5" step="1" value="0" id="rg" aria-label="Quantas de 5 pessoas produziam comida"><output id="rgo">Mexa no controle</output></div>`;
  let mexeu = false, v = 0;
  const pinta = () => {
    el.querySelectorAll('.pessoa').forEach((p, k) => { p.classList.toggle('campo', mexeu && k < v); p.classList.toggle('cidade', mexeu && k >= v); });
    if (mexeu) $('#rgo').textContent = `${v} de 5 no campo (${v * 20}%)`;
  };
  $('#rg').addEventListener('input', e => { v = +e.target.value; mexeu = true; pinta(); atualiza(); });
  return {
    pronto: () => mexeu,
    verifica(){
      if (v === 4) { $('#rg').disabled = true; return {certo: true, msg: 'Talvez **4 em cada 5 (80%)** continuassem no campo. Os especialistas eram minoria, concentrada na cidade, e viviam da comida que subia das aldeias.'}; }
      return {certo: false, msg: v > 4 ? 'Se todos plantassem, não haveria quem trabalhasse nas oficinas e no templo.' : 'A cidade ainda dependia muito do campo. A maioria seguia produzindo comida.'};
    },
    revela(){ v = 4; $('#rg').value = 4; $('#rg').disabled = true; pinta(); return {titulo: 'Talvez 4 em cada 5 (80%).', msg: 'A grande maioria seguia no campo. Os especialistas eram minoria, concentrada na cidade.'}; },
  };
}

// ---------- 3. separar: cidade ou aldeia ----------
function separar(el){
  const CARTAS = [
    {t: 'Templo com armazéns e oficinas', c: 'cidade'},
    {t: 'Escola de escribas', c: 'cidade'},
    {t: 'Muralha para proteger o que foi acumulado', c: 'cidade'},
    {t: 'Família dona da própria terra e dos animais', c: 'aldeia'},
    {t: 'Parte da colheita entregue como tributo', c: 'aldeia'},
    {t: 'Trabalho obrigatório em canais (corveia)', c: 'aldeia'},
  ];
  const ordem = [3, 0, 5, 1, 4, 2];
  const onde = CARTAS.map(() => 'bandeja'); let sel = -1;
  const ICC = '<svg viewBox="0 0 28 28" aria-hidden="true"><path d="M3 25V12l5-3v-4h4v4l3 2 3-2V5h4v4l3 3v13z" fill="#F2B33D" stroke="#0F1A22" stroke-width="2.4" stroke-linejoin="round"/></svg>';
  const ICA = '<svg viewBox="0 0 28 28" aria-hidden="true"><path d="M4 25V14l6-6 6 6v11z" fill="#E9C99A" stroke="#0F1A22" stroke-width="2.4" stroke-linejoin="round"/><path d="M18 25v-6m3 6v-9m3 9v-5" stroke="#2A9D8F" stroke-width="2.6" stroke-linecap="round"/></svg>';
  const carta = k => `<button class="cartinha${sel === k ? ' sel' : ''}" data-k="${k}" aria-pressed="${sel === k}">${esc(CARTAS[k].t)}</button>`;
  const desenha = () => {
    el.innerHTML = `<div class="bandeja" aria-label="Cartas para separar">${ordem.filter(k => onde[k] === 'bandeja').map(carta).join('') || '<span style="font-weight:800;color:var(--suave);align-self:center">Tudo separado. Confira e verifique.</span>'}</div>
      <div class="potes">${['cidade', 'aldeia'].map(p => `<div class="pote${sel >= 0 ? ' alvo' : ''}" data-p="${p}" role="button" tabindex="0" aria-label="Pôr em ${p}"><h3>${p === 'cidade' ? ICC + 'Cidade' : ICA + 'Aldeia'}</h3>${ordem.filter(k => onde[k] === p).map(carta).join('')}</div>`).join('')}</div>`;
    el.querySelectorAll('.cartinha').forEach(b => b.onclick = e => {
      e.stopPropagation(); if (T.travado) return; const k = +b.dataset.k;
      if (onde[k] !== 'bandeja') { if (sel >= 0) onde[sel] = onde[k]; else onde[k] = 'bandeja'; sel = -1; } else sel = sel === k ? -1 : k;
      desenha(); atualiza();
    });
    el.querySelectorAll('.pote').forEach(b => {
      const poe = () => { if (sel < 0 || T.travado) return; onde[sel] = b.dataset.p; sel = -1; desenha(); atualiza(); };
      b.onclick = poe; b.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); poe(); } };
    });
  };
  desenha();
  const marca = () => el.querySelectorAll('.pote .cartinha').forEach(b => { const k = +b.dataset.k; b.classList.add(onde[k] === CARTAS[k].c ? 'certa' : 'errada'); });
  return {
    pronto: () => onde.every(o => o !== 'bandeja'),
    verifica(){
      const erros = CARTAS.filter((c, k) => onde[k] !== c.c).length; marca();
      if (!erros) { T.travado = true; return {certo: true, msg: 'Na cidade ficavam as **grandes organizações** e quem trabalhava para elas. Nas aldeias, famílias com terra própria, que entregavam parte da colheita e prestavam trabalho.'}; }
      return {certo: false, titulo: `${erros === 1 ? '1 carta está' : erros + ' cartas estão'} no lugar errado.`, msg: 'Pense em quem **produz** e entrega, e em quem **recebe** e administra.'};
    },
    limpa(){ CARTAS.forEach((c, k) => { if (onde[k] !== c.c) onde[k] = 'bandeja'; }); desenha(); },
    revela(){ T.travado = true; CARTAS.forEach((c, k) => onde[k] = c.c); sel = -1; desenha(); marca(); return {titulo: 'Assim fica certo.', msg: 'Templo, escribas e muralha são da **cidade**. Terra própria, tributo e corveia são da vida nas **aldeias**.'}; },
  };
}

// ---------- 4. 60 grãos ----------
function graos(el){
  const NUMS = [7, 8, 12, 15, 25, 30], CERTOS = [12, 15, 30];
  const CORES = ['#F2B33D', '#2A9D8F', '#E9C99A', '#8FC7BE', '#F6CF7C', '#C98A12'];
  const sel = new Set();
  el.innerHTML = `<div class="graos" id="gr">${Array.from({length: 60}, () => '<i class="grao"></i>').join('')}</div><div class="grupos-info" id="gi" aria-live="polite">60 grãos de cevada</div>
    <div class="numeros">${NUMS.map(n => `<button class="num" data-n="${n}" aria-pressed="false">${n}</button>`).join('')}</div>`;
  const gr = [...el.querySelectorAll('.grao')];
  const agrupa = n => {
    const tam = Math.floor(60 / n), sobra = 60 % n;
    gr.forEach((g, k) => { const s = k >= 60 - sobra; g.classList.toggle('sobra', s); g.style.background = s ? '' : CORES[Math.floor(k / tam) % CORES.length]; });
    $('#gi').innerHTML = sobra ? `${n} grupos de ${tam} grãos <b style="color:var(--alerta-esc)">e sobram ${sobra}</b>` : `<b style="color:var(--feito-esc)">${n} grupos de ${tam} grãos, sem sobra</b>`;
  };
  el.querySelectorAll('.num').forEach(b => b.onclick = () => {
    if (T.travado) return; const n = +b.dataset.n;
    if (sel.has(n)) sel.delete(n); else sel.add(n);
    b.classList.toggle('sel', sel.has(n)); b.setAttribute('aria-pressed', sel.has(n)); agrupa(n); atualiza();
  });
  const marca = () => el.querySelectorAll('.num').forEach(b => { const n = +b.dataset.n; b.classList.remove('sel'); if (CERTOS.includes(n)) b.classList.add('certa'); else if (sel.has(n)) b.classList.add('errada'); });
  return {
    pronto: () => sel.size > 0,
    verifica(){
      const ok = CERTOS.every(n => sel.has(n)) && sel.size === CERTOS.length;
      if (ok) { T.travado = true; marca(); agrupa(12); return {certo: true, msg: '12, 15 e 30 dividem 60 sem sobra, e também 2, 3, 4, 5, 6, 10 e 20. A base 60 sobrevive até hoje nos **minutos**, nas **horas** e nos **graus** do círculo.'}; }
      const faltam = CERTOS.filter(n => !sel.has(n)).length, sobram = [...sel].filter(n => !CERTOS.includes(n)).length;
      return {certo: false, msg: sobram ? 'Algum número que você marcou deixa grãos sobrando. Toque nele de novo para ver.' : `Ainda falta${faltam > 1 ? 'm' : ''} ${faltam} número${faltam > 1 ? 's' : ''}.`};
    },
    limpa(){},
    revela(){ T.travado = true; sel.clear(); CERTOS.forEach(n => sel.add(n)); marca(); agrupa(15); return {titulo: '12, 15 e 30.', msg: 'Esses dividem 60 sem sobra. A base 60 sobrevive nos **minutos**, nas **horas** e nos **graus** do círculo.'}; },
  };
}

// ---------- 5. ordem: do selo ao tablete ----------
function ordem(el){
  const ETAPAS = [
    'Um selo é rolado na argila que lacra um pote ou uma porta',
    'Fichas de argila, que representam produtos, são fechadas numa bola lacrada',
    'As fichas passam a ser impressas também do lado de fora da bola',
    'A bola vira um tablete achatado, com marcas de números',
    'Desenhos passam a ser usados pelo som das palavras',
  ];
  const mistura = [2, 0, 4, 1, 3];
  let fila = [];
  const desenha = () => {
    el.innerHTML = `<div class="vagas">${ETAPAS.map((_, k) => { const e = fila[k]; return `<div class="vaga${e != null ? ' cheia' : ''}" data-v="${k}"><span class="n">${k + 1}</span>${e != null ? `<button data-k="${e}" aria-label="Tirar: ${esc(ETAPAS[e])}">${esc(ETAPAS[e])}</button>` : ''}</div>`; }).join('')}</div>
      <div class="monte">${mistura.filter(k => !fila.includes(k)).map(k => `<button class="cartinha" data-k="${k}">${esc(ETAPAS[k])}</button>`).join('')}</div>`;
    el.querySelectorAll('.monte .cartinha').forEach(b => b.onclick = () => { if (T.travado) return; fila.push(+b.dataset.k); desenha(); atualiza(); });
    el.querySelectorAll('.vaga button').forEach(b => b.onclick = () => { if (T.travado) return; fila = fila.filter(k => k !== +b.dataset.k); desenha(); atualiza(); });
  };
  desenha();
  const marca = () => el.querySelectorAll('.vaga').forEach((v, k) => v.classList.add(fila[k] === k ? 'certa' : 'errada'));
  return {
    pronto: () => fila.length === ETAPAS.length,
    verifica(){
      const certas = fila.filter((e, k) => e === k).length; marca();
      if (certas === ETAPAS.length) { T.travado = true; return {certo: true, msg: 'Para saber o que havia na bola sem quebrá-la, imprimiram as fichas por fora. Logo as marcas de fora bastaram, a bola virou tablete e, por fim, os sinais ganharam **som**.'}; }
      return {certo: false, titulo: `${certas} de ${ETAPAS.length} no lugar certo.`, msg: 'Comece pelo que já existia antes de qualquer marca escrita: o selo.'};
    },
    limpa(){ const ok = []; for (let k = 0; k < fila.length && fila[k] === k; k++) ok.push(k); fila = ok; desenha(); },
    revela(){ T.travado = true; fila = [0, 1, 2, 3, 4]; desenha(); marca(); return {titulo: 'A ordem certa.', msg: 'Selo, fichas na bola lacrada, marcas por fora, tablete com números e, por fim, sinais usados pelo **som**.'}; },
  };
}

// ---------- 6. rébus ----------
function rebus(el){
  const S = {
    flecha: '<svg viewBox="0 0 60 60" fill="none"><path d="M8 52L50 10M50 10H30M50 10v20" stroke="#0F1A22" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    sol: '<svg viewBox="0 0 60 60" fill="none"><circle cx="30" cy="30" r="11" stroke="#0F1A22" stroke-width="5"/><path d="M30 6v7M30 47v7M6 30h7M47 30h7M13 13l5 5M42 42l5 5M47 13l-5 5M18 42l-5 5" stroke="#0F1A22" stroke-width="4.5" stroke-linecap="round"/></svg>',
    espiga: '<svg viewBox="0 0 60 60" fill="none"><path d="M30 56V12" stroke="#0F1A22" stroke-width="5" stroke-linecap="round"/><path d="M30 18l-9-7M30 18l9-7M30 30l-9-7M30 30l9-7M30 42l-9-7M30 42l9-7" stroke="#0F1A22" stroke-width="4.5" stroke-linecap="round"/></svg>',
    peixe: '<svg viewBox="0 0 60 60" fill="none"><path d="M8 30q14-16 32 0q-18 16-32 0zM40 30l12-10v20z" stroke="#0F1A22" stroke-width="5" stroke-linejoin="round"/></svg>',
  };
  const OPS = [['sol', 'sol'], ['flecha', 'flecha'], ['espiga', 'cevada'], ['peixe', 'peixe']];
  let esc_ = null;
  el.innerHTML = `<div class="rebus"><span>"flecha"</span><span aria-hidden="true">≈</span><span class="som">"vida"</span></div>
    <div class="sinais">${OPS.map(([k, n]) => `<button class="sinal" data-k="${k}" aria-label="Sinal de ${n}">${S[k]}<span>${n}</span></button>`).join('')}</div>`;
  el.querySelectorAll('.sinal').forEach(b => b.onclick = () => { if (T.travado) return; el.querySelectorAll('.sinal').forEach(x => x.classList.remove('sel', 'errada')); b.classList.add('sel'); esc_ = b.dataset.k; atualiza(); });
  const marca = () => el.querySelectorAll('.sinal').forEach(b => { b.classList.remove('sel'); if (b.dataset.k === 'flecha') b.classList.add('certa'); else if (b.dataset.k === esc_) b.classList.add('errada'); });
  return {
    pronto: () => !!esc_,
    verifica(){
      marca();
      if (esc_ === 'flecha') { T.travado = true; return {certo: true, msg: 'Usar um desenho pelo **som**, e não pelo que ele mostra, foi o passo decisivo. Assim os escribas puderam escrever verbos, ideias abstratas e nomes próprios.'}; }
      return {certo: false, msg: 'Não pense no que o desenho mostra. Pense no **som** da palavra.'};
    },
    limpa(){ el.querySelectorAll('.sinal').forEach(x => x.classList.remove('errada')); },
    revela(){ T.travado = true; esc_ = 'flecha'; marca(); return {titulo: 'A flecha.', msg: 'Como "flecha" e "vida" soavam parecido, o mesmo sinal servia para as duas. É a escrita pelo **som**.'}; },
  };
}

// ---------- fim e efeitos ----------
function fim(){
  const min = Math.max(1, Math.round((Date.now() - st.t0) / 60000)), n = TELAS.length, pct = Math.round(st.acertosDePrimeira / n * 100);
  $('#palco').innerHTML = `<div class="fim"><div class="vj" aria-hidden="true">${VJ.comemorando}</div><h1 class="titulo">Lição concluída!</h1>
    <div class="stats"><div class="stat" style="background:var(--ouro)"><span style="color:var(--tinta)">XP ganho</span><b id="sXp">0</b></div><div class="stat" style="background:var(--feito)"><span>De primeira</span><b>${st.acertosDePrimeira} de ${n}</b></div><div class="stat" style="background:var(--noite)"><span>Tempo</span><b>${min} min</b></div></div>
    <p style="font-size:17px;font-weight:700;color:var(--suave)">${pct}% das atividades certas de primeira (${st.acertosDePrimeira} de ${n}).</p></div>`;
  conta($('#sXp'), 0, st.xp, 900);
  $('#base').className = 'licao-base';
  $('#baseDentro').innerHTML = `<span style="font-weight:800;color:var(--suave)">Protótipo C · referência Brilliant</span><button class="b3 ouro" id="acao" style="margin-left:auto">Fazer de novo</button>`;
  $('#acao').onclick = () => location.reload();
  confete();
}
function voaMoeda(de, g){
  const a = de.getBoundingClientRect(), b = $('#chipXp').getBoundingClientRect();
  const m = document.createElement('div'); m.className = 'moeda-voa'; m.textContent = 'XP'; document.body.appendChild(m);
  const x0 = a.left + a.width / 2 - 14, y0 = a.top, x1 = b.left + 8, y1 = b.top + 6;
  st.xp += g;
  const chega = () => { m.remove(); const de = st.xpVisto; st.xpVisto += g; conta($('#xp'), de, st.xpVisto, 400); const c = $('#chipXp'); c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); };
  if (reduzir) return chega();
  m.animate([
    {transform: `translate(${x0}px, ${y0}px) scale(.6)`, opacity: 0},
    {transform: `translate(${(x0 + x1) / 2}px, ${Math.min(y0, y1) - 120}px) scale(1.15)`, opacity: 1, offset: .45},
    {transform: `translate(${x1}px, ${y1}px) scale(.8)`, opacity: 1}
  ], {duration: 700, easing: 'cubic-bezier(0.77,0,0.175,1)'}).onfinish = chega;
}
function conta(el, de, para, ms){
  if (reduzir) { el.textContent = fmt(para); return; }
  const t0 = performance.now();
  const f = t => { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(Math.round(de + (para - de) * e)); if (k < 1) requestAnimationFrame(f); };
  requestAnimationFrame(f);
}
function confete(){
  if (reduzir) return;
  const box = document.createElement('div'); box.className = 'confete'; document.body.appendChild(box);
  const cores = ['#F2B33D', '#2A9D8F', '#E5644A', '#FFF6E3', '#8E6BBF'];
  for (let i = 0; i < 46; i++) {
    const p = document.createElement('i'); p.style.left = (Math.random() * 100) + 'vw'; p.style.background = cores[i % cores.length]; box.appendChild(p);
    p.animate([{transform: 'translate(0,0) rotate(0deg)'}, {transform: `translate(${(Math.random() - .5) * 160}px, ${innerHeight + 60}px) rotate(${(Math.random() - .5) * 720}deg)`}], {duration: 1400 + Math.random() * 1000, delay: Math.random() * 300, easing: 'cubic-bezier(0.23,1,0.32,1)', fill: 'forwards'});
  }
  setTimeout(() => box.remove(), 3000);
}

mostra();
})();
