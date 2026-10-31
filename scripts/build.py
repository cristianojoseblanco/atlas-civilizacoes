"""Monta index.html (um arquivo só, autocontido) a partir de src/ e data/."""
import base64, json, os, pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import conteudo, licoes, csv, mapa_curso
ROOT = pathlib.Path(__file__).resolve().parent.parent
src, data, nm = ROOT / 'src', ROOT / 'data', ROOT / 'node_modules'

def snaps():
    out = {}
    for f in sorted((data / 'borders').glob('world_*.json')):
        m = re.match(r'world_(bc)?(\d+)\.json', f.name)
        y = int(m.group(2)) * (-1 if m.group(1) else 1)
        t = json.loads(f.read_text()); k = list(t['objects'])[0]; t['objects'] = {'r': t['objects'][k]}
        out[y] = t
    meta = json.loads((data / 'ne_meta.json').read_text())
    # anos extras no fim da Era do Gelo, para ver o mar subir (reaproveitam as fronteiras do ano-base)
    for y, b in {-9000: -10000, -7000: -8000, -6500: -8000, -6000: -8000}.items(): meta.setdefault(str(y), {'base': b, 'remove': []})
    years = sorted(set(out) | {int(k) for k in meta})
    return ('const NE_META=' + json.dumps({int(k): v for k, v in meta.items()}) + ';const NE_CUSTOM=' + (data / 'ne_custom.json').read_text() +
            ';const SNAP_YEARS=' + json.dumps(years) + ';\nconst SNAPS=' +
            json.dumps({str(k): v for k, v in out.items()}, separators=(',', ':')) + ';')

def geo():
    b64 = lambda f: 'data:image/jpeg;base64,' + base64.b64encode((data / f).read_bytes()).decode()
    return ('const RIVERS=' + (data / 'rivers.json').read_text() + ';const LAKES=' + (data / 'lakes.json').read_text() +
            ';const PALEO=' + (data / 'paleo.json').read_text() + ';const RELIEF_META=' + (data / 'relief.json').read_text() +
            ';const RELIEF_WORLD="' + b64('relief_world.jpg') + '";const RELIEF_HI="' + b64('relief_hi.jpg') + '";')

parts = {
    'D3': (nm / 'd3/dist/d3.min.js').read_text(),
    'TOPO': (nm / 'topojson-client/dist/topojson-client.min.js').read_text(),
    'SNAPS': snaps(),
    'GEO': geo(),
    'PLACES': conteudo.gerar(),
    'CONTENT': (src / 'art.js').read_text(),
    'APP': (src / 'app.js').read_text(),
}
html = (src / 'template.html').read_text()
for k, v in parts.items():
    html = html.replace('/*' + k + '*/', v.replace('</script', '<\\/script'), 1)
(ROOT / 'index.html').write_text(html)
print('index.html', round(len(html.encode()) / 1e6, 2), 'MB')

# ---------- aprender.html: o jogo das lições ----------
with open(data / 'conteudo' / 'fontes.csv', encoding='utf-8') as f: FT = {r['id']: r for r in csv.DictReader(f)}
L, erros = licoes.gerar(set(FT))
if erros: sys.exit('lições com erro:\n' + '\n'.join(erros))
usadas = set()
for lic in L['licoes'].values():
    usadas |= {f['id'] for f in lic['fontes']}
    for s_ in lic['secoes']: usadas |= {f['id'] for f in s_['fontes']}
fj = {k: dict(titulo=FT[k]['titulo'], autores=FT[k]['autores'], ano=FT[k]['ano'], url=FT[k]['url']) for k in sorted(usadas)}
ap = (src / 'aprender.html').read_text()
MP = mapa_curso.gerar('oriente-antigo')
vjd = ROOT / 'assets' / 'viajante'
VJ = {k: (vjd / f).read_text() for k, f in {'parado': 'parado-mesopotamia.svg', 'andando': 'andando-mesopotamia.svg', 'comemorando': 'comemorando-mesopotamia.svg', 'retrato': 'retrato-mesopotamia.svg'}.items()}
for k, v in {'LICOES': 'const LICOES=' + json.dumps(L, ensure_ascii=False) + ';', 'FONTES': 'const FONTES=' + json.dumps(fj, ensure_ascii=False) + ';',
             'MAPA': 'const MAPA=' + json.dumps(MP, ensure_ascii=False) + ';const VJ=' + json.dumps(VJ, ensure_ascii=False) + ';',
             'APRENDER': (src / 'aprender.js').read_text()}.items():
    ap = ap.replace('/*' + k + '*/', v.replace('</script', '<\\/script'), 1)
(ROOT / 'aprender.html').write_text(ap)
print('aprender.html', round(len(ap.encode()) / 1e3), 'kB;', len(L['licoes']), 'lições publicadas')

# ---------- prototipo-a.html: protótipo de acabamento (referência: jogo bem acabado) ----------
lic = L['licoes']['revolucao-urbana']
lim = {'iniciante': 1, 'colegio': 2, 'graduacao': 3}
secs = [dict(titulo=s_['titulo'], ano=s_['ano'], foco=s_['foco'], zoom=s_['zoom'], paragrafos=s_['paragrafos'][:3],
             perguntas=[q for q in s_['perguntas'] if lim.get(q['nivel'], 2) <= 2][:4]) for s_ in lic['secoes']]
fundo = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {MP["w"]} {MP["h"]}" preserveAspectRatio="xMidYMid slice">'
         '<style>.mar{fill:#3D7F8F}.costa{fill:#0F1A22;stroke:#0F1A22;stroke-width:4}.terra{fill:#F1DCA6}.lago{fill:#3D7F8F}.rio{fill:none;stroke:#2B6576;stroke-width:1.6}</style>'
         + MP['svg'] + '</svg>')
DADOS = dict(licao=dict(titulo=lic['titulo'], secoes=secs), mapa=MP, mapaFundo=fundo, vj=VJ,
             unidades=[dict(titulo=u['titulo'], periodo=u['periodo'], licoes=[dict(titulo=x['titulo']) for x in u['licoes']]) for u in L['unidades'][:2]])
pa = (src / 'prototipo-a.html').read_text()
for k, v in {'DADOS': 'const DADOS=' + json.dumps(DADOS, ensure_ascii=False) + ';', 'PROTO': (src / 'prototipo-a.js').read_text()}.items():
    pa = pa.replace('/*' + k + '*/', v.replace('</script', '<\\/script'), 1)
(ROOT / 'prototipo-a.html').write_text(pa)
print('prototipo-a.html', round(len(pa.encode()) / 1e3), 'kB')

# ---------- prototipo-b.html: trilha e mapa lado a lado, sincronizados ----------
DADOS_B = dict(DADOS, unidades=[dict(titulo=u['titulo'], periodo=u['periodo'], licoes=[dict(id=x['id'], titulo=x['titulo'], lugar=x['lugar'], lon=x['lon'], lat=x['lat'], ano=x['ano'], requisitos=x['requisitos'], publicada=x['publicada']) for x in u['licoes']]) for u in L['unidades']])
DADOS_B.pop('mapaFundo')
pb = (src / 'prototipo-b.html').read_text()
for k, v in {'DADOS': 'const DADOS=' + json.dumps(DADOS_B, ensure_ascii=False) + ';', 'PROTO': (src / 'prototipo-b.js').read_text()}.items():
    pb = pb.replace('/*' + k + '*/', v.replace('</script', '<\\/script'), 1)
(ROOT / 'prototipo-b.html').write_text(pb)
print('prototipo-b.html', round(len(pb.encode()) / 1e3), 'kB')

# ---------- prototipo-c.html: aprender mexendo (referência Brilliant) ----------
uruk = next(r for r in csv.DictReader(open(ROOT / 'data' / 'conteudo' / 'lugares.csv', encoding='utf-8')) if r['id'] == 'L002')
DADOS_C = dict(mapa={k: MP[k] for k in ('svg', 'w', 'h', 'lon0', 'lat1', 'k', 'kx')}, vj=VJ, uruk=dict(lon=float(uruk['lon']), lat=float(uruk['lat'])))
pc = (src / 'prototipo-c.html').read_text()
for k, v in {'DADOS': 'const DADOS=' + json.dumps(DADOS_C, ensure_ascii=False) + ';', 'PROTO': (src / 'prototipo-c.js').read_text()}.items():
    pc = pc.replace('/*' + k + '*/', v.replace('</script', '<\\/script'), 1)
(ROOT / 'prototipo-c.html').write_text(pc)
print('prototipo-c.html', round(len(pc.encode()) / 1e3), 'kB')
