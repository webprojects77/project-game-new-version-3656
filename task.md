# Luiza Run Surfs — terminar TUDO do GDD/specs visuais

Doc: /home/user/Attachments/luiza_run_surfs_specs_visuais_lEU1uP.md

## Fase 1 — motor (COMPLETA, tsc 0 erros)
- [x] powerups.ts (8 power-ups), items.ts (gravação temática), 6 áreas (+Praia +Shopping)
- [x] HudState powers/shield/chance/area/areaName; Item power/fly/x
- [x] contagem regressiva, timers, x2, fuga, ímã, crossfade de área, recorde
- [x] spawnPower/aplicarPower, colisões (ride, fantasma, escudo estala), duplo pulo
- [x] segunda chance no hit(), pushHud, obstáculos e props exclusivos por área
- [x] updateVisuals: bolha, fantasma translúcido, rastro do turbo, fly dos itens

## Fase 2 — áudio (COMPLETA)
- [x] audio.ts: 2 decks + playTrack(area) com crossfade 1,5 s, 6 trilhas
- [x] 15 SFX novos gerados em packages/web/public/audio/

## Fase 3 — UI (em andamento)
- [x] skins.ts: Luiza de Praia (comum) + Luiza do Shopping (rara)
- [x] HUD: power-ups ativos, escudo, slot Segunda Chance, coração quebrando, nome da área
- [x] styles.css: lrs-heart-break + lrs-coin-fly
- [x] missions.ts: 3 missões diárias sorteadas pela data, 5k-15k moedas, reset por dia
- [x] SkinPicker: preview grande + Selecionar, borda ciano/rosa, seta voltar
- [x] Settings: seção Conta (apelido + salvar) + versão do jogo
- [x] Ranking: estado vazio ilustrado + linha própria dourada com brilho
- [x] GameOver: animação das moedas entrando no cofrinho
- [x] Overlay de Missões diárias + botão no menu
- [x] game-shell: sons de UI (clique/abrirtela/erro/desbloqueio), wiring das missões, apelido

## Bugs do usuário (CORRIGIDOS)
- [x] policial e cachorro só aparecem quando há dano (chamarPolicial + visible=perseguindo)
- [x] Luiza corria de costas: rotation.y = Math.PI (policial idem), cachorro já ok

## Fase 4 — fechamento
- [ ] design.md, apagar task.md + music.mp3 antigo
- [ ] tsc --noEmit, bun run build, screenshot Playwright (/tmp/shotv2.py)
- [ ] contar linhas, deliver (website, porta 4200), mensagem PT-BR
