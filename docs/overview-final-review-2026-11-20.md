# Revisão final do fluxo Overview (20/11/2026)

Sem redesign. Nenhuma decisão aprovada foi alterada. Nada foi commitado, enviado ou publicado.

## 1. Escopo
Overview do Admin (`src/components/admin/overview.tsx`) com banner Next live, cabeçalho, KPIs, gráfico, Content (Courses/Questions), Needs you today; sino (`notifications-menu.tsx`), busca ⌘K, sidebar, toasts, Live dot, estado de plataforma nova. Conexões: Students, Sales, Journal, Content, Livestreams, Settings › Notifications. Figma: seção `Admin · 02 Overview` (1485:64808).

## 2. Inventário
| Figma | Código | Estado |
|---|---|---|
| 01 Overview | `overview.tsx` Kairo | implementado, 1:1 |
| 01b Running · New platform | `useNewPlatform` | implementado |
| 01c Chart default | gráfico em repouso | implementado |
| 01d / 01e Questions (com / vazio) | célula Questions | implementado |
| 02 / 02b Notifications (cheio / vazio) | `notifications-menu.tsx` | implementado |
| 03 / 03b Search ⌘K (resultados / vazio) | `command-palette.tsx` | implementado |
| Settings · 03b Notifications | `settings-notifications.tsx` | implementado |
Componentes: Admin / Live dot, Admin / Toast, Tag Micro, ProgressRing não se aplica. Sem tela faltando; nenhuma parcial.

## 3. Problemas encontrados
Nenhum erro novo de implementação no Overview. Itens abertos estão nas seções 4 e 15.

## 4. Confirmados × hipóteses
Confirmados (não corrigidos, por serem decisão de produto ou de baixo risco):
1. KPIs e subtítulo ("last 30 days") não reagem ao filtro Period; só o gráfico reage (7 / 30 / 90 dias). Classe: pergunta de produto.
2. Avatar do topo (LL) é inerte (sem menu). Classe: pergunta de produto.
3. 320 px: rótulos de KPI ("ACTIVE STUDE…", "RULES FOLLO…") e linhas de Needs you today truncam com reticências; sem overflow horizontal. Classe: intencional/aceitável; sugestão opcional de permitir quebra de linha só no rótulo.
4. Pill flutuante Admin/Student cobre parte do conteúdo em tela estreita. Classe: intencional (chrome do protótipo).
5. Bell do aluno é botão sem painel (herdado, ver `docs/notifications.md` §5).
Hipóteses descartadas: "tooltip não some" (falha do meu seletor; ao sair do gráfico o texto desaparece); "Live options" não existe mais no cabeçalho (não está no Figma nem no código).

## 5. O que está certo
Paridade visual com o Figma nos 6 frames comparados (1920×1308, sem diferença estrutural; só renderização de fonte do Figma e o tooltip de hover), 4 KPIs linkam para students / sales / students / journal, banner e Needs you today navegam certo, filtros abrem, tooltip aparece e some, estados vazios corretos, 0 erros de console.

## 6. Correções
Nenhuma nova nesta rodada (as de hoje, sidebar, Live dot, notificações, toasts, estão em `docs/components.md` e `docs/notifications.md`).

## 7. Alterações de design
Nenhuma. Auditoria do Figma limpa: 0 fills/strokes sem variável, 0 textos sem estilo, só Helvetica Neue, sem nomes duplicados, notas completas.

## 8. Alterações de código
Nenhuma nesta rodada. Working tree continua com ~97 arquivos não commitados de várias threads.

## 9. Interações testadas (Playwright, Kairo, 1440 px, 30 verificações)
Open studio, Go live, Remind (toast; 5 cliques = 1 toast), 4 KPIs, tabs do gráfico (4), Tier (5 opções), Period (3 opções), tooltip, Questions/Courses, Answer, cards de curso, Message/Review/Nudge/Open, See all, Help, ⌘K + busca + Enter, clique na barra de busca, voltar do navegador. 27 OK; 3 marcadas FAIL no script eram hipóteses (itens 1 e 2 e o seletor de tooltip).

## 10. Cenários
Kairo (cheio), plataforma nova (vazia), Questions com e sem perguntas, sino cheio e vazio, busca sem resultado, recarregar, voltar. Longo/curto/inválido: cobertos pelos testes de notificação (`scripts/notifications-*.mjs`) e pelo teste de 320 px.

## 11. Breakpoints
320, 375, 390, 430, 679, 680, 768, 1023, 1024, 1279, 1280, 1440, 1535, 1536, 1920 nas duas plataformas: overflow horizontal 0 em todos; 0 erros de JS; truncamento real só em 320 (item 3).

## 12. Figma × código
Comparação visual por pixel nos frames 01, 02, 03, 03b, 01b, 02b. Diferenças: fonte (o renderizador do Figma não usa a Helvetica Neue do app; limite da ferramenta, não erro de design), tooltip em estado de hover no frame 01, pill Admin/Student só no código.

## 13. Componentes compartilhados
Nada alterado nesta rodada; verificação de regressão dos alterados hoje: tsc 0 erros, ESLint 0 erros em 89 arquivos, build em cópia isolada passou.

## 14. Docs e skills
Este relatório. `docs/components.md`, `docs/notifications.md` e mapa de componentes já atualizados hoje. Texto de skill enviado ao coordenador na mensagem final.

## 15. Decisões pendentes (do Gustavo)
1. KPIs e subtítulo devem seguir o filtro Period? (hoje só o gráfico)
2. Avatar do topo precisa de menu (perfil, sair)?
3. Painel de notificações do aluno ou ajustar os textos "Students get a notification".
4. Aluno: "Also by e-mail" ligado por padrão e consentimento na aba E-mails (com Flavio).
5. Cor âmbar da mídia.
6. Título do lesson header quebra em 500 px.
7. Bug de hidratação do player em dev (`useState(loadPrefs)`), só relatado.
8. 320 px: permitir quebra de linha nos rótulos de KPI?

## 16. Riscos e não verificado
- Interações em Chrome real foram feitas por Playwright; a extensão do Chrome foi usada para Figma e para abrir o app, conferir KPIs, sino, overflow e console, não para repetir cada clique.
- Tablet e celular reais não testados; só emulação.
- Tema claro: não se aplica, o Admin só tem o modo escuro (sem `color-scheme` nem toggle).
- Sino, busca ⌘K e menu lateral (drawer, 18 links, sem rolagem) em 320, 375, 390, 430, 679, 768, 1023, 1280 e 1920: cabem na tela, 0 erros de JS.
- Build feito em cópia isolada; produção já contém parte do trabalho (deploy 7a21faa1), restante segue não commitado.
