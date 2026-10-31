---
name: Atlas das Civilizações · Tabuleiro
description: Aprender história como um jogo de tabuleiro sobre um mapa vivo.
colors:
  noite: "#1D2B36"
  noite-chip: "#2A3C4A"
  papel: "#FFF6E3"
  carta: "#FFFFFF"
  contorno: "#0F1A22"
  tinta: "#1D2B36"
  tinta-suave: "#5D5647"
  texto-claro: "#FFF6E3"
  ouro: "#F2B33D"
  feito: "#2A9D8F"
  alerta: "#E5644A"
  termo: "#8A5A0B"
  mapa-terra: "#F1DCA6"
  mapa-mar: "#3D7F8F"
  mapa-rio: "#2B6576"
  tema-mesopotamia: "#F2B33D"
  tema-egito: "#E5644A"
  tema-grecia: "#2A9D8F"
  tema-roma: "#B5473A"
  tema-china: "#7FB069"
  tema-fenicios: "#8E6BBF"
typography:
  titulo-licao:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "38px"
    fontWeight: 800
    lineHeight: "40px"
    letterSpacing: "-0.01em"
  titulo-cartao:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 800
    lineHeight: "24px"
  leitura:
    fontFamily: "Nunito Sans, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: "30px"
  botao:
    fontFamily: "Nunito Sans, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 800
    lineHeight: "22px"
  rotulo:
    fontFamily: "Nunito Sans, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: "20px"
  nota:
    fontFamily: "Nunito Sans, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
rounded:
  carta: "14px"
  painel: "22px"
  chip: "999px"
spacing:
  s: "8px"
  m: "16px"
  l: "24px"
  xl: "34px"
components:
  botao-principal:
    backgroundColor: "{colors.ouro}"
    textColor: "{colors.tinta}"
    typography: "{typography.botao}"
    rounded: "{rounded.carta}"
    height: "54px"
    padding: "0 20px"
  botao-secundario:
    backgroundColor: "{colors.carta}"
    textColor: "{colors.tinta}"
    typography: "{typography.botao}"
    rounded: "{rounded.carta}"
    height: "54px"
    padding: "0 20px"
  painel-leitura:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.painel}"
    padding: "26px 104px 26px 34px"
  chip-topo:
    backgroundColor: "{colors.noite-chip}"
    textColor: "{colors.texto-claro}"
    typography: "{typography.rotulo}"
    rounded: "{rounded.chip}"
    height: "40px"
  carta-termo:
    backgroundColor: "{colors.carta}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.carta}"
    padding: "14px 16px"
  casa-atual:
    backgroundColor: "{colors.ouro}"
    textColor: "{colors.tinta}"
    rounded: "12px"
    size: "48px"
  casa-feita:
    backgroundColor: "{colors.feito}"
    textColor: "{colors.texto-claro}"
    rounded: "10px"
    size: "40px"
---

# Design System: Atlas das Civilizações · Tabuleiro

## Overview

O atlas é um tabuleiro. O mapa é o campo de jogo, as lições são casas de um caminho, e o aluno é um personagem, o **Viajante**, que anda de lugar em lugar. Cada lição concluída rende uma peça para a coleção: o objeto da civilização estudada. A aparência vem de jogos de mesa: peças com contorno grosso, cores chapadas, papel creme para ler e uma noite azul em volta.

Esta é uma tela de **leitura**. O texto longo é o centro. O jogo fica nas bordas: topo, casas, mapa e peças. O texto em si fica calmo.

Fontes deste guia: escolha do dono do projeto entre três direções (31/10/2026). Crítica feita com a skill Impeccable. Regras de cor, rótulos e identidade conferidas com a Taste. Movimento segundo as regras de Emil Kowalski. Pranchas no Figma ("Atlas das Civilizações · Direção visual") e no canvas do projeto.

## Colors

### Primary
- **Ouro** `#F2B33D`: só na ação principal da tela ("Responder…") e na casa atual. Se aparecer em mais de dois lugares, perde o sentido.

### Secondary
- **Feito** `#2A9D8F`: seção concluída, energia cheia, resposta certa.
- **Alerta** `#E5644A`: chama da sequência e resposta errada. Sempre acompanhado de ícone ou palavra, nunca só a cor.

### Neutral
- **Noite** `#1D2B36`: fundo do app. **Noite-chip** `#2A3C4A`: chips e botões sobre a noite.
- **Papel** `#FFF6E3`: painel de leitura. **Carta** `#FFFFFF`: carta de termo e botão secundário.
- **Tinta** `#1D2B36`: todo texto corrido, sempre na cor cheia. **Tinta-suave** `#5D5647`: fontes e metadados (6,5:1 sobre papel).
- **Contorno** `#0F1A22`: borda de 3 px e sombra dura das peças.

### Mapa e temas
- Mapa: terra `#F1DCA6`, mar `#3D7F8F`, rios `#2B6576`.
- Cada tema tem uma cor própria, usada só no marcador e no estandarte do Viajante: Mesopotâmia ouro, Egito coral, Grécia verde-mar, Roma `#B5473A`, China `#7FB069`, Fenícios `#8E6BBF`.

### Named Rules
- **Regra da cor que significa.** Cor forte só onde há significado: ação, estado ou tema. O resto é papel, tinta e noite.
- **Termo explicado** `#8A5A0B` (6,3:1): sublinhado e negrito na palavra que abre uma carta de termo.

## Typography

Duas famílias, cada uma com uma função:
- **Bricolage Grotesque ExtraBold**: títulos, números do topo e nomes de lugares no mapa.
- **Nunito Sans**: todo o texto corrido e os botões.

### Hierarchy
| Papel | Tamanho / altura de linha | Uso |
|---|---|---|
| Título da lição | 38 / 40 | Uma vez por tela, até duas linhas |
| Título de cartão | 20 / 24 | Cartão de peça, nome do lugar |
| Leitura | 18 / 30 | Texto da lição, de 60 a 75 letras por linha |
| Botão | 17 / 22 ExtraBold | Ações |
| Rótulo | 14 / 20 Bold | Chips do topo, rótulos curtos |
| Nota | 12 / 16 | Fontes e créditos, o menor tamanho permitido |

### Named Rules
- **Rótulos em frase comum**: "Carta de termo" e "Peça nova na coleção", nunca em maiúsculas espaçadas. No máximo um rótulo em maiúsculas por tela.
- **Nada abaixo de 11 px**, nem dentro de ícones (o "XP" vira desenho, não texto).

## Layout

- Computador: topo de 76 px. Embaixo, o painel de leitura (700 px) e o mapa (o resto), com 20 px entre eles e 24 px de margem.
- A coluna de texto tem margem direita de 104 px, para a linha não passar de 75 letras.
- Celular (a desenhar): o mapa vira faixa fixa no topo, com 35% da altura, e o texto rola embaixo.
- Espaços: 8, 16, 24 e 34 px.

## Elevation & Depth

### Shadow Vocabulary
- **Sombra dura de peça**: `0 4px 0 #0F1A22`, sem desfoque. Vai só no que é tocável ou é peça do jogo: botões, casa atual, cartão de peça ganha, marcador e Viajante.
- Painéis (leitura e mapa) não têm sombra; a separação vem da noite em volta.

### Named Rules
- **Peça flutua, papel não.** Se não dá para tocar nem colecionar, não tem sombra.

## Shapes

- Contorno de 3 px `#0F1A22` em tudo que é peça. A carta de termo usa 2,5 px.
- Raios: 14 px (botões, cartas), 22 px (painéis), 999 px (chips do topo e marcador de época), 10 a 12 px (casas).
- Casa futura: borda tracejada `5 4`, fundo branco.

## Components

### Botões
- **Principal**: ouro, contorno, sombra dura, ocupa a largura que sobra. Um por tela.
- **Secundário**: carta branca, contorno, sombra dura, largura do conteúdo.
- Ao apertar: desce 2 px e a sombra vai de 4 para 2 px em 120 ms (`--ease-out`).

### Chips do topo
XP ("220 XP"), sequência ("3 dias seguidos") e energia ("Energia 4/5" com hexágonos). O texto escrito é obrigatório: o ícone sozinho não basta.

### Casas das seções
Feita (verde com ✓), atual (ouro, 48 px, sombra), futura (tracejada). Ligadas por um traço de 24 × 3 px.

### Carta de termo
Rótulo escuro "Carta de termo" e a definição em uma ou duas linhas. Abre ao tocar na palavra destacada.

### Marcador de tema
Pino com contorno e sombra, com o objeto do tema dentro de um círculo creme. Serve no mapa e na coleção.

### Viajante (o personagem)
- Corpo fixo: chapéu ouro com faixa coral, túnica verde-mar, cinto ouro, bolsa de couro e cajado com estandarte.
- **O estandarte muda com o tema**: mostra o objeto da civilização estudada, na cor do tema.
- Poses: **Andando** (entre lugares), **Parado** (ao chegar), **Comemorando** (lição concluída) e **Retrato** (perfil).
- Rosto simples: dois olhos, sobrancelhas, sorriso e bochechas. Sem traços que indiquem etnia; o rosto é o mesmo em todo tema.

### Movimento (Emil Kowalski)
| O quê | Para quê | Como |
|---|---|---|
| Viajante andando entre lugares | Mostrar de onde veio e para onde vai | Segue a rota em 1,2 s com `--ease-in-out`. As pernas alternam a cada 160 ms. Tocar no mapa interrompe |
| Chegada | Mostrar que chegou | Muda para "Parado". O estandarte balança uma vez (mola, quique 0,2) |
| Peça nova | Celebrar (raro) | O cartão sobe 8 px e aparece em 240 ms com `--ease-out`, saindo de 96% do tamanho, nunca de zero |
| Mapa voando | Levar ao lugar | 1,2 a 1,5 s com `--ease-in-out` |
| Botões | Resposta ao toque | 120 ms |
| Reduzir movimento | Acessibilidade | Sem caminhada: o Viajante aparece no destino com esmaecimento de 150 ms |

Curvas: `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` e `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)`. Só `transform` e `opacity`.

## Do's and Don'ts

- **Faça**: texto corrido sempre em tinta cheia sobre papel, com 18 px.
- **Faça**: o ouro só na ação principal e na casa atual.
- **Faça**: escrever o que cada ícone do topo significa.
- **Não faça**: sombra dura em painéis de leitura ou no mapa.
- **Não faça**: rótulos em maiúsculas espaçadas, nem texto abaixo de 11 px.
- **Não faça**: usar a cor de um tema fora do marcador e do estandarte desse tema.
- **Não faça**: animar algo que acontece dezenas de vezes por minuto (rolar, digitar). A caminhada acontece uma vez por seção.
