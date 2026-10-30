// Padrões ornamentais desenhados para o atlas, inspirados em tradições artísticas (não são cópias de peças).
// Cada estilo é um ladrilho SVG que se repete no topo dos cartões.
const ART = {
  meandro:   {nome:"grega (meandro)", w:32, h:28, d:`<path d="M0 25H28V4H7V18H21V11H14"/><path d="M0 1.5H32M0 27H32" stroke-width="1.5"/>`},
  egipcio:   {nome:"egípcia (lótus)", w:30, h:40, d:`<path d="M15 34C9 26 9 14 15 6C21 14 21 26 15 34Z"/><path d="M15 34C9 32 4 25 4 16M15 34C21 32 26 25 26 16"/><path d="M0 37H30" stroke-width="1.5"/>`},
  mesopotamia:{nome:"mesopotâmica (roseta e zigue-zague)", w:40, h:44, d:`<circle cx="20" cy="16" r="3"/><path d="M20 4C23 9 23 13 20 13C17 13 17 9 20 4ZM20 28C17 23 17 19 20 19C23 19 23 23 20 28ZM8 16C13 13 17 13 17 16C17 19 13 19 8 16ZM32 16C27 19 23 19 23 16C23 13 27 13 32 16Z"/><path d="M0 40L5 34L10 40L15 34L20 40L25 34L30 40L35 34L40 40"/>`},
  persa:     {nome:"persa (ameias de Persépolis)", w:32, h:34, d:`<path d="M0 32V22H6V14H12V6H20V14H26V22H32V32"/><circle cx="16" cy="24" r="3"/>`},
  islamico:  {nome:"islâmica (estrela de oito pontas)", w:40, h:40, d:`<rect x="10" y="10" width="20" height="20"/><rect x="10" y="10" width="20" height="20" transform="rotate(45 20 20)"/><path d="M0 0L6 6M40 0L34 6M0 40L6 34M40 40L34 34"/>`},
  indiano:   {nome:"indiana (lótus)", w:44, h:44, d:`<circle cx="22" cy="22" r="3"/><ellipse cx="22" cy="12" rx="3.5" ry="7"/><ellipse cx="22" cy="32" rx="3.5" ry="7"/><ellipse cx="12" cy="22" rx="7" ry="3.5"/><ellipse cx="32" cy="22" rx="7" ry="3.5"/><circle cx="22" cy="22" r="17" stroke-width="1.2"/>`},
  chines:    {nome:"chinesa (leiwen, o padrão do trovão)", w:32, h:32, d:`<path d="M3 29V3H29V25H8V8H24V20H13V13H19V16"/>`},
  japones:   {nome:"japonesa (seigaiha, ondas)", w:40, h:20, d:`<path d="M2 20A18 18 0 0 1 38 20M7 20A13 13 0 0 1 33 20M12 20A8 8 0 0 1 28 20"/><path d="M-18 10A18 18 0 0 1 18 10M22 10A18 18 0 0 1 58 10" stroke-width="1.5"/>`},
  maia:      {nome:"mesoamericana (greca escalonada)", w:44, h:30, d:`<path d="M0 28H10V20H18V12H26V4H40V18H32V12"/><path d="M0 1.5H44" stroke-width="1.5"/>`},
  andino:    {nome:"andina (chakana, a cruz escalonada)", w:40, h:40, d:`<path d="M15 4H25V10H30V15H36V25H30V30H25V36H15V30H10V25H4V15H10V10H15Z"/><circle cx="20" cy="20" r="4"/>`},
  amazonico: {nome:"amazônica (cerâmica marajoara)", w:36, h:36, d:`<path d="M4 32V4H32V28H10V10H26V22H16V16H20"/><circle cx="34" cy="2" r="1.5"/><circle cx="2" cy="34" r="1.5"/>`},
  africa:    {nome:"da África Ocidental (bogolan)", w:32, h:32, d:`<path d="M0 10L8 2L16 10L24 2L32 10"/><path d="M0 22H32" stroke-width="1.5"/><circle cx="4" cy="28" r="1.6"/><circle cx="12" cy="28" r="1.6"/><circle cx="20" cy="28" r="1.6"/><circle cx="28" cy="28" r="1.6"/>`},
  espiral:   {nome:"pré-histórica e celta (espirais)", w:44, h:44, d:`<path d="M22 22a2 2 0 0 1 4 0a6 6 0 0 1-12 0a10 10 0 0 1 20 0a14 14 0 0 1-28 0a18 18 0 0 1 36 0"/>`},
  nordico:   {nome:"nórdica (entrelaçado)", w:48, h:24, d:`<path d="M0 12C12 0 12 0 24 12S36 24 48 12"/><path d="M0 12C12 24 12 24 24 12S36 0 48 12"/>`},
  tepe:      {nome:"de Taş Tepeler (pilares em T)", w:36, h:44, d:`<path d="M6 6H30V13H22V40H14V13H6Z"/><path d="M14 22H11M14 28H11M22 22H25" stroke-width="1.5"/>`},
  estepe:    {nome:"das estepes (estilo animal)", w:44, h:30, d:`<path d="M4 22C8 14 14 12 20 14C24 8 30 8 34 12L40 10L36 16C34 22 26 24 20 20C14 24 8 26 4 22Z"/><circle cx="33" cy="12" r="1"/>`},
  norte:     {nome:"norte-americana (cruz solar mississipiana)", w:40, h:40, d:`<circle cx="20" cy="20" r="13"/><path d="M20 9V31M9 20H31"/><circle cx="20" cy="20" r="4"/>`},
  aborigene: {nome:"australiana (círculos de pontos)", w:40, h:40, d:`<circle cx="20" cy="20" r="3"/><circle cx="20" cy="20" r="9" stroke-dasharray="1.5 3.2"/><circle cx="20" cy="20" r="15" stroke-dasharray="1.5 3.6"/>`},
  polinesio: {nome:"polinésia (dentes de tubarão e ondas)", w:32, h:32, d:`<path d="M0 12L4 4L8 12L12 4L16 12L20 4L24 12L28 4L32 12"/><path d="M0 22C4 18 8 18 12 22S20 26 24 22S30 18 32 20"/>`},
};
function artStyle(lon, lat, y, g){
  if (g === 'tt') return 'tepe';
  if (g === 'gr') return 'meandro';
  const inb = (x0, x1, y0, y1) => lon >= x0 && lon <= x1 && lat >= y0 && lat <= y1;
  if (inb(110, 156, -45, -10)) return 'aborigene';
  if (lon > 156 || lon < -125) return 'polinesio';
  if (inb(-125, -60, 25, 70)) return 'norte';
  if (inb(-118, -84, 8, 25)) return 'maia';
  if (inb(-84, -62, -45, 8)) return 'andino';
  if (inb(-62, -30, -40, 8)) return 'amazonico';
  if (inb(129, 146, 30, 46)) return 'japones';
  if (inb(98, 135, 18, 46)) return 'chines';
  if (inb(62, 125, -10, 36)) return 'indiano';
  if (inb(46, 125, 36, 56)) return y < 650 ? 'estepe' : 'islamico';
  if (inb(24, 37, 13, 32)) return y < 640 ? 'egipcio' : 'islamico';
  if (inb(-20, 60, 12, 40) && y >= 640) return 'islamico';
  if (inb(34, 63, 22, 41)) return y < -560 ? 'mesopotamia' : 'persa';
  if (inb(-20, 55, -36, 13)) return 'africa';
  if (inb(-10, 30, 34, 46) && y > -1500) return 'meandro';
  if (inb(-12, 45, 46, 72) && y >= 500) return 'nordico';
  return 'espiral';
}
function artTile(style, color){
  const a = ART[style];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${a.w}" height="${a.h}" viewBox="0 0 ${a.w} ${a.h}"><g fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">${a.d}</g></svg>`;
}
