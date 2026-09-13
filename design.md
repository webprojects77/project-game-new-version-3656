# Luiza Run Surfs — direção de design (v2, tudo 3D)

Endless runner 3D em 3 faixas, jogável no PC e no celular pelo navegador. Só plataforma web
(Bun + Vite + React + Hono + Drizzle). Porta fixa em `__ports.cjs`.

## Regra número 1: nada de fotos

O jogo é **100% modelado em 3D low poly**. Não existe foto, sprite, billboard nem imagem de
personagem em nenhuma tela. Todo personagem (Luiza, policial, cachorro) é geometria three.js
montada em código, e as miniaturas das skins na interface são SVG desenhado com as mesmas cores
do boneco 3D.

## Personagens (3D low poly)

- **Luiza** — `Humanoid` (`game/characters.ts`): cabeça, cabelo, tronco, braços e pernas em caixas
  com pivôs próprios. Poses `run`, `jump`, `slide`, `hit` animadas por tempo e velocidade.
- **Policial** — mesmo `Humanoid` com paleta azul-escura, boné e giroflex piscando.
- **Cachorro** — `Dog`: corpo, patas, cauda e orelhas; late correndo ao lado do policial.
- Skins mudam só a paleta do corpo (`BodyPalette`: pele, cabelo, blusa, blusa alt, calça, tênis,
  detalhe). Jogabilidade idêntica em todas.

## Paleta (specs visuais v2)

| Token | Cor | Uso |
| --- | --- | --- |
| `--lrs-bg` | `#1A1030` | fundo geral |
| `--lrs-pink` | `#FF2E7E` | ação principal, Luiza, épico |
| `--lrs-cyan` | `#29D9FF` | destaques, raro, títulos secundários |
| `--lrs-gold` | `#FFC93C` | pontos, moedas, combo, especial |
| `--lrs-lime` | `#3CE87A` | vidas (corações **verdes**), confirmação |
| `--lrs-muted` | `#B8AFC9` | texto secundário, camada comum |
| `--lrs-locked` | `#4A4358` | silhueta de skin bloqueada |
| `--lrs-ink` | `#10061F` | contorno de tudo (borda 3px) |
| `--lrs-paper` | `#FFF6FB` | texto sobre cores fortes |

Tipografia: **Baloo 2** (display, títulos e números) + **Poppins** (corpo). Números sempre com
`font-variant-numeric: tabular-nums`.

Estilo de interface: cartões `lrs-panel` com borda grossa escura e sombra dura, botões `lrs-btn`
com deslocamento de 6px ao apertar. Animações: `lrs-rise`, `lrs-pop`, `lrs-drop` (avisos) e
`lrs-pulse` (combo).

## HUD durante a corrida

- **Superior esquerdo:** pontuação grande, distância + recorde abaixo e o **combo** em amarelo
  pulsando quando está acima de x1.
- **Topo central:** **barra de proximidade do policial** — verde longe, amarela no meio, vermelha
  colado — com ícone de boné e a velocidade em km/h.
- **Superior direito:** 3 **corações verdes**, botão de mudo rápido e botão de pausa.
- **Inferior esquerdo:** **power-up ativo** em barra circular (tempo restante do boost).
- **Inferior direito:** **moedas da corrida** e, quando houver, itens especiais.

## Itens

| Item | Efeito |
| --- | --- |
| 🪙 Moeda (cilindro dourado) | +10 pontos e +1 moeda para as skins |
| 💚 Coração verde | recupera 1 vida (máx. 3) |
| ⚡ Boost (raio laranja) | 5s invencível, velocidade e pontos em dobro |
| 📸 Item especial (moldura polaroid) | +100 pontos e libera a skin Polaroid |

**Combo:** coletar sem parar sobe o multiplicador até **x8** (a cada 6 coletas), multiplicando
pontos e moedas. Uma pausa longa entre coletas zera o combo.

## Economia e camadas de skins

Moedas coletadas viram saldo permanente (`lrs.coins.total`). Cada skin pertence a uma camada com
borda própria no seletor:

| Skin | Camada | Requisito |
| --- | --- | --- |
| Luiza Clássica | Padrão (cinza) | grátis |
| Luiza Esportiva | Comum (cinza) | 50.000 moedas |
| Luiza Escolar | Rara (ciano) | 150.000 moedas + recorde 20.000 |
| Luiza Neon | Épica (rosa) | 400.000 moedas + recorde 150.000 |
| Luiza Polaroid | Especial (dourada) | 3 itens especiais (não se compra) |

Card bloqueado aparece em silhueta `#4A4358` com cadeado e a lista de requisitos, marcando ✓ no
que já foi cumprido.

## Telas

- **Apelido** (primeira vez) → **Menu** com engrenagem de configurações, saldo de moedas e recorde.
- **Personagens:** grade de 3 colunas no celular e 4–5 no PC, saldo no topo.
- **Ranking:** abas **Neste aparelho** (últimas corridas locais com a skin usada) e **Global**
  (melhor recorde por apelido, com a skin e destaque na linha do jogador).
- **Configurações:** volume de música e de efeitos separados, mudo, botões na tela, sensibilidade
  do swipe, vibração, reduzir efeitos e restaurar progresso (com confirmação).
- **Pausa** e **Game Over** (pontos, distância, moedas da corrida, combo máximo, especiais, novo
  saldo do cofrinho e status do envio ao ranking).
- **Notificações:** cartão que desce do topo por ~2,5s para recorde, combo, item especial e troca
  de fase.

## Fases

O cenário troca a cada 750 m — Bairro (manhã) → Escola (meio-dia) → Centro (fim de tarde) → Praça
(noite) — anunciado por um portal neon com faixa de pedestre gigante.

## Áudio

Trilha chiptune original em loop (acelera junto com o jogo) e efeitos com pool de 3 vozes. Volumes
de música e efeitos independentes, salvos no aparelho.

## Acessibilidade e desempenho

Contraste alto com contorno escuro em todo texto sobre o jogo; alvos de toque ≥ 44px; opção de
reduzir efeitos (sem tremida de câmera); fallback amigável em texto quando o navegador não tem
WebGL.
