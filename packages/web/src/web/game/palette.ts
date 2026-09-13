/**
 * Paleta única do jogo (specs visuais v2).
 *
 * A paleta de INTERFACE é fixa em todas as telas e é separada das paletas de
 * cada área/bioma, que ficam no motor 3D — a UI precisa se destacar do cenário
 * em qualquer fase.
 */
export const PALETTE = {
  /** fundo geral / painéis escuros */
  bg: "#1A1030",
  /** destaque primário: botão principal, título */
  pink: "#FF2E7E",
  /** destaque secundário: subtítulo, elementos frios */
  cyan: "#29D9FF",
  /** alerta / moeda dourada */
  gold: "#FFC93C",
  /** sucesso / vida / cura */
  lime: "#3CE87A",
  /** texto principal */
  paper: "#FFFFFF",
  /** texto secundário / desabilitado */
  muted: "#B8AFC9",
  /** bloqueado / indisponível */
  locked: "#4A4358",
  /** contorno grosso estilo cartoon */
  ink: "#10061F",
  orange: "#FF7A1F",
} as const;

/** Contorno mais escuro da própria cor de preenchimento (regra de contorno da UI). */
export function darken(hex: string, amount = 0.35) {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - amount)));
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - amount)));
  const b = Math.max(0, Math.round((n & 255) * (1 - amount)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
