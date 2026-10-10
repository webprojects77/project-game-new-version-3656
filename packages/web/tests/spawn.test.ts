import { describe, expect, test } from "bun:test";
import { type LinhaPlanejada, PlanejadorPista, SPAWN } from "../src/web/game/spawn";

/** Simula uma corrida só com as regras da pista, sem WebGL. */
function simular(seed: number, linhas: number, vidas = (i: number) => 1 + (i % 3)) {
  const p = new PlanejadorPista(seed);
  let distance = 0;
  let heartCooldown = 600;
  let specialSpawned = false;
  const out: { linha: LinhaPlanejada; distance: number; speed: number; lives: number; heartCooldown: number; specialSpawned: boolean }[] = [];
  for (let i = 0; i < linhas; i++) {
    const speed = Math.min(48, 14 + distance / 120);
    const lives = vidas(i);
    const ctx = { distance, biome: Math.floor(distance / 2200) % 6, speed, lives, heartCooldown, specialSpawned };
    const linha = p.proxima(ctx);
    out.push({ linha, ...ctx });
    if (linha.item === "heart") heartCooldown = SPAWN.coracaoIntervaloMetros;
    if (linha.item === "special") specialSpawned = true;
    distance += linha.distanciaProxima;
    heartCooldown -= linha.distanciaProxima;
  }
  return out;
}

const SEEDS = Array.from({ length: 40 }, (_, i) => (i * 2654435761) >>> 0);

describe("planejador de pista", () => {
  test("mesma seed e mesmo contexto geram a mesma pista", () => {
    expect(simular(1234, 300).map((r) => r.linha)).toEqual(simular(1234, 300).map((r) => r.linha));
    expect(simular(1234, 300).map((r) => r.linha)).not.toEqual(simular(4321, 300).map((r) => r.linha));
  });

  test("sempre sobra faixa livre e os itens caem nela", () => {
    for (const seed of SEEDS) {
      for (const { linha } of simular(seed, 800)) {
        expect(linha.lanes.length).toBeGreaterThanOrEqual(1);
        expect(linha.lanes.length).toBeLessThanOrEqual(2);
        expect(new Set(linha.lanes).size).toBe(linha.lanes.length);
        expect(linha.lanes).not.toContain(linha.livre);
        expect([0, 1, 2]).toContain(linha.livre);
      }
    }
  });

  test("no máximo duas repetições seguidas de tipo e de padrão de faixas", () => {
    for (const seed of SEEDS) {
      const linhas = simular(seed, 800).map((r) => r.linha);
      for (let i = 2; i < linhas.length; i++) {
        const [a, b, c] = [linhas[i - 2], linhas[i - 1], linhas[i]];
        expect(a.type === b.type && b.type === c.type).toBe(false);
        const f = (l: LinhaPlanejada) => l.lanes.join(",");
        expect(f(a) === f(b) && f(b) === f(c)).toBe(false);
      }
    }
  });

  test("com dificuldade baixa, alto nunca vem logo antes de baixo", () => {
    for (const seed of SEEDS) {
      const corrida = simular(seed, 400);
      for (let i = 1; i < corrida.length; i++) {
        const dificuldade = corrida[i].distance / SPAWN.dificuldadeMetros;
        if (dificuldade >= 0.5) break;
        expect(corrida[i - 1].linha.type === "high" && corrida[i].linha.type === "low").toBe(false);
      }
    }
  });

  test("espaço entre linhas respeita mínimo e tempo de reação", () => {
    for (const seed of SEEDS) {
      for (const { linha, speed } of simular(seed, 500)) {
        const reacao = linha.type === "block" ? SPAWN.reacaoBloco : SPAWN.reacaoOutros;
        const minimo = Math.max(SPAWN.distanciaMinima, speed * (reacao + SPAWN.recuperacaoIgual));
        const maximo = Math.max(SPAWN.distanciaMinima,
          speed * (reacao + SPAWN.recuperacaoMudanca + SPAWN.jitterMaximo));
        expect(linha.distanciaProxima).toBeGreaterThanOrEqual(minimo - 1e-9);
        expect(linha.distanciaProxima).toBeLessThanOrEqual(maximo + 1e-9);
      }
    }
  });

  test("especial só depois de 700 m e no máximo uma vez", () => {
    for (const seed of SEEDS) {
      const especiais = simular(seed, 800).filter((r) => r.linha.item === "special");
      expect(especiais.length).toBeLessThanOrEqual(1);
      for (const e of especiais) expect(e.distance).toBeGreaterThan(SPAWN.especialDepoisMetros);
    }
  });

  test("coração respeita vida cheia e cooldown", () => {
    let vistos = 0;
    for (const seed of SEEDS) {
      for (const r of simular(seed, 800)) {
        if (r.linha.item !== "heart") continue;
        vistos++;
        expect(r.lives).toBeLessThan(3);
        expect(r.heartCooldown).toBeLessThanOrEqual(0);
      }
      expect(simular(seed, 800, () => 3).some((r) => r.linha.item === "heart")).toBe(false);
    }
    expect(vistos).toBeGreaterThan(0);
  });

  test("boost não aparece duas linhas seguidas e moedas vêm em grupos de 3 a 5", () => {
    for (const seed of SEEDS) {
      const linhas = simular(seed, 800).map((r) => r.linha);
      for (let i = 1; i < linhas.length; i++) {
        expect(linhas[i - 1].item === "boost" && linhas[i].item === "boost").toBe(false);
      }
      for (const l of linhas) {
        if (l.item === "coin") expect(l.moedas >= 3 && l.moedas <= 5).toBe(true);
        else expect(l.moedas).toBe(0);
      }
    }
  });

  test("todos os tipos de obstáculo aparecem", () => {
    const tipos = new Set(simular(99, 400).map((r) => r.linha.type));
    expect([...tipos].sort()).toEqual(["block", "high", "low", "ride"]);
  });
});
