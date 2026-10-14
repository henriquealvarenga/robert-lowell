/**
 * Progresso da jornada e conquistas de APRENDIZADO, guardados em localStorage.
 * Sem pontos, vidas ou "game over": só marcos de leitura e exploração.
 */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // caractere/emoji simples
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'inicio', title: 'Começou a jornada', description: 'Abriu a experiência interativa.', icon: '◐' },
  { id: 'biografia', title: 'Conheceu o poeta', description: 'Leu a biografia de Robert Lowell.', icon: '✒' },
  { id: 'bipolaridade', title: 'Entendeu a bipolaridade', description: 'Leu o capítulo sobre a doença.', icon: '◑' },
  { id: 'primeira-internacao', title: 'Leu a primeira internação', description: 'Abriu a crise de abril de 1949, em Saratoga Springs.', icon: '①' },
  { id: 'crises', title: 'Percorreu as crises', description: 'Leu o capítulo completo das crises.', icon: '≋' },
  { id: 'todas-crises', title: 'Visitou as 11 crises', description: 'Abriu todas as crises na linha do tempo.', icon: '⑪' },
  { id: 'grafico', title: 'Explorou o gráfico', description: 'Comparou as internações antes e depois do lítio.', icon: '▥' },
  { id: 'litio', title: 'Descobriu o lítio', description: 'Leu o capítulo sobre a estabilidade.', icon: 'Li' },
  { id: 'ultimos-anos', title: 'Acompanhou os últimos anos', description: 'Leu o capítulo sobre a intoxicação e os últimos anos.', icon: '◒' },
  { id: 'familia', title: 'Conheceu a família Lowell', description: 'Explorou a árvore da história familiar.', icon: '⌂' },
  { id: 'conclusao', title: 'Chegou à conclusão', description: 'Leu a conclusão do caso.', icon: '◉' },
  { id: 'quiz', title: 'Reconheceu os sinais', description: 'Concluiu o quiz clínico.', icon: '✓' },
  { id: 'caso', title: 'Raciocinou o caso', description: 'Concluiu o caso clínico e comparou com a história.', icon: '⚕' },
];

const KEY = 'jornada-lowell:v1';

interface State {
  achievements: string[];
  crisesVistas: string[];
  updated: string;
}

function read(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Partial<State>;
      return { achievements: s.achievements ?? [], crisesVistas: s.crisesVistas ?? [], updated: s.updated ?? '' };
    }
  } catch {
    /* localStorage indisponível (modo privado, etc.) */
  }
  return { achievements: [], crisesVistas: [], updated: '' };
}

function write(s: State) {
  try {
    s.updated = new Date().toISOString();
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignora */
  }
  window.dispatchEvent(new CustomEvent('jornada:progress', { detail: snapshot(s) }));
}

export function snapshot(s: State = read()) {
  const total = ACHIEVEMENTS.length;
  const done = ACHIEVEMENTS.filter((a) => s.achievements.includes(a.id)).length;
  return { done, total, percent: Math.round((done / total) * 100), ids: [...s.achievements], crisesVistas: [...s.crisesVistas] };
}

export function has(id: string) {
  return read().achievements.includes(id);
}

/** Desbloqueia uma conquista; devolve true se era nova. */
export function unlock(id: string): boolean {
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  if (!a) return false;
  const s = read();
  if (s.achievements.includes(id)) return false;
  s.achievements.push(id);
  write(s);
  window.dispatchEvent(new CustomEvent('jornada:achievement', { detail: a }));
  return true;
}

export function markCrisisSeen(slug: string, totalCrises: number) {
  const s = read();
  if (!s.crisesVistas.includes(slug)) {
    s.crisesVistas.push(slug);
    write(s);
  }
  if (slug === '1949-04-saratoga-springs') unlock('primeira-internacao');
  if (s.crisesVistas.length >= totalCrises) unlock('todas-crises');
}

export function reset() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignora */
  }
  window.dispatchEvent(new CustomEvent('jornada:progress', { detail: snapshot() }));
}

/** Marca a conquista quando o leitor chega ao fim do elemento (rolagem). */
export function unlockOnReadEnd(el: Element, id: string) {
  if (has(id)) return;
  if (!('IntersectionObserver' in window)) {
    unlock(id);
    return;
  }
  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  el.appendChild(sentinel);
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        unlock(id);
        io.disconnect();
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );
  io.observe(sentinel);
}
