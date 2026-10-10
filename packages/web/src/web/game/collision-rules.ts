import type { ObstacleType } from "./spawn";

export const COLISAO = {
  baixoAlturaPes: 0.85,
  altoLimiteCabeca: 1.6,
  faixaTolerancia: 1.1,
  itemProfundidade: 1.3,
  itemFaixaTolerancia: 1.2,
  itemAlturaTolerancia: 1.5,
} as const;

/** Rampa é tratada como plataforma pelo motor antes desta checagem. */
export function bateNoObstaculo(type: ObstacleType, pes: number, cabeca: number, topo: number): boolean {
  if (type === "low") return pes < COLISAO.baixoAlturaPes;
  if (type === "high") return cabeca > COLISAO.altoLimiteCabeca;
  return pes < topo;
}