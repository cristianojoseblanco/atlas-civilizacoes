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
    <span class="ano" id="ano"></span><span class="esquema-tag" id="esquema" hidden>Esquema ilustrativo</span><div class="regua-t" id="reguaT" hidden></div>`;
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

// ---------- leitura parágrafo a parágrafo ----------
let S = 0, P = 0;
function cenasAte(s, p){ return CENAS.filter(c => c.secao < s || (c.secao === s && c.paragrafo <= p)); }
function reconstruir(s, p){
  // repõe o estado do mapa até o parágrafo anterior sem animação, e anima o parágrafo atual
  $('#fx').innerHTML = ''; limpa('.anc'); vjEl = null; $('#reguaT').hidden = true;
  const ant = cenasAte(s, p).filter(c => !(c.secao === s && c.paragrafo === p));
  ant.forEach(c => { if (c.acao === 'camera' || c.acao === 'ano' || PERSISTE.has(c.acao) || c.acao === 'apaga') E[c.acao](c.args, false); });
  // um efeito "apaga" só some com o que veio antes dele
  tocar(s, p);
}
async function tocar(s, p){
  limpa('.transiente'); document.querySelectorAll('.transiente-svg').forEach(e => e.remove()); $('#reguaT').hidden = true;
  const cs = CENAS.filter(c => c.secao === s && c.paragrafo === p);
  if (p === 0 && !cs.some(c => c.acao === 'ano')) E.ano([L.secoes[s].ano], false);
  const cam = cs.find(c => c.acao === 'camera');
  if (cam) { E.camera(cam.args, true); await espera(900); }
  cs.filter(c => c.acao !== 'camera').forEach(c => E[c.acao](c.args, true));
  $('#esquema').hidden = !document.querySelector('.esquema');
}
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
}
function irPara(s, p){ S = s; P = p; texto(); reconstruir(S, P); $('#palco').scrollTop = 0; }

montaMapa();
addEventListener('resize', () => { medir(); poeCamera(cam); });
irPara(0, 0);
})();
