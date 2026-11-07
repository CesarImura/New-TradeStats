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
