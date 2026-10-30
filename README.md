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
- **Arte de cada cultura**: 20 padrões ornamentais próprios (meandro grego, lótus egípcio, chakana andina, leiwen chinês, marajoara, bogolan…) no topo dos cartões.
- **Cartões** em português com período, centros e contexto de cada civilização, cidade ou sítio.

O resultado é um único `index.html` autocontido, que funciona offline e no celular.

## Fontes e auditoria

Todo o conteúdo fica em tabelas CSV em `data/conteudo/`, com fontes ligadas e status de verificação em cada item. A bibliografia está em `fontes.csv`, com nível de confiabilidade e forma de consulta. O `AUDITORIA.md` mostra quanto do conteúdo já tem fonte, e o `DADOS.md` explica as tabelas e as regras. No atlas, cada cartão mostra as fontes e o selo de verificação.

## Estrutura

```
src/        código
  app.js        renderização do mapa (canvas + d3)
  template.html layout e estilos
  art.js        padrões de arte por cultura
data/
  conteudo/     TODO o conteúdo em CSV (fonte única), com fontes e status
  borders/ …    dados geográficos processados
scripts/
  conteudo.py   lê os CSVs e gera o JavaScript
  validar.py    confere as tabelas e gera AUDITORIA.md
  build.py      monta o index.html
  …             download e processamento dos dados geográficos
```

## Rodar

```bash
npm install
npm run validar      # confere as tabelas e atualiza AUDITORIA.md
npm run build        # valida e gera index.html
```

Para regenerar `data/` do zero (fronteiras, rios, relevo): `npm run data` (precisa de Python com numpy e Pillow).

## Fontes dos dados

- Fronteiras do Oriente Próximo entre 3500 e 1500 a.C.: desenhadas para este atlas (`scripts/ne_borders.py`), aproximadas.
- Fronteiras históricas: [historical-basemaps](https://github.com/aourednik/historical-basemaps), de A. Ourednik (GPL-3.0). São aproximadas, sobretudo antes de 1000 a.C.
- Relevo sombreado, litoral, rios e lagos: [Natural Earth](https://www.naturalearthdata.com/) (domínio público).
- Textos, datas de cidades e sítios: redação própria. As fontes ligadas e o status de cada item estão nas tabelas (veja `AUDITORIA.md`).

## Licença

GPL-3.0. Veja [LICENSE](LICENSE).
