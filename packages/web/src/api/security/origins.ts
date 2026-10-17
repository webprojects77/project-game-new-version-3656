import { Hono } from "hono";

function origemDaUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.origin : null;
  } catch {
    return null;
  }
}

export function origensPermitidas(requestUrl?: string): string[] {
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
  return origin === null || allowed.includes(origin);
}

export function protegerOrigens(inner: Hono): Hono {
  const outer = new Hono();
  outer.use("/api/*", async (c, next) => {
    const origin = c.req.header("Origin") ?? null;
    if (!origemPermitida(origin, origensPermitidas(c.req.url))) {
      return c.json({ message: "Origem não permitida." }, 403);
    }
    await next();
    if (origin === null) {
      c.res.headers.delete("Access-Control-Allow-Origin");
      c.res.headers.delete("Access-Control-Allow-Credentials");
    }
  });
  outer.route("/", inner);
  return outer;
}