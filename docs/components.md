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
| `src/components/widgets/` | Raiz: `registry.tsx` (catálogo e settings), `page.tsx`, `page-renderer.tsx` (masonry). `parts/`: o kit dos widgets (`kit.tsx`: `W`, `WidgetFrame`, `Drop`, `MOTION`, `useFitRows`; `shared.tsx`, `widget-scope.tsx`, `layouts.tsx`). `catalog/`: um arquivo por grupo de widgets (`catalog/more/` para os extras) | Usar a skill `traderhub-widget-design` antes de mexer. Widget novo vai em `catalog/` e entra no `registry.tsx`. |
| `src/components/admin/design/` | Editor de Design. `editor/`: casca, canvas, prévia (`page-builder.tsx`, `editor-shell.tsx`…). `panels/`: painéis laterais (`builder-panels.tsx`, `settings-panel.tsx`, `media-cards-editor.tsx`). `fields/`: campos e controles (`controls.tsx`, `design-fields.tsx`, `menu-sort.tsx`…). Raiz: dados (`looks.ts`, `options.ts`, `states.ts`) | Campo novo em `fields/`, painel novo em `panels/`. |
| `src/components/icons.tsx` | Todos os ícones (Carbon embrulhado com nomes do lucide) | Nunca importar `lucide-react` ou `@carbon/icons-react` direto. Ícone que falta: adicionar aqui. |
| `src/lib/theme/` | Tokens, `themeToCss`, contraste | Cor nova vira token, não hex solto no componente. |

Antes de criar um componente: `rg` pelo nome e pelo comportamento. Se já existe algo parecido em `ui/`, `kit/`, `admin/kit.tsx`
ou `widgets/parts/kit.tsx`, estender em vez de duplicar.

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

## 5. Motion

- Biblioteca: `motion` (`motion/react`). Nunca `framer-motion`. Utilitários do `@animate-ui/react` (`useShouldReduceMotion`,
  `CountingNumber`, `SlidingNumber`, `Highlight`) já respeitam o "reduzir movimento".
- Uma curva só: classe `ease-out` (`--ease-out`, cubic-bezier(0.23,1,0.32,1)) ou `MOTION.ease` no JS. Durações: 150ms em controles,
  `MOTION.enter` (.24s) em entradas, `MOTION.draw` (.45s) em gráficos.
- No Tailwind v4, `scale-*` é a propriedade CSS `scale`. Em `transition-[...]` com `active:scale`, incluir `scale` na lista.
- Sem `transition-all`. Listar as propriedades (`transition-[background-color,border-color,scale]`).
- Animar só `transform`/`opacity`/`scale`/`clip-path`. Não animar `height`, `top`, `box-shadow` em listas grandes.
- `prefers-reduced-motion` já zera transições CSS no `globals.css`. Animação em JS precisa de `useShouldReduceMotion`.

## 6. Bibliotecas específicas

- **Embla (`embla-carousel-react`):** só em `widgets/catalog/media.tsx`. Loop precisa de 8 slides ou mais (repetir os reais e contar os dots
  só dos reais). `reInit` quando a lista muda. Abaixo de 480px a Shelf vira Row.
- **Recharts:** sempre por `ui/chart.tsx` (`ChartContainer`, cores por `--chart-*`). Altura explícita no container, senão o gráfico
  fica com 0px. Para gráfico de preço use `components/charts/trade-chart.tsx`.
- **react-grid-layout:** está no `package.json` mas **não é usado** (as páginas usam masonry própria em `page-builder.tsx`). Não
  reintroduzir; candidato a remover a dependência.
- **Sonner:** `toast` de `sonner`, já montado em `app/layout.tsx`. O editor tem um segundo, com `id` próprio (`CANVAS_TOASTS` em `editor/page-builder.tsx`); fora isso, não montar outro `<Toaster />`.

## 7. Comportamento (bugs que já aconteceram)

- **Hydration:** nada de `Date.now()`, `Math.random()` ou `localStorage` no render. Use em evento ou `useEffect`. Ids com `useId`.
- **Altura 0 em size container:** filho `flex-1` com `[container-type:size]` em card de altura pelo conteúdo fica com 0px. Dar
  `aspect-*` ou altura mínima.
- **Dois `onProps` seguidos se sobrescrevem** no editor: juntar num patch só.
- **Listeners:** todo `addEventListener` em `useEffect` tem o `removeEventListener` no retorno.
- **Listas reordenáveis:** `key` estável (`id`), nunca o índice.
- **Store do protótipo:** `write()` pode falhar por cota; tratar o `false` (o toast já aparece).

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
