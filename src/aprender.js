(() => {
const $ = s => document.querySelector(s);
const app = $('#app');
const esc = x => String(x ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const md = x => esc(x).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const NIV = [['iniciante','Iniciante'],['colegio','Colégio'],['graduacao','Graduação']];
const RANK = {iniciante:1, colegio:2, graduacao:3};
const XP_CERTA = 10, XP_REVISAO = 5, XP_LICAO = 30, ENERGIA_MAX = 5;
const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches;
const anoTxt = a => a == null ? '' : a < 0 ? `${Math.abs(a)} a.C.` : `${a} d.C.`;

// ---------- estado do jogador (no navegador por enquanto; depois no servidor) ----------
let J = {xp:0, dias:[], nivel:'colegio', licoes:{}, energia:null, ponto:null};
try { const s = JSON.parse(localStorage.getItem('atlas-jogo') || 'null'); if (s) J = Object.assign(J, s); } catch (e) {}
const hoje = () => new Date().toLocaleDateString('sv-SE');
function energia(){ if (!J.energia || J.energia.dia !== hoje()) J.energia = {dia: hoje(), n: ENERGIA_MAX}; return J.energia.n; }
const save = () => { try { localStorage.setItem('atlas-jogo', JSON.stringify(J)); } catch (e) {} topo(); };
function marcaDia(){ const d = hoje(); if (!J.dias.includes(d)) { J.dias.push(d); J.dias = J.dias.slice(-400); } }
function sequencia(){
  const set = new Set(J.dias); let n = 0, d = new Date();
  if (!set.has(d.toLocaleDateString('sv-SE'))) d.setDate(d.getDate() - 1);
  while (set.has(d.toLocaleDateString('sv-SE'))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
const nivelJog = xp => Math.floor(Math.sqrt(xp / 40)) + 1;
const xpDoNivel = n => (n - 1) * (n - 1) * 40;
const hex = (cheio, w = 14, extra = '') => `<svg width="${w}" height="${Math.round(w * 1.12)}" viewBox="0 0 18 20" fill="none" aria-hidden="true"><path d="M9 1l8 4.5v9L9 19l-8-4.5v-9z" fill="${cheio ? '#2A9D8F' : 'none'}" stroke="${cheio ? '#FFF6E3' : '#6F8796'}" stroke-width="1.6"${extra}/></svg>`;
function topo(){
  $('#cXp span:last-child').textContent = `${J.xp.toLocaleString('pt-BR')} XP`;
  const s = sequencia(); $('#cSeq span').innerHTML = `${s}&nbsp;<span class="longo">${s === 1 ? 'dia seguido' : 'dias seguidos'}</span>`;
  const e = energia();
  $('#cEn').innerHTML = `<span class="so-cel">${hex(e > 0)}</span><span class="longo">Energia </span>${e}/${ENERGIA_MAX} <span class="longo">${Array.from({length: ENERGIA_MAX}, (_, i) => hex(i < e)).join('')}</span>`;
  $('#cEn').setAttribute('aria-label', `Energia: ${e} de ${ENERGIA_MAX}`);
}
const feita = id => J.licoes[id] && J.licoes[id].feita;
const LIC = LICOES.licoes;
const reqOk = it => it.requisitos.every(id => feita(id) || !LIC[id]);
function fontesTxt(refs){
  return (refs || []).filter(f => FONTES[f.id]).map(f => { const F = FONTES[f.id];
    const t = `${esc(F.autores)}${F.ano ? ' (' + esc(F.ano) + ')' : ''}, <i>${esc(F.titulo)}</i>${f.loc ? ', ' + esc(f.loc) : ''}`;
    return F.url ? `<a href="${esc(F.url)}" target="_blank" rel="noopener">${t}</a>` : t; }).join(' · ');
}

// ---------- início: perfil e caminho ----------
function home(){
  S = null; $('#trilha').textContent = 'Oriente Antigo · caminho';
  const xp = J.xp, n = nivelJog(xp), a = xpDoNivel(n), b = xpDoNivel(n + 1);
  const total = LICOES.unidades.reduce((s, u) => s + u.licoes.length, 0);
  const feitas = Object.values(J.licoes).filter(x => x.feita).length;
  let h = `<div class="inicio"><section class="painel perfil">
    <div class="retrato" aria-hidden="true">${VJ.retrato}</div>
    <div><h1 class="titulo">Oriente Antigo</h1><p>Das primeiras aldeias ao império persa. Cada lição tem texto, mapa e perguntas, e cada acerto vale XP.</p>
      <div class="niveis" role="group" aria-label="Nível das perguntas">${NIV.map(([id, nm]) => `<button data-n="${id}" aria-pressed="${J.nivel === id}">${nm}</button>`).join('')}</div></div>
    <div class="numeros">
      <div class="num"><span>Nível do viajante</span><b>${n}</b><div class="nivel"><i style="width:${Math.round((xp - a) / (b - a) * 100)}%"></i></div><span>${(b - xp).toLocaleString('pt-BR')} XP para o nível ${n + 1}</span></div>
      <div class="num"><span>Sequência</span><b>${sequencia()} ${sequencia() === 1 ? 'dia' : 'dias'}</b><span>estudando sem parar</span></div>
      <div class="num"><span>Lições</span><b>${feitas} de ${total}</b><span>concluídas no curso</span></div>
    </div></section>`;
  LICOES.unidades.forEach((u, ui) => {
    const algumaPub = u.licoes.some(l => l.publicada);
    h += `<section class="painel unidade${algumaPub ? '' : ' trancada'}"><span class="periodo">Unidade ${ui + 1} · ${esc(u.periodo)}</span><h2 class="titulo">${esc(u.titulo)}</h2><p>${esc(u.descricao)}</p><ol class="casas">`;
    u.licoes.forEach((l, li) => {
      let cls = 'breve', ic = li + 1, sub = 'Em preparação', pode = false;
      if (l.publicada) {
        if (feita(l.id)) { cls = 'feita'; ic = '✓'; const r = J.licoes[l.id]; sub = `Concluída · ${r.acertos} de ${r.total} certas`; pode = true; }
        else if (reqOk(l)) { cls = 'aberta'; const r = J.licoes[l.id]; sub = r && r.secao ? `Parou na seção ${r.secao + 1}` : `${LIC[l.id].secoes.length} seções com perguntas`; pode = true; }
        else { sub = 'Termine as lições anteriores'; }
      }
      h += `<li><button class="casa ${cls}" data-id="${l.id}"${pode ? '' : ' disabled'}><span class="ic">${ic}</span><span>${esc(l.titulo)}<small>${sub}</small></span></button></li>`;
    });
    h += '</ol></section>';
  });
  h += `<p class="aviso">Protótipo: o progresso fica salvo só neste navegador. Contas e energia no servidor chegam com o login.</p></div>`;
  app.innerHTML = h; scrollTo(0, 0);
  app.querySelectorAll('.niveis button').forEach(b => b.onclick = () => { J.nivel = b.dataset.n; save(); home(); });
  app.querySelectorAll('.casa').forEach(b => b.onclick = () => abrir(b.dataset.id));
}

// ---------- mapa do curso com o Viajante ----------
const M = MAPA;
const proj = (lon, lat) => [(lon - M.lon0) * M.kx, (M.lat1 - lat) * M.k];
let cam = {s: 1, tx: 0, ty: 0}, mapaEl = null, passoT = null;
function montaMapa(el){
  el.innerHTML = `<svg class="campo" aria-hidden="true"><g id="cam">${M.svg}<g id="cids">${M.cidades.map(c => `<g class="cid" data-n="${esc(c.n)}"><circle cx="${c.x}" cy="${c.y}" r="4"/><text x="${c.x + 8}" y="${c.y + 5}">${esc(c.n)}</text></g>`).join('')}</g>
    <g id="vj"><g class="vj-parado">${VJ.parado}</g><g class="vj-andando">${VJ.andando}</g></g></g></svg>
    <span class="epoca" id="epoca"></span><span class="lugar" id="lugar" hidden></span>
    <a class="ir" id="ir" href="index.html">Ver no atlas completo</a>`;
  // o desenho do Viajante: pés no ponto
  el.querySelectorAll('#vj svg').forEach(s => { s.setAttribute('x', -40); s.setAttribute('y', -98); });
  mapaEl = el;
}
function foco(sec, animar = true){
  if (!mapaEl) return;
  const svg = mapaEl.querySelector('svg.campo'), cw = mapaEl.clientWidth, ch = mapaEl.clientHeight;
  svg.setAttribute('viewBox', `0 0 ${cw} ${ch}`);
  const pts = (sec.foco && sec.foco.length ? sec.foco : [[45.6, 31.3]]).map(([lo, la]) => proj(lo, la));
  const [px, py] = pts[pts.length - 1];
  const base = Math.max(cw / M.w, ch / M.h);
  const s = base * Math.min(3.2, Math.max(1.3, (sec.zoom || 6) / 2.4));
  let tx = cw / 2 - px * s, ty = ch / 2 - py * s;
  tx = Math.min(0, Math.max(cw - M.w * s, tx)); ty = Math.min(0, Math.max(ch - M.h * s, ty));
  cam = {s, tx, ty};
  const g = mapaEl.querySelector('#cam'), vj = mapaEl.querySelector('#vj');
  if (!animar) { g.style.transition = vj.style.transition = 'none'; }
  g.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
  mapaEl.querySelectorAll('.cid text').forEach(t => { t.style.fontSize = (14 / s) + 'px'; t.setAttribute('x', +t.previousElementSibling.getAttribute('cx') + 8 / s); t.setAttribute('y', +t.previousElementSibling.getAttribute('cy') + 5 / s); t.style.strokeWidth = (3 / s) + 'px'; });
  mapaEl.querySelectorAll('.cid circle').forEach(c => c.setAttribute('r', 4 / s));
  // o Viajante caminha do ponto anterior até o novo
  const de = J.ponto, para = [px, py], dist = de ? Math.hypot(de[0] - px, de[1] - py) : 0;
  vj.style.transform = `translate(${px}px, ${py}px) scale(${1 / s})`;
  if (animar && !reduzir && dist > 1) {
    vj.classList.add('andando'); clearInterval(passoT);
    passoT = setInterval(() => vj.classList.toggle('passo'), 160);
    setTimeout(() => { clearInterval(passoT); vj.classList.remove('andando', 'passo'); }, 1200);
  }
  if (!animar) requestAnimationFrame(() => { g.style.transition = vj.style.transition = ''; });
  J.ponto = para;
  // lugar mais próximo com nome
  let perto = null, dmin = 18 / s;
  M.cidades.forEach(c => { const d = Math.hypot(c.x - px, c.y - py); if (d < dmin) { dmin = d; perto = c; } });
  mapaEl.querySelectorAll('.cid').forEach(c => c.style.display = perto && c.dataset.n === perto.n ? 'none' : '');
  const lg = mapaEl.querySelector('#lugar');
  if (perto) { lg.hidden = false; lg.textContent = perto.n; lg.style.left = (px * s + tx) + 'px'; lg.style.top = (py * s + ty) + 'px'; } else lg.hidden = true;
  mapaEl.querySelector('#epoca').textContent = anoTxt(sec.ano);
  const f = (sec.foco || [])[0];
  mapaEl.querySelector('#ir').href = f ? `index.html#ano=${sec.ano ?? ''}&foco=${encodeURIComponent(sec.foco.map(c => c.join(',')).join(';'))}${sec.zoom ? '&zoom=' + sec.zoom : ''}` : 'index.html';
}

// ---------- lição ----------
let S = null; // {lic, sec, fase:'intro'|'ler'|'perg'|'fimsec'|'fim', fila, qi, resp, ganhos, acertos, total}
function abrir(id){
  const lic = LIC[id]; if (!lic) return;
  const r = J.licoes[id] || {};
  S = {lic, sec: r.feita ? 0 : (r.secao || 0), fase: 'intro', ganhos: 0, acertos: 0, total: 0, ganhosSec: 0};
  location.hash = 'licao/' + id;
  $('#trilha').textContent = `Oriente Antigo › ${lic.titulo}`;
  app.innerHTML = `<div class="licao"><section class="leitura" aria-live="polite"><div class="rolar" id="rolar"></div><div class="rodape" id="rodape"></div></section><section class="mapa" id="mapa" aria-label="Mapa da lição"></section></div>`;
  montaMapa($('#mapa')); render(true);
}
function perguntasDa(sec){
  const lim = RANK[J.nivel] || 2;
  return sec.perguntas.filter(q => (RANK[q.nivel] || 2) <= lim).map((q, i) => ({q, i, revisao: false}));
}
function casasSecoes(){
  const n = S.lic.secoes.length; let h = `<ol class="secoes" aria-label="Seções: ${S.fase === 'fim' ? n : S.sec} de ${n} concluídas">`;
  for (let k = 0; k < n; k++) {
    const st = S.fase === 'fim' || k < S.sec ? 'feita' : k === S.sec && S.fase !== 'intro' ? 'atual' : 'futura';
    if (k) h += `<li class="t${st === 'futura' ? ' f' : ''}"></li>`;
    h += `<li class="c ${st}">${st === 'feita' ? '✓' : k + 1}</li>`;
  }
  return h + '</ol>';
}
function render(primeira){
  const L = S.lic, sec = L.secoes[S.sec];
  let h = casasSecoes(), foot = '';
  if (S.fase === 'intro') {
    h += `<span class="rotulo">Lição · ${esc(L.periodo)} · ${esc(L.lugar)}</span><h1 class="titulo">${esc(L.titulo)}</h1>
      <div class="objetivo"><b>Objetivo:</b> ${esc(L.objetivo)}</div>
      <ol class="lista-secoes">${L.secoes.map(s => `<li>${esc(s.titulo)} <span class="suave">· ${Math.max(2, Math.round(s.palavras / 200))} min</span></li>`).join('')}</ol>
      <p class="fontes">Lição escrita para o atlas a partir de: ${fontesTxt(L.fontes)}.</p>`;
    foot = `<button class="btn" id="voltar">Caminho</button><button class="btn principal" id="go">${S.sec ? 'Continuar da seção ' + (S.sec + 1) : 'Começar a leitura'}</button>`;
  } else if (S.fase === 'ler') {
    h += `<span class="rotulo">${anoTxt(sec.ano)} · seção ${S.sec + 1} de ${L.secoes.length}</span><h1 class="titulo">${esc(sec.titulo)}</h1>
      <div class="texto">${sec.paragrafos.map(p => `<p>${md(p)}</p>`).join('')}</div>
      <p class="fontes">Fontes: ${fontesTxt(sec.fontes)}</p>`;
    foot = `<button class="btn principal" id="go">Responder ${S.fila.length} perguntas · até +${S.fila.length * XP_CERTA} XP</button>`;
  } else if (S.fase === 'perg') {
    const it = S.fila[S.qi], q = it.q, r = S.resp;
    h += `<span class="rotulo">Seção ${S.sec + 1} · pergunta ${S.qi + 1} de ${S.fila.length}${it.revisao ? ' · revisão' : ''}</span><h2 class="titulo">${esc(q.p)}</h2><div>` +
      q.ops.map((o, k) => `<button class="op${r != null ? (k === q.ok ? ' certa' : k === r ? ' errada' : '') : ''}" data-k="${k}"${r != null ? ' disabled' : ''}>${esc(o)}</button>`).join('') + '</div>';
    if (r != null) {
      const certo = r === q.ok, g = certo ? (it.revisao ? XP_REVISAO : XP_CERTA) : 0;
      h += `<div class="resposta"><b>${certo ? 'Isso mesmo.' : 'Não foi essa.'}</b>${g ? `<span class="xp">+${g} XP</span>` : ''}<br>${esc(q.ex)}${!certo && !it.revisao ? '<br><span class="suave">Essa pergunta volta no fim da seção, valendo 5 XP.</span>' : ''}</div>`;
    }
    foot = `<button class="btn principal" id="go"${r == null ? ' disabled' : ''}>${r == null ? 'Escolha uma resposta' : 'Continuar'}</button>`;
  } else if (S.fase === 'fimsec') {
    h += `<span class="rotulo">Seção ${S.sec + 1} concluída</span><h1 class="titulo">${esc(sec.titulo)}</h1><p class="texto"><span style="font-size:18px">Você somou <b>${S.ganhosSec} XP</b> nesta seção.</span></p>`;
    foot = `<button class="btn" id="voltar">Parar aqui</button><button class="btn principal" id="go">Próxima: ${esc(L.secoes[S.sec + 1].titulo)}</button>`;
  } else if (S.fase === 'fim') {
    h += `<div class="fim-vj" aria-hidden="true">${VJ.comemorando}</div><span class="rotulo">Lição concluída</span><h1 class="titulo">${esc(L.titulo)}</h1>
      <div class="grande">+${S.ganhos} XP</div><p style="font-size:18px;line-height:28px">${S.acertos} de ${S.total} perguntas certas de primeira, mais ${XP_LICAO} XP por terminar a lição.</p>
      <div class="peca nova"><div class="sv" aria-hidden="true">${VJ.parado}</div><div><span class="rotulo">Peça nova na coleção</span><div class="titulo" style="font-size:20px">${esc(L.lugar)}</div><span style="font-size:14px;font-weight:600">${esc(L.periodo)}</span></div></div>`;
    foot = `<button class="btn principal" id="voltar">Voltar ao caminho</button>`;
  }
  $('#rolar').innerHTML = h; $('#rolar').scrollTop = 0; $('#rodape').innerHTML = foot;
  const go = $('#go'); if (go) go.onclick = avancar;
  const vt = $('#voltar'); if (vt) vt.onclick = () => { location.hash = ''; home(); };
  app.querySelectorAll('.op').forEach(b => b.onclick = () => responder(+b.dataset.k));
  if (S.fase === 'intro' || S.fase === 'ler' || primeira) foco(sec, !primeira);
}
function pedirEnergia(seguir){
  if (feita(S.lic.id)) return seguir(); // revisar não gasta energia
  const e = energia(), depois = Math.max(0, e - 1);
  const fundo = document.createElement('div'); fundo.className = 'fundo';
  fundo.innerHTML = `<div class="dialogo" role="dialog" aria-modal="true" aria-labelledby="dlgT">
    <h2 id="dlgT">${e ? `Começar a seção ${S.sec + 1}?` : 'Sua energia acabou por hoje'}</h2>
    <p>${e ? `Ler uma seção gasta 1 energia. Você tem ${e} de ${ENERGIA_MAX} e vai ficar com ${depois}.` : 'Ela volta a 5 à meia-noite.'} Revisar lições que você já fez não gasta energia.</p>
    <div class="hexes" aria-hidden="true">${Array.from({length: ENERGIA_MAX}, (_, i) => hex(i < depois, 30, i === depois && e ? ' stroke-dasharray="2 1.5"' : '').replace('#FFF6E3', '#0F1A22').replace('#6F8796', '#0F1A22').replace('fill="none"', 'fill="#FFFFFF"')).join('')}</div>
    <button class="btn principal" id="dlgOk">${e ? 'Começar a leitura' : 'Continuar mesmo assim (protótipo)'}</button>
    <button class="btn link" id="dlgNao">Agora não</button></div>`;
  document.body.append(fundo);
  const fechar = () => fundo.remove();
  fundo.querySelector('#dlgOk').onclick = () => { if (e) J.energia.n = depois; save(); fechar(); seguir(); };
  fundo.querySelector('#dlgNao').onclick = fechar;
  fundo.onclick = ev => { if (ev.target === fundo) fechar(); };
  fundo.querySelector('#dlgOk').focus();
}
function avancar(){
  const L = S.lic;
  if (S.fase === 'intro') return pedirEnergia(() => { S.fase = 'ler'; S.fila = perguntasDa(L.secoes[S.sec]); render(); });
  if (S.fase === 'ler') { S.fase = 'perg'; S.qi = 0; S.resp = null; S.ganhosSec = 0; }
  else if (S.fase === 'perg') {
    S.qi++; S.resp = null;
    if (S.qi >= S.fila.length) {
      const r = J.licoes[L.id] || (J.licoes[L.id] = {feita:false, acertos:0, total:0, secao:0});
      if (S.sec + 1 < L.secoes.length) { r.secao = S.sec + 1; S.fase = 'fimsec'; }
      else { S.ganhos += XP_LICAO; J.xp += XP_LICAO; r.feita = true; r.secao = 0; r.acertos = S.acertos; r.total = S.total; S.fase = 'fim'; }
      save();
    }
  } else if (S.fase === 'fimsec') {
    S.sec++;
    return pedirEnergia(() => { S.fase = 'ler'; S.fila = perguntasDa(L.secoes[S.sec]); render(); });
  }
  render();
}
function responder(k){
  if (S.resp != null) return;
  const it = S.fila[S.qi], certo = k === it.q.ok;
  S.resp = k;
  if (!it.revisao) { S.total++; if (certo) S.acertos++; }
  if (certo) { const g = it.revisao ? XP_REVISAO : XP_CERTA; J.xp += g; S.ganhos += g; S.ganhosSec += g; }
  else if (!it.revisao) S.fila.push({q: it.q, i: it.i, revisao: true});
  marcaDia(); save(); render();
}
addEventListener('resize', () => { if (S && mapaEl) foco(S.lic.secoes[S.sec], false); });
addEventListener('keydown', e => { if (e.key === 'Escape') { const f = document.querySelector('.fundo'); if (f) f.remove(); } });

// ---------- rotas simples ----------
function rota(){
  const m = location.hash.match(/^#licao\/(.+)$/);
  if (m && LIC[m[1]]) { if (!S || S.lic.id !== m[1]) abrir(m[1]); }
  else home();
}
addEventListener('hashchange', () => { if (!location.hash) home(); });
energia(); topo(); rota();
})();
