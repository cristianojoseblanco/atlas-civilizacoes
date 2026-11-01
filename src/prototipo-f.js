(() => {
// Protótipo F: a lição é lida parágrafo a parágrafo, e cada parágrafo dispara uma cena no mapa 2D.
// O roteiro das cenas vem de data/licoes/cenas/<lição>.csv (auditável). Camadas marcadas "esquema" são ilustrativas.
const $ = s => document.querySelector(s);
const esc = x => String(x ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const md = x => esc(x).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches;
const L = DADOS.licao, M = DADOS.mapa, LUG = DADOS.lugares, CENAS = DADOS.cenas, VJ = DADOS.vj;
const NS = 'http://www.w3.org/2000/svg';
const anoTxt = a => a < 0 ? `${Math.abs(a)} a.C.` : `${a} d.C.`;
const proj = (lon, lat) => [(lon - M.lon0) * M.kx, (M.lat1 - lat) * M.k];
const pl = id => { const l = LUG[id]; return proj(l.lon, l.lat); };
const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const espera = ms => new Promise(r => setTimeout(r, reduzir ? 0 : ms));
// gerador pseudoaleatório fixo: o esquema fica igual a cada visita
const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; });

// ---------- ícones (traço de tabuleiro) ----------
const ICO = {
  casa: '<path d="M-7 3V-2L0-8 7-2V3Z" fill="#E9C99A" stroke="#0F1A22" stroke-width="2" stroke-linejoin="round"/><path d="M-2 3V-1H2V3" fill="#0F1A22"/>',
  zigurate: '<path d="M-16 8H16L13 2H-13ZM-11 2H11L8-4H-8ZM-6-4H6L4-10H-4Z" fill="#F2B33D" stroke="#0F1A22" stroke-width="2.4" stroke-linejoin="round"/><path d="M-1.5 8V-10" stroke="#0F1A22" stroke-width="2"/>',
  cidade: '<path d="M-12 8V-2H-6V-7H0V-2H6V-5H12V8Z" fill="#E9C99A" stroke="#0F1A22" stroke-width="2.4" stroke-linejoin="round"/>',
  graos: '<path d="M0 8V-8" stroke="#8A5A0B" stroke-width="2"/><path d="M0-6l-4-3M0-6l4-3M0-1l-4-3M0-1l4-3M0 4l-4-3M0 4l4-3" stroke="#C98A12" stroke-width="2.4" stroke-linecap="round"/>',
  gente: '<circle cy="-5" r="4" fill="#D9A27C" stroke="#0F1A22" stroke-width="2"/><path d="M-7 9V5q0-6 7-6t7 6v4Z" fill="#2A9D8F" stroke="#0F1A22" stroke-width="2"/>',
  ferramenta: '<path d="M-7 7L4-4" stroke="#0F1A22" stroke-width="3" stroke-linecap="round"/><path d="M1-8l7 7-3 3-7-7Z" fill="#9AA6B2" stroke="#0F1A22" stroke-width="2" stroke-linejoin="round"/>',
  templo: '<path d="M-9 8V-1H9V8ZM-11-1L0-9 11-1Z" fill="#F6E7C8" stroke="#0F1A22" stroke-width="2" stroke-linejoin="round"/>',
  saco: '<path d="M-6 8q-3 0-2-6l2-4h6l2 4q1 6-2 6Z" fill="#E9C99A" stroke="#0F1A22" stroke-width="2" stroke-linejoin="round"/><path d="M-3-2h6" stroke="#0F1A22" stroke-width="2"/>',
  coroa: '<path d="M-10 6L-11-6-5-1 0-9 5-1 11-6 10 6Z" fill="#F2B33D" stroke="#0F1A22" stroke-width="2.2" stroke-linejoin="round"/>',
};
const icone = (k, sz = 1) => `<g transform="scale(${sz})">${ICO[k]}</g>`;

// ---------- mapa e câmera ----------
let W = 0, H = 0, cam = {x: 0, y: 0, s: 1}, camAnim = null;
const ancoras = []; // elementos HTML presos a um ponto do mapa
function montaMapa(){
  const el = $('#mapa');
  el.innerHTML = `<svg class="campo" id="campo"><g id="cam">${M.svg}<g id="fx"></g></g></svg><div class="sobre" id="sobre"></div>
    <span class="ano" id="ano"></span><span class="esquema-tag" id="esquema" hidden>Esquema ilustrativo</span><div class="regua-t" id="reguaT" hidden></div><div class="tarefa" id="tarefa" hidden aria-live="polite"></div>`;
  medir();
}
function medir(){ const r = $('#mapa').getBoundingClientRect(); W = r.width; H = r.height; $('#campo').setAttribute('viewBox', `0 0 ${W} ${H}`); }
const escalaBase = () => Math.max(W / M.w, H / M.h);
function poeCamera(c){
  cam = c;
  $('#cam').setAttribute('transform', `translate(${W / 2 - c.x * c.s} ${H / 2 - c.y * c.s}) scale(${c.s})`);
  $('#cam').style.setProperty('--inv', 1 / c.s);
  // longe, os marcadores encolhem um pouco para as cidades vizinhas não se atropelarem
  $('#cam').style.setProperty('--sz', Math.max(.5, Math.min(1, c.s / (escalaBase() * 4.5))));
  ancoras.forEach(a => { const [sx, sy] = tela(a.x, a.y); a.el.style.transform = `translate(${sx}px, ${sy}px)`; });
}
const tela = (x, y) => [(x - cam.x) * cam.s + W / 2, (y - cam.y) * cam.s + H / 2];
function vaiCamera(lon, lat, z, anim){
  const [x, y] = proj(lon, lat), alvo = {x, y, s: escalaBase() * z};
  cancelAnimationFrame(camAnim);
  if (!anim || reduzir) return poeCamera(alvo);
  const de = {...cam}, t0 = performance.now(), dur = 1500;
  // zoom em escala logarítmica, para a aproximação parecer constante
  const f = t => { const k = Math.min(1, (t - t0) / dur), e = easeIO(k);
    poeCamera({x: de.x + (alvo.x - de.x) * e, y: de.y + (alvo.y - de.y) * e, s: Math.exp(Math.log(de.s) + (Math.log(alvo.s) - Math.log(de.s)) * e)});
    if (k < 1) camAnim = requestAnimationFrame(f); };
  camAnim = requestAnimationFrame(f);
}
// marcador SVG em coordenadas do mapa que mantém o tamanho na tela
function marca(x, y, html, cls){
  const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'mk ' + (cls || ''));
  g.style.transform = `translate(${x}px, ${y}px) scale(calc(var(--inv) * var(--sz, 1)))`;
  g.innerHTML = `<g class="dentro">${html}</g>`; $('#fx').appendChild(g); return g;
}
function ancora(x, y, html, cls){
  const d = document.createElement('div'); d.className = 'anc ' + (cls || ''); d.innerHTML = html; $('#sobre').appendChild(d);
  const a = {x, y, el: d}; ancoras.push(a); const [sx, sy] = tela(x, y); d.style.transform = `translate(${sx}px, ${sy}px)`; return d;
}
function limpa(seletor){
  document.querySelectorAll(seletor).forEach(e => { const i = ancoras.findIndex(a => a.el === e); if (i >= 0) ancoras.splice(i, 1); e.remove(); });
}
const surge = (el, d = 0, anim = true) => { if (!anim) return; el.querySelector('.dentro, .vin, .chip-m, :scope > *')?.animate([{transform: 'scale(0)', opacity: 0}, {transform: 'scale(1.18)', opacity: 1, offset: .6}, {transform: 'scale(1)', opacity: 1}], {duration: 520, delay: d, easing: 'cubic-bezier(0.23,1,0.32,1)', fill: 'backwards'}); };
const some = (el, d = 0) => { el.animate([{opacity: 1}, {opacity: 0}], {duration: 400, delay: d, fill: 'forwards'}).onfinish = () => el.remove(); };

// ---------- efeitos ----------
const PERSISTE = new Set(['aldeias', 'surge', 'campo', 'absorve', 'templo', 'canais', 'cresce', 'territorio', 'rivais', 'muralha', 'governante']);
const E = {
  camera([lon, lat, z], anim){ vaiCamera(+lon, +lat, +z, anim); },
  ano([a, b], anim){ const el = $('#ano'); if (!anim) { el.textContent = anoTxt(+(b ?? a)); return; } contaAno(el, +a, +(b ?? a), 1600); },
  aldeias(ids, anim){ ids.forEach((id, i) => { const [x, y] = pl(id); const g = marca(x, y, `${icone('casa', 1.1)}<text class="rot-s" x="10" y="4">${esc(LUG[id].nome)}</text>`, 'aldeia'); surge(g, i * 160, anim); }); },
  apaga([q], anim){ document.querySelectorAll('.' + (q === 'aldeias' ? 'aldeia' : q)).forEach((e, i) => anim ? some(e, i * 40) : e.remove()); },
  surge([id], anim){
    const [x, y] = pl(id);
    const g = marca(x, y, `<circle class="pegada" r="12"/>${icone('zigurate', 1)}<text class="rot-g" x="0" y="34" text-anchor="middle">${esc(LUG[id].nome)}</text>`, 'cidade c-' + id);
    if (anim) { anel(x, y, 0); anel(x, y, 280); anel(x, y, 560); g.querySelector('.dentro').animate([{transform: 'translateY(-60px)', opacity: 0}, {transform: 'translateY(4px)', opacity: 1, offset: .7}, {transform: 'none'}], {duration: 800, easing: 'cubic-bezier(0.23,1,0.32,1)', fill: 'backwards'}); }
    viajante(id, anim);
  },
  regua([a, b, c], anim){
    const r = $('#reguaT'); r.hidden = false;
    const lento = (+b - +a), rapido = (+c - +b), tot = +c - +a, pb = lento / tot * 100;
    r.innerHTML = `<div class="trilho"><i class="lento" style="width:${pb}%"></i><i class="rapido" style="left:${pb}%;width:${100 - pb}%"></i><b class="cursor"></b></div>
      <div class="marcas"><span style="left:0">${anoTxt(+a)}</span><span class="m2" style="left:${pb}%">${anoTxt(+b)}</span><span class="m3" style="left:100%">${anoTxt(+c)}</span></div>
      <div class="durs"><span class="d1" style="left:${pb / 2}%">${fmtAnos(lento)} de mudança lenta</span><span class="d2" style="left:${pb + (100 - pb) / 2}%">${fmtAnos(rapido)}</span></div>`;
    const cur = r.querySelector('.cursor');
    if (!anim) { cur.style.left = '100%'; return; }
    cur.animate([{left: '0%'}, {left: pb + '%', offset: .82}, {left: '100%'}], {duration: 4200, easing: 'linear', fill: 'forwards'});
    r.querySelector('.lento').animate([{transform: 'scaleX(0)'}, {transform: 'scaleX(1)'}], {duration: 3450, easing: 'linear', fill: 'backwards'});
    r.querySelector('.rapido').animate([{transform: 'scaleX(0)'}, {transform: 'scaleX(1)'}], {duration: 750, delay: 3450, easing: 'linear', fill: 'backwards'});
    r.querySelector('.d1').animate([{opacity: 0}, {opacity: 1}], {duration: 400, delay: 1200, fill: 'backwards'});
    r.querySelector('.d2').animate([{opacity: 0, transform: 'translate(-50%,6px) scale(.8)'}, {opacity: 1, transform: 'translate(-50%,0) scale(1.15)', offset: .6}, {opacity: 1, transform: 'translate(-50%,0)'}], {duration: 500, delay: 4200, fill: 'backwards'});
  },
  ciclo([id], anim){
    const [x, y] = pl(id), itens = [['graos', 'excedente'], ['gente', 'população'], ['ferramenta', 'técnica'], ['templo', 'organização']];
    const d = ancora(x, y, `<div class="ciclo"><svg viewBox="-110 -110 220 220" class="seta-c"><circle r="78" fill="none" stroke="#0F1A22" stroke-width="3" stroke-dasharray="10 12"/><path d="M78 0l-9-12M78 0l10-11M-78 0l9 12M-78 0l-10 11M0 78l12-9M0 78l11 10M0-78l-12 9M0-78l-11-10" stroke="#0F1A22" stroke-width="3" stroke-linecap="round"/></svg>${itens.map(([k, n], i) => `<div class="no-c" style="--a:${i * 90 - 45}deg"><svg viewBox="-16 -16 32 32">${icone(k, 1.2)}</svg><span>${n}</span></div>`).join('')}</div>`, 'transiente');
    if (anim) d.querySelectorAll('.no-c').forEach((n, i) => n.animate([{opacity: 0, transform: 'rotate(var(--a)) translateX(30px) rotate(calc(-1 * var(--a))) scale(.4)'}, {opacity: 1}], {duration: 500, delay: i * 220, easing: 'cubic-bezier(0.23,1,0.32,1)', fill: 'backwards'}));
  },
  graos([id], anim){
    const [x, y] = pl(id), r = rnd(); const n = 16;
    for (let i = 0; i < n; i++) {
      const ang = r() * Math.PI * 2, dist = (70 + r() * 70) / cam.s;
      const g = marca(x + Math.cos(ang) * dist, y + Math.sin(ang) * dist, icone('graos', .9), 'transiente-svg');
      if (!anim) { g.remove(); continue; }
      const dx = -Math.cos(ang) * dist * cam.s, dy = -Math.sin(ang) * dist * cam.s;
      g.querySelector('.dentro').animate([{transform: 'scale(0)', opacity: 0}, {transform: 'scale(1)', opacity: 1, offset: .25}, {transform: 'scale(1)', opacity: 1, offset: .55}, {transform: `translate(${dx}px, ${dy}px) scale(.3)`, opacity: 0}], {duration: 2200, delay: i * 90, easing: 'cubic-bezier(0.77,0,0.175,1)', fill: 'both'});
    }
    if (anim) setTimeout(() => pulsa(id), 1800);
  },
  campo([id, n], anim){
    const [x, y] = pl(id), r = rnd();
    for (let i = 0; i < +n; i++) {
      const ang = (i / +n) * Math.PI * 2 + r() * .3, dist = (55 + r() * 80) / cam.s;
      const g = marca(x + Math.cos(ang) * dist, y + Math.sin(ang) * dist, icone('casa', .85), 'casinha esquema');
      g.dataset.dx = -Math.cos(ang) * dist; g.dataset.dy = -Math.sin(ang) * dist;
      surge(g, i * 45, anim);
    }
  },
  selo([id, txt], anim){ const [x, y] = pl(id); const d = ancora(x, y, `<span class="chip-m">${esc(txt)}</span>`, 'transiente selo-m'); surge(d, 600, anim); },
  fluxo([id], anim){
    if (!anim) return;
    const [x, y] = pl(id), casas = [...document.querySelectorAll('.casinha')];
    casas.forEach((c, i) => {
      const dx = +c.dataset.dx, dy = +c.dataset.dy, cx = x - dx, cy = y - dy;
      [0, 1].forEach(onda => {
        const p = marca(cx, cy, '<circle r="4.5" fill="#F2B33D" stroke="#0F1A22" stroke-width="1.6"/>', 'transiente-svg');
        p.querySelector('.dentro').animate([{transform: 'none', opacity: 0}, {opacity: 1, offset: .15}, {transform: `translate(${dx * cam.s}px, ${dy * cam.s}px)`, opacity: 1, offset: .9}, {opacity: 0}], {duration: 1600, delay: i * 70 + onda * 1700, easing: 'ease-in', fill: 'both'});
        const q = marca(x, y, '<rect x="-3" y="-3" width="6" height="6" fill="#2A9D8F" stroke="#0F1A22" stroke-width="1.4"/>', 'transiente-svg');
        q.querySelector('.dentro').animate([{transform: 'none', opacity: 0}, {opacity: 1, offset: .2}, {transform: `translate(${-dx * cam.s}px, ${-dy * cam.s}px)`, opacity: 0}], {duration: 1800, delay: 900 + i * 140 + onda * 1700, easing: 'ease-out', fill: 'both'});
      });
    });
    const [lx, ly] = [x, y];
    const leg = ancora(lx, ly, '<div class="leg-fluxo"><span><i class="g"></i>comida sobe</span><span><i class="p"></i>produtos descem</span></div>', 'transiente'); surge(leg, 400, true);
  },
  templo([id, rot], anim){
    const c = document.querySelector('.c-' + id); if (c) { c.classList.add('com-templo'); if (anim) c.querySelector('.dentro').animate([{transform: 'scale(1)'}, {transform: 'scale(1.5)', offset: .4}, {transform: 'scale(1.25)'}], {duration: 700, easing: 'cubic-bezier(0.23,1,0.32,1)', fill: 'forwards'}); else c.querySelector('.dentro').style.transform = 'scale(1.25)'; }
    limpa('.rot-templo'); const [x, y] = pl(id); const d = ancora(x, y, `<span class="chip-m escuro">${esc(rot)}</span>`, 'rot-templo'); surge(d, 300, anim);
  },
  racoes([id], anim){
    if (!anim) return; const [x, y] = pl(id), r = rnd();
    for (let i = 0; i < 12; i++) { const ang = r() * Math.PI * 2, dist = 30 + r() * 30;
      const g = marca(x, y, icone('saco', .7), 'transiente-svg');
      g.querySelector('.dentro').animate([{transform: 'scale(0)', opacity: 0}, {transform: 'scale(1)', opacity: 1, offset: .2}, {transform: `translate(${Math.cos(ang) * dist}px, ${Math.sin(ang) * dist}px) scale(1)`, opacity: 1, offset: .8}, {transform: `translate(${Math.cos(ang) * dist}px, ${Math.sin(ang) * dist}px) scale(.8)`, opacity: 0}], {duration: 1800, delay: i * 120, easing: 'cubic-bezier(0.23,1,0.32,1)', fill: 'both'}); }
  },
  canais([id], anim){
    const [x, y] = pl(id), r = rnd(), g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'canais esquema'); $('#fx').prepend(g);
    let d = '';
    for (let i = 0; i < 7; i++) { const ang = -2.4 + i * .55 + r() * .2, l1 = (40 + r() * 30) / cam.s, l2 = (90 + r() * 50) / cam.s;
      const x1 = x + Math.cos(ang) * l1, y1 = y + Math.sin(ang) * l1, x2 = x + Math.cos(ang + .25) * l2, y2 = y + Math.sin(ang + .25) * l2;
      d += `<path pathLength="1" d="M${x} ${y}Q${x1} ${y1} ${x2} ${y2}"/>`; }
    g.innerHTML = d;
    if (anim) g.querySelectorAll('path').forEach((p, i) => p.animate([{strokeDashoffset: 1}, {strokeDashoffset: 0}], {duration: 1100, delay: i * 140, easing: 'cubic-bezier(0.23,1,0.32,1)', fill: 'backwards'}));
  },
  cresce([id, rot], anim){
    const c = document.querySelector('.c-' + id); if (!c) return; const p = c.querySelector('.pegada');
    if (anim) p.animate([{r: 12}, {r: 44}], {duration: 1800, easing: 'cubic-bezier(0.23,1,0.32,1)', fill: 'forwards'}); else p.setAttribute('r', 44);
    p.setAttribute('r', 44);
    limpa('.rot-area'); const [x, y] = pl(id); const d = ancora(x, y, `<span class="chip-m ouro">${esc(rot)}</span>`, 'rot-area'); surge(d, 900, anim);
  },
  absorve([id], anim){
    document.querySelectorAll('.casinha').forEach((g, i) => {
      if (!anim) return g.remove();
      const a = g.querySelector('.dentro').animate([{transform: 'none', opacity: 1}, {transform: `translate(${g.dataset.dx * cam.s}px, ${g.dataset.dy * cam.s}px) scale(.3)`, opacity: 0}], {duration: 1200, delay: 600 + i * 60, easing: 'cubic-bezier(0.77,0,0.175,1)', fill: 'forwards'});
      a.onfinish = () => g.remove();
    });
    if (anim) setTimeout(() => pulsa(id), 2200);
  },
  vinheta([id, tipo], anim){ limpa('.vinheta'); const [x, y] = pl(id); const d = ancora(x, y, `<div class="vin v-${tipo}">${VINHETAS[tipo]}</div>`, 'vinheta transiente'); surge(d, 0, anim); if (anim) d.querySelector('.vin').classList.add('roda'); },
  territorio([id], anim){
    const [x, y] = pl(id), r = rnd(), pts = [];
    for (let i = 0; i < 14; i++) { const ang = i / 14 * Math.PI * 2, rr = (30 + r() * 10) / cam.s; pts.push([x + Math.cos(ang) * rr, y + Math.sin(ang) * rr * .8]); }
    const g = document.createElementNS(NS, 'path'); g.setAttribute('class', 'territorio esquema');
    g.setAttribute('d', 'M' + pts.map(p => p.map(n => n.toFixed(2)).join(' ')).join('L') + 'Z'); $('#fx').prepend(g);
    if (anim) g.animate([{opacity: 0, transform: `translate(${x}px,${y}px) scale(.6) translate(${-x}px,${-y}px)`}, {opacity: 1, transform: 'none'}], {duration: 900, easing: 'cubic-bezier(0.23,1,0.32,1)', fill: 'backwards'});
  },
  rivais(ids, anim){ ids.forEach((id, i) => { const [x, y] = pl(id); const g = marca(x, y, `${icone('cidade', .8)}<text class="rot-m" x="0" y="22" text-anchor="middle">${esc(LUG[id].nome)}</text>`, 'rival'); surge(g, 300 + i * 260, anim); if (anim) setTimeout(() => anel(x, y, 0, true), 300 + i * 260); }); },
  muralha([id], anim){
    const c = document.querySelector('.c-' + id); if (!c) return;
    const w = document.createElementNS(NS, 'circle'); w.setAttribute('r', 54); w.setAttribute('class', 'muralha'); w.setAttribute('pathLength', '1'); c.querySelector('.dentro').prepend(w);
    if (anim) w.animate([{strokeDashoffset: 1}, {strokeDashoffset: 0}], {duration: 1600, delay: 1800, easing: 'cubic-bezier(0.23,1,0.32,1)', fill: 'backwards'});
  },
  governante([id], anim){ const c = document.querySelector('.c-' + id); if (!c) return; const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'coroa'); g.innerHTML = `<g transform="translate(0 -24)">${icone('coroa', 1)}</g>`; c.querySelector('.dentro').appendChild(g); if (anim) g.animate([{transform: 'translateY(-30px)', opacity: 0}, {transform: 'translateY(3px)', opacity: 1, offset: .7}, {transform: 'none'}], {duration: 700, delay: 200, easing: 'cubic-bezier(0.23,1,0.32,1)', fill: 'backwards'}); },
};
const fmtAnos = n => n >= 1000 ? `${(n / 1000).toLocaleString('pt-BR', {maximumFractionDigits: 1})} mil anos` : `${n} anos`;
function anel(x, y, d, peq){ if (reduzir) return; const g = marca(x, y, `<circle r="${peq ? 10 : 16}" fill="none" stroke="#0F1A22" stroke-width="2.5"/>`, 'anel'); g.querySelector('.dentro').animate([{transform: 'scale(.4)', opacity: .9}, {transform: `scale(${peq ? 3 : 4.5})`, opacity: 0}], {duration: 1300, delay: d, easing: 'cubic-bezier(0.23,1,0.32,1)', fill: 'both'}).onfinish = () => g.remove(); }
function pulsa(id){ const c = document.querySelector('.c-' + id); if (c) c.querySelector('.dentro').animate([{filter: 'none'}, {filter: 'drop-shadow(0 0 10px #F2B33D)'}, {filter: 'none'}], {duration: 900}); const [x, y] = pl(id); anel(x, y, 0); }
function contaAno(el, de, para, ms){
  if (reduzir) { el.textContent = anoTxt(para); return; }
  const t0 = performance.now(); cancelAnimationFrame(el._f);
  const f = t => { const k = Math.min(1, (t - t0) / ms), e = easeIO(k); el.textContent = anoTxt(Math.round((de + (para - de) * e) / 50) * 50); if (k < 1) el._f = requestAnimationFrame(f); else el.textContent = anoTxt(para); };
  el._f = requestAnimationFrame(f); el.animate([{transform: 'scale(1)'}, {transform: 'scale(1.08)'}, {transform: 'scale(1)'}], {duration: ms});
}
let vjEl = null;
function viajante(id, anim){
  const [x, y] = pl(id);
  if (!vjEl) { vjEl = ancora(x, y, `<div class="vj"><span class="p">${VJ.parado}</span><span class="a">${VJ.andando}</span></div>`, 'vj-anc'); }
  const a = ancoras.find(q => q.el === vjEl); a.x = x; a.y = y; poeCamera(cam);
  if (anim) { const v = vjEl.querySelector('.vj'); v.classList.add('andando'); let t = setInterval(() => v.classList.toggle('passo'), 160); v.animate([{transform: 'translateX(-120px)', opacity: 0}, {opacity: 1, offset: .3}, {transform: 'none', opacity: 1}], {duration: 1400, delay: 500, easing: 'cubic-bezier(0.23,1,0.32,1)', fill: 'backwards'}); setTimeout(() => { clearInterval(t); v.classList.remove('andando', 'passo'); }, 1900); }
}

// ---------- vinhetas: pequenas cenas desenhadas presas à cidade ----------
const tok = (x, y, f) => `<circle cx="${x}" cy="${y}" r="7" fill="${f}" stroke="#0F1A22" stroke-width="2"/>`;
const VINHETAS = {
  contas: `<svg viewBox="0 0 200 110"><rect x="10" y="20" width="180" height="70" rx="10" fill="#E9C99A" stroke="#0F1A22" stroke-width="3"/>${[0, 1, 2, 3, 4, 5].map(i => `<g class="pop" style="--i:${i}">${tok(36 + i * 26, 55, i % 2 ? '#C98A12' : '#9AA6B2')}</g>`).join('')}</svg><p>Rações para milhares: cada coisa contada e anotada.</p>`,
  sessenta: `<svg viewBox="0 0 200 110">${Array.from({length: 60}, (_, i) => `<circle class="pop" style="--i:${i % 12}" cx="${22 + (i % 12) * 14 + Math.floor((i % 12) / 2) * 4}" cy="${20 + Math.floor(i / 12) * 16}" r="5" fill="${['#F2B33D', '#2A9D8F', '#E9C99A', '#E5644A', '#9AA6B2', '#C98A12'][Math.floor((i % 12) / 2)]}" stroke="#0F1A22" stroke-width="1.5"/>`).join('')}</svg><p>Base 60: reparte em 2, 3, 4, 5, 6, 10, 12, 15, 20 e 30.</p>`,
  balanca: `<svg viewBox="0 0 200 110"><path d="M100 18V96M70 100h60" stroke="#0F1A22" stroke-width="4" stroke-linecap="round"/><g class="braco"><path d="M40 34H160" stroke="#0F1A22" stroke-width="4" stroke-linecap="round"/><path d="M28 60h28l-14-26zM144 60h28l-14-26z" fill="none" stroke="#0F1A22" stroke-width="2.5"/><g transform="translate(42 52)">${ICO.graos}</g><rect x="150" y="50" width="16" height="8" rx="2" fill="#D9DEE3" stroke="#0F1A22" stroke-width="2"/></g></svg><p>Cevada e prata servem de régua para o valor das coisas.</p>`,
  serie: `<svg viewBox="0 0 200 110">${[0, 1, 2, 3, 4].map(i => `<path class="pop" style="--i:${i}" d="M${22 + i * 34} 50h28l-5 26h-18z" fill="#E9C99A" stroke="#0F1A22" stroke-width="2.5" stroke-linejoin="round"/>`).join('')}</svg><p>Ração fixa, produção fixa: peças iguais, em série.</p>`,
  tigelas: `<svg viewBox="0 0 200 110">${[[30, 40], [70, 62], [112, 38], [150, 66], [92, 82], [48, 84]].map(([x, y], i) => `<path class="pop" style="--i:${i}" d="M${x} ${y}l30 0-6 16q-9 4-18 0z" fill="#E9C99A" stroke="#0F1A22" stroke-width="2.5" stroke-linejoin="round"/>`).join('')}</svg><p>Tigelas de borda chanfrada, aos milhares perto dos templos.</p>`,
  selo: `<svg viewBox="0 0 200 110"><rect x="20" y="62" width="160" height="26" rx="6" fill="#C98F5A" stroke="#0F1A22" stroke-width="3"/><g class="rola"><rect x="-14" y="30" width="28" height="34" rx="6" fill="#9AA6B2" stroke="#0F1A22" stroke-width="3"/><path d="M-8 40h16M-8 48h16M-8 56h16" stroke="#0F1A22" stroke-width="2"/></g><path class="marca-selo" d="M30 75h8l4-6 4 6h8l4-6 4 6h8l4-6 4 6h8l4-6 4 6h8l4-6 4 6h8" fill="none" stroke="#0F1A22" stroke-width="2.4"/></svg><p>O selo rolado na argila lacra o pote: ninguém mexe sem deixar sinal.</p>`,
  bula: `<svg viewBox="0 0 200 110"><circle cx="140" cy="55" r="34" fill="#C98F5A" stroke="#0F1A22" stroke-width="3"/>${[0, 1, 2].map(i => `<g class="entra" style="--i:${i}"><path d="M${26 + i * 22} ${48 + (i % 2) * 14}m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0" fill="${['#F2B33D', '#9AA6B2', '#2A9D8F'][i]}" stroke="#0F1A22" stroke-width="2"/></g>`).join('')}</svg><p>Fichas fechadas numa bola de argila lacrada: uma ordem de pagamento.</p>`,
  tablete: `<svg viewBox="0 0 200 110"><g class="acha"><rect x="60" y="22" width="80" height="66" rx="12" fill="#C98F5A" stroke="#0F1A22" stroke-width="3"/></g><g class="marcas-t"><path d="M74 40l6 6M86 40l6 6M74 56l6 6M110 40h18M110 52h18M110 64h12" stroke="#0F1A22" stroke-width="3" stroke-linecap="round"/></g></svg><p>A bola achata e vira tablete, com números ao lado do selo.</p>`,
  som: `<svg viewBox="0 0 200 110"><path d="M30 80L80 30M80 30H62M80 30v18" stroke="#0F1A22" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><text x="96" y="46" class="t1">"ti" = flecha</text><text x="96" y="76" class="t2">"ti" = vida</text></svg><p>O mesmo som, o mesmo sinal: a escrita passa a anotar a língua.</p>`,
  escola: `<svg viewBox="0 0 200 110">${[0, 1, 2, 3].map(i => `<rect class="pop" style="--i:${i}" x="${50 + i * 6}" y="${74 - i * 16}" width="90" height="18" rx="5" fill="#C98F5A" stroke="#0F1A22" stroke-width="2.5"/>`).join('')}</svg><p>Escolas de escribas e listas de palavras: profissões, animais, vasos.</p>`,
};

// ---------- câmera automática: perto quando o assunto é perto, longe quando é amplo ----------
const idsDe = cs => [...new Set(cs.flatMap(c => c.args.flatMap(a => a.split('|'))).filter(a => LUG[a]))];
function enquadra(ids, anim, extra = 1, baixo = 0){
  if (!ids.length) return;
  const ps = ids.map(pl), xs = ps.map(p => p[0]), ys = ps.map(p => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  if (baixo < 0) baixo = $('#tarefa').hidden ? 0 : $('#tarefa').offsetHeight + 28;
  const bw = Math.max(...xs) - Math.min(...xs), bh = Math.max(...ys) - Math.min(...ys), hu = H - baixo;
  // um lugar só: aproxima bem; vários: cabe tudo com folga para rótulos e o Viajante
  const z = (ids.length === 1 ? 5.2 : Math.max(1.15, Math.min(6, Math.min(W * .62 / Math.max(bw, 1), hu * .55 / Math.max(bh, 1)) / escalaBase()))) * extra;
  // com um cartão embaixo, o centro sobe para a parte livre do mapa
  const s = escalaBase() * z, y = cy + baixo / 2 / s;
  vaiCamera(cx / M.kx + M.lon0, M.lat1 - y / M.k, z, anim);
}

// ---------- interações no mapa (estilo Brilliant, sempre com o Viajante) ----------
let tarefaOk = true;
function cartao(html){
  document.body.classList.add('em-tarefa'); medir(); poeCamera(cam);
  const c = $('#tarefa'); c.hidden = false; c.dataset.vez = ''; c.innerHTML = html; c.animate([{transform: 'translateY(24px)', opacity: 0}, {transform: 'none', opacity: 1}], {duration: 360, easing: 'cubic-bezier(0.23,1,0.32,1)'});
  return c;
}
const fechaCartao = () => { const c = $('#tarefa'); c.hidden = true; c.innerHTML = ''; if (document.body.classList.contains('em-tarefa')) { document.body.classList.remove('em-tarefa'); medir(); poeCamera(cam); } };
function retornoT(ok, txt){ const r = $('#tarefa .ret'); r.className = 'ret ' + (ok ? 'ok' : 'erro'); r.innerHTML = txt; if (!ok) r.animate([{translate: '-6px'}, {translate: '6px'}, {translate: '0'}], {duration: 260}); }
function botoesT(verifica, revela){
  const b = $('#tarefa .bts'); b.innerHTML = `<button class="b3 peq" id="tVer" disabled>Verificar</button>`;
  $('#tVer').onclick = verifica;
  return {pronto: v => { $('#tVer').disabled = !v; }, errou: () => { b.innerHTML = `<button class="b3 peq branco" id="tRev">Ver resposta</button><button class="b3 peq" id="tDenovo">Tentar de novo</button>`; $('#tRev').onclick = revela; $('#tDenovo').onclick = () => { b.innerHTML = `<button class="b3 peq" id="tVer">Verificar</button>`; $('#tVer').onclick = verifica; $('#tarefa .ret').textContent = ''; }; }};
}
const kmEntre = (a, b) => { const R = 6371, r = Math.PI / 180, dl = (b[1] - a[1]) * r, dn = (b[0] - a[0]) * r; const h = Math.sin(dl / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dn / 2) ** 2; return Math.round(2 * R * Math.asin(Math.sqrt(h)) / 10) * 10; };
const doMapa = (sx, sy) => { const x = (sx - W / 2) / cam.s + cam.x, y = (sy - H / 2) / cam.s + cam.y; return [x / M.kx + M.lon0, M.lat1 - y / M.k]; };
function vjVai(x, y, cb){
  if (!vjEl) vjEl = ancora(cam.x - 60 / cam.s, cam.y, `<div class="vj"><span class="p">${VJ.parado}</span><span class="a">${VJ.andando}</span></div>`, 'vj-anc');
  const a = ancoras.find(q => q.el === vjEl), de = {x: a.x, y: a.y}, v = vjEl.querySelector('.vj'), t0 = performance.now(), dur = reduzir ? 1 : 900;
  v.classList.toggle('esq', x < de.x); v.classList.add('andando'); const pt = setInterval(() => v.classList.toggle('passo'), 140);
  const f = t => { const k = Math.min(1, (t - t0) / dur), e = easeIO(k); a.x = de.x + (x - de.x) * e; a.y = de.y + (y - de.y) * e; const [sx, sy] = tela(a.x, a.y); vjEl.style.transform = `translate(${sx}px, ${sy}px)`; if (k < 1) requestAnimationFrame(f); else { clearInterval(pt); v.classList.remove('andando', 'passo'); cb && cb(); } };
  requestAnimationFrame(f);
}
const I = {
  // toque onde ficava o lugar; o Viajante anda até o palpite
  achar(args){ return new Promise(fim => {
    const [alvo, ...quadro] = args;
    cartao(`<b class="perg">Toque no mapa onde você acha que ficava ${esc(LUG[alvo].nome)}.</b><div class="ret"></div><div class="bts"></div>`);
    enquadra([alvo, ...quadro], true, .85, -1);
    let palpite = null; const mapa = $('#mapa');
    const bt = botoesT(verifica, revela);
    const toque = e => { if (e.target.closest('#tarefa, button')) return; const r = mapa.getBoundingClientRect(); const sx = e.clientX - r.left, sy = e.clientY - r.top;
      palpite = doMapa(sx, sy); const [x, y] = proj(...palpite); limpa('.palpite'); const d = ancora(x, y, '<span class="alfinete"></span>', 'palpite'); surge(d, 0, true); vjVai(x - 26 / cam.s, y, null); bt.pronto(true); };
    mapa.addEventListener('pointerdown', toque); mapa.classList.add('mirando');
    function mostra(){ mapa.removeEventListener('pointerdown', toque); mapa.classList.remove('mirando'); const [x, y] = pl(alvo); if (palpite) { const [gx, gy] = proj(...palpite); linhaTracejada(gx, gy, x, y); } vjVai(x - 40 / cam.s, y, null); }
    function verifica(){ const d = kmEntre(palpite, [LUG[alvo].lon, LUG[alvo].lat]);
      if (d <= 150) { retornoT(true, `${d <= 40 ? 'Na mosca!' : 'Bem perto!'} Seu palpite ficou a cerca de ${d} km.`); mostra(); conclui(fim); }
      else { retornoT(false, `Ficou a cerca de ${d.toLocaleString('pt-BR')} km. Procure mais ao sul, entre os dois rios, perto do Golfo.`); bt.errou(); } }
    function revela(){ retornoT(true, `Aqui: no sul da Mesopotâmia, junto ao Eufrates.`); mostra(); conclui(fim); }
  }); },
  // arraste até onde cai uma data na régua do tempo
  regua([a, b, c]){ return new Promise(fim => {
    a = +a; b = +b; c = +c; const pct = (b - a) / (c - a) * 100;
    cartao(`<b class="perg">Arraste o marcador até onde fica ${anoTxt(b)}: quando Uruk vira cidade.</b><div class="regua-i"><div class="trilho-i"><b class="cur" id="rCur" style="left:20%"></b></div><div class="lim"><span>${anoTxt(a)}</span><span>${anoTxt(c)}</span></div></div><div class="ret"></div><div class="bts"></div>`);
    const tr = $('#tarefa .trilho-i'), cur = $('#rCur'); let v = 20; const bt = botoesT(verifica, revela); bt.pronto(true);
    const pos = e => { const r = tr.getBoundingClientRect(); v = Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)); cur.style.left = v + '%'; cur.dataset.ano = anoTxt(Math.round((a + (c - a) * v / 100) / 100) * 100); };
    let arr = false; tr.addEventListener('pointerdown', e => { arr = true; tr.setPointerCapture(e.pointerId); pos(e); }); tr.addEventListener('pointermove', e => arr && pos(e)); tr.addEventListener('pointerup', () => arr = false);
    cur.dataset.ano = anoTxt(Math.round((a + (c - a) * .2) / 100) * 100);
    function verifica(){ if (Math.abs(v - pct) <= 7) { retornoT(true, `Isso: quase no fim. Foram ${fmtAnos(b - a)} de aldeias e só ${fmtAnos(c - b)} até a cidade.`); fecha(); } else { retornoT(false, v < pct ? 'Mais para a direita: as aldeias duraram muito mais tempo.' : 'Um pouco mais para a esquerda.'); bt.errou(); } }
    function revela(){ cur.style.left = pct + '%'; retornoT(true, `Fica quase no fim: ${fmtAnos(b - a)} de aldeias, depois ${fmtAnos(c - b)}.`); fecha(); }
    function fecha(){ cur.style.left = pct + '%'; cur.dataset.ano = anoTxt(b); setTimeout(() => E.regua([a, b, c], true), 700); conclui(fim); }
  }); },
  // quantas de 5 pessoas ficavam no campo
  pessoas([id, certo]){ return new Promise(fim => {
    certo = +certo;
    cartao(`<b class="perg">De cada 5 pessoas, quantas você acha que ainda viviam no campo, produzindo comida?</b><div class="pessoas-i">${Array.from({length: 5}, (_, i) => `<svg viewBox="-12 -14 24 26" data-i="${i}">${ICO.gente}</svg>`).join('')}</div><input type="range" min="0" max="5" value="0" id="pRg" aria-label="Pessoas no campo"><div class="pv" id="pv">Mexa no controle</div><div class="ret"></div><div class="bts"></div>`);
    const bt = botoesT(verifica, revela); let v = 0, mexeu = false;
    const pinta = () => { document.querySelectorAll('.pessoas-i svg').forEach((s, i) => s.classList.toggle('campo-p', i < v)); $('#pv').textContent = `${v} de 5 no campo (${v * 20}%)`;
      document.querySelectorAll('.casinha').forEach((g, i) => g.classList.toggle('acesa', mexeu && i / document.querySelectorAll('.casinha').length < v / 5)); };
    $('#pRg').oninput = e => { v = +e.target.value; mexeu = true; pinta(); bt.pronto(true); };
    function verifica(){ if (v === certo) { retornoT(true, `Talvez ${certo} em cada 5 (${certo * 20}%). A cidade era uma minoria sustentada pelo campo.`); conclui(fim); } else { retornoT(false, v > certo ? 'Se todos plantassem, quem faria o resto?' : 'O campo ainda era a grande maioria.'); bt.errou(); } }
    function revela(){ v = certo; mexeu = true; $('#pRg').value = certo; pinta(); retornoT(true, `Talvez ${certo} em cada 5 (${certo * 20}%).`); conclui(fim); }
  }); },
  // leve água do rio aos campos: cada toque desenha um canal
  canais([id, n]){ return new Promise(fim => {
    n = +n; const [x, y] = pl(id), r = rnd();
    cartao(`<b class="perg">Os canais eram o retorno mais concreto da cidade para o campo. Toque nos ${n} campos secos para levar água até eles.</b><div class="ret"></div><div class="bts"></div>`);
    enquadra([id], true, 1, -1);
    $('#tarefa .bts').innerHTML = `<span class="conta" id="cConta">0 de ${n}</span>`;
    let feitos = 0;
    setTimeout(() => {
      for (let i = 0; i < n; i++) { const ang = -Math.PI + (i + .5) * Math.PI / n + (r() - .5) * .3, dist = (95 + r() * 20) / cam.s, fx = x + Math.cos(ang) * dist, fy = y + Math.sin(ang) * dist;
        const d = ancora(fx, fy, `<button class="campo-seco" aria-label="Campo seco ${i + 1}"><svg viewBox="-20 -14 40 28"><ellipse rx="18" ry="11" fill="#C9A97A" stroke="#0F1A22" stroke-width="2.5"/><path d="M-10-3h6M-2 3h8M2-5h7" stroke="#8A6A40" stroke-width="2" stroke-linecap="round"/></svg></button>`, 'campo-a'); surge(d, i * 150, true);
        d.querySelector('button').onclick = () => { const b = d.querySelector('button'); if (b.classList.contains('regado')) return; b.classList.add('regado');
          const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'canais esquema'); g.innerHTML = `<path pathLength="1" d="M${x} ${y}Q${(x + fx) / 2 + (fy - y) * .2} ${(y + fy) / 2 - (fx - x) * .2} ${fx} ${fy}"/>`; $('#fx').prepend(g);
          g.querySelector('path').animate([{strokeDashoffset: 1}, {strokeDashoffset: 0}], {duration: 900, easing: 'cubic-bezier(0.23,1,0.32,1)', fill: 'backwards'});
          vjVai(fx - 26 / cam.s, fy, null);
          feitos++; $('#cConta').textContent = `${feitos} de ${n}`;
          if (feitos === n) { retornoT(true, 'Os campos viraram verde: num lugar plano e de rios instáveis, só uma organização central conseguia isso.'); conclui(fim); } };
      } }, 900);
  }); },
  // toque as etapas na ordem
  ordem([id, ...ks]){ return new Promise(fim => {
    const [x, y] = pl(id), nomes = {selo: 'Selo na argila', bula: 'Fichas na bula', tablete: 'Tablete com números'}, mist = [ks[2], ks[0], ks[1]];
    cartao(`<b class="perg">Toque nas três etapas na ordem em que aconteceram.</b><div class="ret"></div><div class="bts"></div>`);
    enquadra([id], true, 1, -1);
    const bt = botoesT(verifica, revela); let fila = [];
    const lado = Math.min(150, W * .32), pos = [[-lado, -40], [0, -120], [lado, -40]];
    mist.forEach((k, i) => { const d = ancora(x, y, `<button class="etapa" data-k="${k}" style="left:${pos[i][0]}px;top:${pos[i][1]}px"><span class="num"></span>${VIN_MINI[k]}<span class="nm">${nomes[k]}</span></button>`, 'etapa-a transiente'); surge(d, i * 160, true);
      d.querySelector('button').onclick = e => { const b = e.currentTarget, k2 = b.dataset.k; if (fila.includes(k2)) fila = fila.filter(q => q !== k2); else fila.push(k2); marca(); bt.pronto(fila.length === ks.length); }; });
    const marca = () => document.querySelectorAll('.etapa').forEach(b => { const i = fila.indexOf(b.dataset.k); b.querySelector('.num').textContent = i >= 0 ? i + 1 : ''; b.classList.toggle('sel', i >= 0); });
    function verifica(){ const ok = fila.every((k, i) => k === ks[i]); document.querySelectorAll('.etapa').forEach(b => b.classList.add(ks[fila.indexOf(b.dataset.k)] === b.dataset.k ? 'certa' : 'errada'));
      if (ok) { retornoT(true, 'Selo, depois fichas na bula, depois o tablete: as marcas de fora acabaram bastando.'); setTimeout(() => limpa('.etapa-a'), 1400); conclui(fim); } else { retornoT(false, 'Comece pelo que já existia antes de qualquer marca: o selo.'); bt.errou(); } }
    function revela(){ fila = [...ks]; marca(); document.querySelectorAll('.etapa').forEach(b => { b.classList.remove('errada'); b.classList.add('certa'); }); retornoT(true, 'Selo, bula, tablete.'); setTimeout(() => limpa('.etapa-a'), 1400); conclui(fim); }
    document.querySelectorAll('.etapa').forEach(b => b.addEventListener('click', () => document.querySelectorAll('.etapa').forEach(x2 => x2.classList.remove('certa', 'errada'))));
  }); },
  // rébus: o sinal pelo som
  som([id]){ return new Promise(fim => {
    const ops = [['sol', SIN.sol], ['flecha', SIN.flecha], ['cevada', SIN.cevada], ['peixe', SIN.peixe]];
    cartao(`<b class="perg">Em sumério, "flecha" soava parecido com "vida". Que sinal o escriba usaria para escrever "vida"?</b><div class="sinais-i">${ops.map(([k, s]) => `<button data-k="${k}">${s}<span>${k}</span></button>`).join('')}</div><div class="ret"></div><div class="bts"></div>`);
    const bt = botoesT(verifica, revela); let esc_ = null;
    document.querySelectorAll('.sinais-i button').forEach(b => b.onclick = () => { document.querySelectorAll('.sinais-i button').forEach(x => x.classList.remove('sel', 'errada')); b.classList.add('sel'); esc_ = b.dataset.k; bt.pronto(true); });
    function verifica(){ const b = document.querySelector('.sinais-i .sel'); if (esc_ === 'flecha') { b.classList.add('certa'); retornoT(true, 'A flecha: mesmo som, mesmo sinal.'); conclui(fim); } else { b.classList.add('errada'); retornoT(false, 'Não pense no desenho. Pense no som.'); bt.errou(); } }
    function revela(){ document.querySelector('.sinais-i [data-k="flecha"]').classList.add('certa'); retornoT(true, 'A flecha.'); conclui(fim); }
  }); },
  // quais cidades já existiam? (verdadeiras|distratoras)
  cidades(args){ return new Promise(fim => {
    const [v, f] = args.join(',').split('|').map(s => s.split(',')); const todas = [...v, ...f].sort();
    cartao(`<b class="perg">Toque nas cidades que já existiam por volta de 3100 a.C., vizinhas e rivais de Uruk.</b><div class="ret"></div><div class="bts"></div>`);
    enquadra([...todas, 'L002'], true, 1, -1);
    const bt = botoesT(verifica, revela); const sel = new Set();
    limpa('.rot-templo');
    setTimeout(() => { todas.forEach((id, i) => { const [x, y] = pl(id); const d = ancora(x, y, `<button class="cand" data-id="${id}"><i></i><span>${esc(LUG[id].nome)}</span></button>`, 'cand-a'); surge(d, i * 90, true);
      d.querySelector('button').onclick = e => { const b = e.currentTarget; if (b.disabled) return; if (sel.has(id)) sel.delete(id); else sel.add(id); b.classList.toggle('sel', sel.has(id)); bt.pronto(sel.size > 0); }; });
      setTimeout(() => desencavala('.cand'), todas.length * 90 + 600); }, 1700);
    function verifica(){ const erradas = [...sel].filter(id => !v.includes(id)), faltam = v.filter(id => !sel.has(id));
      document.querySelectorAll('.cand').forEach(b => { const id = b.dataset.id; b.classList.remove('certa', 'errada'); if (sel.has(id)) b.classList.add(v.includes(id) ? 'certa' : 'errada'); });
      if (!erradas.length && !faltam.length) { retornoT(true, 'Isso. As outras só surgiriam séculos depois.'); termina(); }
      else { retornoT(false, erradas.length ? `${erradas.map(id => LUG[id].nome).join(', ')} ainda não existia${erradas.length > 1 ? 'm' : ''}.` : `Falta${faltam.length > 1 ? 'm' : ''} ${faltam.length}.`); bt.errou(); } }
    function revela(){ retornoT(true, `Já existiam: ${v.map(id => LUG[id].nome).join(', ')}.`); termina(); }
    function termina(){ document.querySelectorAll('.cand').forEach(b => { b.disabled = true; const id = b.dataset.id; if (!v.includes(id)) { b.classList.add('depois'); b.querySelector('span').textContent = `${LUG[id].nome} · ${anoTxt(LUG[id].ano)}`; } });
      setTimeout(() => { limpa('.cand-a'); E.rivais(v, true); f.forEach(id => { const [x, y] = pl(id); const d = ancora(x, y, `<span class="futura">${esc(LUG[id].nome)}<br>${anoTxt(LUG[id].ano)}</span>`, 'futura-a transiente'); surge(d, 0, true); }); }, 1600);
      conclui(fim); }
  }); },
};
// no silêncio (voltar a um parágrafo já lido), a interação deixa só o resultado
const I_SILENCIO = { cidades(args){ const [v] = args.join(',').split('|').map(s => s.split(',')); E.rivais(v, false); }, canais(){} };
function conclui(fim){
  tarefaOk = true; base(); const b = $('#tarefa .bts'); if (b) b.innerHTML = '';
  // o retorno fica um pouco à vista e o cartão sai, liberando o mapa para a cena seguinte
  const c = $('#tarefa'), marca = c.dataset.vez = String(Math.random());
  setTimeout(() => { if (c.dataset.vez !== marca || c.hidden) return; c.animate([{opacity: 1, transform: 'none'}, {opacity: 0, transform: 'translateY(16px)'}], {duration: 300, easing: 'ease-in'}).onfinish = () => { if (c.dataset.vez === marca) fechaCartao(); }; }, 2200);
  setTimeout(() => fim(), 300);
}
// afasta rótulos que se sobrepõem, com uma linha até o ponto verdadeiro
function desencavala(sel){
  const tf = $('#tarefa'), limite = tf.hidden ? 1e9 : tf.getBoundingClientRect().top - 6;
  const bs = [...document.querySelectorAll(sel)].map(b => ({b, r: b.getBoundingClientRect(), dy: 0})).sort((a, c) => a.r.top - c.r.top);
  bs.forEach((o, i) => { for (let j = 0; j < i; j++) { const p = bs[j], top = o.r.top + o.dy, pt = p.r.top + p.dy;
    if (o.r.left < p.r.right + 4 && o.r.right > p.r.left - 4 && top < pt + p.r.height + 4 && top + o.r.height > pt - 4) {
      o.dy = pt + p.r.height + 6 - o.r.top;
      // sem espaço embaixo (cartão da tarefa), o rótulo sobe para cima do vizinho
      if (o.r.top + o.dy + o.r.height > limite) o.dy = pt - o.r.height - 6 - o.r.top; } } });
  bs.forEach(o => { if (!o.dy) return; o.b.style.marginTop = o.dy + 'px'; o.b.insertAdjacentHTML('beforebegin', `<span class="guia" style="height:${Math.abs(o.dy)}px;${o.dy < 0 ? `top:${o.dy}px` : ''}"></span>`); });
}
function linhaTracejada(x1, y1, x2, y2){ const g = document.createElementNS(NS, 'line'); g.setAttribute('class', 'tracejada transiente-svg'); g.setAttribute('x1', x1); g.setAttribute('y1', y1); g.setAttribute('x2', x2); g.setAttribute('y2', y2); $('#fx').appendChild(g); }
const SIN = {
  flecha: '<svg viewBox="0 0 60 60" fill="none"><path d="M8 52L50 10M50 10H30M50 10v20" stroke="#0F1A22" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  sol: '<svg viewBox="0 0 60 60" fill="none"><circle cx="30" cy="30" r="11" stroke="#0F1A22" stroke-width="5"/><path d="M30 6v7M30 47v7M6 30h7M47 30h7M13 13l5 5M42 42l5 5M47 13l-5 5M18 42l-5 5" stroke="#0F1A22" stroke-width="4.5" stroke-linecap="round"/></svg>',
  cevada: '<svg viewBox="0 0 60 60" fill="none"><path d="M30 56V12" stroke="#0F1A22" stroke-width="5" stroke-linecap="round"/><path d="M30 18l-9-7M30 18l9-7M30 30l-9-7M30 30l9-7M30 42l-9-7M30 42l9-7" stroke="#0F1A22" stroke-width="4.5" stroke-linecap="round"/></svg>',
  peixe: '<svg viewBox="0 0 60 60" fill="none"><path d="M8 30q14-16 32 0q-18 16-32 0zM40 30l12-10v20z" stroke="#0F1A22" stroke-width="5" stroke-linejoin="round"/></svg>',
};
const VIN_MINI = {
  selo: '<svg viewBox="0 0 60 44"><rect x="6" y="28" width="48" height="12" rx="3" fill="#C98F5A" stroke="#0F1A22" stroke-width="2.5"/><rect x="22" y="4" width="16" height="24" rx="4" fill="#9AA6B2" stroke="#0F1A22" stroke-width="2.5"/></svg>',
  bula: '<svg viewBox="0 0 60 44"><circle cx="30" cy="22" r="17" fill="#C98F5A" stroke="#0F1A22" stroke-width="2.5"/><circle cx="24" cy="20" r="4" fill="#F2B33D" stroke="#0F1A22" stroke-width="1.8"/><circle cx="35" cy="26" r="4" fill="#2A9D8F" stroke="#0F1A22" stroke-width="1.8"/></svg>',
  tablete: '<svg viewBox="0 0 60 44"><rect x="12" y="4" width="36" height="36" rx="6" fill="#C98F5A" stroke="#0F1A22" stroke-width="2.5"/><path d="M19 13l4 4M27 13l4 4M34 13h8M34 21h8M19 28h20" stroke="#0F1A22" stroke-width="2.4" stroke-linecap="round"/></svg>',
};

// ---------- leitura parágrafo a parágrafo ----------
let S = 0, P = 0;
function cenasAte(s, p){ return CENAS.filter(c => c.secao < s || (c.secao === s && c.paragrafo <= p)); }
function reconstruir(s, p){
  // repõe o estado do mapa até o parágrafo anterior sem animação, e anima o parágrafo atual
  $('#fx').innerHTML = ''; limpa('.anc'); vjEl = null; $('#reguaT').hidden = true; fechaCartao();
  const ant = cenasAte(s, p).filter(c => !(c.secao === s && c.paragrafo === p));
  ant.forEach(c => { if (c.acao[0] === '?') { const k = c.acao.slice(1); if (I_SILENCIO[k]) I_SILENCIO[k](c.args); }
    else if (c.acao === 'ano' || PERSISTE.has(c.acao) || c.acao === 'apaga') E[c.acao](c.args, false); });
  // a câmera parte do enquadramento do parágrafo anterior
  const prev = ant.filter(c => c.secao === s || ant.every(x => x.secao < s)); const ids = idsDe(prev.length ? prev.slice(-6) : ant.slice(-6));
  if (ids.length) enquadra(ids, false); else vaiCamera(44, 33, 1.3, false);
  tocar(s, p);
}
let vez = 0;
async function tocar(s, p){
  const minha = ++vez;
  limpa('.transiente'); document.querySelectorAll('.transiente-svg').forEach(e => e.remove()); $('#reguaT').hidden = true; fechaCartao();
  const cs = CENAS.filter(c => c.secao === s && c.paragrafo === p);
  if (p === 0 && !cs.some(c => c.acao === 'ano')) E.ano([L.secoes[s].ano], false);
  tarefaOk = !cs.some(c => c.acao[0] === '?'); base();
  // a cena anda em blocos: efeitos juntos até uma interação, que espera o jogador
  let bloco = [];
  const roda = async () => { if (!bloco.length) return; const cam = bloco.find(c => c.acao === 'camera');
    if (cam) E.camera(cam.args, true); else { const ids = idsDe(bloco.filter(c => c.acao !== 'apaga')); if (ids.length && !jaVisivel(ids)) enquadra(ids, true); }
    await espera(ids0(bloco) && !jaVisivel(idsDe(bloco)) ? 900 : 0); if (minha !== vez) return; bloco.filter(c => c.acao !== 'camera').forEach(c => E[c.acao](c.args, true)); bloco = []; };
  for (const c of cs) {
    if (c.acao[0] === '?') { await roda(); if (minha !== vez) return; await I[c.acao.slice(1)](c.args); if (minha !== vez) return; }
    else bloco.push(c);
  }
  await roda();
  $('#esquema').hidden = !document.querySelector('.esquema');
}
// um lugar só que já está bem à vista não move a câmera: o contexto que acabou de aparecer continua na tela
const jaVisivel = ids => ids.length === 1 && cam.s >= escalaBase() * 2.4 && (([sx, sy]) => sx > W * .2 && sx < W * .8 && sy > H * .15 && sy < H * .75)(tela(...pl(ids[0])));
const ids0 = b => b.some(c => c.acao === 'camera') || idsDe(b).length > 0;
function texto(){
  const sec = L.secoes[S];
  $('#secoes').innerHTML = L.secoes.map((x, i) => `<button class="${i < S ? 'feita' : i === S ? 'atual' : ''}" data-s="${i}" aria-label="Seção ${i + 1}: ${esc(x.titulo)}"></button>`).join('');
  $('#secoes').querySelectorAll('button').forEach(b => b.onclick = () => irPara(+b.dataset.s, 0));
  $('#palco').innerHTML = `<div class="rot">Seção ${S + 1} de ${L.secoes.length} · ${anoTxt(sec.ano)}</div><h1 class="titulo">${esc(sec.titulo)}</h1>` +
    sec.paragrafos.map((t, i) => `<p class="txt${i === P ? ' agora' : ''}${i > P ? ' depois' : ''}" data-p="${i}">${md(t)}</p>`).join('');
  $('#palco').querySelectorAll('.txt').forEach(el => el.onclick = () => { const i = +el.dataset.p; if (i <= P) { P = i; marcaAgora(); reconstruir(S, P); } });
  base();
}
function marcaAgora(){
  $('#palco').querySelectorAll('.txt').forEach(el => { const i = +el.dataset.p; el.classList.toggle('agora', i === P); el.classList.toggle('depois', i > P); });
  const a = $('#palco').querySelector('.agora'); if (a) a.scrollIntoView({behavior: reduzir ? 'auto' : 'smooth', block: 'center'});
  base();
}
function base(){
  const sec = L.secoes[S], ult = P >= sec.paragrafos.length - 1, fimTudo = ult && S >= L.secoes.length - 1;
  $('#baseDentro').innerHTML = `<span class="dica">${ult ? (fimTudo ? 'Fim da lição.' : 'Fim da seção. No app, aqui vêm as perguntas.') : `Parágrafo ${P + 1} de ${sec.paragrafos.length}`}</span><button class="b3 ouro" id="acao">${ult ? (fimTudo ? 'Recomeçar' : 'Próxima seção') : 'Continuar'}</button>`;
  $('#acao').onclick = () => { if (!ult) { P++; marcaAgora(); tocar(S, P); } else irPara(fimTudo ? 0 : S + 1, 0); };
  if (!tarefaOk) { $('#acao').disabled = true; $('#acao').textContent = 'Responda no mapa'; }
}
function irPara(s, p){ S = s; P = p; texto(); reconstruir(S, P); $('#palco').scrollTop = 0; }

montaMapa();
addEventListener('resize', () => { medir(); poeCamera(cam); });
irPara(0, 0);
})();
