(() => {
const $ = s => document.querySelector(s);
const canvas = $('#map'), ctx = canvas.getContext('2d');
const N = SNAP_YEARS.length;

// ---------- utilidades ----------
function fmtYear(y){
  y = Math.round(y);
  const a = Math.abs(y);
  const n = a >= 10000 ? (Math.round(a/100)/10).toLocaleString('pt-BR') + ' mil' : String(a);
  return y < 0 ? n + ' a.C.' : (y < 1000 ? n + ' d.C.' : n);
}
function hash(s){ let h = 2166136261; for (let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
const CIV_BY_KEY = {}; CIVS.forEach(c => c.keys.forEach(k => CIV_BY_KEY[k] = c));
const FOLK = /hunter|gatherer|farmers|pastoral|nomad|culture|tribes|peoples|complex|focus|aboriginal|khoisan|bantu|austronesian|neolithic|foraging|semites|dravidian|papuan|shellfish|chiefdoms|horizon|tradition|^\s*\??\s*$/i;
function hueFor(name){ const c = CIV_BY_KEY[name]; return hash(c ? c.pt : name) % 360; }
function eraFor(y){ return ERAS.find(e => y <= e.ate); }
const isFolk = name => !CIV_BY_KEY[name] && FOLK.test(name);
const PT_RULES = [
  [/^(.*?)\s*hunter-gatherers$/i, (m, x) => 'Caçadores-coletores' + (x ? ' (' + x + ')' : '')],
  [/^Hunters-gatherers$/i, () => 'Caçadores-coletores'],
  [/^(.*?)\s*pastoral nomads$/i, (m, x) => 'Nômades pastoris' + (x ? ' (' + x + ')' : '')],
  [/^(.*?)\s*pastoralists$/i, (m, x) => 'Pastores' + (x ? ' (' + x + ')' : '')],
  [/^(.*?)\s*farmers$/i, (m, x) => 'Agricultores' + (x ? ' (' + x + ')' : '')],
  [/^(.*?)\s*culture$/i, (m, x) => 'Cultura ' + x],
  [/^(.*?)\s*tribes$/i, (m, x) => 'Tribos' + (x ? ' (' + x + ')' : '')],
  [/^(.*?)\s*peoples$/i, (m, x) => 'Povos' + (x ? ' (' + x + ')' : '')],
  [/^city-states$/i, () => 'Cidades-Estado'],
  [/^Hurrian Kingdoms$/i, () => 'Reinos hurritas'],
  [/^Semites$/i, () => 'Semitas'],
  [/^Dravidians$/i, () => 'Dravídicos'],
  [/^Austronesians$/i, () => 'Austronésios'],
  [/^Aboriginal tribes$/i, () => 'Aborígenes'],
];
function ptName(name){
  const c = CIV_BY_KEY[name]; if (c) return c.pt;
  for (const [re, f] of PT_RULES) { const m = name.match(re); if (m) return f(...m).replace(/\s+/g, ' ').trim(); }
  return name;
}

const OCC = {};
SNAP_YEARS.forEach(y => SNAPS[y].objects.r.geometries.forEach(g => {
  const n = g.properties && g.properties.NAME; if (!n) return;
  (OCC[n] = OCC[n] || []).push(y);
}));
for (const k in OCC) OCC[k] = [...new Set(OCC[k])];

// ---------- imagens de relevo ----------
const IMG = {};
function loadImg(key, src){ const im = new Image(); im.onload = () => { IMG[key] = im; redraw(); }; im.src = src; }
loadImg('world', RELIEF_WORLD); loadImg('hi', RELIEF_HI);

// ---------- projeção e cache ----------
let W, H, dpr, projection, path, sphereP, lakesP, riversP = [];
let transform = d3.zoomIdentity;
const cache = new Map(), geoCache = new Map();

function fixWinding(f){
  const g = f.geometry; if (!g) return f;
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  polys.forEach(p => { if (d3.geoArea({type:'Polygon', coordinates:p}) > 2*Math.PI) p.forEach(r => r.reverse()); });
  return f;
}
function features(year){
  if (!geoCache.has(year)) {
    const fc = topojson.feature(SNAPS[year], SNAPS[year].objects.r);
    geoCache.set(year, fc.features.filter(f => f.geometry && f.properties.NAME).map(fixWinding));
  }
  return geoCache.get(year);
}
function largestPoly(g){
  if (g.type !== 'MultiPolygon') return g;
  let best = null, ba = -1;
  g.coordinates.forEach(c => { const p = {type:'Polygon', coordinates:c}; const a = path.area(p); if (a > ba) { ba = a; best = p; } });
  return best;
}
function layer(year){
  if (cache.has(year)) return cache.get(year);
  const list = features(year).map(f => {
    const name = f.properties.NAME.trim();
    const d = path(f); if (!d) return null;
    const h = hueFor(name), folk = isFolk(name);
    return { name, folk, h, p: new Path2D(d), area: path.area(f), c: path.centroid(largestPoly(f.geometry)),
      fill: folk ? `hsla(${h},22%,72%,.45)` : `hsla(${h},70%,64%,.62)`,
      glow: `hsla(${h},85%,58%,.33)`, edge: folk ? `hsla(${h},20%,30%,.45)` : `hsla(${h},75%,26%,.9)` };
  }).filter(Boolean);
  list.sort((a,b) => (b.folk - a.folk));
  cache.set(year, list);
  return list;
}

function setup(){
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = canvas.clientWidth; H = canvas.clientHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  projection = d3.geoNaturalEarth1().fitExtent([[8, 8], [W - 8, H - 8]], {type:'Sphere'});
  path = d3.geoPath(projection);
  sphereP = new Path2D(path({type:'Sphere'}));
  lakesP = new Path2D(path(topojson.feature(LAKES, LAKES.objects[Object.keys(LAKES.objects)[0]])) || '');
  const rv = topojson.feature(RIVERS, RIVERS.objects[Object.keys(RIVERS.objects)[0]]);
  riversP = [1,2,3,4,5,6].map(sr => new Path2D(path({type:'FeatureCollection', features: rv.features.filter(f => (f.properties.scalerank||6) === sr)}) || ''));
  cache.clear();
  zoom.extent([[0,0],[W,H]]).translateExtent([[-W*0.15, -H*0.25], [W*1.15, H*1.25]]);
}

// ---------- estado ----------
let idx = SNAP_YEARS.indexOf(-3000);
let prevIdx = null, fade = 1, fadeStart = 0, pulseStart = 0;
let selected = null; // {type:'civ'|'place', name}
let showPlaces = true, showLabels = true;
const FADE_MS = 650, PULSE_MS = 1800;

function placeVisible(pl, i = idx){
  const y = SNAP_YEARS[i], prev = i > 0 ? SNAP_YEARS[i-1] : -Infinity;
  if (pl.y > y) return false;
  if (pl.k === 's') return true;
  return pl.e == null || pl.e > prev;
}
function placeIsNew(pl){ return idx > 0 && pl.y > SNAP_YEARS[idx-1] && pl.y <= SNAP_YEARS[idx]; }

// ---------- desenho ----------
function drawRelief(){
  const s = projection.scale(), t = projection.translate();
  for (const key of ['world', 'hi']) {
    const im = IMG[key]; if (!im) continue;
    const b = RELIEF_META[key];
    ctx.drawImage(im, t[0] + s*b.x0, t[1] - s*b.y1, s*(b.x1 - b.x0), s*(b.y1 - b.y0));
  }
}
function drawPolities(list, alpha, k){
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = 'multiply';
  for (const it of list) { ctx.fillStyle = it.fill; ctx.fill(it.p); }
  ctx.globalCompositeOperation = 'source-over';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 5 / k;
  for (const it of list) if (!it.folk) { ctx.strokeStyle = it.glow; ctx.stroke(it.p); }
  ctx.lineWidth = 1.1 / k;
  for (const it of list) if (!it.folk) { ctx.strokeStyle = it.edge; ctx.stroke(it.p); }
  ctx.setLineDash([3 / k, 3 / k]); ctx.lineWidth = 0.7 / k;
  for (const it of list) if (it.folk) { ctx.strokeStyle = it.edge; ctx.stroke(it.p); }
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}
function draw(now = performance.now()){
  const k = transform.k;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#070d12'; ctx.fillRect(0, 0, W, H);
  ctx.setTransform(dpr*k, 0, 0, dpr*k, dpr*transform.x, dpr*transform.y);

  ctx.save(); ctx.clip(sphereP);
  ctx.fillStyle = '#0e1e2c'; ctx.fill(sphereP);
  drawRelief();
  ctx.fillStyle = '#0f2232'; ctx.fill(lakesP);

  const cur = layer(SNAP_YEARS[idx]);
  if (prevIdx !== null && fade < 1) { drawPolities(layer(SNAP_YEARS[prevIdx]), 1 - fade, k); drawPolities(cur, fade, k); }
  else drawPolities(cur, 1, k);

  // rios
  ctx.lineCap = 'round';
  riversP.forEach((p, i) => {
    const sr = i + 1;
    ctx.lineWidth = (0.35 + (6 - sr) * 0.22) * Math.pow(k, 0.55) / k;
    ctx.strokeStyle = `rgba(28,72,108,${sr <= 3 ? .85 : .6})`;
    ctx.stroke(p);
  });

  // destaque da seleção: escurece o resto
  if (selected && selected.type === 'civ') {
    const it = cur.find(x => x.name === selected.name);
    if (it) {
      const veil = new Path2D(); veil.addPath(sphereP); veil.addPath(it.p);
      ctx.fillStyle = 'rgba(6,10,14,.42)'; ctx.fill(veil, 'evenodd');
      ctx.lineWidth = 7 / k; ctx.strokeStyle = 'rgba(255,240,200,.35)'; ctx.stroke(it.p);
      ctx.lineWidth = 1.8 / k; ctx.strokeStyle = '#fff4d6'; ctx.stroke(it.p);
    }
  }
  ctx.restore();
  ctx.lineWidth = 1.2 / k; ctx.strokeStyle = 'rgba(190,210,220,.25)'; ctx.stroke(sphereP);

  // tela
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const g = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.35, W/2, H/2, Math.max(W,H)*0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.5)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  const boxes = [];
  if (showLabels) drawLabels(cur, k, boxes);
  if (showPlaces) drawPlaces(now, boxes);
}
function hit(b, boxes){ return boxes.some(o => !(b[2] < o[0] || b[0] > o[2] || b[3] < o[1] || b[1] > o[3])); }
function drawLabels(list, k, boxes){
  const cand = list.filter(it => !it.folk || k > 2.5).map(it => ({it, a: it.area * k * k, civ: !!CIV_BY_KEY[it.name]}))
    .filter(o => o.a > (o.civ ? 150 : 2200)).sort((a,b) => (b.civ - a.civ) || (b.a - a.a)).slice(0, 60);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const {it, a, civ} of cand) {
    const label = ptName(it.name);
    const fs = Math.max(civ ? 11 : 10, Math.min(19, 7 + Math.sqrt(a) / 18));
    if (it.folk) { ctx.font = `italic 500 ${fs}px "EB Garamond", Georgia, serif`; ctx.letterSpacing = '0px'; }
    else { ctx.font = `700 ${fs}px Cinzel, Georgia, serif`; ctx.letterSpacing = (fs * 0.08).toFixed(1) + 'px'; }
    const text = it.folk ? label : label.toUpperCase();
    const x = it.c[0] * k + transform.x, y = it.c[1] * k + transform.y;
    const w = ctx.measureText(text).width, h = fs + 2;
    if (x < -w || x > W + w || y < 0 || y > H) continue;
    const b = [x - w/2 - 2, y - h/2, x + w/2 + 2, y + h/2];
    if (hit(b, boxes)) continue;
    boxes.push(b);
    ctx.lineJoin = 'round'; ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(250,243,226,.82)'; ctx.strokeText(text, x, y);
    ctx.fillStyle = it.folk ? '#4a3d2e' : `hsl(${it.h},60%,18%)`; ctx.fillText(text, x, y);
  }
  ctx.letterSpacing = '0px';
}
let placeScreen = [];
function drawPlaces(now, boxes){
  placeScreen = [];
  const k = transform.k, pulse = Math.min(1, (now - pulseStart) / PULSE_MS);
  const vis = PLACES.filter(pl => placeVisible(pl)).sort((a,b) => b.w - a.w);
  // marcadores
  for (const pl of vis) {
    const p = projection([pl.lon, pl.lat]); if (!p) continue;
    const x = p[0]*k + transform.x, y = p[1]*k + transform.y;
    if (x < -20 || x > W + 20 || y < -20 || y > H + 20) continue;
    const sel = selected && selected.type === 'place' && selected.name === pl.n;
    const r = (pl.w === 3 ? 4.2 : pl.w === 2 ? 3.4 : 2.7) * (sel ? 1.5 : 1);
    if (placeIsNew(pl) && pulse < 1) {
      ctx.beginPath(); ctx.arc(x, y, r + 4 + pulse * 22, 0, 2*Math.PI);
      ctx.strokeStyle = `rgba(255,214,120,${(1 - pulse) * .9})`; ctx.lineWidth = 2; ctx.stroke();
    }
    if (pl.k === 's') {
      ctx.beginPath(); ctx.moveTo(x, y - r - 1.5); ctx.lineTo(x + r + 1.5, y); ctx.lineTo(x, y + r + 1.5); ctx.lineTo(x - r - 1.5, y); ctx.closePath();
      ctx.fillStyle = '#f0c454'; ctx.fill(); ctx.lineWidth = 1.3; ctx.strokeStyle = '#3b2a05'; ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(x, y, r, 0, 2*Math.PI);
      ctx.fillStyle = '#fff6df'; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = '#2a1c0e'; ctx.stroke();
      if (pl.w === 3) { ctx.beginPath(); ctx.arc(x, y, r * 0.38, 0, 2*Math.PI); ctx.fillStyle = '#2a1c0e'; ctx.fill(); }
    }
    if (sel) { ctx.beginPath(); ctx.arc(x, y, r + 5, 0, 2*Math.PI); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); }
    placeScreen.push({pl, x, y, r});
  }
  // nomes
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  for (const o of placeScreen) {
    const pl = o.pl, sel = selected && selected.type === 'place' && selected.name === pl.n;
    const show = sel || pl.w === 3 || (pl.w === 2 && k > 1.9) || k > 3.6;
    if (!show) continue;
    const fs = pl.w === 3 ? 14 : 13;
    ctx.font = `italic 600 ${fs}px "EB Garamond", Georgia, serif`;
    const w = ctx.measureText(pl.n).width, x = o.x + o.r + 4, y = o.y;
    const b = [x - 1, y - fs/2, x + w + 1, y + fs/2];
    if (!sel && hit(b, boxes)) continue;
    boxes.push(b, [o.x - o.r, o.y - o.r, o.x + o.r, o.y + o.r]);
    ctx.lineJoin = 'round'; ctx.lineWidth = 3.2; ctx.strokeStyle = 'rgba(250,243,226,.88)'; ctx.strokeText(pl.n, x, y);
    ctx.fillStyle = pl.k === 's' ? '#5a3c00' : '#1f150b'; ctx.fillText(pl.n, x, y);
  }
}
let raf = null, animating = false;
function redraw(){ if (!raf && !animating) raf = requestAnimationFrame(() => { raf = null; draw(); }); }
function loop(t){
  fade = Math.min(1, (t - fadeStart) / FADE_MS);
  draw(t);
  if (fade < 1 || t - pulseStart < PULSE_MS) requestAnimationFrame(loop);
  else { prevIdx = null; animating = false; }
}
function startAnim(){ fadeStart = pulseStart = performance.now(); if (!animating) { animating = true; requestAnimationFrame(loop); } }

// ---------- tempo ----------
const slider = $('#slider'); slider.max = N - 1;
let shownYear = SNAP_YEARS[idx], yearTween = null;
function go(i){
  i = Math.max(0, Math.min(N - 1, i));
  if (i === idx) return;
  prevIdx = idx; fade = 0;
  idx = i; slider.value = i;
  updateHUD(true);
  startAnim();
  if (selected && selected.type === 'civ') openCiv(selected.name, true);
}
function updateHUD(anim){
  const y = SNAP_YEARS[idx], e = eraFor(y);
  $('#era').textContent = e.nome;
  $('#eratext').textContent = e.t;
  slider.style.setProperty('--p', (idx / (N - 1) * 100) + '%');
  const from = shownYear, to = y, t0 = performance.now();
  cancelAnimationFrame(yearTween);
  const step = t => {
    const f = anim ? Math.min(1, (t - t0) / 600) : 1, ease = 1 - Math.pow(1 - f, 3);
    shownYear = from + (to - from) * ease;
    $('#year').textContent = fmtYear(f < 1 ? shownYear : to);
    if (f < 1) yearTween = requestAnimationFrame(step); else shownYear = to;
  };
  yearTween = requestAnimationFrame(step);
  const novos = PLACES.filter(placeIsNew);
  $('#news').textContent = novos.length ? 'Surgem: ' + novos.slice(0, 4).map(p => p.n.replace(/ \(.*/, '')).join(', ') + (novos.length > 4 ? ` e mais ${novos.length - 4}` : '') : '';
}
slider.addEventListener('input', () => go(+slider.value));
$('#prev').onclick = () => go(idx - 1);
$('#next').onclick = () => go(idx + 1);
let playTimer = null;
$('#play').onclick = () => {
  if (playTimer) { clearInterval(playTimer); playTimer = null; $('#play').textContent = '▶'; return; }
  if (idx === N - 1) go(0);
  $('#play').textContent = '❚❚';
  playTimer = setInterval(() => { if (idx >= N - 1) { $('#play').click(); return; } go(idx + 1); }, 2200);
};
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') go(idx + 1);
  if (e.key === 'ArrowLeft') go(idx - 1);
  if (e.key === 'Escape') closeCard();
});
$('#tPlaces').onchange = e => { showPlaces = e.target.checked; redraw(); };
$('#tLabels').onchange = e => { showLabels = e.target.checked; redraw(); };

const ticks = $('#ticks');
[-10000, -1, 1000, 1500, 1900].forEach(y => {
  const i = SNAP_YEARS.indexOf(y); if (i < 0) return;
  const s = document.createElement('span'); s.style.left = (i / (N - 1) * 100) + '%';
  s.textContent = y === -1 ? '0' : fmtYear(y).replace(' d.C.', '');
  s.onclick = () => go(i); ticks.appendChild(s);
});

// ---------- cartões ----------
const card = $('#card');
function wiki(q){ return 'https://pt.wikipedia.org/w/index.php?search=' + encodeURIComponent(q); }
function rangeText(name){
  const ys = OCC[name] || []; if (!ys.length) return '';
  return ys.length === 1 ? `No mapa em ${fmtYear(ys[0])}` : `No mapa de ${fmtYear(ys[0])} a ${fmtYear(ys[ys.length-1])}`;
}
function setBar(color){ $('#cBar').style.background = color; }
function openCiv(name, quiet){
  selected = {type:'civ', name};
  const civ = CIV_BY_KEY[name], h = hueFor(name);
  const here = layer(SNAP_YEARS[idx]).some(x => x.name === name);
  $('#cKind').textContent = civ ? 'Civilização' : (isFolk(name) ? 'Povo / cultura' : 'Estado / região');
  $('#cTitle').textContent = ptName(name);
  $('#cSub').textContent = ptName(name) !== name ? name : '';
  $('#cMeta').innerHTML = (civ ? `<b>Período:</b> ${civ.periodo}<br><b>Centros:</b> ${civ.cidades}<br>` : '') +
    `<span class="muted">${rangeText(name)}${here ? '' : ' · não existe nesta data'}</span>`;
  $('#cText').textContent = civ ? civ.texto : 'Ainda sem descrição própria no atlas.';
  $('#cLink').href = wiki(civ ? civ.pt : name);
  const ys = OCC[name] || [];
  $('#cJump').style.display = ys.length && !here ? '' : 'none';
  $('#cJump').onclick = () => go(SNAP_YEARS.indexOf(ys[0]));
  setBar(`linear-gradient(90deg, hsl(${h},70%,55%), hsl(${(h+40)%360},70%,45%))`);
  card.classList.add('open');
  if (!quiet) redraw();
}
function openPlace(pl){
  selected = {type:'place', name:pl.n};
  $('#cKind').textContent = (pl.k === 's' ? 'Sítio arqueológico' : 'Cidade antiga') + ' · ' + pl.p;
  $('#cTitle').textContent = pl.n;
  $('#cSub').textContent = '';
  $('#cMeta').innerHTML = pl.k === 's' ? `<b>Desde:</b> c. ${fmtYear(pl.y)}` :
    `<b>Habitada:</b> c. ${fmtYear(pl.y)} – ${pl.e == null ? 'hoje' : 'c. ' + fmtYear(pl.e)}`;
  $('#cText').textContent = pl.t;
  $('#cLink').href = wiki(pl.n.replace(/ \(.*/, ''));
  $('#cJump').style.display = 'none';
  setBar(pl.k === 's' ? 'linear-gradient(90deg,#f0c454,#b8862b)' : 'linear-gradient(90deg,#fff6df,#c9b48a)');
  card.classList.add('open');
  redraw();
}
function closeCard(){ card.classList.remove('open'); selected = null; redraw(); }
$('#cClose').onclick = closeCard;

// ---------- zoom e toque ----------
const zoom = d3.zoom().scaleExtent([1, 60]).on('zoom', e => { transform = e.transform; redraw(); });
d3.select(canvas).call(zoom).on('dblclick.zoom', null);
let down = null;
canvas.addEventListener('pointerdown', e => down = [e.clientX, e.clientY]);
canvas.addEventListener('pointerup', e => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
  const r = canvas.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top;
  if (showPlaces) {
    let best = null, bd = 15;
    for (const o of placeScreen) { const d = Math.hypot(o.x - sx, o.y - sy); if (d < bd) { bd = d; best = o.pl; } }
    if (best) return openPlace(best);
  }
  const px = (sx - transform.x) / transform.k, py = (sy - transform.y) / transform.k;
  ctx.setTransform(1,0,0,1,0,0);
  const list = layer(SNAP_YEARS[idx]);
  for (let i = list.length - 1; i >= 0; i--) if (ctx.isPointInPath(list[i].p, px, py)) return openCiv(list[i].name);
  closeCard();
});
$('#zin').onclick = () => d3.select(canvas).transition().duration(350).call(zoom.scaleBy, 1.8);
$('#zout').onclick = () => d3.select(canvas).transition().duration(350).call(zoom.scaleBy, 1/1.8);

function initialView(){
  const b = path.bounds({type:'Sphere'}), mapW = b[1][0] - b[0][0], mapH = b[1][1] - b[0][1];
  const portrait = H > W;
  const top = portrait ? 90 : 60, bottom = portrait ? 210 : 170, avail = H - top - bottom;
  // centraliza no Velho Mundo (Mediterrâneo → Indo)
  const k = portrait ? Math.max(1, Math.min(4, avail / mapH * 1.35)) : Math.max(1, Math.min(2.6, (W * 0.9) / (mapW * 0.42)));
  const c = projection(portrait ? [42, 30] : [48, 28]);
  let ty = top + avail / 2 - c[1] * k;
  ty = Math.min(ty, top - 10 - b[0][1] * k); // sem faixa vazia acima do mapa
  return d3.zoomIdentity.translate(W / 2 - c[0] * k, ty).scale(k);
}
window.__pt = (lon, lat) => { const p = projection([lon, lat]); return [p[0]*transform.k + transform.x, p[1]*transform.k + transform.y]; };
window.__go = i => go(i);
window.addEventListener('resize', () => { setup(); redraw(); });
setup(); slider.value = idx; updateHUD(false);
d3.select(canvas).call(zoom.transform, initialView());
draw();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(redraw);
})();
