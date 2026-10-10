import { describe, expect, test } from "bun:test";
import { novaSeed, Sorteio } from "../src/web/game/random";

const amostra = (seed: number, n = 50) => {
  const r = new Sorteio(seed);
  return Array.from({ length: n }, r.proximo);
};

describe("Sorteio com seed", () => {
  test("mesma seed repete a sequência; seeds diferentes divergem", () => {
    expect(amostra(42)).toEqual(amostra(42));
    expect(amostra(42)).not.toEqual(amostra(43));
  });

  test("valores ficam em [0, 1) mesmo depois de muitas chamadas", () => {
    const r = new Sorteio(0xffffffff);
    for (let i = 0; i < 200_000; i++) {
      const v = r.proximo();
      if (!(v >= 0 && v < 1)) throw new Error(`fora do intervalo: ${v}`);
    }
    expect(r.entre(5, 7)).toBeGreaterThanOrEqual(5);
  });

  test("seed é normalizada para uint32", () => {
    expect(amostra(-1)).toEqual(amostra(0xffffffff));
  });

  test("lista vazia é erro explícito e embaralhar mantém os elementos", () => {
    const r = new Sorteio(7);
    expect(() => r.escolher([])).toThrow();
    const original = [0, 1, 2, 3, 4];
    const mistura = r.embaralhar(original);
    expect([...mistura].sort()).toEqual(original);
    expect(original).toEqual([0, 1, 2, 3, 4]);
  });

  test("novaSeed devolve inteiro sem sinal", () => {
    const s = novaSeed();
    expect(Number.isInteger(s) && s >= 0 && s <= 0xffffffff).toBe(true);
  });
});
