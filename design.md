# Luiza Run Surfs — direção de design (v3, 3D e contas)

Endless runner 3D em 3 faixas, jogável no PC e no celular pelo navegador. Só plataforma web
(Bun + Vite + React + Hono + Drizzle). Porta fixa em `__ports.cjs`.

## Regra número 1: nada de fotos

O jogo é **modelado em 3D low poly**, com modelos GLB otimizados para obstáculos e cenário.
Não existem sprites ou billboards de personagens no mundo. Fotos de contas Google são permitidas
somente na interface do placar e no indicador de login. Todo personagem (Luiza, policial, cachorro) é geometria three.js
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
| 💚 Coração verde | recupera 1 vida (máx. 3); raro, intervalo de pelo menos 1.200 m entre spawns |
| ⚡ Boost (raio laranja) | 5s com velocidade x1,5 e pontos por distância x2; não protege de colisões |
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
| Luiza de Praia | Comum (cinza) | 90.000 moedas |
| Luiza Escolar | Rara (ciano) | 150.000 moedas + recorde 20.000 |
| Luiza do Shopping | Rara (ciano) | 250.000 moedas + recorde 60.000 |
| Luiza Neon | Épica (rosa) | 400.000 moedas + recorde 150.000 |
| Luiza Polaroid | Especial (dourada) | 3 itens especiais (não se compra) |
| Luiza Policial | Admin | conta administrativa local |
| Luiza Cachorro | Admin | conta administrativa local |

Card bloqueado aparece em silhueta `#4A4358` com cadeado e a lista de requisitos, marcando ✓ no
que já foi cumprido.

## Telas

- **Conta local** → abas Criar conta e Entrar, apelido e senha. Contas anteriores ficam salvas
  no mesmo aparelho; trocar de conta não apaga o progresso delas.
- **Menu** com engrenagem de configurações, saldo, recorde e entrada Google independente da conta local.
- **Personagens:** grade de 3 colunas no celular e 4–5 no PC, saldo no topo.
- **Ranking:** abas **Neste aparelho** (últimas corridas locais com a skin usada) e **Global**
  (melhor recorde por conta Google, com nome, identificador público da linha, avatar e skin).
  O destaque da própria linha depende da identidade autenticada, não de um apelido parecido.
- **Configurações:** volume de música e efeitos separados; mudo anima os sliders a zero e os bloqueia;
  organização dos botões (tamanho/altura/largura), vibração e reduzir efeitos.
  Restaurar conta abre Entrar e não apaga dados. Zerar progresso é outra ação, com confirmação e senha.
  Trocar apelido custa 20.000 moedas, de 4 a 8 letras/números sem espaços, uma vez por mês.
- **Pausa** e **Game Over** (pontos, distância, moedas da corrida, combo máximo, especiais, novo
  saldo do cofrinho e status do envio ao ranking).
- **Notificações:** cartão que desce do topo por ~2,5s para recorde, combo e item especial;
  não há aviso de troca de bioma.

## Fases

O cenário troca a cada **2.200 m**: Bairro → Escola → Centro → Praça → Praia → Shopping.
A velocidade inicial é 14 m/s e o teto é 48 m/s (antes do boost).
Rampa/escada funcionam como plataformas; carro e ônibus ocupam uma faixa fixa; o ônibus pode
ser superado com o duplo pulo ou impulso da rampa. Casas são alinhadas à calçada.

### Geração da pista

- `spawn.ts` planeja cada linha com RNG próprio (Mulberry32 com seed por partida).
- Nunca bloqueia as três faixas; moedas, corações e especiais caem numa faixa livre.
- No máximo 2 obstáculos do mesmo tipo e 2 padrões de faixas iguais seguidos.
- Em dificuldade baixa, obstáculo alto não é seguido de um baixo (troca de ação rápida demais).
- Power-ups usam outro RNG da mesma seed, só aparecem em faixa livre e não repetem o anterior.
- Partículas e cenário usam `visual-random.ts` (`Math.random`), separados dos sorteios da pista.
- Malhas ficam fora do motor: `biomes.ts`, `obstacle-meshes.ts`, `props.ts`; `engine3d.ts` cuida do loop.
- O painel admin mostra a seed e reinicia com ela. A seed reproduz os sorteios para a mesma
  sequência de distância, velocidade, vidas e cooldowns; não é replay completo da física nem anticheat.

## Placar, segurança e testes

- Só login Google permite enviar; o servidor deriva a identidade da sessão.
- Nomes iguais recebem identificadores diferentes: `Luiza #1`, `Luiza #2`.
- Validação básica confere pontuação versus distância, moedas e especiais, e recusa skins admin.
  Isso não comprova uma corrida real: um atacante autenticado ainda pode fabricar valores coerentes.
  Validação completa exige sessões de partida e replay verificado pelo servidor.
- Corridas da conta administrativa ficam no histórico local, fora do placar competitivo.
- A API bloqueia origens externas antes do CORS gerenciado, e Better Auth usa a mesma lista de origens.
  Origens permitidas: URL cadastrada, origem efetiva do servidor e extras explícitos em `API_ALLOWED_ORIGINS`.
- `bun run test` executa testes de placar, origens, contas, RNG com seed, regras de spawn, colisão e
  sorteio de power-ups, sem WebGL e sem tocar no banco real. `bun run lint` passa sem violações.
- Contas locais são conveniência do trabalho escolar: senhas e permissões admin no aparelho não
  são uma barreira contra quem controla o navegador. Não confundir com a autenticação Google do servidor.

## Áudio

Trilha chiptune original em loop (acelera junto com o jogo) e efeitos com pool de 3 vozes. Volumes
de música e efeitos independentes, salvos no aparelho.

## Acessibilidade e desempenho

Contraste alto com contorno escuro em todo texto sobre o jogo; alvos de toque ≥ 44px; opção de
reduzir efeitos (sem tremida de câmera); fallback amigável em texto quando o navegador não tem
WebGL.
