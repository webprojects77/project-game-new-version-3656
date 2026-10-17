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
export type AppRouterClient = RouterClient<AppRouter>;

const app = createApp(router);

app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

export default protegerOrigens(app);
