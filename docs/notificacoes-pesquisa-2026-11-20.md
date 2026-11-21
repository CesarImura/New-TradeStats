# Notificações do Admin: pesquisa e recomendação (20/11/2026)

Pedido do Gustavo: entender o que faz sentido ter nas notificações, os canais (sino, e-mail), a lei de proteção de dados da UE, reclamações reais de usuários, e sugerir mudanças. **Nada foi alterado por causa desta pesquisa.** O que já existia antes dela está no fim (seção 8).

Não é aconselhamento jurídico: o texto de lei é citado, a leitura para o produto é minha. Antes de publicar, um advogado de proteção de dados deve revisar (seção 9).

## 1. Recomendação em uma página

1. **Manter a página Notifications, mas com quatro blocos em vez de uma tabela só**: (a) *Always on*, avisos que o coach não pode desligar; (b) *Activity*, avisos configuráveis por canal; (c) *Daily summary*; (d) *Product news from Traderhub*, marketing nosso, desligado por padrão.
2. **E-mail só para o que exige ação.** Padrão de e-mail ligado apenas para pagamento falhou. Nova venda, upload e lembrete de live ficam só no sino por padrão.
3. **Resumo diário só é enviado se aconteceu algo** (regra do Circle: não envia digest vazio).
4. **Avisos obrigatórios visíveis e travados** (segurança da conta, cobrança do plano e termos, exigências de pagamento/identidade do parceiro de pagamentos). O coach vê que existem, não pode desligá-los.
5. **Marketing nosso para o coach: desligado por padrão, escolha ativa, retirada tão fácil quanto a adesão** (GDPR art. 7(3); caixa pré-marcada não vale, caso Planet49).
6. **Canais agora: sino, e-mail e resumo diário. Sem push, SMS ou Slack ainda.** Cada canal novo traz regra de consentimento própria e o volume do coach é baixo.
7. **Lado do aluno (aba E-mails): separar "e-mails de serviço" de "novidades e marketing"** e guardar registro de consentimento. Isto é decisão do produto e do jurídico, não só desta tela (seção 6).

## 2. O que os dados dizem sobre fadiga de aviso

| Dado | Fonte | Observação |
|---|---|---|
| 67% dos consumidores dizem que o motivo nº 1 para cancelar e-mails de uma loja é frequência alta; 42% citam promoções em excesso | Litmus, "Why Your Best Marketing Channel Is Driving Customers Away" | Varejo B2C, não SaaS; serve como ordem de grandeza |
| Um usuário de smartphone recebe até 46 notificações push por dia | Courier, citando Airship (benchmarks 2025) | Push de apps, não e-mail |
| Entre quem não recebe alertas de notícias, 43% desligou depois de receber demais ou de achar inúteis | PRSA, resumo de estudo de agosto/2025 | Notícias, mas mostra o padrão "desligar tudo" |
| Quem exagera acaba perdendo o aviso importante: usuários desligam tudo ou abandonam o produto | Courier, "How to Reduce Notification Fatigue" | Texto de fornecedor, tratar como opinião |

**Reclamações reais em produtos parecidos** (só consegui ver o trecho que aparece na busca; as páginas do Reddit e do Facebook não abrem para o meu leitor):
- Skool, grupo do Facebook: "Skool notifications taking over your email notifications inbox? It's ridiculous!"
- Skool, r/SKOOL: "Most owners of active groups are drowning in notifications".
- Stripe, r/stripe: "Failed Payment Emails Setting is greyed out" (a pessoa não consegue controlar um aviso).
- Stripe, vídeo de ajuda: "How to Stop Stripe Email Notifications For Every Sale (Fix Email Clutter)". O aviso de **cada venda** é o clássico que vira ruído.

Leitura: o coach cansa de **e-mail por evento**, sobretudo venda, e reclama quando **não consegue** desligar. As duas coisas pedem: padrão enxuto e controle claro (inclusive dizer o que é obrigatório).

## 3. Como outros produtos fazem

| Produto | Como organiza | O que aproveitar |
|---|---|---|
| **Circle** (comunidades) | Categorias (e-mail, nova atividade, padrão); admin define os padrões dos novos membros; digest semanal só sai com pelo menos 2 posts novos; tudo de novidade vem ligado por padrão | Digest condicional. **Não copiar** o "tudo ligado": é o padrão que o GDPR proíbe para marketing |
| **Stripe** (pagamentos) | Cada membro da equipe liga/desliga os avisos dele; avisos de conta vão para o dono da conta | Preferência **por pessoa**; avisos de conta não são opcionais |
| **GitHub** | Escolhe o tipo de atividade e onde entregar (e-mail e/ou inbox); resumo diário ou semanal para alertas de segurança | Canal por tipo; resumo como alternativa ao evento |
| **Lucidchart** | Matriz categoria × canal (no app, e-mail) com interruptor por categoria | A matriz que já usamos |
| **Skillshare** | Lista de caixas por tipo de e-mail, uma linha de descrição cada | Descrição curta em cada linha |
| **Render** | Destino (e-mail ou Slack) e padrão ("só falhas") com edição por serviço | Padrão "só o que falhou" |
| **Product Hunt** | Newsletters separadas dos alertas, e "Unsubscribe from all" | Marketing separado; sair de tudo de uma vez |
| **Kittl** | Aba Notifications com 3 caixas e Save | Mínimo viável |

Não achei dados públicos de adoção que digam quanto cada padrão reduz cancelamentos. As escolhas acima seguem o que os produtos fazem e o que o direito exige, não um estudo de causa e efeito.

## 4. Lei da UE: o que vale para o produto

| Regra | Texto/fonte | O que muda no produto |
|---|---|---|
| E-mail de marketing exige consentimento prévio; exceção para cliente (mesmos produtos ou serviços semelhantes), com oportunidade clara, gratuita e fácil de recusar na coleta e em cada mensagem | ePrivacy, Diretiva 2002/58/CE, art. 13(1) e 13(2) (EUR-Lex, CELEX 32002L0058) | Todo e-mail de marketing leva link de sair, e o endereço de resposta é válido (art. 13(4)) |
| Em 13/11/2025 o TJUE (C-654/23) confirmou que o art. 13(2) vale para e-mail de marketing a usuários cadastrados (caso freemium) sem exigir uma base legal separada do art. 6 do GDPR | Reed Smith, resumo do acórdão | A exceção do cliente ajuda o **coach** a escrever para o aluno pagante; não ajuda a **nós** a mandar novidades a quem não comprou nada |
| Consentimento pode ser retirado a qualquer momento e retirar deve ser tão fácil quanto dar | GDPR art. 7(3) | Toggle liga/desliga no mesmo lugar; sem "escreva para o suporte" |
| Quem vê marketing direto pode se opor a qualquer momento, e o tratamento para esse fim deve parar | GDPR art. 21(2)-(3) | "Unsubscribe from all marketing" funciona na hora |
| Caixa pré-marcada não é consentimento; só conduta ativa | GDPR considerando 32; TJUE Planet49 (C-673/17) | **"Product news" nasce desligado** |
| Mensagem de serviço com um pedaço de marketing vira marketing | ICO, "Identify direct marketing" (Reino Unido; é guia, não lei da UE, mas segue o mesmo texto da diretiva) | Não pôr promoção, upsell ou novidades dentro de e-mail de pagamento falhou ou de segurança |
| Provedores de e-mail exigem cancelamento em um clique (RFC 8058) de quem manda perto de 5.000 mensagens por dia para Gmail; e-mails transacionais ficam de fora | FAQ de remetentes do Google (descrito por Palisade e Samva) | Nosso resumo diário e e-mail de novidades levam cabeçalho `List-Unsubscribe`; vale já, mesmo antes do volume |

**O que o coach NÃO pode desligar** (minha leitura: são mensagens de serviço, necessárias para executar o contrato ou cumprir obrigação, e não marketing):
- segurança da conta (novo login, troca de e-mail ou senha);
- cobrança do próprio plano e faturas;
- avisos legais (mudança de termos, de tratamento de dados);
- exigências do parceiro de pagamentos (documento ou verificação que bloqueia o repasse).

**Quem é quem nos dados** (leitura): o coach é o responsável pelo tratamento dos dados dos alunos; nós somos operadores. Os avisos que mandamos **ao coach** são mensagens de serviço da nossa relação com ele. O e-mail que o coach manda **ao aluno** pelo nosso sistema é responsabilidade dele, e precisamos dar a ele as ferramentas (sair, registro).

**Minimização** (leitura de GDPR art. 5(1)(c)): no e-mail, evitar nome do aluno e valor; "Um pagamento falhou, abra para ver" basta. O detalhe fica dentro do painel, que exige login.

## 5. Canais

| Canal | Decisão | Por quê |
|---|---|---|
| Sino | Sim | É o lugar do dia a dia, sem consentimento especial |
| E-mail | Sim, por tipo | Padrão só para o que exige ação (pagamento falhou) |
| Resumo diário por e-mail | Sim, desligado, condicional | Evita um e-mail por evento; só sai se houve algo |
| Push no navegador ou celular | Depois | O protótipo é web; precisa permissão do navegador e tem fadiga alta (dado dos 46 por dia) |
| SMS | Não | Custo, consentimento próprio e pouco ganho para o volume do coach |
| Slack/WhatsApp | Depois, se houver pedido real | Render oferece Slack, mas nosso público trabalha no celular; cada canal novo é nova base de consentimento |
| Quiet hours | Depois | Slack e GitHub têm, mas com poucos avisos por dia o ganho é pequeno |

## 6. Lado do aluno (aba E-mails, hoje 7 e-mails)

Hoje existem: Welcome, Payment receipt, Payment failed, New lesson, Live in 1 hour, Feedback answered, We miss you (este desligado). Proposta:
- **Serviço (sempre enviado, o coach só edita o texto):** Welcome, Payment receipt, Payment failed.
- **Relacionados à atividade do aluno (ligados, com cancelamento por e-mail):** Live in 1 hour, Feedback answered, New lesson.
- **Marketing (desligado, só com consentimento ou exceção do cliente):** We miss you e qualquer campanha futura.
- Cada e-mail não essencial leva link de sair e o aluno tem uma página "E-mails que recebo".
- **Registro de consentimento** (data, origem, texto mostrado) no perfil do aluno, para o coach demonstrar (GDPR art. 7(1)).

Isto liga com as decisões do Flavio sobre "retirada de consentimento" e "cookie banner" que o coordenador citou. **No cofre (vault) não achei nota decidindo consentimento ou e-mail** (busquei por consent, GDPR, privacy, cookie, withdraw); o Open questions não lista o tema. Trato como decisão aberta, para o Gustavo e o Flavio.

## 7. Proposta para a página Notifications

```
Notifications
What we tell you about, in the bell and by e-mail.

ALWAYS ON  (you can't turn these off)
  Security            New sign-in, password or e-mail change         [Required] bell + e-mail
  Plan and invoices   Your Traderhub plan, invoices, new terms        [Required] bell + e-mail
  Payouts             Your payment partner needs something from you   [Required] bell + e-mail

ACTIVITY                                     In the bell    By e-mail
  Payment failed       A student's card was declined         ON             ON
  New sale             Someone joins a plan or buys          ON             off
  Livestream reminder  One hour before you go live           ON             off
  Upload finished      A lesson video is ready               ON             off

DAILY SUMMARY                                              [off]
  One e-mail each morning, only if something happened.

PRODUCT NEWS FROM TRADERHUB                                [off]
  Tips and new features. You can stop them at any time.
```

Mudanças em relação ao que já existe no código:
1. Novo bloco *Always on* (linhas travadas com Tag "Required").
2. "Payout delayed" sai da tabela configurável e vira o *Payouts* obrigatório.
3. Padrões de e-mail: só "Payment failed" ligado.
4. *Daily summary* explica que só vai se houver algo.
5. Novo bloco *Product news*, desligado.
6. Nenhum nome de aluno ou valor nos e-mails; o detalhe fica no painel.

Esforço: pequeno no código (mesma página, novas seções) e no Figma (a tela 03b já existe com a tabela; falta o resto).

## 8. Estado do trabalho antes desta pesquisa

- Código pronto: aba Notifications no Settings (tabela de 5 avisos, resumo diário, o sino lê as preferências, botões do painel abrem a aba).
- Figma: item "Notifications" adicionado ao menu das 10 telas de Settings; tela `Settings · 03b Notifications` criada com título e tabela de 5 avisos. **Falta** o painel do resumo diário e qualquer mudança da seção 7.
- Nada disso foi alterado depois da pesquisa.

## 9. Decisões e limites

Decisões do Gustavo:
1. Aprovar a estrutura da seção 7 (quatro blocos)?
2. Padrão de e-mail: só "Payment failed" ligado?
3. Pôr "Product news from Traderhub" já agora ou só quando houver o que enviar?
4. Aba E-mails do aluno: separar serviço de marketing (seção 6) agora ou tratar com o Flavio junto com consentimento?

Limites:
- Não é aconselhamento jurídico. Falta confirmar com advogado: papel de responsável e operador, texto exato dos avisos obrigatórios, prazo de resposta a pedidos de sair, e leis nacionais (a diretiva deixa cada Estado decidir pontos de marketing para pessoas jurídicas, considerando 45).
- Não abri os posts de Reddit e Facebook; as citações são os trechos que a busca mostra.
- Os números de fadiga vêm de varejo e de push; não são específicos de coaches.
- Não achei estudo que meça o efeito de cada padrão em cancelamentos.

## 10. Fontes

- ePrivacy Directive 2002/58/CE: https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32002L0058
- TJUE C-654/23 (13/11/2025), resumo: https://www.reedsmith.com/our-insights/blogs/viewpoints/102luvt/ecj-rules-on-soft-opt-in-for-freemium-newsletters-no-separate-gdpr-legal-basis-r/
- GDPR art. 7: https://gdpr-info.eu/art-7-gdpr/
- GDPR art. 21: https://gdpr-info.eu/art-21-gdpr/
- Planet49 (C-673/17): https://www.privacyworld.blog/2019/10/the-planet49-decision-key-takeaways/ e https://iabeurope.eu/data-privacy-hub/case-c673-17-planet49/
- ICO, identificar marketing direto: https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/direct-marketing-guidance/identify-direct-marketing/
- ICO, respeitar preferências: https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/direct-marketing-guidance/respect-peoples-preferences/
- Google/Yahoo, cancelamento em um clique: https://www.palisade.email/learning/google-yahoo-one-click-unsubscribe e https://samva.dev/blog/one-click-unsubscribe-rfc-8058
- Litmus: https://www.litmus.com/blog/why-your-best-marketing-channel-is-driving-customers-away
- Courier: https://www.courier.com/blog/how-to-reduce-notification-fatigue-7-proven-product-strategies-for-saas
- PRSA: https://www.prsa.org/article/in-brief-the-risks-of-alert-fatigue-the-pressure-to-work-late-Aug25
- Circle, digest: https://help.circle.so/p/audience/notifications/setting-up-the-weekly-digest e padrões: https://help.circle.so/p/audience/notifications/understanding-community-notifications
- Stripe, notificações de conta: https://support.stripe.com/questions/set-up-account-email-notifications
- GitHub: https://docs.github.com/en/subscriptions-and-notifications/get-started/configuring-notifications
- Capturas (Screenrove, out/2026): Render `render-product-notifications`, Skillshare `skillshare-settings-notifications`, Lucidchart `lucidchart-product-notification-settings`, Kittl `kittl-product-settings`, Product Hunt `producthunt-notification-settings`.
- Vault Trader Hub: busca por consent, GDPR, privacy, cookie, withdraw, Open questions, sem decisão sobre consentimento ou e-mail.
