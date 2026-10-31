# Roadmap do Atlas das Civilizações

Ideias para o futuro, registradas em 30/10/2026. A regra continua a mesma: todo conteúdo novo entra nas tabelas de `data/conteudo`, com fonte, e passa pelo `scripts/validar.py`.

## Agora (em andamento)

1. Fontes para as 62 civilizações (duas levas), depois rotas, passeios e artes.
2. Temas e níveis em todas as tabelas. A estrutura já existe, e cada item é marcado na mesma passada em que ganha fonte.
   - `temas.csv`: vocabulário controlado com 16 temas (política, guerra, religião, filosofia, arte, arquitetura, escrita, matemática, ciência, tecnologia, agricultura, comércio, exploração, cotidiano, desastres, arqueologia). Um item pode ter vários, separados por `;`.
   - `niveis.csv`: `iniciante`, `colegio` e `graduacao`. "Completo" é a soma dos três, e "personalizado" é um filtro por temas, então nenhum dos dois precisa de coluna própria.
   - O validador recusa tema ou nível fora do vocabulário, e a `AUDITORIA.md` mostra a cobertura.
   - Já preenchidos: os lugares (nível tirado da coluna `importancia`: 3 = iniciante, 2 = colégio, 1 = graduação; vale revisar caso a caso), os eventos e as rotas.

## Próximo: desenvolvimentos culturais e científicos

Tabela nova, `desenvolvimentos.csv`, no mesmo padrão das outras:

- Colunas: `id`, `nome`, `tema`, `ano`, `lugar` ou `lon/lat`, `civilizacao`, `descricao`, `nivel`, `fontes`, `status`.
- Exemplos: o sistema sexagesimal babilônico, a tabuleta Plimpton 322, o papiro Rhind, os *Elementos* de Euclides, o zero na Índia (Brahmagupta), al-Khwarizmi em Bagdá, o observatório de Maragheh; a escrita cuneiforme, o alfabeto fenício, o quipu; a epopeia de Gilgamesh, a tragédia grega.
- No mapa: um painel "o que está acontecendo neste período", com a lista do ano escolhido, filtrável por tema.
- **História da matemática** como primeira trilha temática completa. Ela é muito geográfica (Babilônia → Egito → Grécia → Índia → Bagdá → Europa), então funciona bem no mapa.

## Modo "Aprender história"

- Níveis: iniciante, intermediário (colégio), avançado (graduação), completo e personalizado (o usuário escolhe os temas).
- Cada nível é um filtro sobre a mesma base, não um conteúdo à parte.
- As trilhas são passeios maiores, organizados por nível e tema, com texto, animações no mapa e referências.
- **Quizzes** gerados dos próprios dados ("o que veio primeiro?", "onde fica?", "quem era contemporâneo de quem?"). Cada pergunta herda a fonte do item de onde saiu.

### Decisões de 30/10/2026

- "Passeios" e "Perguntas" deixam de existir como botões separados: tudo vira **trilhas** dentro do Aprender história.
  - Tabelas `trilhas` (id, nome, tipo = passeio ou debate, tema, nível mínimo, descrição, fontes) e `trilhas_paradas`.
  - As grandes perguntas viram trilhas do tipo debate, com os dois lados e as evidências.
- **Nível iniciante:** mesma trilha, com **texto mais simples** e menos informação difícil, focado nas etapas mais conhecidas da história. Cada parada ganha um campo `texto_iniciante`; os outros níveis usam o texto completo.
- **Base de conhecimento:** livros didáticos em PDF (um do ensino médio brasileiro, um universitário de história mundial, opcionalmente um de história da matemática) servem de índice e de fonte citada com página. Nenhum trecho é copiado para o site; preferir livros de licença aberta (ex.: OpenStax World History).
- Trilhas novas previstas: Egito, Grécia e Roma, Rota da Seda, Américas pré-colombianas, África medieval, história da matemática.

## Visão de longo prazo: aprendizado com conta e gamificação (30/10/2026)

- **Conta do usuário:** login, página pessoal com progresso, aulas concluídas, conquistas e histórico.
- **Gamificação, com identidade própria do atlas** (nada copiado de outros apps):
  - aulas curtas em unidades e módulos, com desbloqueio em sequência;
  - pontos por aula e quiz, sequência de dias estudados, metas diárias;
  - revisão espaçada: perguntas erradas voltam dias depois;
  - conquistas temáticas (por exemplo, "completou a Mesopotâmia", "acertou 50 datas");
  - o mapa como recompensa: regiões e épocas "acendem" conforme o usuário estuda.
- **Técnica:** o site hoje é uma página estática. Contas pedem um back-end (autenticação e banco). Até lá, o progresso fica salvo no navegador, num formato pensado para migrar depois.
- **Consequência para agora:** aulas, blocos, quiz e glossário já nascem como unidades pequenas, com id estável, nível e tema, para servir de base às lições e à revisão espaçada.

## Modo "Preparo para provas"

- Montar uma base de **temas cobrados** por prova e ano (ENEM, Fuvest, Unicamp, outras), a partir das provas e gabaritos públicos do INEP e das bancas.
- Guardar o tema, a habilidade e o link para a questão original, sem copiar o enunciado para o site.
- Relatório: o que mais cai, com que frequência e em quais anos, mostrando o número junto de cada porcentagem.
- O relatório leva a trilhas no mapa: cada tema frequente abre o passeio correspondente, seguido de um quiz.
- Ponto a decidir: como mapear as questões aos temas e níveis do atlas (à mão no começo, depois com ajuda de um classificador revisado por uma pessoa).

## Princípios

- Fonte para tudo; quando houver debate, o texto diz que há debate.
- Uma base só e muitos modos de ver. Nada de conteúdo duplicado por nível.
- Números grandes escritos com "mil" e "milhões"; porcentagens sempre com o número ao lado.
