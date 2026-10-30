# Atlas das Civilizações

**[Abrir o atlas →](https://cristianojoseblanco.github.io/atlas-civilizacoes/)**

Mapa interativo das civilizações ao longo do tempo, de 123 mil a.C. até hoje: fronteiras, relevo, rios, cidades antigas com datas de fundação e abandono e sítios arqueológicos.

## Como funciona

- **Linha do tempo** com 54 momentos históricos e transições animadas entre eles.
- **Fronteiras** recortadas no litoral real e desenhadas translúcidas sobre o relevo.
- **Cidades** (como Uruk, Lagash, Dilmun, Jiroft, Mohenjo-daro e Teotihuacan) que aparecem e somem conforme existiram.
- **Eventos animados** (campanhas de Alexandre, Peste Negra, colapso do Bronze, navegações) e **rotas comerciais** com fluxo (lápis-lazúli, rede do Golfo, Rota da Seda).
- **Passeios guiados** em modo documentário: Taş Tepeler (Göbekli Tepe, Karahan Tepe, Sayburç e os outros sítios), Mesopotâmia e "Como o mundo se conectou".
- **Grandes perguntas**: casos do modelo clássico (Childe) e contraexemplos (Graeber & Wengrow) sobre agricultura, cidades sem reis e origem da escrita.
- **Enquanto isso…**: sincronias surpreendentes em cada época.
- **Busca** por civilização, cidade, sítio, evento ou rota (atalho `/`).
- **Oriente Próximo desenhado à mão** entre 3500 e 1500 a.C. (Uruk, Akkad, Ur III, Hamurabi, Dilmun, Magan, Marhashi, Mitanni…), com 5 épocas extras na linha do tempo.
- **Cartões** em português com período, centros e contexto de cada civilização, cidade ou sítio.

O resultado é um único `index.html` autocontido, que funciona offline e no celular.

## Estrutura

```
src/        código e conteúdo editorial
  app.js        renderização do mapa (canvas + d3)
  template.html layout e estilos
  content.js    civilizações e épocas
  places.js     cidades e sítios
  events.js     eventos animados e rotas comerciais
  tours.js      passeios guiados
  themes.js     grandes perguntas
  sync.js       "Enquanto isso…"
data/       dados já processados (versionados)
scripts/    download dos dados brutos, processamento e build
```

## Rodar

```bash
npm install
npm run build        # gera index.html a partir de src/ e data/
```

Para regenerar `data/` do zero (fronteiras, rios, relevo): `npm run data` (precisa de Python com numpy e Pillow).

## Fontes dos dados

- Fronteiras do Oriente Próximo entre 3500 e 1500 a.C.: desenhadas para este atlas (`scripts/ne_borders.py`), aproximadas.
- Fronteiras históricas: [historical-basemaps](https://github.com/aourednik/historical-basemaps), de A. Ourednik (GPL-3.0). São aproximadas, sobretudo antes de 1000 a.C.
- Relevo sombreado, litoral, rios e lagos: [Natural Earth](https://www.naturalearthdata.com/) (domínio público).
- Textos, datas de cidades e sítios: redação própria, aproximada e em revisão.

## Licença

GPL-3.0. Veja [LICENSE](LICENSE).
