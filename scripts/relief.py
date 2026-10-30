"""Reprojeta o relevo sombreado (Natural Earth, via basemap-data) para Natural Earth 1 (d3)
e escurece os oceanos. Gera relief_world.jpg e relief_hi.jpg + relief.json com os limites em coords cruas."""
import json, numpy as np
from PIL import Image, ImageDraw
Image.MAX_IMAGE_PIXELS = None
import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'raw') + '/'
OUT = os.path.join(ROOT, 'data') + '/'
src = Image.open(RAW + 'shadedrelief.jpg').convert('RGB')
SW, SH = src.size  # 10800 x 5400

# --- máscara de terra (land-10m) com tratamento do antimeridiano
from PIL import ImageFilter
land = json.load(open(RAW + 'land10.geojson'))
mask = Image.new('L', (SW, SH), 0); d = ImageDraw.Draw(mask)
def unwrap(r):
    out = [list(r[0])]; off = 0
    for a_, b_ in zip(r, r[1:]):
        dl = b_[0] - a_[0]
        if dl > 180: off -= 360
        elif dl < -180: off += 360
        out.append([b_[0] + off, b_[1]])
    return out
def draw_ring(r, fill):
    lons = [c[0] for c in r]
    if max(lons) - min(lons) > 270:
        r = unwrap(r)
        if min(c[1] for c in r) < -60:  # Antártida: fecha pelo polo
            r = r + [[r[-1][0], -90], [r[0][0], -90]]
        offs = (-360, 0, 360)
    else:
        offs = (0,)
    for o in offs:
        d.polygon([((c[0] + o + 180) / 360 * SW, (90 - c[1]) / 180 * SH) for c in r], fill=fill)
for g in land['geometries']:
    polys = [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']
    for p in polys:
        draw_ring(p[0], 255)
        for h in p[1:]: draw_ring(h, 0)
# lagos grandes (Cáspio etc.) pela cor, só onde a cor é claramente de água
_a = np.asarray(src).astype(np.int16)
lake = ((_a[..., 2] - _a[..., 0]) > 30) & ((_a[..., 2] - _a[..., 1]) > 8)
m0 = np.asarray(mask).copy(); m0[lake] = 0
mask = Image.fromarray(m0).filter(ImageFilter.GaussianBlur(1.5))
a = np.asarray(src).astype(np.float32)
m = (np.asarray(mask).astype(np.float32) / 255)[..., None]
lum = a.mean(axis=2, keepdims=True)
navy = np.array([14, 30, 44], np.float32)
ocean = navy + (lum - 200) * np.array([0.10, 0.16, 0.22], np.float32)  # leve variação
land_c = a * 0.96
out = land_c * m + ocean * (1 - m)
srcarr = np.clip(out, 0, 255).astype(np.uint8)
print('recolored')

def fwd_y(phi):
    p2 = phi * phi; p4 = p2 * p2
    return phi * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4)))
def xpoly(phi):
    p2 = phi * phi; p4 = p2 * p2
    return 0.8707 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4))
def inv(x, y):
    phi = y.copy()
    for _ in range(30):
        p2 = phi * phi; p4 = p2 * p2
        f = fwd_y(phi) - y
        df = 1.007226 + p2 * (0.015085 * 3 + p4 * (-0.044475 * 7 + 0.028874 * 9 * p2 - 0.005916 * 11 * p4))
        phi = phi - f / df
    lam = x / xpoly(phi)
    return lam, phi
XMAX = np.pi * 0.8707; YMAX = float(fwd_y(np.array(np.pi / 2)))

def render(arr, x0, x1, y0, y1, width, name, q):
    h, w = arr.shape[:2]
    height = int(round(width * (y1 - y0) / (x1 - x0)))
    xs = np.linspace(x0, x1, width, dtype=np.float64)
    ys = np.linspace(y1, y0, height, dtype=np.float64)  # topo = y máximo
    X, Y = np.meshgrid(xs, ys)
    lam, phi = inv(X, Y)
    ok = (np.abs(lam) <= np.pi) & (np.abs(phi) <= np.pi / 2)
    u = np.clip(((lam + np.pi) / (2 * np.pi) * w).astype(np.int32), 0, w - 1)
    v = np.clip(((np.pi / 2 - phi) / np.pi * h).astype(np.int32), 0, h - 1)
    img = arr[v, u]
    img[~ok] = (8, 16, 24)
    Image.fromarray(img).save(OUT + name, quality=q, optimize=True, progressive=True)
    print(name, width, height)
    return {'x0': x0, 'x1': x1, 'y0': y0, 'y1': y1}

meta = {}
small = np.asarray(Image.fromarray(srcarr).resize((5400, 2700), Image.LANCZOS))
meta['world'] = render(small, -XMAX, XMAX, -YMAX, YMAX, 4096, 'relief_world.jpg', 80)
# Região de alta resolução: Mediterrâneo -> Indo (lon -12..82, lat 8..50)
def fx(lon, lat):
    lam, phi = np.radians(lon), np.radians(lat); return lam * xpoly(phi), fwd_y(phi)
xa = fx(-12, 30)[0]; xb = fx(82, 30)[0]; ya = fwd_y(np.radians(8.0)); yb = fwd_y(np.radians(50.0))
meta['hi'] = render(srcarr, float(xa), float(xb), float(ya), float(yb), 3000, 'relief_hi.jpg', 78)
json.dump(meta, open(OUT + 'relief.json', 'w'))
print(meta)
