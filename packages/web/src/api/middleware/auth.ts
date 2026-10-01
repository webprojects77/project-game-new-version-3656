import { ORPCError } from "@orpc/server";
import { base } from "../__core/app";
import { auth } from "../auth";

/** Login opcional: `context.user` é o usuário logado ou null. */
export const withUser = base.use(async ({ context, next }) => {
  const session = await auth.api.getSession({ headers: context.headers });
  return next({
    context: { user: session?.user ?? null, session: session?.session ?? null },
  });
});

/** Só para quem entrou com a conta Google — sem sessão, a chamada é recusada. */
export const authed = base.use(async ({ context, next }) => {
  const session = await auth.api.getSession({ headers: context.headers });
  if (!session) throw new ORPCError("UNAUTHORIZED");
  return next({ context: { user: session.user, session: session.session } });
});
