"""Valida as tabelas de data/conteudo e gera AUDITORIA.md.
Uso: python3 scripts/validar.py   (sai com código 1 se houver erro)"""
import csv, pathlib, sys, collections, datetime
ROOT = pathlib.Path(__file__).resolve().parent.parent
D = ROOT / 'data' / 'conteudo'
def tab(n):
    with open(D / f'{n}.csv', encoding='utf-8') as f: return list(csv.DictReader(f))
def num(x):
    try: return float(x)
    except (TypeError, ValueError): return None

erros, avisos = [], []
STATUS = {'com_fonte', 'revisado_sem_fonte', 'nao_revisado', 'contestado'}
fontes = {r['id']: r for r in tab('fontes')}
usadas = collections.Counter()

def checa_fontes(nome_tab, rid, r):
    ids = [s for s in (r.get('fontes') or '').split(';') if s]
    for f in ids:
        if f not in fontes: erros.append(f'{nome_tab} {rid}: fonte inexistente {f}')
        usadas[f] += 1
    st = r.get('status', '')
    if st not in STATUS: erros.append(f'{nome_tab} {rid}: status inválido "{st}"')
    if st == 'com_fonte' and not ids: erros.append(f'{nome_tab} {rid}: status com_fonte sem nenhuma fonte')
    if ids and st != 'com_fonte' and st != 'contestado': avisos.append(f'{nome_tab} {rid}: tem fonte mas status é {st}')

def checa_coord(nome_tab, rid, lon, lat):
    lo, la = num(lon), num(lat)
    if lo is None or la is None or not (-180 <= lo <= 180) or not (-90 <= la <= 90): erros.append(f'{nome_tab} {rid}: coordenada inválida ({lon}, {lat})')

def checa_datas(nome_tab, rid, a, b):
    ya, yb = num(a), num(b)
    if ya is None: erros.append(f'{nome_tab} {rid}: ano inicial vazio')
    elif yb is not None and yb < ya: erros.append(f'{nome_tab} {rid}: termina ({b}) antes de começar ({a})')
    if ya is not None and ya > datetime.date.today().year: erros.append(f'{nome_tab} {rid}: ano no futuro ({a})')

# fontes
for k, r in fontes.items():
    if not r['titulo']: erros.append(f'fontes {k}: sem título')
    if r['confiabilidade'] not in {'A', 'B', 'C', 'D'}: erros.append(f'fontes {k}: confiabilidade deve ser A, B, C ou D')
    if not r['url'] and not r['doi_isbn'] and r['tipo'] != 'livro': avisos.append(f'fontes {k}: sem URL nem DOI/ISBN')

ids = set()
def checa_id(nome_tab, rid):
    if (nome_tab, rid) in ids: erros.append(f'{nome_tab}: id duplicado {rid}')
    ids.add((nome_tab, rid))

lug = tab('lugares'); nomes_lug = collections.Counter(r['nome'] for r in lug)
for r in lug:
    checa_id('lugares', r['id']); checa_fontes('lugares', r['id'], r); checa_coord('lugares', r['id'], r['lon'], r['lat']); checa_datas('lugares', r['id'], r['ano_inicio'], r['ano_fim'])
    if r['tipo'] not in {'cidade', 'sitio'}: erros.append(f"lugares {r['id']}: tipo inválido")
    if nomes_lug[r['nome']] > 1: erros.append(f"lugares {r['id']}: nome repetido '{r['nome']}'")
civ = tab('civilizacoes'); chaves = collections.Counter(k for r in civ for k in r['chaves_mapa'].split('|'))
for r in civ:
    checa_id('civilizacoes', r['id']); checa_fontes('civilizacoes', r['id'], r)
for k, n in chaves.items():
    if n > 1: erros.append(f'civilizacoes: chave de mapa "{k}" usada {n} vezes')
ev = tab('eventos'); ev_ids = {r['id'] for r in ev}
pts = collections.Counter(r['evento_id'] for r in tab('eventos_pontos'))
traj = collections.Counter((r['tipo'], r['item_id']) for r in tab('trajetos'))
for r in ev:
    checa_id('eventos', r['id']); checa_fontes('eventos', r['id'], r); checa_datas('eventos', r['id'], r['ano_inicio'], r['ano_fim'])
    if r['tipo'] == 'ponto': checa_coord('eventos', r['id'], r['lon'], r['lat'])
    if r['tipo'] == 'seq' and not pts[r['id']]: erros.append(f"eventos {r['id']}: sequência sem pontos")
    if r['tipo'] == 'rota' and traj[('evento', r['id'])] < 2: erros.append(f"eventos {r['id']}: trajeto com menos de 2 pontos")
for r in tab('eventos_pontos'):
    if r['evento_id'] not in ev_ids: erros.append(f"eventos_pontos: evento inexistente {r['evento_id']}")
    checa_coord('eventos_pontos', r['evento_id'], r['lon'], r['lat'])
rot = tab('rotas'); rot_ids = {r['id'] for r in rot}
for r in rot:
    checa_id('rotas', r['id']); checa_fontes('rotas', r['id'], r); checa_datas('rotas', r['id'], r['ano_inicio'], r['ano_fim'])
    if traj[('rota', r['id'])] < 2: erros.append(f"rotas {r['id']}: trajeto com menos de 2 pontos")
for r in tab('trajetos'): checa_coord('trajetos', r['item_id'], r['lon'], r['lat'])
lug_nomes = set(nomes_lug)
for r in tab('passeios_paradas'):
    rid = f"{r['passeio_id']}#{r['ordem']}"; checa_fontes('passeios_paradas', rid, r)
    if r['evento'] and r['evento'] not in ev_ids: erros.append(f'passeios_paradas {rid}: evento inexistente {r["evento"]}')
    if r['rota'] and r['rota'] not in rot_ids: erros.append(f'passeios_paradas {rid}: rota inexistente {r["rota"]}')
    if r['lugar'] and r['lugar'] not in lug_nomes: erros.append(f'passeios_paradas {rid}: lugar inexistente {r["lugar"]}')
for r in tab('perguntas'): checa_fontes('perguntas', r['id'], r)
lados = {r['id'] for r in tab('lados')}
for r in tab('perguntas_casos'):
    rid = f"{r['pergunta_id']}#{r['ordem']}"; checa_fontes('perguntas_casos', rid, r); checa_coord('perguntas_casos', rid, r['lon'], r['lat'])
    if r['lado'] not in lados: erros.append(f'perguntas_casos {rid}: lado inválido {r["lado"]}')
for r in tab('sincronias'): checa_id('sincronias', r['id']); checa_fontes('sincronias', r['id'], r)
estilos = {r['id'] for r in tab('artes_estilos')}
for r in tab('artes_estilos'):
    checa_id('artes_estilos', r['id']); checa_fontes('artes_estilos', r['id'], r)
    if not r['svg'].strip(): erros.append(f"artes_estilos {r['id']}: sem desenho")
for r in tab('artes_regras'):
    if r['estilo'] not in estilos: erros.append(f"artes_regras {r['ordem']}: estilo inexistente {r['estilo']}")
    if r['lon_min'] != '': checa_coord('artes_regras', r['ordem'], r['lon_min'], r['lat_min']); checa_coord('artes_regras', r['ordem'], r['lon_max'], r['lat_max'])

# relatório
def cobertura(n):
    rows = tab(n); c = collections.Counter(r['status'] for r in rows); t = len(rows)
    return t, c
linhas = ['# Auditoria do conteúdo', '', f'Gerado por `scripts/validar.py` em {datetime.date.today().isoformat()}.', '',
          '## Situação das fontes', '', '| Tabela | Itens | Com fonte | Revisado sem fonte | Não revisado | Contestado |', '|---|---|---|---|---|---|']
tot = collections.Counter(); tt = 0
for n in ['lugares', 'civilizacoes', 'eventos', 'rotas', 'passeios_paradas', 'perguntas', 'perguntas_casos', 'sincronias', 'artes_estilos']:
    t, c = cobertura(n); tot.update(c); tt += t
    pct = lambda k: f"{c[k]} ({round(100 * c[k] / t)}%)" if t else '0'
    linhas.append(f"| {n} | {t} | {pct('com_fonte')} | {pct('revisado_sem_fonte')} | {pct('nao_revisado')} | {pct('contestado')} |")
pt = lambda k: f"{tot[k]} ({round(100 * tot[k] / tt)}%)"
linhas.append(f"| **total** | **{tt}** | **{pt('com_fonte')}** | **{pt('revisado_sem_fonte')}** | **{pt('nao_revisado')}** | **{pt('contestado')}** |")
linhas += ['', '**Legenda:** *com fonte*: ao menos uma fonte em `fontes.csv` sustenta o item. *Revisado sem fonte*: conferido com conhecimento consolidado da área, mas ainda sem referência ligada. *Não revisado*: escrito e ainda não conferido. *Contestado*: há fontes em desacordo, e o texto deve dizer isso.', '',
           '## Fontes mais usadas', '', '| Fonte | Usos | Confiabilidade | Título |', '|---|---|---|---|']
for f, n in usadas.most_common():
    linhas.append(f"| {f} | {n} | {fontes[f]['confiabilidade']} | {fontes[f]['titulo']} |")
sem_uso = [k for k in fontes if not usadas[k]]
if sem_uso: linhas += ['', 'Fontes cadastradas sem uso por nenhum item: ' + ', '.join(sem_uso) + ' (bases geográficas aparecem em `bases_geograficas.csv`).']
linhas += ['', f'## Erros ({len(erros)})', ''] + ([f'- {e}' for e in erros] or ['Nenhum.'])
linhas += ['', f'## Avisos ({len(avisos)})', ''] + ([f'- {a}' for a in avisos] or ['Nenhum.'])
(ROOT / 'AUDITORIA.md').write_text('\n'.join(linhas) + '\n', encoding='utf-8')
print(f'{tt} itens · com fonte {tot["com_fonte"]} · revisado sem fonte {tot["revisado_sem_fonte"]} · não revisado {tot["nao_revisado"]}')
print(f'{len(erros)} erros, {len(avisos)} avisos → AUDITORIA.md')
for e in erros[:30]: print('ERRO', e)
sys.exit(1 if erros else 0)
