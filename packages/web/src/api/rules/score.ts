import { z } from "zod";

export const SKINS_COMPETITIVAS = [
  "classica", "esportiva", "praiana", "escolar", "shopping", "neon", "polaroid",
] as const;

export interface ResultadoCorrida {
  score: number;
  distance: number;
  coins: number;
  specials: number;
}

export function pontuacaoMaxima(r: ResultadoCorrida): number {
  const bonusCoracoes = 50 * (1 + Math.floor(r.distance / 1000));
  return 4 * (r.distance + 1) + 10 * r.coins + 800 * r.specials + bonusCoracoes;
}

export function erroDePlausibilidade(r: ResultadoCorrida): string | null {
  const valores = [r.score, r.distance, r.coins, r.specials];
  if (valores.some((n) => !Number.isSafeInteger(n) || n < 0)) return "Valores inválidos.";
  if (r.specials > 1 || (r.specials > 0 && r.distance < 700)) {
    return "Itens especiais incompatíveis com a distância.";
  }
  if (r.coins > 8 * r.distance + 80) return "Moedas incompatíveis com a distância.";
  if (r.score < r.distance) return "Pontuação menor que a distância percorrida.";
  if (r.score > pontuacaoMaxima(r)) return "Pontuação incompatível com os itens e a distância.";
  return null;
}

export const resultadoSchema = z.object({
  score: z.number().int().min(0).max(10_000_000),
  distance: z.number().int().min(0).max(1_000_000),
  coins: z.number().int().min(0).max(8_000_080),
  specials: z.number().int().min(0).max(1),
  skin: z.enum(SKINS_COMPETITIVAS).default("classica"),
}).superRefine((r, ctx) => {
  const erro = erroDePlausibilidade(r);
  if (erro) ctx.addIssue({ code: "custom", message: erro });
});

export function nomeNoPlacar(nome: string, id: number): string {
  const semControle = [...nome].filter((c) => {
    const code = c.codePointAt(0) ?? 0;
    return code > 0x1f && code !== 0x7f;
  }).join("");
  const base = semControle.trim().slice(0, 24) || "Jogadora";
  return `${base} #${id}`;
}