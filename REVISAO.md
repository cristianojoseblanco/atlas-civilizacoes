# Revisão de conteúdo

## 30/10/2026: primeira revisão

Foram relidos todos os itens: 60 civilizações, 130 cidades e sítios, 27 eventos, 10 rotas e 3 passeios. As datas e afirmações específicas foram conferidas com o conhecimento consolidado da área. As descobertas recentes de Taş Tepeler foram checadas com fontes jornalísticas e acadêmicas (veja o histórico do commit). Foram feitas 34 correções, a maioria para deixar mais cautelosas afirmações que estavam fortes demais.

**Erros de fato corrigidos**
- Avaris: os afrescos de estilo minoico são do início do Império Novo, posteriores aos hicsos.
- Dilmun (Qal'at al-Bahrain): a ocupação do sítio começa por volta de 2300 a.C., e não em 2800.
- Peste Negra: chegou a Marselha em 1347 e ao Cairo em 1348 (as datas estavam invertidas).
- Partos: eram iranianos, não "persas" no sentido estrito.
- Gupta: o zero tratado como número aparece com Brahmagupta (628), depois do auge gupta.
- Song: a pólvora é anterior (dinastia Tang). O mérito Song é o uso em armas.
- Göbekli Tepe: os pilares chegam a 5,5 metros. O evento dizia 5.
- Agricultura: o ponto do leste da América do Norte foi retirado, porque a data de 5000 a.C. era cedo demais. A abóbora mesoamericana passou para cerca de 8000 a.C.

**Afirmações suavizadas por serem debatidas ou exageradas**
- A doca de Lothal: a interpretação é contestada.
- A escrita maia: o sistema "mais completo" das Américas, não "o único".
- O cavalo montado pelos Yamnaya: está em debate.
- A abóbada do Taq Kasra, Rapa Nui como lugar "mais isolado", a "descoberta" de Machu Picchu em 1911 e Kanesh como arquivo "mais antigo".
- O litoral do Golfo no tempo de Eridu e o trecho "Meroé com mais pirâmides" (passou a ser "a Núbia").
- O naufrágio de Uluburun: saiu o "exército inteiro".

**Limites que continuam valendo**
- As fronteiras vêm da base historical-basemaps e são aproximadas, sobretudo antes de 1000 a.C.
- As datas de fundação e abandono das cidades são aproximadas, quase sempre em séculos.
- As posições dos sítios de Taş Tepeler sem coordenadas publicadas foram calculadas a partir de distância e direção em relação a Karahan Tepe (Megalithic Portal).

## 30/10/2026: segunda rodada, com fontes (Grécia e Oriente Próximo)

Cada item foi conferido em fontes consultadas nesta rodada e ligado a elas em `fontes.csv` (F038–F072). Quando só havia fonte fraca (D) ou nenhuma, o item ficou como `revisado_sem_fonte`, com o motivo em `notas_revisao`.

- **Grécia (38 pólis e colônias + 4 eventos):** 25 ganharam fonte (21 lugares e os 4 eventos). Datas de fundação conferidas com Kagan (Open Yale Courses) e a World History Encyclopedia; Guerras Médicas e do Peloponeso com a Britannica e a Livius; Clístenes (508–507 a.C.) com a Britannica; Rodes (408/7 a.C.) com o Center for Hellenic Studies de Harvard; Náucratis com o British Museum.
- **Oriente Próximo desenhado à mão (27 civilizações):** 19 ganharam fonte (Met Museum, Britannica, Seshat, Larousse, cursos da UMass Lowell, UCF, Brown e UNM, Steinkeller sobre Marhashi e o proto-elamita).

**Correções**
- Olbia Pôntica: fundação de c. 600 para c. 550 a.C. (o ponto da animação foi para o fim da sequência).
- A frase de Platão: no Fédon, é Sócrates quem compara os gregos a "formigas ou sapos em volta de um lago".
- Trapezunte: o texto agora diz que a data tradicional (756 a.C.) é anterior à da própria Sinope, sua metrópole, e provavelmente cedo demais.
- Magan: saiu a menção a Gudea (não confirmada); entrou o que as inscrições dizem: navios de Magan no cais de Akkad (Sargão) e pedra trazida de Magan (Naram-Sin).
- Ur III: o código mais antigo é de Ur-Nammu ou do seu filho Shulgi.
- Isin: termina c. 1793 a.C., quando Rim-Sin de Larsa a conquista.
- Larsa: "dominou a Suméria inteira" virou "boa parte do sul, Isin e Nippur incluídas".
- Eshnunna: "destruída em 1762" virou "conquistada logo depois de 1762".

## 30/10/2026: terceira rodada (Egito, Núbia, Mesopotâmia clássica e Irã)

Fontes F073–F122: ensaios do Met (Uruk, escrita, Ur, Ubaid, Núbia), Louvre (Código de Hamurabi), British Museum (Cilindro de Ciro, joias de Ur, Náucratis), Britannica, ISAC de Chicago (Nippur, Meroé, túmulos das rainhas de Nimrud), Penn Museum, CDLI, Antiquity (Tell Brak), ICOMOS (Shahr-i Sokhta), Godlewski (Dongola) e a decifração do elamita linear (Desset et al. 2022).

- 34 lugares, 7 civilizações e 8 eventos ganharam fonte.
- **Correções:** a escrita em Uruk passou de 3300 para c. 3200 a.C. (Met); Mari agora diz "centenas de cômodos" (as fontes variam entre 260 e 300); o baqt de Dongola durou "mais de cinco séculos", não 600 anos; Pasárgada tem o túmulo "tradicionalmente atribuído" a Ciro; Shahr-i Sokhta ganhou a data de fundação e o tabuleiro virou "talvez um antepassado do gamão".

## 30/10/2026: artes em tabela

Os 19 padrões ornamentais e a regra que escolhe o padrão de cada lugar saíram do código e foram para `artes_estilos.csv` e `artes_regras.csv`, com inspiração, fonte e status como o resto. Um teste com 200 mil pontos aleatórios confirmou que as regras em tabela escolhem exatamente o mesmo padrão que o código antigo.

## Artes: estilos por civilização, peças de referência e animação (2026-10-30)

- 15 estilos novos ligados a civilizações: minoico, cicládico, Vale do Indo, olmeca, moche, khmer, etrusco, romano, bizantino, axumita, celta, otomano, Grande Zimbábue, asteca, assírio. Total: 34 estilos e 52 regras.
- Regras com `alvo` (id da civilização) vêm primeiro; caixas regionais mais estreitas vêm antes das amplas (ex.: assírio antes de mesopotâmico, bizantino antes de islâmico).
- Cada estilo tem uma peça real de referência (`peca`, `peca_local`, `peca_fonte`); o cartão mostra o link "peça ↗". Fontes novas F123–F149 (museus, Smarthistory, Britannica, EBSCO, Getty, teses).
- Sem peça com fonte A–C nesta rodada: andino, aborígene, polinésio e etrusco (este tem peça indicada, a Tumba das Leoas, mas sem fonte ligada). Ficam `revisado_sem_fonte`.
- Os padrões são desenhos simplificados feitos para o atlas, não cópias das peças.
- Animação: cada ladrilho se desenha traço a traço (`pathLength` + `stroke-dashoffset`), da esquerda para a direita, alternando as cores da paleta. Respeita `prefers-reduced-motion`.

## 30/10/2026: quarta rodada (Américas, África, Europa, Ásia, Oceania, casos e sincronias)

Fontes F150–F255. A maior parte é da UNESCO (fichas do Patrimônio Mundial e listas indicativas), com artigos científicos (Science, Nature, Antiquity, PLOS One, Early China), museus (Met, British Museum, VMFA), o DAI, o Ministério da Cultura da França e governos locais. Com isso, nenhum item ficou como `nao_revisado`: 253 com fonte, 253 revisados sem fonte e 1 contestado.

**Correções nos lugares**
- Américas: Monte Verde passou a `contestado` (Surovell et al., Science, 2026). Pachacamac teve a continuidade suavizada. As muralhas de Kuélap agora têm 19 m. Real Alto e El Tajín ganharam notas.
- África e Europa:
  - Tassili começa em -8000 e Mapungubwe termina em 1300. Gedi começa em 1000 e Biskupin termina em -590.
  - Tarquínia tem "cerca de 200 tumbas pintadas". Paris ganhou a muralha gaulesa achada em 2026 na Île de la Cité.
  - Benin e Novgorod ficaram com confiança baixa nas datas.
- Ásia:
  - Ban Chiang começa em -1500 (UNESCO: 1495 a.C.). Anuradhapura termina em 993.
  - A torre de Brihadeeswarar tem cerca de 60 m, e não 66.
  - Óc Eo perdeu as "moedas romanas", que a fonte não confirma, e vai até o séc. VII.
  - Bukhara perdeu "terra de Avicena", que não está na fonte. Jiahu termina em -5700.
- Oceania:
  - Murujuga começa em -48000 (UNESCO: mais de 50 mil anos), com 1 a 2 milhões de petróglifos.
  - Kuk começa em -5000 (7 mil anos atrás, talvez 10 mil).
  - Nan Madol vai de 1200 a 1600.
  - Taputapuātea agora diz o que a UNESCO afirma (lar ancestral da cultura polinésia).

**Perguntas (casos)**
- 16 de 23 têm fonte.
- Çatalhöyük e Cusco tiveram o texto ajustado: a população inca agora é "milhões", e entrou a rede de mais de 30 mil km.
- Jericó, 'Ain Ghazal, Stonehenge, Mohenjo-daro, Anyang, Monte Albán e Harappa ficam sem fonte por ora.

**Sincronias**
- Carnac, Uruk/Stonehenge e as estradas incas ganharam fonte. As estradas passaram de 40 mil para mais de 30 mil km (UNESCO).
- Textos suavizados:
  - Göbekli Tepe é "mais de 6 mil anos" mais antigo que Stonehenge.
  - San Lorenzo aparece como "grande centro olmeca" no tempo de Kadesh.
  - A Muralha Ming foi "reforçada" por volta de 1490.
  - A Primeira Guerra terminou com "bombardeios aéreos".
- As outras 27 são fatos de manual conferidos, mas ainda sem fonte ligada.

## 30/10/2026: quinta rodada (lugares, casos, sincronias e eventos)

Fontes F328–F415. Agora 410 itens têm fonte, 96 estão revisados sem fonte e 1 é contestado.

- **Lugares:** todos os lugares têm fonte. As fichas da UNESCO cobrem a maior parte; os sítios fora da lista usam artigos científicos (Nature 2022 para Casarabe, Science 2003 para Kuhikugu, Neves et al. 1999 para Luzia, Ancient Mesoamerica 2022 para El Mirador), o INAH (La Venta, Tula), a Britannica e Schaan (Marajó).
- **Correções em lugares:**
  - Teotihuacan: saiu "mais de 100 mil pessoas" (a UNESCO diz pelo menos 25 mil).
  - Chichén Itzá: saiu a serpente de sombra nos equinócios.
  - Chaco: saíram os alinhamentos astronômicos; entraram as estradas.
  - Stonehenge: "alinhado aos solstícios" virou "significado astronômico ainda estudado".
  - Machu Picchu: saiu "propriedade real inca".
  - Tikal: início em -600.
  - El Mirador: "dezenas de cidades" virou "centenas de cidades, vilas e aldeias".
- **Casos das grandes perguntas:** os 7 restantes têm fonte. Stonehenge usa o estudo dos porcos de Madgwick et al. 2019; Monte Albán usa Marcus e Flannery.
- **Sincronias:** as 27 restantes têm fonte. Textos ajustados ao que as fontes dizem:
  - S008: Tera "entre cerca de 1600 e 1525 a.C.".
  - S017: Tikal e Calakmul em 537 viraram "Tikal, e um século depois a dinastia Kaan em Calakmul".
  - S018: Chang'an com perto de 1 milhão.
  - S020: Cahokia com 10 a 20 mil, sem comparar com Londres.
  - S021: Angkor como capital khmer.
  - S025: Shakespeare e Cervantes com 11 dias de diferença.
  - S028: Nintendo, data de 1889 contestada.
  - S029: tanques em 1916, sem "bombardeios aéreos".
  - Datas de referência sem fonte própria nesta tabela: morte de Cleópatra (30 a.C.), Apollo 11 (1969), Torre Eiffel (1889).
- **Eventos:** os 18 têm fonte.
  - Alexandre: "dezenas de cidades" virou "cerca de 20".
  - Cabral: avistou terra em 22/4 e ancorou em Porto Seguro dias depois.
  - Astecas e incas: saiu "a varíola matou mais que as armas"; entrou a morte de Huayna Capac.
- **Ainda sem fonte (96):** civilizações (62), passeios (20), rotas (10) e artes (4). As 15 épocas são resumos editoriais e ficam fora dessa conta.

## 30/10/2026: sexta rodada (civilizações, rotas, passeios e artes)

- **Fontes:** 50 novas (F416–F465). Agora 505 de 507 itens têm fonte. Fica sem fonte só o padrão polinésio: não achei peça de museu confiável para ancorá-lo.
- **Civilizações (62):** todas com fonte, temas e nível. Correções de texto:
  - Teotihuacan: saiu "mais de 100 mil habitantes"; a UNESCO dá ao menos 25 mil, e outras estimativas são maiores.
  - Incas: estradas de "40 mil km" viraram "mais de 30 mil km".
  - Khmer: saiu "maior monumento religioso do mundo".
  - Gupta: "era clássica" agora aparece como rótulo questionado.
  - Frígios: Midas é histórico; o toque de ouro e o nó górdio são lendas. Período ajustado para c. 950–550 a.C.
  - Jōmon: período ajustado para c. 13 mil–400 a.C. (UNESCO).
  - Hunos: o empurrão sobre os godos (376) é anterior a Átila.
  - Mali: saiu "talvez o homem mais rico da história".
  - Grande Zimbábue: saiu a cerâmica chinesa, sem fonte.
  - Hurritas, Máuria, Alexandre, Sabá e Srivijaya: ajustes menores.
  - Xia: confiança das datas baixa; a existência da dinastia não tem registro da época.
- **Rotas (10):** todas com fonte. Lápis-lazúli: "única fonte" virou "fonte mais provável".
- **Passeios (20) e artes (3):** com fonte. O passeio de Alexandre também passou a dizer "pouco mais de dez anos".
- **Temas:** os de lugares (260) e sincronias (30) foram sugeridos por palavras-chave e depois revisados um a um (173 lugares e as 30 sincronias corrigidos). Os das civilizações, rotas, eventos e passeios foram escolhidos item a item.
- Afirmações que as fontes não cobrem ficaram anotadas em `notas_revisao` de cada linha.

## 30/10/2026: Aprender história

- `passeios`, `passeios_paradas`, `perguntas` e `perguntas_casos` viraram `trilhas` (tipo passeio ou debate) e `trilhas_paradas`.
- Botão único "Aprender história", com nível (iniciante, colégio, graduação, completo, personalizado por temas).
- Iniciante: só as paradas marcadas como iniciante, com `texto_iniciante` (15 textos novos, mais simples, sobre os mesmos fatos e as mesmas fontes).
- Debates ficam a partir do nível colégio. A trilha de Taş Tepeler também.

## 30/10/2026: terras hoje submersas

- Nova camada: entre 10 mil e cerca de 2 mil a.C., o mapa mostra em tom de areia a terra que estava acima do mar e hoje está submersa (Doggerland, Beríngia, Sunda, Sahul, Golfo Pérsico).
- Nível do mar ano a ano: `data/conteudo/nivel_mar.csv`, curva global de Lambeck e colegas (PNAS, 2014; F467), interpolada entre os pontos citados.
- Fundo do mar: ETOPO1 em grade de 10 minutos de arco (cerca de 18 km), via projeto Fatiando a Terra (F468). Linhas de costa em 14 níveis, de −70 a −2 m.
- Limites do método ("banheira"): não considera o afundamento e a subida da crosta sob o peso do gelo nem a sedimentação. Báltico, Mar Branco e Baía de Hudson ficam de fora (estavam sob gelo ou com nível próprio), assim como Mar Negro, Cáspio e Aral (lagos com nível próprio).
- Anos novos na linha do tempo: 9000, 7000, 6500 e 6000 a.C., para ver o mar subir.

## 31/10/2026: layout novo e aula de verdade

- Computador: cards, grandes perguntas e "Neste período" ficam num painel fixo à direita (400 px); o mapa encolhe e nada fica por cima dele. A aula ocupa meia tela.
- Celular: os painéis viram gaveta que sobe de baixo.
- Rodapé enxuto: ano, época e linha do tempo. "Enquanto isso", eventos e "Surgem…" foram para o painel "Neste período".
- Card: temas em pílulas, "Veja também" (lugares próximos da mesma época e aulas que passam pelo lugar) e fontes visíveis.
- Aula: abertura com objetivo, etapas com sumário e progresso, conceitos do glossário destacados no texto, "Para pensar", quiz com explicação e fonte, resumo e próxima aula. Progresso salvo no navegador.
- Dados novos: `glossario.csv` (3 termos), `quiz.csv` (3 perguntas da Mesopotâmia), colunas `objetivo` e `resumo` em `trilhas`, `pergunta` e `conceitos` em `trilhas_paradas`.
