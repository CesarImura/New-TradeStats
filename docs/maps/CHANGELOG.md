# Changelog de organização (Figma, mapas e nomes)

Uma linha por mudança de nome, lugar ou estrutura. Mais recente em cima. Mudanças de produto ficam no vault (Updates).

## 21/11/2026 (noite): laranja no estado selecionado dos controles de escolha

- `Admin / Option card` (674:2167) e `Admin / Segmented option` (580:480), State=Active: borda `color/border/active` (branco 64) → `color/control/on` (laranja #cf4500).
- `component/sortable-row/border/active`: `color/border/active` → `color/control/on` (Sortable row Active e Dragging ficam com a borda laranja).
- `component/choice-chip/border/hover`: `primitive/orange/500` → `color/border/strong` (hover neutro, igual aos outros).
- Nenhuma variável nova; código igual (option-card, segmented, sortable-row e admin-tokens.css).
- Revisão nas telas: 6 instâncias com a borda Active sobrescrita foram religadas (Students 03b, Content 03, Tour · Course 04a/04b/04c, Editor Dialogs 02); 7 cópias soltas no código alinhadas (ver docs/components.md). Capturas em `~/Projetos/TradeHub/docs/reorganizacao/capturas/cores/`.

## 21/11/2026 (noite): página Components no mesmo padrão dos fluxos

- Cada coluna abre com um mapa (clone do Sales Flow map): `Admin · 00 Component map` (1991:3114), `Editor · 00 Component map` (1992:3114) e `Terminal · 00 Component map` (1992:3447), cada um com nota. Um grupo por seção; cada componente público com variantes, instâncias nas telas oficiais e export do código.
- Seções renumeradas e empilhadas em ordem (400 px, mesma x da coluna, 0 sobreposições). Componentes não mudaram de nome nem de ID; 0 instâncias quebradas (26.562 no Admin, 7.442 no Editor; os sets 221:3917 e 221:4087 seguem em Terminal · 05 Data display).

| Antes | Depois |
|---|---|
| Admin · Brand | Admin · 01 Brand |
| Admin · Actions | Admin · 02 Actions |
| Admin · Forms | Admin · 03 Forms |
| Admin · Navigation | Admin · 04 Navigation |
| Admin · Layout | Admin · 05 Layout |
| Admin · Cards & lists | Admin · 06 Cards & lists |
| Admin · Tables | Admin · 07 Tables |
| Admin · Data display | Admin · 08 Data display |
| Admin · Charts | Admin · 09 Charts |
| Admin · Files | Admin · 10 Files |
| Admin · Scheduling | Admin · 11 Scheduling |
| Admin · Covers | Admin · 12 Covers |
| Admin · Editor Shell | Editor · 01 Shell |
| Admin · Editor Controls | Editor · 02 Controls |
| Admin · Editor Preview | Editor · 03 Preview |
| Public · Join | Public · 01 Join |
| Terminal · Actions | Terminal · 01 Actions |
| Terminal · Forms | Terminal · 02 Forms |
| Terminal · Navigation | Terminal · 03 Navigation |
| Terminal · Rows & layout | Terminal · 04 Rows & layout |
| Terminal · Data display | Terminal · 05 Data display |
| Widgets · Journal (x 25400) | Widgets · 06 Journal, na coluna Terminal |

- Cabeçalho da coluna do meio: "Column · Public" → "Editor + Public".
- Código: 15 comentários `Figma '<seção>'` em `src/components/admin/ui` e `docs/components.md` atualizados para os nomes novos; `docs/maps/data/figma-components.tsv` e `components.md` regenerados.

## 21/11/2026 (noite): Flow map em todos os fluxos (padronização pedida pelo Gustavo)

- Criado `<Flow> · 00 Flow map` na coluna 0 de cada seção que ainda não tinha (14 no Admin, 5 no Editor), clonado do `Sales · 00 Flow map`, cada um com nota. O conteúdo de cada seção andou uma coluna para a direita (Admin +2020 px, Onboarding +2118 px, Editor +2040 px); nada mudou de visual nas telas, IDs mantidos.

| Seção | Flow map (id) |
|---|---|
| Admin · 01 Onboarding | 1988:78157 |
| Admin · 02 Overview | 1986:77830 |
| Admin · 03 Students | 1986:77929 |
| Admin · 04 Journal & feedback | 1986:78028 |
| Admin · 05 Content | 1986:78137 |
| Admin · 06 Downloads | 1985:77830 |
| Admin · 07 Calendar | 1987:77830 |
| Admin · 08 Livestreams | 1987:77934 |
| Admin · 09 Charts | 1987:78038 |
| Admin · 10 Community | 1987:78147 |
| Admin · 11 AI assistant | 1987:78251 |
| Admin · 13 Partners | 1988:77830 |
| Admin · 14 Ranking | 1988:77929 |
| Admin · 15 Settings | 1988:78028 |
| Editor · 01 Menu | 1989:31921 |
| Editor · 02 Style | 1989:32015 |
| Editor · 03 Pages | 1989:32129 |
| Editor · 04 Join | 1989:32228 |
| Editor · 05 Menus and dialogs | 1989:32327 |

- Renomeadas: `Journal · 00 Coming soon` (1680:72979) → `Journal · 00b Coming soon` e `AI assistant · 00 Coming soon` (1680:73004) → `AI assistant · 00b Coming soon`, embaixo do Flow map (`flows.ts` e `coming-soon.tsx` atualizados).
- Labels de etapa novos: `Label · Stage 1–4` em Content e em Settings. No Onboarding os 8 Labels de topo viraram `Label · Stage 1 · Sign up` … `Label · Stage 8 · Go live` (os "Step 1–5" do Getting started ficam entre parênteses).
- Auditoria: Admin 212 telas (15 Flow maps) e Editor 47 (5), todas com nota alinhada; 0 sem número, 0 duplicados, 0 fora da seção, 0 sobreposições, 0 instâncias quebradas (26.562 + 7.442 conferidas).

## 21/11/2026 (tarde): "Admin v2" passa a ser só Admin e fluxos no padrão do Sales & payments

Pedido do Gustavo: chamar o Admin v2 apenas de Admin, deixar só variáveis, componentes, telas e fluxos do Admin atual, e reorganizar fluxos e telas do Admin e do Editor no padrão de `Admin · 12 Sales & payments`.

### Variáveis e páginas
- Coleção Admin (541:2): modo **Dark** removido; o modo `v2` foi renomeado para **`Admin`** (modeId 1466:0) e é o único. Telas não precisam mais definir modo. Captura antes/depois: Overview 01, Style 01 e Design 01 com 0 px de diferença; Sales 00 Flow map e Sales 07 mudaram porque ainda usavam o Dark (agora mostram as cores do Admin atual); a folha Foundations · Admin passou a mostrar os valores do Admin atual.
- Página `Screens · Admin v2` (1466:2) → **`Screens · Admin`**.
- Textos do Guide (606:11, 606:10, 622:36353): um modo só, 320 variáveis.

### Telas renomeadas (id: antigo → novo)
| ID | Antes | Depois |
|---|---|---|
| 1485:74787 | Students · 01b No students yet | Students · 01b List · No students yet |
| 1485:74540 | Students · 02 Selected | Students · 01c List · Selected |
| 1485:74566 | Students · 03 Profile | Students · 02 Profile |
| 1887:79162 | Students · 03b Profile · Offer buyer | Students · 02b Profile · Offer buyer |
| 1485:74673 | Students · 03c Profile · Activity | Students · 02c Profile · Activity |
| 1485:74700 | Students · 03d Profile · Notes | Students · 02d Profile · Notes |
| 1485:74593 | Students · 04 Import or invite | Students · 03 Import or invite |
| 1485:74727 | Students · 04b Import or invite · Choose | Students · 03b Import or invite · Choose |
| 1485:74620 | Students · 05 Message | Students · 04 Message |
| 1485:74648 | Students · 06 No results | Students · 01d List · No results |
| 1485:76907 | Journal · 07 Nothing waiting | Journal · 01c Requests · Nothing waiting |
| 1628:66766 | Journal · 08 Requests · Overdue | Journal · 01b Requests · Overdue |
| 1485:77525 | Content · 02 List as table | Content · 01b List · As table |
| 1485:77554 | Content · 03 No courses yet | Content · 01c List · No courses yet |
| 1485:77564 | Content · 04 New course · Course | Content · 02 New course · Course |
| 1485:77633 | Content · 05 New course · Content (folder) | Content · 03 New course · Content (folder) |
| 1485:77732 | Content · 06 Curriculum + uploads | Content · 04 Curriculum + uploads |
| 1485:77810 | Content · 07 Lesson | Content · 05 Lesson |
| 1683:73156 | Content · 07b Lesson · No thumbnail | Content · 05b Lesson · No thumbnail |
| 1485:77877 | Content · 08 Chapters | Content · 05c Lesson · Chapters |
| 1485:77986 | Content · 09 Quiz | Content · 05d Lesson · Quiz |
| 1485:78219 | Content · 09b Quiz · No quiz yet | Content · 05e Lesson · Quiz · No quiz yet |
| 1485:78072 | Content · 10 Settings drawer | Content · 06 Course settings |
| 1485:78131 | Content · 11 Publish review | Content · 07 Publish review |
| 1485:78191 | Content · 12 Preview as student | Content · 08 Preview as student |
| 1485:100278 | Downloads · 03 No files yet | Downloads · 01b List · No files yet |
| 1485:101600 | Calendar · 03 Availability | Calendar · 04 Availability |
| 1485:101626 | Calendar · 04 News | Calendar · 05 News |
| 1485:101644 | Calendar · 05 Call details | Calendar · 03 Call details |
| 1485:102320 | Livestreams · 06 No livestreams yet | Livestreams · 01b Coming up · No livestreams yet |
| 1613:65231 | Charts · 02 Level selected | Charts · 01b Live chart · Level selected |
| 1614:69693 | Charts · 03 Layouts | Charts · 02 Layouts |
| 1614:70063 | Charts · 04 Share snapshot | Charts · 03 Share snapshot |
| 1485:102765 | Charts · 05 Mark up a chart | Charts · 04 Mark up a chart |
| 1485:102787 | Charts · 06 Settings | Charts · 05 Settings |
| 1485:102803 | Charts · 07 No charts yet | Charts · 01c Live chart · No charts yet |
| 1485:103136 | Community · 05 Discord not connected | Community · 04b Discord · Not connected |
| 1620:67674 | Community · 06 Moderation | Community · 05 Moderation |
| 1485:117919 | Partners · 01 Offers | Partners · 01 Deals |
| 1485:118031 | Partners · 01b Offers · New platform | Partners · 01b Deals · New platform |
| 1485:118004 | Partners · 04 Off | Partners · 01c Deals · Partners off |
| 133:9624 | Join · 02 Log in · Split | Join · 01b Log in · Split |
| 133:11108 | Join · 03 Sign up | Join · 02 Sign up |
| 133:12323 | Join · 04 Subscribe | Join · 03 Subscribe |
| 1929:31956 | Join · 04b Subscribe · Booking link | Join · 03b Subscribe · Booking link |

Notas renomeadas e realinhadas junto com cada tela. Estados (vazio, sem resultado, seleção, alternância de visão, abas dentro de drawer) foram para baixo do passo de origem; seções reempilhadas a 400 px.

### Criado
- 21 Labels de coluna no Admin: `Label · Tab · …` em Journal, Calendar, Charts, Community, Partners e Ranking; `Label · Stage · 1` a `4` em Sales. 120 px acima do primeiro frame da coluna.
- 7 Labels de coluna no Editor · 02 Style: `Label · Tab · Brand / Theme / Layout / Type / Background`, `Search (any tab)`, `Canvas (any tab)`.
- `Sales · 00 Flow map`: referências cruzadas atualizadas (Students 02b, Partners 01 Deals).

### Editor
- `Editor · 04 Join`: Log in · Split virou estado da 01 (01b, embaixo da 01); Sign up 02, Subscribe 03, Booking link 03b. Seção estreitada.

## 21/11/2026: reorganização geral (thread "Reorganizar Figma e higienizar o código")

Versão nomeada antes de tudo: "Antes da reorganização 21/11" (salva pelo Gustavo). Snapshot de posições e nomes: `~/Projetos/TradeHub/docs/reorganizacao/snapshots/`.

### Páginas
- `Screens · Admin` (285:24530, Admin antigo, 270 frames): excluída pelo Gustavo. Referência oficial do Admin: `Screens · Admin v2` (1466:2, hoje `Screens · Admin`). Do Editor: `Screens · Editor` (286:8501).

### Telas renomeadas (id: antigo → novo)
| ID | Antes | Depois |
|---|---|---|
| 1887:79162 | Students · 03c Profile · Offer buyer | Students · 03b Profile · Offer buyer |
| 1485:74673 | Students · 07 Profile · Activity | Students · 03c Profile · Activity |
| 1485:74700 | Students · 08 Profile · Notes | Students · 03d Profile · Notes |
| 1485:74727 | Students · 04a Import or invite · Choose | Students · 04b Import or invite · Choose |
| 1485:102333 | Livestreams · 05a Ended · Making the recording | Livestreams · 05b Ended · Making the recording |
| 1842:76287 | Settings · 03b Notifications | Settings · 04 Notifications |
| 1485:119035 | Settings · 04 Legal pages | Settings · 05 Legal pages |
| 1485:119070 | Settings · 05 Onboarding questions | Settings · 06 Onboarding questions |
| 1485:119249 | Settings · 05b Home in the first week | Settings · 07 Home in the first week |
| 1485:119106 | Settings · 06 Invoices and VAT | Settings · 08 Invoices and VAT |
| 1485:119141 | Settings · 07 Team and roles | Settings · 09 Team and roles |
| 1485:119176 | Settings · 08 Invite to the team | Settings · 10 Invite to the team |
| 1485:119213 | Settings · 09 Plan and invoices | Settings · 11 Plan and invoices |
| 1485:136672 | Tour · Course · Progress panel open | Tour · Course · 01b New course · Progress panel open |
| 1485:136776 | Tour · Course · 04 Where are your videos | Tour · Course · 03 Where are your videos |
| 1485:136875 | Tour · Course · 05a Folder · Check your lessons | Tour · Course · 04a Folder · Check your lessons |
| 1485:136974 | Tour · Course · 05b Links · Paste your links | Tour · Course · 04b Links · Paste your links |
| 1485:137074 | Tour · Course · 05c No videos · Start blank | Tour · Course · 04c No videos · Start blank |
| 1485:137173 | Tour · Course · 06b Open your first lesson (folder or links) | Tour · Course · 05a Open your first lesson (folder or links) |
| 1485:137279 | Tour · Course · 06a Add your first lesson (blank) | Tour · Course · 05b Add your first lesson (blank) |
| 1485:137385 | Tour · Course · 07 Add the video | Tour · Course · 06 Add the video |
| 1485:137484 | Tour · Course · 08 Name the lesson | Tour · Course · 07 Name the lesson |
| 1485:137583 | Tour · Course · 09 Make it visible | Tour · Course · 08 Make it visible |
| 1485:138845 | Tour · Course · Variant · Resume later | Tour · Course · 08b Make it visible · Resume later |
| 1485:137682 | Tour · Course · 10 First lesson live | Tour · Course · 09 First lesson live |
| 1485:139232 | Content · Variant · New platform | Tour · Course · 09b First lesson live · New platform |
| 1485:138919 | Tour · Tier · Variant · Free tier | Tour · Tier · 02b Name and price · Free tier |
| 1485:138763 | Tour · Payouts · Variant · ID in review | Tour · Payouts · 05b Payouts connected · ID in review |
| 1485:139184 | Getting started · Variant · Payouts skipped | Getting started · 06b Legal done · Payouts skipped |
| 1485:138740 | Go live · Variant · Address taken | Tour · Go live · 01b Confirm and go live · Address taken |
| 1454:37180 | Style · 13 Brand · Import from website | Style · 01b Brand · Import from website |
| 1454:37358 | Style · 14 Brand · Logo too large | Style · 01c Brand · Logo too large |
| 1451:31287 | Style · 03 Theme · Terminal · Light | Style · 02b Theme · Terminal · Light |
| 1438:29713 | Style · 04 Theme · Atelier | Style · 02c Theme · Atelier |
| 1451:31434 | Style · 05 Theme · Pulse | Style · 02d Theme · Pulse |
| 1438:29860 | Style · 06 Theme · Custom | Style · 02e Theme · Custom |
| 1451:36655 | Style · 07 Theme · Switch | Style · 02f Theme · Switch |
| 1438:34732 | Style · 08 Layout | Style · 03 Layout |
| 1438:32676 | Style · 09 Type | Style · 04 Type |
| 1438:33559 | Style · 10 Background | Style · 05 Background |
| 1454:37536 | Style · 15 Background · Image too small | Style · 05b Background · Image too small |
| 1454:36867 | Style · 11 Search · Results | Style · 06 Search · Results |
| 1455:35927 | Style · 12 Click to edit | Style · 07 Click to edit |
| 1413:22606 | Pages · 04 Search · Empty | Pages · 01b Pages · Search · Empty |
| 1413:23391 | Pages · 05 Search · Results | Pages · 01c Pages · Search · Results |
| 1413:24163 | Pages · 06 Search · No results | Pages · 01d Pages · Search · No results |

Notas (`Note · …`) renomeadas junto com cada tela.

### Seções
- Editor: `Editor · 1 Menu` → `Editor · 01 Menu`, `2 Style` → `02 Style`, `3 Pages` → `03 Pages`, `4 Join` → `04 Join`, `5 Menus and dialogs` → `05 Menus and dialogs`; reempilhadas sem sobreposição.
- Admin v2: Overview em 3 colunas (variantes sob a base), Students 03b–03d sob a 03, Community 01b sob a 01, Settings 01–11 na ordem das abas do código, Onboarding com Name the lesson em coluna própria (+2118 px depois dela). Seções reempilhadas a 400 px.
- Components: `Admin · Editor Shell`, `Admin · Editor Controls` e `Admin · Editor Preview` movidas para x 9000 (coluna Editor + Public), abaixo de `Public · Join`.

### Criado
- Notas: 55 no Onboarding, 1 em Sales · 00 Flow map, 41 no Editor (toda tela oficial tem nota).
- Labels: `Label · Group · Top bar / Canvas / Dialogs / Pages panel` no Editor · 05.
- Descrições: `Admin / Segmented item`, `Admin / Segmented`, `Admin / _Base Selection card`.

### Corrigido
- `Widget / Courses / Bars` (221:3917) e `Widget / Continue lesson / Progress` (221:4087): sets órfãos (sem página) reinseridos em `Terminal · Data display`; mesmos IDs, 72 instâncias continuam ligadas.
- Texto: tag "BETA" do widget Ask the AI nas prévias (36 instâncias) → "32 left" (igual ao código); hero do sales page sem "Everything in one place" (Figma e `src/lib/data/sales-page.ts`); Labels do Onboarding com números antigos e 3 Labels de Help com texto copiado errado.
- Código: textos de Affiliates (`sales-admin.tsx`), toast do sino (`notifications-menu.tsx`), toast da AI (`ai-admin.tsx`).

### Decisões
- ~~Modo padrão da coleção Admin continua Dark~~: substituído na mesma tarde, o Dark foi removido (ver acima).
- Ordem da lista de camadas não muda pelo MCP: Onboarding aparece por último no Admin v2 e o Editor como 01, 03, 04, 05, 02 (limitação conhecida, canvas está na ordem certa).
- Duas coleções (Admin e Terminal); tokens do Editor ficam em Admin.
