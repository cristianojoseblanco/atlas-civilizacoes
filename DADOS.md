# Dados do atlas: dicionário e regras

Todo o conteúdo fica em `data/conteudo/*.csv` (UTF-8, separado por vírgula). Essas tabelas são a **fonte única**: o `index.html` é gerado a partir delas (`npm run build`), e nada de conteúdo fica escrito no código.

## Regras de auditoria

1. **Toda afirmação específica** (data, número, "o mais antigo", "o maior") deve ter uma fonte em `fontes.csv`, ou então ficar com status `revisado_sem_fonte` ou `nao_revisado` até ganhar uma.
2. **O status diz a verdade sobre o item**:
   - `com_fonte`: há ao menos uma fonte ligada que sustenta o texto.
   - `revisado_sem_fonte`: foi conferido com o conhecimento consolidado da área, mas ainda não tem referência ligada.
   - `nao_revisado`: foi escrito e ainda não conferido.
   - `contestado`: há fontes em desacordo. Nesse caso o texto precisa dizer isso.
3. **Confiabilidade da fonte**: A = revisada por pares ou livro acadêmico; B = institucional (museu, universidade, governo, enciclopédia acadêmica); C = jornalismo especializado; D = divulgação, blog ou wiki. Uma afirmação forte deve ter ao menos uma fonte A ou B, ou duas fontes C independentes.
4. **Uma mudança por commit**, com a mensagem dizendo o que foi conferido. O histórico do Git é o registro da auditoria.
5. Rode `npm run validar` antes de cada commit. O script confere IDs, fontes, datas e coordenadas e atualiza o `AUDITORIA.md`.

## Tabelas

### `fontes.csv`
| Coluna | Descrição |
|---|---|
| `id` | `F` + número (`F010`). Nunca reaproveitar um ID. |
| `tipo` | livro, artigo, artigo de revista, notícia, base de dados, enciclopédia, comunicado oficial, site, blog, entrevista |
| `titulo`, `autores`, `ano`, `veiculo_editora` | Referência bibliográfica |
| `doi_isbn`, `url` | Identificadores para localizar a fonte |
| `acessado_em` | Data em que a fonte foi lida (AAAA-MM-DD) |
| `tema`, `regiao` | Para filtrar a bibliografia |
| `confiabilidade` | A, B, C ou D (veja as regras acima) |
| `licenca` | Para bases de dados e imagens |
| `consulta` | Como a fonte foi usada: "página lida", "trecho lido via busca", "usada diretamente (dados)" ou "referência conhecida, não reconsultada" |
| `notas` | O que exatamente a fonte sustenta |

### Colunas de auditoria (em todas as tabelas de conteúdo)
`fontes` (IDs separados por `;`) · `status` · `confianca_datas` (alta, media, baixa) · `notas_revisao`

### Tabelas de conteúdo
| Tabela | Uma linha por… | Chaves |
|---|---|---|
| `lugares.csv` | cidade ou sítio | `id` (L001…), `tipo` (cidade/sitio), `grupo` (gr = Grécia, tt = Taş Tepeler), `ano_inicio`/`ano_fim` (negativo = a.C.; vazio = até hoje), `importancia` 1–3 |
| `civilizacoes.csv` | civilização com cartão | `chaves_mapa`: nomes das feições do mapa separados por `\|` |
| `eventos.csv` | evento | `tipo`: ponto, seq ou rota; `categoria` → `categorias_eventos.csv` |
| `eventos_pontos.csv` | parada de um evento em sequência | `evento_id`, `ordem` |
| `rotas.csv` | rota comercial | traçado em `trajetos.csv` |
| `trajetos.csv` | vértice de um traçado | `tipo` (evento/rota), `item_id`, `ordem` |
| `passeios.csv` / `passeios_paradas.csv` | passeio guiado e suas paradas | `foco` = "lon lat;lon lat" |
| `perguntas.csv` / `perguntas_casos.csv` | grande pergunta e seus casos | `lado` → `lados.csv` |
| `sincronias.csv` | "Enquanto isso…" | `ano` |
| `epocas.csv` | faixa de época da linha do tempo | `ate_ano` |
| `bases_geograficas.csv` | arquivo de dados geográficos | fonte, licença e script que o gera |

## Como adicionar ou corrigir um item
1. Se a fonte é nova, cadastre-a em `fontes.csv`.
2. Edite a linha (ou crie uma, com ID novo) e preencha `fontes` e `status`.
3. Rode `npm run validar` e depois `npm run build`.
4. Faça o commit com uma mensagem dizendo o que foi conferido e em qual fonte.
