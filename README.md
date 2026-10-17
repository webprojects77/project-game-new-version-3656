# Luiza Run Surfs

## English

A 3D endless runner for the browser (desktop and mobile). Run through three lanes in six stages (neighborhood, school, downtown, square, beach and mall), dodge obstacles while a police officer and a dog chase you, collect coins, hearts and power-ups, complete daily missions, unlock skins and compete on a global leaderboard with Google sign-in.

This repository is an open-source archive of the project, built with Bun, Vite, React, Three.js, Hono, oRPC, Drizzle (libSQL / Turso) and Better Auth. Design notes are in [`design.md`](design.md) (Portuguese).

**Structure**

- `packages/web` — the game, its web interface and its API.
- `packages/mobile` — Expo (React Native) client scaffold.
- `packages/desktop` — Electron shell around the web app.

**Running**

```bash
bun install
cp .env.template .env
bun run dev
```

Fill in the values in `.env` first. Other commands: `bun run test`, `bun run typecheck`, `bun run build:web`.

## Português

Um endless runner 3D para o navegador (computador e celular). Corra por três faixas em seis fases (bairro, escola, centro, praça, praia e shopping), desvie de obstáculos enquanto um policial e um cachorro perseguem você, colete moedas, corações e power-ups, complete missões diárias, desbloqueie skins e dispute o placar global com login do Google.

Este repositório é um arquivo open source do projeto, feito com Bun, Vite, React, Three.js, Hono, oRPC, Drizzle (libSQL / Turso) e Better Auth. As notas de design estão em [`design.md`](design.md) (em português).

**Estrutura**

- `packages/web` — o jogo, a interface web e a API.
- `packages/mobile` — esqueleto de cliente Expo (React Native).
- `packages/desktop` — casca em Electron em volta do app web.

**Como rodar**

```bash
bun install
cp .env.template .env
bun run dev
```

Preencha os valores do `.env` antes. Outros comandos: `bun run test`, `bun run typecheck`, `bun run build:web`.

---

Made by **777** · Feito por **777** · Discord: `777.imt`
