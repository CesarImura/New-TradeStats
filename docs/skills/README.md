# Skills do TradeHub (versão de 21/11/2026)

As skills que o Claude usa no projeto, consolidadas de 12 para 8. Esta pasta é a fonte versionada; as skills instaladas no app (plugins da organização) precisam ser trocadas por estas pelo Gustavo, porque o Claude não edita os plugins instalados. Originais guardados em `~/Projetos/TradeHub/backups/reorganizacao-2026-11-21/skills-antes/`.

| Skill nova | Substitui | Quando dispara |
|---|---|---|
| `tradehub-figma` | tradehub-figma | Estrutura do arquivo, nomes e disposição de telas e fluxos, padrão de componentes e variáveis, checagens proporcionais |
| `tradehub-figma-visual` | tradehub-figma-admin-v2 | Como Admin e Editor devem parecer (cores, status, layout, componentes específicos) |
| `tradehub-figma-plugin` | tradehub-figma-plugin + o gotcha de fonte da tradehub-coachmark-progress | Qualquer script use_figma |
| `tradehub-componentes` (+ `references/`) | tradehub-selection-card, tradehub-timeline-getting-started, tradehub-coachmark-progress, tradehub-forms-regra-botao, tradehub-tabs-motion | Mexer em um desses componentes |
| `tradehub-temas` | tradehub-temas-editor | Temas, light/dark, paletas e ilustrações de tema |
| `tradehub-codigo` | tradehub-paridade-codigo-figma | Qualquer mudança no código: onde mora, paridade, remoção segura, validação, servidor e git |
| `tradehub-widgets` (+ `tradehub-widgets/references/anti-ai-look.md`) | traderhub-widget-design + traderhub-anti-ai-look | Widgets do aluno |
| `tradehub-textos` (nova) | — | Qualquer texto que o usuário vê, no Figma ou no código, e as notas do Figma |

Por que 8 e não 7: os textos ganharam uma skill própria (regra permanente contra texto com cara de IA), em vez de virar uma seção escondida dentro de outra.

## Como instalar
No app do Claude (Customize › Skills ou o plugin da organização onde estão as atuais), para cada linha da tabela: criar ou atualizar a skill com o conteúdo de `docs/skills/<nome>/` (SKILL.md e a pasta `references/` quando houver) e remover as skills substituídas. Conferir depois com `node scripts/maps/check-skill-paths.mjs` (todo caminho citado existe).

## Regras fixas do projeto (texto para o Gustavo colar nas instruções do projeto)
Substituir os trechos vencidos ("O Admin novo (95 telas) fica só no Figma"; "Variáveis em 3 coleções independentes (Terminal, Admin, Editor)") por:

> Figma: a referência oficial do Admin é a página `Screens · Admin` e a do Editor é `Screens · Editor` (arquivo XWHeEdjEiY6gWmrsg0vFIZ). Desde 21/11 o antigo "Admin v2" se chama só Admin; o Admin antigo foi excluído. Admin e Editor existem no Figma e no código (`_worktrees/admin-v2`) e precisam ficar em sincronia.
> Variáveis: duas coleções, Admin (Admin e Editor; um modo só, `Admin`) e Terminal (aluno, não se mexe). Fluxos seguem o padrão do Sales & payments (passos em colunas, estados b/c/d embaixo, Labels de aba/etapa, nota em toda tela).
> Toda tela e componente novo segue as skills `tradehub-figma` (nomes, disposição, notas), `tradehub-codigo` (onde mora, consumidores, validação) e `tradehub-textos` (texto natural e específico, sem cara de IA). Mapas em `docs/maps/` são atualizados por script quando telas, componentes ou variáveis mudam.
