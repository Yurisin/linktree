# Wordmark

Assinatura da marca: ◈ Alemão Dev, com "Alemão" em `ink` e "Dev" em `brand`, em Geist 800 (nav, 18px) ou 900 (grande, 30px, tracking −0.75px).

- **Assinatura com foto:** avatar do mirante no círculo + "Alemão Dev", com `.ad-no-mark` (a foto substitui o ◈). O nome vai num `<span>` próprio depois do avatar, para o espaçamento entre "Alemão" e "Dev" não abrir. Tamanhos: avatar 40px com wordmark 18px (nav, rodapé) e avatar 96px com wordmark 30px (Sobre, capa de story).
- Use `.ad-wordmark` com `Alemão <span class="ad-dev">Dev</span>`. O ◈ vem do CSS; tire com `.ad-no-mark` quando o espaço for mínimo. Quem usa só define o tamanho.
- O ◈ é o marcador de sistema da v2 (o mesmo dos rótulos), não um logo. Não desenhe um símbolo novo.
- Sempre sobre `bg`, `panel` ou `scrim`. Sobre foto clara, só com `scrim`.
- **Avatar oficial = foto do mirante**, no grupo de assets Avatar: `avatar-mirante.jpg` (recorte 1080×1080) e `mirante.jpg` (foto inteira). Use `<span class="ad-avatar"><img src="…avatar-mirante.jpg"></span>` (o preview embute uma cópia de 192px da mesma foto para aparecer no card estático); sem imagem, `.ad-avatar` mostra o placeholder tracejado. O avatar é sempre circular (`radius-pill`), a única forma redonda do sistema além do ponto de status.
