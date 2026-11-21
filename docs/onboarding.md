# Onboarding do coach (Admin v2): contexto completo

Estado em 19/11/2026, depois da revisão final. Fonte de decisão: vault (Updates de 12/11, 14/11 e 19/11), Figma seção `Screens · Admin v2` › `1485:136393`. Protótipo com persistência local (`localStorage`), sem backend nem autenticação reais: o e-mail só "prova" o endereço com um código de seis dígitos (qualquer um passa, `000000` mostra o erro).

## Fluxo e rotas

| # | Tela | Rota | Componente | Figma |
|---|------|------|------------|-------|
| 1 | Log in | `/signup` | `app/(onboarding)/signup/page.tsx` | Sign up · 01 (1485:136394) |
| 2 | Create account | `/signup/create` | `signup/create/page.tsx` | Sign up · 02 (136402) |
| 3 | Verify code | `/signup/verify` | `signup/verify/page.tsx` | Sign up · 03 (136410) |
| 4 | About you | `/signup/about` | `signup/about/page.tsx` | Sign up · 04 (136418) |
| 5 | Name and language | `/signup/name` | `signup/name/page.tsx` | Sign up · 05 (136459) |
| 6 | Getting started | `/admin/<slug>/getting-started` | `admin/getting-started/getting-started.tsx` | Getting started · 01 a 06 |
| 7 | Design · Brand / Look / Layout | `/setup?step=brand|look|layout` | `onboarding/design-setup.tsx` | Design · 01 a 03 (136501, 136538, 136572) |
| 8 | Tours (tier, course, payouts, legal, editor) | `?tour=<id>` nas páginas do Admin | `admin/tour/tour.tsx`, `tours.ts` | Tour · … |
| 9 | Go live e You're live | modal em Getting started | `getting-started/go-live.tsx` | Tour · Go live · 01 a 03 |
| 10 | Help (Chat, Book a call, Have us set it up) | painéis em Getting started | `getting-started/help-panels.tsx` | Help · 01 a 03 |

`/signup/call` e `/signup/welcome` são restos do cadastro antigo: redirecionam para `/signup/about` (e, sem conta, para Create). O quadro (logo, ilustração à direita, só a partir de 1024 px) é desenhado uma vez por `SignupShell` (`components/onboarding/signup-frame.tsx`); cada página traz só o cartão (440 px; About 560; Name 480).

## Regras de comportamento

- **Botão principal só ativo quando tudo obrigatório está válido** (regra de 19/11; `docs/components.md` "Formulários"). Erro só com algo digitado e inválido. Log in: e-mail válido. Create: nome e e-mail válidos. Verify: seis dígitos (o sexto já confirma). About: pelo menos uma resposta, Skip sempre ativo. Name: nome com 2 a 40 letras, "o que os alunos chamam você" e os termos.
- **Persistência:** a conta fica em `proto:account`; Back de Verify para Create devolve nome e e-mail; Back de Name guarda o rascunho (`nameDraft`); o rascunho de design em `proto:draft:<slug>`. Recarregar a página de Name limpa o formulário (ainda não há plataforma): limitação conhecida, não corrigida.
- **Back do navegador depois de criar a plataforma** (corrigido em 19/11): About e Name (`useNeedsAccount`) mandam para a plataforma já criada em vez de deixar criar uma segunda idêntica.
- **Getting started em ordem** (19/11): só o primeiro passo não concluído e não adiado é o atual; os de baixo ficam bloqueados; Skip for now libera o próximo; Go live só abre com os cinco concluídos. Nada é gravado para o bloqueio. Detalhes e teste: `docs/components.md` "Getting started em ordem".
- **Tours:** um por vez; Skip / Do it later pausa (a pill fica, Getting started mostra "Paused at" e Resume). A pill só existe nos fluxos da timeline, nunca no Getting started, com o anel à esquerda e check verde ao concluir.
- **Temas** (Look): Terminal, Atelier, Pulse, cada um em Dark e Light; o Pulse usa a paleta exata do template (`greysFollow`). Ver "Temas" em `docs/components.md`.

## Componentes compartilhados (ao mexer, rodar os testes de regressão)

`AdminButton` (hierarquia `text` para Back e Skip), `AdminField`, `ChoiceChip` (About), `StepIndicator` e `TimelineStep` (Getting started), `SelectionCard` (Look e Layout), `PillSegmented` e `SlideTrack` (tabs e segmented com thumb deslizante), `ProgressRing` (pill do tour e progresso do Design), `AdminTabs`. Mapa completo: `~/Projetos/TradeHub/docs/figma-component-map-2026-11-17.md`.

## Testes (todos em `scripts/`, Playwright, `CHROME_PATH` do Chrome for Testing)

`onboarding-review.mjs` (fluxo inteiro em 9 larguras, 320 a 1920, com `AXE_PATH` para o axe-core instalado fora do repositório), `tours-smoke.mjs`, `forms-rule.mjs <grupo>`, `getting-started-order.mjs`, `selection-card.mjs`, `tour-pill.mjs`, `tabs-motion.mjs`, `theme-matrix.mjs`, `theme-controls.mjs`.

## Decisões abertas

1. ~~Atelier e Pulse dark~~ **Resolvido em 19/11 (Gustavo: seguir o Figma):** paletas dos templates ajustadas aos frames `Style · 02 a 05 Theme` (ver "Temas" em `docs/components.md`). Em aberto: Atelier dark e Pulse light não existem no Figma (ficaram como estavam); o cartão do Pulse dark sai #1C213F (escada de contraste) contra #171B38 do Figma.
2. Etiqueta "Skipped" do Timeline step: existe no código e não existe no componente do Figma (6 variantes e dezenas de instâncias). Precisa de uma etapa própria.
3. Alvo de toque de 24 px nos pontos de cor (Brand, pares de cores do Layout): mantidos como no Figma, aceitos como exceção documentada.

## Histórico das mudanças de 19/11

Formulários com botão desabilitado até estar pronto; Getting started em ordem; timeline refeita pelo exemplo do Gustavo; Selection card; pill do tour e Progress ring; tabs com thumb deslizante; coachmark laranja; temas e ilustrações dos cards; esta revisão (Back do navegador, 320 px no Getting started, alvos de toque da tela de código, Figma dos frames Help, Resume later e Payouts skipped).
