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
| `src/components/admin/ui/` | **Kit do Admin e do Editor** (componentes `Admin / *` do Figma: `AdminButton`, `AdminField`, `Panel`, `Tag`, `AdminModal`…), com barrel `index.ts` | Componente reutilizável novo do Admin ou do Editor vai aqui. Cite o nome do Figma no comentário do arquivo ("Admin / Page header") para o mapa `docs/maps/components.md` marcar como confirmado. |
| `src/components/admin/kit.tsx` | Peças de página do admin (o nome "kit" é histórico): `PageHeader` com vídeo, `Page`, `NativeSelect`, `SettingRow`, `Field` (reexport de `AdminField`) | Tela nova do admin começa por elas. Não é o kit de componentes: esse é `admin/ui/`. |
| `src/components/widgets/` | Raiz: `registry.tsx` (catálogo e settings), `page.tsx`, `page-renderer.tsx` (`WidgetGrid`, desenha a página) e `page-grid.ts` (os cards do desktop: `toTiles`, `planTiles`, `resizeCard`, `dropAt`, `removeCard`, `fillGaps`…, puro). `parts/`: o kit dos widgets, um assunto por arquivo: `frame.tsx` (`WidgetFrame`, `useFrame`, `useMore`), `tokens.tsx` (`FX`, `TYPE`, `ACCENT`, `MOTION`, `fill`, `series`), `card.tsx` (`W`, `Drop`, `useFitRows`, `Head`, `Big`, `Row`), `bits.tsx` (chips, avatar, `Tip`, `useBrokenImage`), `charts.tsx` (`Bars`, `Spark`, `Ring`…), `anatomy.tsx` (`WCard`, `Num`, `Chip`, estilos do Look), `visuals.tsx` (`Legend`, `TickGauge`, `StepChart`, `Timeline`…), `shared.tsx`, `widget-scope.tsx`, `layouts.tsx`. `catalog/`: um arquivo por grupo de widgets (`catalog/more/` para os extras); os de mídia em quatro: `media-data.ts` (dados), `poster.tsx`, `shelf.tsx`, `featured.tsx` | Usar a skill `traderhub-widget-design` antes de mexer. Widget novo vai em `catalog/` e entra no `registry.tsx`. |
| `src/components/admin/design/` | Editor de Design. `editor/`: casca, canvas, prévia (`page-builder.tsx`, `editor-shell.tsx`…). `panels/`: painéis laterais (`builder-panels.tsx` galeria, `widget-inspector.tsx` inspector da direita, `settings-panel.tsx`, `media-cards-editor.tsx`). `fields/`: campos e controles (`controls.tsx` com `Row`, `InspectorSection`, `YesNo`; `design-fields.tsx`, `menu-sort.tsx`…). `thumbs/`: miniaturas (`widget-thumb.tsx` dos widgets, `option-art.tsx` das opções de estilo). Raiz: dados (`looks.ts`, `options.ts`, `states.ts`) | Campo novo em `fields/`, painel novo em `panels/`, miniatura em `thumbs/` (ver seção 11). |
| `src/components/icons.tsx` | Todos os ícones (Carbon embrulhado com nomes do lucide) | Nunca importar `lucide-react` ou `@carbon/icons-react` direto. Ícone que falta: adicionar aqui. |
| `src/lib/theme/` | Tokens, `themeToCss`, contraste | Cor nova vira token, não hex solto no componente. |

**Não sobrescrever em `src/components/ui/`** (arquivos nossos dentro da pasta do CLI): `animated-accordion.tsx`, `ping-dot.tsx`, `trap-tab.ts` e o `select.tsx` próprio (ver §2), além das customizações já listadas. O `components.json` diz `iconLibrary: "lucide"` porque o CLI não tem opção Carbon e o projeto não tem `lucide-react`: todo componente vindo do CLI precisa ter os ícones trocados por `@/components/icons` antes de salvar.

Mapas Figma × código: `docs/maps/` (componentes, telas, tokens, changelog). Textos de interface: skill `tradehub-textos` e `node scripts/maps/copy-scan.mjs`.

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

- **Seleção do editor (decisões de 13/11 e 14/11):** laranja do Admin (`border/active`, `--ts-interactive` no workspace) em tudo: controles
  do painel e do inspector **e** as marcas sobre o canvas (contorno do widget selecionado, cantos, áreas de soltar, etiqueta de regra). Em 14/11 o
  Gustavo trocou o contorno branco pelo laranja, como no Figma. O contorno mantém a borda escura fina por fora para ler sobre páginas claras.
  Nunca a cor do coach para seleção da interface.
- **O editor usa o kit do Admin (`components/admin/ui`)**: AdminButton, AdminFilter, AdminSegmented, AdminTabs, AdminField, Tag, Panel, Menu
  e os tokens `a-*`/`t-*`, na fonte do Admin (Inter e Space Mono). Nada de cor, texto, espaço ou raio solto em `admin/design`, exceto o cinza do canvas (`editor/canvas-bg.ts`), os chips do
  editor sobre o canvas, a arte das miniaturas, o seletor de cor e as paletas de dados. As variáveis da moldura não descem para `.hb-canvas` e toda regra nova mantém a exclusão `:not(COACH)`.
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

**Editor de Design (desde 14/11):** não usa `text-xs`/`text-sm` nem os micro-tamanhos; só os estilos do Admin: `t-caption` (12), `t-body-m` (13), `t-body-l` (14) e as versões `-medium`, `t-heading-s` nos títulos de painel, `t-mono-label-s` nos rótulos de seção e `t-mono-data` nos códigos hex. Rótulo de campo = `t-caption-medium` primário. Exceções: a arte das miniaturas e os chips do editor sobre o canvas.

## 15. Tamanho de arquivo (divisão de 02/11)

Um arquivo de componente passa de ~600 linhas? Divida por responsabilidade, sem mudar comportamento. Arquivos de dados (uma lista longa, como `registry-widgets.tsx`) são a exceção.

- **Editor Design, construtor de páginas:** `editor/page-builder.tsx` é só o canvas (`ArrangeCanvas`); a lógica de edição está em `use-arrange.ts`, o menu de contexto em `widget-menu.tsx`, o cartão da grade em `grid-widget.tsx` e o toaster do canvas em `canvas-toast.ts`. `page-builder` reexporta `useArrange`, `Arrange` e `Device`.
- **Widgets:** `widgets/registry.tsx` guarda os tipos e as regras (largura, altura, `lookOf`, `styleParts`). A lista de widgets mora em `registry-widgets.tsx`, os widgets das páginas (core) em `registry-core.tsx`. Widget novo entra em `registry-widgets.tsx` (ou em `catalog/more/registry`).
- **Journal:** `catalog/journal.tsx` (JournalPnl), `catalog/rules-followed.tsx` (RulesFollowed), peças em comum em `catalog/journal-shared.tsx`.
- **Aula do aluno:** `courses/student-lesson.tsx` monta a página; `lesson-player`, `lesson-tabs`, `lesson-quiz` e `lesson-side` (índice e AI) são as partes; `lesson-utils` tem `link`, `seek` e `toSec`.
- Ao dividir: mova por intervalo de linhas, exporte só o que outro arquivo usa, rode `tsc`, `eslint` e o rastreio de telas, e mantenha o caminho de import antigo reexportando.

## 16. Toque, texto e telas no celular (refinamento de 03/11)

- **Alvos de toque:** abaixo de 1024px (`max-lg:`) ou em tela de toque (`pointer-coarse:`), botão, campo, item de sidebar e aba têm no mínimo 40px. No admin isso vem do bloco no fim de `lib/theme/ts-system.ts` (tem de ficar por último, senão regras anteriores o sobrescrevem). Desktop não muda. Chips de filtro usam `max-lg:min-h-10`.
- **Sidebar do admin (aberta e fechada):** `shells/admin-shell.tsx` (`DesktopSidebar`, `NavLink`). Só no desktop (xl); o drawer nunca fecha. O tamanho fica em `localStorage["admin:sidebar"]` e em `<html data-admin-sb>`, que o `app/layout.tsx` põe antes do primeiro paint (nada de `<script>` dentro de componente client: o React reclama na navegação client-side). O CSS da versão fechada usa variantes `[html[data-admin-sb=collapsed]_.admin-side_&]:`, então a página não carrega larga e depois pula. Só a largura anima (200ms ease-out); o ícone não muda de lugar porque o padding do card e o do item trocam juntos. Itens fechados 40x40 com tooltip à direita; o Tooltip fica sempre montado (`disabled` quando aberta) para não remontar os links na troca.
- **Altura da sidebar (19/11):** o Figma desenha a sidebar para 1080 de altura (Nav 732 = 16 itens de 36 + 3 rótulos de 40; 18 de espaço entre logo e nav; Invite card 116; Workspace switcher 48, raio 12, contorno 1px branco a 14%). Gustavo decidiu (19/11): a sidebar nunca rola. A altura do item vem de `--sb-h` (aberta, máx. 36) e `--sb-hc` (fechada, máx. 40), definidas em `DesktopSidebar` (e no drawer) como `clamp(22px, (100svh - 257px) / 17.5, 36px)`: 16 itens + 3 rótulos + gaps pedem 17,5 x item + 104 px, e card, logo e switcher 153 px; o rótulo de grupo usa metade do item de respiro em cima, o indicador laranja 22% do item. Tamanho cheio a partir de ~880px de altura; abaixo disso tudo encolhe junto, até 22px (~620px). Abaixo de 620px os nomes de grupo somem (sobra 8px entre grupos) e cabe até ~520px. O Invite card só aparece com 1010px ou mais. A barra de rolagem do nav fica oculta (a clássica do Mac ocupava ~15px e empurrava o badge Soon para cima do rótulo); roda, trackpad e Tab ainda rolam. O raio do Workspace switcher usa `rounded-a-lg!`: o `cn()` não conhece `rounded-a-*` e o `rounded-md` do `SidebarMenuButton` vencia (6,4px em vez de 12). Mesmo cuidado para qualquer `rounded-a-*` passado a componentes do shadcn.
- **Overview › Content › Questions (19/11):** as abas Courses e Questions ficam na mesma célula de grid (`col-start-1 row-start-1`, a inativa com `invisible` + `inert` + `aria-hidden`), então o card tem sempre a altura da aba mais alta (347 a 1920) e trocar de aba não move a página; abaixo de 680px de largura do card a aba inativa some (`hidden`) para não deixar vazio. Com perguntas em aberto (`OPEN_QUESTIONS` em `overview.tsx`, 4 linhas: avatar, pergunta, aluno · curso · aula · hora, botão Answer que abre Content) as linhas dividem a altura como as de Needs you today; sem perguntas, estado vazio compacto na altura toda. Plataforma nova: "No questions yet. They show once students ask in a lesson."; comunidade com tudo respondido: "No open questions in your courses right now.". Figma: Overview 01d (Questions · perguntas em aberto) e 01e (Questions · vazio), na coluna da 01 depois da 01c.
- **Overview 1:1 com o Figma (19/11, medido a 1920):** `Tag` agora é Micro 11/14 Regular, 22px de altura, padding 4/8 (era 12 medium, 20px); stats do banner Next live em 20px (`t-data-m`) com 8px a mais acima; `AdminPageHeader` do Overview com 6px entre título e subtítulo (nas outras telas segue 8); header do Needs you today com 49px; botões das linhas de Needs you today e de Questions com 106px de largura (Figma); gráfico dos cursos com `min-h-[120px]`. Resultado: Lower section começa em 785 e mede 347, linhas de Needs 68/68/68/56, como no Figma. Nos botões, alvo de toque de 40px já vem de `pointer-coarse:min-h-10` (só em dispositivo de toque). Banner Next live: sem divisórias verticais entre as stats (no Figma o `Divider title` está oculto), espaço de 32px entre elas. Datas do gráfico no Figma (eixo e tooltip) passaram a 14 Oct a 12 Nov (hoje = 12 Nov 2025), iguais ao código. Diferenças conhecidas e aceitas: larguras de texto 4–8% maiores no Figma (fonte substituta), rótulo −31% do gráfico 7px mais à direita no código, "Go live" com texto a 96% só no Figma (o token é branco 100%).
- **Notificações vazias (20/11):** sem nenhuma notificação (plataforma nova ou tudo limpo) o painel do sino mostra só o cabeçalho (sem tag "new", Mark all read desabilitado) e um `EmptyState` com ícone de sino, "You're all caught up", "Payments, requests and live reminders show up here." e o botão Notification settings (a ação mora no Empty state, então o rodapé some); sem abas nem lista (331px de altura, igual ao Figma 02b). Com itens e um filtro sem resultado: "Nothing in Payments right now.". Movimento: o painel abre em 200ms ease-out (opacidade + scale .97 + 4px, origem no sino), fecha em 150ms; o ponto do sino e as linhas lidas trocam de cor/opacidade em 200–300ms ease-out; reduced motion corta tudo.
- **Settings › Notifications (20/11, quatro blocos):** aba no grupo "Your business", entre E-mails e Legal pages (`settings/settings-notifications.tsx`, tab `notifications`). Blocos (decididos a partir de `docs/notificacoes-pesquisa-2026-11-20.md`): **Always on** (Security, Plan and invoices, Payouts: só leitura, com cadeado, não dá para desligar: mensagens de serviço); **Activity** (Payment failed, New sale, Livestream reminder, Upload finished, com switches "In the bell" e "By e-mail"; e-mail ligado só em Payment failed; e-mails não mostram nome nem valor); **Daily summary** (desligado; só sai se houve algo); **News from Traderhub** (marketing nosso, desligado até o coach ligar; tag On quando ligado). Dados e padrões em `lib/data/admin-notifications.ts`; salva ao digitar (`useCommunityData(slug, "notifications")`). O painel do sino lê os mesmos dados e esconde o aviso desligado em "In the bell"; o pedido de journal e o repasse (Payouts) nunca se escondem. Em telas estreitas (<640px) a coluna When some e a descrição vai para baixo do nome. Os botões "Notification settings" do painel abrem `settings?tab=notifications`. Figma: `Settings · 04 Notifications` (era 03b até 21/11) e item no menu das telas de Settings. Fora de escopo, para o Flavio: separar e-mails de serviço de marketing na aba E-mails do aluno e registrar consentimento.
- **Notificações: regras e testes (20/11):** tudo em `docs/notifications.md` (qual canal para qual aviso, regras do sino, dos toasts e das preferências). `toast` sempre de `@/lib/toast` (título sem ponto final, segunda frase vira descrição, texto igual substitui em vez de empilhar); a fonte do toast é a da página; posição acima da pill do tour/seletor (136 px no celular) e fora da prévia/inspector no Editor. Preferências do coach em `admin-notification-prefs` (não `notifications`, que é do aluno) com `normalizePrefs`; lido persiste em `admin-notification-read`. Figma: `Admin / Toast` (Data display).
- **Gráfico do Overview no hover (20/11, Figma 01):** o ponto ativo (branco, anel escuro de 2px, r5) e o cartão do tooltip são desenhados juntos no SVG (`ActiveMark` em `overview.tsx`, via `activeDot` + `foreignObject`): o cartão fica 8px à direita e 2px abaixo do ponto, vira para a esquerda nas 3 últimas barras e para cima quando o ponto está baixo (`cy > 150`); o `ChartTooltip` do recharts só detecta o hover (`content={() => null}`). A barra ativa ganha brilho laranja (`drop-shadow` que aparece junto com a opacidade). Figma: tooltip com "€1.4k / 185" e "Active students:" como no código.
- **Live dot (20/11, ampliado):** `PingDot` em `components/ui/ping-dot.tsx` é o efeito único de "ao vivo / online" do produto (ponto sólido + dois anéis que saem dele num ciclo lento de 2,8s (cerca de 2s de movimento e uma pausa curta), crescendo até 2,2x com cauda longa (ease-out) para ler como uma respiração e não como um pisca, o 2º 0,6s depois; só transform e opacity; keyframe `live-ping` no fim de `admin-tokens.css`; reduced motion remove os anéis). A cor vem do `bg-*` do ponto (os anéis herdam com `bg-inherit`, ou `ringClassName` para um tom mais claro). Admin: `LiveDot` (`ui/live-dot.tsx`, Figma `Admin / Live dot` em Components › Admin · 08 Data display, Tone Success/Danger) na pill "Students online" do Overview (ponto de 6px, como no Figma) e no marcador LIVE do player de transmissão (danger, 6px). Aluno e público usam o mesmo `PingDot`: `calendar-surface` (LiveDot do calendário), `student-calendar` (Live now), `student/live-watch` (lista e selo LIVE), `public/sales-page` (próxima sessão). O Tag "Live"/"Live now" segue sem ponto. O Live chip do Figma (Studio · Live) agora tem o Live dot Danger, como o player do código.
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
- **Teclas do player são do player:** o player para a propagação das teclas que usa, para que um atalho do Admin (como ⌘K) nunca dispare enquanto o vídeo tem o foco. O Admin não tem atalhos de uma letra só (WCAG 2.1.4).
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
- **Página de resposta:** não tem botão Voltar (como no Figma). Abrir um pedido põe `?request=` na URL: o Voltar do navegador e o Esc trazem a lista. Next request troca a URL (`replaceState`), então recarregar mantém o pedido aberto. Esc durante a gravação pede confirmação ("Discard this recording?") antes de descartar. No celular o cabeçalho (nome, tier, ações) quebra em duas linhas. Gravar vídeo ou voz mostra só Skip e Next request no topo; os botões do rodapé quebram linha no celular.
- **Rules:** esquerda, "Who gets the journal" (Everyone, Paid tiers, Pick tiers com caixas por tier), "Required for every trade" (um interruptor por linha) e Tags (New tag com campo na hora); direita, "Strategies and their rules" com cartões (nome, Kept %, menu "⋯", regras com marca neutra: `bg-a-selected` e `text-a-text-2`, nunca `bg-a-accent`, que é branco e esconde o check). Em 1440 px a coluna Student da tabela Requests precisa de pelo menos ~190 px (larguras fixas: Question 248, Trade 216, Rules 232). A aba Rules NÃO mostra os quatro cards de stats (o Figma 05 mostra; decisão de 23/11: o código fica sem). **Token:** `t-mono-*` depende de `--admin-font-family-mono` (definido em `admin-tokens.css` como a fonte primária); sem ele o `font:` abreviado é inválido e o texto cai em 16 px. New strategy é modal (nome, Who sees it, regras; "Remove rule" tira a última).

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
- Overview da aba (23/11/2026): KPIs (Revenue, MRR, To collect, Next payout), gráfico dos últimos 6 meses com abas Revenue e Members (`sales/revenue-chart.tsx`; o último mês de Members vem da soma dos tiers pagantes), Payment alerts (`PaymentAlerts` sobre `ui/attention-card.tsx`), Coming up e Revenue by source em donut (`sales/revenue-panels.tsx`). Os alertas vêm de `lib/data/payment-alerts.ts`, a mesma fonte do Needs you today (Overview) e da contagem em Students.
- Offers: planos de pagamento livres (`OfferPlan`), tier "Offer only" (`cadence: "offer"`) e checkout sem consentimento; ver `docs/high-ticket-flow.md`. Título de card em 16 px; footer de tabela sempre `AdminTableFooter`; drawers e modais só com a borda de 1 px (sem anel extra no tema).

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
- Ajustes do Flavio (14/11, Figma "Admin · 01 Onboarding" 1090:57491):
  - Ordem Design → Tier → Curso → Payouts → Legal, em qualquer ordem. O sugerido (borda laranja) é o primeiro não feito e não adiado; "Skip for now" guarda o item em `setup.skipped` (some quando só falta um). Go live fica travado e diz "Still open: …".
  - Tier: "Courses it unlocks" na aba Plan (All courses ou Pick courses; Pick só com 2+ cursos), guardado no tier como `unlocks` e escrito em cada curso ao salvar (o acesso continua lido do curso). Tier antigo sem `unlocks` lê dos cursos (`tierUnlocks`). Billing tem Free: esconde preço, anual e trial; o card mostra "Free" (`cadence: "free"`; os tiers grátis de exemplo, preço 0, continuam fora de Sales).
  - New course tem 2 passos (Course, Content); o acesso sai de `tiersForNewCourse` (tiers com All courses; `NO_TIER` quando todos escolheram cursos). O tour do curso não tem mais o passo Access.
  - Plataforma em rascunho: curso em draft com aula visível é "Ready for launch" (`readyForLaunch`) e o Go live publica esses cursos.
  - Nome legal do Payouts e Imprint começam do cadastro (`proto:account`); o Imprint usa o nome do Payouts quando houver.
  - About you e Name your platform têm Back e guardam o que foi escolhido (`answers`, `nameDraft` na conta).
  - Um tour por vez: abrir outro pausa o atual em `<slug>:tours-paused`; Getting started mostra "Paused at …" e Resume para cada um.
  - Design: o preview é um card (32 px da borda, `rounded-a-xl`, borda) e o Brand avisa que tudo muda depois no editor.
  - Tour do editor (O10, opcional, não conta nos cinco): o item Design concluído mostra "Tour the design editor" (`guide` do `TimelineStep`) até `setup.editorTour`. Três passos com `data-tour` no editor: `editor-panel` (o card do menu), `editor-canvas` com `editor-widgets` aberto (Widgets) e, com o `editor-inspector` aberto, `editor-publish` (Preview e Publish, final). Quando o alvo ocupa a tela, o coachmark fica dentro dele, sem seta; só um popup aberto (`aria-haspopup`) esconde o coachmark.
- O wizard antigo (`wizard.tsx`, `wizard-design.tsx`, `steps.tsx`, `look-steps.tsx`, `invite.tsx`, `publish.tsx`, `/setup/invite`, `/setup/publish`) foi apagado em 13/11 com o ok do Gustavo; `/signup/call` e `/signup/welcome` só redirecionam links antigos; as dicas antigas (`SetupTip`) de curso, tier e payouts não aparecem mais (o tour cobre).

## Logo Traderhub (13/11)

- Único logo: o "T" com gradiente de cima para baixo (`--admin-color-brand-gradient-start` #ff4701 → `-end` #ff9003) e a palavra "Traderhub" em Heading M, 10 px de distância (Figma Admin / Logo, marca 23 × 24,5).
- Sempre pelo componente `components/brand/logo.tsx`: `<Logo />` (marca + palavra) ou `<LogoMark />` (só o "T"). Não copiar o SVG.
- Tons (iguais ao Figma Admin / Logo): `brand` (texto branco, fundo escuro, oficial), `brand-light` (texto preto, fundo claro) e os de uma cor `white`, `gray` (#757575) e `black`, chapados na marca e no texto.
- Proibido: o "T" chapado laranja (`M2 3h20v6h-7v12H9V9H2z`) e a palavra "TradeStats" na interface.
- Ícone da aba: `src/app/icon.svg` e `src/app/favicon.ico`, gerados do mesmo "T".

## Editor · Style (16/11, Figma "Editor · 02 Style", 15 telas)

- O grupo do rail se chama **Style** e tem cinco abas: Brand, Theme, Layout, Type, Background (`designTabs` + `merge` em `design-workspace.tsx`; o id interno da aba Theme continua `look`, e `layout` é novo). Links antigos (`?step=look`) seguem valendo.
- **Um dono para cada configuração.** Brand: nome, logo, cores, destaque, lucro e perda (e "Import from your website"). Theme: personalidade (template, fontes, cantos, botões, sombra, bordas, rótulos, peso do título, estilo de widget) e Dark/Light. Layout: menu, moldura, widgets em cards ou abertos, espaçamento. Um tema nunca grava espaçamento (`lookPatch`), só o layout (`layoutPatch`).
- **Cards compartilhados com o setup:** `fields/choice-cards.tsx` (`SelectionCard`, `PillSegmented`) e `presets.ts` (`THEMES`, `LAYOUTS`, `layoutOf`, `layoutPatch`, `lookPatch`, `matchLook`). Setup e editor usam as mesmas ilustrações (`/onboarding/look-*.webp`, `layout-*.webp`). Gap do card = 6 px.
- **Theme:** Mode no topo, três cards, duas variações (chips). Estado **Custom** (ponto laranja + Reset) quando alguma configuração do tema foi mudada à mão (`matchLook` não acha look). Trocar de tema pede confirmação só em Custom (`useConfirmSwitch(name, apply, confirm)`); fora disso aplica na hora com Undo. A caixa lista o que é refeito e o que fica.
- **Type:** pares de fonte como cards com o "Aa" na fonte do título. **Background:** quatro cards com a cena (`BackgroundArt`).
- **Erros:** logo acima de 2 MB e imagem de fundo com menos de 1600 px de largura mostram um `Callout` vermelho (não só toast).
- **Busca:** abas com conteúdo próprio (Theme, Layout) declaram `finds` (linhas que abrem a aba); os grupos mostram "Aba · Grupo".
- **Clique no preview:** o menu abre Layout (`STEP_OF.nav`), títulos e rótulos abrem Type, o fundo abre Background.

## Formulários: o botão principal só ativa quando está pronto (19/11, decisão do Gustavo; vale para qualquer form do TradeHub: Admin, Editor, cadastro e área do aluno)

- No Figma o botão principal fica sempre em **Default**; o código segue a regra. Modelo: "Enter the 6-digit code" (`disabled={!full}`).
- O botão de avançar/criar/salvar fica `disabled` (40%, sem clique) até **todo campo obrigatório estar preenchido e válido**: texto sem espaços sobrando, formato (e-mail com ponto, link com https, IBAN) e tamanho mínimo, escolha feita, caixa de termos marcada, arquivo enviado.
- **Erro só aparece quando há algo digitado e inválido** (e-mail e nome curto, só depois de sair do campo; datas e IBAN ao digitar). Campo vazio nunca mostra erro e não se usa mais o padrão "tried" (erro só ao clicar).
- **Formulário de edição** (dados que já existem: oferta de parceiro, página legal, nota de notícia): Salvar só ativa quando algo mudou e está válido.
- **Etapa só com perguntas opcionais** (About you, perfil e Discord do aluno): Continue ativa depois de **pelo menos uma resposta**; Skip (`hierarchy="text"`) fica sempre ativo. Etapa só informativa (Welcome) mantém Continue aberto. Campo opcional nunca bloqueia.
- O `submit` repete a checagem (`if (!ready) return`), então Enter num formulário incompleto não faz nada; estados de espera (`checking`, `busy`) também desabilitam.
- Teste de regressão: `scripts/forms-rule.mjs <grupo>` (Playwright; grupos onb, ranking, coupons, partners, partners-edit, legal, invite, student) cobre cadastro, Ranking, Coupons, Partners (nova e edição), Legal, convite de equipe e etapas do aluno em 1440, 768 e 390 px.

## Getting started em ordem (19/11, decisão do Gustavo; antes era "qualquer ordem", Flavio 14/11)

- `use-setup-steps.ts` calcula tudo do que já existe (nada novo é gravado): **atual** = primeiro passo não concluído e não pulado; **locked** = não concluído, não pulado e depois do atual; Go live segue `upcoming` até os cinco estarem Done. Pulado (`Skip for now`) não conta como concluído; com tudo pulado nada fica bloqueado. Quem já tinha passos de baixo feitos os mantém Done.
- **Visual (desenho do Gustavo no Figma, 19/11):** `TimelineStep` tem Done com borda verde 40% e fundo com 4% de verde (`--admin-component-timeline-step-border-done` e `-bg-done`), ícone verde; Current com borda padrão e marcador cinza numerado (o peso vem do botão primário); Locked sem fundo, marcador de anel tracejado com cadeado, título secundário e descrição terciária, botão desabilitado com a dica "Finish “X” first" (Go live usa o mesmo visual); pulado (`open`) com marcador tracejado + etiqueta Skipped. O trilho é verde sólido até o último concluído (`prevDone`) e tracejado 4/4 depois; só a ponta ao lado do marcador é arredondada (`rounded-b-full` no trecho de cima, `rounded-t-full` no de baixo), então a linha verde segue contínua entre dois passos, e o trecho tracejado não tem raio. Cadeado do marcador Locked em `--admin-color-icon-subtle` (branco 36%). Cor e borda animam em 300 ms (Ease Out).
- Último passo (Go live), Figma: **não desligar Show Line** (o marcador desce para o fim do trilho); manter a Line bottom no layout, sem fill e sem stroke, com as duas linhas em 28 e o marcador em y=34, centralizado como nos outros passos. No código o último passo já fica centralizado (`last` só deixa a linha transparente).
- `?tour=` de passo bloqueado é ignorado (`TourLayer`). As páginas da sidebar abrem normal.
- Figma: `Admin / Step indicator` State = Locked e Skipped (propriedade nova Show Lock no _Base); `Admin / Timeline step` State = Locked; frames Getting started 01 a 05 do Admin com os passos depois do atual em Locked e Skip for now no atual.
- Teste: `scripts/getting-started-order.mjs` (Playwright; cria a plataforma pelo cadastro) cobre conta nova, pular, dados fora de ordem, tudo pulado e a guarda dos tours em 1440, 768 e 390 px.

## Selection card (19/11, desenho do Gustavo; Figma Admin / Selection card 934:2287)

- Estados: **Default** sem fundo, borda escura (`--admin-component-selection-card-border-default`, branco 8%) e anel do radio branco 14%. **Hover** fundo branco 4% (`-bg-hover`), borda branca 40% (`-border-hover`) e anel branco 70% (`-radio-hover`). **Active** mesmo fundo 4%, borda laranja #cf4500 (`-border-active`) e radio preenchido #ff5500 (`-radio-active`, anel e ponto). Disabled = Default a 40% (só no Figma).
- Estrutura: mídia, 8 px, bloco de texto com 4 px de recuo lateral (título e descrição a 2 px). Primitivas novas `primitive/extra/ffffff-40` e `ffffff-70`.
- Ilustração (19/11): ocupa a largura interna do cartão (cartão menos 8 px de padding e 1 px de borda de cada lado) e nunca é cortada. No Figma a arte tem a largura interna exata (Theme Card e Layout Card 276, Compact 147, Wide 216) e o slot Media tem altura pelo conteúdo, sem padding; no código a imagem usa a proporção do arquivo (`aspect-[278/189]` para temas, `aspect-[278/118]` para layouts), nunca altura fixa.
- Código: `SelectionCard` em `design/fields/choice-cards.tsx`, usado no Setup (Look, Layout) e no Editor (Theme, Layout, Type, Background); um componente só.
- Animação: cor, borda e fundo em 200 ms (Ease Out); ao apertar `scale-[0.98]` em 100 ms, soltando em 200; o ponto do radio cresce de 0 a 1 em 200 ms (sem movimento com `prefers-reduced-motion`).
- Figma: 7 variáveis `component/selection-card/*` (bg/hover, border/default|hover|active, radio/default|hover|active) com linhas na Foundations. As instâncias do Active com o radio trocado para Checked=On precisam do override da cor do anel e do ponto (a troca de componente perde o override da variante).
- Teste: `scripts/selection-card.mjs` (Playwright, 1440, 768 e 390): cores calculadas de Default, Hover e Active, clique, passo Layout e rolagem horizontal.

## Course tour pill e Progress ring (19/11)
- **Progress ring** é um componente só: `ui/progress-ring.tsx` (`ProgressRing`, tamanho e espessura por prop). O arco é sempre `--admin-component-progress-fill` (laranja #c2561c), nunca `--admin-color-accent-default` (branco). Usado na pill do tour (18 px) e no progresso do Design no onboarding (24 px, canto da prévia). Não desenhar anel solto.
- **Course tour pill** só existe nos fluxos da timeline (frames Tour · ...), nunca no Getting started: `TourLayer` não a desenha quando o caminho termina em `/getting-started`. O tour continua guardado e a pill volta ao abrir outra página.
- Posição (decisão do Gustavo, 19/11): o anel fica SEMPRE antes do nome, com o painel aberto ou fechado; nunca troca de lado. Concluído = check verde (`text-a-success`) no lugar do anel, entrando com zoom e fade; clicar leva ao Getting started e a pill some. O arco cresce em 500 ms Ease Out; ao apertar a pill, `scale-[0.97]` em 100 ms.
- Teste: `scripts/tour-pill.mjs` (Playwright, 1440, 768 e 390).
- **Progresso do coachmark (19/11):** as barrinhas ao lado do título (`h-1 w-3`, uma por parte do tour) usam `bg-a-coach-progress` (ativa e anteriores, laranja `--admin-component-progress-fill`) e `bg-a-coach-progress-off` (demais, `--admin-color-border-default`). Nunca `bg-a-accent` (branco). Tokens `--admin-component-coachmark-progress-active|inactive` (Figma `component/coachmark/progress/active|inactive`, coleção Admin). No Figma são os frames `Segment` dentro de `Coachmark/Header/Progress` (114 em 30 coachmarks do Admin, incluindo os do editor), todos ligados às duas variáveis.

## Tabs e segmented controls: thumb deslizante (19/11)
- Referência: interior.dev "Segmented control" (screenrove.com/motion/interior-segmented-control). **Só movimento, o desenho não mudou** (mesmas cores, alturas, raios e bordas).
- Um pedaço só: `ui/slide-thumb.tsx` (`SlideTrack`, `useSlideBox`, `THUMB_SPRING`). Três camadas com a mesma geometria: rótulos apagados (`base`, no fluxo, definem o tamanho), um thumb que leva uma cópia dos rótulos na cor ativa (`copy`, contra-movida por `-x` do mesmo valor da mola) e os botões reais por cima (`hit`, texto transparente: mantêm papéis, foco e clique). A cor do texto muda exatamente onde a borda do thumb cruza a letra.
- Mola 520 / 34 / 0,45 (cerca de 410 ms, sem overshoot), interrompível: clicar no meio do caminho continua da posição e da velocidade atuais. Larguras diferentes por item são medidas (`offsetLeft` e `offsetWidth`); a largura do thumb também anima. Com `prefers-reduced-motion` o thumb vai ao item novo no mesmo quadro (a cópia vai junto, a cor ainda muda). Hover: só a cor do rótulo apagado (150 ms), como no desenho.
- Usado por: `AdminTabs` (ui/tabs.tsx), `AdminSegmentGroup` (ui/segment-group.tsx), `PillSegmented` (design/fields/choice-cards.tsx), `Segmented` do Editor (design/fields/controls.tsx), as abas do Style/Brand no painel do Editor (panels/settings-panel.tsx) e o Timeframe do Charts. `AdminUnderlineTabs` leva o mesmo movimento numa barra sublinhada que desliza e muda de largura (`useSlideBox`). `AdminSegmented` (células separadas com borda, 48 usos) não é thumb: fica como estava.
- Regra para qualquer tab novo: usar um desses componentes, nunca um tablist/radiogroup solto com `bg-` no item ativo. Itens sem margem e com as mesmas classes nas três camadas; o rótulo do item vai num `<span>` (o botão real esconde os filhos com `[&>*]:invisible`).
- Teste: `scripts/tabs-motion.mjs` (Playwright, 1440, 768 e 390): percorre as telas do Admin e do Editor, confere thumb sobre o ativo, movimento aos 70 ms, cópia registrada, assentamento, teclado e reduced motion.

## Overview: decisões de 21/11
- **KPIs seguem Period e Tier** (`headlineFor` em `admin/overview.tsx`): os quatro números e o subtítulo ("Kairo FX · last 7 days") mudam com o filtro do gráfico; cada período tem amostra própria e o comparativo é com o período anterior ("vs previous 7 days"); o Tier leva a sua fatia de alunos, inscrições e receita (a taxa de regras não depende do Tier). 30 dias, Todos os tiers = exatamente o Figma (194 · +6,2% · €37,180 · 40 · 84%). Variação zero mostra "0".
- **Avatar do topo = menu da conta** (`admin/account-menu.tsx`, Admin / Menu): nome e e-mail, Settings, Notification settings, Team and roles, Plan and invoices, View as student, Log out. Esc e clique fora fecham; o foco volta ao avatar.
- **Sino do aluno com painel** e **"Also by e-mail" desligado por padrão**: ver `docs/notifications.md` §5. Admin › E-mails em três grupos (service, activity, marketing).
- **Cor âmbar da mídia (File icon): mantida.** Mídia precisa de um quarto matiz que não seja o laranja da marca; `#a16207` com rótulo branco passa 4,5:1 e já é o tom de "aviso" do produto, só aparece na pílula do arquivo. Trocar exigiria um quinto matiz sem ganho.

## Troca de conteúdo das abas (20/11)
- **Um padrão só, em `ui/tab-panel.tsx`** (o thumb continua sendo o `SlideTrack`; isto é o que acontece com o conteúdo). Referência de movimento: o thumb (mola, ~410 ms) e a regra "ease-out de cauda longa" do produto, sem inventar curva nova (`cubic-bezier(0.22, 1, 0.36, 1)`).
- `TabPanel value order`: envolve o que as abas trocam. O painel novo entra em 300 ms (fade + 12 px vindo do lado da aba nova; sem `order` sobe 6 px); o antigo sai em 110 ms, fora do fluxo (`popLayout`), então os dois nunca se empurram. A altura fica presa na do painel antigo e anima até a do novo (300 ms) e volta a `auto`; um timer de 900 ms garante a volta se a aba for estrangulada. O painel já é `flex flex-col gap-4` (16 px entre blocos, como no Figma; desde 21/11, depois do bug do Community em que tabela e painel ficaram colados); `className` acrescenta ou troca (ex.: `gap-5`), `outerClassName` estiliza o quadro. Reduced motion: **mesma marcação** (senão o servidor e o navegador divergem: hydration error) e todos os movimentos em 0 ms.
- `TabStackPane active from`: para abas que precisam ficar todas montadas na mesma célula do grid (altura do maior, como Overview › Content). O ativo entra; os outros somem e deslizam 12 px para o lado do ativo e ficam `invisible` + `inert` no fim. Abaixo de 680 px de container o painel escondido sai do fluxo.
- Gráficos: o gráfico do Overview não é remontado ao trocar de view/Tier/Period; o recharts anima de um conjunto de dados para o outro (520 ms, ease-out) e só liga depois do primeiro quadro (sem animação de entrada ao abrir a página). Legenda e rótulos de data fazem fade (`animate-in fade-in`, 300 ms) com `key`.
- Usado em: Overview (gráfico, Content), Sales (8 abas), Community, Partners, Ranking, Charts, Journal, Calendar, Tiers (Plan/Sales page), aula (Lesson/Chapters/Quiz/Files), drawer do aluno (Overview/Activity/Notes). Aluno e demais telas com `ui/tabs.tsx`: `TabsContent` ganhou fade + 4 px de subida (300 ms). A lista do sino faz fade por filtro (200 ms).
- **Cabeçalho de tabela (21/11):** `AdminTh` = Admin/Micro 11/14 (`t-micro`), linha de 34 px, igual a `Admin / Table head` nas 52 tabelas do Figma (era 12/16 e 38 px).
- **Regra:** conteúdo novo de aba usa `TabPanel`; nunca `{tab === "x" && ...}` solto em tela nova. Painéis que mudam de tamanho por dentro (digitar, lista crescendo) não animam: só a troca de aba mexe na altura.
- Teste: `scripts/tab-content-motion.mjs` (Playwright; `BASE=...` para testar um `next start`): percorre as abas das telas acima em 1440, 768 e 390, com e sem reduced motion; confere que durante a troca há dois painéis (ou um, em reduced), que no fim há um só com opacidade 1 e altura liberada, cliques rápidos e erros de console. **Rodar com o servidor sossegado** (outro Playwright ao mesmo tempo atrasa as medidas) e, para hidratação, contra um build (`next start`); o `next dev` pode servir HTML pré-renderizado velho de uma página que acabou de ser editada (visto em Community: `x-nextjs-cache: HIT`) e acusar hydration error que não existe no build.

## Temas: paleta do Pulse e ilustrações dos cards (19/11)
- **O que aconteceu:** no Onboarding e no Editor o Pulse dark saía marrom/vinho e o Pulse light rosado, em vez do azul-marinho e do lavanda do template. Os dois usam o mesmo `resolveColors` (`src/lib/theme/derive.ts`), então a causa era uma só: os cinzas "seguem a marca" por padrão (`tint` ausente = `"brand"`) e a marca laranja do coach virava o matiz de todos os fundos e cartões. Em Terminal e Atelier os cinzas quase não têm cor, então ninguém via; no Pulse a paleta é a identidade do tema. Era erro de código (o design do Figma já era azul-marinho).
- **Correção na fonte:** `greysFollow(theme)` em `derive.ts` decide o padrão: todos os templates usam a paleta exata (`"template"`); Brand (cinzas tingidos pela marca) e Grey continuam como escolha do coach em Style → Colours. Quem escolheu Brand ou Grey em Style → Colours continua valendo (`tint` salvo ganha). O painel de cores usa a mesma função, então o que ele mostra é o que o preview usa. Nunca tingir pela marca por padrão.
- **Ilustrações dos cards** (`public/onboarding/look-*.webp` e `layout-*.webp`): estavam cortadas e descentradas (exportadas com recorte errado; o Pulse perdia margem direita e a última linha). Foram refeitas a partir da arte do Figma (Admin / Editor Theme art Card 276 × 188 e Layout art Card 276 × 117, que são a fonte): mesma largura útil do cartão, proporção do arquivo. Para refazer: `get_screenshot` da variante (1:1), converter com `sharp` para webp. Os `imgClass` usam `aspect-[276/188]` (temas) e `aspect-[276/117]` (layouts); nunca altura fixa.
- **Animação de troca no preview do Onboarding** (`design-setup.tsx`, `swap`): a prévia some em 220 ms, a mudança entra sem ser vista e ela volta em 420 ms (Ease InOut), fundo do palco acompanha a cor da página; layout e página usam View Transition. Medido: fica em 0 e volta a 1, sem ficar apagada.
- **Teste:** `scripts/theme-matrix.mjs` (Playwright): 3 temas × Dark/Light no preview do Onboarding e no Editor, cor exata do Pulse, sem marrom/rosa, troca rápida, recarregar, dados antigos (sem `tint`, `tint` "brand" e "none"), ilustrações inteiras a 1440/768/390.
- **Teste 2:** `scripts/theme-controls.mjs`: site do aluno e páginas públicas (/site/<coach>, login, checkout, join, waitlist) em Pulse dark e light sem erro de console, cor da marca em cada tema e modo (Terminal e Pulse não mudam os cinzas, Atelier dark acompanha a marca), variações, modo Dark/Light sincronizado com a troca rápida, ilustrações do Layout (Editor e Onboarding) e reduced motion. Rodar os dois scripts ao mexer em temas, cores ou imagens de cards.
- **Gráficos do aluno:** `student/charts.tsx` e o gráfico do trade em `student/journal.tsx` leem a cor pelo `resolveColors` (a mesma do resto), não pela paleta crua do template.
- **Em aberto (decisão do Gustavo):** a ilustração e o frame do Figma do Atelier são creme (#EFE9DC), mas o template do Atelier no código tem página branca (#FFFFFF) com cartão #F5F6F2 e verde #1F5A45; no preview sai quase cinza. O Figma do Pulse dark usa #0E1226 e o código #070A1F. Os valores do código seguem o template; os frames do Figma são maquetes. Não alterei nenhum dos dois.
- **Paletas dos templates = Figma (19/11, Gustavo: seguir o Figma)** em `src/lib/theme/template-data.json`: Terminal dark #050505 / cartão #0E0E10 / texto branco; Terminal light #F4F4F5 / #FFFFFF / #0A0A0B / secundário #6B6B73; Atelier (light) creme #EFE9DC / #F8F4EA / #26211D / #85796A; Pulse dark #0E1226 / #171B38 / branco; bordas a 11% (branco no escuro, preto no claro). Medidas nos frames `Style · 02 a 05 Theme` do Editor. Atelier dark e Pulse light **não existem no Figma**: ficam como estavam (aguardam desenho). O cartão que o preview mostra pode sair um degrau mais claro que o do Figma no escuro (Pulse #1C213F contra #171B38): é a escada de contraste (`STEP` em `derive.ts`, cartão a 1,18 do fundo). O Terminal tem cartão cinza por decisão própria (`cardSurface: "grey"`), por isso o cartão do Terminal light não é branco como no frame.
- **Teste:** o `theme-matrix` agora confere o fundo de Terminal dark e light, Atelier light e Pulse dark contra os valores do Figma.


## File icon (20/11, pedido do Gustavo; Figma Admin / File icon 767:38975, formatos em "Frame · Admin / File icon · formats")
Peça: `src/components/admin/ui/file-icon.tsx` (`FileIcon`, `getFileType`, `getFileExtension`, `KNOWN_FILE_EXTENSIONS`). Referência de desenho: reui.io/components/file-type (página com canto dobrado e pílula com a extensão), nas cores e na fonte do Admin.
- **Um visual só: Outline.** Solid, Light e Mono foram desenhados, comparados e removidos (ok do Gustavo, 20/11): só mudavam a pintura da mesma peça e nenhuma tela precisava delas. Não recriar variante de visual; se um dia faltar "desativado", usar opacidade 0,4 como nos outros componentes.
- **Tipo = cor da pílula.** PDF (PDF e apresentações) vermelho `status/danger-fill`; Doc (documentos e texto) azul `status/info-fill`; Sheet (planilhas e CSV) verde `status/success-fill`; Media (imagem, vídeo, áudio) âmbar `status/warning-fill`; Other (arquivos compactados, arquivos de plataformas de trading, código e qualquer tipo desconhecido) cinza `primitive/extra/5f5f66` (o cinza antigo #262626 sumia no fundo `track`). Nunca laranja (reservado), nunca azul fora do `info`.
- **Tamanhos (altura; a largura é 80%).** `sm` 32: só a marca colorida, sem letras (use quando o nome do tipo já está escrito ao lado, como na lista da AI). `md` 40: padrão, 3 letras (linhas de tabela, File item, drawers). `lg` 48: 4 letras (cabeçalho de drawer, prévia grande). Não existem mini, xs nem xl.
- **Rótulo.** É a extensão em maiúsculas: 3 letras no md (DOCX vira DOC, XLSX vira XLS, PPTX vira PPT, JPEG vira JPG, JSON vira JSN, HTML vira HTM), até 4 no lg. Fonte Helvetica Neue 11, peso 500 (Admin/Micro Medium). Texto sempre branco (`label`, `text/on-accent`). Para isso as barras usam tons que seguram o branco (todos ≥ 4,8:1): vermelho `danger-fill` #DC2626, azul `primitive/extra/2563eb`, verde `primitive/extra/15803d`, âmbar escurecido `primitive/extra/a16207` e cinza `primitive/extra/5f5f66` (as cores `info-fill`, `success-fill` e `warning-fill` dão só 3,7, 3,3 e 1,7 com texto branco). A barra é um frame com auto layout (padding 4 dos lados, radius 2), 3 px à esquerda da página e do tamanho do texto (30 px com PDF no md); no sm é uma faixa de 3/4 da página, 2 px à esquerda, sem letras. Ajuste do Gustavo em 20/11 (frame de teste 1824:105413). Sem extensão, ponto no fim ("report.") ou nome inválido: página cinza com FILE. Extensão que não está na lista: página cinza com a extensão.
- **Quando usar.** Linha que representa um arquivo de verdade (Downloads, File item de aulas e importação, lista de conhecimento da AI). Não usar como ícone de status, de ação ou de pasta, e não pintar a pílula por conta própria: a cor vem do tipo.
- **Acessibilidade.** O ícone é decorativo (`aria-hidden`); o nome do arquivo ao lado é o nome acessível. Ação (baixar, remover) vai num botão ou link próprio com `aria-label`, nunca no ícone.
- **Uso.** `<FileIcon name="Plan.pdf" size="md" />` ou `<FileIcon type="pdf" />`. Nome de arquivo sempre passa por `getFileType`, nunca por `split(".")` solto.
- **Contorno.** Uma cor só e sólida (`page-stroke` = `primitive/extra/4a4a4f`, escolha do Gustavo; só 2,0 a 2,3:1 sobre page, panel e raised e 1,7 sobre track, é decorativo: o texto da barra carrega o tipo). A dobra são dois traços abertos que começam 1 px abaixo do topo (sem pontas que passam da borda). Nunca usar cor com opacidade no contorno: a linha da dobra se sobrepõe à da página e o trecho dobrado fica mais claro. A dobra é um traço aberto (só os dois lados internos), a diagonal é da página.
- **Tokens** (Admin, todas com linha na Foundations): `component/file-icon/page-stroke`, `bar/{pdf,doc,sheet,media,other}` e `label` (7 variáveis; mais 4 primitivos extra novos).
- **Formatos cobertos (fonte).** Do produto: PDF, Office, CSV, imagens (png, jpg, gif, webp, svg, heic, avif, bmp, tif), vídeo (mp4, mov, webm, mkv, avi, m4v) e áudio (mp3, wav, m4a, aac, flac, ogg); `accept` dos uploads no código. MetaTrader: ex4, ex5 (compilados), mq4, mq5 (fonte), mqh, set, tpl, chr (metatrader5.com, Files and Folders). NinjaTrader: zip (NinjaScript Archive, ninjatrader.com export) e cs. cTrader: algo e cbotset (help.ctrader.com). TradeStation: eld. Sierra Chart: scdll (sierrachart.com). TradingView: pine (convenção da comunidade, não confirmado em fonte oficial). AmiBroker: afl (convenção, não confirmado em fonte oficial). Arquivos compactados: zip, rar, 7z, tar, gz. Texto e dados: txt, md, log, json, xml, html, js, ts, py, ipynb, sql, rtf, odt, ods, odp, pages, numbers, key.
- **Testado em 20/11** (Playwright, 1440, 768 e 390): tabela de Downloads (12 linhas de seed e 6 enviadas, altura de linha 65, 0 overflow), File item no drawer, na importação CSV e no kit com nome de 90 caracteres (trunca, o ícone fica 32x40), sem extensão, extensão em maiúsculas, `.env`, `archive.tar.gz`, tipo direto (`type="pdf"`) e sem nome. A tela da AI ainda é "Coming soon": o ícone dela só foi checado no kit.

### File item (20/11, ajuste do Gustavo; Figma Admin / File item 768:2252)
`src/components/admin/ui/file-item.tsx`. Linha de 66 px (86 com barra): File icon md, nome, meta e ação à direita. Estados (`status`): `ready` e `uploading` escrevem a meta em cinza; `done` mostra o tamanho, uma bolinha verde de 12 px com check e "Completed"; `error` mostra um ícone de aviso vermelho de 14 px e o motivo ("Upload failed" ou `statusText`). **As palavras nunca ficam verdes ou vermelhas**: o ícone carrega a cor, o texto fica cinza (`text-a-text-2`). Com `progress` (uploading, ou error com barra) a ação sobe para o topo e a barra com a porcentagem corre sob a linha toda (Accent no upload, Danger no erro); error com barra mostra só o motivo, sem o tamanho. Quem chama passa só o tamanho em `meta`; o texto de status vem do componente. No Figma o `Status` tem Ready, Uploading, Done, Error (com barra) e "Error · No progress"; o _Base File item ganhou Show Meta, Show Status, Status Text, Show Done Icon e Show Error Icon; o Step indicator ganhou o tamanho xs (12 px) só no `_Base` para a bolinha de Done.


## Laranja nos estados de escolha (21/11/2026)
Pedido do Gustavo, com Selection card e Choice chip como referência. Selecionado = borda laranja `color/control/on` (#cf4500, 3,9:1 sobre o fundo) em Selection card, Choice chip, Option card, Segmented option e Sortable row (active e dragging); o rádio de dentro também é laranja. Hover fica neutro (borda branca mais forte), inclusive no Choice chip (`component/choice-chip/border/hover` → `color/border/strong`, antes laranja). Nunca preencher o card inteiro de laranja nem pintar o texto. Código: `option-card.tsx`, `segmented.tsx`, `sortable-row.tsx` e os tokens `--admin-component-sortable-row-border-active` e `--admin-component-choice-chip-border-hover`.

Revisão nas telas (21/11): no Figma, 6 instâncias tinham a borda do estado Active sobrescrita com o branco antigo e foram religadas ao token (Students 03b, Content 03, Tour · Course 04a/04b/04c e Editor Dialogs 02 Save as template); 2 grupos escondidos (Calendar 04 e Design 02 Look) ficaram como estão. No código, 7 cópias soltas do visual desses componentes passaram a usar a mesma borda: `settings-parts.tsx` (segmentado), `charts-admin.tsx` (mercados), `student-preview.tsx` (Viewing as), `sales/groups.tsx` (tiers), `settings-account.tsx` (papel), `student-message.tsx` (anel do rádio) e `design-steps.tsx` (chips de look, com os tokens do Choice chip). `CARD_ON` e `CHIP_ON` em `design/states.ts` não são usados; `TILE_ON` (artes do Editor) ficou branco, fora do pedido.


## Students, menus e radios (23/11/2026)
- Menus de ação com ícone: use `AdminMenu`/`AdminMenuItem` com o ícone Carbon como primeiro filho (ver `AccountMenu`, `ReviewMenu` em `admin/students/student-profile.tsx`); o item destrutivo (`tone="danger"`) vem por último, depois do divisor.
- Radio group: basta `role="radiogroup"` e `role="radio"`; `RadioKeys` (kit/radio-keys.tsx) já dá setas, Home e End. Quem trata as setas sozinho precisa chamar `preventDefault`.
- Roster de exemplo (`lib/data/people.ts`, `people-generated.ts`): 201 alunos, 5 Payment issues (as pessoas dos Payment alerts), 7 at risk, 12 invited, 86 active, 14 joined this month; grupos Futures A 12, Futures B 8, December cohort 6 (iguais em Sales › Groups); todo aluno VIP tem uma oferta. Conferir esses números ao mexer no roster.
