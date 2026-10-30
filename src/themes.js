// Grandes perguntas: casos do modelo clássico (V. Gordon Childe, anos 1930–50) e contraexemplos
// discutidos por D. Graeber e D. Wengrow (O Despertar de Tudo, 2021) e outros autores.
// lado: classico | contra | variante | aberto
const LADOS = {
  classico: {cor:'#4ea3ff', nome:'Modelo clássico'},
  contra:   {cor:'#ff8a3d', nome:'Contraexemplo'},
  variante: {cor:'#c08cff', nome:'Outro caminho'},
  aberto:   {cor:'#b9b9b9', nome:'Em aberto'},
};
const THEMES = [
  {id:'agricultura', n:"A agricultura veio antes dos monumentos?", ano:-8000,
   intro:"Para Childe, a 'Revolução Neolítica' veio primeiro: plantar gerou excedente, o excedente sustentou especialistas, e só então surgiram templos e monumentos. Os achados das últimas décadas mostram que caçadores-coletores também ergueram monumentos, às vezes milênios antes de qualquer lavoura.",
   casos:[
    {n:"Jericó", at:[35.444,31.871], y:-9000, lado:'classico', t:"Muralha e torre de pedra em uma das primeiras comunidades a cultivar cereais. Por muito tempo foi o exemplo-padrão de 'aldeia agrícola que cresce e se fortifica'."},
    {n:"'Ain Ghazal", at:[35.97,31.99], y:-7250, lado:'classico', t:"Grande aldeia agrícola do Neolítico, com estátuas de gesso em tamanho quase natural. Os rituais elaborados vêm depois de séculos de agricultura, como no modelo clássico."},
    {n:"Göbekli Tepe", at:[38.922,37.223], y:-9600, lado:'contra', t:"Recintos monumentais erguidos por caçadores-coletores antes do trigo domesticado. A domesticação do einkorn aconteceu ali perto, em Karacadağ, e talvez em parte para alimentar essas reuniões."},
    {n:"Karahan Tepe", at:[39.302,37.091], y:-9400, lado:'contra', t:"Mesma época e mesma cultura de Göbekli Tepe, com casas e santuários lado a lado. Mostra comunidades sedentárias e rituais complexos sem lavoura plena."},
    {n:"Watson Brake", at:[-92.13,32.37], y:-3500, lado:'contra', t:"Onze montes de terra unidos por cumes, erguidos entre cerca de 3500 e 2800 a.C. por pescadores-caçadores-coletores da Louisiana. É o conjunto de montes mais antigo da América do Norte."},
    {n:"Poverty Point", at:[-91.407,32.637], y:-1650, lado:'contra', t:"Por volta de 1650–1300 a.C., caçadores-coletores construíram o maior conjunto de terraplenagens do hemisfério ocidental da época, com pedras trazidas de centenas de quilômetros. Não tinham agricultura."},
    {n:"Sannai-Maruyama", at:[140.70,40.81], y:-3900, lado:'contra', t:"Grande aldeia Jōmon no norte do Japão, com construções de troncos gigantes, ocupada por mais de mil anos por caçadores-coletores-pescadores."},
    {n:"Stonehenge", at:[-1.826,51.179], y:-3000, lado:'variante', t:"Construído por agricultores, mas como centro de grandes reuniões sazonais, com banquetes de porcos trazidos de longe. Para Graeber e Wengrow, é sinal de sociedades que mudavam de organização conforme a estação."},
   ]},
  {id:'reis', n:"Cidades precisam de reis?", ano:-3000,
   intro:"No modelo clássico, a 'Revolução Urbana' trouxe junto palácios, reis, escrita e classes: cidade grande seria sinônimo de hierarquia. Vários sítios mostram cidades grandes por séculos sem sinais claros de reis, e há casos de governo por conselhos. A interpretação de alguns desses sítios é debatida.",
   casos:[
    {n:"Uruk", at:[45.636,31.322], y:-3300, lado:'classico', t:"Templos monumentais, administração com selos e tabletes, e figuras do 'rei-sacerdote' na arte. É o retrato da cidade com elite no topo."},
    {n:"Ur: as tumbas reais", at:[46.103,30.962], y:-2600, lado:'classico', t:"Tumbas com ouro, lápis-lazúli e dezenas de servidores sacrificados junto aos governantes: desigualdade extrema e explícita."},
    {n:"Mênfis", at:[31.25,29.85], y:-3100, lado:'classico', t:"O Egito unificado sob um faraó divino, com pirâmides como afirmação máxima de poder concentrado."},
    {n:"Talianki", at:[30.37,48.80], y:-3900, lado:'contra', t:"Megassítio da cultura Trypillia, na Ucrânia, por volta de 3950–3650 a.C. As estimativas variam de cerca de 6 mil a 21 mil habitantes, em casas organizadas em anéis concêntricos. Não há palácios, centros administrativos ou grandes templos identificados."},
    {n:"Mohenjo-daro", at:[68.138,27.329], y:-2600, lado:'contra', t:"Cidade planejada para dezenas de milhares de pessoas, com esgoto e o Grande Banho, mas sem palácio, túmulo real ou imagem de rei claramente identificados."},
    {n:"Çatalhöyük", at:[32.828,37.668], y:-7400, lado:'contra', t:"Milhares de pessoas em casas quase iguais, sem prédios públicos de destaque. É uma 'proto-cidade' que parece ter evitado hierarquias marcadas por séculos."},
    {n:"Teotihuacan", at:[-98.844,19.692], y:-100, lado:'contra', t:"Depois de uma fase de pirâmides monumentais, por volta de 300 d.C. a cidade investiu em conjuntos residenciais de alta qualidade para a maioria da população. Os governantes quase não aparecem na arte. A natureza do governo ainda é debatida."},
    {n:"Tlaxcala", at:[-98.24,19.31], y:1500, lado:'contra', t:"Cidade-Estado nahua rival dos astecas, governada por um conselho de representantes. Os relatos espanhóis descrevem debates em assembleia, e foi esse conselho que decidiu se aliar a Cortés."},
    {n:"Jenné-Jeno", at:[-4.55,13.89], y:-250, lado:'contra', t:"Cidade às margens do Níger formada por aglomerados de bairros especializados, sem cidadela ou palácio. A arqueóloga Susan McIntosh a chamou de urbanismo 'heterárquico'."},
   ]},
  {id:'escrita', n:"A escrita nasceu para contar?", ano:-3000,
   intro:"Na Mesopotâmia, a escrita nasceu da contabilidade dos templos, e por muito tempo isso foi visto como a regra. Mas as poucas invenções independentes da escrita surgiram para fins diferentes, e o maior império das Américas funcionou sem ela.",
   casos:[
    {n:"Uruk: contabilidade", at:[45.636,31.322], y:-3300, lado:'classico', t:"Os primeiros tabletes registram cevada, ovelhas, rações e trabalhadores. Por séculos, a escrita foi quase só administração. A literatura veio muito depois."},
    {n:"Abidos: etiquetas reais", at:[31.92,26.18], y:-3250, lado:'variante', t:"No Egito, os sinais mais antigos estão em etiquetas da tumba U-j e em objetos ligados a reis e rituais. A escrita aparece cedo como propaganda e marca de poder."},
    {n:"Anyang: adivinhação", at:[114.31,36.12], y:-1200, lado:'variante', t:"Na China, a escrita mais antiga conhecida são perguntas aos ancestrais gravadas em ossos e cascos, que eram aquecidos para ler as rachaduras."},
    {n:"Monte Albán: calendário e conquista", at:[-96.77,17.04], y:-600, lado:'variante', t:"Na Mesoamérica, as primeiras inscrições registram datas do calendário, nomes e cativos: escrita a serviço do tempo ritual e da memória política."},
    {n:"Harappa: selos sem leitura", at:[72.864,30.631], y:-2600, lado:'aberto', t:"Milhares de selos com sinais curtos, mas nenhum texto longo e nenhuma decifração aceita. Não sabemos se era escrita completa nem para que servia."},
    {n:"Cusco: um império sem escrita", at:[-71.97,-13.53], y:1440, lado:'contra', t:"O Império Inca administrou cerca de 10 milhões de pessoas com quipus, cordas com nós que registravam números e talvez narrativas. É um Estado gigante sem escrita no sentido tradicional."},
   ]},
];
