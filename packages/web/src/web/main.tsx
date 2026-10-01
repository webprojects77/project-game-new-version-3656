// Entry point referenced by index.html — composition only, real bootstrap
// lives in __main.tsx (template-managed).
import { authClient } from "./lib/auth";

// Termina o login da conta Google quando a página volta do Google,
// antes de montar o jogo — assim a sessão já está pronta no primeiro quadro.
await authClient.managedAuth.handleRedirect();

await import("./__main");
