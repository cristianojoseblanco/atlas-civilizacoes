"""Lê as lições oficiais (data/licoes/**/*.md), o plano (plano.csv) e as unidades (unidades.csv)
e gera o JSON usado pela página Aprender. Também valida o formato.

Formato de cada lição (.md):
  cabeçalho entre '---' com id, unidade, ordem, titulo, periodo, lugar, requisitos, objetivo, fontes
  '## Título da seção' abre uma seção; linhas '@ano', '@foco lon lat;lon lat', '@zoom', '@fontes F000:página;F001'
  '### Perguntas' abre as perguntas da seção:
    - [nivel] Pergunta?
      * alternativa
      * = alternativa correta
      > explicação
"""
import csv, json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
LD = ROOT / 'data' / 'licoes'
NIVEIS = ('iniciante', 'colegio', 'graduacao')


def tab(p):
    with open(p, encoding='utf-8') as f:
        return list(csv.DictReader(f))


def lst(x):
    return [s.strip() for s in (x or '').split(';') if s.strip()]


def fontes_ref(x):
    """'F469:cap. 4, p. 97;F075' -> [{'id':'F469','loc':'cap. 4, p. 97'}, {'id':'F075','loc':''}]"""
    out = []
    for s in lst(x):
        i, _, loc = s.partition(':')
        out.append({'id': i.strip(), 'loc': loc.strip()})
    return out


def ler_licao(path, erros):
    txt = path.read_text(encoding='utf-8')
    m = re.match(r'---\n(.*?)\n---\n(.*)', txt, re.S)
    if not m:
        erros.append(f'{path.name}: sem cabeçalho'); return None
    head = {}
    for ln in m.group(1).splitlines():
        k, _, v = ln.partition(':'); head[k.strip()] = v.strip()
    lic = dict(id=head['id'], unidade=head['unidade'], ordem=int(head['ordem']), titulo=head['titulo'], periodo=head.get('periodo', ''),
               lugar=head.get('lugar', ''), requisitos=lst(head.get('requisitos')), objetivo=head.get('objetivo', ''),
               fontes=fontes_ref(head.get('fontes')), secoes=[])
    sec = None; perg = None; modo = 'texto'
    for ln in m.group(2).splitlines():
        if ln.startswith('## '):
            sec = dict(titulo=ln[3:].strip(), ano=None, foco=[], zoom=None, fontes=[], paragrafos=[], perguntas=[]); lic['secoes'].append(sec)
            modo = 'texto'; buf = []; continue
        if sec is None:
            continue
        if ln.startswith('### Perguntas'):
            modo = 'perguntas'; continue
        if modo == 'texto':
            if ln.startswith('@ano'): sec['ano'] = int(ln.split()[1]); continue
            if ln.startswith('@foco'): sec['foco'] = [[float(a) for a in c.split()] for c in ln[5:].split(';') if c.strip()]; continue
            if ln.startswith('@zoom'): sec['zoom'] = float(ln.split()[1]); continue
            if ln.startswith('@fontes'): sec['fontes'] = fontes_ref(ln[7:]); continue
            if ln.strip(): sec['paragrafos'].append(ln.strip())
            continue
        mq = re.match(r'- \[(\w+)\] (.+)', ln)
        if mq:
            perg = dict(nivel=mq.group(1), p=mq.group(2).strip(), ops=[], ok=None, ex='', fontes=[]); sec['perguntas'].append(perg); continue
        mo = re.match(r'\s+\* (=\s*)?(.+)', ln)
        if mo and perg is not None:
            if mo.group(1): perg['ok'] = len(perg['ops'])
            perg['ops'].append(mo.group(2).strip()); continue
        me = re.match(r'\s+> (.+)', ln)
        if me and perg is not None:
            perg['ex'] = me.group(1).strip(); continue
        mf = re.match(r'\s+@fontes (.+)', ln)
        if mf and perg is not None:
            perg['fontes'] = fontes_ref(mf.group(1)); continue
    # validação
    for k, s in enumerate(lic['secoes'], 1):
        tag = f"{lic['id']} §{k}"
        if not s['paragrafos']: erros.append(f'{tag}: seção sem texto')
        if not s['fontes']: erros.append(f'{tag}: seção sem fontes')
        if len(s['perguntas']) < 3: erros.append(f'{tag}: menos de 3 perguntas')
        for j, q in enumerate(s['perguntas'], 1):
            if q['nivel'] not in NIVEIS: erros.append(f'{tag} p{j}: nível inválido {q["nivel"]}')
            if q['ok'] is None: erros.append(f'{tag} p{j}: sem alternativa correta')
            if len(q['ops']) < 3: erros.append(f'{tag} p{j}: poucas alternativas')
            if not q['ex']: erros.append(f'{tag} p{j}: sem explicação')
            if not q['fontes']: q['fontes'] = s['fontes']
        s['palavras'] = sum(len(p.split()) for p in s['paragrafos'])
    return lic


def gerar(fontes_ids=None):
    erros = []
    unidades = tab(LD / 'unidades.csv')
    plano = tab(LD / 'plano.csv')
    licoes = {}
    for p in sorted(LD.glob('**/*.md')):
        lic = ler_licao(p, erros)
        if lic: licoes[lic['id']] = lic
    ids_plano = {r['id'] for r in plano}
    for r in plano:
        if not (r.get('lon') and r.get('lat') and r.get('ano')): erros.append(f"plano {r['id']}: falta lugar/lon/lat/ano")
        for q in lst(r['requisitos']):
            if q not in ids_plano: erros.append(f"plano {r['id']}: requisito inexistente {q}")
        if r['status'] == 'publicada' and r['id'] not in licoes: erros.append(f"plano {r['id']}: marcada como publicada sem arquivo")
    for i in licoes:
        if i not in ids_plano: erros.append(f'lição {i}: fora do plano.csv')
    if fontes_ids is not None:
        for lic in licoes.values():
            refs = lic['fontes'] + [f for s in lic['secoes'] for f in s['fontes'] + [g for q in s['perguntas'] for g in q['fontes']]]
            for f in refs:
                if f['id'] not in fontes_ids: erros.append(f"lição {lic['id']}: fonte inexistente {f['id']}")
    arvore = []
    for u in sorted(unidades, key=lambda r: int(r['ordem'])):
        itens = [dict(id=r['id'], ordem=int(r['ordem']), titulo=r['titulo'], requisitos=lst(r['requisitos']), base=r['base'],
                      lugar=r.get('lugar',''), lon=float(r['lon']) if r.get('lon') else None, lat=float(r['lat']) if r.get('lat') else None, ano=int(r['ano']) if r.get('ano') else None,
                      publicada=r['id'] in licoes) for r in plano if r['unidade'] == u['id']]
        arvore.append(dict(id=u['id'], curso=u['curso'], titulo=u['titulo'], periodo=u['periodo'], descricao=u['descricao'],
                           requisitos=lst(u['requisitos']), licoes=sorted(itens, key=lambda x: x['ordem'])))
    return dict(unidades=arvore, licoes=licoes), erros


if __name__ == '__main__':
    d, e = gerar()
    print(len(d['licoes']), 'lições publicadas;', sum(len(u['licoes']) for u in d['unidades']), 'no plano;', len(e), 'erros')
    for x in e: print('ERRO', x)
