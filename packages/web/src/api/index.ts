import type { RouterClient } from "@orpc/server";
import { createApp } from "./__core/app";
import { auth } from "./auth";
import { ping } from "./routes/ping";
import { scores } from "./routes/scores";
import { protegerOrigens } from "./security/origins";

export const router = {
  ping,
  scores,
};

export type AppRouter = typeof router;
/** Typed client for the router — used by the web and mobile api clients. */
export type AppRouterClient = RouterClient<AppRouter>;

const app = createApp(router);

// login com conta Google (Better Auth + login gerenciado da Runable)
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

export default protegerOrigens(app);
