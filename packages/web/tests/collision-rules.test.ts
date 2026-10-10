import { describe, expect, test } from "bun:test";
import { bateNoObstaculo, COLISAO } from "../src/web/game/collision-rules";
import { POWERS, type PowerKind, sortearPower } from "../src/web/game/powerups";
import { Sorteio } from "../src/web/game/random";

describe("limites de colisão", () => {
  test("obstáculo baixo: pés abaixo do limite batem, no limite passam", () => {
    expect(bateNoObstaculo("low", COLISAO.baixoAlturaPes - 0.01, 2, 1)).toBe(true);
    expect(bateNoObstaculo("low", COLISAO.baixoAlturaPes, 2, 1)).toBe(false);
  });

  test("obstáculo alto: cabeça acima do limite bate, no limite passa (slide)", () => {
    expect(bateNoObstaculo("high", 0, COLISAO.altoLimiteCabeca + 0.01, 1)).toBe(true);
    expect(bateNoObstaculo("high", 0, COLISAO.altoLimiteCabeca, 1)).toBe(false);
  });

  test("bloco usa o topo do modelo", () => {
    expect(bateNoObstaculo("block", 2.99, 4, 3)).toBe(true);
    expect(bateNoObstaculo("block", 3, 4, 3)).toBe(false);
  });
});

describe("sorteio de power-ups", () => {
  test("nunca repete o anterior e é reproduzível pela seed", () => {
    const sequencia = (seed: number) => {
      const r = new Sorteio(seed);
      let anterior: PowerKind | undefined;
      return Array.from({ length: 500 }, () => (anterior = sortearPower(r.proximo, anterior)));
    };
    const a = sequencia(5);
    expect(a).toEqual(sequencia(5));
    for (let i = 1; i < a.length; i++) expect(a[i]).not.toBe(a[i - 1]);
    expect(new Set(a).size).toBe(Object.keys(POWERS).length);
  });

  test("extremos do gerador continuam válidos", () => {
    expect(POWERS[sortearPower(() => 0)]).toBeDefined();
    expect(POWERS[sortearPower(() => 0.999999, "chance")]).toBeDefined();
    expect(sortearPower(() => 0.999999, "chance")).not.toBe("chance");
  });
});
