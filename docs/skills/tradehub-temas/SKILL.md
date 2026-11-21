---
name: tradehub-temas
description: "Use when touching Editor themes (Terminal, Atelier, Pulse), light/dark, presets, greys, theme and layout illustrations in Admin, Editor or the Onboarding preview, or any code that reads theme colours (resolveColors, greysFollow). Replaces tradehub-temas-editor."
---

# Temas do Editor (TradeHub)

## Regra de ouro
Editor e preview do Onboarding usam o MESMO cálculo de cores. Não crie paleta própria no Onboarding nem cópia dos presets. O Editor é a referência visual; o Figma (coleção Terminal, não mexer) também.

## Erro que aconteceu (19/11)
Os cinzas dos temas seguiam a cor da marca por padrão. Com marca laranja, o azul-marinho do Pulse virava marrom no dark e rosa no light. Terminal e Atelier quase não mostravam porque os cinzas têm pouca cor. Correção: Pulse usa a paleta exata do template; Brand ou Grey escolhidos em Style > Colours continuam valendo.

## Onde está no código
- `resolveColors` tingia os cinzas pela marca quando o tint estava ausente (padrão "brand"). Correção: `greysFollow()` em `src/lib/theme/derive.ts` (Pulse = "template", os outros = "brand"; a escolha salva vale), usado também no painel de cores.
- Template novo com paleta colorida deve entrar em `greysFollow` como "template".
- Imagens dos cards: `public/onboarding/look-*.webp` e `layout-*.webp`, geradas da arte do Figma (Theme art Card 276×188, Layout art Card 276×117) por get_screenshot + sharp, nunca recortadas à mão; `imgClass` usa o aspect-ratio do arquivo.

## Regra de leitura de cor
Gráficos e qualquer cor de tema leem `resolveColors`, nunca `theme.palettes[...]` cru (dois gráficos do aluno faziam isso e foram corrigidos).

## Como evitar
- Tema com cinzas próprios nunca deve ser tingido pela marca, a menos que o usuário escolha Brand.
- Teste scripts/theme-matrix.mjs: 3 temas x Dark/Light x (preview do Onboarding, Editor) x 1440/768/390, com troca rápida, reload, sem tema salvo e dados antigos no localStorage. Esperado 31 ok, 0 falhas. Também rode `scripts/theme-controls.mjs` (100 ok: site do aluno, site público, troca de marca por tema, Dark/Light rápido, Layout, reload, dados antigos, reduced motion). Rode ambos sempre após mexer em presets ou tokens de tema. Ainda não coberto: botão Reset, celular real.
- Pulse padrão = Dark.

## Ilustrações dos cards de tema
São 7 (3 temas, 4 layouts), sempre instâncias no Figma (Theme art, Layout art, Background art). Saem 1:1 do Figma, sem 2x; largura útil fixa pelo espaço interno do card, aspecto do arquivo, centradas, nunca cortadas.

## Animação
Troca de tema no preview do Onboarding: a prévia some e volta, terminando visível; testar troca no meio da animação.

## Nota
Fonte: Helvetica Neue só na UI do Admin/Editor; temas e widgets mantêm a fonte própria.