#!/usr/bin/env bash
# Gera data/ a partir de raw/: fronteiras recortadas no litoral, rios, lagos e relevo reprojetado.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p data/borders
for f in raw/historical-basemaps/geojson/world_*.geojson; do
  b=$(basename "$f" .geojson)
  npx mapshaper -i "$f" -filter 'NAME != null && NAME != ""' -filter-fields NAME -clean \
    -clip raw/land50.geojson -simplify 12% keep-shapes -filter-slivers \
    -o data/borders/$b.json format=topojson quantization=20000 force
done
npx mapshaper -i raw/ne_50m_rivers_lake_centerlines.geojson -filter-fields name,scalerank -simplify 30% \
  -o data/rivers.json format=topojson quantization=20000 force
npx mapshaper -i raw/ne_50m_lakes.geojson -filter 'scalerank <= 4' -filter-fields name -simplify 30% \
  -o data/lakes.json format=topojson quantization=20000 force
python3 scripts/relief.py
