#!/usr/bin/env bash
# Baixa os dados brutos (não versionados) para raw/. Só é preciso para regenerar data/.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p raw && cd raw
[ -d historical-basemaps ] || git clone --depth 1 https://github.com/aourednik/historical-basemaps.git
NE=https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson
curl -sSfo ne_50m_rivers_lake_centerlines.geojson $NE/ne_50m_rivers_lake_centerlines.geojson
curl -sSfo ne_50m_lakes.geojson $NE/ne_50m_lakes.geojson
# Relevo sombreado do Natural Earth, distribuído no pacote basemap-data
pip download basemap-data --no-deps -d . -q
python3 -c "import zipfile,glob; z=zipfile.ZipFile(glob.glob('basemap_data-*.whl')[0]); open('shadedrelief.jpg','wb').write(z.read('mpl_toolkits/basemap_data/shadedrelief.jpg'))"
npx mapshaper -i ../node_modules/world-atlas/land-10m.json -o land10.geojson format=geojson force
npx mapshaper -i ../node_modules/world-atlas/land-50m.json -o land50.geojson format=geojson force
