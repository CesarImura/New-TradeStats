# Overview e notificações: fechamento, decisões e commit (20/11/2026)

Thread: Revisar fluxo Overview e sidebar. Nada foi commitado, enviado ou publicado. Relatório de 16 itens da revisão final: `docs/overview-final-review-2026-11-20.md`. Regras de notificação: `docs/notifications.md`. Pesquisa: `docs/notificacoes-pesquisa-2026-11-20.md`. Tabs: `docs/components.md` › "Troca de conteúdo das abas".

## 1. O que foi entregue depois da revisão final
- **Live dot:** ciclo de 2,8 s, anel até 2,2x com cauda longa e pausa curta (antes 1,5 s e piscava). Mesmo componente em todo o produto (`ui/ping-dot.tsx`).
- **Troca de conteúdo das abas:** `ui/tab-panel.tsx` (`TabPanel`, `TabStackPane`). Fade + 12 px do lado da aba, saída em 110 ms, altura animada, reduced motion com a mesma marcação. Aplicado em Overview (Content, gráfico com morph entre dados), Sales, Community, Partners, Ranking, Charts, Journal, Calendar, Tiers, aula, drawer do aluno; `ui/tabs.tsx` (aluno) com fade; sino com fade por filtro.
- **Correções:** título do cabeçalho da aula colapsava para "H.." em 500 px (`lesson-page.tsx`, base de 14 rem para o título); rótulos de KPI cortados em 320 px (`ui/metric.tsx`, quebram em 2 linhas abaixo de 200 px de cartão); erro de hidratação do player com volume salvo abaixo de 50% (`ui/video-player.tsx`, preferências lidas depois do primeiro quadro).
- **Figma:** `Admin / Toast` em tela pela primeira vez (`Overview · 01f Normal week · Remind sent`, 1867:76763, com nota); textos de Foundations corrigidos ("320 variables · modes Dark and v2", "216 variables · modes Dark, Light, Atelier and Pulse"). Detalhes no mapa de componentes.

## 2. Testes
Executados e passaram: `tsc --noEmit` (0 erros); ESLint em 96 arquivos alterados (0 erros); `next build` na cópia isolada (porta 3107); `scripts/tab-content-motion.mjs` no build (1440, 768, 390, com e sem reduced motion: 42 verificações OK, 0 erros de console, hidratação limpa); testes de Live dot e KPI em 320 px; lição em 500 px e outras larguras sem corte.
Regressão (dev, porta 3000): `tabs-motion`, `notifications-bell`, `notifications-settings`, `notifications-toasts`, `notifications-key-collision` (141 verificações OK, 0 FAIL).
Não executado: aparelhos reais (só emulação); tema claro do Admin não existe.
Observação do `next dev`: uma página editada pode ser servida do HTML pré-renderizado antigo (`x-nextjs-cache: HIT`), o que gera um hydration error falso (visto em Community). Validar hidratação sempre contra um build (`next start`).

## 3. Decisões do Gustavo (nenhuma foi tomada por mim)
1. **Period no Overview:** KPIs e o subtítulo "last 30 days" devem seguir o filtro Period? Hoje só o gráfico segue. Recomendo seguir (evita número que contradiz o gráfico).
2. **Avatar do topo (LL):** hoje é inerte. Precisa de menu (perfil, sair)?
3. **Painel de notificações do aluno:** criar o painel (o sino do aluno hoje é um botão com ponto fixo) ou ajustar os textos "Students get a notification" do Admin. Recomendo o painel mínimo.
4. **E-mail do aluno:** "Also by e-mail" vem ligado por padrão e a aba E-mails mistura serviço e marketing sem registro de consentimento. Depende da resposta do Flavio e do jurídico (GDPR).
5. **Cor âmbar da mídia** (Shelf/Featured): manter ou trocar.
6. **320 px:** os rótulos de KPI já quebram em 2 linhas; decidir se a altura desigual entre cartões é aceitável (hoje sim).
7. **Commit seletivo** (ver §4) e quando rodar o deploy; produção já contém o trabalho até o commit 7a21faa1 mais o que foi publicado antes, o restante só existe no working tree.

## 4. Commit seletivo (para o Gustavo pedir; nada foi feito)
Todos os ~97 arquivos modificados ou novos no working tree são desta thread (revisei os diffs de `verify/page.tsx`, `prototype-store.ts`, `design-setup.tsx`, `widgets/catalog/*`, `go-live.tsx`, `kit.tsx`: só trocam `import { toast } from "sonner"` por `"@/lib/toast"`). Branch `mac-admin-v2`, HEAD 7a21faa1. Sugestão em 3 commits, na ordem:
1. **Sidebar, Overview e Live dot:** `shells/admin-shell.tsx`, `admin/workspace-switcher.tsx`, `admin/overview.tsx` (hunks do banner, KPIs, tooltip), `admin/ui/tag.tsx`, `admin/ui/live-dot.tsx`, `ui/ping-dot.tsx`, `admin/ui/metric.tsx`, `admin/ui/video-player-parts.tsx`, `admin/ui/video-player.tsx`, `admin/ui/index.ts`, `calendar/*`, `student/live-watch.tsx`, `public/sales-page.tsx`, `admin-tokens.css`.
2. **Notificações e toasts:** `admin/notifications-menu.tsx`, `lib/data/admin-notifications.ts`, `admin/settings/*`, `lib/toast.ts`, `lib/toast-text.ts`, `ui/sonner.tsx`, `app/layout.tsx`, todos os arquivos que só trocam o import do toast, `scripts/notifications-*.mjs`, `docs/notifications.md`, `docs/notificacoes-pesquisa-2026-11-20.md`.
3. **Troca de conteúdo das abas e correções finais:** `admin/ui/tab-panel.tsx`, `ui/tabs.tsx`, as telas com `TabPanel`, `admin/content/lesson-page.tsx`, `scripts/tab-content-motion.mjs`, `docs/components.md`, `docs/overview-*.md`.
Como `overview.tsx`, `notifications-menu.tsx` e `docs/components.md` misturam temas, a forma mais simples e segura é **um commit só** com mensagem curta por tema; separar em três exige `git add -p`. Em ambos os casos rodar `git diff --stat` antes e não incluir `AGENTS.md` se o `next dev` o regravar sem necessidade.

## 5. Riscos
- O Figma foi alterado em 3 pontos (Foundations, Overview 01f, Components já do dia); o arquivo Figma não passa pelo git.
- A animação de altura do `TabPanel` só roda na troca de aba; conteúdo que cresce por dentro não anima (intencional).
- Testes de animação são sensíveis a carga da máquina: rodar com o computador sossegado.
