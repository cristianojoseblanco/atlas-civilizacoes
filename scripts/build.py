"""Monta index.html (um arquivo só, autocontido) a partir de src/ e data/."""
import base64, json, os, pathlib, re
ROOT = pathlib.Path(__file__).resolve().parent.parent
src, data, nm = ROOT / 'src', ROOT / 'data', ROOT / 'node_modules'

def snaps():
    out = {}
    for f in sorted((data / 'borders').glob('world_*.json')):
        m = re.match(r'world_(bc)?(\d+)\.json', f.name)
        y = int(m.group(2)) * (-1 if m.group(1) else 1)
        t = json.loads(f.read_text()); k = list(t['objects'])[0]; t['objects'] = {'r': t['objects'][k]}
        out[y] = t
    return ('const SNAP_YEARS=' + json.dumps(sorted(out)) + ';\nconst SNAPS=' +
            json.dumps({str(k): v for k, v in out.items()}, separators=(',', ':')) + ';')

def geo():
    b64 = lambda f: 'data:image/jpeg;base64,' + base64.b64encode((data / f).read_bytes()).decode()
    return ('const RIVERS=' + (data / 'rivers.json').read_text() + ';const LAKES=' + (data / 'lakes.json').read_text() +
            ';const RELIEF_META=' + (data / 'relief.json').read_text() +
            ';const RELIEF_WORLD="' + b64('relief_world.jpg') + '";const RELIEF_HI="' + b64('relief_hi.jpg') + '";')

parts = {
    'D3': (nm / 'd3/dist/d3.min.js').read_text(),
    'TOPO': (nm / 'topojson-client/dist/topojson-client.min.js').read_text(),
    'SNAPS': snaps(),
    'GEO': geo(),
    'PLACES': (src / 'places.js').read_text(),
    'CONTENT': (src / 'content.js').read_text(),
    'APP': (src / 'app.js').read_text(),
}
html = (src / 'template.html').read_text()
for k, v in parts.items():
    html = html.replace('/*' + k + '*/', v.replace('</script', '<\\/script'), 1)
(ROOT / 'index.html').write_text(html)
print('index.html', round(len(html.encode()) / 1e6, 2), 'MB')
