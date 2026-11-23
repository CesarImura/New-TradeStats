# Mapa de componentes (Figma × código)

Gerado por `scripts/maps/components-screens.mjs` em 2026-11-23, commit 77eccf8f. Figma: arquivo XWHeEdjEiY6gWmrsg0vFIZ, dados exportados em 21/11/2026 pelo MCP (pasta `docs/maps/data`). Não editar à mão: atualizar os dados e rodar de novo. Mudanças ficam em `docs/maps/CHANGELOG.md`.

162 famílias na página Components (283:9649). Correspondência com o código: confirmado 87 · pendente 64 · provável 11. Componentes `_Base` são a estrutura interna do público e normalmente não têm export próprio.

Seções: A01 a A15 = fluxos do Admin (Screens · Admin), E01 a E05 = grupos do Editor. Contagens incluem instâncias aninhadas. **Sem uso** = 0 instâncias nas telas oficiais (não apagar sem ok; ver status no mapa).

Como consultar: procure pelo nome do Figma, pelo ID ou pelo arquivo. Telas que usam uma seção: `docs/maps/screens.md`. Tokens: `docs/maps/tokens.md`.

## Admin · 01 Brand

| Figma (ID) | Variantes | Propriedades | Uso Admin / Editor | Seções | Código | Status | Evidência | Importado por |
|---|---|---|---|---|---|---|---|---|
| Admin / _Base Logo (`1096:2363`) | 1 | Show Wordmark | 192 / 42 | A01,A02,A03,A04,A05,A06,A07,A08,A09,A10,A11,A12,A13,A14,A15,E01,E02,E03,E04,E05 | ver arquivos citados | confirmado | citado em `src/components/brand/logo.tsx`, `src/components/onboarding/signup-frame.tsx` e mais 1 | — |
| Admin / Logo (`1096:2456`) | 5 | Tone | 192 / 42 | A01,A02,A03,A04,A05,A06,A07,A08,A09,A10,A11,A12,A13,A14,A15,E01,E02,E03,E04,E05 | ver arquivos citados | confirmado | citado em `src/components/brand/logo.tsx`, `src/components/onboarding/signup-frame.tsx` e mais 1 | — |

## Admin · 02 Actions

| Figma (ID) | Variantes | Propriedades | Uso Admin / Editor | Seções | Código | Status | Evidência | Importado por |
|---|---|---|---|---|---|---|---|---|
| Admin / _Base Button (`572:28448`) | 8 | Show Label, Label Text, Show L Icon, L Icon, Show R Icon, R Icon, Size, Icon Only | 1826 / 358 | A01,A02,A03,A04,A05,A06,A07,A08,A09,A10,A11,A12,A13,A14,A15,E01,E02,E03,E04,E05 | `AdminButton` em `src/components/admin/ui/button.tsx` | confirmado | citado em `src/components/admin/ui/button.tsx`, `src/lib/theme/admin-v2.ts` | 80 arquivos |
| Admin / Button (`572:28569`) | 18 | Hierarchy, State | 1853 / 358 | A01,A02,A03,A04,A05,A06,A07,A08,A09,A10,A11,A12,A13,A14,A15,E01,E02,E03,E04,E05 | `AdminButton` em `src/components/admin/ui/button.tsx` | confirmado | citado em `src/components/admin/ui/button.tsx`, `src/lib/theme/admin-v2.ts` | 80 arquivos |

## Admin · 03 Forms

| Figma (ID) | Variantes | Propriedades | Uso Admin / Editor | Seções | Código | Status | Evidência | Importado por |
|---|---|---|---|---|---|---|---|---|
| Admin / _Base Field (`693:1911`) | 5 | Show Label, Label Text, Show Optional, Show L Icon, L Icon, Value Text, Show Trailing, Trailing Text, Show R Icon, R Icon, Show Hint, Hint Text, Show Control, Show Prefix, Prefix Text, Show Action, Show Hint Icon, Hint Icon, Size, Type | 432 / 38 | A01,A02,A03,A04,A05,A06,A07,A08,A09,A10,A11,A12,A13,A14,A15,E01,E02,E03,E04,E05 | `AdminField` em `src/components/admin/ui/field.tsx` | confirmado | citado em `src/components/admin/ui/field.tsx`, `src/components/admin/ui/toolbar.tsx` e mais 1 | 27 arquivos |
| Admin / Field (`693:2023`) | 5 | State | 439 / 38 | A01,A02,A03,A04,A05,A06,A07,A08,A09,A10,A11,A12,A13,A14,A15,E01,E02,E03,E04,E05 | `AdminField` em `src/components/admin/ui/field.tsx` | confirmado | citado em `src/components/admin/ui/field.tsx`, `src/components/admin/ui/toolbar.tsx` e mais 1 | 27 arquivos |
| Admin / Checkbox (`545:71`) | 9 | Checked, State | 104 / 1 | A01,A03,A04,A05,A10,E05 | ver arquivos citados | confirmado | citado em `src/lib/theme/admin-v2.ts` | — |
| Admin / Radio (`545:76`) | 6 | Checked, State | 46 / 88 | A01,A03,A05,A07,A12,A15,E02,E04,E05 | ver arquivos citados | confirmado | citado em `src/components/admin/students/student-message.tsx` | — |
| Admin / Toggle (`545:56`) | 6 | Checked, State | 110 / 14 | A04,A05,A06,A07,A08,A09,A10,A11,A12,A13,A14,A15,E01,E05 | — | pendente | nenhum export nem citação encontrada | — |
| Admin / _Base Code box (`658:1671`) | 1 | Show Digit, Digit Text, Size | 6 / 0 | A01 | ver arquivos citados | confirmado | citado em `src/app/(onboarding)/signup/verify/page.tsx` | — |
| Admin / Code box (`658:1690`) | 6 | State | 6 / 0 | A01 | ver arquivos citados | confirmado | citado em `src/app/(onboarding)/signup/verify/page.tsx` | — |
| Admin / _Base Code input (`658:1711`) | 1 | Length | 1 / 0 | A01 | — | pendente | nenhum export nem citação encontrada | — |
| Admin / Code input (`658:1784`) | 3 | State | 1 / 0 | A01 | — | pendente | nenhum export nem citação encontrada | — |
| Admin / _Base Filter (`578:513`) | 1 | Label Text, Show Label, Value Text | 95 / 79 | A01,A02,A03,A04,A05,A06,A07,A09,A10,A12,A14,E01,E02,E03,E04,E05 | `AdminFilter` em `src/components/admin/ui/toolbar.tsx` | confirmado | citado em `src/components/admin/ui/toolbar.tsx` | 16 arquivos |
| Admin / Filter (`578:539`) | 3 | State | 95 / 79 | A01,A02,A03,A04,A05,A06,A07,A09,A10,A12,A14,E01,E02,E03,E04,E05 | `AdminFilter` em `src/components/admin/ui/toolbar.tsx` | confirmado | citado em `src/components/admin/ui/toolbar.tsx` | 16 arquivos |
| Admin / Segmented item (`934:7154`) | 8 | Label Text, Icon, Show Icon, State, Icon Only | 65 / 276 | A01,A09,E01,E02,E03,E04,E05 | — | pendente | nenhum export nem citação encontrada | — |
| Admin / Segmented (`934:7156`) | 1 | Items | 17 / 108 | A01,A09,E01,E02,E03,E04,E05 | `AdminSegmented` em `src/components/admin/ui/segmented.tsx` | confirmado | citado em `src/components/admin/design/fields/choice-cards.tsx`, `src/components/admin/ui/segment-group.tsx` e mais 1 | 17 arquivos |
| Admin / _Base Choice chip (`945:2262`) | 1 | Label Text | 29 / 39 | A01,E02,E05 | ver arquivos citados | confirmado | citado em `src/components/onboarding/signup-frame.tsx` | — |
| Admin / Choice chip (`945:2318`) | 4 | State | 35 / 39 | A01,E02,E05 | ver arquivos citados | confirmado | citado em `src/components/onboarding/signup-frame.tsx` | — |
| Admin / _Base Color field (`983:2344`) | 1 | Value Text | 3 / 12 | A01,E02 | `ColorField` em `src/components/admin/design/fields/color-picker.tsx` | confirmado | citado em `src/components/onboarding/design-setup.tsx` | 3 arquivos |
| Admin / Color field (`983:2427`) | 4 | State | 3 / 12 | A01,E02 | `ColorField` em `src/components/admin/design/fields/color-picker.tsx` | confirmado | citado em `src/components/onboarding/design-setup.tsx` | 3 arquivos |
| Admin / _Base E-mail chip (`1059:2352`) | 1 | Label Text, Show Remove | 5 / 0 | A01 | ver arquivos citados | confirmado | citado em `src/components/admin/getting-started/email-chips.tsx` | — |
| Admin / E-mail chip (`1059:2497`) | 3 | State | 5 / 0 | A01 | ver arquivos citados | confirmado | citado em `src/components/admin/getting-started/email-chips.tsx` | — |
| Admin / Swatch (`1127:10854`) | 3 | State | 8 / 42 | A01,E02 | `Swatch` em `src/components/admin/design/fields/swatch.tsx` | confirmado | citado em `src/components/admin/design/fields/swatch.tsx` | 4 arquivos |
| Admin / Swatch pair (`1186:60309`) | 3 | State | 3 / 9 | A01,E02 | — | pendente | nenhum export nem citação encontrada | — |

## Admin · 04 Navigation

| Figma (ID) | Variantes | Propriedades | Uso Admin / Editor | Seções | Código | Status | Evidência | Importado por |
|---|---|---|---|---|---|---|---|---|
| Admin / Topbar (`549:162`) | 1 | Show Unread | 181 / 0 | A01,A02,A03,A04,A05,A06,A07,A08,A09,A10,A11,A12,A13,A14,A15 | ver arquivos citados | confirmado | citado em `src/components/shells/admin-shell.tsx` | — |
| Admin / Nav item (`581:631`) | 6 | State, Icon Only | 2905 / 126 | A01,A02,A03,A04,A05,A06,A07,A08,A09,A10,A11,A12,A13,A14,A15,E01,E02,E03,E04,E05 | ver arquivos citados | confirmado | citado em `src/components/shells/admin-shell.tsx` | — |
| Admin / Nav group (`753:38238`) | 1 | Icon, Show Icon, Label Text | 80 / 0 | A01,A15 | — | pendente | nenhum export nem citação encontrada | — |
| Admin / _Base Tab (`580:447`) | 1 | Label Text, Show Count, Count Text, Show Dot | 676 / 130 | A01,A02,A03,A04,A05,A06,A07,A08,A09,A10,A11,A12,A13,A14,E02,E05 | ver arquivos citados | confirmado | citado em `src/components/admin/ui/data-table.tsx`, `src/components/admin/ui/tab-panel.tsx` e mais 3 | — |
| Admin / Tab (`580:459`) | 3 | State | 676 / 130 | A01,A02,A03,A04,A05,A06,A07,A08,A09,A10,A11,A12,A13,A14,E02,E05 | ver arquivos citados | confirmado | citado em `src/components/admin/ui/data-table.tsx`, `src/components/admin/ui/tab-panel.tsx` e mais 3 | — |
| Admin / _Base Underline tab (`580:460`) | 1 | Label Text | 62 / 0 | A01,A03,A05,A12 | ver arquivos citados | confirmado | citado em `src/components/admin/ui/underline-tabs.tsx` | — |
| Admin / Underline tab (`580:471`) | 3 | State | 62 / 0 | A01,A03,A05,A12 | ver arquivos citados | confirmado | citado em `src/components/admin/ui/underline-tabs.tsx` | — |
| Admin / _Base Segmented option (`580:472`) | 1 | Label Text | 161 / 0 | A01,A04,A05,A06,A07,A08,A09,A10,A11,A12,A13,A14,A15 | ver arquivos citados | confirmado | citado em `src/components/admin/ui/segmented.tsx` | — |
| Admin / Segmented option (`580:480`) | 3 | State | 163 / 0 | A01,A04,A05,A06,A07,A08,A09,A10,A11,A12,A13,A14,A15 | ver arquivos citados | confirmado | citado em `src/components/admin/ui/segmented.tsx` | — |
| Admin / _Base Sub-nav item (`580:545`) | 1 | Label Text, Show Indicator | 156 / 0 | A01,A15 | — | pendente | nenhum export nem citação encontrada | — |
| Admin / Sub-nav item (`580:556`) | 3 | State | 156 / 0 | A01,A15 | — | pendente | nenhum export nem citação encontrada | — |
| Admin / Menu (`548:175`) | 1 | Items | 1 / 4 | A02,E05 | `AdminMenu` em `src/components/admin/ui/menu.tsx` | confirmado | citado em `src/components/admin/account-menu.tsx`, `src/components/admin/ui/menu.tsx` e mais 1 | 5 arquivos |
| Admin / _Base Menu item (`580:515`) | 1 | Label Text, Show L Icon, L Icon, Show Shortcut, Shortcut Text | 6 / 23 | A02,E05 | `AdminMenuItem` em `src/components/admin/ui/menu.tsx` | confirmado | citado em `src/components/admin/ui/menu.tsx`, `src/lib/theme/admin-v2.ts` | 6 arquivos |
| Admin / Menu item (`580:543`) | 6 | Tone, State | 6 / 23 | A02,E05 | `AdminMenuItem` em `src/components/admin/ui/menu.tsx` | confirmado | citado em `src/components/admin/ui/menu.tsx`, `src/lib/theme/admin-v2.ts` | 6 arquivos |
| Admin / _Base Timeline step (`957:2266`) | 1 | Title Text, Description Text, Show Action, Show Edit, Show Line, Show Guide, Show Line Top, Show Skip, Show Tag, Show Icon, Icon | 105 / 0 | A01,A12 | `TimelineStep` em `src/components/admin/ui/timeline-step.tsx` | confirmado | citado em `src/components/admin/ui/timeline-step.tsx` | 3 arquivos |
| Admin / Timeline step (`957:2923`) | 5 | State | 105 / 0 | A01,A12 | `TimelineStep` em `src/components/admin/ui/timeline-step.tsx` | confirmado | citado em `src/components/admin/ui/timeline-step.tsx` | 3 arquivos |
| Admin / _Base Nav item (`1100:2437`) | 2 | Label Text, L Icon, Show Badge, Badge Text, Icon Only | 2905 / 126 | A01,A02,A03,A04,A05,A06,A07,A08,A09,A10,A11,A12,A13,A14,A15,E01,E02,E03,E04,E05 | ver arquivos citados | confirmado | citado em `src/components/shells/admin-shell.tsx` | — |
| Admin / Sidebar (`1101:2679`) | 2 | Show Invite Card, Workspace Text, Role Text, Initial Text, Size | 181 / 0 | A01,A02,A03,A04,A05,A06,A07,A08,A09,A10,A11,A12,A13,A14,A15 | ver arquivos citados | confirmado | citado em `src/components/shells/admin-shell.tsx` | — |
| Admin / Help row (`1639:68798`) | 2 | Label Text, Icon, State | 45 / 0 | A01 | — | pendente | nenhum export nem citação encontrada | — |

## Admin · 05 Layout

| Figma (ID) | Variantes | Propriedades | Uso Admin / Editor | Seções | Código | Status | Evidência | Importado por |
|---|---|---|---|---|---|---|---|---|
| Admin / Page header (`549:89`) | 1 | Actions, Title Text, Show Subtitle, Subtitle Text | 150 / 0 | A01,A03,A04,A05,A06,A07,A08,A09,A10,A11,A12,A13,A14,A15 | `AdminPageHeader` em `src/components/admin/ui/page-header.tsx` | confirmado | citado em `src/components/admin/kit.tsx`, `src/components/admin/ui/page-header.tsx` | 5 arquivos |
| Admin / Panel (`548:95`) | 1 | Content, Show Header | 151 / 4 | A01,A04,A05,A07,A08,A09,A10,A11,A12,A13,A14,A15,E05 | `Panel` em `src/components/admin/ui/panel.tsx` | confirmado | citado em `src/components/admin/getting-started/go-live.tsx`, `src/components/admin/ui/panel.tsx` e mais 2 | 44 arquivos |
| Admin / Panel header (`548:82`) | 1 | Actions, Title Text, Show Subtitle, Subtitle Text | 23 / 0 | A01,A04,A08 | `PanelHeader` em `src/components/admin/ui/panel.tsx` | confirmado | citado em `src/components/admin/ui/panel.tsx` | 8 arquivos |
| Admin / Modal (`549:110`) | 1 | Body, Title Text, Show Subtitle, Subtitle Text, Show Footer, Footer Actions, Header Actions, Show Header Actions | 16 / 3 | A01,A03,A04,A05,A07,A08,A09,A12,A13,A14,A15,E02,E05 | `AdminModal` em `src/components/admin/ui/modal.tsx` | confirmado | citado em `src/components/admin/getting-started/help-panels.tsx`, `src/components/admin/ui/modal.tsx` e mais 1 | 21 arquivos |
| Admin / Drawer (`549:136`) | 1 | Body, Title Text, Show Subtitle, Subtitle Text, Show Footer, Footer Actions, Header Actions, Show Header Actions | 22 / 1 | A01,A03,A05,A06,A07,A10,A12,E05 | `AdminDrawer` em `src/components/admin/ui/modal.tsx` | confirmado | citado em `src/components/admin/getting-started/help-panels.tsx`, `src/components/admin/ui/modal.tsx` | 14 arquivos |
| Admin / Divider (`753:38236`) | 1 | — | 64 / 0 | A01,A15 | — | pendente | nenhum export nem citação encontrada | — |
| Admin / Empty state (`548:160`) | 1 | Actions, Title Text, Description Text, Empty Icon | 34 / 2 | A01,A02,A03,A04,A05,A06,A08,A10,A11,A12,A13,A14,E03,E05 | `EmptyState` em `src/components/admin/ui/empty-state.tsx` | confirmado | citado em `src/components/admin/ui/empty-state.tsx` | 27 arquivos |
| Admin / Empty state · Compact (`1351:2783`) | 1 | Text | 10 / 0 | A02,A12,A14 | — | pendente | nenhum export nem citação encontrada | — |

## Admin · 06 Cards & lists

| Figma (ID) | Variantes | Propriedades | Uso Admin / Editor | Seções | Código | Status | Evidência | Importado por |
|---|---|---|---|---|---|---|---|---|
| Admin / _Base Media card (`736:1970`) | 2 | Visual, Show Status, Status Text, Status Action, Title, Subtitle, Show Subtitle, Meta, Stats, Show Stats, Show Scheduled icon, Size | 17 / 0 | A01,A05 | `MediaCard` em `src/components/admin/ui/media-card.tsx` | confirmado | citado em `src/components/admin/ui/media-card.tsx` | 7 arquivos |
| Admin / Media card (`736:2101`) | 2 | State | 20 / 0 | A01,A05 | `MediaCard` em `src/components/admin/ui/media-card.tsx` | confirmado | citado em `src/components/admin/ui/media-card.tsx` | 7 arquivos |
| Admin / Lesson card (`557:243`) | 1 | Title Text | 35 / 0 | A01,A05 | `LessonCard` em `src/components/admin/ui/lesson-card.tsx` | confirmado | citado em `src/components/admin/ui/lesson-card.tsx` | 3 arquivos |
| Admin / _Base Option card (`672:34191`) | 2 | Content, Show Control, Control, Title Text, Description Text, Show Description, Show Trailing, Show Title, Side | 25 / 8 | A01,A03,A05,A07,A15,E05 | `OptionCard` em `src/components/admin/ui/option-card.tsx` | confirmado | citado em `src/components/admin/ui/option-card.tsx` | 5 arquivos |
| Admin / Option card (`674:2167`) | 4 | State | 25 / 8 | A01,A03,A05,A07,A15,E05 | `OptionCard` em `src/components/admin/ui/option-card.tsx` | confirmado | citado em `src/components/admin/ui/option-card.tsx` | 5 arquivos |
| Admin / _Base Sortable row (`748:38108`) | 1 | Show Drag, Title Text, Description Text, Show Description, Trailing | 25 / 0 | A01,A05,A10,A12,A15 | `SortableRow` em `src/components/admin/ui/sortable-row.tsx` | confirmado | citado em `src/components/admin/ui/sortable-row.tsx` | 4 arquivos |
| Admin / Sortable row (`748:38223`) | 5 | State | 37 / 0 | A01,A05,A10,A12,A15 | `SortableRow` em `src/components/admin/ui/sortable-row.tsx` | confirmado | citado em `src/components/admin/ui/sortable-row.tsx` | 4 arquivos |
| Admin / _Base Selection card (`934:2245`) | 1 | Media, Title Text, Description Text, Show Description, Control, Show Control | 17 / 122 | A01,E01,E02,E03,E05 | `SelectionCard` em `src/components/admin/design/fields/choice-cards.tsx` | confirmado | citado em `src/components/admin/design/fields/choice-cards.tsx`, `src/components/admin/design/thumbs/option-art.tsx` | 4 arquivos |
| Admin / Selection card (`934:2287`) | 4 | State | 17 / 122 | A01,E01,E02,E03,E05 | `SelectionCard` em `src/components/admin/design/fields/choice-cards.tsx` | confirmado | citado em `src/components/admin/design/fields/choice-cards.tsx`, `src/components/admin/design/thumbs/option-art.tsx` | 4 arquivos |
| Admin / Setup tip (`1353:2423`) | 1 | Title Text, Steps Text, Show Action | 3 / 0 | A03,A07,A10 | `SetupTip` em `src/components/admin/setup-checklist.tsx` | provável | nome do export | 5 arquivos |

## Admin · 07 Tables

| Figma (ID) | Variantes | Propriedades | Uso Admin / Editor | Seções | Código | Status | Evidência | Importado por |
|---|---|---|---|---|---|---|---|---|
| Admin / Table (`662:30058`) | 1 | Content | 55 / 0 | A01,A03,A04,A05,A06,A07,A08,A10,A11,A12,A14,A15 | `AdminTable` em `src/components/admin/ui/data-table.tsx` | confirmado | citado em `src/components/admin/ui/data-table.tsx`, `src/components/admin/ui/table.tsx` | 18 arquivos |
| Admin / Table head (`662:30063`) | 1 | Content | 54 / 0 | A01,A03,A04,A05,A06,A07,A08,A10,A11,A12,A14,A15 | `AdminTableHead` em `src/components/admin/ui/data-table.tsx` | confirmado | citado em `src/components/admin/ui/data-table.tsx` | 17 arquivos |
| Admin / Table footer (`662:30068`) | 1 | Content | 30 / 0 | A03,A04,A05,A06,A07,A10,A11,A12,A14 | `AdminTableFooter` em `src/components/admin/ui/data-table.tsx` | confirmado | citado em `src/components/admin/ui/data-table.tsx` | 11 arquivos |
| Admin / Table row (`662:30088`) | 3 | Content, State | 274 / 0 | A01,A03,A04,A05,A06,A07,A08,A10,A11,A12,A14,A15 | `TableRow` em `src/components/admin/ui/table.tsx` | confirmado | citado em `src/components/admin/ui/data-table.tsx` | 7 arquivos |
| Admin / Table cell (`662:30099`) | 2 | Content, Align | 1744 / 0 | A01,A03,A04,A05,A06,A07,A08,A10,A11,A12,A14,A15 | `TableCell` em `src/components/admin/ui/table.tsx` | confirmado | citado em `src/components/admin/ui/data-table.tsx` | 7 arquivos |
| Admin / Table head cell (`662:30104`) | 2 | Label Text, Show Checkbox, Align | 320 / 0 | A01,A03,A04,A05,A06,A07,A08,A10,A11,A12,A14,A15 | ver arquivos citados | confirmado | citado em `src/components/admin/ui/data-table.tsx` | — |
| Admin / Cell stack (`662:30112`) | 2 | Title Text, Subtitle Text, Show Subtitle, Weight | 180 / 0 | A03,A04,A10,A11,A15 | `CellStack` em `src/components/admin/ui/table-cells.tsx` | confirmado | citado em `src/components/admin/ui/table-cells.tsx` | 3 arquivos |
| Admin / Cell person (`662:30118`) | 1 | — | 94 / 0 | A03,A04,A15 | `CellPerson` em `src/components/admin/ui/table-cells.tsx` | confirmado | citado em `src/components/admin/ui/table-cells.tsx` | 4 arquivos |
| Admin / Cell progress (`662:30126`) | 1 | Value Text | 72 / 0 | A03 | `CellProgress` em `src/components/admin/ui/table-cells.tsx` | confirmado | citado em `src/components/admin/ui/table-cells.tsx` | 2 arquivos |
| Admin / Cell dot (`662:30140`) | 3 | Label Text, Tone | 0 / 0 · **sem uso** | — | `CellDot` em `src/components/admin/ui/table-cells.tsx` | confirmado | citado em `src/components/admin/ui/table-cells.tsx` | 2 arquivos |

## Admin · 08 Data display

| Figma (ID) | Variantes | Propriedades | Uso Admin / Editor | Seções | Código | Status | Evidência | Importado por |
|---|---|---|---|---|---|---|---|---|
| Admin / _Base Tag (`576:380`) | 1 | Label Text, Show Dot, Show Remove | 406 / 43 | A01,A02,A03,A04,A05,A06,A07,A08,A09,A10,A11,A12,A13,A14,A15,E01,E02,E03,E04,E05 | `Tag` em `src/components/admin/ui/tag.tsx` | confirmado | citado em `src/components/admin/ui/tag.tsx`, `src/lib/theme/admin-v2.ts` | 51 arquivos |
| Admin / Tag (`576:414`) | 6 | Tone | 421 / 43 | A01,A02,A03,A04,A05,A06,A07,A08,A09,A10,A11,A12,A13,A14,A15,E01,E02,E03,E04,E05 | `Tag` em `src/components/admin/ui/tag.tsx` | confirmado | citado em `src/components/admin/ui/tag.tsx`, `src/lib/theme/admin-v2.ts` | 51 arquivos |
| Admin / Avatar (`545:47`) | 3 | Initials Text, Show Status, Size | 372 / 0 | A01,A02,A03,A04,A05,A06,A07,A08,A09,A10,A11,A12,A13,A14,A15 | `AdminAvatar` em `src/components/admin/ui/avatar.tsx` | confirmado | citado em `src/components/admin/ui/avatar.tsx` | 4 arquivos |
| Admin / Progress (`545:85`) | 4 | Tone | 91 / 2 | A01,A03,A05,E02,E05 | `AdminProgress` em `src/components/admin/ui/progress-line.tsx` | confirmado | citado em `src/components/admin/ui/progress-line.tsx`, `src/components/admin/ui/progress-ring.tsx` | 8 arquivos |
| Admin / _Base Progress item (`687:1926`) | 3 | Show Title, Title Text, Show Value, Value Text, Show Action, Show Bar, Size | 17 / 0 | A01,A03,A05 | — | pendente | nenhum export nem citação encontrada | — |
| Admin / Progress item (`687:1927`) | 1 | — | 22 / 0 | A01,A03,A05 | — | pendente | nenhum export nem citação encontrada | — |
| Admin / _Base Metric (`583:520`) | 2 | Label Text, Value Text, Show Delta, Delta Text, Show Icon, Icon, Size | 168 / 0 | A01,A03,A04,A05,A08,A11,A12,A13,A14,A15 | `Metric` em `src/components/admin/ui/metric.tsx` | confirmado | citado em `src/components/admin/ui/metric.tsx`, `src/components/admin/ui/stat-panel.tsx` | 4 arquivos |
| Admin / Metric (`583:539`) | 3 | Tone | 174 / 0 | A01,A03,A04,A05,A08,A11,A12,A13,A14,A15 | `Metric` em `src/components/admin/ui/metric.tsx` | confirmado | citado em `src/components/admin/ui/metric.tsx`, `src/components/admin/ui/stat-panel.tsx` | 4 arquivos |
| Admin / _Base Callout (`583:540`) | 1 | Message Text, Show Action | 51 / 8 | A01,A03,A04,A05,A06,A07,A09,A10,A12,A13,A14,A15,E02,E05 | `Callout` em `src/components/admin/ui/callout.tsx` | confirmado | citado em `src/components/admin/ui/callout.tsx` | 22 arquivos |
| Admin / Callout (`583:614`) | 5 | Tone | 64 / 8 | A01,A03,A04,A05,A06,A07,A09,A10,A12,A13,A14,A15,E02,E05 | `Callout` em `src/components/admin/ui/callout.tsx` | confirmado | citado em `src/components/admin/ui/callout.tsx` | 22 arquivos |
| Admin / _Base Step indicator (`590:585`) | 4 | Number Text, Show Number, Show Check, Show Lock, Size | 143 / 0 | A01,A03,A05,A06,A07,A08,A12 | `StepIndicator` em `src/components/admin/ui/step-indicator.tsx` | confirmado | citado em `src/components/admin/ui/step-indicator.tsx` | 8 arquivos |
| Admin / Step indicator (`590:600`) | 8 | State, Tone | 148 / 0 | A01,A03,A05,A07,A08,A12 | `StepIndicator` em `src/components/admin/ui/step-indicator.tsx` | confirmado | citado em `src/components/admin/ui/step-indicator.tsx` | 8 arquivos |
| Admin / Icon tile (`1147:2518`) | 1 | Icon | 39 / 63 | A01,A12,E03,E05 | — | pendente | nenhum export nem citação encontrada | — |
| Admin / Video player (`1296:2607`) | 1 | Show Action, Show Center Play, Time Text, Chapter Text, Show Chapter, Show Seek, Play Icon, Show Live | 4 / 0 | A05,A08 | `AdminVideoPlayer` em `src/components/admin/ui/video-player.tsx` | confirmado | citado em `src/components/admin/ui/video-player.tsx` | 3 arquivos |
| Admin / Live dot (`1832:71845`) | 2 | Tone | 14 / 0 | A02,A08 | `LiveDot` em `src/components/admin/ui/live-dot.tsx` | confirmado | citado em `src/components/admin/ui/live-dot.tsx`, `src/components/ui/ping-dot.tsx` | 3 arquivos |
| Admin / Toast (`1859:72870`) | 3 | Show Description, Show Action, Show Icon, Title Text, Description Text, Type | 1 / 0 | A02 | — | pendente | nenhum export nem citação encontrada | — |

## Admin · 09 Charts

| Figma (ID) | Variantes | Propriedades | Uso Admin / Editor | Seções | Código | Status | Evidência | Importado por |
|---|---|---|---|---|---|---|---|---|
| Admin / _Base Chart bar (`756:38410`) | 1 | Show Value, Value Text, Show Label, Label Text | 24 / 0 | A03,A12 | — | pendente | nenhum export nem citação encontrada | — |
| Admin / Chart bar (`756:38441`) | 3 | Tone | 24 / 0 | A03,A12 | — | pendente | nenhum export nem citação encontrada | — |
| Admin / Bar chart (`756:38442`) | 1 | Bars, Show Y axis, Max Tick, Mid Tick, Min Tick, Show Grid | 3 / 0 | A03,A12 | — | pendente | nenhum export nem citação encontrada | — |
| Admin / Chart preview (`596:1316`) | 4 | Series | 1 / 0 | A04 | — | pendente | nenhum export nem citação encontrada | — |

## Admin · 10 Files

| Figma (ID) | Variantes | Propriedades | Uso Admin / Editor | Seções | Código | Status | Evidência | Importado por |
|---|---|---|---|---|---|---|---|---|
| Admin / _Base Dropzone (`745:38098`) | 2 | Show Icon, Icon, Title Text, Show Hint, Hint Text, Size | 7 / 1 | A01,A03,A05,A06,E04 | `Dropzone` em `src/components/admin/ui/dropzone.tsx` | confirmado | citado em `src/components/admin/ui/dropzone.tsx` | 8 arquivos |
| Admin / Dropzone (`745:38118`) | 4 | State | 11 / 1 | A01,A03,A05,A06,E04 | `Dropzone` em `src/components/admin/ui/dropzone.tsx` | confirmado | citado em `src/components/admin/ui/dropzone.tsx` | 8 arquivos |
| Admin / _Base File icon (`767:38959`) | 3 | Label Text, Size | 39 / 1 | A03,A06,A11,E02 | `FileIcon` em `src/components/admin/ui/file-icon.tsx` | confirmado | citado em `src/components/admin/ui/file-icon.tsx` | 4 arquivos |
| Admin / File icon (`767:38975`) | 15 | Type, Size | 39 / 1 | A03,A06,A11,E02 | `FileIcon` em `src/components/admin/ui/file-icon.tsx` | confirmado | citado em `src/components/admin/ui/file-icon.tsx` | 4 arquivos |
| Admin / _Base File item (`768:2085`) | 1 | Trailing, Name Text, Meta Text, Show Value, Value Text, Show Bar, Show Status, Status Text, Show Done Icon, Show Error Icon, Show Meta | 2 / 1 | A03,A06,E02 | `FileItem` em `src/components/admin/ui/file-item.tsx` | confirmado | citado em `src/components/admin/ui/file-item.tsx` | 5 arquivos |
| Admin / File item (`768:2252`) | 5 | Status | 2 / 1 | A03,A06,E02 | `FileItem` em `src/components/admin/ui/file-item.tsx` | confirmado | citado em `src/components/admin/ui/file-item.tsx` | 5 arquivos |

## Admin · 11 Scheduling

| Figma (ID) | Variantes | Propriedades | Uso Admin / Editor | Seções | Código | Status | Evidência | Importado por |
|---|---|---|---|---|---|---|---|---|
| Admin / _Base Calendar event (`583:636`) | 1 | Title Text, Meta Text, Show Meta | 68 / 0 | A07 | ver arquivos citados | confirmado | citado em `src/components/admin/calendar/calendar-views.tsx` | — |
| Admin / Calendar event (`583:660`) | 4 | Type | 74 / 0 | A07 | ver arquivos citados | confirmado | citado em `src/components/admin/calendar/calendar-views.tsx` | — |

## Admin · 12 Covers

| Figma (ID) | Variantes | Propriedades | Uso Admin / Editor | Seções | Código | Status | Evidência | Importado por |
|---|---|---|---|---|---|---|---|---|
| Admin / Cover / course-foundations (`494:1831`) | 1 | — | 0 / 0 · **sem uso** | — | — | pendente | nenhum export nem citação encontrada | — |
| Admin / Cover / course-playbook (`494:1893`) | 1 | — | 0 / 0 · **sem uso** | — | — | pendente | nenhum export nem citação encontrada | — |
| Admin / Cover / course-psychology (`494:1955`) | 1 | — | 0 / 0 · **sem uso** | — | — | pendente | nenhum export nem citação encontrada | — |

## Editor · 01 Shell

| Figma (ID) | Variantes | Propriedades | Uso Admin / Editor | Seções | Código | Status | Evidência | Importado por |
|---|---|---|---|---|---|---|---|---|
| Admin / Editor Top bar (`62:884`) | 1 | Back Text, Section Text, Center, Actions | 3 / 42 | A01,E01,E02,E03,E04,E05 | `EditorTopBar` em `src/components/admin/design/editor/top-bar.tsx` | confirmado | citado em `src/components/admin/design/editor/top-bar.tsx` | 2 arquivos |
| Admin / Editor Rail (`62:872`) | 1 | Buttons | 3 / 42 | A01,E01,E02,E03,E04,E05 | ver arquivos citados | confirmado | citado em `src/components/admin/design/panels/settings-panel.tsx` | — |
| Admin / Editor Panel (`62:874`) | 1 | Title Text, Content, Show Caption, Caption Text | 0 / 0 · **sem uso** | — | — | pendente | nenhum export nem citação encontrada | — |
| Admin / Editor Inspector (`62:880`) | 1 | Title Text, Hint Text, Show Hint, Content, Show Icon, Show Actions | 1 / 11 | A01,E03,E04,E05 | — | pendente | nenhum export nem citação encontrada | — |
| Admin / Editor Section (`71:122`) | 1 | Title Text, Content, Show Chevron, Show Dot, Show Reset | 5 / 67 | A01,E01,E02,E03,E04,E05 | — | pendente | nenhum export nem citação encontrada | — |
| Admin / Editor Widget toolbar (`156:287`) | 1 | State | 1 / 1 | A01,E03 | — | pendente | nenhum export nem citação encontrada | — |
| Admin / Editor Zoom (`1151:21831`) | 1 | Zoom Text | 3 / 36 | A01,E01,E02,E03,E05 | ver arquivos citados | confirmado | citado em `src/components/admin/design/editor/page-builder.tsx` | — |
| Admin / Editor Canvas dots (`1189:71873`) | 1 | — | 6 / 84 | A01,E01,E02,E03,E04,E05 | ver arquivos citados | confirmado | citado em `src/components/admin/design/editor/canvas-bg.ts` | — |

## Editor · 02 Controls

| Figma (ID) | Variantes | Propriedades | Uso Admin / Editor | Seções | Código | Status | Evidência | Importado por |
|---|---|---|---|---|---|---|---|---|
| Admin / Editor Upsell card (`80:3469`) | 1 | Title Text, Body Text, Link Text | 0 / 0 · **sem uso** | — | — | pendente | nenhum export nem citação encontrada | — |
| Admin / Editor List row (`1128:12988`) | 2 | Label Text, Show Tile, Show Lead Icon, Lead Icon, Show Trail Icon, Trail Icon, Show Meta, Meta Text, State | 18 / 81 | A01,E01,E02,E03,E05 | — | pendente | nenhum export nem citação encontrada | — |
| Admin / Editor Design all card (`1130:13011`) | 2 | State | 2 / 8 | A01,E03,E05 | ver arquivos citados | confirmado | citado em `src/components/admin/design/editor/design-workspace.tsx` | — |
| Admin / Editor Field (`1147:21226`) | 3 | Label Text, Hint Text, Show Hint, Control, Layout | 13 / 131 | A01,E01,E02,E03,E04,E05 | — | pendente | nenhum export nem citação encontrada | — |
| Admin / Editor Button shape (`1158:21551`) | 3 | Shape | 0 / 12 | E03 | ver arquivos citados | confirmado | citado em `src/components/admin/design/panels/all-widgets-inspector.tsx` | — |
| Admin / Menu row (`1275:2521`) | 3 | Type, Visible | 0 / 10 | E01 | `MenuRow` em `src/components/admin/design/fields/menu-fields.tsx` | provável | nome do export | 1 arquivos |
| Admin / Editor Theme art (`1442:64929`) | 6 | Theme, Size | 6 / 54 | A01,E02,E05 | — | pendente | nenhum export nem citação encontrada | — |
| Admin / Editor Layout art (`1442:65049`) | 8 | Layout, Size | 4 / 4 | A01,E02 | — | pendente | nenhum export nem citação encontrada | — |
| Admin / Editor Background art (`1443:2622`) | 4 | Kind | 0 / 8 | E02 | ver arquivos citados | confirmado | citado em `src/components/admin/design/fields/background-control.tsx` | — |

## Editor · 03 Preview

| Figma (ID) | Variantes | Propriedades | Uso Admin / Editor | Seções | Código | Status | Evidência | Importado por |
|---|---|---|---|---|---|---|---|---|
| Admin / Editor Preview shell (`62:891`) | 1 | Workspace Text, Nav, Eyebrow Text, Greeting Text, Widgets, Badge Text | 3 / 34 | A01,E01,E02,E03,E05 | — | pendente | nenhum export nem citação encontrada | — |
| Admin / _Base Editor Preview nav item (`598:660`) | 1 | Label Text, Icon | 27 / 297 | A01,E01,E02,E03,E05 | — | pendente | nenhum export nem citação encontrada | — |
| Admin / Editor Preview nav item (`598:674`) | 2 | State | 27 / 297 | A01,E01,E02,E03,E05 | — | pendente | nenhum export nem citação encontrada | — |
| Admin / Editor Preview logo mark (`171:1026`) | 1 | Initial Text | 5 / 5 | A12,E04 | — | pendente | nenhum export nem citação encontrada | — |
| Admin / Editor Avatar (`51:64`) | 2 | Initials Text, Size | 3 / 33 | A01,E01,E02,E03,E05 | — | pendente | nenhum export nem citação encontrada | — |

## Public · 01 Join

| Figma (ID) | Variantes | Propriedades | Uso Admin / Editor | Seções | Código | Status | Evidência | Importado por |
|---|---|---|---|---|---|---|---|---|
| Public / Form field (`128:2899`) | 1 | Label | 7 / 8 | A12,E04 | — | pendente | nenhum export nem citação encontrada | — |
| Public / Plan card (`128:2910`) | 1 | Name, Price, Selected | 2 / 6 | A12,E04 | — | pendente | nenhum export nem citação encontrada | — |
| Public / Auth card (`128:3010`) | 3 | Eyebrow, Title, Subtitle, Show name, Show Discord, Show footer, Footer text, Card | 0 / 3 | E04 | — | pendente | nenhum export nem citação encontrada | — |
| Public / Checkout (`129:2930`) | 1 | Title, Subtitle | 0 / 2 | E04 | `Checkout` em `src/components/public/checkout.tsx` | provável | nome do export | 5 arquivos |
| Public / Shell (`132:3089`) | 2 | Body, Custom look, Layout | 0 / 5 | E04 | `PublicShell` em `src/components/public/public-shell.tsx` | provável | nome do export | 2 arquivos |

## Terminal · 01 Actions

| Figma (ID) | Variantes | Propriedades | Uso Admin / Editor | Seções | Código | Status | Evidência | Importado por |
|---|---|---|---|---|---|---|---|---|
| Terminal / _Base Button (`101:116`) | 8 | Show Label, Label Text, Show L Icon, L Icon, Show R Icon, R Icon, Size, Icon Only | 12 / 47 | A01,A12,E01,E02,E03,E04,E05 | — | pendente | nenhum export nem citação encontrada | — |
| Terminal / Button (`101:235`) | 9 | Hierarchy, State | 12 / 47 | A01,A12,E01,E02,E03,E04,E05 | — | pendente | nenhum export nem citação encontrada | — |

## Terminal · 02 Forms

| Figma (ID) | Variantes | Propriedades | Uso Admin / Editor | Seções | Código | Status | Evidência | Importado por |
|---|---|---|---|---|---|---|---|---|
| Terminal / _Base Input (`102:2390`) | 3 | Value, Show L Icon, L Icon, Show R Icon, R Icon, Size | 10 / 16 | A12,E04 | — | pendente | nenhum export nem citação encontrada | — |
| Terminal / Input (`102:2416`) | 5 | State | 10 / 16 | A12,E04 | — | pendente | nenhum export nem citação encontrada | — |

## Terminal · 03 Navigation

| Figma (ID) | Variantes | Propriedades | Uso Admin / Editor | Seções | Código | Status | Evidência | Importado por |
|---|---|---|---|---|---|---|---|---|
| Terminal / _Base Tab (`122:11365`) | 1 | Label Text, Show L Icon, L Icon | 0 / 0 · **sem uso** | — | — | pendente | nenhum export nem citação encontrada | — |
| Terminal / Tab (`122:11388`) | 3 | State | 0 / 0 · **sem uso** | — | — | pendente | nenhum export nem citação encontrada | — |

## Terminal · 04 Rows & layout

| Figma (ID) | Variantes | Propriedades | Uso Admin / Editor | Seções | Código | Status | Evidência | Importado por |
|---|---|---|---|---|---|---|---|---|
| Widget / Row (`103:643`) | 2 | Label, Value, Divider, State | 24 / 264 | A01,E01,E02,E03,E05 | `Row` em `src/components/widgets/parts/card.tsx` | provável | nome do export | 12 arquivos |
| Widget / Header (`103:628`) | 1 | Path, Show tag | 30 / 330 | A01,E01,E02,E03,E05 | — | pendente | nenhum export nem citação encontrada | — |
| Widget / Link row (`105:1268`) | 1 | Label | 3 / 33 | A01,E01,E02,E03,E05 | — | pendente | nenhum export nem citação encontrada | — |
| Widget / Divider (`66:1481`) | 1 | — | 0 / 0 · **sem uso** | — | — | pendente | nenhum export nem citação encontrada | — |
| Widget / Poster (`82:6854`) | 1 | Index, Title, Meta, Show index | 0 / 0 · **sem uso** | — | `Poster` em `src/components/widgets/parts/layouts.tsx` | provável | nome do export | 3 arquivos |
| Widget / Day (`66:1477`) | 6 | Tone | 0 / 0 · **sem uso** | — | — | pendente | nenhum export nem citação encontrada | — |

## Terminal · 05 Data display

| Figma (ID) | Variantes | Propriedades | Uso Admin / Editor | Seções | Código | Status | Evidência | Importado por |
|---|---|---|---|---|---|---|---|---|
| Terminal / _Base Badge (`102:2333`) | 2 | Label Text, Show Icon, Icon, Size | 0 / 0 · **sem uso** | — | — | pendente | nenhum export nem citação encontrada | — |
| Terminal / Badge (`102:2351`) | 4 | Tone | 0 / 0 · **sem uso** | — | — | pendente | nenhum export nem citação encontrada | — |
| Terminal / _Base Avatar (`102:2359`) | 3 | Initials, Size | 0 / 0 · **sem uso** | — | `Avatar` em `src/components/widgets/parts/bits.tsx` | provável | nome do export | 21 arquivos |
| Terminal / Avatar (`102:2370`) | 3 | Tone | 0 / 0 · **sem uso** | — | `Avatar` em `src/components/widgets/parts/bits.tsx` | provável | nome do export | 21 arquivos |
| Terminal / _Base Progress Bar (`102:2473`) | 10 | Size, Value | 9 / 99 | A01,E01,E02,E03,E05 | — | pendente | nenhum export nem citação encontrada | — |
| Terminal / Progress Bar (`102:2490`) | 5 | Value | 9 / 99 | A01,E01,E02,E03,E05 | — | pendente | nenhum export nem citação encontrada | — |
| Widget / Tag (`103:614`) | 1 | Label | 30 / 330 | A01,E01,E02,E03,E05 | `Tag` em `src/components/widgets/catalog/poster.tsx` | provável | nome do export | 51 arquivos |
| Widget / Chip (`103:617`) | 1 | Label | 9 / 99 | A01,E01,E02,E03,E05 | `Chip` em `src/components/widgets/parts/anatomy.tsx` | provável | nome do export | 22 arquivos |
| Widget / Stat (`103:620`) | 1 | Label, Value | 0 / 0 · **sem uso** | — | `Stat` em `src/components/widgets/parts/card.tsx` | provável | nome do export | 2 arquivos |
| Widget / Unit (`103:624`) | 1 | Value, Label | 9 / 99 | A01,E01,E02,E03,E05 | — | pendente | nenhum export nem citação encontrada | — |
| Widget / Dot bar (`105:1230`) | 6 | Tone, Filled | 15 / 165 | A01,E01,E02,E03,E05 | — | pendente | nenhum export nem citação encontrada | — |
| Widget / Meter row (`105:1232`) | 1 | Label, Value | 15 / 165 | A01,E01,E02,E03,E05 | — | pendente | nenhum export nem citação encontrada | — |
| Widget / Progress row (`103:732`) | 1 | Label, Value | 9 / 99 | A01,E01,E02,E03,E05 | — | pendente | nenhum export nem citação encontrada | — |
| Widget / Tick ring (`105:1657`) | 4 | Value text, Caption, Value | 6 / 66 | A01,E01,E02,E03,E05 | — | pendente | nenhum export nem citação encontrada | — |
| Widget / Streak day (`112:961`) | 4 | State | 0 / 0 · **sem uso** | — | — | pendente | nenhum export nem citação encontrada | — |
| Widget / Bar (`66:1480`) | 2 | Tone | 0 / 0 · **sem uso** | — | — | pendente | nenhum export nem citação encontrada | — |
| Widget / Week bars (`201:3817`) | 4 | Total Text, Week | 0 / 0 · **sem uso** | — | — | pendente | nenhum export nem citação encontrada | — |
| Widget / Compare row (`209:3722`) | 6 | Row | 0 / 0 · **sem uso** | — | — | pendente | nenhum export nem citação encontrada | — |
| Widget / Courses / Bars (`221:3917`) | 3 | Columns | 3 / 33 | A01,E01,E02,E03,E05 | — | pendente | nenhum export nem citação encontrada | — |
| Widget / Continue lesson / Progress (`221:4087`) | 2 | Columns | 3 / 33 | A01,E01,E02,E03,E05 | — | pendente | nenhum export nem citação encontrada | — |

