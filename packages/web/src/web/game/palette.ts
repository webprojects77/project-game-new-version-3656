export const PALETTE = {
  bg: "#1A1030",
  pink: "#FF2E7E",
  cyan: "#29D9FF",
  gold: "#FFC93C",
  lime: "#3CE87A",
  paper: "#FFFFFF",
  muted: "#B8AFC9",
  locked: "#4A4358",
  ink: "#10061F",
  orange: "#FF7A1F",
} as const;

export function darken(hex: string, amount = 0.35) {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - amount)));
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - amount)));
  const b = Math.max(0, Math.round((n & 255) * (1 - amount)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
