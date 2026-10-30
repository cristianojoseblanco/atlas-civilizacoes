"""Lê as tabelas de data/conteudo/*.csv (fonte única do conteúdo) e gera o JavaScript usado pelo atlas."""
import csv, json, pathlib
D = pathlib.Path(__file__).resolve().parent.parent / 'data' / 'conteudo'

def tab(nome):
    with open(D / f'{nome}.csv', encoding='utf-8') as f:
        return list(csv.DictReader(f))
def num(x):
    if x is None or x == '': return None
    v = float(x); return int(v) if v.is_integer() else v
def lst(x): return [s for s in (x or '').split(';') if s]
def aud(r): return {'fontes': lst(r.get('fontes')), 'status': r.get('status') or 'nao_revisado'}

def gerar():
    fontes = {r['id']: r for r in tab('fontes')}
    civs = [dict(id=r['id'], keys=r['chaves_mapa'].split('|'), pt=r['nome'], periodo=r['periodo'], cidades=r['centros'], texto=r['descricao'], **aud(r)) for r in tab('civilizacoes')]
    eras = [dict(ate=num(r['ate_ano']), nome=r['nome'], t=r['descricao']) for r in sorted(tab('epocas'), key=lambda r: num(r['ate_ano']))]
    places = []
    for r in tab('lugares'):
        p = dict(id=r['id'], k='c' if r['tipo'] == 'cidade' else 's', n=r['nome'], p=r['pais'], lat=num(r['lat']), lon=num(r['lon']), y=num(r['ano_inicio']), e=num(r['ano_fim']), w=num(r['importancia']), t=r['descricao'], **aud(r))
        if r['grupo']: p['g'] = r['grupo']
        places.append(p)
    traj = {}
    for r in sorted(tab('trajetos'), key=lambda r: (r['tipo'], r['item_id'], int(r['ordem']))):
        traj.setdefault((r['tipo'], r['item_id']), []).append([num(r['lon']), num(r['lat'])])
    pts = {}
    for r in sorted(tab('eventos_pontos'), key=lambda r: (r['evento_id'], int(r['ordem']))):
        pts.setdefault(r['evento_id'], []).append(dict(at=[num(r['lon']), num(r['lat'])], y=num(r['ano']), l=r['rotulo']))
    cats = {r['id']: dict(nome=r['nome'], cor=r['cor']) for r in tab('categorias_eventos')}
    events = []
    for r in tab('eventos'):
        ev = dict(id=r['id'], tipo=r['tipo'], cat=r['categoria'], y=num(r['ano_inicio']), e=num(r['ano_fim']), n=r['nome'], t=r['descricao'], **aud(r))
        if r['tipo'] == 'ponto': ev['at'] = [num(r['lon']), num(r['lat'])]
        if r['tipo'] == 'seq': ev['pts'] = pts.get(r['id'], [])
        if r['tipo'] == 'rota': ev['path'] = traj.get(('evento', r['id']), [])
        events.append(ev)
    routes = [dict(id=r['id'], n=r['nome'], y=num(r['ano_inicio']), e=num(r['ano_fim']), cor=r['cor'], bens=r['mercadorias'], t=r['descricao'], path=traj.get(('rota', r['id']), []), **aud(r)) for r in tab('rotas')]
    steps = {}
    for r in sorted(tab('passeios_paradas'), key=lambda r: (r['passeio_id'], int(r['ordem']))):
        s = dict(ano=num(r['ano']), foco=[[num(a) for a in c.split()] for c in r['foco'].split(';') if c], t=r['titulo'], txt=r['texto'], **aud(r))
        if r['zoom']: s['k'] = num(r['zoom'])
        for k, c in (('ev', 'evento'), ('rt', 'rota'), ('lugar', 'lugar')):
            if r[c]: s[k] = r[c]
        steps.setdefault(r['passeio_id'], []).append(s)
    tours = [dict(id=r['id'], n=r['nome'], cor=r['cor'], d=r['descricao'], steps=steps.get(r['id'], [])) for r in tab('passeios')]
    lados = {r['id']: dict(nome=r['nome'], cor=r['cor']) for r in tab('lados')}
    casos = {}
    for r in sorted(tab('perguntas_casos'), key=lambda r: (r['pergunta_id'], int(r['ordem']))):
        casos.setdefault(r['pergunta_id'], []).append(dict(n=r['nome'], at=[num(r['lon']), num(r['lat'])], y=num(r['ano']), lado=r['lado'], t=r['descricao'], **aud(r)))
    themes = [dict(id=r['id'], n=r['pergunta'], ano=num(r['ano']), intro=r['introducao'], casos=casos.get(r['id'], []), **aud(r)) for r in tab('perguntas')]
    sync = [dict(id=r['id'], y=num(r['ano']), t=r['texto'], **aud(r)) for r in tab('sincronias')]
    fontes_js = {k: dict(titulo=v['titulo'], autores=v['autores'], ano=v['ano'], veiculo=v['veiculo_editora'], url=v['url'], tipo=v['tipo'], conf=v['confiabilidade'], consulta=v['consulta']) for k, v in fontes.items()}
    art = {r['id']: dict(nome=r['nome'], trad=r['tradicao'], insp=r['inspiracao'], w=num(r['largura']), h=num(r['altura']), d=r['svg'], peca=r['peca'], local=r['peca_local'], pf=r['peca_fonte'], cores=r['cores'].split(';'), **aud(r)) for r in tab('artes_estilos')}
    regras = []
    for r in sorted(tab('artes_regras'), key=lambda r: int(r['ordem'])):
        q = dict(s=r['estilo'])
        if r['alvo']: q['alvo'] = r['alvo']
        if r['grupo']: q['g'] = r['grupo']
        if r['lon_min'] != '': q['box'] = [num(r['lon_min']), num(r['lon_max']), num(r['lat_min']), num(r['lat_max'])]
        if r['ano_min'] != '': q['a'] = num(r['ano_min'])
        if r['ano_max'] != '': q['b'] = num(r['ano_max'])
        regras.append(q)
    out = dict(ART=art, ART_RULES=regras, FONTES=fontes_js, CIVS=civs, ERAS=eras, PLACES=places, EVENT_CATS=cats, EVENTS=events, ROUTES=routes, TOURS=tours, LADOS=lados, THEMES=themes, SYNC=sync)
    return ''.join(f'const {k}={json.dumps(v, ensure_ascii=False, separators=(",", ":"))};\n' for k, v in out.items())
