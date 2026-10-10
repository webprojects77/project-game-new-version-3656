import { describe, expect, test } from "bun:test";
import { erroDePlausibilidade, nomeNoPlacar, pontuacaoMaxima, resultadoSchema } from "../src/api/rules/score";

const corrida = { score: 277, distance: 227, coins: 5, specials: 0, skin: "classica" };

describe("placar competitivo", () => {
  test("aceita resultado normal observado no navegador", () => {
    expect(resultadoSchema.safeParse(corrida).success).toBe(true);
  });
  test("aceita distância com boost e x2 simultâneos", () => {
    expect(erroDePlausibilidade({ score: 5000, distance: 1000, coins: 20, specials: 1 })).toBeNull();
  });
  test("limite permite os bônus legítimos máximos", () => {
    const r = { score: 0, distance: 2400, coins: 200, specials: 1 };
    expect(erroDePlausibilidade({ ...r, score: pontuacaoMaxima(r) })).toBeNull();
  });
  test("recusa milhões de pontos numa corrida curta", () => {
    expect(resultadoSchema.safeParse({ ...corrida, score: 9_999_999 }).success).toBe(false);
  });
  test("recusa moedas demais", () => {
    expect(resultadoSchema.safeParse({ ...corrida, coins: 10_000 }).success).toBe(false);
  });
  test("recusa especial antes de 700 metros", () => {
    expect(resultadoSchema.safeParse({ ...corrida, specials: 1 }).success).toBe(false);
  });
  test("recusa múltiplos especiais", () => {
    expect(resultadoSchema.safeParse({ ...corrida, distance: 1000, score: 1500, specials: 2 }).success).toBe(false);
  });
  test("recusa pontos menores que a distância", () => {
    expect(resultadoSchema.safeParse({ ...corrida, score: 100 }).success).toBe(false);
  });
  test("recusa negativos, frações, NaN e infinito", () => {
    for (const score of [-1, 1.5, NaN, Infinity]) {
      expect(resultadoSchema.safeParse({ ...corrida, score }).success).toBe(false);
    }
  });
  test("recusa skins administrativas ou desconhecidas", () => {
    for (const skin of ["policial", "cachorro", "falsa"]) {
      expect(resultadoSchema.safeParse({ ...corrida, skin }).success).toBe(false);
    }
  });
  test("contas com nomes iguais recebem identificadores distintos", () => {
    expect(nomeNoPlacar("Luiza", 1)).toBe("Luiza #1");
    expect(nomeNoPlacar("Luiza", 2)).toBe("Luiza #2");
  });
  test("nome vazio recebe fallback sem expor email", () => {
    expect(nomeNoPlacar("\n", 3)).toBe("Jogadora #3");
  });
});