import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { origemPermitida, protegerOrigens } from "../src/api/security/origins";

const site = "https://jogo.example";
const inner = new Hono();
inner.use(cors({ origin: (o) => o, credentials: true }));
inner.get("/api/health", (c) => c.json({ ok: true }));
const app = protegerOrigens(inner);

describe("proteção de origens antes do CORS gerenciado", () => {
  test("aceita origem exata", () => expect(origemPermitida(site, [site])).toBe(true));
  test("não aceita prefixo ou domínio parecido", () => {
    expect(origemPermitida(`${site}.malicioso.test`, [site])).toBe(false);
    expect(origemPermitida("null", [site])).toBe(false);
  });
  test("bloqueia requisição de origem externa", async () => {
    const res = await app.request(`${site}/api/health`, { headers: { origin: "https://malicioso.test" } });
    expect(res.status).toBe(403);
    expect(res.headers.has("access-control-allow-origin")).toBe(false);
  });
  test("bloqueia preflight externo antes do handler", async () => {
    const res = await app.request(`${site}/api/health`, {
      method: "OPTIONS", headers: { origin: "https://malicioso.test", "access-control-request-method": "POST" },
    });
    expect(res.status).toBe(403);
  });
  test("permite mesmo site com cabeçalhos CORS corretos", async () => {
    const res = await app.request(`${site}/api/health`, { headers: { origin: site } });
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe(site);
  });
  test("permite HTTPS do mesmo host após terminação TLS no proxy", async () => {
    const res = await app.request("http://preview.example/api/health", {
      headers: { origin: "https://preview.example" },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe("https://preview.example");
  });
  test("sem Origin não devolve wildcard com credenciais", async () => {
    const res = await app.request(`${site}/api/health`);
    expect(res.status).toBe(200);
    expect(res.headers.has("access-control-allow-origin")).toBe(false);
    expect(res.headers.has("access-control-allow-credentials")).toBe(false);
  });
});