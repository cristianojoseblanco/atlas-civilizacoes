(() => {
// Protótipo G: o app em volta das lições. Início (épocas e temas), árvore do curso no mapa, perfil e Premium.
const $ = s => document.querySelector(s);
const esc = x => String(x ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches;
const M = DADOS.mapa, VJ = DADOS.vj, U = DADOS.unidades, NS = 'http://www.w3.org/2000/svg';
const anoTxt = a => a < 0 ? `${Math.abs(a)} a.C.` : `${a} d.C.`;
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const TODAS = [], POR_ID = {};
U.forEach((u, ui) => u.licoes.forEach((l, li) => { l.ui = ui; l.li = li; l.gi = TODAS.length; TODAS.push(l); POR_ID[l.id] = l; }));
const LICAO_URL = 'prototipo-f.html';
const feitos = () => new Set(Estado.get().feitos);
const estado = l => { const f = feitos(); return f.has(l.id) ? 'feito' : !l.requisitos.every(r => f.has(r)) ? 'trancado' : l.publicada ? 'atual' : 'proxima'; };
const NOME_EST = {feito: 'Concluída', atual: 'Disponível', proxima: 'Em preparação', trancado: 'Bloqueada'};
const galhosCompletos = () => U.filter(u => u.licoes.every(l => feitos().has(l.id))).length;

// ---------- barra de cima e navegação ----------
function topo(){
  const s = Estado.get(), n = Estado.nivel(s.xp);
  $('#chips').innerHTML = `<a class="chip" href="#perfil" aria-label="Sequência de ${s.seq} dias">${ic('chama', 20)}<b>${s.seq}</b></a>
    <button class="chip" id="chipEn" aria-label="Energia">${ic('energia', 20)}<b>${s.premium ? '∞' : s.energia}</b></button>
    <a class="chip" href="#perfil" aria-label="${s.xp} XP, nível ${n}">${ic('moeda', 20)}<b>${numBR(s.xp)}</b></a>
    <a class="chip avatar${s.premium ? ' premium' : ''}" href="#perfil" aria-label="Perfil">${VJ.retrato}</a>`;
  $('#chipEn').onclick = () => modalEnergia();
  document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('ativo', location.hash.startsWith(a.getAttribute('href'))));
}

// ---------- início: épocas e temas ----------
let aba = 'epocas';
function inicio(){
  const s = Estado.get(), cur = TODAS.find(l => estado(l) === 'atual') || TODAS.find(l => estado(l) === 'proxima');
  const nf = TODAS.filter(l => feitos().has(l.id)).length;
  let h = `<section class="boas"><div class="vj-grande">${VJ.parado}</div><div><h1 class="titulo">Para onde vamos hoje?</h1>
    ${cur ? `<a class="continuar" href="${cur.publicada ? LICAO_URL : '#arvore/oriente-antigo'}" data-lic="${cur.id}"><span>${cur.publicada ? 'Continuar' : 'Próxima lição'}</span><b>${esc(cur.titulo)}</b><small>${esc(cur.lugar)} · ${anoTxt(cur.ano)}</small></a>` : ''}</div></section>
    <div class="abas" role="tablist"><button role="tab" aria-selected="${aba === 'epocas'}" data-a="epocas">Épocas</button><button role="tab" aria-selected="${aba === 'temas'}" data-a="temas">Temas</button></div>`;
  if (aba === 'epocas') {
    h += `<div class="linha-tempo">${DADOS.epocas.map(e => {
      const curso = DADOS.cursos.find(c => c.epocas.includes(e.id));
      const tem = !!curso, bloq = !tem && !s.premium;
      return `<article class="epoca${tem ? ' tem' : ''}">
        <span class="ponto" aria-hidden="true"></span>
        <div class="ep-corpo"><span class="ate">${e.periodo}</span><h2 class="titulo">${esc(e.nome)}</h2><p>${esc(e.descricao)}</p>
        ${tem ? `<a class="curso-card" href="#arvore/${curso.id}"><div><b>${esc(curso.titulo)}</b><span>${curso.licoes} lições · ${nf} de ${curso.licoes} concluídas (${pct(nf, curso.licoes)}%)</span><i class="barra"><i style="width:${pct(nf, curso.licoes)}%"></i></i></div><span class="ir">Abrir árvore</span></a>`
          : `<div class="breve">${bloq ? `${ic('cadeado', 18)} Premium · ` : ''}Curso em preparação</div>`}</div></article>`; }).join('')}</div>`;
  } else {
    h += `<div class="temas">${DADOS.temas.map(t => `<article class="tema"><h2 class="titulo">${esc(t.nome)}</h2><p>${esc(t.descricao)}</p><span class="conta">${numBR(t.lugares)} lugares e ${numBR(t.eventos)} eventos no atlas</span><div class="breve">${s.premium ? '' : `${ic('cadeado', 18)} Premium · `}Trilha em preparação</div></article>`).join('')}</div>`;
  }
  $('#tela').innerHTML = h;
  document.querySelectorAll('.abas button').forEach(b => b.onclick = () => { aba = b.dataset.a; inicio(); });
  const c = $('.continuar'); if (c && c.dataset.lic) c.onclick = e => { const l = POR_ID[c.dataset.lic]; if (l.publicada) { e.preventDefault(); comecar(l); } };
}

// ---------- árvore do curso, com o mapa ----------
let foco = null;
function arvore(){
  const ds = $('#tela'); ds.innerHTML = `<div class="arvore-tela"><div class="arv-col"><header class="arv-cab"><a href="#inicio" class="voltar" aria-label="Voltar">‹</a><div><span>Primeiras cidades → Impérios</span><h1 class="titulo">Oriente Antigo</h1></div><span class="prog" id="progCurso"></span></header><div class="sel" id="selLicao"></div><div class="galhos" id="galhos"></div></div><div class="arv-mapa" id="mapa"></div></div>`;
  montaMapa();
  const f = feitos(); $('#progCurso').textContent = `${f.size} de ${TODAS.length} (${pct(f.size, TODAS.length)}%)`;
  let h = '';
  U.forEach((u, ui) => {
    const ls = u.licoes, nf = ls.filter(l => f.has(l.id)).length, aberto = ls.some(l => estado(l) !== 'trancado');
    const ext = [...new Set(ls.flatMap(l => l.requisitos).filter(r => POR_ID[r].ui !== ui))];
    const nivel = {}; const lv = l => nivel[l.id] ?? (nivel[l.id] = Math.max(0, ...l.requisitos.filter(r => POR_ID[r].ui === ui).map(r => lv(POR_ID[r]) + 1)));
    ls.forEach(lv); const linhas = []; ls.forEach(l => (linhas[nivel[l.id]] ??= []).push(l));
    h += `<section class="galho${aberto ? '' : ' fechado'}" data-ui="${ui}"><div class="galho-cab"><div><span>Galho ${ui + 1} · ${esc(u.periodo)}</span><b class="titulo">${esc(u.titulo)}</b></div><span class="est">${nf === ls.length ? 'Concluído' : aberto ? `${nf} de ${ls.length}` : `${ic('cadeado', 16)} Bloqueado`}</span></div>
      ${ext.length ? `<div class="nasce">Nasce de ${ext.map(r => `<span class="req${f.has(r) ? ' ok' : ''}">${esc(POR_ID[r].titulo)}</span>`).join('')}</div>` : ''}
      <div class="arv"><svg class="ramos" aria-hidden="true"></svg>${linhas.map(row => `<div class="linha${row.length >= 4 ? ' larga' : ''}">${row.map(l => { const e = estado(l); return `<div class="nd" data-id="${l.id}"><button class="no ${e}" aria-label="${esc(l.titulo)}, ${NOME_EST[e]}">${e === 'feito' ? '✓' : e === 'trancado' ? ic('cadeado', 22) : e === 'proxima' ? '…' : ic('estrela', 24)}</button><span>${esc(l.titulo)}</span></div>`; }).join('')}</div>`).join('')}</div></section>`;
  });
  $('#galhos').innerHTML = h;
  document.querySelectorAll('.nd').forEach(n => n.querySelector('.no').onclick = () => escolhe(POR_ID[n.dataset.id], true));
  requestAnimationFrame(ramos);
  const ini = foco || TODAS.find(l => estado(l) === 'atual') || TODAS.find(l => estado(l) === 'proxima') || TODAS[0];
  escolhe(ini, false);
  document.querySelector(`.nd[data-id="${ini.id}"]`)?.scrollIntoView({block: 'center'});
}
function ramos(){
  const f = feitos();
  document.querySelectorAll('.galho').forEach(g => {
    const arv = g.querySelector('.arv'), svg = arv.querySelector('.ramos'), R = arv.getBoundingClientRect(); svg.setAttribute('width', R.width); svg.setAttribute('height', R.height);
    let p = ''; g.querySelectorAll('.nd').forEach(n => { const l = POR_ID[n.dataset.id];
      l.requisitos.filter(r => POR_ID[r].ui === l.ui).forEach(r => { const a = g.querySelector(`.nd[data-id="${r}"]`).getBoundingClientRect(), b = n.querySelector('.no').getBoundingClientRect();
        const x1 = a.left + a.width / 2 - R.left, y1 = a.bottom - R.top + 4, x2 = b.left + b.width / 2 - R.left, y2 = b.top - R.top - 4, my = (y1 + y2) / 2;
        p += `<path class="${f.has(r) ? (f.has(l.id) ? 'feita' : 'aberta') : 'fechada'}" d="M${x1} ${y1}C${x1} ${my} ${x2} ${my} ${x2} ${y2}"/>`; }); });
    svg.innerHTML = p; });
}
function escolhe(l, anima){
  foco = l; const e = estado(l), s = Estado.get();
  document.querySelectorAll('.nd').forEach(n => n.classList.toggle('foco', n.dataset.id === l.id));
  const f = feitos();
  const botao = e === 'atual' ? `<button class="b3 ouro" id="comecar">${(s.secoes[l.id] ?? -1) >= 0 ? 'Continuar' : 'Começar'}</button>`
    : e === 'feito' && l.publicada ? `<button class="b3" id="comecar">Revisar</button>` : `<span class="est-l ${e}">${NOME_EST[e]}</span>`;
  $('#selLicao').innerHTML = `<div class="sel-l"><div><span>${esc(U[l.ui].titulo)} · lição ${l.li + 1}</span><b class="titulo">${esc(l.titulo)}</b><small>${esc(l.lugar)} · ${anoTxt(l.ano)}</small></div>${botao}</div>
    ${l.requisitos.length ? `<div class="reqs">${e === 'trancado' ? 'Para abrir, conclua: ' : 'Requisitos: '}${l.requisitos.map(r => `<span class="req${f.has(r) ? ' ok' : ''}">${esc(POR_ID[r].titulo)}</span>`).join('')}</div>` : ''}`;
  const b = $('#comecar'); if (b) b.onclick = () => comecar(l);
  // no mapa: os lugares do galho, a lição escolhida em destaque e o Viajante ao lado
  pinos(l.ui); destaca(l);
  // o mapa mostra a lição com o que vem antes e o que ela abre: perto quando é perto, longe quando é longe
  const viz = [l.id, ...l.requisitos, ...TODAS.filter(x => x.requisitos.includes(l.id)).map(x => x.id)];
  enquadra(viz, anima);
}
function comecar(l){
  const s = Estado.get(), secao = Math.min((s.secoes[l.id] ?? -1) + 1, 4);
  if (!Estado.podeEstudar(l.id, secao)) return modalEnergia(true);
  location.href = LICAO_URL;
}

// mapa 2D da árvore (mesmo desenho do protótipo F)
let W = 0, H = 0, cam = {x: 0, y: 0, s: 1}, camAnim = null, vjAnc = null;
const proj = (lon, lat) => [(lon - M.lon0) * M.kx, (M.lat1 - lat) * M.k];
const escalaBase = () => Math.max(W / M.w, H / M.h);
const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function montaMapa(){
  $('#mapa').innerHTML = `<svg class="campo" id="campo"><g id="cam">${M.svg}<g id="fx"></g></g></svg><div class="sobre" id="sobre"></div><span class="ano-m" id="anoM"></span>`;
  const r = $('#mapa').getBoundingClientRect(); W = r.width; H = r.height; $('#campo').setAttribute('viewBox', `0 0 ${W} ${H}`);
  vjAnc = null;
}
function poeCamera(c){ cam = c; $('#cam').setAttribute('transform', `translate(${W / 2 - c.x * c.s} ${H / 2 - c.y * c.s}) scale(${c.s})`); $('#cam').style.setProperty('--inv', 1 / c.s); posVj(); }
function vaiCamera(x, y, s, anima){
  cancelAnimationFrame(camAnim); const alvo = {x, y, s};
  if (!anima || reduzir) return poeCamera(alvo);
  const de = {...cam}, t0 = performance.now();
  const f = t => { const k = Math.min(1, (t - t0) / 1300), e = easeIO(k); poeCamera({x: de.x + (alvo.x - de.x) * e, y: de.y + (alvo.y - de.y) * e, s: Math.exp(Math.log(de.s) + (Math.log(alvo.s) - Math.log(de.s)) * e)}); if (k < 1) camAnim = requestAnimationFrame(f); };
  camAnim = requestAnimationFrame(f);
}
function enquadra(ids, anima){
  const ps = ids.map(id => proj(POR_ID[id].lon, POR_ID[id].lat)), xs = ps.map(p => p[0]), ys = ps.map(p => p[1]);
  const bw = Math.max(...xs) - Math.min(...xs), bh = Math.max(...ys) - Math.min(...ys);
  const s = Math.max(escalaBase() * 1.1, Math.min(escalaBase() * 5, W * .6 / Math.max(bw, 1), H * .55 / Math.max(bh, 1)));
  vaiCamera((Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2, s, anima);
}
function pinos(ui){
  const fx = $('#fx'); fx.innerHTML = '';
  // requisitos entre lugares do galho, como trilhas pontilhadas
  const f = feitos();
  U[ui].licoes.forEach(l => l.requisitos.filter(r => POR_ID[r].ui === ui).forEach(r => { const a = proj(POR_ID[r].lon, POR_ID[r].lat), b = proj(l.lon, l.lat);
    const p = document.createElementNS(NS, 'path'); p.setAttribute('class', 'trilha ' + (f.has(r) ? (f.has(l.id) ? 'feita' : 'aberta') : 'fechada')); p.setAttribute('d', `M${a[0]} ${a[1]}Q${(a[0] + b[0]) / 2 - (b[1] - a[1]) * .15} ${(a[1] + b[1]) / 2 + (b[0] - a[0]) * .15} ${b[0]} ${b[1]}`); fx.appendChild(p); }));
  const grupos = {};
  U[ui].licoes.forEach(l => { const k = l.lon + ',' + l.lat; (grupos[k] ??= []).push(l); });
  U[ui].licoes.forEach(l => {
    const g = grupos[l.lon + ',' + l.lat], k = g.indexOf(l), [x, y] = proj(l.lon, l.lat), e = estado(l);
    const m = document.createElementNS(NS, 'g'); m.setAttribute('class', `pin ${e}`); m.dataset.id = l.id;
    m.style.transform = `translate(${x}px, ${y}px) scale(var(--inv))`;
    m.innerHTML = `<g transform="translate(${(k - (g.length - 1) / 2) * 30} 0)"><circle r="13"/><text y="4.5" text-anchor="middle">${l.li + 1}</text><text class="nm" y="30" text-anchor="middle">${esc(l.lugar.split(' (')[0])}</text></g>`;
    m.onclick = () => { escolhe(l, true); document.querySelector(`.nd[data-id="${l.id}"]`)?.scrollIntoView({behavior: 'smooth', block: 'center'}); };
    fx.appendChild(m);
  });
}
function destaca(l){
  document.querySelectorAll('.pin').forEach(p => p.classList.toggle('foco', p.dataset.id === l.id));
  if (!vjAnc) { const d = document.createElement('div'); d.className = 'vj-anc'; d.innerHTML = `<div class="vj">${VJ.parado}</div>`; $('#sobre').appendChild(d); vjAnc = {el: d, x: 0, y: 0}; }
  [vjAnc.x, vjAnc.y] = proj(l.lon, l.lat); posVj();
  vjAnc.el.querySelector('.vj').animate([{transform: 'translateY(-14px)', opacity: .4}, {transform: 'none', opacity: 1}], {duration: 500, easing: 'cubic-bezier(0.23,1,0.32,1)'});
  $('#anoM').textContent = anoTxt(l.ano);
}
function posVj(){ if (!vjAnc) return; vjAnc.el.style.transform = `translate(${(vjAnc.x - cam.x) * cam.s + W / 2}px, ${(vjAnc.y - cam.y) * cam.s + H / 2}px)`; }

// ---------- perfil ----------
function perfil(){
  const s = Estado.get(), n = Estado.nivel(s.xp), a = Estado.xpDoNivel(n), b = Estado.xpDoNivel(n + 1);
  const nf = s.feitos.length, ganhas = Estado.CONQUISTAS.filter(c => s.conquistas[c.id]).length;
  $('#tela').innerHTML = `<div class="perfil">
    <section class="cartao-perfil"><div class="retrato">${VJ.retrato}</div><div class="quem"><h1 class="titulo">Viajante</h1><span class="plano ${s.premium ? 'premium' : ''}">${s.premium ? `${ic('estrela', 16)} Premium` : 'Plano grátis'}</span>
      <div class="nivel"><b>Nível ${n}</b><i class="barra"><i style="width:${pct(s.xp - a, b - a)}%"></i></i><small>${numBR(s.xp - a)} de ${numBR(b - a)} XP até o nível ${n + 1}</small></div></div></section>
    <section class="numeros">
      <div class="num">${ic('moeda', 28)}<b>${numBR(s.xp)}</b><span>XP no total</span></div>
      <div class="num">${ic('chama', 28)}<b>${s.seq}</b><span>${s.seq === 1 ? 'dia seguido' : 'dias seguidos'}</span></div>
      <div class="num">${ic('energia', 28)}<b>${s.premium ? '∞' : `${s.energia} de ${Estado.ENERGIA_DIA}`}</b><span>energia hoje</span></div>
      <div class="num">${ic('galho', 28)}<b>${nf} de ${TODAS.length}</b><span>lições (${pct(nf, TODAS.length)}%)</span></div>
      <div class="num">${ic('alvo', 28)}<b>${s.primeira} de ${s.respostas}</b><span>tarefas de primeira (${pct(s.primeira, s.respostas)}%)</span></div>
    </section>
    ${s.premium ? `<section class="premium-on">${ic('estrela', 26)}<div><b>Você é Premium</b><span>Energia sem limite, todas as épocas, o atlas completo e a revisão inteligente.</span></div></section>`
      : `<section class="premium-card"><div><b class="titulo">Atlas Premium</b><ul>${BENEF.map(x => `<li>${ic(x[0], 20)}<span><b>${x[1]}</b> ${x[2]}</span></li>`).join('')}</ul></div><button class="b3 ouro" id="verPremium">Ver o Premium</button></section>`}
    <section class="conquistas"><h2 class="titulo">Conquistas <small>${ganhas} de ${Estado.CONQUISTAS.length}</small></h2><div class="grade-c">${Estado.CONQUISTAS.map(c => { const v = Math.min(c.valor(), c.meta), ok = !!s.conquistas[c.id];
      return `<article class="conq${ok ? ' ok' : ''}"><span class="conq-ic">${ic(c.ic, 34)}</span><b>${c.nome}</b><p>${c.desc}</p>${ok ? `<small>Conquistada em ${new Date(s.conquistas[c.id] + 'T12:00').toLocaleDateString('pt-BR')}</small>` : c.meta > 1 ? `<i class="barra"><i style="width:${pct(v, c.meta)}%"></i></i><small>${v} de ${c.meta}</small>` : '<small>Ainda não</small>'}</article>`; }).join('')}</div></section>
    <section class="ferramentas"><h2 class="titulo">Ferramentas do protótipo</h2><p>Para ver o app em outros momentos. Nada disso existe no app de verdade.</p><div class="bts">
      <button class="b3" data-f="meio">Simular: galho 2 concluído</button><button class="b3" data-f="premium">${s.premium ? 'Voltar ao grátis' : 'Simular Premium'}</button><button class="b3" data-f="energia">Zerar a energia</button><button class="b3" data-f="zera">Começar do zero</button></div></section>
  </div>`;
  const vp = $('#verPremium'); if (vp) vp.onclick = () => modalPremium();
  document.querySelectorAll('.ferramentas button').forEach(b => b.onclick = () => {
    const f = b.dataset.f;
    if (f === 'meio') { const ids = TODAS.filter(l => l.ui < 2).map(l => l.id); Estado.define({feitos: ids, xp: Math.max(Estado.get().xp, ids.length * 60), seq: Math.max(Estado.get().seq, 3), ultimoDia: new Date().toISOString().slice(0, 10)}); Estado.conclui(ids[ids.length - 1], galhosCompletos()); }
    if (f === 'premium') Estado.premium(!Estado.get().premium);
    if (f === 'energia') Estado.define({energia: 0});
    if (f === 'zera') Estado.zera();
    render(); avisoConquistas();
  });
}
const BENEF = [['energia', 'Energia sem limite.', 'No grátis são 5 por dia.'], ['galho', 'Todas as épocas e temas.', 'No grátis, o curso Oriente Antigo.'], ['cidade', 'O atlas completo.', 'Todas as camadas do mapa, com as fontes.'], ['tablete', 'Revisão inteligente.', 'O que você errou volta na hora certa.']];

// ---------- janelas ----------
function janela(html){
  const j = document.createElement('div'); j.className = 'janela'; j.innerHTML = `<div class="jan" role="dialog" aria-modal="true">${html}</div>`;
  j.onclick = e => { if (e.target === j || e.target.closest('[data-fecha]')) fecha(); };
  const fecha = () => { j.classList.add('sai'); setTimeout(() => j.remove(), 220); };
  document.body.appendChild(j); j.querySelector('button')?.focus(); return {j, fecha};
}
function modalPremium(){
  const {j, fecha} = janela(`<div class="jan-vj">${VJ.comemorando}</div><h2 class="titulo">Atlas Premium</h2><ul class="lista-p">${BENEF.map(x => `<li>${ic(x[0], 24)}<span><b>${x[1]}</b> ${x[2]}</span></li>`).join('')}</ul><p class="nota">Preço e pagamento ainda a definir. Neste protótipo dá para simular.</p><div class="bts"><button class="b3" data-fecha>Agora não</button><button class="b3 ouro" id="simP">Simular Premium</button></div>`);
  j.querySelector('#simP').onclick = () => { Estado.premium(true); fecha(); render(); };
}
function modalEnergia(semEnergia){
  const s = Estado.get();
  const {j, fecha} = janela(`<div class="hexes">${Array.from({length: Estado.ENERGIA_DIA}, (_, i) => `<span class="${s.premium || i < s.energia ? 'cheio' : ''}">${ic('energia', 34)}</span>`).join('')}</div>
    <h2 class="titulo">${s.premium ? 'Energia sem limite' : semEnergia ? 'Sua energia acabou por hoje' : `Energia: ${s.energia} de ${Estado.ENERGIA_DIA}`}</h2>
    <p>${s.premium ? 'No Premium, cada seção nova não gasta energia.' : 'Cada seção nova gasta 1 energia. Revisar o que você já fez é grátis. A energia volta a 5 todo dia.'}</p>
    <div class="bts">${!s.premium ? `<button class="b3" data-fecha>${semEnergia ? 'Revisar uma lição' : 'Entendi'}</button><button class="b3 ouro" id="vp">Energia sem limite</button>` : '<button class="b3 ouro" data-fecha>Entendi</button>'}</div>`);
  const v = j.querySelector('#vp'); if (v) v.onclick = () => { fecha(); modalPremium(); };
}

// ---------- rotas ----------
function render(){
  const h = location.hash || '#inicio';
  document.body.dataset.rota = h.split('/')[0].slice(1);
  if (h.startsWith('#arvore')) arvore(); else if (h.startsWith('#perfil')) perfil(); else inicio();
  topo(); avisoConquistas();
}
addEventListener('hashchange', () => { foco = null; render(); scrollTo(0, 0); });
addEventListener('resize', () => { clearTimeout(render._t); render._t = setTimeout(() => { if (location.hash.startsWith('#arvore')) arvore(); }, 200); });
// ao voltar da lição, o estado pode ter mudado (XP, lição concluída)
addEventListener('pageshow', () => render());
Estado.define({galhos: galhosCompletos()});
render();
})();
