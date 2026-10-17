import { Sorteio } from "./random";

export type ObstacleType = "low" | "high" | "block" | "ride";
export type ItemPlanejado = "coin" | "heart" | "boost" | "special";

export const SPAWN = {
  dificuldadeMetros: 2600,
  moedasAte: 0.74,
  coracaoAte: 0.765,
  boostAte: 0.785,
  coracaoIntervaloMetros: 1200,
  especialDepoisMetros: 700,
  moedaEspaco: 3.2,
  moedaAltura: 1.15,
  itemAltura: 1.35,
  especialAltura: 1.4,
  distanciaMinima: 13,
  reacaoBloco: 0.62,
  reacaoOutros: 0.78,
  recuperacaoMudanca: 0.34,
  recuperacaoIgual: 0.16,
  jitterMaximo: 0.22,
  powerIntervaloMinimo: 95,
  powerIntervaloMaximo: 140,
  powerNovaTentativa: 1,
  powerJanelaLivre: 24,
  maxRepeticoes: 2,
} as const;

export interface LinhaPlanejada {
  type: ObstacleType;
  lanes: number[];
  livre: number;
  item: ItemPlanejado;
  moedas: number;
  distanciaProxima: number;
}

export class PlanejadorPista {
  private ultimo: LinhaPlanejada | null = null;
  private repeticoesTipo = 0;
  private repeticoesFaixas = 0;
  private ultimoItem: ItemPlanejado | null = null;
  private rng: Sorteio;

  constructor(seed: number) {
    this.rng = new Sorteio(seed);
  }

  proxima(contexto: {
    distance: number;
    biome: number;
    speed: number;
    lives: number;
    heartCooldown: number;
    specialSpawned: boolean;
  }): LinhaPlanejada {
    const d = Math.min(1, contexto.distance / SPAWN.dificuldadeMetros);
    const tipos: ObstacleType[] = contexto.biome === 5
      ? ["low", "high", "block", "ride", "ride", "low"]
      : ["low", "high", "block", "low", "block", "ride"];
    const candidatos = tipos.filter((t) => {
      if (this.repeticoesTipo >= SPAWN.maxRepeticoes && t === this.ultimo?.type) return false;
      return !(d < 0.5 && this.ultimo?.type === "high" && t === "low");
    });
    const type = this.rng.escolher(candidatos);
    const blocked = this.rng.proximo() < 0.2 + d * 0.4 ? 2 : 1;
    let lanes = this.rng.embaralhar([0, 1, 2]).slice(0, blocked).sort();
    const mesmasFaixas = (a: number[], b: number[]) => a.join(",") === b.join(",");
    if (this.ultimo && mesmasFaixas(lanes, this.ultimo.lanes) && this.repeticoesFaixas >= SPAWN.maxRepeticoes) {
      lanes = lanes.map((l) => (l + 1) % 3).sort();
    }
    const livre = this.rng.escolher([0, 1, 2].filter((l) => !lanes.includes(l)));
    const roll = this.rng.proximo();
    let item: ItemPlanejado = "coin";
    if (roll >= SPAWN.moedasAte && roll < SPAWN.coracaoAte) {
      if (contexto.lives < 3 && contexto.heartCooldown <= 0) item = "heart";
    } else if (roll >= SPAWN.coracaoAte && roll < SPAWN.boostAte) {
      if (this.ultimoItem !== "boost") item = "boost";
    } else if (roll >= SPAWN.boostAte && !contexto.specialSpawned && contexto.distance > SPAWN.especialDepoisMetros) {
      item = "special";
    }
    const moedas = item === "coin" ? 3 + Math.floor(this.rng.proximo() * 3) : 0;
    const reaction = type === "block" ? SPAWN.reacaoBloco : SPAWN.reacaoOutros;
    const recovery = this.ultimo && this.ultimo.type !== type ? SPAWN.recuperacaoMudanca : SPAWN.recuperacaoIgual;
    const distanciaProxima = Math.max(SPAWN.distanciaMinima,
      contexto.speed * (reaction + recovery + this.rng.entre(0, SPAWN.jitterMaximo)));

    this.repeticoesTipo = this.ultimo?.type === type ? this.repeticoesTipo + 1 : 1;
    this.repeticoesFaixas = this.ultimo && mesmasFaixas(lanes, this.ultimo.lanes) ? this.repeticoesFaixas + 1 : 1;
    this.ultimoItem = item;
    this.ultimo = { type, lanes, livre, item, moedas, distanciaProxima };
    return this.ultimo;
  }
}