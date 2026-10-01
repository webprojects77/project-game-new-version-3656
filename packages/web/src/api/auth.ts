import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { runableManagedAuth } from "@runablehq/managed-auth/server";
import { db } from "./database";

/**
 * Login do Luiza Run Surfs.
 * Só existe UMA forma de entrar: conta Google (login gerenciado da Runable).
 * Sem conta Google o jogo roda em modo convidado e o resultado NÃO vai para o placar.
 */
export const auth = betterAuth({
  basePath: "/api/auth",
  baseURL: process.env.WEBSITE_URL,
  database: drizzleAdapter(db, { provider: "sqlite" }),
  emailAndPassword: { enabled: false },
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: (request) => {
    const origin = request?.headers.get("origin");
    return origin ? [origin] : ["*"];
  },
  plugins: [
    ...runableManagedAuth({
      applicationId: process.env.APPLICATION_ID!,
      issuer: process.env.VITE_RUNABLE_AUTH_ISSUER!,
    }),
  ],
});
