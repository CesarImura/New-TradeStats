# Notificações: regras e condições (20/11/2026)

Resultado da revisão de tudo que avisa alguém no produto: o sino do Admin, a página Settings › Notifications, os toasts (Admin, Editor, aluno), os selos e o lado do aluno. Pesquisa e fontes legais: `docs/notificacoes-pesquisa-2026-11-20.md`. Testes: `scripts/notifications-*.mjs`.

## 1. Qual canal para qual aviso

| Canal | Para quê | Exemplo | Some quando |
|---|---|---|---|
| **Sino** (painel) | Algo que aconteceu no negócio sem o coach fazer nada; precisa de memória | pagamento falhou, nova venda, upload pronto | o coach lê (clique ou Mark all read) |
| **Toast** | Resultado de uma ação que o coach acabou de fazer | "Link copied", "Reminder sent", "Terminal applied" + Undo | sozinho em ~4 s |
| **Inline** (campo, Callout) | Erro de preenchimento ou estado da página | "Enter a valid e-mail" | o problema some |
| **Dialog** | Decisão que precisa de resposta | "Switch to Terminal?" | o coach escolhe |
| **Selo / ponto** | Estado não lido ou "agora" | ponto do sino, Live dot | muda o estado |
| **E-mail** | O que exige ação ou que o coach pediu | pagamento falhou, resumo diário | enviado |

Regra de ouro: **toast confirma o que você fez; sino conta o que aconteceu**. Nunca usar toast para algo que o coach não provocou, e nunca usar o sino para confirmar um clique.

## 2. Sino do Admin

- **O que aparece:** os avisos de `NOTICES` (`notifications-menu.tsx`). Um aviso com tipo (`failed`, `sale`, `live`, `upload`) só aparece se o toggle "In the bell" daquele tipo estiver ligado. Avisos sem tipo (pedido de journal, repasse atrasado) **nunca** somem.
- **Não lido** = id fora da lista de lidos. Contam: ponto do sino (sem número), tag "N new" no cabeçalho (conta só o que a aba mostra; acima de 99 vira "99+"), aria-label do botão ("Notifications, 4 new").
- **Ler:** clicar no aviso marca como lido, fecha o painel e navega. "Mark all read" marca todos os visíveis e fica desabilitado quando não há nada novo.
- **Memória:** o que foi lido e as preferências ficam por comunidade (`useCommunityData`): chaves `admin-notification-read` e `admin-notification-prefs`. Outra comunidade começa com os padrões.
- **Filtros:** All; Payments (failed, sale, payout); Journal; Students. Filtro sem resultado: "Nothing in Payments right now."
- **Estados:** nova plataforma ou nada ligado: Empty state "You're all caught up" com botão Notification settings, sem abas nem rodapé. Com itens: abas, lista (rola se não couber), rodapé.
- **Comportamento do popover:** sem scrim; fecha com Esc, clique fora ou ⌘K (a busca assume a tela); o foco volta ao sino; Tab percorre Mark all read, abas, avisos e rodapé.
- **Altura:** máx. `100svh - 5rem`; a lista rola e o rodapé fica sempre visível. Largura 420, ou 100vw − 1rem no celular.
- **Movimento:** abre em 200 ms ease-out (fade + scale .97 + 4 px, origem no sino), fecha em 150 ms; ponto do sino e linhas lidas animam 200–300 ms; reduced motion corta tudo.

## 3. Settings › Notifications

Quatro blocos: **Always on** (Security, Plan and invoices, Payouts: não dá para desligar), **Activity** (Payment failed, New sale, Livestream reminder, Upload finished: sino e e-mail), **Daily summary** (desligado, só sai se houve algo), **News from Traderhub** (marketing nosso, desligado até o coach ligar).
- Padrão de e-mail: ligado **só** em Payment failed.
- E-mails não mostram nome nem valor ("um pagamento falhou, abra para ver").
- Tudo salva ao digitar. Abaixo de 640 px a coluna When some e a descrição vai para baixo do nome.
- **Armadilha corrigida:** o perfil do aluno já guardava as preferências dele em `<slug>:notifications`; o Admin escrevia no mesmo lugar e, depois de um toggle do aluno, o shell do Admin quebrava. Agora o Admin usa `admin-notification-prefs` e `normalizePrefs()` aceita qualquer coisa guardada.

## 4. Toasts

- **Texto:** título = uma frase curta **sem ponto final**; segunda frase = descrição (com ponto). Aplicado automaticamente por `lib/toast.ts` (via `lib/toast-text.ts`): "Link copied." vira "Link copied"; "Changes discarded. Your platform is back to the live version." vira título + descrição. Erro: "Couldn't X" + motivo na descrição. Sem "!" e sem versão ("v1", "beta").
- **Repetição:** o mesmo texto **substitui** o que já aparece (reinicia o tempo) em vez de empilhar. Um `id` explícito vence (os avisos com Undo têm o seu).
- **Ação:** Undo só quando dá para desfazer; o toast com Undo fica o suficiente para o coach ver.
- **Importar `toast` sempre de `@/lib/toast`**, nunca de `sonner` (só o `Toaster` e o `canvas-toast` importam de lá).
- **Posição:** canto inferior direito, acima da pill do tour e do seletor Admin/Student (`--admin-toast-bottom`, mínimo 72 px; no celular 136 px, porque o seletor é uma pill de 48 px a 80 px do fundo). No Editor: 380 px da direita com o inspector aberto, 14 px sem ele (senão cobre a prévia do celular). Avisos do canvas: canto superior direito, abaixo da barra, com toaster próprio.
- **Camada:** acima de modais, drawers e da busca (z-index do Sonner).
- **Fonte:** a da página (Helvetica Neue no Admin e no Editor; a do tema no aluno). Antes o Sonner usava a fonte do sistema.
- **Figma:** `Admin / Toast` (Components › Admin · Data display; Type Default/Success/Error, Show Description/Action/Icon, Title Text, Description Text).

## 5. Lado do aluno (achados, não alterado)

- O sino do aluno (`student-shell.tsx`) é um botão **sem painel e com ponto fixo**; o Admin promete "Students get a notification" em vários lugares (mensagem, feedback, downloads, ranking, lembrete do journal) e o aluno não tem onde ver. Decisão do Gustavo: criar o painel do aluno ou ajustar os textos.
- O perfil do aluno tem a aba Notifications com 5 switches (feedback, lessons, events, community, e-mail) e "Also by e-mail" ligado por padrão: falta decidir com o Flavio (consentimento, serviço x marketing).

## 6. Cenários cobertos pelos testes

- `notifications-settings`: padrões, os 4 blocos, efeito no sino (6 → 5 → 2 avisos, tag "N new"), filtros, Mark all read, persistência, plataforma nova, 1440/1024/768/390, Tab/Espaço, reduced motion, Esc.
- `notifications-bell`: ⌘K fecha o painel, clique marca lido e navega, contagem cai, lido persiste, todas as rotas dos avisos abrem, comunidades isoladas, altura de 480 px, ordem do Tab.
- `notifications-toasts`: toast dentro da tela e sem cobrir o seletor em 4 larguras, 7 cliques viram 1 toast, some em ~6 s.
- `notifications-key-collision`: o toggle do aluno não quebra o Admin.

## 7. Em aberto

1. Painel de notificações do aluno (item 5).
2. Aba E-mails do aluno: serviço x marketing e registro de consentimento (com o Flavio e jurídico).
3. Bug de hidratação do player (volume guardado < 0,5) só relatado: `video-player.tsx`, `useState(loadPrefs)`.
