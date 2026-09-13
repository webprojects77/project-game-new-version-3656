/**
 * Missões diárias — 3 por dia, sorteadas a partir da data (todo mundo que
 * joga no mesmo dia pega as mesmas). Recompensa de 5.000 a 15.000 moedas,
 * creditada automaticamente no cofrinho quando a missão fecha.
 *
 * O progresso vive no localStorage e zera sozinho quando vira o dia.
 */

export const MISSIONS_KEY = "lrs.missions";

/** "acumula" soma o resultado de todas as corridas do dia;
 *  "melhor" olha só a melhor corrida isolada. */
export type MissionMode = "acumula" | "melhor";

export type MissionKind = "moedas" | "distancia" | "pontos" | "combo" | "especiais" | "corridas";

export interface Mission {
  id: string;
  kind: MissionKind;
  mode: MissionMode;
  icone: string;
  texto: string;
  alvo: number;
  recompensa: number;
}

export interface MissionProgress {
  /** data (YYYY-MM-DD) das missões guardadas */
  dia: string;
  /** progresso atual por id de missão */
  feito: Record<string, number>;
  /** ids das missões já pagas */
  pagas: string[];
}

/** Resultado de uma corrida, na medida que as missões precisam. */
export interface RunSummary {
  score: number;
  distance: number;
  coins: number;
  specials: number;
  combo: number;
}

interface Modelo {
  kind: MissionKind;
  mode: MissionMode;
  icone: string;
  /** texto com {alvo} trocado pelo número já formatado */
  texto: string;
  alvos: number[];
  recompensa: number;
}

const MODELOS: Modelo[] = [
  {
    kind: "moedas",
    mode: "acumula",
    icone: "🪙",
    texto: "Junte {alvo} moedas hoje",
    alvos: [300, 500, 800],
    recompensa: 8_000,
  },
  {
    kind: "distancia",
    mode: "acumula",
    icone: "🏃‍♀️",
    texto: "Corra {alvo} m somando as partidas de hoje",
    alvos: [3_000, 5_000, 8_000],
    recompensa: 10_000,
  },
  {
    kind: "pontos",
    mode: "melhor",
    icone: "⭐",
    texto: "Faça {alvo} pontos em uma só partida",
    alvos: [15_000, 30_000, 60_000],
    recompensa: 15_000,
  },
  {
    kind: "combo",
    mode: "melhor",
    icone: "🔥",
    texto: "Chegue no combo x{alvo}",
    alvos: [4, 6, 8],
    recompensa: 7_000,
  },
  {
    kind: "especiais",
    mode: "acumula",
    icone: "📸",
    texto: "Pegue {alvo} item(ns) especial(is)",
    alvos: [1, 2, 3],
    recompensa: 12_000,
  },
  {
    kind: "corridas",
    mode: "acumula",
    icone: "🎮",
    texto: "Jogue {alvo} partidas hoje",
    alvos: [3, 5, 8],
    recompensa: 5_000,
  },
];

/** Data local no formato YYYY-MM-DD (o dia vira à meia-noite do aparelho). */
export function hoje(d = new Date()): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Gerador pseudoaleatório simples e estável a partir de uma string. */
function semente(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/** As 3 missões do dia — sempre as mesmas para a mesma data. */
export function missoesDoDia(dia = hoje()): Mission[] {
  const rand = semente(dia);
  const pool = [...MODELOS];
  const out: Mission[] = [];
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = Math.floor(rand() * pool.length);
    const m = pool.splice(idx, 1)[0];
    const alvo = m.alvos[Math.floor(rand() * m.alvos.length)];
    out.push({
      id: `${m.kind}-${alvo}`,
      kind: m.kind,
      mode: m.mode,
      icone: m.icone,
      texto: m.texto.replace("{alvo}", alvo.toLocaleString("pt-BR")),
      alvo,
      recompensa: m.recompensa,
    });
  }
  return out;
}

export function progressoVazio(dia = hoje()): MissionProgress {
  return { dia, feito: {}, pagas: [] };
}

export function carregarProgresso(): MissionProgress {
  const dia = hoje();
  try {
    const raw = localStorage.getItem(MISSIONS_KEY);
    if (!raw) return progressoVazio(dia);
    const p = JSON.parse(raw) as MissionProgress;
    if (p.dia !== dia) return progressoVazio(dia);
    return { dia, feito: p.feito ?? {}, pagas: p.pagas ?? [] };
  } catch {
    return progressoVazio(dia);
  }
}

export function salvarProgresso(p: MissionProgress) {
  try {
    localStorage.setItem(MISSIONS_KEY, JSON.stringify(p));
  } catch {
    /* localStorage cheio ou bloqueado: missões só não persistem */
  }
}

function valorDaCorrida(kind: MissionKind, run: RunSummary): number {
  switch (kind) {
    case "moedas":
      return run.coins;
    case "distancia":
      return run.distance;
    case "pontos":
      return run.score;
    case "combo":
      return run.combo;
    case "especiais":
      return run.specials;
    case "corridas":
      return 1;
  }
}

export interface MissionUpdate {
  progresso: MissionProgress;
  /** missões que fecharam agora nesta corrida */
  concluidas: Mission[];
  /** moedas a creditar no cofrinho */
  recompensa: number;
}

/** Aplica o resultado de uma corrida no progresso do dia. */
export function aplicarCorrida(
  missoes: Mission[],
  atual: MissionProgress,
  run: RunSummary,
): MissionUpdate {
  const p: MissionProgress = { dia: hoje(), feito: { ...atual.feito }, pagas: [...atual.pagas] };
  const concluidas: Mission[] = [];
  let recompensa = 0;

  for (const m of missoes) {
    const antes = p.feito[m.id] ?? 0;
    const valor = valorDaCorrida(m.kind, run);
    const depois = m.mode === "acumula" ? antes + valor : Math.max(antes, valor);
    p.feito[m.id] = Math.min(depois, m.alvo);
    if (depois >= m.alvo && !p.pagas.includes(m.id)) {
      p.pagas.push(m.id);
      concluidas.push(m);
      recompensa += m.recompensa;
    }
  }
  return { progresso: p, concluidas, recompensa };
}

export function estaConcluida(m: Mission, p: MissionProgress) {
  return p.pagas.includes(m.id) || (p.feito[m.id] ?? 0) >= m.alvo;
}
