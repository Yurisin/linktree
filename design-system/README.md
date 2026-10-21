Marca pessoal do Yuri (@alemaodev): dev que pediu demissão e hoje constrói com IA. O perfil vende uma coisa: os bastidores de quem saiu do CLT para construir com IA, com o que funciona na prática. O mesmo sistema serve o Instagram e o site (alemaodev.com).

**v2, híbrido cobalto (out/2026):** o roxo saiu. O azul cobalto do carro virou a cor da marca, o verde de sinal entrou como acento, e a linguagem passou a ser de terminal: Geist Mono nos rótulos e no corpo, cantos retos com chanfro, grid de fundo e rótulos de sistema (◈, ● ONLINE, DIA 017). A referência visual é o cyberleek.co.uk, adaptada: o sistema empresta a estética, não o conteúdo. O site alemaodev.com ainda está na paleta roxa e precisa ser atualizado para bater com o Instagram.

## Pilares e formatos

Toda peça tem UM pilar (o chip) e UM formato. Os pilares e os pesos vêm do Plano de Conteúdo:

| Pilar | Peso | Objetivo | Formato principal | Modo |
|---|---|---|---|---|
| `ia na prática` | 40% | Salvamento e seguidor qualificado | Carrossel, yap | Tech |
| `jornada` | 25% | Conexão e comentário | Yap, carrossel, LogEntry | Foto (yap) / Tech (carrossel, log) |
| `mentalidade` | 20% | Alcance e compartilhamento | Reel 7s com PhraseCaption | Foto |
| `humor` | 15% | Compartilhamento | Reel 7s ou yap curto | Foto |

- Lifestyle (snowboard, viagem, trilha, carro) não é pilar: entra como cenário de `mentalidade` e `humor`.
- Serviço também não é pilar: aparece no último slide (ServiceCTA) ou em story.
- Semana padrão: segunda carrossel (`ia na prática`), terça yap (`ia na prática`), quarta 7s (`mentalidade`), quinta carrossel (`jornada` ou `ia na prática`), sexta yap (`jornada`), sábado 7s (`humor`), domingo só stories.

## Os dois modos

| | Modo Foto | Modo Tech |
|---|---|---|
| Para quê | Yap, 7s, bastidor: a pessoa na frente da câmera | Carrossel, capa de `ia na prática`, log, CTA |
| Fundo | Foto ou vídeo real do Yuri, em tela cheia | `bg` + grid (`grid-bg`) + brilho `cobalt-glow` |
| Texto | `paper` com contorno `caption-stroke` ou faixa `scrim` | `ink`; destaque em `brand` com sombra deslocada (`.ad-ig-off`) |
| Elementos | Chip + frase/título. Nada mais sobre a foto | Painéis chanfrados, CodeCard, LogEntry, status, wordmark |
| Componentes | PhraseCaption, ReelCover (Foto) | CarouselSlide, ReelCover (Tech), LogEntry, ServiceCTA |

- No Modo Foto a foto é a protagonista: não cubra rosto ou ação, não aplique filtro de marca.
- Na dúvida: se ensina, é Tech; se mostra a pessoa, é Foto.

## Voz e conteúdo

- Primeira pessoa, direto, como quem conta para um amigo do setor. "Oi, eu sou o Yuri." e não "Apresentamos".
- Problema real e resultado real: "Resolvo o problema, não terceirizo."
- Bastidor com honestidade e com gancho: "Pedi demissão há 10 dias. Ninguém me avisou disso." e não "Hoje foi tenso".
- Números só se forem reais e verificáveis (5 anos de Governo Digital, 300k de MRR, recorde de 2h08). A contagem de dias do LogEntry também.
- Termos técnicos em inglês quando é assim que se fala (deploy, MRR, stack); o resto em PT-BR.
- Frases de mentalidade: curtas, com tensão, uma ideia por frase. Palavrão censurado com símbolo (p@rr4).
- Sem emoji nas peças. Na bio, emoji só como marcador de linha.
- Caixa: títulos em frase normal; CAIXA ALTA só em rótulos mono (chip, status, meta, botão).
- O gancho vai em texto no frame 1 e é falado no primeiro segundo: até 10 palavras, começando pela tensão, sem "oi gente", "hoje eu" ou "então".
- Um CTA por peça: compartilhar ou comentar uma palavra (AGENTE, SAIR, CLAUDE).

Fala assim / não fala assim:

- ✅ "Conectei o CRM ao WhatsApp e o time parou de copiar e colar." ❌ "Soluções inovadoras de integração omnichannel."
- ✅ "Seu agente de WhatsApp parece robô por um motivo só." ❌ "Dicas para melhorar seu chatbot!"
- ✅ "Quer um agente desses? Me chama." ❌ "Entre em contato para um orçamento personalizado."

## Cor

- Fundo do Modo Tech: `bg` (#00050b, quase preto azulado), com `grid-bg` e, em capas, `cobalt-glow`. Nunca preto puro.
- Texto: `ink` principal, `ink-soft` secundário e corpo, `ink-faint` em meta e rótulos de sistema. Os três passam contraste em texto pequeno (15.8, 8 e 5.4:1).
- `brand` (#3278ff, cobalto) é a cor da marca: 1 a 3 palavras de destaque por título (24px+), sempre com `title-offset` (sombra deslocada em `brand-deep`), o ◈ dos rótulos e as bordas fortes. Em texto pequeno use `brand-bright`.
- `action` (#1f4fd1) é o **azul do carro**: só fundo de botão e CTA, sempre com `on-action` (6.78:1). Não troque por `brand` com texto branco (3.99:1, reprova).
- `signal` (#79e84b, verde) é o acento: ponto de status, 1 palavra-chave em frase sobre foto, número de prova e o botão de engajamento (com `on-signal`). Uma ocorrência por peça além do status. Não use verde e cobalto como destaque no mesmo título.
- Painéis: `panel` com borda `line` (ou `line-strong` em destaque).
- Sobre foto clara: texto `paper` sobre `scrim`. `brand` nunca encosta direto na foto.
- Cores de código (`code-*`) não aparecem fora do CodeCard.

## Tipografia

- **Geist 900** (Google Fonts) só nos títulos grandes: `hero`, `section`, `ig-display`, `ig-title`, `ig-phrase`, e no wordmark. Tracking negativo.
- **Geist Mono** (Google Fonts) em todo o resto: corpo, rótulos, botões, meta, números de prova e código. É webfont, então a peça exportada é igual em qualquer máquina.
- Site: `hero` 48px, `section` 36px, `body` 15px mono, `label` 12px mono em caixa alta, `meta` 11px.
- Instagram (1080px): `ig-display` 112px, `ig-title` 72px, `ig-phrase` 64px, `ig-stat` 200px mono, `ig-body` 34px mono, `ig-label` 28px, `ig-meta` 24px. Nada menor que 24px numa peça 1080.
- Títulos de capa com até 7 palavras e no máximo 3 linhas.

## Forma, espaço e zonas seguras

- Cantos retos com chanfro: o canto superior direito e o inferior esquerdo são cortados (`chamfer-sm` 8px em botão e chip, `chamfer-md` 16px em painel, `ig-chamfer` 40px nas peças). Só avatar e ponto de status são redondos.
- Traço claro de 2px no topo esquerdo de botões e painéis: é o detalhe de acabamento da v2.
- Grid de fundo: passo de 32px no site e 72px nas peças (igual a `ig-margin`).
- Formatos: reel/story 1080×1920, carrossel 1080×1350 (4:5), quadrado 1080×1080.
- Reel: nenhum texto acima de `ig-safe-top` (240px), abaixo de `ig-safe-bottom` (os últimos 480px) ou na coluna `ig-safe-right` (160px).
- Grid do perfil em 3:4: a capa aparece cortada em 1080×1440 (de y=240 a y=1680). Chip e título ficam inteiros nesse corte.
- Sombra: só `glow` (CodeCard, número de prova) e `title-offset` (destaque de título). Nada de sombra projetada.

## Imagem

- Foto real, do celular, sem filtro de marca: escritório (iPhone fixo na mesa), notebook à noite, carro, trilha, neve. A autenticidade é a estética.
- O carro (Polo azul cobalto) é cenário recorrente e é de onde vem a cor de ação. Não aplique azul por cima dele.
- Print de tela (n8n, código, dashboard) vai dentro de `.ad-ig-card`, nunca solto.
- Proibido: banco de imagem, "robô azul de IA", mockup 3D brilhante, mascote.

## Marca e avatar

- A marca é tipográfica: ◈ Alemão **Dev** ("Dev" em `brand`). O ◈ é o marcador de sistema, não um logo; não desenhe um símbolo.
- **Avatar oficial: a foto do mirante** (neve, capacete e óculos azuis, polegares para cima), igual no site, no Instagram e onde mais houver avatar. Está no grupo de assets Avatar: `avatar-mirante.jpg` (recorte quadrado 1080×1080, pensado para o círculo) e `mirante.jpg` (foto inteira, 1440×1920, para story ou sobre).
- Assinatura: wordmark no rodapé (Modo Tech) ou `@alemaodev` em `ig-handle` (Modo Foto, opcional).

## Iconografia

- Ícones de traço 1.75px com pontas retas, em `signal` ou `ink-soft`. Um set por peça. Ainda não há set oficial; os dos destaques são genéricos, a trocar por um set consistente (ex.: Lucide).
- Marcadores de texto fazem parte da voz: ◈ em rótulos, ● em status, → em links e "arrasta →".
- Sem emoji como ícone.
