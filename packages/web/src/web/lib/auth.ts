import { createAuthClient } from "better-auth/react";
import { managedAuthClient } from "@runablehq/managed-auth/client";

// Login gerenciado da Runable: a conta Google entra sem o jogo guardar senha nenhuma.
const config = {
  applicationId: import.meta.env.VITE_APPLICATION_ID as string,
  issuer: import.meta.env.VITE_RUNABLE_AUTH_ISSUER as string,
};

export const authClient = createAuthClient({
  baseURL: window.location.origin,
  basePath: "/api/auth",
  plugins: [managedAuthClient(config)],
});
