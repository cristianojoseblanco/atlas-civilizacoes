(() => {
const $ = s => document.querySelector(s);
const app = $('#app');
const esc = x => String(x ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const md = x => esc(x).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const NIV = [['iniciante','Iniciante'],['colegio','Colégio'],['graduacao','Graduação']];
const RANK = {iniciante:1, colegio:2, graduacao:3};
const XP_CERTA = 10, XP_REVISAO = 5, XP_LICAO = 30;

// ---------- estado do jogador (no navegador por enquanto; depois no servidor) ----------
let J = {xp:0, dias:[], nivel:'colegio', licoes:{}};
try { const s = JSON.parse(localStorage.getItem('atlas-jogo') || 'null'); if (s) J = Object.assign(J, s); } catch (e) {}
const save = () => { try { localStorage.setItem('atlas-jogo', JSON.stringify(J)); } catch (e) {} paintTop(); };
const hoje = () => new Date().toLocaleDateString('sv-SE');
function marcaDia(){ const d = hoje(); if (!J.dias.includes(d)) { J.dias.push(d); J.dias = J.dias.slice(-400); } }
function sequencia(){
  const set = new Set(J.dias); let n = 0, d = new Date();
  if (!set.has(d.toLocaleDateString('sv-SE'))) d.setDate(d.getDate() - 1);
  while (set.has(d.toLocaleDateString('sv-SE'))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
const nivelJog = xp => Math.floor(Math.sqrt(xp / 40)) + 1;
const xpDoNivel = n => (n - 1) * (n - 1) * 40;
function paintTop(){ $('#sXp').textContent = J.xp.toLocaleString('pt-BR'); $('#sDias').textContent = sequencia(); }
const feita = id => J.licoes[id] && J.licoes[id].feita;
const LIC = LICOES.licoes;
const reqOk = it => it.requisitos.every(id => feita(id) || !LIC[id]);
function unidadeAberta(u){ return u.requisitos.every(uid => { const v = LICOES.unidades.find(x => x.id === uid); return v && v.licoes.filter(l => l.publicada).every(l => feita(l.id)); }); }

function fontesTxt(refs){
  return (refs || []).filter(f => FONTES[f.id]).map(f => { const F = FONTES[f.id];
    const t = `${esc(F.autores)}${F.ano ? ' (' + esc(F.ano) + ')' : ''}, <i>${esc(F.titulo)}</i>${f.loc ? ', ' + esc(f.loc) : ''}`;
    return F.url ? `<a href="${esc(F.url)}" target="_blank" rel="noopener">${t}</a>` : t; }).join(' · ');
}

// ---------- início: caminho das unidades ----------
function home(){
  const xp = J.xp, n = nivelJog(xp), a = xpDoNivel(n), b = xpDoNivel(n + 1);
  const feitas = Object.values(J.licoes).filter(x => x.feita).length;
  let h = `<div class="hero"><div><div class="k">Curso</div><h1>Oriente Antigo</h1>
    <p class="mute" style="margin-top:8px;max-width:56ch">Das primeiras aldeias ao império persa, em lições com texto, mapa e perguntas. Cada acerto vale XP.</p></div>
    <div><div class="k" style="margin-bottom:8px">Nível das perguntas</div><div class="chips" id="niv">${NIV.map(([id, nm]) => `<button class="chip${J.nivel === id ? ' on' : ''}" data-n="${id}">${nm}</button>`).join('')}</div></div></div>
    <div class="prof">
      <div class="pbox"><span>Nível do jogador</span><b>${n}</b><div class="lvbar"><i style="width:${Math.round((xp - a) / (b - a) * 100)}%"></i></div><span>${(b - xp).toLocaleString('pt-BR')} XP para o nível ${n + 1}</span></div>
      <div class="pbox"><span>Sequência</span><b>${sequencia()} ${sequencia() === 1 ? 'dia' : 'dias'}</b><span>estudando sem parar</span></div>
      <div class="pbox"><span>Lições concluídas</span><b>${feitas}</b><span>de ${LICOES.unidades.reduce((s, u) => s + u.licoes.length, 0)} no curso</span></div>
    </div>`;
  LICOES.unidades.forEach((u, ui) => {
    const aberta = unidadeAberta(u) || u.licoes.some(l => l.publicada);
    h += `<section class="unit${aberta ? '' : ' lock'}"><div class="unit-h"><div><div class="k">Unidade ${ui + 1} · ${esc(u.periodo)}</div><h2>${esc(u.titulo)}</h2></div></div>
      <p class="mute" style="font-size:14px">${esc(u.descricao)}</p><div class="path">`;
    u.licoes.forEach(l => {
      let cls = 'soon', ic = '·', sub = 'Em preparação';
      if (l.publicada) {
        if (feita(l.id)) { cls = 'done'; ic = '✓'; const r = J.licoes[l.id]; sub = `Concluída · ${r.acertos} de ${r.total} certas`; }
        else if (reqOk(l)) { cls = 'open'; ic = '▶'; sub = J.licoes[l.id] && J.licoes[l.id].secao ? `Parou na seção ${J.licoes[l.id].secao + 1}` : `${LIC[l.id].secoes.length} seções · com perguntas`; }
        else { cls = 'lock'; ic = '×'; sub = 'Conclua as lições anteriores'; }
      }
      h += `<button class="node ${cls}" data-id="${l.id}"${cls === 'open' || cls === 'done' ? '' : ' disabled'}><span class="ic">${ic}</span><span>${esc(l.titulo)}<small>${sub}</small></span></button>`;
    });
    h += '</div></section>';
  });
  h += `<p class="mute" style="font-size:13px;margin-top:20px">Por enquanto o progresso fica salvo só neste navegador. Contas, energia diária e a versão completa chegam com o login.</p>`;
  app.innerHTML = h; scrollTo(0, 0);
  app.querySelectorAll('#niv .chip').forEach(b => b.onclick = () => { J.nivel = b.dataset.n; save(); home(); });
  app.querySelectorAll('.node').forEach(b => b.onclick = () => abrir(b.dataset.id));
}

// ---------- lição ----------
let S = null; // {lic, sec, fase:'intro'|'ler'|'perg'|'fimsec'|'fim', fila, qi, resp, ganhos, acertos, total}
function abrir(id){
  const lic = LIC[id]; if (!lic) return;
  const r = J.licoes[id] || {};
  S = {lic, sec: r.feita ? 0 : (r.secao || 0), fase: 'intro', ganhos: 0, acertos: 0, total: 0};
  location.hash = 'licao/' + id; render();
}
function perguntasDa(sec){
  const lim = RANK[J.nivel] || 2;
  return sec.perguntas.filter(q => (RANK[q.nivel] || 2) <= lim).map((q, i) => ({q, i, revisao: false}));
}
function mapaLink(sec){
  if (!sec.foco || !sec.foco.length) return '';
  const f = sec.foco.map(c => c.join(',')).join(';');
  return `<a class="navlink" style="display:inline-flex" href="index.html#ano=${sec.ano ?? ''}&foco=${encodeURIComponent(f)}${sec.zoom ? '&zoom=' + sec.zoom : ''}" target="_blank" rel="noopener">Ver no mapa ↗</a>`;
}
function progresso(){
  const n = S.lic.secoes.length;
  return `<div class="prog">${S.lic.secoes.map((_, k) => `<i class="${k < S.sec || S.fase === 'fim' ? 'done' : k === S.sec ? 'cur' : ''}"></i>`).join('')}</div>`;
}
function render(){
  const L = S.lic, sec = L.secoes[S.sec];
  let h = `<div class="row" style="justify-content:space-between;margin-bottom:6px"><button class="navlink" id="voltar" style="background:none;cursor:pointer">← Caminho</button><span class="mute" style="font-size:13px">${esc(L.titulo)}</span></div>` + progresso();
  let foot = '';
  if (S.fase === 'intro') {
    h += `<div class="k">Lição · ${esc(L.periodo)}</div><h1 style="margin:6px 0 14px">${esc(L.titulo)}</h1>
      <p class="mute" style="margin-bottom:16px">${esc(L.lugar)}</p>
      <div class="box"><b style="color:var(--gold2)">Objetivo.</b> ${esc(L.objetivo)}</div>
      <ol style="margin:22px 0 0 20px;line-height:1.9;font-size:16px">${L.secoes.map(s => `<li>${esc(s.titulo)} <span class="mute" style="font-size:13px">· ${Math.max(2, Math.round(s.palavras / 200))} min de leitura</span></li>`).join('')}</ol>
      <p class="src">Lição escrita para o atlas a partir de: ${fontesTxt(L.fontes)}.</p>`;
    foot = `<button class="btn primary" id="go">${S.sec ? 'Continuar da seção ' + (S.sec + 1) : 'Começar a leitura'}</button>`;
  } else if (S.fase === 'ler') {
    h += `<div class="k">Seção ${S.sec + 1} de ${L.secoes.length}</div><h1 style="margin:6px 0 18px">${esc(sec.titulo)}</h1>
      <div class="reader">${sec.paragrafos.map(p => `<p>${md(p)}</p>`).join('')}</div>
      <div class="row" style="margin-top:4px">${mapaLink(sec)}</div>
      <p class="src">Fontes: ${fontesTxt(sec.fontes)}</p>`;
    foot = `<button class="btn primary" id="go">Responder ${S.fila.length} perguntas</button>`;
  } else if (S.fase === 'perg') {
    const it = S.fila[S.qi], q = it.q, r = S.resp;
    h += `<div class="k">Seção ${S.sec + 1} · pergunta ${S.qi + 1} de ${S.fila.length}${it.revisao ? ' · revisão' : ''}</div>
      <h2 style="margin:10px 0 20px;font-size:26px">${esc(q.p)}</h2>` +
      q.ops.map((o, k) => `<button class="q-op${r != null ? (k === q.ok ? ' ok' : k === r ? ' bad' : '') : ''}" data-k="${k}"${r != null ? ' disabled' : ''}>${esc(o)}</button>`).join('');
    if (r != null) {
      const certo = r === q.ok, ganho = certo ? (it.revisao ? XP_REVISAO : XP_CERTA) : 0;
      h += `<div class="fb ${certo ? 'ok' : 'bad'}"><b>${certo ? 'Isso mesmo.' : 'Não foi essa.'}</b>${ganho ? `<span class="xp">+${ganho} XP</span>` : ''} ${esc(q.ex)}${!certo && !it.revisao ? '<br><span class="mute" style="font-size:13px">Essa pergunta volta no fim da seção.</span>' : ''}</div>`;
    }
    foot = `<button class="btn primary" id="go"${r == null ? ' disabled' : ''}>${r == null ? 'Escolha uma resposta' : 'Continuar'}</button>`;
  } else if (S.fase === 'fimsec') {
    h += `<div class="k">Seção ${S.sec + 1} concluída</div><h1 style="margin:6px 0 14px">${esc(sec.titulo)}</h1>
      <p style="font-size:17px">Você somou <b style="color:var(--gold2)">${S.ganhosSec} XP</b> nesta seção.</p>`;
    foot = `<button class="btn" id="sair">Parar aqui</button><button class="btn primary" id="go">Próxima seção: ${esc(L.secoes[S.sec + 1].titulo)}</button>`;
  } else if (S.fase === 'fim') {
    h += `<div class="k">Lição concluída</div><h1 style="margin:6px 0 10px">${esc(L.titulo)}</h1>
      <div class="big">+${S.ganhos} XP</div>
      <p style="font-size:17px;margin:10px 0 20px">${S.acertos} de ${S.total} perguntas certas de primeira, mais o bônus de ${XP_LICAO} XP por terminar a lição.</p>
      <div class="box"><b style="color:var(--gold2)">Para lembrar.</b> ${esc(L.objetivo)}</div>`;
    foot = `<button class="btn primary" id="sair">Voltar ao caminho</button>`;
  }
  app.innerHTML = h + `<div class="foot">${foot}</div>`;
  scrollTo(0, 0);
  $('#voltar').onclick = () => { S = null; location.hash = ''; home(); };
  const go = $('#go'); if (go) go.onclick = avancar;
  const sair = $('#sair'); if (sair) sair.onclick = () => { S = null; location.hash = ''; home(); };
  app.querySelectorAll('.q-op').forEach(b => b.onclick = () => responder(+b.dataset.k));
}
function avancar(){
  const L = S.lic;
  if (S.fase === 'intro') { S.fase = 'ler'; S.fila = perguntasDa(L.secoes[S.sec]); }
  else if (S.fase === 'ler') { S.fase = 'perg'; S.qi = 0; S.resp = null; S.ganhosSec = 0; }
  else if (S.fase === 'perg') {
    S.qi++; S.resp = null;
    if (S.qi >= S.fila.length) {
      const r = J.licoes[L.id] || (J.licoes[L.id] = {feita:false, acertos:0, total:0, secao:0});
      if (S.sec + 1 < L.secoes.length) { r.secao = S.sec + 1; S.fase = 'fimsec'; }
      else {
        S.ganhos += XP_LICAO; J.xp += XP_LICAO;
        r.feita = true; r.secao = 0; r.acertos = S.acertos; r.total = S.total; S.fase = 'fim';
      }
      save();
    }
  } else if (S.fase === 'fimsec') { S.sec++; S.fase = 'ler'; S.fila = perguntasDa(L.secoes[S.sec]); }
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

// ---------- rotas simples ----------
function rota(){
  const m = location.hash.match(/^#licao\/(.+)$/);
  if (m && LIC[m[1]]) { if (!S || S.lic.id !== m[1]) abrir(m[1]); }
  else home();
}
window.addEventListener('hashchange', () => { if (!location.hash) { S = null; home(); } });
paintTop(); rota();
})();
