import { Hono } from "hono";

/** URL deve ser uma origem HTTP(S) completa, nunca um wildcard ou sufixo. */
function origemDaUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.origin : null;
  } catch {
    return null;
  }
}

/** Inclui a URL cadastrada, o host efetivo da requisição e extras explícitos. */
export function origensPermitidas(requestUrl?: string): string[] {
  // O proxy do preview termina o HTTPS e encaminha a requisição como HTTP.
  // Reconhece HTTPS somente do MESMO host efetivo, nunca um domínio wildcard.
  const effective = origemDaUrl(requestUrl);
  const secureEffective = effective?.startsWith("http://")
    ? effective.replace(/^http:/, "https:")
    : effective;
  const urls = [
    process.env.WEBSITE_URL,
    requestUrl,
    secureEffective ?? undefined,
    ...(process.env.API_ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()),
  ];
  return [...new Set(urls.map(origemDaUrl).filter((o): o is string => o !== null))];
}

export function origemPermitida(origin: string | null, allowed: string[]): boolean {
  // Ferramentas locais e chamadas servidor-servidor não precisam enviar Origin.
  // Isso não substitui a autenticação dos procedimentos protegidos.
  return origin === null || allowed.includes(origin);
}

/**
 * Camada externa de proteção: roda ANTES do CORS do template.
 * Não altera __core/app.ts nem reflete origens arbitrárias.
 */
export function protegerOrigens(inner: Hono): Hono {
  const outer = new Hono();
  outer.use("/api/*", async (c, next) => {
    const origin = c.req.header("Origin") ?? null;
    if (!origemPermitida(origin, origensPermitidas(c.req.url))) {
      return c.json({ message: "Origem não permitida." }, 403);
    }
    await next();
    // Sem Origin, não há motivo para emitir '*' com credenciais.
    if (origin === null) {
      c.res.headers.delete("Access-Control-Allow-Origin");
      c.res.headers.delete("Access-Control-Allow-Credentials");
    }
  });
  outer.route("/", inner);
  return outer;
}