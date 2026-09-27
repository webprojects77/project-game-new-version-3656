# Luiza Run Surfs — lista de bugs/melhorias do PDF

## Bloco A — objetos 3D (engine + models.ts)
- [ ] rampa de trás pra frente → inverter
- [ ] ônibus: escala (comprimento estava no eixo X) + rotação; pulável com duplo pulo
- [ ] carro: escala + rotação; vem numa faixa fixa (tipo trem) e trava a troca de faixa
- [ ] casas do cenário: alinhadas e rente à calçada
- [ ] escada do shopping + rampa: plataforma que lança 2 blocos de altura
- [ ] remover DEBUG_TEMP do engine3d.ts

## Bloco B — dificuldade
- [ ] SPEED_MAX maior
- [ ] boost sem invencibilidade
- [ ] power-ups muito mais raros
- [ ] coração raro (cooldown de distância)

## Bloco C — biomas
- [ ] remover aviso de troca de cenário
- [ ] BIOME_LEN muito maior

## Bloco D — configurações
- [ ] nome: sem espaço, só letras/números, 4-8, 1x por mês, 20.000 moedas
- [ ] mudo: sliders animam até 0% e travam; voltam ao valor ao desativar
- [ ] controles: "Organizar botões" (tamanho + posição), remover sensibilidade do swipe
- [ ] senha na criação da conta + exigir para restaurar progresso
- [ ] Como jogar: remover seção "Fases"
- [ ] Personagens: remover balão de fala e a frase "Todas jogam igual..."

## Bloco E — conta admin (adm / 9764, 5x no Confirmar)
- [ ] login admin
- [ ] economia: moedas infinitas, multiplicador, tudo desbloqueado, resetar progresso
- [ ] partida: invencibilidade, spawnar obstáculo/power-up, velocidade manual, pular bioma
- [ ] debug: free cam, fly, noclip, teleporte, overlay FPS/hitbox/coordenadas, god mode
- [ ] skins exclusivas da admin (policial e cachorro)

## Fechamento
- [ ] tsc -p tsconfig.app.json --noEmit
- [ ] teste visual Playwright
- [ ] apagar task.md, build, contar linhas, deliver PT-BR
