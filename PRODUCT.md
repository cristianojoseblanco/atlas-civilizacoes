# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Primeiro, o adulto curioso**: gosta de história e aprende por prazer, alguns minutos por dia, no celular ou no computador.
- **Também o estudante**: ensino médio e ENEM. Usa o mesmo conteúdo, com perguntas no nível "colégio".
- Celular e computador pesam igual. Cada um tem a sua composição, sem um ser a versão espremida do outro.

## Product Purpose
Ensinar história em lições longas e confiáveis, cada uma ligada a um lugar e a uma época no mapa, com perguntas que valem XP. O sucesso é a pessoa voltar todo dia e lembrar do que leu.

## Positioning
A lição acontece no mapa: o texto move o mapa, e o personagem do aluno, o Viajante, caminha de lugar em lugar. As lições são textos originais em português, sintetizados de livros de referência e com as fontes citadas por seção. Um app de idiomas ou de quiz não tem o mapa vivo nem o conteúdo auditável.

## Operating Context
- Atlas interativo (`index.html`): mapa histórico com fronteiras, lugares, rotas e relevo, de 10 mil a.C. até hoje.
- Página Aprender (`aprender.html`): caminho de lições em árvore, leitura por seções, perguntas, XP, sequência e energia diária.
- Conteúdo em arquivos auditáveis (CSV e Markdown) com fontes graduadas de A a D.

## Capabilities and Constraints
- Site estático no GitHub Pages; login e progresso no Supabase depois (ainda não feito).
- Curso piloto: Oriente Antigo, 32 lições, 1 publicada.
- Níveis (iniciante, colégio, graduação) mudam a exigência e as perguntas, não o texto.
- Energia diária no grátis; premium pago para explorar livremente (preço e pagamento a decidir).
- Lições nunca copiam nem traduzem livros; títulos nunca usam nomes de livros.
- Números grandes por extenso ("mil", "milhões"); toda porcentagem vem com o número.

## Brand Commitments
- Nome: Atlas das Civilizações.
- Personagem: o Viajante (chapéu de explorador, túnica, estandarte com o objeto do tema estudado). O corpo é sempre o mesmo e o estandarte muda.
- Direção visual escolhida pelo dono: tabuleiro (ver DESIGN.md). Nível de acabamento desejado: o de um jogo bem acabado; o Duolingo é a primeira referência a testar, e outras virão depois.
- Língua: português do Brasil.

## Evidence on Hand
- Lição publicada: `data/licoes/oriente-antigo/02-01-revolucao-urbana.md`.
- Fontes: `data/conteudo/fontes.csv`; índices de leitura em `docs/livros/`.
- Desenhos: `assets/viajante/`, mapa do curso gerado por `scripts/mapa_curso.py`.
- Não existem depoimentos, número de usuários, imprensa nem preço definido: não inventar.

## Product Principles
1. **O mapa é o palco.** Toda lição tem lugar e época, e o mapa reage à leitura.
2. **Ler é o centro.** O jogo motiva, mas não interrompe nem apressa a leitura.
3. **Confiável à mostra.** Fontes visíveis por seção; nada inventado.
4. **Voltar todo dia.** Sequência, energia e revisão servem ao hábito, sem punir quem está aprendendo.

## Accessibility & Inclusion
- Texto de leitura com pelo menos 17 px no celular e 18 px no computador, com contraste de 4,5:1 ou mais.
- Toda animação tem a versão "reduzir movimento".
- O Viajante não indica etnia, e o rosto é o mesmo em todos os temas.
