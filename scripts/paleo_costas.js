// Converte o campo de raw/paleo_campo.bin em polígonos (z >= nível) (um por nível do mar) e grava raw/paleo.geojson.
// Depois: npx mapshaper raw/paleo.geojson -simplify 25% keep-shapes -filter-slivers min-area=400km2 -o data/paleo.json format=topojson
const fs = require('fs'), path = require('path'), d3 = require('d3');
const R = path.join(__dirname, '..', 'raw');
const meta = JSON.parse(fs.readFileSync(path.join(R, 'paleo_meta.json')));
const raw = fs.readFileSync(path.join(R, 'paleo_campo.bin'));
const vals = new Float64Array(new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4));
const {nx, ny, niveis} = meta, dx = (meta.lon1 - meta.lon0) / (nx - 1), dy = (meta.lat1 - meta.lat0) / (ny - 1);
const conv = ([x, y]) => [+(meta.lon0 + (x - 0.5) * dx).toFixed(3), +(meta.lat0 + (y - 0.5) * dy).toFixed(3)];
const feats = niveis.map((nv, k) => {
  const c = d3.contours().size([nx, ny]).thresholds([nv]).smooth(true)(vals)[0];
  const coords = c.coordinates.map(poly => poly.map(ring => ring.map(conv)));
  return {type: 'Feature', properties: {nivel: nv}, geometry: {type: 'MultiPolygon', coordinates: coords}};
});
fs.writeFileSync(path.join(R, 'paleo.geojson'), JSON.stringify({type: 'FeatureCollection', features: feats}));
console.log(feats.map(f => f.properties.nivel + ':' + f.geometry.coordinates.length).join(' '));
