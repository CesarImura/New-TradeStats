# Guia de componentes do New-TradeStats

Como criar e editar componentes sem repetir os erros que já apareceram. Vale para pessoas e para o Claude.
As decisões de produto continuam no vault (About, PRD summary, Customization principles); este guia trata de código.

Fontes usadas: skills `shadcn`, `migrate-radix-to-base`, `emil-design-eng`, `web-design-guidelines`,
`vercel-react-best-practices`, `tailwind-design-system`, `motion`, `animation-performance`, `break-ui`,
`traderhub-widget-design`, e as notas da memória do projeto (motion-standard, widget-lab-gotchas, shared-ui-patterns).

## 1. Onde cada coisa mora

| Pasta | O que vai ali | Regra |
| --- | --- | --- |
| `src/components/ui/` | Só os primitivos do shadcn (base-nova, em Base UI) | Gerenciada pelo CLI. Mudança aqui vale para admin, aluno e editor ao mesmo tempo. |
| `src/components/kit/` | Nossas peças genéricas montadas sobre `ui/`: `select-field.tsx` (`SelectField`, `SelectOptions`), `drop-line.ts` | Peça nova reutilizável e sem regra de negócio entra aqui, não em `ui/`. |
| `src/components/admin/kit.tsx` | Peças do admin: `PageHeader`, `Page`, `NativeSelect`, `SettingRow`, `Field` | Tela nova do admin começa por elas. |
| `src/components/widgets/` | Raiz: `registry.tsx` (catálogo e settings), `page.tsx`, `page-renderer.tsx` (`WidgetGrid`, desenha a página) e `page-grid.ts` (os cards do desktop: `toTiles`, `planTiles`, `resizeCard`, `dropAt`, `removeCard`, `fillGaps`…, puro). `parts/`: o kit dos widgets, um assunto por arquivo: `frame.tsx` (`WidgetFrame`, `useFrame`, `useMore`), `tokens.tsx` (`FX`, `TYPE`, `ACCENT`, `MOTION`, `fill`, `series`), `card.tsx` (`W`, `Drop`, `useFitRows`, `Head`, `Big`, `Row`), `bits.tsx` (chips, avatar, `Tip`, `useBrokenImage`), `charts.tsx` (`Bars`, `Spark`, `Ring`…), `anatomy.tsx` (`WCard`, `Num`, `Chip`, estilos do Look), `visuals.tsx` (`Legend`, `TickGauge`, `StepChart`, `Timeline`…), `shared.tsx`, `widget-scope.tsx`, `layouts.tsx`. `catalog/`: um arquivo por grupo de widgets (`catalog/more/` para os extras); os de mídia em quatro: `media-data.ts` (dados), `poster.tsx`, `shelf.tsx`, `featured.tsx` | Usar a skill `traderhub-widget-design` antes de mexer. Widget novo vai em `catalog/` e entra no `registry.tsx`. |
| `src/components/admin/design/` | Editor de Design. `editor/`: casca, canvas, prévia (`page-builder.tsx`, `editor-shell.tsx`…). `panels/`: painéis laterais (`builder-panels.tsx` galeria, `widget-inspector.tsx` inspector da direita, `settings-panel.tsx`, `media-cards-editor.tsx`). `fields/`: campos e controles (`controls.tsx` com `Row`, `InspectorSection`, `YesNo`; `design-fields.tsx`, `menu-sort.tsx`…). `thumbs/`: miniaturas (`widget-thumb.tsx` dos widgets, `option-art.tsx` das opções de estilo). Raiz: dados (`looks.ts`, `options.ts`, `states.ts`) | Campo novo em `fields/`, painel novo em `panels/`, miniatura em `thumbs/` (ver seção 11). |
| `src/components/icons.tsx` | Todos os ícones (Carbon embrulhado com nomes do lucide) | Nunca importar `lucide-react` ou `@carbon/icons-react` direto. Ícone que falta: adicionar aqui. |
| `src/lib/theme/` | Tokens, `themeToCss`, contraste | Cor nova vira token, não hex solto no componente. |

Antes de criar um componente: `rg` pelo nome e pelo comportamento. Se já existe algo parecido em `ui/`, `kit/`, `admin/kit.tsx`
ou `widgets/parts/`, estender em vez de duplicar.

## 2. shadcn e Base UI

- O projeto é **base-nova**: os primitivos são do `@base-ui/react`, não do Radix. As props mudam: `render={<a />}` em vez de `asChild`,
  `onValueChange(value, details)`, estados em `data-open`, `data-highlighted`, `data-checked`, `data-disabled`, `data-popup-open`.
- `npx shadcn add <x>` **sempre** com `--dry-run --diff` antes. O CLI:
  - sobrescreve componentes já customizados (ex.: `button.tsx` tem a transição com `scale`);
  - injeta `import { cn } from "cn"` e instala o pacote npm `cn`, que **não** é o nosso. Trocar por `@/lib/utils` e desfazer o
    `package.json`;
  - importa ícones de `lucide-react`. Trocar por `@/components/icons`.
- Depois de adicionar, reformatar no estilo do repo: sem ponto e vírgula, linhas até 220, `trailingComma: all`. Não rodar Prettier
  no arquivo inteiro de outros componentes.
- Popups (Select, Menu, Popover, Tooltip) vão para um portal no `body`. No aluno o tema está em `:root`, então eles herdam. No
  admin funcionam pelo escopo do shell. Se um popup sair sem o tema, o problema é o escopo do CSS, não o componente.

## 3. Controles padrão (use estes, não reinvente)

- **Dropdown:** nunca `<select>` nativo. Use `SelectField` (lista `{ value, label }`) ou `SelectOptions` (mesma API do `<select>`,
  com `<option>`s) de `@/components/kit/select-field`. No admin, `NativeSelect` de `admin/kit.tsx` já é o mesmo componente no tamanho
  do admin. O chevron fica a 8px da borda em todos os tamanhos; não colocar `ChevronDown` extra nem `appearance-none`.
- **Lista ordenada por arrastar:** indicador de onde o item cai é `dropLine("before" | "after")` de `@/components/kit/drop-line`.
  Nunca borda, `ring` ou sombra no próprio item (em card arredondado parece card quebrado). Alvo que é uma área inteira (coluna
  do kanban, módulo que recebe aula, dropzone de arquivo) usa fundo `bg-primary/10`.
  - Ordenação com animação: `Reorder` do `motion/react` com alça (`dragListener={false}` + `useDragControls`), como em
    `admin/design/fields/menu-sort.tsx`. Sempre com ↑ ↓ pelo teclado e um `aria-live` dizendo para onde o item foi.
- **Botão só com ícone:** `Button size="icon-*"` com `aria-label` (e `title` quando o ícone não é óbvio). Área clicável de 24px
  no mínimo (`size-7` ou pseudo-elemento maior).
- **Switch, Checkbox, Tabs, Dialog, Sheet, Tooltip:** os de `ui/`. Grupo de opções com cara de botão: `role="radiogroup"` no pai e
  `role="radio"` + `aria-checked` nos filhos.

## 4. Design: erros que já aconteceram

- **Espaço interno:** ícone dentro de campo ou botão nunca encosta na borda. Mínimo 8px (`pr-2`) entre ícone e borda, 6px (`gap-1.5`)
  entre ícone e texto. Quem reserva o espaço é o componente, não quem chama.
- **Estados:** todo controle tem hover, foco visível, ativo e desabilitado.
  - Foco: `focus-visible:ring-3 focus-visible:ring-ring/50` (ou o anel do tema). `outline-none` sem `focus-visible:` é bug.
  - Ativo: `active:scale-[0.97]` em controles pequenos, 0.98 em cards grandes. A transição tem que listar `scale` (ver Motion).
  - Desabilitado: `disabled:opacity-50 disabled:cursor-not-allowed`, e `data-disabled:` nos primitivos do Base UI.
- **Cores:** tokens (`bg-background`, `text-muted-foreground`, `border-input`, `var(--ts-interactive)`, `var(--brand-*)`). Hex solto
  (`#ff5500`, `white/15`) só nas superfícies fixas do editor e com comentário dizendo por quê.
- **Raio:** filhos usam raio menor que o pai (`--r-inner`, `--r-menu`, `--r-panel`). Um item dentro de card de 12px não pode ter 12px.
- **Texto longo:** todo texto que vem do coach ou do aluno precisa de `truncate`/`line-clamp` ou quebra. Testar com a skill
  `break-ui` (nomes longos, e-mail sem espaço, lista vazia, números enormes).
- **Claro e escuro:** conferir os dois. Nada de cor que só funciona no escuro (ex.: `bg-white/10` no tema claro some).
- **Degradê:** proibido, exceto o fade dos widgets de mídia, que é sempre a cor do card (`--fade-to`).
- **Cor de marca como texto (review de 31/10):** `text-primary` puro é trocado pelo tema pela versão legível (`--brand-text`, AA).
  Com variante (`data-[active=true]:`, `hover:`, `group-*:`) a troca não acontece: usar `text-brand-text`. A aba ativa da barra do
  celular da Sophia escura ficou com 2,3:1 por isso.
- **Texto secundário sobre cor de marca:** sempre sólido, sem `opacity-*` nem `text-muted-foreground` com transparência. Em marca de
  tom médio o texto apagado reprova AA (banner do Ranking, Closing do site). `.fx-hero` já faz `--muted-foreground: var(--on)`.
- **Superfície de marca num shadcn Card:** `.fx-hero` em `<Card>` funciona (regra fora de layer em `globals.css`), mas não pôr
  `bg-*` própria em outra superfície `.fx-hero` esperando que o tema vença.
- **Capas e fotos fora de widget:** `--media-bg`/`--media-fg` existem em todo tema; não redefinir por página.

## 5. Motion

- Biblioteca: `motion` (`motion/react`). Nunca `framer-motion`. Utilitários do `@animate-ui/react` (`useShouldReduceMotion`,
  `CountingNumber`, `SlidingNumber`, `Highlight`) já respeitam o "reduzir movimento".
- Uma curva só: classe `ease-out` (`--ease-out`, cubic-bezier(0.23,1,0.32,1)) ou `MOTION.ease` no JS. Durações: 150ms em controles,
  `MOTION.enter` (.24s) em entradas, `MOTION.draw` (.45s) em gráficos.
- No Tailwind v4, `scale-*` é a propriedade CSS `scale`. Em `transition-[...]` com `active:scale`, incluir `scale` na lista.
- Sem `transition-all`. Listar as propriedades (`transition-[background-color,border-color,scale]`).
- Animar só `transform`/`opacity`/`scale`/`clip-path`. Não animar `height`, `top`, `box-shadow` em listas grandes.
- `prefers-reduced-motion` já zera transições CSS no `globals.css`. Animação em JS precisa de `useShouldReduceMotion`.
- **Grade do editor e da página (`editor/page-builder.tsx`, `drag-marks.tsx`, `WidgetGrid` em `widgets/page-renderer.tsx`):** como arrastar no Figma ou no iOS: o que está sob o dedo cola nele a 60fps, o resto se move em molas suaves e interrompíveis, e nada dá pulo.
  - **Arrastar anda em passos** (`GRID_NUDGE`, rápida, quase sem overshoot): o card redimensionado e o card carregado pulam de célula em célula, não seguem o ponteiro em linha, e a grade aparece só durante o arrasto (`SnapGrid`).
  - **Uma mola só** (`GRID_SPRING`, crítica, sem overshoot visível, ~250ms) para tudo: card empurrado, card solto, caixa de destino, Fill gaps, desfazer, refazer, adicionar. Quem muda de alvo no meio do voo leva a velocidade para o novo alvo. `prefers-reduced-motion`: tudo instantâneo.
  - **Posição por `transform`** (`Cell`, motion values `x`, `y`; só a largura e a altura são layout), sem animar `left`/`top`. O card só anima depois de `settled` (a página do aluno não ganha animação de carga nem layout shift); quem vai para o lugar de uma vez (`jump`, mudança de colunas, primeira medição) é escrito no elemento no mesmo commit, para ninguém medir ou pintar o card no lugar antigo (as alturas medidas do tablet dependem disso). `will-change` só durante um arrasto (`busy`).
  - **Redimensionar:** sem linha, sem alça de vários cards e sem tooltip; cursor certo nas bordas e cantos, marcas pequenas e quietas nos cantos do card com o mouse em cima ou selecionado (`data-corner-mark`), e uma pílula com o tamanho ("5 columns · 4½ rows", "Minimum size") junto ao canto arrastado (`SizePill`). O card arrastado (`held`) **segue o ponteiro de forma contínua**: a caixa é escrita direto nos motion values em cada frame (`frame.update` do motion, sem `setState` por movimento), parando onde ele não pode ir. O React só desenha de novo quando o tamanho encaixado muda, e aí os cards empurrados saem do caminho na mola. Ao soltar, a mola leva o card do ponto em que está ao tamanho encaixado. A pílula usa o mesmo caminho (`pillRef`).
  - **Sem pop no conteúdo durante o arrasto:** os hooks que medem o widget (`useFitDetail`, `Drop`, `useFitRows`, ajuste de linhas e chips, a altura medida das células) usam `SizeObserver` (`widgets/parts/resizing.ts`) no lugar de `ResizeObserver`: ele segura os avisos enquanto o `<body>` tem `data-grid-resizing` e avisa uma vez ao terminar (o editor tira o atributo ~380ms depois de soltar, com a mola já assentada). Widget novo que meça o próprio tamanho usa `SizeObserver`. Os gráficos não recomeçam a animação a cada passo.
  - **Mover um card ou soltar um widget sobre um vão (`slotAt` em `page-grid.ts`):** o card **mantém o próprio tamanho** e só encolhe onde o vazio é menor (nunca abaixo do mínimo), **nunca estica para preencher o vão** (esticar até o fundo do bloco foi um erro: um card virou uma coluna alta). Dos retângulos vazios pela célula do ponteiro vence o que deixa o card maior; ele fica no canto de cima à esquerda desse retângulo, deslocado só o bastante para ficar sob o ponteiro. O lugar de onde o card saiu conta como vazio, e as linhas vazias até o fundo irregular do bloco também. Achou: o card carregado aparece direto nesse retângulo (mudança de tamanho é instantânea, com um pequeno pop de escala; esticar de onde está até o vão foi outro erro; passos do mesmo tamanho vão na `GRID_NUDGE`), a caixa de destino é igual, **nenhum outro card se mexe**, o conteúdo do widget só mede ao soltar (`setGridResizing`) e soltar salva esse retângulo (`Target.slot`, um passo de desfazer); sair do vão devolve o tamanho próprio. Sobre o lugar do próprio card, ou sobre outro card, ou num vão pequeno demais: só a caixa de destino, no tamanho próprio, e os outros cards ficam parados; só depois de o ponteiro ficar ~350ms no mesmo ponto (`REST`) os cards no caminho saem do caminho (a pré-visualização de antes), e mover para outro ponto recomeça a espera e eles voltam. Soltar antes da espera empurra do mesmo jeito: o resultado é sempre o que a caixa mostrou. Teste: `slotAt` contra força bruta (vazio, contém a célula, mínimos, o maior) e `dropAt` num vão só muda o card solto.
  - **Mover um card:** o clone sobe (scale 1.01) e segue o ponteiro só por transform; a caixa de destino desliza na mesma mola (`DropRect`) e os cards no caminho já saem da frente enquanto o alvo muda (pré-visualização: `moving.preview` / `arriving.preview`, calculada do layout salvo em `committed`, nunca do que está na tela); o lugar de onde saiu aparece como área vazia quieta. Ao soltar, o clone assenta na caixa pela mola. **Pegar um card não seleciona** (selecionar abre o inspector e reescala o canvas no meio do arrasto): só o clique seleciona, e o clique que termina um arrasto é ignorado (`dragged`). A escala do canvas fica travada durante qualquer arrasto (`hold`); quando o painel abre por um clique, o canvas em "fit" muda de escala numa transição só (180ms, só em fit e só depois do primeiro desenho).
  - **Custo por passo:** o shell da plataforma (menu, barra de cima) não desenha de novo a cada passo (`BodyCtx`/`ShellFrame`); cada card (`Cell`) só desenha de novo quando o conteúdo dele, o `rev` ou o lugar muda, e o conteúdo (`Content`) só quando o conteúdo ou o `rev` muda, não quando o card só se mexe. **Cuidado:** o que o `render`/`wrap` de um card lê fora do próprio card (seleção, o que está saindo…) tem de estar no `rev`, e o que ele **chama** (editar, duplicar, mover, remover, pegar, redimensionar) tem de passar por `act.current`, senão o card age sobre um layout velho e um commit apaga o que veio depois (aconteceu: um redimensionamento desfazia o anterior).
  - **Resto:** card novo entra com fade e scale 0.98→1 (`.hb-enter`); remover faz fade-out de 150ms e só então os vizinhos se ajeitam (`removeAnimated`; o espaço fica vazio). Os vãos são desenhados por `GapAreas`, que lê de um store (`GapStore`) e não faz o editor inteiro desenhar de novo.
- **Marcas do editor sobre a página do coach:** branco com borda escura fina (`rgb(24 24 28 / .75)`), para valer em tema claro (Kairo) e escuro (Northline). Neutras, sem cor do coach. Tamanhos em `calc(Npx * var(--ui-zoom))`, para não encolherem com o zoom.

## 6. Bibliotecas específicas

- **Embla (`embla-carousel-react`):** só em `widgets/catalog/shelf.tsx` (Shelf; o Featured em `featured.tsx` usa Motion). Loop precisa de 8 slides ou mais (repetir os reais e contar os dots
  só dos reais). `reInit` quando a lista muda. Abaixo de 480px a Shelf vira Row.
- **Recharts:** sempre por `ui/chart.tsx` (`ChartContainer`, cores por `--chart-*`). Altura explícita no container, senão o gráfico
  fica com 0px. Para gráfico de preço use `components/charts/trade-chart.tsx`.
- **react-grid-layout:** não é usado hoje. Se precisar, só o `verticalCompactor` (de `react-grid-layout/core`); o componente de grid da
  biblioteca não entra. As páginas são linhas próprias (`widgets/page-grid.ts`, desenhadas por `widgets/page-renderer.tsx`).
- **Página em cards livres (desktop, decisão do produto de 05/11; antes era um tiling estilo Robinhood Legend):** cada card tem o próprio retângulo: `x` e `w` em 12avos da página, `y` e `h` em passos de meia linha. Entre dois bands (título e ferramenta da página, `ownHeight`, largura total e altura do conteúdo) os cards de um bloco **não se sobrepõem** e **podem deixar vãos**; o bloco tem a altura do card mais baixo, e começa logo depois do band de cima (linhas vazias no topo ficam vazias). Salvo nos próprios cards, com `tiles: true`. O render desenha os números salvos, sem recalcular nada. Tudo em `page-grid.ts`, puro:
  - **`resizeCard`:** o coach arrasta uma borda ou um canto do card (qualquer card, sem selecionar antes; zonas de 6px por dentro e meio vão por fora). Só esse card muda x, y, w e h, em colunas e meias linhas, entre o mínimo dele (`minW`; `rowBounds` + `noteRows` na altura) e a página (0 a 12); a borda de cima para no topo do bloco e em qualquer card acima (nunca empurra para cima). `maxW` e `maxH` não contam. Cresceu para cima de outros cards: cada um que ele cobre desce reto até ficar livre, e os que esses atingem também, pelo mínimo necessário (`pushDown`); mantêm x, w e h; nada mais se mexe. Encolher deixa vão: nunca há compactação. Recalcula sempre do layout em que o arrasto começou, então voltar o mouse devolve o que foi empurrado.
  - **`dropAt`** (mover um card, soltar um widget da biblioteca): o card cai no x e y encaixados sob o ponteiro, no tamanho dele, e o que ele cobre desce; o lugar de onde saiu fica vazio. `{ end: true }` (botão Add, sem bloco): largura total no fim do último bloco. **`removeCard`**: o espaço fica vazio. **`duplicateCard`**: logo abaixo do original, mesmo tamanho. **`stripAt`** (mover para o topo ou o fim): largura total no topo do primeiro bloco ou no fim do último. **`fitCard`** (Layout, Detail ou nota pedem mais espaço): só esse card cresce (mais largo à direita, ou à esquerda se faltar; mais alto), e o que ele cobre desce; nunca encolhe.
  - **Vãos:** `hasGaps` e `emptyAreas` olham as células vazias de cada bloco até o card mais baixo. No editor cada vão aparece como uma área vazia bem quieta (`GapAreas`, nunca na página do aluno) e a barra de zoom ganha **Fill gaps** só quando há vão (`fillGaps`, um passo de desfazer): primeiro os cards sobem reto o quanto der, mantendo x; o que sobrar vazio é tomado esticando um vizinho para o lado ou o card de cima para baixo (o de baixo para cima por último); se um bolso fechado não deixa nenhum esticar, o bloco é refeito em linhas (`repack`: ninguém encolhe). No aluno, um card escondido (fase, grupo, módulo) é tirado e `fillGaps` roda só nos blocos que perderam um (`withoutCards`); o resto é desenhado como salvo, vãos incluídos.
  - Layout sem `tiles` (salvos antes, `TEMPLATES`, rascunhos com `rows` ou `grid`) vira cards só na hora de desenhar (`toTiles`: linhas de largura igual, até 4 cards), até a primeira edição. **Ordem empilhada:** um layout salvo pelo editor tem `ordered: true` e a ordem de `items` é a ordem do celular e do tablet (`stackOrder`); redimensionar nunca a muda. Mover, adicionar ou duplicar um card o coloca onde a leitura (`y`, depois `x`) o põe (`placeInOrder`, via `commitTiles(..., place)`); tirar só o remove. Sem `ordered` (salvos antes) vale a ordem de leitura até a primeira edição, que guarda essa mesma ordem. `phoneOrder` manda sobre ela (`phoneSequence`). Tablet e celular empilham cada card com a altura do conteúdo (`x` a partir de 8 ocupa duas colunas).
  - Teste: as funções são puras; uma sequência aleatória de `resizeCard`, `dropAt`, `removeCard`, `duplicateCard`, `stripAt`, `fitCard` e `fillGaps` nas páginas dos templates tem que manter zero sobreposição, os mínimos, só o card arrastado mudando (mais o y dos empurrados, sempre para baixo e sem passar do necessário) e nenhum vão depois de `fillGaps`.
- **Limites dos layouts (`minW`, `minH`):** `minW` 3 só vale se o layout passa no quarto de página (≈292px e ≈228px) e `minH` só vale se o
  layout passa na altura mínima, medidos com o detector do bench (`scripts/widget-bench/detect.js`); Detailed não encolhe abaixo da
  própria altura (`rowBounds`).
- **Card em qualquer tamanho (tiles, 03/11):** o coach arrasta as bordas, então um card pode ter qualquer largura inteira de `minW` a 12 e qualquer meia linha de altura a partir do mínimo, sem teto. As regras compartilhadas que seguram isso, em `widgets/parts/`:
  - `cut()` (`card.tsx`, usado por `Drop` e `useFitDetail`) vê o que passa do topo (conteúdo centrado em caixa baixa vaza dos dois lados), uma linha de texto cortada pela metade numa coluna que quebra (`flex-col flex-wrap`, Fit list e SPLIT) e uma caixa que não corta mas tem filhos fora dela (`spills`, mais de 8px). Antes só via o fundo; um Detailed num card baixo não descia para Standard e as partes se sobrepunham. Todo corpo novo que empilha partes deve deixar o excesso visível para `cut()` (ou `overflow-hidden` com folga em cima, como no `HeroCard`), nunca encolher as partes umas sobre as outras.
  - `WCard` espalha as partes do corpo (`useRoomy`, `justify-evenly`) quando mais de um terço dele está vazio. Corpo com parte que cresce (gráfico `flex-1`) não tem sobra e não muda; corpo em colunas também não.
  - `WidgetEmpty` usa `py-2`: o estado vazio de uma linha (56px) cabe sem passar do card.
  - Medir: o bench de largura × altura (`scripts/widget-bench`) mais a sobra vazia abaixo do último conteúdo (acima de ~35% a 1,5× a altura desenhada pede olhar).
- **Sonner:** `toast` de `sonner`, já montado em `app/layout.tsx`. O editor tem um segundo, com `id` próprio (`CANVAS_TOASTS` em `editor/page-builder.tsx`); fora isso, não montar outro `<Toaster />`.

## 7. Comportamento (bugs que já aconteceram)

- **Hydration:** nada de `Date.now()`, `Math.random()` ou `localStorage` no render. Use em evento ou `useEffect`. Ids com `useId`.
- **Altura 0 em size container:** filho `flex-1` com `[container-type:size]` em card de altura pelo conteúdo fica com 0px. Dar
  `aspect-*` ou altura mínima.
- **Dois `onProps` seguidos se sobrescrevem** no editor: juntar num patch só.
- **Listeners:** todo `addEventListener` em `useEffect` tem o `removeEventListener` no retorno.
- **Listas reordenáveis:** `key` estável (`id`), nunca o índice.
- **Store do protótipo:** `write()` pode falhar por cota; tratar o `false` (o toast já aparece).
- **Largura em % dentro de quem se ajusta ao conteúdo:** `max-w-full` num botão cujo pai tem a largura do próprio botão é cíclico e
  corta texto curto (o nome "Kairo FX" virou "Kair…" com espaço sobrando). Pai `flex min-w-0` e filho `min-w-0`, sem `max-w-full`.
- **Switch e Checkbox sem nome:** são `span role=...` do Base UI. Dentro de `SettingRow` (admin) ou `Row` (perfil) o rótulo da linha
  dá o nome (`kit/control-label.ts`). Fora delas, `aria-label`. Linha com vários checkboxes de rótulo próprio: não usar `SettingRow`.
- **Texto que repete o nome do coach:** montar com o helper (`askAi` em `lib/data/ai.ts`), nunca `Ask ${nome}`: o coach pode já ter
  chamado o assistente de "Ask Marco".

## 8. Performance

- `"use client"` só no componente que precisa de estado ou evento, não na página inteira.
- Sem barrel files (`index.ts` reexportando tudo): importam o módulo inteiro.
- Lista grande ou cálculo pesado: `useMemo` com dependências certas. Callbacks passados a listas memoizadas: `useCallback`.
- Imagens enviadas viram data URL (`lib/images.ts`); não renderizar a mesma imagem grande várias vezes em miniatura sem `loading="lazy"`.
- Animação por frame (drag, scroll) via `motion` values ou `transform`, nunca `setState` a cada movimento.

## 9. Código

- Estilo do repo: sem ponto e vírgula, linhas longas (220), funções nomeadas, comentário curto explicando o **porquê** no topo do
  componente, como já está nos arquivos.
- Classes condicionais com `cn()`. Variantes com `cva` só quando há 3 ou mais.
- Componente com mais de ~400 linhas ou com 3 responsabilidades: separar em arquivos na mesma pasta.
- Tipos: sem `any`; props de primitivo com `ComponentProps<typeof X>`.

## 10. Checklist antes de entregar

1. `npx tsc --noEmit -p .` (erros só em `.next/types` são antigos, das rotas /lab removidas).
2. `npx eslint` nos arquivos alterados.
3. Telas em 390, 768 e 1440px, claro e escuro, com teclado (Tab, Enter, Esc, setas).
4. Console sem erro de hydration (se o `next dev` ficar com SSR antigo, reiniciar o servidor).
5. Build só na cópia isolada (porta 3100+), nunca na pasta compartilhada.
6. Todo card do Admin com borda e fundo (seção 13).

## 11. Miniaturas (regras do Gustavo, 31/10)

Valem para todo widget e toda opção de estilo, existentes e novos, em todos os templates, claro e escuro.

- **Widget:** sempre `WidgetThumb` de `admin/design/thumbs/widget-thumb.tsx`. Nunca desenhar o widget à mão nem montar
  `WidgetFrame` direto: a miniatura usa `WidgetView` (`widgets/page-renderer.tsx`), o mesmo caminho da página do aluno e do
  canvas, então segue o tema do **rascunho** (cores via `ThumbStyles`, escolhas via `CoachContext`) e as mudanças do próprio
  widget (estilo, emphasis, header, conteúdo, layout, largura).
- **Onde aparece:** nos detalhes de um widget da galeria e nos layouts do inspector. A lista da galeria em si usa tiles de ícone (modelo Framer, decisão de 31/10), não o widget real.
- **Widget novo na galeria:** `galleryWidget(def)` (Compact, sem a linha de descrição). Se ficar com espaço vazio ou
  espremido, ajustar só ele em `THUMBS` (detail ou altura `h` para os longos) e conferir no olho. Widget novo no registry já
  ganha miniatura sozinho.
- **Padrão visual:** tile 2:1, margem de 6% da largura, widget inteiro (nada cortado), na própria altura, sem fundo nem sombra
  atrás. A mesma miniatura em 1 coluna (galeria) e 2 (layouts). Card em volta: `ThumbCard`, selecionado com `TILE_ON`.
- **Opção de estilo:** só tem desenho quando a diferença é de forma (Card, Shadows, Chart background, Layout); o resto é `Segmented` com palavras. Desenho: `OptionTiles` + uma arte de `option-art.tsx` (SVG 64×40). Cores só por `--a-page`, `--a-card`,
  `--a-accent`, `--a-on` e `currentColor` (vêm do tema do rascunho) e cantos por `useRx()`. Nunca hex fixo na arte. A borda
  do tile escolhido é a seleção do editor (`--ts-interactive`, branco no Design), não a cor do coach.
- **Performance:** a miniatura só renderiza quando chega perto da tela (`useSeen`). Não remover.
- **Conferir:** galeria de todas as páginas, "On this page", layouts no inspector, nos 3 templates em claro e escuro, e que
  mudar algo em All widgets ou no widget muda a miniatura.

## 12. Editor de Design: interface limpa (decisão de 31/10)

- **Uma cor de seleção só do editor:** branco (`--ts-interactive` vale `#f4f4f5` dentro do workspace). Nunca laranja nem a cor do
  coach para seleção, foco de tile, contorno do widget selecionado ou marcador de valor próprio. O painel é monocromático.
- **Inspector em três níveis:** Layout aberto (Size, Shows, Layout); Look fechado com resumo (Stand out, Card, Background); More
  style fechado dentro dele (Title, Bars, Numbers, Header). Coisa nova entra no nível mais fundo que fizer sentido.
- **Palavras simples, em inglês:** a plataforma toda é em inglês. Sem jargão de design no primeiro nível; dica no `title`, não em
  frase fixa embaixo do controle.
- **Galeria:** grupos → tiles de ícone; "On this page" é uma lista de nomes. **Barra de cima:** voltar, aparelhos, desfazer, ⋯,
  Preview, Publish; o resto vai no ⋯ (Reset, versões, template). Readability só aparece quando algo falha.

## 13. Cards e fundos (regra do Gustavo, 02/11)

Todo card do Admin tem **borda e fundo**, nunca só borda sobre o fundo da página.

- **Card ou painel no Admin:** `rounded-lg border bg-card` (cards grandes e de capa: `rounded-xl`). Vale para listas de linhas (`divide-y rounded-lg border bg-card`), caixas de configuração, cards de curso/gráfico/anúncio e blocos de formulário. Nunca `bg-background` num card (some no fundo da página).
- **Exceções com fundo próprio:** chip ou etiqueta pequena, grupo de segmented (`p-0.5`), campo de texto, área de soltar arquivo (tracejada), prévia em cor fixa.
- **Linha de lista dentro do painel do editor Design** (Pages, Menu, seções do curso): use `menuRow()` de `fields/menu-sort.tsx`. Item desligado = borda tracejada e nome riscado, não opacidade.
- **Card dentro de card:** o de dentro continua `bg-card` (fica igual); não invente outro tom.
- **Capa colada na borda do card do aluno:** a borda do card é um outline interno (`--card-edge`), então a capa pinta por cima dela. Use `EDGE_TOP` (capa em cima) ou `EDGE_LEFT` (capa ao lado) de `widgets/parts/shared.tsx` na caixa `relative` da capa; `CourseCover` já aplica (`edge="left"` para capa ao lado).
- Antes de entregar, procure cards sem fundo: `grep -rnE "rounded-(lg|xl) border( |\")" src/components/admin | grep -v "bg-"`.

### Espaçamento dentro do card de item (padrão de 02/11)

Vale para cards que mostram um item (post, gráfico, curso, transmissão): capa opcional, título, meta, texto, link e etiquetas.

- **Padding do corpo:** `p-4` (com capa: `px-4 pb-4`, e `gap-4` entre a capa e o corpo).
- **Entre os grupos:** `grid gap-3` no corpo. Os grupos são: cabeçalho (título + meta), texto, link, etiquetas. Não use `pt-1` nem `mt-*` para empurrar um grupo: o espaço vem do `gap-3`.
- **Cabeçalho:** título (`font-medium`) e meta (`text-xs text-muted-foreground`) juntos em `grid gap-0.5`; ações ou data à direita, `flex items-start gap-3`.
- **Texto:** `text-sm leading-relaxed text-muted-foreground` (`line-clamp-2` em lista).
- **Etiquetas e chips:** `flex flex-wrap gap-1.5`.
- Já seguem o padrão: ChartCard, anúncios do Community, cards de curso (Content) e transmissões (Livestreams). Card novo de item começa daqui.

## 14. Escala de texto (regra do review de 02/11)

Não crie tamanhos soltos. Use só estes: `text-xs` (12px), `text-sm` (14px) e os três micro-tamanhos já usados: `text-[0.6875rem]` (11px, só rótulos em caixa alta; o resto vira 12px pelo piso do tema), `text-[0.8125rem]` (13px, controles do editor) e `text-[0.875rem]` (14px, títulos de painel; o 15px saiu em 03/11). Abaixo de 11px o texto não é legível: não use. Se um tamanho novo for mesmo necessário, escreva o motivo aqui. Antes eram 14 tamanhos diferentes; o grep `grep -rhoE "text-\[[0-9.]+(px|rem)\]" src | sort | uniq -c` deve listar só os três acima, mais títulos grandes (1.375, 1.75, 2, 2.5rem).


## 15. Tamanho de arquivo (divisão de 02/11)

Um arquivo de componente passa de ~600 linhas? Divida por responsabilidade, sem mudar comportamento. Arquivos de dados (uma lista longa, como `registry-widgets.tsx`) são a exceção.

- **Editor Design, construtor de páginas:** `editor/page-builder.tsx` é só o canvas (`ArrangeCanvas`); a lógica de edição está em `use-arrange.ts`, o menu de contexto em `widget-menu.tsx`, o cartão da grade em `grid-widget.tsx` e o toaster do canvas em `canvas-toast.ts`. `page-builder` reexporta `useArrange`, `Arrange` e `Device`.
- **Widgets:** `widgets/registry.tsx` guarda os tipos e as regras (largura, altura, `lookOf`, `styleParts`). A lista de widgets mora em `registry-widgets.tsx`, os widgets das páginas (core) em `registry-core.tsx`. Widget novo entra em `registry-widgets.tsx` (ou em `catalog/more/registry`).
- **Journal:** `catalog/journal.tsx` (JournalPnl), `catalog/rules-followed.tsx` (RulesFollowed), peças em comum em `catalog/journal-shared.tsx`.
- **Aula do aluno:** `courses/student-lesson.tsx` monta a página; `lesson-player`, `lesson-tabs`, `lesson-quiz` e `lesson-side` (índice e AI) são as partes; `lesson-utils` tem `link`, `seek` e `toSec`.
- Ao dividir: mova por intervalo de linhas, exporte só o que outro arquivo usa, rode `tsc`, `eslint` e o rastreio de telas, e mantenha o caminho de import antigo reexportando.

## 16. Toque, texto e telas no celular (refinamento de 03/11)

- **Alvos de toque:** abaixo de 1024px (`max-lg:`) ou em tela de toque (`pointer-coarse:`), botão, campo, item de sidebar e aba têm no mínimo 40px. No admin isso vem do bloco no fim de `lib/theme/ts-system.ts` (tem de ficar por último, senão regras anteriores o sobrescrevem). Desktop não muda. Chips de filtro usam `max-lg:min-h-10`.
- **Card:** espaçamento interno por `--card-spacing` em `lib/theme/css.ts` (compacto 14, confortável 16). Não colocar `p-4` solto num card novo.
- **Texto:** piso de 12px; só rótulo em caixa alta (`uppercase`/`eyebrow`) fica em 11px. Tamanhos soltos no código: 12 (`text-xs`), 13, 14 (`text-sm`), 16 e 20. Não usar 15px nem 17px.
- **Capas de curso:** `CourseCover` usa `object-cover object-left`, porque o título fica na esquerda da arte.
- **Calendar:** abaixo de 640px o aluno vê Lista no lugar de Semana (a grade de 720px não cabe). O admin mantém a grade, porque lá se clica no horário.
- **Colunas que só cabem em tela larga:** no menu lateral aberto, `md:` (768px) não é largura de conteúdo de verdade. Mostrar a coluna extra só em `lg:`.
- **Carrossel horizontal no celular:** estender até a borda da tela (`max-sm:-mr-4 max-sm:pr-4`) para o card cortado indicar que há mais.
- **CSS global:** edição em `globals.css` às vezes não recompila no dev server. Preferir classes Tailwind ou `lib/theme/css.ts`.

## 17. Player de vídeo do Admin (regra de 10/11)

- **Um só player:** `AdminVideoPlayer` (`components/admin/ui/video-player.tsx`, exportado por `@/components/admin/ui`). Qualquer vídeo mostrado no Admin (aula, preview do aluno, gravação de live, novas telas) usa esse componente; não desenhar player, barra de progresso ou botão de tela cheia à mão.
- **Props:** `seconds` (duração), `poster` ou `background`, `resetKey` (muda quando outro vídeo ocupa o quadro), `startAt`, `controls` (false = só o quadro, para pôr marcadores por cima via `children`), `resumeKey` (guarda onde o espectador parou e abre ali, com "Resumed at 03:12 · Start over"), `chapters` (marcas na barra, nome na prévia e ao lado do tempo), `next` (cartão "Up next" com contagem de 5 s ao fim), `onProgress(seconds)` (pausa, salto e fim). A proporção vem do `className` (`aspect-video`, `aspect-[2.72]`...); o componente reserva esse espaço mesmo quando o vídeo vira mini player.
- **Adaptadores:** quem tem um modelo próprio faz um wrapper fino (`PlayerFrame` em `content/course-parts.tsx` traduz aula e curso: duração, miniatura, capítulos, próxima aula e chave de retomada). Nunca copiar a lógica do player.
- **O que ele traz:** play e pausa (clique na imagem, Espaço, K), tempo e barra (arrastar, setas, Home, End, J e L) com prévia ao passar o mouse (quadro, tempo e capítulo), toque duplo nas laterais para pular 10 s (ondulação), volume (botão, barra ao passar o mouse, M, ↑ e ↓), legendas (C), engrenagem com velocidade, qualidade, volume e lista de atalhos (< > e ?), tela cheia (F, duplo clique no meio; API nativa e, se falhar, painel por cima), mini player simulado (I, botão; flutua no canto e o lugar fica marcado), carregamento simulado, aviso curto do que a tecla fez e, em tela cheia, barra que some após 2,4 s parado. Preferências em `proto:player-prefs`, posições em `proto:video-resume`.
- **Dados:** velocidades, qualidades, idiomas, falas de legenda de exemplo, lista de atalhos e as funções de retomada ficam em `ui/video-player-options.ts`; na V1 só esse arquivo troca por dados reais. Menus em `ui/video-player-menu.tsx`, ondulação e "Up next" em `ui/video-player-parts.tsx`. Os menus ficam dentro do quadro (não em portal), para valer em tela cheia.
- **Teclas do player são do player:** o Admin tem atalhos de uma tecla (C abre New course); o player para a propagação das teclas que usa.
- **Performance:** tempo, barra, prévia e legenda são escritos por ref (`transform` e texto), sem renderizar a cada quadro; só `transform` e `opacity` animam; movimento reduzido tira as transições.
- **Ao vivo:** `live` (e `liveLabel`, por exemplo o tempo de transmissão) troca a barra e o tempo por um marcador LIVE (vira "Back to live" ao pausar); sem pular, velocidade, retomada, capítulos nem "Up next". Volume, legendas, qualidade, tela cheia e mini player continuam. A prévia do estúdio de livestream usa essa variante.
- **Teclas de letra** (C, M, F, I, K, J, L, ?, < >) funcionam com o foco em qualquer controle do player; espaço, enter e setas ficam com o botão ou o controle focado. Botão que fica desabilitado ao ser clicado tira o foco do player: usar `aria-disabled`.
- **Ainda fora do padrão:** a miniatura do vídeo de boas-vindas nas configurações.

## 18. Currículo do curso: seleção, busca, desfazer (regra de 10/11)

- **Seleção em massa:** caixa no canto da miniatura (aparece ao passar o mouse ou focar; sempre visível em tela de toque), tecla X na aula focada, ou "Select lessons" no menu do módulo. Com aulas marcadas, o clique no card marca em vez de abrir, e a barra `LessonSelectionBar` (Move to, Hide, Delete, limpar) aparece embaixo; Esc limpa. A barra é uma região viva que anuncia a contagem.
- **Busca:** o campo aparece em cursos com 8 aulas ou mais; filtra por título, esconde módulos sem resultado, mostra "n of N lessons" e um estado vazio com "Clear search". Durante a busca o arrastar e Alt + setas ficam desligados (a ordem exibida não é a real).
- **Desfazer:** toda mudança do currículo passa por `undoable()` (mover aula ou módulo, renomear módulo, apagar, ações em massa) e usa um único toast (`UNDO_TOAST`): uma nova mudança substitui o aviso anterior, então Desfazer sempre volta a última coisa. Títulos de aula salvos ao digitar usam `useRenameUndo` (aviso ao sair do campo com nome novo).
- **Teclado:** Alt + ← → move a aula, X marca; o card mostra a dica ao receber foco por teclado (`aria-keyshortcuts` também).
- **Escolhas do espectador que ficam entre visitas:** `useStoredChoice` (`lib/use-stored-choice.ts`, sem erro de hidratação) guarda a visão grade ou lista do Content em `proto:content-view`.
- **Agendar:** o Review and publish usa data e hora nativas (`type=date` e `type=time`, tema escuro), com o dia mínimo hoje; passado bloqueia o botão e avisa. O curso guarda `scheduledAt` (local) e `scheduledFor` (rótulo "Thu 29 Oct").

## 19. Ordenar à mão: o padrão do Sortable row (alinhado em 10/11)

- **Referência:** `Admin / Sortable row` (Figma 748:38223) e Design → Menu (`menu-sort.tsx`). Toda lista ordenada à mão usa as peças de `ui/reorder.tsx`: `ReorderHandle` (a alça é um botão: arrastar, ou focar e usar as setas), `SortHint` (frase que a alça aponta com `aria-describedby`) e `useMoveFeedback` (o item que mudou mostra a borda ativa por ~1 s e um `role=status` diz a posição a leitores de tela).
- **Estados do item:** repouso (alça e menu em terciário), hover (fundo suave, alça sobe para primário), ativo/selecionado (borda laranja, fundo `a-muted`), arrastando (borda laranja, fundo mais forte; nas miniaturas, borda laranja e 60% de opacidade), desabilitado (40%). Aula selecionada e aula recém-movida usam a mesma borda laranja do estado ativo.
- **Onde cai:** `dropLine` (linha fina no vão, nunca a borda do item); `axis="x"` é a linha vertical para grades de cards. Soltar leva o lugar do item alvo: arrastar para frente cai depois, para trás cai antes. A linha mostra o lado certo.
- **Teclado:** alça focada + setas (↑ ↓ nas listas; ← → ↑ ↓ na grade de aulas). O foco continua na alça depois de mover. Alt + ← → no card da aula e X para selecionar seguem valendo.
- **Desfazer:** cada movimento é uma mudança só, com um único aviso "Undo" (`UNDO_TOAST` no currículo; `quiz-undo` nas perguntas).
- **Onde já vale:** módulos e aulas do currículo, perguntas do quiz (as linhas fechadas são `SortableRow` com `handle`). Novas listas ordenáveis usam `SortableRow handle={...}`; não inventar outra alça.

## 20. Students: lista, seleção em massa, drawer e modais (regra de 10/11)

- **Referência:** Figma 518:7152 (01 List, 02 Selected, 03 Profile, 04 Import or invite, 05 Message, 06 No results, 07 Activity, 08 Notes). Código em `students/`: `students.tsx` (lista), `student-profile.tsx` (drawer), `import-dialog.tsx`, `student-message.tsx`.
- **Barra de seleção:** com linhas marcadas ela toma o lugar da toolbar (mesmo lugar, 48px, `role=region` "Selected students"): checkbox que limpa, "{n} selected", link "Select all {total}" (só enquanto faltar gente; vale para todas as páginas), Send a message, Move to tier, Add to group, Export, X. Mudar filtro ou busca volta à página 1.
- **Sem resultados:** `EmptyState` repete o termo buscado (“…”), oferece "Clear filters" (só se há filtro) e "Invite a student".
- **Drawer do aluno** (`AdminDrawer`, 540px, corpo `gap-5`): cabeçalho (avatar 40, nome Heading L, e-mail · joined/invited), três métricas com divisores, `Callout` do motivo (danger se vermelho, warning se amarelo, com menu "Review"), `AdminUnderlineTabs` Overview / Activity / Notes (sempre abre em Overview), rodapé Pause access (danger, vira "Resume access") · Open journal · Send a message (no celular a primária vai para a primeira linha, largura total).
- **Linha rótulo/valor** (`Row`): em repouso é texto puro como no Figma; quando dá para mudar (tier, grupo, extra access), o valor é um botão que abre menu, com fundo só no hover/foco. Alvo de toque 40px.
- **Activity:** eventos com `StepIndicator` (erro para falha de pagamento) e o gráfico de 12 semanas, com as 3 semanas mais cheias em laranja; aluno que nunca entrou mostra frase em vez de gráfico inventado.
- **Notes:** nota privada com ⌘/Ctrl+Enter e botão Add note dentro do campo (sem mexer o layout), notas fixadas embaixo; vão para `useCommunityData("student-notes")`.
- **Importar:** três passos (Choose, Check columns ou Access, Invite). Planilha: tabela de colunas com selects (exige uma coluna E-mail; duas colunas com o mesmo destino avisam e bloqueiam); lista de e-mails e link usam Tier e Group. No celular a coluna Example some para o select caber.
- **Mensagem:** chips dos destinatários que se tiram (a partir de 2), Subject, Message ({first} vira o primeiro nome), canais em rádio (Discord só liga se todos têm Discord ligado), "Send to N", ⌘/Ctrl+Enter envia de qualquer ponto do modal.
- **Ícone Blocked:** o "Not available" do Carbon são dois traços; `Blocked` agora é círculo com barra desenhado na mesma grade de 32px e traço 2.

## 21. Tabelas, Calendar e Community (regra de 10/11)

- **Tabela:** toda tabela do Admin é `AdminTable` (ou `ui/table.tsx`, o mesmo visual para telas escritas como `<Table><TableHeader>…`): painel com raio e corte, cabeçalho de 32px (mono 10px), linhas com 1px acima e hover, rolagem lateral em vez de espremer. `Table bare` quando o pai já é o painel. Nada de `<table>` solta nem de `@/components/ui/table` no Admin.
- **Toolbar:** `AdminToolbar` tem `min-w-0`; sem isso uma linha de abas larga estoura a tela dentro de um grid.
- **Calendar** (Figma 532:7850): `calendar/calendar-views.tsx` tem a semana (56px por hora, eventos recuados 4px, evento de 30 min mostra só o título, eventos que se cruzam dividem a coluna, linha do agora na coluna de hoje) e o mês. É separado do `CalendarSurface`, que continua sendo só do aluno. Tipos: live laranja, 1:1 verde, notícia vermelha, chamada em grupo e workshop neutros (barra de 2px à esquerda e fundo suave). O formulário de evento é modal (`OptionCard` por tipo, Who can join, Starts, Length, Reminders; o resto fica em "More options"). Availability: horas por dia (editor aberto ao clicar nas horas ou em "+ Window", fim antes do início avisa), Call settings, linha com os próximos horários. News: tabela com filtros de impacto e período, o interruptor No trade não abre o drawer. Chamada 1:1: drawer de 440px com quando, onde, pergunta, chamadas do mês e Reschedule/Cancel/Start.
- **Community** (Figma 534:7152): abas `AdminTabs`; Announcements em tabela com menu "⋯" (fixar, apagar); New announcement é um drawer de 480px (Who gets it, When, Post in, Pin); Spaces é lista ordenável com `SortableRow` (arrastar, ou alça + ↑ ↓, com desfazer), tag de quem vê e contagem de posts, ao lado do painel de regras (clicar edita, regra vazia some); Discord: aviso de conectado com Review, papel por tier (sem papel por padrão) e o que o bot posta; desconectado mostra o estado vazio com "Connect Discord".

## 22. Journal & feedback (regra de 10/11)

- **Referência:** Figma 525:7152 (01 Requests, 02 Answer, 03 Recording, 04 Answered, 05 Rules, 06 New strategy, 07 Nothing waiting). Código em `journal/`.
- **Requests e Answered:** `AdminTable` com Student, Question, Trade (o R em verde ou vermelho), Rules, Waiting e o botão Answer; Answered troca por Your answer (texto, nota de voz, vídeo…), Status (Seen / Not seen yet), Sent e o menu "⋯" (abrir, lembrar quem ainda não viu). Filtros: busca, Tier e Sort em Requests; busca, Type e período em Answered. Sem pedido na fila: estado vazio com "See answered" e "Journal rules", e o número Waiting diz "All caught up".
- **Página de resposta:** não tem botão Voltar (como no Figma). Abrir um pedido põe `?request=` na URL: o Voltar do navegador e o Esc trazem a lista. Gravar vídeo ou voz mostra só Skip e Next request no topo; os botões do rodapé quebram linha no celular.
- **Rules:** esquerda, "Who gets the journal" (Everyone, Paid tiers, Pick tiers com caixas por tier), "Required for every trade" (um interruptor por linha) e Tags (New tag com campo na hora); direita, "Strategies and their rules" com cartões (nome, Kept %, menu "⋯", regras com marca). New strategy é modal (nome, Who sees it, regras; "Remove rule" tira a última).

## 23. Downloads (regra de 10/11)

- **Referência:** Figma 532:7152 (01 List, 02 Upload a file, 03 No files yet). Código em `downloads/downloads-admin.tsx`.
- **Lista:** abas All (com o total), Indicators, Templates, Tools (checklists, planos e outros) e Lesson files; as linhas de arquivo de aula vêm do Content (somente leitura: o menu "⋯" só tem "Open in Content"). Colunas: arquivo (ícone, título, tipo), Category, Version, Who gets it, Updated (relativo, a data inteira no `title`), Downloads. Menu "⋯" nos arquivos próprios: Edit e Delete com desfazer. O rodapé diz de onde vêm os arquivos de aula.
- **Módulo desligado:** aviso `Callout` warning com "Review", que leva ao Design. Sem nenhum arquivo: estado vazio com "Upload a file".
- **Upload e edição:** drawer de 480px. Primeiro o arquivo (`Dropzone`, depois `FileItem` "Completed" com lixeira para trocar), depois título, descrição, categoria e versão, e Who gets it (Everyone ou Pick tiers, que exige um tier) com Notify students.

## 24. Livestreams (regra de 10/11)

- **Referência:** Figma 533:7152 (01 Coming up, 02 Schedule, 03 Connect OBS, 04 Live, 05 Save as a lesson, 06 vazio). Código em `livestreams/`.
- **Lista:** destaque do próximo (ou do que está ao vivo) com "Next live · in 2 h 14 min", quantos disseram que vão, o último ao vivo, Open studio, Copy the link e Edit; abas Coming up, Live now e Recordings (cada uma com a sua tabela de linhas de 53px, e a de gravações com "Save as a lesson"). O menu "⋯" abre o studio, copia o link, edita e apaga (com desfazer; só quem ainda não começou).
- **Agendar e editar:** o mesmo modal de 560px (título, o que é, onde aparece, quem pode ver, início, duração, "Add it to a course as a lesson"). "Pick tiers" exige um tier. `Livestream` ganhou `planned`, `where` e `lesson` (todos opcionais; o lado do aluno não os usa).
- **Studio:** três estados na mesma página, com seta de voltar e a etiqueta de estado no topo. Antes: prévia "Looking for OBS…" e o painel Connect OBS (servidor, chave com olho, copiar, "New key", Check the connection); Go live só liga com OBS conectado. Ao vivo: player, três números (assistindo, pico, mensagens) e o chat de 380px. Depois: gravação (some o botão enquanto processa), números e chat replay.
- **Save as a lesson:** modal de 520px (curso, módulo, título, chat replay); salvar põe uma aula em rascunho no módulo e a linha da gravação passa a dizer "Lesson in {curso}".

## 25. Charts (Figma 533:8375)

- Lista: Callout de aviso quando o módulo Charts está desligado (link "Review" para Design), abas "Your charts" / "Settings", busca de 220px, grade de cards. Estado vazio mantém as abas para a Settings continuar acessível.
- `ChartCard`: capa de 200px com gráfico desenhado em SVG (velas e volume determinísticos por id, linhas de nível); tag "Pinned"; menu ⋯ com Pin, Open TradingView e Archive (com Undo). Tags: símbolo, intervalo (`CoachChart.interval`), "N levels" e quem vê. Título em `h2` (ordem de headings do axe).
- `NewChart` (modal 640): título obrigatório, símbolo/timeframe, níveis (Support/Resistance/Target + nome + preço), nota, quem vê (Everyone ou Pick tiers, exige ao menos um tier), link do TradingView. O card novo entra logo abaixo dos fixados.
- Settings: Default watchlist (tags removíveis + Add), Markets you trade, chart type, Timeframe (mantido, não está no Figma), Indicators, Who sees it. Persistido por `useCommunityData`.
- Removidos: preview ao vivo do TradingView e setas de reordenar a watchlist.

## 26. AI assistant (Figma 534:8164)

- Cinco abas (`AdminTabs`): Personality, Knowledge, Features & quotas, Test & correct, Questions (1.4k). Cabeçalho com tag V2, "Test it" (abre a aba de teste) e "Publish changes".
- Personality: só aqui aparece o `StatPanel`; "Corrections" = 12 + correções salvas. Tone e Answer length são `AdminSegmented`; "Never talk about" são tags removíveis + Add (sem duplicados, Esc cancela). Foi retirado o aviso "Always on, can't be changed" porque não está no Figma.
- Knowledge: `AdminTable` (Source / Status / Updated / Use it). Ligar uma fonte mostra "Learning…" por ~2 s e depois "Learned". Upload por botão ou arrastar; acima de 50 MB é recusado com aviso. Arquivos enviados ficam salvos.
- Features & quotas: colunas são os tiers pagos. Número vira input ao selecionar (vazio = —, 0 = Unlimited). "Answer questions" grava em `ai.quotas`, que o chat do aluno lê; as outras linhas gravam em `ai.limits`.
- Test & correct: conversa com resposta seed (CPI), "Good answer", "Correct it" (Ctrl/⌘+Enter salva) e lista "Your corrections" ao lado.
- Questions: tabela de histórico com `CellPerson` e `Tag` de resultado. Usa `AdminTable scrollLabel` (região rolável focável para o teclado).
- Dados: `AI_FEATURES`, `AI_LIMITS`, `AI_KNOWLEDGE`, `AI_QUESTIONS` em `lib/data/people.ts`; `AiSetup` em `lib/data/ai.ts` (`never`, `on`, `limits`, `uploaded` novos; `avoid` e `features` antigos saíram).

## 27. Sales & payments (Figma 535:7152)

- Oito abas (`AdminTabs`): Overview, Tiers & prices, Groups, Access, Sales page, Coupons, Transactions, Payouts. As ações do cabeçalho seguem a aba (Sales page + New tier; New group; Reset to template + Open page; New coupon; só Sales page). Os botões "New …" do cabeçalho avisam a aba por um contador (`newSignal`).
- Sem tier grátis (decisão do Flavio, nota do Figma): as abas listam só os tiers pagos (`isFreeTier`); o tier de R$0 continua nos dados.
- Tiers: cards de preço, "Most popular" com borda laranja, ⋯ (editar, preview como o tier, destacar, esconder). O tier abre numa gaveta `AdminDrawer` com abas Plan e Sales page; cursos gravam direto no Content, as linhas da página de vendas só ao salvar.
- Groups: tabela; a gaveta do grupo tem "When courses open" (regra por curso, grava direto no Access).
- Access: uma grade conteúdo × tier com bolinhas (`role=checkbox`). Cursos gravam no catálogo; features em `access.features` (`ACCESS_FEATURES`). Overrides por módulo deixaram de ter tela.
- Sales page: lista de blocos com arrastar, ⋯ (mostrar/esconder, mover, remover com Undo), "+ Block" recoloca blocos removidos; a prévia é a página real em iframe e o bloco editado ganha borda tracejada. "Reset to template" tem Undo.
- Coupons: tabela, ⋯ (copiar, pausar, apagar com Undo), modal com validações. Formato novo `Coupon` em `lib/data/people.ts`, guardado em `coupons-v2`; o checkout lê o mesmo formato (`couponLabel`, `couponEnded`).
- Transactions: filtros com contagens do mês, busca, mês, Invoice ou "Answer the dispute"; o ⋯ (tentar de novo, reembolsar) ficou além do Figma.
- Payouts: conectado (métricas, conta, histórico) ou o passo a passo de 3 etapas (`payouts-v2`) com aviso do que fica bloqueado.

## 28. Partners (Figma 537:7152)

- Duas abas com contagem (`Offers 3`, `Affiliate program`). Cabeçalho: Offers → "Add my own link" + "Add from catalogue"; Affiliate → "Save".
- Offers: cards com logo (cor por tipo), nome, interruptor, texto, tag de quem vê e cliques. Clicar no nome abre o editor (modal com validação, Remove com Undo). Catálogo: busca, linhas com "Added" ou "Add".
- Affiliate program: o rascunho só vale com "Save" (sem mudança: "Nothing to save"); desligado mostra o estado vazio com "Turn on the program" (grava na hora). `AffiliateProgram.share` é novo.

## 29. Ranking (Figma 537:7989)

- Leaderboard: período em `AdminSegmented`, filtro de grupo, tabela com o rodapé; Competitions: cards (estado calculado por data, `competitionState`, "hoje" do protótipo é `RANK_TODAY`); modal de criar/editar (competição encerrada abre só para ver); Points & badges: pontos clicáveis, liga/desliga por ação, "New badge".
- A escolha global "o que ranqueia" e o apelido global saíram da tela: cada competição tem o seu critério e o seu apelido. `normalizeRanking` troca dados salvos no formato antigo. O aluno vê a próxima competição se nenhuma estiver rodando.

## 30. Settings (Figma 538:7152)

- Já seguia o menu em grupos; ajustados o campo com prefixo/sufixo (`Affix`, 44 px), o alinhamento do General, a altura das linhas de uma linha (53 px, `DataCard rowHeight`) e o Welcome em uma linha.
- General e Web address agora salvam (`general`, `web-address`). Tabelas rolantes sem nada focável levam `scrollLabel`.

## 31. Onboarding (Figma 939:59751, seção "sign up"; substitui o fluxo 521:7152 desde 12/11)

- Cadastro em `app/(onboarding)/signup`: Log in, Create account, Verify (6 caixas), About you (chips, tudo opcional), Name your platform (nome, como os alunos chamam, idioma, termos). A moldura é `SignupFrame` (coluna de 742 px, cartão de 600, ilustração à direita a partir de 1024; `action` põe um botão na barra e `aside` troca a ilustração). `call` e `welcome` redirecionam para About you.
- Name your platform cria a plataforma em rascunho (`setup-community.ts`: status "setup", endereço sugerido, catálogo vazio, look das respostas) e abre `/admin/<slug>/getting-started`, que substitui o Overview no menu enquanto ela é rascunho.
- Getting started: cinco itens (Design, curso, tier, payouts, legal) e Go live (`TimelineStep` em `admin/ui`). Go live confirma o endereço e publica; You're live abre com `?live=1` (link para copiar e convites por e-mail em chips).
- Design (`/setup`, `onboarding/design-setup.tsx`): Brand, Look e Layout no mesmo rascunho do editor Design; à direita a plataforma real num iframe em escala (esqueleto no passo Brand). Finish marca `setup.design`.
- Tours (`admin/tour`): o passo mostrado é o ÚLTIMO cujo alvo `data-tour="…"` está na tela; condições ficam em atributos (`data-picked`, `data-named`, `data-state`, `data-ready`, `data-complete`) e no seletor. Pausar (Skip ou Do it later) guarda onde parou; Getting started mostra "Paused at …" e Resume. O último passo marca o item. Ao mexer em telas com alvo de tour, manter os atributos `data-tour`.
- O wizard antigo (`onboarding/wizard.tsx`, `steps.tsx`, `/setup/invite`, `/setup/publish`) não é mais usado pelo fluxo; as dicas antigas (`SetupTip`) de curso, tier e payouts não aparecem mais (o tour cobre).
