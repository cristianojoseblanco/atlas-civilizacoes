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
    # trilhas do "Aprender história": passeios (sequência guiada) e debates (grandes perguntas)
    lados = {r['id']: dict(nome=r['nome'], cor=r['cor']) for r in tab('lados')}
    tri = tab('trilhas'); tipo = {r['id']: r['tipo'] for r in tri}
    steps, casos = {}, {}
    for r in sorted(tab('trilhas_paradas'), key=lambda r: (r['trilha_id'], int(r['ordem']))):
        base = dict(nivel=r['nivel'], temas=lst(r['temas']), **aud(r))
        if tipo[r['trilha_id']] == 'passeio':
            s = dict(ano=num(r['ano']), foco=[[num(a) for a in c.split()] for c in r['foco'].split(';') if c], t=r['titulo'], txt=r['texto'], **base)
            if r['texto_iniciante']: s['ti'] = r['texto_iniciante']
            if r['zoom']: s['k'] = num(r['zoom'])
            for k, c in (('ev', 'evento'), ('rt', 'rota'), ('lugar', 'lugar')):
                if r[c]: s[k] = r[c]
            steps.setdefault(r['trilha_id'], []).append(s)
        else:
            casos.setdefault(r['trilha_id'], []).append(dict(n=r['titulo'], at=[num(r['lon']), num(r['lat'])], y=num(r['ano']), lado=r['lado'], t=r['texto'], **base))
    tours = [dict(id=r['id'], n=r['nome'], cor=r['cor'], d=r['descricao'], nivel=r['nivel'], temas=lst(r['temas']), steps=steps.get(r['id'], [])) for r in tri if r['tipo'] == 'passeio']
    themes = [dict(id=r['id'], n=r['nome'], ano=num(r['ano']), intro=r['descricao'], nivel=r['nivel'], temas=lst(r['temas']), casos=casos.get(r['id'], []), **aud(r)) for r in tri if r['tipo'] == 'debate']
    temas_js = [dict(id=r['id'], n=r['nome']) for r in tab('temas')]
    mar = [[num(r['ano']), num(r['nivel_m'])] for r in sorted(tab('nivel_mar'), key=lambda r: num(r['ano']))]
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
    out = dict(ART=art, ART_RULES=regras, FONTES=fontes_js, CIVS=civs, ERAS=eras, PLACES=places, EVENT_CATS=cats, EVENTS=events, ROUTES=routes, TOURS=tours, LADOS=lados, THEMES=themes, SYNC=sync, TEMAS=temas_js, NIVEL_MAR=mar)
    return ''.join(f'const {k}={json.dumps(v, ensure_ascii=False, separators=(",", ":"))};\n' for k, v in out.items())
