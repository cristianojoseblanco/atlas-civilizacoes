(() => {
const $ = s => document.querySelector(s);
const canvas = $('#map'), sctx = canvas.getContext('2d');
// o mapa estático é desenhado numa tela fora da página; só as animações são redesenhadas a cada quadro
const base = document.createElement('canvas'), ctx = base.getContext('2d');
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
// nomes presentes em cada época (as épocas do Oriente Próximo combinam uma base mundial com os mapas desenhados à mão)
const CUSTOM_NAMES = new Set(NE_CUSTOM.features.map(f => f.properties.NAME));
function namesAt(y){
  const m = NE_META[y];
  const base = SNAPS[m ? m.base : y].objects.r.geometries.map(g => g.properties && g.properties.NAME).filter(Boolean).map(n => n.trim());
  if (!m) return base;
  const rm = new Set(m.remove);
  return base.filter(n => !rm.has(n)).concat(NE_CUSTOM.features.filter(f => f.properties.ano === y).map(f => f.properties.NAME));
}
SNAP_YEARS.forEach(y => namesAt(y).forEach(n => (OCC[n] = OCC[n] || []).push(y)));
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
    const m = NE_META[year], by = m ? m.base : year;
    const fc = topojson.feature(SNAPS[by], SNAPS[by].objects.r);
    let list = fc.features.filter(f => f.geometry && f.properties.NAME);
    if (m) {
      const rm = new Set(m.remove);
      list = list.filter(f => !rm.has(f.properties.NAME.trim()))
        .concat(NE_CUSTOM.features.filter(f => f.properties.ano === year).map(f => JSON.parse(JSON.stringify(f))));
    }
    geoCache.set(year, list.map(fixWinding));
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
  canvas.width = base.width = W * dpr; canvas.height = base.height = H * dpr;
  projection = d3.geoNaturalEarth1().fitExtent([[8, 8], [W - 8, H - 8]], {type:'Sphere'});
  path = d3.geoPath(projection);
  sphereP = new Path2D(path({type:'Sphere'}));
  lakesP = new Path2D(path(topojson.feature(LAKES, LAKES.objects[Object.keys(LAKES.objects)[0]])) || '');
  const rv = topojson.feature(RIVERS, RIVERS.objects[Object.keys(RIVERS.objects)[0]]);
  riversP = [1,2,3,4,5,6].map(sr => new Path2D(path({type:'FeatureCollection', features: rv.features.filter(f => (f.properties.scalerank||6) === sr)}) || ''));
  cache.clear();
  buildGeoms();
  zoom.extent([[0,0],[W,H]]).translateExtent([[-W*0.15, -H*0.25], [W*1.15, H*1.25]]);
}

// ---------- estado ----------
let idx = SNAP_YEARS.indexOf(-3000);
let prevIdx = null, fade = 1, fadeStart = 0, pulseStart = 0;
let selected = null; // {type:'civ'|'place', name}
let showPlaces = true, showLabels = true, showRoutes = true, evStart = 0;
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
  // com muito zoom os pixels do relevo ficam visíveis: suaviza proporcionalmente
  const blur = transform.k > 25 ? Math.min(3.5, (transform.k - 25) / 30) / transform.k : 0;
  ctx.imageSmoothingQuality = 'high';
  ctx.filter = blur ? `blur(${(blur * transform.k * 1.6).toFixed(1)}px)` : 'none';
  for (const key of ['world', 'hi']) {
    const im = IMG[key]; if (!im) continue;
    const b = RELIEF_META[key];
    ctx.drawImage(im, t[0] + s*b.x0, t[1] - s*b.y1, s*(b.x1 - b.x0), s*(b.y1 - b.y0));
  }
  ctx.filter = 'none';
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
  if (showPlaces && !theme) drawPlaces(now, boxes);
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
let baseDirty = true;
function redraw(){ baseDirty = true; }
function startAnim(){ fadeStart = pulseStart = evStart = performance.now(); }
function tick(t){
  const fading = prevIdx !== null;
  if (fading) fade = Math.min(1, (t - fadeStart) / FADE_MS);
  const pulsing = t - pulseStart < PULSE_MS;
  if (baseDirty || fading || pulsing) { draw(t); baseDirty = false; if (fading && fade >= 1) prevIdx = null; }
  sctx.setTransform(1, 0, 0, 1, 0, 0);
  sctx.drawImage(base, 0, 0);
  drawOverlay(t);
  requestAnimationFrame(tick);
}

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
  else if (selected && (selected.type === 'ev' || selected.type === 'rt')) closeCard();
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
  renderSync();
  renderChips();
  const novos = PLACES.filter(placeIsNew);
  $('#news').textContent = novos.length ? 'Surgem: ' + novos.slice(0, 4).map(p => p.n.replace(/ \(.*/, '')).join(', ') + (novos.length > 4 ? ` e mais ${novos.length - 4}` : '') : '';
}
slider.addEventListener('input', () => go(+slider.value));
$('#prev').onclick = () => go(idx - 1);
$('#next').onclick = () => go(idx + 1);
let playTimer = null;
function stopPlay(){ clearTimeout(playTimer); playTimer = null; $('#play').textContent = '▶'; }
function playStep(){
  if (idx >= N - 1) return stopPlay();
  go(idx + 1);
  const evs = activeEvents().length;
  playTimer = setTimeout(playStep, 2400 + Math.min(evs, 3) * 1600);
}
$('#play').onclick = () => {
  if (playTimer) return stopPlay();
  if (idx === N - 1) go(0);
  $('#play').textContent = '❚❚';
  playTimer = setTimeout(playStep, 600);
};
document.addEventListener('keydown', e => {
  if (tour) { if (e.key === 'ArrowRight') tourStep(tour.i + 1); if (e.key === 'ArrowLeft') tourStep(tour.i - 1); if (e.key === 'Escape') endTour(); return; }
  if (e.key === 'ArrowRight') go(idx + 1);
  if (e.key === 'ArrowLeft') go(idx - 1);
  if (e.key === 'Escape') { if (card.classList.contains('open')) closeCard(); else if (theme) endTheme(); }
});
$('#tPlaces').onchange = e => { showPlaces = e.target.checked; redraw(); };
$('#tLabels').onchange = e => { showLabels = e.target.checked; redraw(); };
$('#tRoutes').onchange = e => { showRoutes = e.target.checked; };

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
    `<span class="muted">${rangeText(name)}${here ? '' : ' · não existe nesta data'}</span>` +
    (CUSTOM_NAMES.has(name) ? '<br><span class="muted">Fronteira desenhada para este atlas, aproximada.</span>' : '');
  $('#cText').textContent = civ ? civ.texto : 'Ainda sem descrição própria no atlas.';
  $('#cLink').href = wiki(civ ? civ.pt : name);
  const ys = OCC[name] || [];
  $('#cJump').style.display = ys.length && !here ? '' : 'none';
  $('#cJump').onclick = () => go(SNAP_YEARS.indexOf(ys[0]));
  setBar(`linear-gradient(90deg, hsl(${h},70%,55%), hsl(${(h+40)%360},70%,45%))`);
  showCard();
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
  showCard();
  redraw();
}
function showCard(){ card.classList.add('open'); $('#tour').classList.add('behind'); $('#theme').classList.add('behind'); }
function closeCard(){ card.classList.remove('open'); $('#tour').classList.remove('behind'); $('#theme').classList.remove('behind'); selected = null; redraw(); }
$('#cClose').onclick = closeCard;

// ---------- eventos e rotas (camada animada) ----------
const geoms = new Map(); // id -> {pts:[[x,y,brk]], cum:[], total}
function sample(coords){
  const pts = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const a = coords[i], b = coords[i + 1], f = d3.geoInterpolate(a, b);
    const n = Math.max(2, Math.ceil(d3.geoDistance(a, b) / 0.01));
    for (let j = i === 0 ? 0 : 1; j <= n; j++) { const p = projection(f(j / n)); if (p) pts.push([p[0], p[1], false]); }
  }
  const cum = [0]; let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i-1][0], dy = pts[i][1] - pts[i-1][1];
    if (Math.abs(dx) > W * 0.4) { pts[i][2] = true; cum.push(total); continue; }
    total += Math.hypot(dx, dy); cum.push(total);
  }
  return {pts, cum, total};
}
function buildGeoms(){
  geoms.clear();
  ROUTES.forEach(r => geoms.set('rt:' + r.id, sample(r.path)));
  EVENTS.forEach(ev => { if (ev.tipo === 'rota') geoms.set('ev:' + ev.id, sample(ev.path)); });
}
function overlapsSnap(y, e, i = idx){
  const cur = SNAP_YEARS[i], prev = i > 0 ? SNAP_YEARS[i-1] : -Infinity;
  return y <= cur && e > prev;
}
// sequências só aparecem nas épocas em que alguma parada nova acontece
const activeEvents = () => EVENTS.filter(ev => {
  if (!overlapsSnap(ev.y, ev.e)) return false;
  if (ev.tipo !== 'seq') return true;
  const cur = SNAP_YEARS[idx], prev = idx > 0 ? SNAP_YEARS[idx-1] : -Infinity;
  return ev.pts.some(p => p.y > prev && p.y <= cur);
});
const activeRoutes = () => showRoutes ? ROUTES.filter(r => overlapsSnap(r.y, r.e) || (r.y <= SNAP_YEARS[idx] && r.e >= SNAP_YEARS[idx])) : [];
const evOverride = {};
const S = (x, y) => [x * transform.k + transform.x, y * transform.k + transform.y];
function evPoints(ev){ return ev.tipo === 'rota' ? ev.path : ev.tipo === 'seq' ? ev.pts.map(p => p.at) : [ev.at]; }

function strokeGeom(g, upto){
  // desenha a linha até o comprimento 'upto' (em unidades da projeção); devolve [ponta, ângulo]
  sctx.beginPath();
  let head = null, ang = 0;
  for (let i = 0; i < g.pts.length; i++) {
    const [x, y, brk] = g.pts[i];
    if (g.cum[i] > upto && i > 0 && !brk) {
      const [px, py] = g.pts[i-1], f = (upto - g.cum[i-1]) / (g.cum[i] - g.cum[i-1] || 1);
      const P = S(px + (x - px) * f, py + (y - py) * f); sctx.lineTo(P[0], P[1]);
      const Q = S(px, py); head = P; ang = Math.atan2(P[1] - Q[1], P[0] - Q[0]); break;
    }
    if (g.cum[i] > upto) break;
    const P = S(x, y);
    if (i === 0 || brk) sctx.moveTo(P[0], P[1]); else { if (head) ang = Math.atan2(P[1] - head[1], P[0] - head[0]); sctx.lineTo(P[0], P[1]); }
    head = P;
  }
  sctx.stroke();
  return [head, ang];
}
function haloText(text, x, y, color, font, align = 'left'){
  if (y > hudTop - 8) return; // não escreve atrás da barra do tempo
  sctx.font = font; sctx.textAlign = align; sctx.textBaseline = 'middle';
  sctx.lineJoin = 'round'; sctx.lineWidth = 3.5; sctx.strokeStyle = 'rgba(8,12,16,.85)'; sctx.strokeText(text, x, y);
  sctx.fillStyle = color; sctx.fillText(text, x, y);
}
function star(x, y, r, color){
  sctx.beginPath();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; sctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  sctx.closePath(); sctx.fillStyle = color; sctx.fill(); sctx.lineWidth = 1.5; sctx.strokeStyle = '#fff'; sctx.stroke();
}
let overlayTargets = [], hudTop = 1e9;
function drawOverlay(t){
  sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  overlayTargets = [];
  hudTop = H - ($('#hud').offsetHeight || 0) * 0.72;
  if (theme) return drawTheme(t);
  const k = transform.k;
  // rotas comerciais: linha tracejada que flui
  for (const rt of activeRoutes()) {
    const g = geoms.get('rt:' + rt.id); if (!g) continue;
    const sel = selected && selected.type === 'rt' && selected.name === rt.id;
    sctx.lineCap = 'round'; sctx.lineJoin = 'round';
    sctx.globalAlpha = sel ? .45 : .22; sctx.strokeStyle = rt.cor; sctx.lineWidth = sel ? 10 : 7; strokeGeom(g, Infinity);
    sctx.globalAlpha = .95; sctx.setLineDash([7, 9]); sctx.lineDashOffset = -(t * 0.025) % 16; sctx.lineWidth = sel ? 3 : 2.2; strokeGeom(g, Infinity);
    sctx.setLineDash([]); sctx.globalAlpha = 1;
    for (const i of [0, g.pts.length - 1]) { const P = S(g.pts[i][0], g.pts[i][1]); sctx.beginPath(); sctx.arc(P[0], P[1], 3.2, 0, 7); sctx.fillStyle = rt.cor; sctx.fill(); sctx.lineWidth = 1.2; sctx.strokeStyle = '#fff'; sctx.stroke(); }
    if (showLabels && (k > 2.2 || sel)) { const m = g.pts[Math.floor(g.pts.length / 2)], P = S(m[0], m[1]); haloText(rt.n, P[0] + 6, P[1] - 10, rt.cor, 'italic 600 12px Inter, system-ui, sans-serif'); }
  }
  // eventos
  activeEvents().forEach((ev, i) => {
    const c = EVENT_CATS[ev.cat].cor;
    const local = evOverride[ev.id] != null ? t - evOverride[ev.id] : t - evStart - i * 900;
    if (local < 0) return;
    const sel = selected && selected.type === 'ev' && selected.name === ev.id;
    const font = '700 12px Inter, system-ui, sans-serif';
    if (ev.tipo === 'rota') {
      const g = geoms.get('ev:' + ev.id); if (!g) return;
      const p = Math.min(1, local / 4200), ease = 1 - Math.pow(1 - p, 2);
      sctx.lineCap = 'round'; sctx.lineJoin = 'round';
      sctx.globalAlpha = .3; sctx.strokeStyle = c; sctx.lineWidth = 8; strokeGeom(g, ease * g.total);
      sctx.globalAlpha = 1; sctx.lineWidth = sel ? 3.6 : 2.8; const [head, ang] = strokeGeom(g, ease * g.total);
      const P0 = S(g.pts[0][0], g.pts[0][1]);
      sctx.beginPath(); sctx.arc(P0[0], P0[1], 4, 0, 7); sctx.fillStyle = '#fff'; sctx.fill(); sctx.lineWidth = 2; sctx.strokeStyle = c; sctx.stroke();
      if (head) {
        if (p < 1) { const pr = 6 + 3 * Math.sin(t / 120); sctx.beginPath(); sctx.arc(head[0], head[1], pr, 0, 7); sctx.fillStyle = c; sctx.fill(); sctx.lineWidth = 2; sctx.strokeStyle = '#fff'; sctx.stroke(); }
        else { sctx.save(); sctx.translate(head[0], head[1]); sctx.rotate(ang); sctx.beginPath(); sctx.moveTo(8, 0); sctx.lineTo(-6, -6); sctx.lineTo(-6, 6); sctx.closePath(); sctx.fillStyle = c; sctx.fill(); sctx.lineWidth = 1.5; sctx.strokeStyle = '#fff'; sctx.stroke(); sctx.restore(); }
        if (showLabels) haloText(ev.n, P0[0] + 8, P0[1] - 12, '#fff', font);
      }
      overlayTargets.push({kind:'ev', ev, x:P0[0], y:P0[1]});
      if (head) overlayTargets.push({kind:'ev', ev, x:head[0], y:head[1]});
    } else if (ev.tipo === 'seq') {
      const pts = ev.pts.filter(p => p.y <= SNAP_YEARS[idx]).sort((a, b) => a.y - b.y);
      let prevP = null;
      pts.forEach((pt, j) => {
        const age = local - j * 700; if (age < 0) return;
        const p = projection(pt.at); if (!p) return; const P = S(p[0], p[1]);
        if (prevP) { sctx.setLineDash([2, 5]); sctx.lineWidth = 1.5; sctx.strokeStyle = c; sctx.globalAlpha = .7; sctx.beginPath(); sctx.moveTo(prevP[0], prevP[1]); sctx.lineTo(P[0], P[1]); sctx.stroke(); sctx.setLineDash([]); sctx.globalAlpha = 1; }
        prevP = P;
        if (age < 1400) { const f = age / 1400; sctx.beginPath(); sctx.arc(P[0], P[1], 5 + f * 26, 0, 7); sctx.strokeStyle = c; sctx.globalAlpha = 1 - f; sctx.lineWidth = 2.5; sctx.stroke(); sctx.globalAlpha = 1; }
        sctx.beginPath(); sctx.arc(P[0], P[1], 5, 0, 7); sctx.fillStyle = c; sctx.fill(); sctx.lineWidth = 1.6; sctx.strokeStyle = '#fff'; sctx.stroke();
        const showL = showLabels && (sel || k > 2.6 || age < 2600);
        if (showL) { sctx.globalAlpha = sel || k > 2.6 ? 1 : Math.min(1, (2600 - age) / 500); haloText(pt.l, P[0] + 9, P[1], '#fff', '600 11px Inter, system-ui, sans-serif'); sctx.globalAlpha = 1; }
        overlayTargets.push({kind:'ev', ev, x:P[0], y:P[1]});
      });
      if (showLabels && prevP && local < pts.length * 700 + 3000) {
        const p = projection(pts[0].at), P = S(p[0], p[1]);
        sctx.globalAlpha = Math.min(1, Math.max(0, (pts.length * 700 + 3000 - local) / 600));
        haloText(ev.n, P[0], P[1] - 18, c, '700 13px Inter, system-ui, sans-serif', 'center'); sctx.globalAlpha = 1;
      }
    } else {
      const p = projection(ev.at); if (!p) return; const P = S(p[0], p[1]);
      const ph = (local % 2600) / 2600;
      sctx.beginPath(); sctx.arc(P[0], P[1], 7 + ph * 22, 0, 7); sctx.strokeStyle = c; sctx.globalAlpha = (1 - ph) * .85; sctx.lineWidth = 2; sctx.stroke(); sctx.globalAlpha = 1;
      const grow = Math.min(1, local / 400);
      star(P[0], P[1], (sel ? 11 : 9) * grow, c);
      if (showLabels) haloText(ev.n, P[0], P[1] - 19, '#fff', font, 'center'); // acima, para não cobrir o nome do lugar
      overlayTargets.push({kind:'ev', ev, x:P[0], y:P[1]});
    }
  });
}
function overlayHit(sx, sy){
  let best = null, bd = 16;
  for (const o of overlayTargets) { const d = Math.hypot(o.x - sx, o.y - sy); if (d < bd) { bd = d; best = o; } }
  if (best) return best;
  for (const rt of activeRoutes()) {
    const g = geoms.get('rt:' + rt.id); if (!g) continue;
    for (const pt of g.pts) { const P = S(pt[0], pt[1]); if (Math.hypot(P[0] - sx, P[1] - sy) < 9) return {kind:'rt', rt}; }
  }
  return null;
}
function fmtRange(y, e){
  if (y === e) return 'c. ' + fmtYear(y);
  if (y < 0 && e < 0) return `c. ${Math.abs(y)} – ${fmtYear(e)}`;
  return `c. ${fmtYear(y)} – ${fmtYear(e)}`;
}
function flyTo(lonlats, kFixed){
  const P = lonlats.map(c => projection(c)).filter(Boolean); if (!P.length) return;
  const xs = P.map(p => p[0]), ys = P.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const portrait = H > W;
  const vw = portrait ? W : W - 420, vh = portrait ? H * 0.28 : H - 300;
  const cx = portrait ? W / 2 : (W - 400) / 2, cy = portrait ? H * 0.6 : 60 + (H - 290) / 2;
  let k = P.length === 1 ? 4 : Math.min(vw * 0.8 / Math.max(1, x1 - x0), vh * 0.8 / Math.max(1, y1 - y0));
  k = kFixed || Math.max(1.2, Math.min(7, k));
  const T = d3.zoomIdentity.translate(cx - (x0 + x1) / 2 * k, cy - (y0 + y1) / 2 * k).scale(k);
  d3.select(canvas).transition().duration(1500).call(zoom.transform, T);
}
function openEvent(ev, fly){
  selected = {type:'ev', name:ev.id};
  const cat = EVENT_CATS[ev.cat];
  $('#cKind').textContent = 'Evento · ' + cat.nome;
  $('#cTitle').textContent = ev.n;
  $('#cSub').textContent = '';
  $('#cMeta').innerHTML = `<b>Quando:</b> ${fmtRange(ev.y, ev.e)}`;
  $('#cText').innerHTML = '';
  $('#cText').append(document.createTextNode(ev.t));
  if (ev.tipo === 'seq') {
    const ol = document.createElement('ol'); ol.className = 'steps';
    ev.pts.slice().sort((a, b) => a.y - b.y).forEach(p => { const li = document.createElement('li'); li.textContent = `${fmtYear(p.y)}: ${p.l}`; ol.append(li); });
    $('#cText').append(ol);
  }
  $('#cLink').href = wiki(ev.n);
  $('#cJump').style.display = 'none';
  setBar(cat.cor);
  showCard();
  evOverride[ev.id] = performance.now();
  if (fly) flyTo(evPoints(ev));
}
function openRoute(rt, fly){
  selected = {type:'rt', name:rt.id};
  $('#cKind').textContent = 'Rota comercial';
  $('#cTitle').textContent = rt.n;
  $('#cSub').textContent = '';
  $('#cMeta').innerHTML = `<b>Ativa:</b> ${fmtRange(rt.y, rt.e)}<br><b>Mercadorias:</b> ${rt.bens}`;
  $('#cText').textContent = rt.t;
  $('#cLink').href = wiki(rt.n.replace(/:.*/, ''));
  $('#cJump').style.display = 'none';
  setBar(rt.cor);
  showCard();
  if (fly) flyTo(rt.path);
}
function renderChips(){
  const box = $('#chips'); box.innerHTML = '';
  activeEvents().forEach(ev => {
    const b = document.createElement('button'); b.className = 'chip';
    b.innerHTML = `<i style="background:${EVENT_CATS[ev.cat].cor}"></i>`; b.append(document.createTextNode(ev.n));
    b.onclick = () => openEvent(ev, true); box.append(b);
  });
  ROUTES.filter(r => overlapsSnap(r.y, r.e) || (r.y <= SNAP_YEARS[idx] && r.e >= SNAP_YEARS[idx])).forEach(rt => {
    const b = document.createElement('button'); b.className = 'chip route';
    b.innerHTML = `<i style="background:${rt.cor}"></i>`; b.append(document.createTextNode(rt.n));
    b.onclick = () => { if (!showRoutes) { showRoutes = true; $('#tRoutes').checked = true; } openRoute(rt, true); }; box.append(b);
  });
  box.style.display = box.children.length ? '' : 'none';
}

// ---------- passeios guiados ----------
let tour = null; // {t, i, auto, timer, t0, dur}
const snapFor = ano => { const i = SNAP_YEARS.findIndex(y => y >= ano); return i < 0 ? N - 1 : i; };
function openTourMenu(){
  const list = $('#tmList'); list.innerHTML = '';
  TOURS.forEach(t => {
    const b = document.createElement('button'); b.className = 'tm-item';
    b.innerHTML = `<span class="tm-bar" style="background:${t.cor}"></span><b></b><span class="tm-d"></span><span class="tm-n"></span>`;
    b.querySelector('b').textContent = t.n; b.querySelector('.tm-d').textContent = t.d;
    b.querySelector('.tm-n').textContent = `${t.steps.length} paradas · cerca de ${Math.round(t.steps.reduce((a, s) => a + stepDur(s), 0) / 60000)} min`;
    b.onclick = () => { $('#tourMenu').classList.remove('open'); startTour(t); };
    list.append(b);
  });
  const h = document.createElement('h3'); h.className = 'tm-sec'; h.textContent = 'Grandes perguntas'; list.append(h);
  THEMES.forEach(th => {
    const b = document.createElement('button'); b.className = 'tm-item';
    b.innerHTML = `<span class="tm-bar" style="background:linear-gradient(${LADOS.classico.cor},${LADOS.contra.cor})"></span><b></b><span class="tm-d"></span><span class="tm-n"></span>`;
    b.querySelector('b').textContent = th.n; b.querySelector('.tm-d').textContent = th.intro.split('. ')[0] + '.';
    b.querySelector('.tm-n').textContent = `${th.casos.length} casos no mapa`;
    b.onclick = () => { $('#tourMenu').classList.remove('open'); startTheme(th); };
    list.append(b);
  });
  $('#tourMenu').classList.add('open');
}
function stepDur(st){ return 5000 + st.txt.length * 42; }
function startTour(t){
  if (playTimer) stopPlay();
  if (theme) endTheme();
  closeCard();
  tour = {t, i: -1, auto: true, timer: null};
  $('#tour').classList.add('open'); document.body.classList.add('touring');
  $('#tName').textContent = t.n; $('#tName').style.color = t.cor; $('#tBar').style.background = t.cor;
  tourStep(0);
}
function tourStep(i){
  if (!tour) return;
  const t = tour.t; if (i < 0 || i >= t.steps.length) return;
  tour.i = i; const st = t.steps[i];
  clearTimeout(tour.timer);
  closeCard();
  const si = snapFor(st.ano); if (si !== idx) go(si);
  if (st.rt) { if (!showRoutes) { showRoutes = true; $('#tRoutes').checked = true; } selected = {type:'rt', name: st.rt}; }
  else if (st.lugar) selected = {type:'place', name: st.lugar};
  else selected = null;
  redraw();
  if (st.ev) evOverride[st.ev] = performance.now() + 1300;
  flyTo(st.foco, st.k);
  $('#tStep').textContent = `${i + 1} / ${t.steps.length} · ${fmtYear(st.ano)}`;
  $('#tTitle').textContent = st.t; $('#tText').textContent = st.txt;
  $('#tPrev').disabled = i === 0; $('#tNext').textContent = i === t.steps.length - 1 ? 'Fim' : '›';
  $('#tour').scrollTop = 0;
  schedule();
}
function schedule(){
  clearTimeout(tour.timer);
  const bar = $('#tProg');
  bar.style.transition = 'none'; bar.style.width = '0%';
  $('#tAuto').textContent = tour.auto ? '❚❚' : '▶';
  if (!tour.auto) return;
  const dur = stepDur(tour.t.steps[tour.i]);
  requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.transition = `width ${dur}ms linear`; bar.style.width = '100%'; }));
  tour.timer = setTimeout(() => { if (tour.i < tour.t.steps.length - 1) tourStep(tour.i + 1); else { tour.auto = false; schedule(); } }, dur);
}
function endTour(){
  if (!tour) return;
  clearTimeout(tour.timer); tour = null;
  $('#tour').classList.remove('open'); document.body.classList.remove('touring');
  selected = null; redraw();
}
$('#btnTours').onclick = openTourMenu;
$('#tmClose').onclick = () => $('#tourMenu').classList.remove('open');
$('#tourMenu').addEventListener('click', e => { if (e.target.id === 'tourMenu') $('#tourMenu').classList.remove('open'); });
$('#tPrev').onclick = () => tourStep(tour.i - 1);
$('#tNext').onclick = () => tour.i === tour.t.steps.length - 1 ? endTour() : tourStep(tour.i + 1);
$('#tAuto').onclick = () => { tour.auto = !tour.auto; schedule(); };
$('#tClose').onclick = endTour;
window.__tour = (id, i = 0) => { startTour(TOURS.find(t => t.id === id)); if (i) tourStep(i); };

// ---------- enquanto isso ----------
let syncI = 0;
function syncNow(){ const cur = SNAP_YEARS[idx], prev = idx > 0 ? SNAP_YEARS[idx-1] : -Infinity; return SYNC.filter(x => x.y > prev && x.y <= cur); }
function renderSync(){
  const list = syncNow(), el = $('#sync');
  if (!list.length) { el.style.display = 'none'; return; }
  syncI = 0; el.style.display = ''; showSync(list);
}
function showSync(list){
  const el = $('#sync'), x = list[syncI % list.length];
  el.innerHTML = '<b>Enquanto isso…</b> '; el.append(document.createTextNode(x.t));
  if (list.length > 1) { const n = document.createElement('span'); n.className = 'sync-n'; n.textContent = ` (${syncI % list.length + 1}/${list.length}) ›`; el.append(n); }
  el.classList.remove('in'); void el.offsetWidth; el.classList.add('in');
}
$('#sync').onclick = () => { const l = syncNow(); if (l.length > 1) { syncI++; showSync(l); } };

// ---------- grandes perguntas ----------
let theme = null;
function startTheme(th){
  if (tour) endTour();
  if (playTimer) stopPlay();
  closeCard();
  theme = th;
  const si = snapFor(th.ano); if (si !== idx) go(si);
  document.body.classList.add('theming');
  $('#thTitle').textContent = th.n; $('#thIntro').textContent = th.intro;
  const used = [...new Set(th.casos.map(c => c.lado))];
  $('#thLegend').innerHTML = '';
  ['classico', 'contra', 'variante', 'aberto'].filter(l => used.includes(l)).forEach(l => {
    const sp = document.createElement('span'); sp.innerHTML = `<i style="background:${LADOS[l].cor}"></i>`; sp.append(document.createTextNode(LADOS[l].nome)); $('#thLegend').append(sp);
  });
  const ul = $('#thList'); ul.innerHTML = '';
  th.casos.slice().sort((a, b) => a.y - b.y).forEach(c => {
    const b = document.createElement('button'); b.className = 'th-case';
    b.innerHTML = `<i style="background:${LADOS[c.lado].cor}"></i><b></b><span></span>`;
    b.querySelector('b').textContent = c.n; b.querySelector('span').textContent = 'c. ' + fmtYear(c.y);
    b.onclick = () => openCase(c, true); ul.append(b);
  });
  $('#theme').classList.add('open'); $('#theme').scrollTop = 0;
  selected = null; redraw();
  flyTo(th.casos.map(c => c.at));
}
function endTheme(){
  if (!theme) return;
  theme = null; document.body.classList.remove('theming');
  $('#theme').classList.remove('open'); closeCard();
}
function openCase(c, fly){
  selected = {type:'th', name:c.n};
  const L = LADOS[c.lado];
  $('#cKind').textContent = 'Grande pergunta · ' + L.nome;
  $('#cTitle').textContent = c.n; $('#cSub').textContent = theme ? theme.n : '';
  $('#cMeta').innerHTML = `<b>Quando:</b> c. ${fmtYear(c.y)}`;
  $('#cText').textContent = c.t;
  $('#cLink').href = wiki(c.n.replace(/:.*/, '').replace(/'/g, ''));
  $('#cJump').style.display = 'none';
  setBar(L.cor); showCard();
  if (fly) flyTo([c.at], 5);
}
function drawTheme(t){
  for (const c of theme.casos) {
    const p = projection(c.at); if (!p) continue;
    const P = S(p[0], p[1]), L = LADOS[c.lado];
    const sel = selected && selected.type === 'th' && selected.name === c.n;
    const ph = (((t / 2400) + Math.abs(c.y) * 0.37) % 1 + 1) % 1;
    sctx.beginPath(); sctx.arc(P[0], P[1], 8 + ph * 18, 0, 7); sctx.strokeStyle = L.cor; sctx.globalAlpha = (1 - ph) * .7; sctx.lineWidth = 2; sctx.stroke(); sctx.globalAlpha = 1;
    sctx.beginPath(); sctx.arc(P[0], P[1], sel ? 9 : 7, 0, 7); sctx.fillStyle = L.cor; sctx.fill(); sctx.lineWidth = 2; sctx.strokeStyle = '#fff'; sctx.stroke();
    if (showLabels) { haloText(c.n, P[0] + 12, P[1] - 5, '#fff', '700 12px Inter, system-ui, sans-serif'); haloText('c. ' + fmtYear(c.y), P[0] + 12, P[1] + 9, L.cor, '600 11px Inter, system-ui, sans-serif'); }
    overlayTargets.push({kind:'th', c, x:P[0], y:P[1]});
  }
}
$('#thClose').onclick = endTheme;
window.__theme = id => startTheme(THEMES.find(t => t.id === id));

// ---------- busca ----------
const norm = x => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function parsePeriodo(p){
  const parts = p.replace(/^c\.\s*/, '').split('–').map(x => x.trim());
  if (parts.length < 2) return null;
  const num = x => { const m = x.match(/([\d.]+)\s*(mil)?/); if (!m) return null; return parseInt(m[1].replace(/\./g, '')) * (m[2] ? 1000 : 1); };
  const bc2 = /a\.C\./.test(parts[1]);
  const bc1 = /a\.C\./.test(parts[0]) ? true : /d\.C\./.test(parts[0]) ? false : bc2;
  const a = num(parts[0]), b = num(parts[1]); if (a == null || b == null) return null;
  return [bc1 ? -a : a, bc2 ? -b : b];
}
function bestSnapForName(names, mid){
  const ys = [...new Set(names.flatMap(n => OCC[n] || []))].sort((a, b) => a - b);
  if (!ys.length) return snapFor(mid ?? 0);
  if (mid == null) return SNAP_YEARS.indexOf(ys[Math.floor(ys.length / 2)]);
  let best = ys[0]; ys.forEach(y => { if (Math.abs(y - mid) < Math.abs(best - mid)) best = y; });
  return SNAP_YEARS.indexOf(best);
}
let SEARCH = null;
function buildSearch(){
  const items = [], seen = new Set();
  CIVS.forEach(c => {
    const pr = parsePeriodo(c.periodo), mid = pr ? (pr[0] + pr[1]) / 2 : null;
    items.push({kind:'Civilização', label:c.pt, sub:c.periodo, keys:[c.pt, ...c.keys], go:() => goCiv(c.keys, mid)});
    c.keys.forEach(k => seen.add(k));
  });
  PLACES.forEach(p => items.push({kind: p.k === 's' ? 'Sítio' : 'Cidade', label:p.n, sub:p.p + ' · ' + fmtYear(p.y), keys:[p.n], go:() => goPlace(p)}));
  EVENTS.forEach(ev => items.push({kind:'Evento', label:ev.n, sub:fmtRange(ev.y, ev.e), keys:[ev.n, ...(ev.pts || []).map(x => x.l)], go:() => { go(firstSnap(ev.y, ev.e)); setTimeout(() => openEvent(ev, true), 50); }}));
  ROUTES.forEach(rt => items.push({kind:'Rota', label:rt.n, sub:fmtRange(rt.y, rt.e), keys:[rt.n, rt.bens], go:() => { if (!showRoutes) { showRoutes = true; $('#tRoutes').checked = true; } go(firstSnap(rt.y, rt.e)); setTimeout(() => openRoute(rt, true), 50); }}));
  TOURS.forEach(t => items.push({kind:'Passeio', label:t.n, sub:`${t.steps.length} paradas`, keys:[t.n, t.d], go:() => startTour(t)}));
  Object.keys(OCC).forEach(n => { if (!seen.has(n) && n.trim().length > 2) items.push({kind:'Região', label:ptName(n), sub:rangeText(n), keys:[n, ptName(n)], go:() => goCiv([n], null), low:true}); });
  items.forEach(it => it.nk = it.keys.map(norm));
  SEARCH = items;
}
function firstSnap(y, e){ for (let i = 0; i < N; i++) if (overlapsSnap(y, e, i)) return i; return snapFor(y); }
function goCiv(keys, mid){
  const i = bestSnapForName(keys, mid); go(i);
  const f = features(SNAP_YEARS[i]).find(f => keys.includes(f.properties.NAME.trim()));
  if (f) {
    const b = d3.geoBounds(f);
    const pts = b[1][0] - b[0][0] > 180 || b[1][0] < b[0][0] ? [d3.geoCentroid(f)] : [b[0], b[1]];
    flyTo(pts, pts.length === 1 ? 3 : null);
    openCiv(f.properties.NAME.trim());
  }
}
function goPlace(p){
  let i = snapFor(p.y); while (i < N - 1 && !placeVisible(p, i)) i++;
  go(i); flyTo([[p.lon, p.lat]], p.g === 'tt' ? 110 : 6);
  openPlace(p);
}
function runSearch(q){
  const box = $('#sResults'); box.innerHTML = '';
  const nq = norm(q.trim()); if (nq.length < 2) { box.innerHTML = '<div class="s-hint">Digite o nome de uma civilização, cidade, sítio, evento ou rota.</div>'; return; }
  const scored = [];
  for (const it of SEARCH) {
    let sc = 0;
    for (const k of it.nk) {
      if (k === nq) sc = Math.max(sc, 100);
      else if (k.startsWith(nq)) sc = Math.max(sc, 80);
      else if (k.split(/[\s(,:'-]+/).some(w => w.startsWith(nq))) sc = Math.max(sc, 60);
      else if (k.includes(nq)) sc = Math.max(sc, 30);
    }
    if (sc) scored.push([sc - (it.low ? 25 : 0) - (it.kind === 'Rota' && sc < 60 ? 10 : 0), it]);
  }
  scored.sort((a, b) => b[0] - a[0]);
  if (!scored.length) { box.innerHTML = '<div class="s-hint">Nada encontrado.</div>'; return; }
  scored.slice(0, 12).forEach(([, it], j) => {
    const b = document.createElement('button'); b.className = 's-item' + (j === 0 ? ' on' : '');
    b.innerHTML = '<span class="s-k"></span><b></b><span class="s-sub"></span>';
    b.querySelector('.s-k').textContent = it.kind; b.querySelector('b').textContent = it.label; b.querySelector('.s-sub').textContent = it.sub || '';
    b.onclick = () => { closeSearch(); if (tour) endTour(); it.go(); };
    box.append(b);
  });
}
function openSearch(){ if (!SEARCH) buildSearch(); $('#search').classList.add('open'); const i = $('#sInput'); i.value = ''; runSearch(''); setTimeout(() => i.focus(), 30); }
function closeSearch(){ $('#search').classList.remove('open'); }
$('#btnSearch').onclick = openSearch;
$('#sInput').addEventListener('input', e => runSearch(e.target.value));
$('#sInput').addEventListener('keydown', e => {
  const items = [...document.querySelectorAll('.s-item')]; let k = items.findIndex(x => x.classList.contains('on'));
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (items[k]) items[k].classList.remove('on'); k = Math.max(0, Math.min(items.length - 1, k + (e.key === 'ArrowDown' ? 1 : -1))); if (items[k]) { items[k].classList.add('on'); items[k].scrollIntoView({block:'nearest'}); } }
  if (e.key === 'Enter' && items[k]) items[k].click();
  if (e.key === 'Escape') closeSearch();
  e.stopPropagation();
});
$('#search').addEventListener('click', e => { if (e.target.id === 'search') closeSearch(); });
document.addEventListener('keydown', e => { if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && !$('#search').classList.contains('open')) { e.preventDefault(); openSearch(); } });
window.__search = q => { openSearch(); $('#sInput').value = q; runSearch(q); };

// ---------- zoom e toque ----------
const zoom = d3.zoom().scaleExtent([1, 180]).on('zoom', e => { transform = e.transform; redraw(); });
d3.select(canvas).call(zoom).on('dblclick.zoom', null);
let down = null;
canvas.addEventListener('pointerdown', e => down = [e.clientX, e.clientY]);
canvas.addEventListener('pointerup', e => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
  const r = canvas.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top;
  const oh = overlayHit(sx, sy);
  if (oh) return oh.kind === 'ev' ? openEvent(oh.ev) : oh.kind === 'th' ? openCase(oh.c) : openRoute(oh.rt);
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
window.__ne = () => flyTo([[35,26],[62,38]]);
window.addEventListener('resize', () => { setup(); redraw(); });
setup(); slider.value = idx; updateHUD(false);
d3.select(canvas).call(zoom.transform, initialView());
evStart = performance.now();
requestAnimationFrame(tick);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(redraw);
})();

// menu de camadas no celular
(() => {
  const b = document.getElementById('btnLayers'), box = document.getElementById('layers');
  b.onclick = e => { e.stopPropagation(); box.classList.toggle('open'); };
  document.addEventListener('click', e => { if (!box.contains(e.target) && e.target !== b) box.classList.remove('open'); });
})();
