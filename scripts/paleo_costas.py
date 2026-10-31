"""Terras hoje submersas: a partir da topografia/batimetria ETOPO1 em grade de 10' (raw/topo10.nc),
gera o campo de altitude usado para traçar a linha de costa de cada nível do mar (raw/paleo_campo.bin).
Lagos e mares fechados (Cáspio, Mar Negro, Aral) e mares cobertos por gelo ou deformados pelo peso do gelo
(Báltico, Mar Branco, Baía de Hudson) recebem -9999 e ficam de fora: tinham nível próprio.
Os polígonos (z >= nível, incluindo a terra atual) saem de scripts/paleo_costas.js; no mapa eles são
desenhados com composição "lighten", que só aparece sobre o mar escuro."""
import h5py, json, numpy as np, pathlib
from scipy import ndimage
ROOT = pathlib.Path(__file__).resolve().parent.parent
NIVEIS = [-70, -60, -55, -50, -45, -40, -35, -30, -25, -20, -15, -10, -5, -2]
f = h5py.File(ROOT / 'raw' / 'topo10.nc')
lon, lat, z = f['longitude'][:], f['latitude'][:], f['topography'][:].astype(np.float32)
agua = z < 0
lab, n = ndimage.label(agua)                      # componentes conexas de água (4-vizinhos)
tam = ndimage.sum(np.ones_like(z), lab, index=np.arange(1, n + 1))
oceano = np.zeros_like(agua)
def caixa(lo0, lo1, la0, la1):
    return (lon[None, :] >= lo0) & (lon[None, :] <= lo1) & (lat[:, None] >= la0) & (lat[:, None] <= la1)
fechados = caixa(46, 56, 36, 48) | caixa(27, 42, 40.5, 47.5) | caixa(58, 62, 43, 47)  # Cáspio, Mar Negro + Azov, Aral
for i in np.argsort(-tam):
    if tam[i] < 400: break                          # lagos pequenos
    comp = lab == i + 1
    if (comp & fechados).sum() > 0.5 * comp.sum(): continue
    oceano |= comp
gelo = caixa(12, 31, 53.5, 66.5) | caixa(32, 45, 63, 68.5) | caixa(-96, -76, 51, 64.5)  # Báltico, Mar Branco, Baía de Hudson
campo = z.copy()
campo[agua & ~oceano] = -9999
campo[agua & gelo] = -9999
campo.astype(np.float32).tofile(ROOT / 'raw' / 'paleo_campo.bin')
json.dump(dict(niveis=NIVEIS, nx=int(z.shape[1]), ny=int(z.shape[0]), lon0=float(lon[0]), lon1=float(lon[-1]), lat0=float(lat[0]), lat1=float(lat[-1])),
          open(ROOT / 'raw' / 'paleo_meta.json', 'w'))
print('ok', campo.shape)
