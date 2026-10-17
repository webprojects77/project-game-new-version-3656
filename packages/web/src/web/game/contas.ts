import { MISSIONS_KEY } from "./missions";

export const NAME_KEY = "lrs.name";
export const PASS_KEY = "lrs.pass";
export const ADMIN_KEY = "lrs.admin";
export const BEST_KEY = "lrs.best";
export const COINS_KEY = "lrs.coins.total";
export const SPECIALS_KEY = "lrs.specials";
export const RUNS_KEY = "lrs.local.runs";
export const SKIN_KEY = "lrs.skin";
export const NAME_AT_KEY = "lrs.name.lastChange";

const CONTAS_KEY = "lrs.contas";

const CHAVES_DA_CONTA = [
  NAME_KEY,
  PASS_KEY,
  ADMIN_KEY,
  BEST_KEY,
  COINS_KEY,
  SPECIALS_KEY,
  RUNS_KEY,
  SKIN_KEY,
  NAME_AT_KEY,
  MISSIONS_KEY,
];

type Foto = Record<string, string>;

export function lerNumero(key: string, padrao = 0): number {
  const raw = localStorage.getItem(key);
  if (raw === null || raw.trim() === "") return padrao;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : padrao;
}

function lerContas(): Record<string, Foto> {
  try {
    const raw = localStorage.getItem(CONTAS_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    const contas: Record<string, Foto> = Object.create(null);
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return contas;
    for (const [nome, foto] of Object.entries(obj)) {
      if (!foto || typeof foto !== "object" || Array.isArray(foto)) continue;
      const validada: Foto = Object.create(null);
      for (const k of CHAVES_DA_CONTA) {
        const v = (foto as Record<string, unknown>)[k];
        if (typeof v === "string") validada[k] = v;
      }
      if (validada[NAME_KEY]) contas[nome] = validada;
    }
    return contas;
  } catch {
    return Object.create(null);
  }
}

function gravarContas(contas: Record<string, Foto>) {
  localStorage.setItem(CONTAS_KEY, JSON.stringify(contas));
}

const chave = (nome: string) => nome.trim().toLowerCase();

export function guardarContaAtiva() {
  const nome = localStorage.getItem(NAME_KEY);
  if (!nome) return;
  const foto: Foto = {};
  for (const k of CHAVES_DA_CONTA) {
    const v = localStorage.getItem(k);
    if (v !== null) foto[k] = v;
  }
  const contas = lerContas();
  contas[chave(nome)] = foto;
  gravarContas(contas);
}

export function nomesDasContas(): string[] {
  guardarContaAtiva();
  return Object.values(lerContas())
    .map((f) => f[NAME_KEY])
    .filter((n): n is string => !!n);
}

export function contaExiste(nome: string): boolean {
  if (chave(localStorage.getItem(NAME_KEY) ?? "") === chave(nome)) return true;
  return Object.prototype.hasOwnProperty.call(lerContas(), chave(nome));
}

export function senhaDaConta(nome: string): string | null {
  if (chave(localStorage.getItem(NAME_KEY) ?? "") === chave(nome)) {
    return localStorage.getItem(PASS_KEY);
  }
  return lerContas()[chave(nome)]?.[PASS_KEY] ?? null;
}

function limparAtiva() {
  for (const k of CHAVES_DA_CONTA) localStorage.removeItem(k);
}

export function ativarConta(nome: string): boolean {
  const foto = lerContas()[chave(nome)];
  if (!foto) return false;
  guardarContaAtiva();
  limparAtiva();
  for (const [k, v] of Object.entries(foto)) localStorage.setItem(k, v);
  return true;
}

export function novaConta(nome: string, senha: string, admin: boolean) {
  guardarContaAtiva();
  limparAtiva();
  localStorage.setItem(NAME_KEY, nome);
  localStorage.setItem(PASS_KEY, senha);
  localStorage.setItem(ADMIN_KEY, admin ? "1" : "0");
  guardarContaAtiva();
}

export function renomearContaAtiva(antigo: string, novo: string) {
  const contas = lerContas();
  delete contas[chave(antigo)];
  gravarContas(contas);
  localStorage.setItem(NAME_KEY, novo);
  guardarContaAtiva();
}
