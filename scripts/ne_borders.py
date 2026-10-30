"""Fronteiras do Oriente Próximo desenhadas para o atlas (3500–1500 a.C.).
São zonas aproximadas, desenhadas a partir de mapas históricos de referência e da localização das cidades;
o litoral é recortado depois pelo contorno real (land-50m). Coordenadas em [lon, lat].
Gera raw/ne_custom_raw.geojson."""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# --- formas reutilizadas ---
SUMER = [[44.3,32.6],[45.6,32.7],[46.5,32.2],[47.4,31.4],[48.3,30.3],[47.7,29.9],[46.5,30.3],[45.4,30.8],[44.6,31.5],[44.1,32.1]]
SUMER_AKKAD = [[43.7,33.4],[44.6,33.9],[45.6,33.9],[46.3,32.9],[47.3,31.8],[48.0,30.8],[48.6,30.0],[47.6,29.9],[46.5,30.3],[45.6,30.6],[44.8,31.3],[44.1,32.2],[43.6,32.9]]
SUSIANA = [[47.6,32.9],[48.6,32.9],[49.5,32.2],[49.6,31.3],[48.9,30.8],[48.0,31.0],[47.5,31.8]]
ELAM = [[47.5,32.8],[48.8,33.3],[50.5,32.6],[52.5,31.2],[54.0,29.8],[53.7,28.4],[52.0,28.0],[50.6,29.0],[49.6,30.2],[48.9,30.6],[48.0,31.0],[47.5,31.8]]
ELAM_ALTO = [[49.5,32.3],[51.0,31.8],[52.6,31.0],[53.8,29.8],[53.6,28.6],[52.2,28.2],[51.0,28.8],[50.3,29.6],[49.6,30.6]]
PROTO_ELAM = [[47.5,32.8],[49.5,33.6],[51.6,34.4],[53.5,33.6],[56.0,31.0],[58.0,29.8],[59.5,29.0],[58.5,27.8],[56.5,27.5],[53.5,28.0],[51.0,28.6],[49.6,30.2],[48.6,30.6],[47.6,31.4]]
JIROFT = [[56.2,30.6],[57.6,30.8],[58.9,29.8],[59.2,28.4],[58.4,27.4],[57.0,27.4],[56.2,28.2],[55.9,29.4]]
MARHASHI = [[55.6,31.2],[57.6,31.4],[59.4,30.2],[59.6,28.3],[58.6,27.0],[56.8,27.0],[55.6,28.0],[55.2,29.6]]
HELMAND = [[60.5,31.8],[62.3,31.9],[62.6,30.6],[61.6,29.9],[60.6,30.2],[60.3,31.0]]
DILMUN = [[49.4,27.4],[50.3,27.0],[50.9,26.5],[50.8,25.7],[50.2,25.8],[49.7,26.3],[49.2,26.9]]
MAGAN = [[55.6,26.3],[56.4,26.4],[57.3,24.0],[58.7,23.7],[59.9,22.5],[58.9,20.6],[57.6,20.8],[56.4,22.4],[55.7,24.2],[55.4,25.3]]
MARI = [[39.6,35.6],[40.6,35.6],[41.6,34.9],[42.2,34.3],[41.8,33.8],[40.8,34.1],[39.9,34.7]]
EBLA = [[36.1,36.6],[37.4,36.7],[38.2,36.2],[38.0,35.3],[37.0,34.9],[36.2,35.2],[35.9,35.9]]
ASSUR = [[42.9,35.9],[43.6,35.9],[43.8,35.3],[43.2,35.1],[42.8,35.4]]
ASSIRIA_ANTIGA = [[42.6,36.4],[43.9,36.4],[44.1,35.3],[43.2,34.9],[42.6,35.4]]
NORTE = [[38.6,37.2],[40.2,37.5],[42.0,37.4],[43.8,37.1],[44.6,36.4],[43.9,35.9],[42.6,36.0],[41.0,36.2],[39.6,36.3],[38.7,36.6]]
GUTIS = [[45.4,35.6],[46.6,35.4],[47.6,34.6],[47.8,33.8],[46.8,33.5],[45.9,34.2],[45.2,35.0]]
LULLUBI = [[45.0,36.3],[46.0,36.4],[46.5,35.7],[45.6,35.4],[44.9,35.7]]
SHIMASHKI = [[47.8,34.6],[49.6,34.4],[51.0,33.6],[50.6,32.7],[48.9,33.2],[47.9,33.7]]
AMORREUS = [[37.4,35.1],[39.0,35.4],[40.4,34.8],[41.2,33.9],[40.3,33.0],[38.6,33.2],[37.4,34.0]]
CANAA = [[34.3,31.2],[35.1,33.3],[35.6,34.6],[36.4,34.9],[36.6,33.4],[35.8,31.3],[34.9,30.8]]
ANATOLIA_CIDADES = [[33.3,39.5],[35.8,39.8],[37.0,38.9],[36.3,37.9],[34.4,38.0],[33.2,38.6]]
DIYALA = [[44.3,33.3],[45.3,34.0],[45.9,33.6],[45.2,33.0],[44.5,33.0]]
UR_III = [[42.6,35.8],[43.8,35.9],[44.8,35.2],[45.7,34.2],[46.6,33.1],[47.6,32.9],[48.8,33.0],[49.4,32.0],[49.2,31.0],[48.6,30.0],[47.6,29.9],[46.5,30.3],[45.4,30.8],[44.3,31.6],[43.5,32.6],[43.0,33.6],[42.5,34.8]]
AKKAD_IMP = [[38.9,36.6],[40.6,37.1],[42.5,37.0],[43.9,36.6],[44.8,35.6],[45.6,34.4],[46.5,33.1],[47.6,32.9],[48.8,33.0],[49.5,32.2],[49.4,31.0],[48.6,30.0],[47.6,29.9],[46.5,30.3],[45.4,30.8],[44.3,31.6],[43.4,32.6],[42.3,33.6],[41.2,34.2],[40.2,34.8],[39.2,35.6]]
BABILONIA_HAM = [[40.0,35.0],[41.2,35.1],[42.6,34.8],[43.6,35.0],[44.6,34.6],[45.7,34.0],[46.5,33.1],[47.4,32.4],[48.1,31.2],[48.6,30.0],[47.6,29.9],[46.5,30.3],[45.4,30.8],[44.3,31.6],[43.4,32.6],[42.2,33.5],[41.0,34.1]]
BABILONIA_CASSITA = [[42.6,34.6],[43.6,35.0],[44.6,34.6],[45.7,34.0],[46.5,33.1],[47.4,32.4],[48.1,31.2],[48.6,30.0],[47.6,29.9],[46.5,30.3],[45.4,30.8],[44.3,31.6],[43.4,32.6],[42.4,33.6]]
YAMHAD = [[35.8,36.9],[37.6,37.0],[38.6,36.4],[38.2,35.5],[36.9,35.2],[36.0,35.5],[35.7,36.3]]
QATNA = [[36.3,35.2],[37.6,35.2],[37.9,34.5],[37.0,34.1],[36.3,34.4]]
MITANNI = [[36.5,37.4],[38.5,37.8],[41.0,37.7],[43.0,37.4],[44.2,36.6],[43.4,35.6],[41.5,35.6],[39.5,35.7],[37.6,35.9],[36.3,36.4]]
HITITAS = [[31.5,40.6],[34.5,41.4],[36.5,40.8],[37.3,39.4],[36.6,37.6],[34.5,37.4],[32.6,37.8],[31.4,39.0]]
ISIN = [[44.6,32.6],[45.6,32.6],[45.9,31.8],[45.2,31.5],[44.5,31.9]]
LARSA = [[45.6,31.6],[46.6,31.6],[47.4,31.0],[47.0,30.4],[46.0,30.6],[45.5,31.1]]
UBAID_NORTE = [[41.0,36.9],[43.0,36.9],[44.2,36.3],[43.3,35.8],[41.6,36.0],[40.8,36.4]]
URUK_EXP = [[38.0,36.2],[38.5,36.6],[39.2,35.9],[40.6,35.2],[41.6,34.6],[42.3,34.2],[41.8,33.9],[40.8,34.3],[39.6,35.1],[38.4,35.6]]

def P(name, ring): return (name, ring)
MAPS = {
  -3500: [P("Suméria (período de Uruk)", SUMER), P("Expansão de Uruk", URUK_EXP), P("Susiana", SUSIANA),
          P("Alta Mesopotâmia (Tepe Gawra e Tell Brak)", UBAID_NORTE), P("Cultura de Jiroft", JIROFT)],
  -3000: [P("Cidades-Estado sumérias", SUMER_AKKAD), P("Esfera proto-elamita", PROTO_ELAM), P("Cultura de Helmand", HELMAND),
          P("Cultura de Jiroft", JIROFT), P("Alta Mesopotâmia (Ninivita 5)", NORTE), P("Cultura de Hafit (Omã)", MAGAN)],
  -2500: [P("Cidades-Estado sumérias", SUMER_AKKAD), P("Elam", ELAM), P("Marhashi", MARHASHI), P("Cultura de Helmand", HELMAND),
          P("Dilmun", DILMUN), P("Magan", MAGAN), P("Reino de Mari", MARI), P("Reino de Ebla", EBLA),
          P("Alta Mesopotâmia (Subartu)", NORTE), P("Cidades cananeias", CANAA)],
  -2250: [P("Império Acádio", AKKAD_IMP), P("Elam", ELAM_ALTO), P("Marhashi", MARHASHI), P("Cultura de Helmand", HELMAND),
          P("Dilmun", DILMUN), P("Magan", MAGAN), P("Gutis", GUTIS), P("Lullubi", LULLUBI), P("Cidades cananeias", CANAA)],
  -2050: [P("Terceira Dinastia de Ur", UR_III), P("Shimashki", SHIMASHKI), P("Elam", ELAM_ALTO), P("Marhashi", MARHASHI),
          P("Dilmun", DILMUN), P("Magan", MAGAN), P("Reino de Mari", MARI), P("Amorreus", AMORREUS),
          P("Reinos hurritas", NORTE), P("Cidades cananeias", CANAA)],
  -2000: [P("Isin", ISIN), P("Larsa", LARSA), P("Eshnunna", DIYALA), P("Assur", ASSUR), P("Elam", ELAM), P("Marhashi", MARHASHI),
          P("Dilmun", DILMUN), P("Magan", MAGAN), P("Reino de Mari", MARI), P("Amorreus", AMORREUS), P("Reinos hurritas", NORTE),
          P("Cidades cananeias", CANAA), P("Cidades-Estado anatólias", ANATOLIA_CIDADES)],
  -1750: [P("Babilônia de Hamurabi", BABILONIA_HAM), P("Elam", ELAM), P("Assíria antiga", ASSIRIA_ANTIGA), P("Yamhad", YAMHAD),
          P("Qatna", QATNA), P("Dilmun", DILMUN), P("Reinos hurritas", NORTE), P("Cidades cananeias", CANAA),
          P("Cidades-Estado anatólias", ANATOLIA_CIDADES)],
  -1500: [P("Mitanni", MITANNI), P("Babilônia cassita", BABILONIA_CASSITA), P("Elam", ELAM), P("Assíria (vassala de Mitanni)", ASSUR),
          P("Hititas", HITITAS), P("Dilmun", DILMUN), P("Cidades cananeias", CANAA)],
}
feats = []
for ano, lst in MAPS.items():
    for name, ring in lst:
        r = ring + [ring[0]]
        feats.append({"type": "Feature", "properties": {"NAME": name, "ano": ano, "custom": 1}, "geometry": {"type": "Polygon", "coordinates": [r]}})
os.makedirs(os.path.join(ROOT, 'raw'), exist_ok=True)
json.dump({"type": "FeatureCollection", "features": feats}, open(os.path.join(ROOT, 'raw', 'ne_custom_raw.geojson'), 'w'))
print(len(feats), 'polígonos em', len(MAPS), 'mapas')
