# ReelCover

Capa de reel 1080×1920 nos dois modos.

- **Modo Foto** (yap de `jornada`, `humor`, `mentalidade`): foto ou frame real em tela cheia, chip no topo e título `ig-display` em `paper` com `scrim` (foto clara) ou contorno (foto média). Não coloque painel por cima da foto.
- **Modo Tech** (yap e capa de `ia na prática`): `.ad-frame--tech` (`bg` + grid + brilho cobalto), chip `--tech` com status ao lado, título `ig-display` em `ink` com 1 a 3 palavras em `.ad-ig-off` (cobalto com sombra deslocada) e wordmark na base.
- O gancho do capa é o mesmo do frame 1 do vídeo: até 10 palavras, começando pela tensão, sem "oi gente", "hoje eu" ou "então".
- **Zonas seguras:** nenhum texto em y < `ig-safe-top` (240px), em y > 1920 − `ig-safe-bottom` (1440px) ou nos `ig-safe-right` (160px) da direita.
- **Grid 3:4:** no perfil a capa aparece cortada em 1080×1440, de y=240 a y=1680. Título e chip ficam inteiros dentro desse corte.
- Para ver as guias no preview, use `.ad-show-safe` no elemento pai.
