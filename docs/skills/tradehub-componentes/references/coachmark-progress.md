
# Progresso do coachmark — decisão do Gustavo, 19/11

O progresso ao lado do título do coachmark é laranja, nunca branco.

- Figma: frames `Segment` em `Coachmark/Header/Progress`. Ativo e anteriores = `component/coachmark/progress/active` (laranja, vem de `component/progress/fill`). Demais = `component/coachmark/progress/inactive` (cinza, vem de `color/border/default`). Nunca usar `color/accent/default` (branco) nem `accent/strong` solto.
- Código (`tour.tsx`): `bg-a-coach-progress` e `bg-a-coach-progress-off`, tokens em `admin-tokens.css` (`--admin-component-coachmark-progress-*`).
- O Editor não tem coachmark próprio: o tour do editor vive nos frames Tour · Design editor do Admin.

Gotcha de fonte no plugin (Helvetica Neue): ver `tradehub-figma-plugin`.
