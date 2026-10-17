import { Hono } from "hono";
import { cors } from "hono/cors";
import { os, type Router } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";

export interface RpcContext {
  headers: Headers;
}

export const base = os.$context<RpcContext>();

export function createApp(router: Router<Record<never, never>, RpcContext>) {
  const app = new Hono().use(
    cors({
      origin: (origin) => origin ?? "*",
      credentials: true,
      exposeHeaders: ["set-auth-token"],
    }),
  );

  app.get("/api/health", (c) => c.json({ status: "ok" }, 200));

  const handler = new RPCHandler(router);
  app.use("/api/rpc/*", async (c, next) => {
    const { matched, response } = await handler.handle(c.req.raw, {
      prefix: "/api/rpc",
      context: { headers: c.req.raw.headers },
    });
    if (matched) return c.newResponse(response.body, response);
    await next();
  });

  return app;
}
