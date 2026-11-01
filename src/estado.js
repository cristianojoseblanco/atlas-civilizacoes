// Estado do jogador, compartilhado entre o app (prototipo-g) e a lição (prototipo-f).
// Fica no navegador até existir conta (Supabase). Regras: XP 10 de primeira, 5 na segunda, 30 por lição;
// nível n exige 40·(n−1)² XP; energia 5 por dia, 1 por seção nova, revisão grátis; Premium sem limite de energia.
const Estado = (() => {
  const K = 'atlas-estado-v1', ENERGIA_DIA = 5;
  const dia = (d = new Date()) => d.toISOString().slice(0, 10);
  const ontem = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dia(d); };
  const padrao = () => ({xp: 0, energia: ENERGIA_DIA, diaEnergia: dia(), seq: 0, ultimoDia: null, feitos: [], secoes: {}, respostas: 0, primeira: 0, seguidas: 0, maxSeguidas: 0, melhorKm: null, escriba: false, galhos: 0, conquistas: {}, premium: false, novas: []});
  let s;
  try { s = {...padrao(), ...JSON.parse(localStorage.getItem(K) || '{}')}; } catch (e) { s = padrao(); }
  if (s.diaEnergia !== dia()) { s.energia = ENERGIA_DIA; s.diaEnergia = dia(); }
  const salva = () => { try { localStorage.setItem(K, JSON.stringify(s)); } catch (e) {} };

  const xpDoNivel = n => 40 * (n - 1) ** 2;
  const nivel = xp => { let n = 1; while (xpDoNivel(n + 1) <= xp) n++; return n; };

  const CONQUISTAS = [
    {id: 'primeira-cidade', nome: 'Primeira cidade', desc: 'Concluir a primeira lição.', ic: 'cidade', meta: 1, valor: () => s.feitos.length},
    {id: 'cartografo', nome: 'Cartógrafo', desc: 'Achar um lugar no mapa a menos de 40 km.', ic: 'alvo', meta: 1, valor: () => s.melhorKm !== null && s.melhorKm <= 40 ? 1 : 0},
    {id: 'na-mosca', nome: 'Na mosca', desc: 'Acertar 5 tarefas seguidas de primeira.', ic: 'raio', meta: 5, valor: () => s.maxSeguidas},
    {id: 'escriba', nome: 'Escriba', desc: 'Ordenar o nascimento da escrita de primeira.', ic: 'tablete', meta: 1, valor: () => s.escriba ? 1 : 0},
    {id: 'seq-3', nome: 'Três dias', desc: 'Estudar 3 dias seguidos.', ic: 'chama', meta: 3, valor: () => s.seq},
    {id: 'seq-7', nome: 'Uma semana', desc: 'Estudar 7 dias seguidos.', ic: 'chama', meta: 7, valor: () => s.seq},
    {id: 'seq-30', nome: 'Um mês', desc: 'Estudar 30 dias seguidos.', ic: 'chama', meta: 30, valor: () => s.seq},
    {id: 'galho', nome: 'Galho completo', desc: 'Concluir todas as lições de um galho.', ic: 'galho', meta: 1, valor: () => s.galhos},
    {id: 'curso', nome: 'Oriente Antigo', desc: 'Concluir as 32 lições do curso.', ic: 'coroa', meta: 32, valor: () => s.feitos.length},
  ];
  function checa(){
    CONQUISTAS.forEach(c => { if (!s.conquistas[c.id] && c.valor() >= c.meta) { s.conquistas[c.id] = dia(); s.novas.push(c.id); } });
    salva();
  }
  function marcaDia(){
    const h = dia(); if (s.ultimoDia === h) return;
    s.seq = s.ultimoDia === ontem() ? s.seq + 1 : 1; s.ultimoDia = h;
  }
  return {
    get: () => s,
    nivel, xpDoNivel, CONQUISTAS, ENERGIA_DIA,
    ganhaXp(n){ s.xp += n; salva(); },
    resposta(dePrimeira){ s.respostas++; if (dePrimeira) { s.primeira++; s.seguidas++; s.maxSeguidas = Math.max(s.maxSeguidas, s.seguidas); } else s.seguidas = 0; checa(); },
    km(d){ if (s.melhorKm === null || d < s.melhorKm) s.melhorKm = d; checa(); },
    marca(chave){ s[chave] = true; checa(); },
    // gasta 1 energia para uma seção nova; revisão e Premium não gastam
    podeEstudar(licao, secao){ return s.premium || (s.secoes[licao] ?? -1) >= secao || s.energia > 0; },
    entraSecao(licao, secao){ if (s.premium || (s.secoes[licao] ?? -1) >= secao) return true; if (s.energia <= 0) return false; s.energia--; salva(); return true; },
    terminaSecao(licao, secao){ s.secoes[licao] = Math.max(s.secoes[licao] ?? -1, secao); marcaDia(); checa(); },
    conclui(licao, galhosCompletos){ if (!s.feitos.includes(licao)) { s.feitos.push(licao); s.xp += 30; } if (galhosCompletos !== undefined) s.galhos = galhosCompletos; marcaDia(); checa(); },
    define(campos){ Object.assign(s, campos); checa(); },
    premium(v){ s.premium = v; salva(); },
    zera(){ const p = s.premium; s = padrao(); s.premium = p; salva(); },
    novas(){ const n = s.novas.splice(0); salva(); return n.map(id => CONQUISTAS.find(c => c.id === id)); },
  };
})();

// ícones das conquistas e da interface (traço de tabuleiro)
const ICONES = {
  cidade: '<path d="M4 20V11h4V7h5v4h3V8h4v12Z" fill="#E9C99A" stroke="#0F1A22" stroke-width="2" stroke-linejoin="round"/>',
  alvo: '<circle cx="12" cy="12" r="8.5" fill="#fff" stroke="#0F1A22" stroke-width="2"/><circle cx="12" cy="12" r="4.5" fill="#E5644A" stroke="#0F1A22" stroke-width="2"/>',
  raio: '<path d="M13 2L5 14h6l-1 8 8-12h-6z" fill="#F2B33D" stroke="#0F1A22" stroke-width="2" stroke-linejoin="round"/>',
  tablete: '<rect x="5" y="3" width="14" height="18" rx="3" fill="#C98F5A" stroke="#0F1A22" stroke-width="2"/><path d="M8 8l2 2M12 8h4M8 13h8M8 17h5" stroke="#0F1A22" stroke-width="1.8" stroke-linecap="round"/>',
  chama: '<path d="M12 2c2.4 4.3 7 6.6 7 12.2a7 7 0 0 1-14 0c0-3.4 2.2-4.8 3.4-8 1.2 2.3 2.2 3.4 3.5 3.4 0-3.4-1-5.5.1-7.6z" fill="#E5644A" stroke="#0F1A22" stroke-width="2" stroke-linejoin="round"/>',
  galho: '<circle cx="12" cy="4.5" r="2.5" fill="#2A9D8F" stroke="#0F1A22" stroke-width="1.8"/><circle cx="5" cy="19" r="2.5" fill="#2A9D8F" stroke="#0F1A22" stroke-width="1.8"/><circle cx="19" cy="19" r="2.5" fill="#2A9D8F" stroke="#0F1A22" stroke-width="1.8"/><path d="M12 7v5M12 12l-5.5 4.6M12 12l5.5 4.6" stroke="#0F1A22" stroke-width="2" stroke-linecap="round"/>',
  coroa: '<path d="M3 18L2 7l5 4 5-7 5 7 5-4-1 11Z" fill="#F2B33D" stroke="#0F1A22" stroke-width="2" stroke-linejoin="round"/>',
  energia: '<path d="M12 2l8.5 5v10L12 22l-8.5-5V7z" fill="#2A9D8F" stroke="#0F1A22" stroke-width="2" stroke-linejoin="round"/>',
  moeda: '<circle cx="12" cy="12" r="9" fill="#F2B33D" stroke="#0F1A22" stroke-width="2"/><path d="M12 7v10M9.5 9.5h4a1.8 1.8 0 0 1 0 3.5h-3a1.8 1.8 0 0 0 0 3.5h4" stroke="#0F1A22" stroke-width="1.6" stroke-linecap="round"/>',
  estrela: '<path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.2l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" fill="#F2B33D" stroke="#0F1A22" stroke-width="2" stroke-linejoin="round"/>',
  cadeado: '<rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="#B4AA93" stroke="#0F1A22" stroke-width="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="#0F1A22" stroke-width="2"/>',
};
const ic = (k, t = 24) => `<svg class="ic" width="${t}" height="${t}" viewBox="0 0 24 24" aria-hidden="true">${ICONES[k]}</svg>`;
const numBR = n => n >= 1e6 ? `${(n / 1e6).toLocaleString('pt-BR', {maximumFractionDigits: 1})} milhões` : n >= 1e4 ? `${(n / 1e3).toLocaleString('pt-BR', {maximumFractionDigits: 1})} mil` : n.toLocaleString('pt-BR');
function avisoConquistas(){
  Estado.novas().forEach((c, i) => setTimeout(() => {
    const a = document.createElement('div'); a.className = 'conq-aviso'; a.setAttribute('role', 'status');
    a.innerHTML = `<span class="conq-ic">${ic(c.ic, 30)}</span><div><small>Conquista nova</small><b>${c.nome}</b></div>`;
    document.body.appendChild(a); setTimeout(() => a.classList.add('sai'), 3200); setTimeout(() => a.remove(), 3700);
  }, i * 900));
}
