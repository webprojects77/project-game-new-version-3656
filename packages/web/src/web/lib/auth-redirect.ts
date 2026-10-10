import { authClient } from "./auth";

// Termina o login Google quando a página volta do Google. Como este módulo usa
// top-level await, quem o importa (app.tsx) só monta depois — a sessão já está
// pronta no primeiro quadro.
await authClient.managedAuth.handleRedirect();
