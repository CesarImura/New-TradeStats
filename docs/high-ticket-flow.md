# High ticket (Offers): fluxo, cenários e regras para os devs

Estado em 23/11/2026 (revisão do Figma passada para o código). O Figma (seção Sales & payments, telas 04 a 07e) e o protótipo mostram o fluxo inteiro; **não há backend**: nada é cobrado, os dados ficam no navegador (`<slug>:offers`, `<slug>:offerLinks`). Quem for construir o real usa este documento como especificação. Decisões do Gustavo (20/11): o pacote abre um tier; o tier "só por oferta" (cadence `offer`, ex.: 1:1 VIP) não tem preço próprio e não aparece na sales page nem no checkout; não haverá versão com backend feita por nós.

## 1. O que existe

| Entidade | Campos principais | Onde no protótipo |
| --- | --- | --- |
| Offer | nome, preço total, tier que abre, planos de pagamento (cada plano = lista de valores: o 1º é pago hoje, os outros um por mês; podem ser iguais ou diferentes, ex.: entrada + 3 meses; a soma tem que fechar o preço total), substitui assinatura, trava e-mail, avisar quando abrir, remetente pode mudar o preço | `lib/data/offers.ts`, `admin/sales/offers.tsx` |
| Link | offer, plano, preço do cliente, e-mail (opcional), remetente, criado em, expira em, aberto em, pago em, parcela falhada | idem |
| Compra | tier, e-mail, nome, total pago hoje | `savePurchase` (`lib/data/sales-page.ts`) |

Regras: a primeira parcela é paga na hora e as outras uma por mês no mesmo dia (2 pagamentos: a segunda 30 dias depois). Plano com parcelas iguais segue o preço (total ÷ nº); plano editado à mão mantém os valores. Quando o remetente muda o preço de um link, o plano é reescalado (`scalePlan`, a última parcela fecha o resto). O checkout não pede mais consentimento: só nome e e-mail. O link vale 24 h, 7 dias ou 30 dias e **só funciona uma vez**. Depois da primeira parcela o cliente recebe o tier do offer; o `replaceSubscription` encerra a assinatura que ele já tinha. Moeda vem de Settings > General.

## 2. Ciclo de vida

**Link:** criado (Not opened) → aberto (Opened, registra a data e avisa se o offer pediu) → pago (Paid) ou expirado (Expired). Pago e expirado são finais; para um cliente que deixou expirar, "New link" cria outro. Apagar um link só é permitido enquanto não foi pago.

**Parcelas:** 1ª paga na compra → próximas cobradas na data → se falhar, o Stripe tenta de novo por 2 semanas e o coach decide sobre o acesso (Pause access). Falha continua com acesso até o coach pausar (decisão a validar).

**Acesso:** tier liberado após a 1ª parcela. Pause access não cancela as parcelas.

## 3. Cenários

| # | Cenário | O que acontece | Onde está desenhado / prototipado |
| --- | --- | --- | --- |
| 1 | Coach cria offer | valida nome (único), preço > 0, ao menos 1 plano | Figma 05 · protótipo (drawer) |
| 2 | Coach envia link | escolhe offer, plano, preço (editável só se o offer permite), e-mail, validade | Figma 06 · protótipo (modal) |
| 3 | Preço do link mudou | registrado com o nome de quem mudou | Figma 05b · protótipo (campo; registro só como regra) |
| 4 | Cliente abre o link | status Opened, aviso no sino se o offer pediu | protótipo (sino ao vivo) |
| 5 | Pagamento aprovado | primeira parcela cobrada, link Paid, tier liberado, vai para a conta | Figma 07 · protótipo |
| 6 | Cartão recusado | nada é cobrado, erro na página, tenta de novo; link segue válido | Figma 07d · protótipo |
| 7 | Banco pede confirmação (3-D Secure) | confirma no app do banco e segue, ou cancela e volta ao erro | protótipo |
| 8 | Link expirado | tela "link expirou", pedir novo ao coach | Figma 07b · protótipo |
| 9 | Link já usado | tela "já foi usado", botão Log in | Figma 07c · protótipo |
| 10 | Link inexistente (apagado) | "This link doesn't work" | protótipo |
| 11 | Offer apagado depois do envio | "This offer isn't available anymore" | Figma 07e · protótipo |
| 12 | E-mail travado | o campo vem do link e não muda; sem trava, o cliente digita | protótipo |
| 13 | Plano com parcelas | só paga depois de aceitar o parcelamento (checkbox) | protótipo |
| 14 | Cliente já assina | aviso "sua assinatura termina após este pagamento" | protótipo (texto); cancelamento é regra do backend |
| 15 | Parcela falha | status Retrying, aviso Instalment failed, Needs you no topo da aba | Figma 13c, 04 · protótipo (Transactions, perfil do aluno) |
| 16 | Coach resolve falha | Send payment link, Retry now ou Pause access | protótipo (perfil, Transactions) |
| 17 | Disputa / estorno | segue o fluxo de Transactions (Answer the dispute, Refund) | existente em Transactions |
| 18 | Payouts não conectado | Send link bloqueado, aviso "Connect payouts first" com atalho | Figma 04b · protótipo |
| 19 | Primeiro uso (sem offers) | estado vazio com "New offer" | Figma 04b · protótipo |
| 20 | Booking antes de pagar | linha "Book a call" na página de assinatura (link em Settings > General) | Figma Join 04b · protótipo |

## 4. Para o backend (sugestões, não implementadas)

- **Stripe:** parcelas como subscription schedule com `iterations` iguais ao nº de pagamentos e `end_behavior=cancel`; a página do link cria a Checkout Session ao abrir (a sessão vale no máximo 24 h, o link vale mais); uso único = limitar por sessão concluída; falha de parcela cai na lógica de retentativa (Smart Retries) e dispara o aviso ao coach.
- **Link:** token longo e imprevisível; checar status, expiração e se o offer ainda existe a cada abertura; travar o e-mail quando o offer pede.
- **Eventos a registrar:** link criado, aberto, pago, expirado, parcela cobrada, falhou, acesso pausado, mudança de preço (com quem mudou).
- **Em aberto com o Gustavo:** política automática para parcela atrasada, regras legais do parcelamento, categoria trading no Stripe.

## 5. Como testar o protótipo

`node scripts/offers-flow.mjs` (90 verificações) e `node scripts/sales-overview.mjs` (53: Sales Overview, alertas, Needs you today, gráfico, Remove student, plataforma nova) com o servidor em localhost:3000; na página pública, os botões "Prototype · what the payment returns" simulam pago, cartão recusado e confirmação do banco.

## 6. Sales & payments e Overview (23/11/2026)

- **Fonte única dos alertas de pagamento:** `lib/data/payment-alerts.ts`. Alimenta o card Payment alerts (Sales), a linha de pagamentos e o drawer de Needs you today (Overview) e a contagem "Payment issues" em Students; os números não podem divergir.
- **Padrão de card:** `ui/attention-card.tsx` (`AttentionCard` + `AttentionDrawer`); usado por `sales/payment-alerts.tsx` e `needs-you-today.tsx`. Mostra as linhas mais urgentes com uma ação cada; "View all" abre o drawer com abas e rolagem. Drawer sem botão Close no rodapé.
- **Sales Overview** (`sales/revenue.tsx`): KPIs (Revenue, MRR, To collect, Next payout), gráfico de 6 meses empilhado Subscriptions/Offers com hover (`revenue-chart.tsx`), Coming up e Revenue by source em donut (`revenue-panels.tsx`). MRR e Coming up são dados de exemplo do protótipo.
- **Remove student:** menu do perfil e callout de falha de pagamento; modal "Remove {nome}?" com Undo; o aluno some da lista (sem pronome inferido).
- Títulos de card em 16 px (`t-heading-s`) em todo o Admin; título de modal, drawer e Settings continuam em 18 px.
