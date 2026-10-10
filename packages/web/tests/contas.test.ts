import { beforeEach, describe, expect, test } from "bun:test";
import {
  ativarConta, contaExiste, guardarContaAtiva, lerNumero, nomesDasContas,
  novaConta, renomearContaAtiva, senhaDaConta,
} from "../src/web/game/contas";

beforeEach(() => {
  const dados = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key: string) => dados.get(key) ?? null,
    setItem: (key: string, value: string) => dados.set(key, String(value)),
    removeItem: (key: string) => dados.delete(key),
  } });
});

describe("contas locais sem perda de progresso", () => {
  test("criar e trocar preserva moedas e senha da conta anterior", () => {
    novaConta("luiza", "1234", false);
    localStorage.setItem("lrs.coins.total", "500");
    novaConta("adm", "9764", true);
    expect(ativarConta("luiza")).toBe(true);
    expect(lerNumero("lrs.coins.total")).toBe(500);
    expect(senhaDaConta("ADM")).toBe("9764");
    expect(nomesDasContas()).toEqual(["luiza", "adm"]);
  });
  test("migra conta antiga existente para a lista de contas", () => {
    localStorage.setItem("lrs.name", "ADM");
    localStorage.setItem("lrs.coins.total", "100000");
    guardarContaAtiva();
    novaConta("outra", "1234", false);
    expect(ativarConta("adm")).toBe(true);
    expect(lerNumero("lrs.coins.total")).toBe(100000);
  });
  test("renomear não duplica nem perde a conta", () => {
    novaConta("luiza", "1234", false);
    renomearContaAtiva("luiza", "luiza2");
    expect(contaExiste("luiza")).toBe(false);
    expect(contaExiste("luiza2")).toBe(true);
  });
  test("conta inexistente não modifica a ativa", () => {
    novaConta("luiza", "1234", false);
    expect(ativarConta("inexistente")).toBe(false);
    expect(localStorage.getItem("lrs.name")).toBe("luiza");
  });
  test("JSON corrompido, lista e entradas inválidas não quebram a tela", () => {
    for (const raw of ["{", "[]", '{"ruim":null}', '{"ruim":{"lrs.name":123}}']) {
      localStorage.setItem("lrs.contas", raw);
      expect(nomesDasContas()).toEqual([]);
    }
  });
  test("chaves do protótipo não parecem contas existentes", () => {
    expect(contaExiste("constructor")).toBe(false);
    expect(contaExiste("__proto__")).toBe(false);
  });
  test("números ausentes, vazios e corrompidos usam o padrão", () => {
    expect(lerNumero("ausente", 10)).toBe(10);
    for (const raw of ["", "  ", "NaN", "Infinity", "texto", "-1"]) {
      localStorage.setItem("teste", raw);
      expect(lerNumero("teste", 10)).toBe(10);
    }
    localStorage.setItem("teste", "0");
    expect(lerNumero("teste", 10)).toBe(0);
  });
});