# Mapa de telas (Figma × rotas)

Gerado por `scripts/maps/components-screens.mjs` em 2026-11-23, commit 77eccf8f. Figma: arquivo XWHeEdjEiY6gWmrsg0vFIZ, dados exportados em 21/11/2026 pelo MCP (pasta `docs/maps/data`). Não editar à mão: atualizar os dados e rodar de novo. Mudanças ficam em `docs/maps/CHANGELOG.md`.

262 telas: 215 no Admin e 47 no Editor. Toda tela tem uma nota `Note · <nome>` 40 px abaixo, em português. Convenção de nomes e disposição: skill `tradehub-figma` e `docs/maps/README.md`.

Tipo: **mapa do fluxo** = `00 Flow map`, primeira coluna de cada seção; **passo** = número sem letra; **estado ou variante** = número + letra (b, c…) empilhado na coluna da base; **ramo** = caminhos paralelos (a, b, c), cada um na sua linha com `Label · Branch`. Link para abrir: `https://www.figma.com/design/XWHeEdjEiY6gWmrsg0vFIZ/Tradehub?node-id=<ID com - no lugar de :>`.

## Admin · 01 Onboarding

Rota no protótipo: `/signup, /admin/[coach]/getting-started`.

| ID | Tela | Tipo | Citada no código | Controlador do protótipo |
|---|---|---|---|---|
| `1988:78157` | Onboarding · 00 Flow map | mapa do fluxo | — | — |
| `1485:136394` | Sign up · 01 Log in | passo | `src/app/(onboarding)/signup/page.tsx` | — |
| `1485:136402` | Sign up · 02 Create account | passo | `src/app/(onboarding)/signup/create/page.tsx` | — |
| `1485:136410` | Sign up · 03 Verify code | passo | `src/app/(onboarding)/signup/verify/page.tsx` | — |
| `1485:136418` | Sign up · 04 About you | passo | `src/app/(onboarding)/signup/about/page.tsx` | — |
| `1485:136459` | Sign up · 05 Name and language | passo | `src/app/(onboarding)/signup/name/page.tsx` | — |
| `1485:136480` | Getting started · 01 Start | passo | `src/components/prototype/flows.ts` | sim |
| `1650:68502` | Help · 01 Chat with us | passo | — | — |
| `1485:136501` | Design · 01 Brand | passo | `src/components/admin/tour/editor-choices.ts` | — |
| `1650:68578` | Help · 02 Book a setup call | passo | — | — |
| `1485:136538` | Design · 02 Look | passo | — | — |
| `1485:138995` | Tour · Design editor · 01 Your design editor | passo | — | — |
| `1650:68654` | Help · 03 Have us set it up | passo | — | — |
| `1485:136572` | Design · 03 Layout | passo | — | — |
| `1485:139048` | Tour · Design editor · 02 Pages and widgets | passo | — | — |
| `1485:136612` | Getting started · 02 Design done | passo | — | — |
| `1485:139108` | Tour · Design editor · 03 Preview and publish | passo | — | — |
| `1485:137802` | Tour · Tier · 01 New tier | passo | — | — |
| `1485:137878` | Tour · Tier · 02 Name and price | passo | — | — |
| `1485:138919` | Tour · Tier · 02b Name and price · Free tier | estado ou variante | — | — |
| `1485:137951` | Tour · Tier · 03 What it unlocks | passo | — | — |
| `1485:138024` | Tour · Tier · 04 Tier created | passo | — | — |
| `1485:137781` | Getting started · 03 Tier done | passo | — | — |
| `1485:136633` | Tour · Course · 01 New course | passo | — | — |
| `1485:136672` | Tour · Course · 01b New course · Progress panel open | estado ou variante | — | — |
| `1485:136707` | Tour · Course · 02 Name your course | passo | — | — |
| `1485:136776` | Tour · Course · 03 Where are your videos | passo | — | — |
| `1485:136875` | Tour · Course · 04a Folder · Check your lessons | ramo | — | — |
| `1485:136974` | Tour · Course · 04b Links · Paste your links | ramo | — | — |
| `1485:137074` | Tour · Course · 04c No videos · Start blank | ramo | — | — |
| `1485:137173` | Tour · Course · 05a Open your first lesson (folder or links) | ramo | — | — |
| `1485:137279` | Tour · Course · 05b Add your first lesson (blank) | ramo | — | — |
| `1485:137385` | Tour · Course · 06 Add the video | passo | — | — |
| `1485:137484` | Tour · Course · 07 Name the lesson | passo | — | — |
| `1485:137583` | Tour · Course · 08 Make it visible | passo | — | — |
| `1485:138845` | Tour · Course · 08b Make it visible · Resume later | estado ou variante | — | — |
| `1485:137682` | Tour · Course · 09 First lesson live | passo | — | — |
| `1485:139232` | Tour · Course · 09b First lesson live · New platform | estado ou variante | — | — |
| `1485:138366` | Getting started · 04 Course done | passo | — | — |
| `1485:138101` | Tour · Payouts · 01 Connect payouts | passo | — | — |
| `1485:138149` | Tour · Payouts · 02 You are | passo | — | — |
| `1485:138194` | Tour · Payouts · 03 Bank account | passo | — | — |
| `1485:138239` | Tour · Payouts · 04 Identity check | passo | — | — |
| `1485:138284` | Tour · Payouts · 05 Payouts connected | passo | — | — |
| `1485:138763` | Tour · Payouts · 05b Payouts connected · ID in review | estado ou variante | — | — |
| `1485:138387` | Getting started · 05 Payouts done | passo | — | — |
| `1485:138408` | Tour · Legal · 01 Legal pages | passo | — | — |
| `1485:138470` | Tour · Legal · 02 Imprint | passo | — | — |
| `1485:138529` | Tour · Legal · 03 Check the templates | passo | — | — |
| `1485:138588` | Tour · Legal · 04 Legal pages done | passo | — | — |
| `1485:138650` | Getting started · 06 Legal done | passo | — | — |
| `1485:139184` | Getting started · 06b Legal done · Payouts skipped | estado ou variante | — | — |
| `1485:138671` | Tour · Go live · 01 Confirm and go live | passo | — | — |
| `1485:138740` | Tour · Go live · 01b Confirm and go live · Address taken | estado ou variante | — | — |
| `1485:138694` | Tour · Go live · 02 You’re live | passo | — | — |
| `1485:138717` | Tour · Go live · 03 You’re live · Invite list | passo | — | — |

## Admin · 02 Overview

Rota no protótipo: `/admin/[coach]`.

| ID | Tela | Tipo | Citada no código | Controlador do protótipo |
|---|---|---|---|---|
| `1986:77830` | Overview · 00 Flow map | mapa do fluxo | — | — |
| `1485:64809` | Overview · 01 Normal week | passo | — | sim |
| `1485:71937` | Overview · 01b Running · New platform | estado ou variante | — | sim |
| `1487:64232` | Overview · 01c Normal week · Chart default | estado ou variante | — | sim |
| `1812:69689` | Overview · 01d Normal week · Questions | estado ou variante | — | sim |
| `1812:71415` | Overview · 01e Normal week · Questions · Empty | estado ou variante | — | sim |
| `1867:76763` | Overview · 01f Normal week · Remind sent | estado ou variante | — | sim |
| `1956:83620` | Overview · 01g Normal week · Account menu | estado ou variante | — | sim |
| `1485:66568` | Overview · 02 Notifications | passo | — | — |
| `1485:73202` | Overview · 02b Notifications · Empty | estado ou variante | — | — |
| `1886:78392` | Overview · 02c Notifications · Offers | estado ou variante | — | — |
| `1485:68348` | Overview · 03 Search (⌘K) | passo | — | — |
| `1485:70121` | Overview · 03b Search (⌘K) · Empty | estado ou variante | — | — |
| `1887:82458` | Overview · 03c Search (⌘K) · Send offer | estado ou variante | — | — |

## Admin · 03 Students

Rota no protótipo: `/admin/[coach]/students`.

| ID | Tela | Tipo | Citada no código | Controlador do protótipo |
|---|---|---|---|---|
| `1986:77929` | Students · 00 Flow map | mapa do fluxo | — | — |
| `1485:74515` | Students · 01 List | passo | — | sim |
| `1485:74787` | Students · 01b List · No students yet | estado ou variante | — | sim |
| `1485:74540` | Students · 01c List · Selected | estado ou variante | — | sim |
| `1485:74566` | Students · 02 Profile | passo | `src/components/admin/students/student-profile.tsx` | — |
| `1887:79162` | Students · 02b Profile · Offer buyer | estado ou variante | — | — |
| `1485:74673` | Students · 02c Profile · Activity | estado ou variante | — | — |
| `1485:74700` | Students · 02d Profile · Notes | estado ou variante | — | — |
| `1485:74593` | Students · 03 Import or invite | passo | `src/components/admin/students/import-dialog.tsx` | — |
| `1485:74727` | Students · 03b Import or invite · Choose | estado ou variante | — | — |
| `1485:74620` | Students · 04 Message | passo | `src/components/admin/students/student-message.tsx` | — |
| `1485:74648` | Students · 01d List · No results | estado ou variante | — | sim |

## Admin · 04 Journal & feedback

Rota no protótipo: `/admin/[coach]/journal (Coming soon)`.

| ID | Tela | Tipo | Citada no código | Controlador do protótipo |
|---|---|---|---|---|
| `1986:78028` | Journal · 00 Flow map | mapa do fluxo | — | — |
| `1680:72979` | Journal · 00b Coming soon | estado ou variante | `src/components/admin/ui/coming-soon.tsx` | sim |
| `1485:76771` | Journal · 01 Requests | passo | — | — |
| `1485:76795` | Journal · 02 Answer a request | passo | `src/components/admin/journal/journal-answer.tsx` | — |
| `1485:76811` | Journal · 03 Recording a video | passo | — | — |
| `1485:76834` | Journal · 04 Answered | passo | — | — |
| `1485:76949` | Journal · 04b Answered · New platform | estado ou variante | — | — |
| `1485:76858` | Journal · 05 Rules | passo | — | — |
| `1485:76884` | Journal · 06 New strategy | passo | — | — |
| `1485:76907` | Journal · 01c Requests · Nothing waiting | estado ou variante | — | — |
| `1628:66766` | Journal · 01b Requests · Overdue | estado ou variante | — | — |

## Admin · 05 Content

Rota no protótipo: `/admin/[coach]/content`.

| ID | Tela | Tipo | Citada no código | Controlador do protótipo |
|---|---|---|---|---|
| `1986:78137` | Content · 00 Flow map | mapa do fluxo | — | — |
| `1485:77491` | Content · 01 List | passo | — | sim |
| `1485:77525` | Content · 01b List · As table | estado ou variante | — | sim |
| `1485:77554` | Content · 01c List · No courses yet | estado ou variante | — | sim |
| `1485:77564` | Content · 02 New course · Course | passo | — | — |
| `1485:77633` | Content · 03 New course · Content (folder) | passo | — | — |
| `1485:77732` | Content · 04 Curriculum + uploads | passo | `src/components/admin/content/curriculum.tsx` | — |
| `1485:77810` | Content · 05 Lesson | passo | `src/components/admin/content/lesson-page.tsx` | — |
| `1683:73156` | Content · 05b Lesson · No thumbnail | estado ou variante | — | — |
| `1485:77877` | Content · 05c Lesson · Chapters | estado ou variante | — | — |
| `1485:77986` | Content · 05d Lesson · Quiz | estado ou variante | — | — |
| `1485:78219` | Content · 05e Lesson · Quiz · No quiz yet | estado ou variante | — | — |
| `1485:78072` | Content · 06 Course settings | passo | `src/components/admin/content/course-settings.tsx` | — |
| `1485:78131` | Content · 07 Publish review | passo | `src/components/admin/content/publish-review.tsx` | — |
| `1485:78191` | Content · 08 Preview as student | passo | `src/components/admin/content/student-preview.tsx` | — |

## Admin · 06 Downloads

Rota no protótipo: `/admin/[coach]/downloads`.

| ID | Tela | Tipo | Citada no código | Controlador do protótipo |
|---|---|---|---|---|
| `1985:77830` | Downloads · 00 Flow map | mapa do fluxo | — | — |
| `1485:100232` | Downloads · 01 List | passo | — | sim |
| `1485:100254` | Downloads · 02 Upload a file | passo | `src/components/admin/downloads/downloads-admin.tsx` | — |
| `1485:100289` | Downloads · 02b Upload a file · File chosen | estado ou variante | — | — |
| `1485:100278` | Downloads · 01b List · No files yet | estado ou variante | — | sim |

## Admin · 07 Calendar

Rota no protótipo: `/admin/[coach]/calendar`.

| ID | Tela | Tipo | Citada no código | Controlador do protótipo |
|---|---|---|---|---|
| `1987:77830` | Calendar · 00 Flow map | mapa do fluxo | — | — |
| `1485:101431` | Calendar · 01 Week | passo | `src/components/admin/calendar/calendar-views.tsx` | sim |
| `1485:101740` | Calendar · 01b Week · New platform | estado ou variante | — | sim |
| `1579:69557` | Calendar · 01c Week · Overlap | estado ou variante | — | sim |
| `1579:70017` | Calendar · 01d Month | estado ou variante | — | sim |
| `1580:66290` | Calendar · 01e Week · Event peek | estado ou variante | — | sim |
| `1485:101520` | Calendar · 02 New event | passo | — | — |
| `1485:101600` | Calendar · 04 Availability | passo | — | — |
| `1485:101626` | Calendar · 05 News | passo | — | — |
| `1485:101644` | Calendar · 03 Call details | passo | — | — |

## Admin · 08 Livestreams

Rota no protótipo: `/admin/[coach]/livestreams`.

| ID | Tela | Tipo | Citada no código | Controlador do protótipo |
|---|---|---|---|---|
| `1987:77934` | Livestreams · 00 Flow map | mapa do fluxo | — | — |
| `1485:102135` | Livestreams · 01 Coming up | passo | — | sim |
| `1485:102166` | Livestreams · 02 Schedule a livestream | passo | `src/components/admin/livestreams/livestreams-admin.tsx` | — |
| `1485:102198` | Livestreams · 03 Studio · Connect OBS | passo | — | — |
| `1485:102219` | Livestreams · 04 Studio · Live | passo | — | — |
| `1485:102303` | Livestreams · 05 Ended · Save as a lesson | passo | `src/components/admin/livestreams/livestreams-admin.tsx` | — |
| `1485:102333` | Livestreams · 05b Ended · Making the recording | estado ou variante | — | — |
| `1485:102320` | Livestreams · 01b Coming up · No livestreams yet | estado ou variante | — | sim |

## Admin · 09 Charts

Rota no protótipo: `/admin/[coach]/charts`.

| ID | Tela | Tipo | Citada no código | Controlador do protótipo |
|---|---|---|---|---|
| `1987:78038` | Charts · 00 Flow map | mapa do fluxo | — | — |
| `1485:102745` | Charts · 01 Live chart | passo | `src/components/admin/charts/chart-workspace.tsx` | sim |
| `1613:65231` | Charts · 01b Live chart · Level selected | estado ou variante | — | sim |
| `1614:69693` | Charts · 02 Layouts | passo | — | — |
| `1614:70063` | Charts · 03 Share snapshot | passo | — | — |
| `1485:102765` | Charts · 04 Mark up a chart | passo | — | — |
| `1485:102787` | Charts · 05 Settings | passo | — | — |
| `1485:102803` | Charts · 01c Live chart · No charts yet | estado ou variante | — | sim |

## Admin · 10 Community

Rota no protótipo: `/admin/[coach]/community`.

| ID | Tela | Tipo | Citada no código | Controlador do protótipo |
|---|---|---|---|---|
| `1987:78147` | Community · 00 Flow map | mapa do fluxo | — | — |
| `1485:103067` | Community · 01 Announcements | passo | — | sim |
| `1485:103166` | Community · 01b Announcements · New platform | estado ou variante | — | sim |
| `1485:103083` | Community · 02 New announcement | passo | — | — |
| `1485:103101` | Community · 03 Spaces & rules | passo | — | — |
| `1485:103118` | Community · 04 Discord | passo | — | — |
| `1485:103136` | Community · 04b Discord · Not connected | estado ou variante | — | — |
| `1620:67674` | Community · 05 Moderation | passo | — | — |

## Admin · 11 AI assistant

Rota no protótipo: `/admin/[coach]/ai (Coming soon)`.

| ID | Tela | Tipo | Citada no código | Controlador do protótipo |
|---|---|---|---|---|
| `1987:78251` | AI assistant · 00 Flow map | mapa do fluxo | — | — |
| `1680:73004` | AI assistant · 00b Coming soon | estado ou variante | — | sim |
| `1485:115709` | AI assistant · 01 Personality | passo | — | — |
| `1485:115742` | AI assistant · 02 Knowledge | passo | — | — |
| `1485:115832` | AI assistant · 02b Knowledge · New platform | estado ou variante | — | — |
| `1485:115764` | AI assistant · 03 Features & quotas | passo | — | — |
| `1485:115781` | AI assistant · 04 Test & correct | passo | — | — |
| `1485:115800` | AI assistant · 05 Questions | passo | — | — |
| `1485:115853` | AI assistant · 05b Questions · New platform | estado ou variante | — | — |

## Admin · 12 Sales & payments

Rota no protótipo: `/admin/[coach]/sales, /site/[coach]/offer/[id]`.

| ID | Tela | Tipo | Citada no código | Controlador do protótipo |
|---|---|---|---|---|
| `1947:77406` | Sales · 00 Flow map | mapa do fluxo | — | — |
| `1485:116217` | Sales · 01 Overview | passo | `src/components/admin/sales/revenue.tsx` | — |
| `1485:116646` | Sales · 01b Overview · New platform | estado ou variante | — | — |
| `2032:85563` | Sales · 01c Overview · Payment alerts | estado ou variante | — | — |
| `2037:83191` | Sales · 01d Overview · Chart default | estado ou variante | — | — |
| `2056:83422` | Sales · 01e Overview · Members chart | estado ou variante | — | — |
| `1485:116245` | Sales · 02 Tiers & prices | passo | `src/components/admin/sales/tiers.tsx` | — |
| `1485:116674` | Sales · 02b Tiers & prices · New platform | estado ou variante | — | — |
| `1485:116294` | Sales · 03 Edit tier | passo | — | — |
| `1485:116560` | Sales · 03b Edit tier · Sales page tab | estado ou variante | — | — |
| `1876:71176` | Sales · 04 Offers | passo | `src/components/admin/sales/offers.tsx` | — |
| `1885:78245` | Sales · 04b Offers · New platform | estado ou variante | — | — |
| `1880:75998` | Sales · 05 Edit offer | passo | — | — |
| `1892:76305` | Sales · 05b Edit offer · Link settings | estado ou variante | — | — |
| `1880:78095` | Sales · 06 Send offer link | passo | — | — |
| `1883:74159` | Sales · 07 Offer checkout | passo | `src/components/public/offer-checkout.tsx` | — |
| `1883:78492` | Sales · 07b Offer checkout · Link expired | estado ou variante | — | — |
| `1883:78604` | Sales · 07c Offer checkout · Link already used | estado ou variante | — | — |
| `1950:77406` | Sales · 07d Offer checkout · Card declined | estado ou variante | — | — |
| `1950:77477` | Sales · 07e Offer checkout · Offer unavailable | estado ou variante | — | — |
| `1485:116344` | Sales · 08 Groups | passo | `src/components/admin/sales/groups.tsx` | — |
| `1485:116694` | Sales · 08b Groups · New platform | estado ou variante | — | — |
| `1485:116364` | Sales · 09 Access | passo | `src/components/admin/sales/access-overview.tsx` | — |
| `1485:116388` | Sales · 10 Sales page | passo | `src/components/admin/sales/sales-page-editor.tsx` | — |
| `1485:116413` | Sales · 11 Coupons | passo | `src/components/admin/sales/coupons.tsx` | — |
| `1485:116714` | Sales · 11b Coupons · New platform | estado ou variante | — | — |
| `1485:116433` | Sales · 12 New coupon | passo | — | — |
| `1485:116455` | Sales · 13 Transactions | passo | `src/components/admin/sales/transactions.tsx` | — |
| `1485:116734` | Sales · 13b Transactions · New platform | estado ou variante | — | — |
| `1884:73419` | Sales · 13c Transactions · Instalments | estado ou variante | — | — |
| `1485:116484` | Sales · 14 Payouts | passo | `src/components/admin/sales/payouts.tsx` | — |
| `1485:116539` | Sales · 15 Connect payouts | passo | — | — |

## Admin · 13 Partners

Rota no protótipo: `/admin/[coach]/partners`.

| ID | Tela | Tipo | Citada no código | Controlador do protótipo |
|---|---|---|---|---|
| `1988:77830` | Partners · 00 Flow map | mapa do fluxo | — | — |
| `1485:117919` | Partners · 01 Deals | passo | — | sim |
| `1485:118031` | Partners · 01b Deals · New platform | estado ou variante | — | sim |
| `1485:117936` | Partners · 02 Add from catalogue | passo | — | — |
| `1485:117955` | Partners · 03 Affiliate program | passo | — | — |
| `1485:118046` | Partners · 03b Affiliate program · New platform | estado ou variante | — | — |
| `1485:118004` | Partners · 01c Deals · Partners off | estado ou variante | — | sim |

## Admin · 14 Ranking

Rota no protótipo: `/admin/[coach]/ranking`.

| ID | Tela | Tipo | Citada no código | Controlador do protótipo |
|---|---|---|---|---|
| `1988:77929` | Ranking · 00 Flow map | mapa do fluxo | — | — |
| `1485:118297` | Ranking · 01 Leaderboard | passo | — | sim |
| `1485:118419` | Ranking · 01b Leaderboard · New platform | estado ou variante | — | sim |
| `1485:118322` | Ranking · 02 Competitions | passo | — | — |
| `1485:118441` | Ranking · 02b Competitions · New platform | estado ou variante | — | — |
| `1485:118342` | Ranking · 03 New competition | passo | — | — |
| `1485:118364` | Ranking · 04 Points & badges | passo | — | — |

## Admin · 15 Settings

Rota no protótipo: `/admin/[coach]/settings?tab=…`.

| ID | Tela | Tipo | Citada no código | Controlador do protótipo |
|---|---|---|---|---|
| `1988:78028` | Settings · 00 Flow map | mapa do fluxo | — | — |
| `1485:118931` | Settings · 01 General | passo | — | — |
| `1887:74561` | Settings · 01b General · Booking link | estado ou variante | — | — |
| `1485:118966` | Settings · 02 Web address | passo | — | — |
| `1485:119001` | Settings · 03 E-mails | passo | — | — |
| `1842:76287` | Settings · 04 Notifications | passo | `src/components/admin/settings/settings-notifications.tsx` | — |
| `1485:119035` | Settings · 05 Legal pages | passo | — | — |
| `1485:119070` | Settings · 06 Onboarding questions | passo | — | — |
| `1485:119249` | Settings · 07 Home in the first week | passo | — | — |
| `1485:119106` | Settings · 08 Invoices and VAT | passo | — | — |
| `1485:119141` | Settings · 09 Team and roles | passo | — | — |
| `1485:119176` | Settings · 10 Invite to the team | passo | — | — |
| `1485:119213` | Settings · 11 Plan and invoices | passo | — | — |

## Editor · 01 Menu

Rota no protótipo: `/admin/[coach]/design`.

| ID | Tela | Tipo | Citada no código | Controlador do protótipo |
|---|---|---|---|---|
| `1989:31921` | Menu · 00 Flow map | mapa do fluxo | — | — |
| `74:2596` | Menu · 01 Main | passo | — | sim |

## Editor · 02 Style

Rota no protótipo: `/admin/[coach]/design`.

| ID | Tela | Tipo | Citada no código | Controlador do protótipo |
|---|---|---|---|---|
| `1989:32015` | Style · 00 Flow map | mapa do fluxo | — | — |
| `1438:31787` | Style · 01 Brand | passo | — | — |
| `1454:37180` | Style · 01b Brand · Import from website | estado ou variante | `src/components/admin/design/fields/brand-fields.tsx` | — |
| `1454:37358` | Style · 01c Brand · Logo too large | estado ou variante | `src/components/admin/design/fields/brand-fields.tsx` | — |
| `1438:23356` | Style · 02 Theme · Terminal · Dark | passo | — | — |
| `1451:31287` | Style · 02b Theme · Terminal · Light | estado ou variante | — | — |
| `1438:29713` | Style · 02c Theme · Atelier | estado ou variante | — | — |
| `1451:31434` | Style · 02d Theme · Pulse | estado ou variante | — | — |
| `1438:29860` | Style · 02e Theme · Custom | estado ou variante | — | — |
| `1451:36655` | Style · 02f Theme · Switch | estado ou variante | `src/components/admin/design/editor/switch-look.tsx` | — |
| `1438:34732` | Style · 03 Layout | passo | `src/components/admin/design/editor/design-steps.tsx` | — |
| `1438:32676` | Style · 04 Type | passo | `src/components/admin/design/fields/type-fields.tsx`, `src/components/admin/design/options.ts` | — |
| `1438:33559` | Style · 05 Background | passo | `src/components/admin/design/fields/background-control.tsx` | — |
| `1454:37536` | Style · 05b Background · Image too small | estado ou variante | `src/components/admin/design/fields/background-control.tsx` | — |
| `1454:36867` | Style · 06 Search · Results | passo | — | — |
| `1455:35927` | Style · 07 Click to edit | passo | — | — |

## Editor · 03 Pages

Rota no protótipo: `/admin/[coach]/design/pages`.

| ID | Tela | Tipo | Citada no código | Controlador do protótipo |
|---|---|---|---|---|
| `1989:32129` | Pages · 00 Flow map | mapa do fluxo | — | — |
| `62:1113` | Pages · 01 Pages | passo | — | sim |
| `1413:22606` | Pages · 01b Pages · Search · Empty | estado ou variante | — | sim |
| `1413:23391` | Pages · 01c Pages · Search · Results | estado ou variante | — | sim |
| `1413:24163` | Pages · 01d Pages · Search · No results | estado ou variante | — | sim |
| `81:3395` | Pages · 02 Widget selected | passo | — | — |
| `74:3146` | Pages · 03 All widgets | passo | — | sim |

## Editor · 04 Join

Rota no protótipo: `/admin/[coach]/design (Join) e /site/[coach]/join`.

| ID | Tela | Tipo | Citada no código | Controlador do protótipo |
|---|---|---|---|---|
| `1989:32228` | Join · 00 Flow map | mapa do fluxo | — | — |
| `133:8445` | Join · 01 Log in | passo | — | — |
| `133:9624` | Join · 01b Log in · Split | estado ou variante | — | — |
| `133:11108` | Join · 02 Sign up | passo | — | — |
| `133:12323` | Join · 03 Subscribe | passo | — | — |
| `1929:31956` | Join · 03b Subscribe · Booking link | estado ou variante | — | — |

## Editor · 05 Menus and dialogs

Rota no protótipo: `/admin/[coach]/design`.

| ID | Tela | Tipo | Citada no código | Controlador do protótipo |
|---|---|---|---|---|
| `1989:32327` | Menus and dialogs · 00 Flow map | mapa do fluxo | — | — |
| `1132:9922` | Top bar · 01 Page menu | passo | — | — |
| `1132:10438` | Canvas · 01 Layout for | passo | — | — |
| `1132:10610` | Dialogs · 01 Earlier versions | passo | — | — |
| `1132:11285` | Pages panel · 01 On this page | passo | — | — |
| `1132:10094` | Top bar · 02 More menu | passo | — | — |
| `1141:16498` | Canvas · 02 Tablet | passo | — | — |
| `1132:10782` | Dialogs · 02 Save as template | passo | — | — |
| `1141:15124` | Pages panel · 02 Category open | passo | — | — |
| `1132:10266` | Top bar · 03 Preview as | passo | — | — |
| `1141:17487` | Canvas · 03 Phone | passo | — | — |
| `1132:10954` | Dialogs · 03 Back to the original design | passo | — | — |
| `1141:15246` | Pages panel · 03 Course page | passo | — | sim |
| `1222:25026` | Top bar · 04 Publish failed | passo | — | — |
| `1222:24848` | Canvas · 04 Preview loading | passo | — | — |
| `1222:25204` | Top bar · 05 All published | passo | — | — |

## Lacunas conhecidas

- Course tour: o passo `open-course` ("Open your course", `src/components/admin/tour/tours.ts`) não tem tela no Figma (Code-only).
- Telas do aluno (sino, Also by e-mail) não ficam neste arquivo.

