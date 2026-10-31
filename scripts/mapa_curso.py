"""Gera o mapa desenhado (estilo tabuleiro) de um curso: costa, rios, lagos e as cidades principais.

Projeção equirretangular simples, ajustada à latitude média, para que a página projete
qualquer ponto (lon, lat) com uma conta: x = (lon - lon0) * kx, y = (lat1 - lat) * k.
Fontes dos dados: Natural Earth 1:50m (world-atlas, rios e lagos do atlas).
"""
import csv, json, math, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent

CURSOS = {
    'oriente-antigo': dict(lon0=24, lon1=64, lat0=12, lat1=44, largura=1000,
                           cidades_ate=-2000, excluir={'Pirâmides de Gizé'}),
}

def topo_feats(path, so=None):
    t = json.loads(pathlib.Path(path).read_text())
    sx, sy = t['transform']['scale']; tx, ty = t['transform']['translate']
    arcs = []
    for a in t['arcs']:
        x = y = 0; pts = []
        for dx, dy in a:
            x += dx; y += dy; pts.append((x * sx + tx, y * sy + ty))
        arcs.append(pts)
    def arc(i):
        return arcs[i] if i >= 0 else arcs[~i][::-1]
    def ring(ids):
        out = []
        for i in ids:
            p = arc(i); out.extend(p if not out else p[1:])
        return out
    feats = []
    for nome, obj in t['objects'].items():
        if so and nome != so: continue
        geoms = obj.get('geometries', [obj])
        for g in geoms:
            ty_ = g.get('type')
            if ty_ == 'Polygon': feats.append(('poly', [ring(r) for r in g['arcs']]))
            elif ty_ == 'MultiPolygon':
                for poly in g['arcs']: feats.append(('poly', [ring(r) for r in poly]))
            elif ty_ == 'LineString': feats.append(('line', [ring(g['arcs'])]))
            elif ty_ == 'MultiLineString':
                for l in g['arcs']: feats.append(('line', [ring(l)]))
    return feats

def gerar(curso):
    c = CURSOS[curso]
    k = c['largura'] / ((c['lon1'] - c['lon0']) * math.cos(math.radians((c['lat0'] + c['lat1']) / 2)))
    kx = k * math.cos(math.radians((c['lat0'] + c['lat1']) / 2))
    W = c['largura']; H = round((c['lat1'] - c['lat0']) * k)
    P = lambda lon, lat: ((lon - c['lon0']) * kx, (c['lat1'] - lat) * k)
    M = 12
    def clip(poly):
        # Sutherland-Hodgman contra a moldura (com folga M)
        def cut(pts, inside, inter):
            out = []
            for i in range(len(pts)):
                a, b = pts[i - 1], pts[i]
                if inside(b):
                    if not inside(a): out.append(inter(a, b))
                    out.append(b)
                elif inside(a): out.append(inter(a, b))
            return out
        def ix(x0):
            return lambda a, b: (x0, a[1] + (b[1] - a[1]) * (x0 - a[0]) / (b[0] - a[0]))
        def iy(y0):
            return lambda a, b: (a[0] + (b[0] - a[0]) * (y0 - a[1]) / (b[1] - a[1]), y0)
        for inside, inter in ((lambda p: p[0] >= -M, ix(-M)), (lambda p: p[0] <= W + M, ix(W + M)),
                              (lambda p: p[1] >= -M, iy(-M)), (lambda p: p[1] <= H + M, iy(H + M))):
            if not poly: break
            poly = cut(poly, inside, inter)
        return poly
    def simpl(pts, passo):
        out, last = [], None
        for x, y in pts:
            if last and math.hypot(x - last[0], y - last[1]) < passo: continue
            out.append((round(x), round(y))); last = (x, y)
        return out
    def path(pts, fechar, passo=2.2):
        xy = [P(lon, lat) for lon, lat in pts]
        if fechar:
            res = simpl(clip(xy), passo)
            return 'M' + 'L'.join(f'{x} {y}' for x, y in res) + 'Z' if len(res) >= 3 else ''
        segs, cur = [], []
        for x, y in xy:
            if -M < x < W + M and -M < y < H + M: cur.append((x, y))
            elif cur: segs.append(cur); cur = []
        if cur: segs.append(cur)
        out = ''
        for sg in segs:
            res = simpl(sg, passo)
            if len(res) >= 2: out += 'M' + 'L'.join(f'{x} {y}' for x, y in res)
        return out
    terra = ''.join(path(r, True) for kind, rings in topo_feats(ROOT / 'node_modules/world-atlas/countries-50m.json', 'countries') for r in rings[:1])
    lagos = ''.join(path(r, True, 1.5) for kind, rings in topo_feats(ROOT / 'data/lakes.json') for r in rings[:1])
    rios = ''.join(path(r, False, 1.8) for kind, rings in topo_feats(ROOT / 'data/rivers.json') for r in rings)
    cidades = []
    with open(ROOT / 'data/conteudo/lugares.csv', encoding='utf-8') as f:
        for r in csv.DictReader(f):
            lon, lat = float(r['lon']), float(r['lat'])
            if r['importancia'] == '3' and int(r['ano_inicio'] or 0) <= c['cidades_ate'] and r['nome'] not in c['excluir'] \
               and c['lon0'] < lon < c['lon1'] and c['lat0'] < lat < c['lat1']:
                x, y = P(lon, lat); cidades.append(dict(n=r['nome'], x=round(x), y=round(y)))
    svg = (f'<rect width="{W}" height="{H}" class="mar"/>'
           f'<defs><path id="terra" d="{terra}"/></defs><use class="costa" href="#terra"/><use class="terra" href="#terra"/><path class="lago" d="{lagos}"/><path class="rio" d="{rios}"/>')
    return dict(w=W, h=H, lon0=c['lon0'], lat1=c['lat1'], k=k, kx=kx, svg=svg, cidades=cidades)

if __name__ == '__main__':
    m = gerar('oriente-antigo')
    print(m['w'], m['h'], len(m['svg']), [x['n'] for x in m['cidades']])
