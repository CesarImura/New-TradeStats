# Mapa de tokens (Figma × código)

Gerado por `scripts/maps/tokens.mjs` em 2026-11-21, commit a87c21f5. Figma: arquivo XWHeEdjEiY6gWmrsg0vFIZ, exportado em 21/11/2026 (pasta `docs/maps/data`). Não editar à mão: atualizar os dados e rodar de novo.

Como ler: **medido** = contagem de ocorrências no código (`--admin-…` direto, utilitário Tailwind `bg-a-…`/`rounded-a-…` e alias dentro de `admin-tokens.css`) e lista de variáveis sem uso no Figma (varredura de nós ligados, inclusive aliases). **Inferido**: nada nesta tabela; status = combinação das duas medições.

Regras: coleção **Terminal não se mexe** (temas e widgets do aluno; 'sem uso no Figma' não é 'sem uso no código'). Editor usa a coleção **Admin** (sem terceira coleção). A coleção Admin tem um modo só, `Admin` (o modo Dark legado foi removido em 21/11/2026).

## Admin

320 variáveis no Figma. em uso: 204 · sem uso direto no código: 113 · sem uso no Figma: 1 · sem uso (Figma e código): 2.

Tokens só no código (não estão na coleção do Figma): nenhum.

| Figma | Código | Valor no código (modo Admin) | Tailwind | Usos diretos | Usos Tailwind | Aliases | Status |
|---|---|---|---|---|---|---|---|
| primitive/ink/950 | `--admin-primitive-ink-950` | `#0a0a0a` |  | 0 | 0 | 3 | em uso |
| primitive/ink/925 | `--admin-primitive-ink-925` | `#0d0d0d` |  | 0 | 0 | 3 | em uso |
| primitive/ink/900 | `--admin-primitive-ink-900` | `#111111` |  | 0 | 0 | 1 | em uso |
| primitive/ink/850 | `--admin-primitive-ink-850` | `#181818` |  | 0 | 0 | 1 | em uso |
| primitive/ink/750 | `--admin-primitive-ink-750` | `#262626` |  | 0 | 0 | 2 | em uso |
| primitive/white/02 | `--admin-primitive-white-02` | `rgb(255 255 255 / 2%)` |  | 0 | 0 | 1 | em uso |
| primitive/white/04 | `--admin-primitive-white-04` | `rgb(255 255 255 / 4%)` |  | 0 | 0 | 2 | em uso |
| primitive/white/06 | `--admin-primitive-white-06` | `rgb(255 255 255 / 6%)` |  | 0 | 0 | 1 | em uso |
| primitive/white/08 | `--admin-primitive-white-08` | `rgb(255 255 255 / 8%)` |  | 0 | 0 | 4 | em uso |
| primitive/white/14 | `--admin-primitive-white-14` | `rgb(255 255 255 / 14%)` |  | 0 | 0 | 3 | em uso |
| primitive/white/36 | `--admin-primitive-white-36` | `rgb(255 255 255 / 36%)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/white/52 | `--admin-primitive-white-52` | `rgb(255 255 255 / 52%)` |  | 0 | 0 | 2 | em uso |
| primitive/white/96 | `--admin-primitive-white-96` | `rgb(255 255 255 / 96%)` |  | 0 | 0 | 4 | em uso |
| primitive/orange/400 | `--admin-primitive-orange-400` | `#ff8a3d` |  | 0 | 0 | 1 | em uso |
| primitive/orange/500 | `--admin-primitive-orange-500` | `#ff5500` |  | 0 | 0 | 4 | em uso |
| primitive/orange/700 | `--admin-primitive-orange-700` | `#cf4500` |  | 0 | 0 | 3 | em uso |
| primitive/orange/800 | `--admin-primitive-orange-800` | `#b83d00` |  | 0 | 0 | 1 | em uso |
| primitive/orange/soft | `--admin-primitive-orange-soft` | `rgb(255 85 0 / 12%)` |  | 0 | 0 | 1 | em uso |
| primitive/green/400 | `--admin-primitive-green-400` | `#4ade80` |  | 0 | 0 | 1 | em uso |
| primitive/green/soft | `--admin-primitive-green-soft` | `rgb(74 222 128 / 12%)` |  | 0 | 0 | 1 | em uso |
| primitive/red/400 | `--admin-primitive-red-400` | `#f35a5a` |  | 0 | 0 | 1 | em uso |
| primitive/red/soft | `--admin-primitive-red-soft` | `rgb(243 90 90 / 12%)` |  | 0 | 0 | 1 | em uso |
| primitive/amber/400 | `--admin-primitive-amber-400` | `#fbbf24` |  | 0 | 0 | 2 | em uso |
| primitive/amber/soft | `--admin-primitive-amber-soft` | `rgb(251 191 36 / 12%)` |  | 0 | 0 | 1 | em uso |
| primitive/blue/400 | `--admin-primitive-blue-400` | `#60a5fa` |  | 0 | 0 | 1 | em uso |
| primitive/blue/soft | `--admin-primitive-blue-soft` | `rgb(96 165 250 / 12%)` |  | 0 | 0 | 1 | em uso |
| primitive/black/60 | `--admin-primitive-black-60` | `rgb(0 0 0 / 60%)` |  | 0 | 0 | 1 | em uso |
| primitive/white/100 | `--admin-primitive-white-100` | `#ffffff` |  | 0 | 0 | 4 | em uso |
| color/bg/page | `--admin-color-bg-page` | `var(--admin-primitive-ink-950)` | a-page | 5 | 39 | 0 | em uso |
| color/bg/panel | `--admin-color-bg-panel` | `var(--admin-primitive-ink-900)` | a-panel | 3 | 56 | 0 | em uso |
| color/bg/raised | `--admin-color-bg-raised` | `var(--admin-primitive-ink-850)` | a-raised | 6 | 41 | 0 | em uso |
| color/bg/sunk | `--admin-color-bg-sunk` | `var(--admin-primitive-ink-925)` | a-sunk | 1 | 4 | 0 | em uso |
| color/bg/field | `--admin-color-bg-field` | `var(--admin-primitive-white-04)` | a-field | 0 | 40 | 0 | em uso |
| color/bg/hover | `--admin-color-bg-hover` | `var(--admin-primitive-white-04)` | a-hover | 0 | 73 | 5 | em uso |
| color/bg/selected | `--admin-color-bg-selected` | `var(--admin-primitive-white-08)` | a-selected | 0 | 43 | 1 | em uso |
| color/bg/track | `--admin-color-bg-track` | `var(--admin-primitive-ink-750)` | a-track | 1 | 10 | 0 | em uso |
| color/bg/scrim | `--admin-color-bg-scrim` | `var(--admin-primitive-black-60)` | a-scrim | 1 | 17 | 0 | em uso |
| color/border/subtle | `--admin-color-border-subtle` | `var(--admin-primitive-white-09)` | a-border-subtle | 2 | 70 | 1 | em uso |
| color/border/default | `--admin-color-border-default` | `var(--admin-primitive-white-14)` | a-border | 15 | 190 | 3 | em uso |
| color/border/strong | `--admin-color-border-strong` | `var(--admin-primitive-white-22)` | a-border-strong | 1 | 81 | 2 | em uso |
| color/border/focus | `--admin-color-border-focus` | `var(--admin-primitive-white-96)` | a-border-focus | 3 | 148 | 0 | em uso |
| color/text/primary | `--admin-color-text-primary` | `var(--admin-primitive-white-96)` | a-text | 4 | 550 | 5 | em uso |
| color/text/secondary | `--admin-color-text-secondary` | `var(--admin-primitive-white-52)` | a-text-2 | 1 | 377 | 2 | em uso |
| color/text/tertiary | `--admin-color-text-tertiary` | `var(--admin-primitive-white-46)` | a-text-3 | 1 | 234 | 1 | em uso |
| color/text/on-accent | `--admin-color-text-on-accent` | `var(--admin-primitive-white-100)` | a-on-accent | 0 | 7 | 5 | em uso |
| color/text/accent | `--admin-color-text-accent` | `var(--admin-primitive-white-96)` | a-text-accent | 0 | 23 | 0 | em uso |
| color/accent/default | `--admin-color-accent-default` | `var(--admin-primitive-white-96)` | a-accent | 0 | 17 | 0 | em uso |
| color/accent/hover | `--admin-color-accent-hover` | `var(--admin-primitive-orange-800)` | a-accent-hover | 0 | 0 | 1 | em uso |
| color/accent/strong | `--admin-color-accent-strong` | `var(--admin-primitive-orange-500)` | a-accent-strong | 0 | 25 | 1 | em uso |
| color/accent/soft | `--admin-color-accent-soft` | `var(--admin-primitive-white-08)` | a-accent-soft | 3 | 12 | 0 | em uso |
| color/status/success | `--admin-color-status-success` | `var(--admin-primitive-green-400)` | a-success | 1 | 32 | 2 | em uso |
| color/status/success-soft | `--admin-color-status-success-soft` | `var(--admin-primitive-green-soft)` | a-success-soft | 0 | 7 | 0 | em uso |
| color/status/danger | `--admin-color-status-danger` | `var(--admin-primitive-red-400)` | a-danger | 0 | 39 | 3 | em uso |
| color/status/danger-soft | `--admin-color-status-danger-soft` | `var(--admin-primitive-red-soft)` | a-danger-soft | 1 | 9 | 1 | em uso |
| color/status/warning | `--admin-color-status-warning` | `var(--admin-primitive-amber-400)` | a-warning | 0 | 8 | 0 | em uso |
| color/status/warning-soft | `--admin-color-status-warning-soft` | `var(--admin-primitive-amber-soft)` | a-warning-soft | 0 | 4 | 0 | em uso |
| color/status/info | `--admin-color-status-info` | `var(--admin-primitive-blue-400)` | a-info | 0 | 2 | 0 | em uso |
| color/status/info-soft | `--admin-color-status-info-soft` | `var(--admin-primitive-blue-soft)` | a-info-soft | 0 | 2 | 0 | em uso |
| color/icon/default | `--admin-color-icon-default` | `var(--admin-primitive-white-52)` | a-icon | 0 | 26 | 0 | em uso |
| space/2 | `--admin-space-2` | `var(--admin-primitive-space-2)` |  | 0 | 0 | 0 | sem uso direto no código |
| space/4 | `--admin-space-4` | `var(--admin-primitive-space-4)` |  | 0 | 0 | 0 | sem uso direto no código |
| space/8 | `--admin-space-8` | `var(--admin-primitive-space-8)` |  | 0 | 0 | 0 | sem uso direto no código |
| space/12 | `--admin-space-12` | `var(--admin-primitive-space-12)` |  | 0 | 0 | 0 | sem uso direto no código |
| space/16 | `--admin-space-16` | `var(--admin-primitive-space-16)` |  | 0 | 0 | 1 | em uso |
| space/20 | `--admin-space-20` | `var(--admin-primitive-space-20)` |  | 0 | 0 | 0 | sem uso direto no código |
| space/24 | `--admin-space-24` | `var(--admin-primitive-space-24)` |  | 0 | 0 | 0 | sem uso direto no código |
| space/32 | `--admin-space-32` | `var(--admin-primitive-space-32)` |  | 0 | 0 | 0 | sem uso direto no código |
| space/48 | `--admin-space-48` | `var(--admin-primitive-space-48)` |  | 0 | 0 | 0 | sem uso direto no código |
| radius/xs | `--admin-radius-xs` | `var(--admin-primitive-radius-4)` | a-xs | 0 | 55 | 0 | em uso |
| radius/sm | `--admin-radius-sm` | `var(--admin-primitive-radius-6)` | a-sm | 0 | 69 | 1 | em uso |
| radius/md | `--admin-radius-md` | `var(--admin-primitive-radius-8)` | a-md | 0 | 123 | 1 | em uso |
| radius/lg | `--admin-radius-lg` | `var(--admin-primitive-radius-12)` | a-lg | 1 | 60 | 0 | em uso |
| radius/xl | `--admin-radius-xl` | `16px` | a-xl | 0 | 8 | 0 | em uso |
| radius/full | `--admin-radius-full` | `var(--admin-primitive-radius-999)` |  | 0 | 0 | 0 | sem uso direto no código |
| font/family/primary | `--admin-font-family-primary` | `"Helvetica Neue", Helvetica, var(--ff-inter), Arial, system-ui, sans-serif` | a-sans | 6 | 1 | 0 | em uso |
| primitive/red/40 | `--admin-primitive-red-40` | `rgb(243 90 90 / 40%)` |  | 0 | 0 | 1 | em uso |
| color/border/danger | `--admin-color-border-danger` | `var(--admin-primitive-red-40)` | a-border-danger | 0 | 10 | 1 | em uso |
| color/border/active | `--admin-color-border-active` | `var(--admin-primitive-white-64)` | a-border-active | 5 | 27 | 0 | em uso |
| color/control/on | `--admin-color-control-on` | `var(--admin-primitive-orange-700)` |  | 18 | 0 | 2 | em uso |
| color/control/off | `--admin-color-control-off` | `var(--admin-primitive-ink-750)` |  | 0 | 0 | 0 | sem uso direto no código |
| color/control/knob | `--admin-color-control-knob` | `var(--admin-primitive-white-100)` |  | 0 | 0 | 1 | em uso |
| color/control/mark | `--admin-color-control-mark` | `var(--admin-color-text-on-accent)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/white/64 | `--admin-primitive-white-64` | `rgb(255 255 255 / 64%)` |  | 0 | 0 | 2 | em uso |
| color/text/nav | `--admin-color-text-nav` | `var(--admin-primitive-white-64)` | a-text-nav | 0 | 6 | 0 | em uso |
| color/bg/subtle | `--admin-color-bg-subtle` | `var(--admin-primitive-white-02)` | a-subtle | 0 | 15 | 0 | em uso |
| color/bg/muted | `--admin-color-bg-muted` | `var(--admin-primitive-white-06)` | a-muted | 0 | 24 | 2 | em uso |
| primitive/white/09 | `--admin-primitive-white-09` | `rgb(255 255 255 / 9%)` |  | 0 | 0 | 2 | em uso |
| color/chart/grid | `--admin-color-chart-grid` | `var(--admin-primitive-white-09)` |  | 2 | 0 | 0 | em uso |
| color/highlight/base | `--admin-color-highlight-base` | `#f6d9c6` |  | 2 | 0 | 0 | em uso |
| color/highlight/soft | `--admin-color-highlight-soft` | `#ffe0c2` |  | 0 | 0 | 1 | em uso |
| color/highlight/strong | `--admin-color-highlight-strong` | `#ff9e61` |  | 0 | 0 | 0 | sem uso direto no código |
| color/text/on-highlight | `--admin-color-text-on-highlight` | `#0a0a0a` | a-on-highlight | 0 | 10 | 2 | em uso |
| color/icon/subtle | `--admin-color-icon-subtle` | `rgb(255 255 255 / 36%)` | a-icon-subtle | 0 | 2 | 0 | em uso |
| color/category/blue | `--admin-color-category-blue` | `#1d2f3f` |  | 0 | 0 | 0 | sem uso direto no código |
| color/category/green | `--admin-color-category-green` | `#1d3f2a` |  | 0 | 0 | 0 | sem uso direto no código |
| color/category/orange | `--admin-color-category-orange` | `#3f2a1d` |  | 0 | 0 | 0 | sem uso direto no código |
| color/category/violet | `--admin-color-category-violet` | `#2a1d3f` |  | 0 | 0 | 0 | sem uso direto no código |
| color/category/rose | `--admin-color-category-rose` | `#3f1d27` |  | 0 | 0 | 0 | sem uso direto no código |
| color/category/olive | `--admin-color-category-olive` | `#3a3a1d` |  | 0 | 0 | 0 | sem uso direto no código |
| component/button/primary/bg/default | `--admin-component-button-primary-bg-default` | `var(--admin-primitive-orange-700)` |  | 3 | 0 | 0 | em uso |
| component/button/primary/bg/hover | `--admin-component-button-primary-bg-hover` | `var(--admin-color-accent-hover)` |  | 3 | 0 | 0 | em uso |
| component/button/primary/content | `--admin-component-button-primary-content` | `var(--admin-color-text-on-accent)` |  | 3 | 0 | 0 | em uso |
| component/button/secondary/bg/hover | `--admin-component-button-secondary-bg-hover` | `var(--admin-color-bg-hover)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/button/secondary/border | `--admin-component-button-secondary-border` | `var(--admin-color-border-strong)` |  | 2 | 0 | 0 | em uso |
| component/button/secondary/content | `--admin-component-button-secondary-content` | `var(--admin-color-text-primary)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/button/ghost/bg/hover | `--admin-component-button-ghost-bg-hover` | `var(--admin-color-bg-hover)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/button/ghost/content/default | `--admin-component-button-ghost-content-default` | `var(--admin-color-text-secondary)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/button/ghost/content/hover | `--admin-component-button-ghost-content-hover` | `var(--admin-color-text-primary)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/button/danger/bg/hover | `--admin-component-button-danger-bg-hover` | `var(--admin-color-status-danger-soft)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/button/danger/border | `--admin-component-button-danger-border` | `var(--admin-color-border-danger)` |  | 1 | 0 | 0 | em uso |
| component/button/danger/content | `--admin-component-button-danger-content` | `var(--admin-color-status-danger)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/button/radius | `--admin-component-button-radius` | `var(--admin-radius-md)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/button/pad-x/xl | `--admin-component-button-pad-x-xl` | `var(--admin-space-14)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/button/pad-x/md | `--admin-component-button-pad-x-md` | `var(--admin-space-10)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/button/gap | `--admin-component-button-gap` | `var(--admin-space-6)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/button/icon/default | `--admin-component-button-icon-default` | `var(--admin-space-16)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/button/icon/small | `--admin-component-button-icon-small` | `14px` |  | 0 | 0 | 0 | sem uso direto no código |
| component/button/pad-x/sm | `--admin-component-button-pad-x-sm` | `8px` |  | 0 | 0 | 0 | sem uso direto no código |
| component/button/pad-x/lg | `--admin-component-button-pad-x-lg` | `12px` |  | 0 | 0 | 0 | sem uso direto no código |
| component/button/pad-y/sm | `--admin-component-button-pad-y-sm` | `4px` |  | 0 | 0 | 0 | sem uso direto no código |
| component/button/pad-y/md | `--admin-component-button-pad-y-md` | `6px` |  | 0 | 0 | 0 | sem uso direto no código |
| component/button/pad-y/lg | `--admin-component-button-pad-y-lg` | `7px` |  | 0 | 0 | 0 | sem uso direto no código |
| component/button/pad-y/xl | `--admin-component-button-pad-y-xl` | `9px` |  | 0 | 0 | 0 | sem uso direto no código |
| component/button/pad-icon/sm | `--admin-component-button-pad-icon-sm` | `5px` |  | 0 | 0 | 0 | sem uso direto no código |
| component/button/pad-icon/md | `--admin-component-button-pad-icon-md` | `6px` |  | 0 | 0 | 0 | sem uso direto no código |
| component/button/pad-icon/lg | `--admin-component-button-pad-icon-lg` | `8px` |  | 0 | 0 | 0 | sem uso direto no código |
| component/button/pad-icon/xl | `--admin-component-button-pad-icon-xl` | `10px` |  | 0 | 0 | 0 | sem uso direto no código |
| component/button/radius-sm | `--admin-component-button-radius-sm` | `var(--admin-radius-sm)` |  | 0 | 0 | 0 | sem uso direto no código |
| color/chart/divider | `--admin-color-chart-divider` | `rgb(255 255 255 / 16%)` |  | 0 | 0 | 0 | sem uso direto no código |
| color/chart/bar-muted | `--admin-color-chart-bar-muted` | `rgb(255 255 255 / 60%)` |  | 0 | 0 | 0 | sem uso direto no código |
| color/chart/line-muted | `--admin-color-chart-line-muted` | `rgb(255 255 255 / 25%)` |  | 0 | 0 | 0 | sem uso direto no código |
| color/brand/gradient-start | `--admin-color-brand-gradient-start` | `#ff4701` |  | 5 | 0 | 0 | em uso |
| color/brand/gradient-end | `--admin-color-brand-gradient-end` | `#ff9003` |  | 5 | 0 | 0 | em uso |
| component/nav/indicator | `--admin-component-nav-indicator` | `var(--admin-primitive-orange-500)` |  | 1 | 0 | 0 | em uso |
| primitive/space/2 | `--admin-primitive-space-2` | `2px` |  | 0 | 0 | 1 | em uso |
| primitive/space/4 | `--admin-primitive-space-4` | `4px` |  | 0 | 0 | 1 | em uso |
| primitive/space/8 | `--admin-primitive-space-8` | `8px` |  | 0 | 0 | 1 | em uso |
| primitive/space/12 | `--admin-primitive-space-12` | `12px` |  | 0 | 0 | 1 | em uso |
| primitive/space/16 | `--admin-primitive-space-16` | `16px` |  | 0 | 0 | 1 | em uso |
| primitive/space/20 | `--admin-primitive-space-20` | `20px` |  | 0 | 0 | 1 | em uso |
| primitive/space/24 | `--admin-primitive-space-24` | `24px` |  | 0 | 0 | 1 | em uso |
| primitive/space/32 | `--admin-primitive-space-32` | `32px` |  | 0 | 0 | 1 | em uso |
| primitive/space/48 | `--admin-primitive-space-48` | `48px` |  | 0 | 0 | 1 | em uso |
| primitive/radius/4 | `--admin-primitive-radius-4` | `4px` |  | 0 | 0 | 1 | em uso |
| primitive/radius/6 | `--admin-primitive-radius-6` | `6px` |  | 0 | 0 | 1 | em uso |
| primitive/radius/8 | `--admin-primitive-radius-8` | `8px` |  | 0 | 0 | 1 | em uso |
| primitive/radius/12 | `--admin-primitive-radius-12` | `12px` |  | 0 | 0 | 1 | em uso |
| primitive/radius/999 | `--admin-primitive-radius-999` | `999px` |  | 0 | 0 | 1 | em uso |
| radius/2xs | `--admin-radius-2xs` | `var(--admin-primitive-radius-2)` | a-2xs | 0 | 4 | 0 | em uso |
| primitive/radius/2 | `--admin-primitive-radius-2` | `2px` |  | 0 | 0 | 1 | em uso |
| space/6 | `--admin-space-6` | `var(--admin-primitive-space-6)` |  | 0 | 0 | 1 | em uso |
| primitive/space/6 | `--admin-primitive-space-6` | `6px` |  | 0 | 0 | 1 | em uso |
| space/10 | `--admin-space-10` | `var(--admin-primitive-space-10)` |  | 0 | 0 | 1 | em uso |
| primitive/space/10 | `--admin-primitive-space-10` | `10px` |  | 0 | 0 | 1 | em uso |
| space/14 | `--admin-space-14` | `var(--admin-primitive-space-14)` |  | 0 | 0 | 1 | em uso |
| primitive/space/14 | `--admin-primitive-space-14` | `14px` |  | 0 | 0 | 1 | em uso |
| space/18 | `--admin-space-18` | `var(--admin-primitive-space-18)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/space/18 | `--admin-primitive-space-18` | `18px` |  | 0 | 0 | 1 | em uso |
| space/28 | `--admin-space-28` | `var(--admin-primitive-space-28)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/space/28 | `--admin-primitive-space-28` | `28px` |  | 0 | 0 | 1 | em uso |
| space/40 | `--admin-space-40` | `var(--admin-primitive-space-40)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/space/40 | `--admin-primitive-space-40` | `40px` |  | 0 | 0 | 1 | em uso |
| space/72 | `--admin-space-72` | `var(--admin-primitive-space-72)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/space/72 | `--admin-primitive-space-72` | `72px` |  | 0 | 0 | 1 | em uso |
| primitive/extra/2a1a10 | `--admin-primitive-extra-2a1a10` | `#2a1a10` |  | 0 | 0 | 1 | em uso |
| component/lesson-card/thumb/stop-1 | `--admin-component-lesson-card-thumb-stop-1` | `var(--admin-primitive-extra-2a1a10)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/extra/121212 | `--admin-primitive-extra-121212` | `#121212` |  | 0 | 0 | 1 | em uso |
| component/lesson-card/thumb/stop-2 | `--admin-component-lesson-card-thumb-stop-2` | `var(--admin-primitive-extra-121212)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/extra/101014 | `--admin-primitive-extra-101014` | `#101014` |  | 0 | 0 | 1 | em uso |
| component/course-cover/bg | `--admin-component-course-cover-bg` | `var(--admin-primitive-extra-101014)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/extra/f97316-55 | `--admin-primitive-extra-f97316-55` | `rgb(249 115 22 / 55%)` |  | 0 | 0 | 1 | em uso |
| component/course-cover/foundations/glow | `--admin-component-course-cover-foundations-glow` | `var(--admin-primitive-extra-f97316-55)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/extra/0a0a0d | `--admin-primitive-extra-0a0a0d` | `#0a0a0d` |  | 0 | 0 | 1 | em uso |
| component/course-cover/glow-end | `--admin-component-course-cover-glow-end` | `var(--admin-primitive-extra-0a0a0d)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/extra/ffffff-7 | `--admin-primitive-extra-ffffff-7` | `rgb(255 255 255 / 7%)` |  | 0 | 0 | 1 | em uso |
| component/course-cover/overlay | `--admin-component-course-cover-overlay` | `var(--admin-primitive-extra-ffffff-7)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/extra/0a0a0d-90 | `--admin-primitive-extra-0a0a0d-90` | `rgb(10 10 13 / 90%)` |  | 0 | 0 | 1 | em uso |
| component/course-cover/fade-start | `--admin-component-course-cover-fade-start` | `var(--admin-primitive-extra-0a0a0d-90)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/extra/0a0a0d-0 | `--admin-primitive-extra-0a0a0d-0` | `rgb(10 10 13 / 0%)` |  | 0 | 0 | 1 | em uso |
| component/course-cover/fade-end | `--admin-component-course-cover-fade-end` | `var(--admin-primitive-extra-0a0a0d-0)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/extra/f97316 | `--admin-primitive-extra-f97316` | `#f97316` |  | 0 | 0 | 1 | em uso |
| component/course-cover/foundations/accent | `--admin-component-course-cover-foundations-accent` | `var(--admin-primitive-extra-f97316)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/extra/ffffff-70 | `--admin-primitive-extra-ffffff-70` | `rgb(255 255 255 / 70%)` |  | 0 | 0 | 2 | em uso |
| component/course-cover/subtitle | `--admin-component-course-cover-subtitle` | `var(--admin-primitive-extra-ffffff-70)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/extra/0ea5e9-55 | `--admin-primitive-extra-0ea5e9-55` | `rgb(14 165 233 / 55%)` |  | 0 | 0 | 1 | em uso |
| component/course-cover/playbook/glow | `--admin-component-course-cover-playbook-glow` | `var(--admin-primitive-extra-0ea5e9-55)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/extra/0ea5e9 | `--admin-primitive-extra-0ea5e9` | `#0ea5e9` |  | 0 | 0 | 1 | em uso |
| component/course-cover/playbook/accent | `--admin-component-course-cover-playbook-accent` | `var(--admin-primitive-extra-0ea5e9)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/extra/8b5cf6-55 | `--admin-primitive-extra-8b5cf6-55` | `rgb(139 92 246 / 55%)` |  | 0 | 0 | 1 | em uso |
| component/course-cover/psychology/glow | `--admin-component-course-cover-psychology-glow` | `var(--admin-primitive-extra-8b5cf6-55)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/extra/8b5cf6 | `--admin-primitive-extra-8b5cf6` | `#8b5cf6` |  | 0 | 0 | 1 | em uso |
| component/course-cover/psychology/accent | `--admin-component-course-cover-psychology-accent` | `var(--admin-primitive-extra-8b5cf6)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/extra/e11d48-55 | `--admin-primitive-extra-e11d48-55` | `rgb(225 29 72 / 55%)` |  | 0 | 0 | 1 | em uso |
| component/course-cover/risk-lab/glow | `--admin-component-course-cover-risk-lab-glow` | `var(--admin-primitive-extra-e11d48-55)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/extra/e11d48 | `--admin-primitive-extra-e11d48` | `#e11d48` |  | 0 | 0 | 1 | em uso |
| component/course-cover/risk-lab/accent | `--admin-component-course-cover-risk-lab-accent` | `var(--admin-primitive-extra-e11d48)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/extra/d9d9d9 | `--admin-primitive-extra-d9d9d9` | `#d9d9d9` |  | 0 | 0 | 1 | em uso |
| component/chart-preview/placeholder | `--admin-component-chart-preview-placeholder` | `var(--admin-primitive-extra-d9d9d9)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/extra/ff5500-35 | `--admin-primitive-extra-ff5500-35` | `rgb(255 85 0 / 35%)` |  | 0 | 0 | 1 | em uso |
| component/content/note-highlight | `--admin-component-content-note-highlight` | `var(--admin-primitive-extra-ff5500-35)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/content/swatch/green | `--admin-component-content-swatch-green` | `var(--admin-primitive-green-600)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/extra/3b82f6 | `--admin-primitive-extra-3b82f6` | `#3b82f6` |  | 0 | 0 | 2 | em uso |
| component/content/swatch/blue | `--admin-component-content-swatch-blue` | `var(--admin-primitive-extra-3b82f6)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/extra/a855f7 | `--admin-primitive-extra-a855f7` | `#a855f7` |  | 0 | 0 | 1 | em uso |
| component/content/swatch/purple | `--admin-component-content-swatch-purple` | `var(--admin-primitive-extra-a855f7)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/extra/f4f4f5 | `--admin-primitive-extra-f4f4f5` | `#f4f4f5` |  | 0 | 0 | 2 | em uso |
| component/content/swatch/white | `--admin-component-content-swatch-white` | `var(--admin-primitive-extra-f4f4f5)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/extra/444444 | `--admin-primitive-extra-444444` | `#444444` |  | 0 | 0 | 1 | em uso |
| component/docs/section-bg | `--admin-component-docs-section-bg` | `var(--admin-primitive-extra-444444)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/extra/ffffff-10 | `--admin-primitive-extra-ffffff-10` | `rgb(255 255 255 / 10%)` |  | 0 | 0 | 1 | em uso |
| component/docs/section-border | `--admin-component-docs-section-border` | `var(--admin-primitive-extra-ffffff-10)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/radius/10 | `--admin-primitive-radius-10` | `10px` |  | 0 | 0 | 1 | em uso |
| radius/10 | `--admin-radius-10` | `var(--admin-primitive-radius-10)` | a-10 | 0 | 17 | 0 | em uso |
| component/button/highlight/bg/default | `--admin-component-button-highlight-bg-default` | `var(--admin-color-control-knob)` |  | 1 | 0 | 0 | em uso |
| component/button/highlight/bg/hover | `--admin-component-button-highlight-bg-hover` | `var(--admin-color-highlight-soft)` |  | 1 | 0 | 0 | em uso |
| component/button/highlight/content | `--admin-component-button-highlight-content` | `var(--admin-color-text-on-highlight)` |  | 1 | 0 | 0 | em uso |
| component/progress-item/title | `--admin-component-progress-item-title` | `var(--admin-color-text-primary)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/progress-item/value/default | `--admin-component-progress-item-value-default` | `var(--admin-color-text-secondary)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/progress-item/value/success | `--admin-component-progress-item-value-success` | `var(--admin-color-status-success)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/progress-item/value/danger | `--admin-component-progress-item-value-danger` | `var(--admin-color-status-danger)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/red/600 | `--admin-primitive-red-600` | `#dc2626` |  | 0 | 0 | 1 | em uso |
| component/step-indicator/error/bg | `--admin-component-step-indicator-error-bg` | `var(--admin-color-status-danger-fill)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/step-indicator/error/content | `--admin-component-step-indicator-error-content` | `var(--admin-color-text-on-accent)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/step-indicator/warning/bg | `--admin-component-step-indicator-warning-bg` | `var(--admin-color-status-warning-fill)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/step-indicator/warning/content | `--admin-component-step-indicator-warning-content` | `var(--admin-color-text-on-highlight)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/green/600 | `--admin-primitive-green-600` | `#16a34a` |  | 0 | 0 | 2 | em uso |
| component/step-indicator/success/bg | `--admin-component-step-indicator-success-bg` | `var(--admin-color-status-success-fill)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/step-indicator/success/content | `--admin-component-step-indicator-success-content` | `var(--admin-color-text-on-accent)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/sortable-row/bg/hover | `--admin-component-sortable-row-bg-hover` | `var(--admin-color-bg-hover)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/sortable-row/bg/active | `--admin-component-sortable-row-bg-active` | `var(--admin-color-bg-muted)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/sortable-row/bg/dragging | `--admin-component-sortable-row-bg-dragging` | `var(--admin-color-bg-selected)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/sortable-row/border/active | `--admin-component-sortable-row-border-active` | `var(--admin-color-control-on)` |  | 2 | 0 | 0 | em uso |
| component/chart-bar/bg/default | `--admin-component-chart-bar-bg-default` | `var(--admin-primitive-extra-c2561c)` | a-bar | 6 | 2 | 0 | em uso |
| component/chart-bar/bg/active | `--admin-component-chart-bar-bg-active` | `var(--admin-primitive-orange-400)` | a-bar-active | 1 | 0 | 0 | em uso |
| component/chart-bar/bg/danger | `--admin-component-chart-bar-bg-danger` | `var(--admin-color-status-danger-fill)` |  | 0 | 0 | 0 | sem uso direto no código |
| color/status/danger-fill | `--admin-color-status-danger-fill` | `var(--admin-primitive-red-600)` | a-danger-fill | 0 | 10 | 3 | em uso |
| color/status/success-fill | `--admin-color-status-success-fill` | `var(--admin-primitive-green-600)` | a-success-fill | 0 | 12 | 1 | em uso |
| color/status/warning-fill | `--admin-color-status-warning-fill` | `var(--admin-primitive-amber-400)` | a-warning-fill | 0 | 5 | 3 | em uso |
| color/status/info-fill | `--admin-color-status-info-fill` | `var(--admin-primitive-extra-3b82f6)` | a-info-fill | 0 | 1 | 0 | sem uso no Figma |
| component/tab/dot | `--admin-component-tab-dot` | `var(--admin-color-status-warning-fill)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/file-item/border | `--admin-component-file-item-border` | `var(--admin-color-border-subtle)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/file-item/meta/default | `--admin-component-file-item-meta-default` | `var(--admin-color-text-tertiary)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/file-item/meta/success | `--admin-component-file-item-meta-success` | `var(--admin-color-status-success)` |  | 0 | 0 | 0 | sem uso (Figma e código) |
| component/file-item/meta/danger | `--admin-component-file-item-meta-danger` | `var(--admin-color-status-danger)` |  | 0 | 0 | 0 | sem uso (Figma e código) |
| primitive/extra/757575 | `--admin-primitive-extra-757575` | `#757575` |  | 0 | 0 | 1 | em uso |
| component/logo/wordmark/on-dark | `--admin-component-logo-wordmark-on-dark` | `var(--admin-primitive-white-100)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/logo/wordmark/on-light | `--admin-component-logo-wordmark-on-light` | `var(--admin-primitive-ink-950)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/logo/mono/white | `--admin-component-logo-mono-white` | `var(--admin-primitive-white-100)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/logo/mono/gray | `--admin-component-logo-mono-gray` | `var(--admin-primitive-extra-757575)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/logo/mono/black | `--admin-component-logo-mono-black` | `var(--admin-primitive-ink-950)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/extra/2b2b2e | `--admin-primitive-extra-2b2b2e` | `#2b2b2e` |  | 0 | 0 | 1 | em uso |
| component/editor/canvas | `--admin-component-editor-canvas` | `var(--admin-primitive-extra-2b2b2e)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/extra/09090b | `--admin-primitive-extra-09090b` | `#09090b` |  | 0 | 0 | 1 | em uso |
| component/editor/preview/sidebar | `--admin-component-editor-preview-sidebar` | `var(--admin-primitive-extra-09090b)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/editor/preview/nav-label | `--admin-component-editor-preview-nav-label` | `var(--admin-primitive-extra-f4f4f5)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/extra/a8a8b1 | `--admin-primitive-extra-a8a8b1` | `#a8a8b1` |  | 0 | 0 | 1 | em uso |
| component/editor/preview/nav-label-muted | `--admin-component-editor-preview-nav-label-muted` | `var(--admin-primitive-extra-a8a8b1)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/editor/look-art/preview-bg-1 | `--admin-component-editor-look-art-preview-bg-1` | `var(--admin-primitive-ink-925)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/extra/1c1c1d | `--admin-primitive-extra-1c1c1d` | `#1c1c1d` |  | 0 | 0 | 1 | em uso |
| component/editor/look-art/card | `--admin-component-editor-look-art-card` | `var(--admin-primitive-extra-1c1c1d)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/extra/38383b | `--admin-primitive-extra-38383b` | `#38383b` |  | 0 | 0 | 1 | em uso |
| component/editor/look-art/card-raised | `--admin-component-editor-look-art-card-raised` | `var(--admin-primitive-extra-38383b)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/extra/808085 | `--admin-primitive-extra-808085` | `#808085` |  | 0 | 0 | 1 | em uso |
| component/editor/look-art/bar | `--admin-component-editor-look-art-bar` | `var(--admin-primitive-extra-808085)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/extra/050505 | `--admin-primitive-extra-050505` | `#050505` |  | 0 | 0 | 1 | em uso |
| component/editor/look-art/thumb | `--admin-component-editor-look-art-thumb` | `var(--admin-primitive-extra-050505)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/extra/d9d9dc | `--admin-primitive-extra-d9d9dc` | `#d9d9dc` |  | 0 | 0 | 1 | em uso |
| component/editor/look-art/thumb-icon | `--admin-component-editor-look-art-thumb-icon` | `var(--admin-primitive-extra-d9d9dc)` |  | 0 | 0 | 0 | sem uso direto no código |
| primitive/extra/6b6b72 | `--admin-primitive-extra-6b6b72` | `#6b6b72` |  | 0 | 0 | 1 | em uso |
| component/editor/look-art/thumb-icon-muted | `--admin-component-editor-look-art-thumb-icon-muted` | `var(--admin-primitive-extra-6b6b72)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/swatch/ring-active | `--admin-component-swatch-ring-active` | `var(--admin-color-text-primary)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/editor/canvas-dot | `--admin-component-editor-canvas-dot` | `var(--admin-primitive-white-08)` |  | 2 | 0 | 0 | em uso |
| component/sortable-row/border/default | `--admin-component-sortable-row-border-default` | `var(--admin-color-border-default)` |  | 2 | 0 | 0 | em uso |
| primitive/white/46 | `--admin-primitive-white-46` | `rgb(255 255 255 / 46%)` |  | 0 | 0 | 1 | em uso |
| primitive/white/22 | `--admin-primitive-white-22` | `rgb(255 255 255 / 22%)` |  | 0 | 0 | 2 | em uso |
| color/bg/sidebar | `--admin-color-bg-sidebar` | `var(--admin-primitive-ink-925)` |  | 1 | 0 | 0 | em uso |
| primitive/extra/c2561c | `--admin-primitive-extra-c2561c` | `#c2561c` |  | 0 | 0 | 2 | em uso |
| primitive/extra/c2561c-30 | `--admin-primitive-extra-c2561c-30` | `rgb(194 86 28 / 30%)` |  | 0 | 0 | 1 | em uso |
| component/chart-bar/bg/dim | `--admin-component-chart-bar-bg-dim` | `var(--admin-primitive-extra-c2561c-30)` | a-bar-dim | 3 | 0 | 0 | em uso |
| component/table-row/bg/hover | `--admin-component-table-row-bg-hover` | `var(--admin-color-bg-hover)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/table-row/bg/active | `--admin-component-table-row-bg-active` | `var(--admin-color-bg-muted)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/checkbox/bg/on | `--admin-component-checkbox-bg-on` | `var(--admin-primitive-orange-700)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/progress/fill | `--admin-component-progress-fill` | `var(--admin-primitive-extra-c2561c)` | a-progress | 2 | 2 | 1 | em uso |
| component/progress/track | `--admin-component-progress-track` | `var(--admin-primitive-white-14)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/progress-item/bar/fill | `--admin-component-progress-item-bar-fill` | `var(--admin-color-status-warning-fill)` |  | 1 | 0 | 0 | em uso |
| primitive/extra/88b137 | `--admin-primitive-extra-88b137` | `#88b137` |  | 0 | 0 | 1 | em uso |
| component/progress-item/bar/mid | `--admin-component-progress-item-bar-mid` | `var(--admin-primitive-extra-88b137)` |  | 1 | 0 | 0 | em uso |
| component/file-icon/bar/pdf | `--admin-component-file-icon-bar-pdf` | `var(--admin-color-status-danger-fill)` |  | 1 | 0 | 0 | em uso |
| component/file-icon/bar/doc | `--admin-component-file-icon-bar-doc` | `var(--admin-primitive-extra-2563eb)` |  | 1 | 0 | 0 | em uso |
| component/file-icon/bar/sheet | `--admin-component-file-icon-bar-sheet` | `var(--admin-primitive-extra-15803d)` |  | 1 | 0 | 0 | em uso |
| component/file-icon/bar/media | `--admin-component-file-icon-bar-media` | `var(--admin-primitive-extra-a16207)` |  | 1 | 0 | 0 | em uso |
| component/file-icon/bar/other | `--admin-component-file-icon-bar-other` | `var(--admin-primitive-extra-5f5f66)` |  | 1 | 0 | 0 | em uso |
| component/file-icon/label | `--admin-component-file-icon-label` | `var(--admin-color-text-on-accent)` |  | 1 | 0 | 0 | em uso |
| component/step-indicator/upcoming/bg | `--admin-component-step-indicator-upcoming-bg` | `var(--admin-primitive-white-14)` |  | 1 | 0 | 0 | em uso |
| component/step-indicator/upcoming/border | `--admin-component-step-indicator-upcoming-border` | `var(--admin-primitive-white-22)` |  | 1 | 0 | 0 | em uso |
| component/step-indicator/upcoming/content | `--admin-component-step-indicator-upcoming-content` | `var(--admin-color-text-primary)` |  | 0 | 0 | 0 | sem uso direto no código |
| component/choice-chip/bg/active | `--admin-component-choice-chip-bg-active` | `var(--admin-primitive-orange-soft)` |  | 2 | 0 | 0 | em uso |
| component/choice-chip/border/active | `--admin-component-choice-chip-border-active` | `var(--admin-primitive-orange-500)` |  | 2 | 0 | 0 | em uso |
| component/choice-chip/border/hover | `--admin-component-choice-chip-border-hover` | `var(--admin-color-border-strong)` |  | 1 | 0 | 0 | em uso |
| component/button/text/content/hover | `--admin-component-button-text-content-hover` | `var(--admin-primitive-orange-500)` |  | 3 | 0 | 0 | em uso |
| primitive/extra/4ade80-40 | `--admin-primitive-extra-4ade80-40` | `rgb(74 222 128 / 40%)` |  | 0 | 0 | 1 | em uso |
| primitive/extra/4ade80-4 | `--admin-primitive-extra-4ade80-4` | `rgb(74 222 128 / 4%)` |  | 0 | 0 | 1 | em uso |
| component/timeline-step/border/done | `--admin-component-timeline-step-border-done` | `var(--admin-primitive-extra-4ade80-40)` |  | 1 | 0 | 0 | em uso |
| component/timeline-step/bg/done | `--admin-component-timeline-step-bg-done` | `var(--admin-primitive-extra-4ade80-4)` |  | 2 | 0 | 0 | em uso |
| component/selection-card/border/default | `--admin-component-selection-card-border-default` | `var(--admin-primitive-white-08)` |  | 1 | 0 | 0 | em uso |
| component/selection-card/border/hover | `--admin-component-selection-card-border-hover` | `var(--admin-primitive-extra-ffffff-40)` |  | 1 | 0 | 0 | em uso |
| component/selection-card/border/active | `--admin-component-selection-card-border-active` | `var(--admin-color-control-on)` |  | 1 | 0 | 0 | em uso |
| component/selection-card/bg/hover | `--admin-component-selection-card-bg-hover` | `var(--admin-color-bg-hover)` |  | 2 | 0 | 0 | em uso |
| component/selection-card/radio/default | `--admin-component-selection-card-radio-default` | `var(--admin-color-border-default)` |  | 1 | 0 | 0 | em uso |
| component/selection-card/radio/hover | `--admin-component-selection-card-radio-hover` | `var(--admin-primitive-extra-ffffff-70)` |  | 1 | 0 | 0 | em uso |
| component/selection-card/radio/active | `--admin-component-selection-card-radio-active` | `var(--admin-color-accent-strong)` |  | 2 | 0 | 0 | em uso |
| primitive/extra/ffffff-40 | `--admin-primitive-extra-ffffff-40` | `rgb(255 255 255 / 40%)` |  | 0 | 0 | 1 | em uso |
| component/coachmark/progress/active | `--admin-component-coachmark-progress-active` | `var(--admin-component-progress-fill)` | a-coach-progress | 0 | 1 | 0 | em uso |
| component/coachmark/progress/inactive | `--admin-component-coachmark-progress-inactive` | `var(--admin-color-border-default)` | a-coach-progress-off | 0 | 1 | 0 | em uso |
| component/file-icon/page-stroke | `--admin-component-file-icon-page-stroke` | `var(--admin-primitive-extra-4a4a4f)` |  | 1 | 0 | 0 | em uso |
| primitive/extra/2563eb | `--admin-primitive-extra-2563eb` | `#2563eb` |  | 0 | 0 | 1 | em uso |
| primitive/extra/15803d | `--admin-primitive-extra-15803d` | `#15803d` |  | 0 | 0 | 1 | em uso |
| primitive/extra/a16207 | `--admin-primitive-extra-a16207` | `#a16207` |  | 0 | 0 | 1 | em uso |
| primitive/extra/5f5f66 | `--admin-primitive-extra-5f5f66` | `#5f5f66` |  | 0 | 0 | 1 | em uso |
| primitive/extra/4a4a4f | `--admin-primitive-extra-4a4a4f` | `#4a4a4f` |  | 0 | 0 | 1 | em uso |

## Terminal

216 variáveis no Figma (modos Dark, Light, Atelier, Pulse; valor abaixo = Dark). em uso: 14 · sem uso no Figma: 4 · sem uso direto no código: 127 · sem uso (Figma e código): 71.

| Figma | Code syntax | Tipo | Valor ou alias (Dark) | Usos no código | Status |
|---|---|---|---|---|---|
| color/surface/page | `--background` | C | →primitive/gray/950 | 25 | em uso |
| color/surface/card | `--card` | C | →primitive/gray/900 | 39 | em uso |
| color/surface/muted | `--muted` | C | →primitive/gray/800 | 30 | em uso |
| color/surface/sidebar | `--sidebar` | C | →primitive/gray/950 | 10 | sem uso no Figma |
| color/text/primary | `--foreground` | C | →primitive/white/100 | 105 | em uso |
| color/text/muted | `--muted-foreground` | C | →primitive/white/56 | 29 | em uso |
| color/text/on-brand | `--on-brand` | C | →primitive/white/100 | 16 | em uso |
| color/border/default | `--border` | C | →primitive/white/11 | 37 | em uso |
| color/brand/primary | `--primary` | C | →primitive/orange/700 | 46 | em uso |
| color/brand/highlight | `--highlight` | C | →primitive/yellow/300 | 8 | sem uso no Figma |
| color/brand/highlight-text | `--highlight-foreground` | C | →primitive/gray/950 | 5 | sem uso no Figma |
| color/trade/profit | `--profit` | C | →primitive/green/500 | 21 | em uso |
| color/trade/loss | `--loss` | C | →primitive/red/500 | 35 | em uso |
| color/surface/canvas | `--surface-canvas` | C | →primitive/canvas | 0 | sem uso direto no código |
| font/size/5xl | `--font-size-5xl` | F | 40 | 0 | sem uso direto no código |
| font/weight/regular | `--font-weight-regular` | S | Regular | 0 | sem uso direto no código |
| font/family/heading | `--font-family-heading` | S | Archivo | 0 | sem uso direto no código |
| font/line-height/44 | `--font-line-height-44` | F | 44 | 0 | sem uso direto no código |
| font/size/extra/heading-l | `--font-size-extra-heading-l` | F | 28 | 0 | sem uso direto no código |
| font/line-height/32 | `--font-line-height-32` | F | 32 | 0 | sem uso direto no código |
| font/size/xl | `--font-size-xl` | F | 20 | 0 | sem uso direto no código |
| font/line-height/26 | `--font-line-height-26` | F | 26 | 0 | sem uso direto no código |
| font/size/extra/heading-s | `--font-size-extra-heading-s` | F | 15 | 0 | sem uso direto no código |
| font/weight/medium | `--font-weight-medium` | S | Medium | 0 | sem uso direto no código |
| font/line-height/20 | `--font-line-height-20` | F | 20 | 0 | sem uso direto no código |
| font/size/s | `--font-size-s` | F | 14 | 0 | sem uso direto no código |
| font/family/body | `--font-family-body` | S | Archivo | 0 | sem uso direto no código |
| font/size/xs | `--font-size-xs` | F | 12 | 0 | sem uso direto no código |
| font/line-height/16 | `--font-line-height-16` | F | 16 | 0 | sem uso direto no código |
| font/size/3xl | `--font-size-3xl` | F | 32 | 0 | sem uso direto no código |
| font/family/mono | `--font-family-mono` | S | Space Mono | 0 | sem uso direto no código |
| font/line-height/36 | `--font-line-height-36` | F | 36 | 0 | sem uso direto no código |
| font/line-height/24 | `--font-line-height-24` | F | 24 | 0 | sem uso direto no código |
| font/size/extra/label | `--font-size-extra-label` | F | 11 | 0 | sem uso direto no código |
| font/line-height/14 | `--font-line-height-14` | F | 14 | 0 | sem uso direto no código |
| font/size/2xs | `--font-size-2xs` | F | 10 | 0 | sem uso direto no código |
| font/line-height/12 | `--font-line-height-12` | F | 12 | 0 | sem uso direto no código |
| primitive/gray/950 | `--primitive-gray-950` | C | #050505 | 0 | sem uso direto no código |
| primitive/gray/925 | `--primitive-gray-925` | C | #0a0a0b | 0 | sem uso direto no código |
| primitive/gray/900 | `--primitive-gray-900` | C | #0e0e10 | 0 | sem uso direto no código |
| primitive/gray/850 | `--primitive-gray-850` | C | #161618 | 0 | sem uso (Figma e código) |
| primitive/gray/800 | `--primitive-gray-800` | C | #18181b | 0 | sem uso direto no código |
| primitive/gray/750 | `--primitive-gray-750` | C | #222226 | 0 | sem uso (Figma e código) |
| primitive/gray/700 | `--primitive-gray-700` | C | #2a2a2f | 0 | sem uso (Figma e código) |
| primitive/gray/650 | `--primitive-gray-650` | C | #2e2e33 | 0 | sem uso (Figma e código) |
| primitive/gray/600 | `--primitive-gray-600` | C | #4a4a52 | 0 | sem uso direto no código |
| primitive/gray/500 | `--primitive-gray-500` | C | #8b8b94 | 0 | sem uso (Figma e código) |
| primitive/gray/400 | `--primitive-gray-400` | C | #a8a8b1 | 0 | sem uso (Figma e código) |
| primitive/gray/100 | `--primitive-gray-100` | C | #f4f4f5 | 0 | sem uso direto no código |
| primitive/white/100 | `--primitive-white-100` | C | #ffffff | 0 | sem uso direto no código |
| primitive/black | `--primitive-black` | C | #000000 | 0 | sem uso direto no código |
| primitive/orange/500 | `--primitive-orange-500` | C | #ff5500 | 0 | sem uso (Figma e código) |
| primitive/yellow/300 | `--primitive-yellow-300` | C | #f8ff9e | 0 | sem uso (Figma e código) |
| primitive/yellow/400 | `--primitive-yellow-400` | C | #ecf38a | 0 | sem uso (Figma e código) |
| primitive/green/500 | `--primitive-green-500` | C | #3ddc84 | 0 | sem uso direto no código |
| primitive/green/600 | `--primitive-green-600` | C | #42be65 | 0 | sem uso direto no código |
| primitive/red/500 | `--primitive-red-500` | C | #ff4d4f | 0 | sem uso direto no código |
| primitive/red/600 | `--primitive-red-600` | C | #fa4d56 | 0 | sem uso direto no código |
| primitive/red/300 | `--primitive-red-300` | C | #ff8389 | 0 | sem uso direto no código |
| primitive/white/11 | `--primitive-white-11` | C | #ffffff 11% | 0 | sem uso direto no código |
| primitive/white/56 | `--primitive-white-56` | C | #ffffff 56% | 0 | sem uso direto no código |
| primitive/white/08 | `--primitive-white-08` | C | #ffffff 8% | 0 | sem uso (Figma e código) |
| primitive/white/20 | `--primitive-white-20` | C | #ffffff 20% | 0 | sem uso (Figma e código) |
| primitive/space/0 | `--primitive-space-0` | F | 0 | 0 | sem uso (Figma e código) |
| primitive/space/2 | `--primitive-space-2` | F | 2 | 0 | sem uso direto no código |
| primitive/space/4 | `--primitive-space-4` | F | 4 | 0 | sem uso direto no código |
| primitive/space/6 | `--primitive-space-6` | F | 6 | 0 | sem uso direto no código |
| primitive/space/8 | `--primitive-space-8` | F | 8 | 0 | sem uso direto no código |
| primitive/space/10 | `--primitive-space-10` | F | 10 | 0 | sem uso direto no código |
| primitive/space/12 | `--primitive-space-12` | F | 12 | 0 | sem uso direto no código |
| primitive/space/16 | `--primitive-space-16` | F | 16 | 0 | sem uso direto no código |
| primitive/space/20 | `--primitive-space-20` | F | 20 | 0 | sem uso direto no código |
| primitive/space/24 | `--primitive-space-24` | F | 24 | 0 | sem uso direto no código |
| primitive/space/32 | `--primitive-space-32` | F | 32 | 0 | sem uso (Figma e código) |
| primitive/space/40 | `--primitive-space-40` | F | 40 | 0 | sem uso (Figma e código) |
| primitive/space/48 | `--primitive-space-48` | F | 48 | 0 | sem uso (Figma e código) |
| primitive/space/64 | `--primitive-space-64` | F | 64 | 0 | sem uso (Figma e código) |
| primitive/radius/0 | `--primitive-radius-0` | F | 0 | 0 | sem uso (Figma e código) |
| primitive/radius/2 | `--primitive-radius-2` | F | 2 | 0 | sem uso direto no código |
| primitive/radius/4 | `--primitive-radius-4` | F | 4 | 0 | sem uso direto no código |
| primitive/radius/6 | `--primitive-radius-6` | F | 6 | 0 | sem uso direto no código |
| primitive/radius/8 | `--primitive-radius-8` | F | 8 | 0 | sem uso direto no código |
| primitive/radius/12 | `--primitive-radius-12` | F | 12 | 0 | sem uso direto no código |
| primitive/radius/999 | `--primitive-radius-999` | F | 999 | 0 | sem uso direto no código |
| layout/grid/columns | `--layout-grid-columns` | F | 12 | 0 | sem uso (Figma e código) |
| layout/grid/gutter | `--layout-grid-gutter` | F | 16 | 0 | sem uso (Figma e código) |
| layout/grid/margin | `--layout-grid-margin` | F | 24 | 0 | sem uso (Figma e código) |
| layout/widget/pad | `--layout-widget-pad` | F | 14 | 0 | sem uso direto no código |
| layout/widget/gap | `--layout-widget-gap` | F | 12 | 0 | sem uso direto no código |
| layout/widget/radius | `--layout-widget-radius` | F | 2 | 0 | sem uso direto no código |
| layout/button/radius | `--layout-btn-radius` | F | 2 | 0 | sem uso direto no código |
| layout/col/1 | `--layout-col-1` | F | 360 | 0 | sem uso (Figma e código) |
| layout/col/2 | `--layout-col-2` | F | 736 | 0 | sem uso (Figma e código) |
| layout/col/3 | `--layout-col-3` | F | 1112 | 0 | sem uso (Figma e código) |
| primitive/shell/sidebar | `--primitive-shell-sidebar` | C | #09090b | 0 | sem uso (Figma e código) |
| primitive/shell/main | `--primitive-shell-main` | C | #111113 | 0 | sem uso (Figma e código) |
| primitive/shell/row | `--primitive-shell-row` | C | #18181b | 0 | sem uso (Figma e código) |
| primitive/shell/nav-active | `--primitive-shell-nav-active` | C | #1a1a1c | 0 | sem uso (Figma e código) |
| primitive/shell/search | `--primitive-shell-search` | C | #1c1c1e | 0 | sem uso (Figma e código) |
| primitive/shell/card | `--primitive-shell-card` | C | #131315 | 0 | sem uso (Figma e código) |
| primitive/shell/line | `--primitive-shell-line` | C | #232327 | 0 | sem uso (Figma e código) |
| font/weight/semibold | `--font-weight-semibold` | S | SemiBold | 0 | sem uso (Figma e código) |
| font/size/m | `--font-size-m` | F | 16 | 0 | sem uso (Figma e código) |
| font/size/l | `--font-size-l` | F | 18 | 0 | sem uso (Figma e código) |
| font/size/2xl | `--font-size-2xl` | F | 24 | 0 | sem uso direto no código |
| font/size/4xl | `--font-size-4xl` | F | 36 | 0 | sem uso (Figma e código) |
| font/size/6xl | `--font-size-6xl` | F | 48 | 0 | sem uso (Figma e código) |
| font/size/7xl | `--font-size-7xl` | F | 64 | 0 | sem uso (Figma e código) |
| font/size/8xl | `--font-size-8xl` | F | 72 | 0 | sem uso (Figma e código) |
| font/line-height/22 | `--font-line-height-22` | F | 22 | 0 | sem uso (Figma e código) |
| font/line-height/28 | `--font-line-height-28` | F | 28 | 0 | sem uso (Figma e código) |
| font/line-height/34 | `--font-line-height-34` | F | 34 | 0 | sem uso (Figma e código) |
| font/line-height/38 | `--font-line-height-38` | F | 38 | 0 | sem uso (Figma e código) |
| primitive/canvas | `--primitive-canvas` | C | #1e1e1e | 0 | sem uso direto no código |
| component/widget/card/bg | `--widget-card-bg` | C | →color/surface/card | 0 | sem uso (Figma e código) |
| component/widget/card/border | `--widget-card-border` | C | →color/border/default | 0 | sem uso (Figma e código) |
| component/widget/card/radius | `--widget-card-radius` | F | →layout/widget/radius | 0 | sem uso (Figma e código) |
| component/widget/card/pad | `--widget-card-pad` | F | →layout/widget/pad | 0 | sem uso direto no código |
| component/widget/card/gap | `--widget-card-gap` | F | →layout/widget/gap | 0 | sem uso (Figma e código) |
| component/widget/title | `--widget-title` | C | →color/text/muted | 0 | sem uso (Figma e código) |
| component/widget/value | `--widget-value` | C | →color/text/primary | 0 | sem uso (Figma e código) |
| component/widget/value-profit | `--widget-value-profit` | C | →color/trade/profit | 0 | sem uso direto no código |
| component/widget/value-loss | `--widget-value-loss` | C | →color/trade/loss | 0 | sem uso (Figma e código) |
| component/widget/track | `--widget-track` | C | →color/surface/muted | 0 | sem uso (Figma e código) |
| component/widget/bar-fill | `--widget-bar-fill` | C | →color/brand/primary | 0 | sem uso (Figma e código) |
| component/widget/accent | `--widget-accent` | C | →color/brand/highlight | 0 | sem uso (Figma e código) |
| component/button/primary/bg | `--button-primary-bg` | C | →color/brand/primary | 0 | sem uso direto no código |
| component/button/primary/text | `--button-primary-text` | C | →primitive/white/100 | 0 | sem uso direto no código |
| component/button/secondary/bg | `--button-secondary-bg` | C | →color/surface/muted | 0 | sem uso direto no código |
| component/button/secondary/text | `--button-secondary-text` | C | →color/text/primary | 0 | sem uso direto no código |
| component/button/ghost/text | `--button-ghost-text` | C | →color/text/muted | 0 | sem uso direto no código |
| component/button/radius | `--button-radius` | F | →layout/button/radius | 8 | sem uso no Figma |
| component/badge/neutral/bg | `--badge-neutral-bg` | C | →color/surface/muted | 0 | sem uso direto no código |
| component/badge/neutral/text | `--badge-neutral-text` | C | →color/text/muted | 0 | sem uso direto no código |
| component/badge/profit/text | `--badge-profit-text` | C | →color/trade/profit | 0 | sem uso direto no código |
| component/badge/loss/text | `--badge-loss-text` | C | →color/trade/loss | 0 | sem uso direto no código |
| component/badge/highlight/bg | `--badge-highlight-bg` | C | →color/brand/highlight | 0 | sem uso (Figma e código) |
| component/badge/highlight/text | `--badge-highlight-text` | C | →primitive/white/100 | 0 | sem uso (Figma e código) |
| component/input/bg | `--input-bg` | C | →color/surface/page | 0 | sem uso (Figma e código) |
| component/input/border | `--input-border` | C | →color/border/default | 0 | sem uso direto no código |
| component/input/text | `--input-text` | C | →color/text/primary | 0 | sem uso direto no código |
| component/input/placeholder | `--input-placeholder` | C | →color/text/muted | 0 | sem uso direto no código |
| primitive/orange/700 | `--primitive-orange-700` | C | #cf4500 | 0 | sem uso direto no código |
| primitive/orange/800 | `--primitive-orange-800` | C | #b83d00 | 0 | sem uso (Figma e código) |
| layout/widget/pad-sm | `--layout-widget-pad-sm` | F | 10 | 0 | sem uso direto no código |
| layout/motion/hover-ms | `--layout-motion-hover-ms` | F | 150 | 0 | sem uso (Figma e código) |
| component/table/col/check | `--table-col-check` | F | 40 | 0 | sem uso (Figma e código) |
| component/table/col/student | `--table-col-student` | F | 272 | 0 | sem uso (Figma e código) |
| component/table/col/tier | `--table-col-tier` | F | 151 | 0 | sem uso (Figma e código) |
| component/table/col/progress | `--table-col-progress` | F | 206 | 0 | sem uso (Figma e código) |
| component/table/col/active | `--table-col-active` | F | 145 | 0 | sem uso (Figma e código) |
| component/table/col/journal | `--table-col-journal` | F | 217 | 0 | sem uso (Figma e código) |
| component/widget/cell/bg | `--widget-cell-bg` | C | #ffffff 4% | 0 | sem uso direto no código |
| primitive/gray/775 | `--color-gray-775` | C | #212124 | 0 | sem uso (Figma e código) |
| primitive/gray/725 | `--color-gray-725` | C | #29292b | 0 | sem uso (Figma e código) |
| primitive/gray/50 | `--color-gray-50` | C | #f5f5f5 | 0 | sem uso (Figma e código) |
| primitive/gray/350 | `--color-gray-350` | C | #9e9ea8 | 0 | sem uso (Figma e código) |
| space/6 | `--space-6` | F | →primitive/space/6 | 0 | sem uso direto no código |
| space/8 | `--space-8` | F | →primitive/space/8 | 0 | sem uso direto no código |
| space/16 | `--space-16` | F | →primitive/space/16 | 0 | sem uso direto no código |
| space/20 | `--space-20` | F | →primitive/space/20 | 0 | sem uso direto no código |
| space/24 | `--space-24` | F | →primitive/space/24 | 0 | sem uso direto no código |
| space/4 | `--space-4` | F | →primitive/space/4 | 0 | sem uso direto no código |
| radius/lg | `--radius-lg` | F | →primitive/radius/12 | 1 | em uso |
| primitive/radius/16 | `--primitive-radius-16` | F | 16 | 0 | sem uso direto no código |
| radius/xl | `--radius-xl` | F | →primitive/radius/16 | 1 | em uso |
| radius/full | `--radius-full` | F | →primitive/radius/999 | 0 | sem uso direto no código |
| space/2 | `--space-2` | F | →primitive/space/2 | 0 | sem uso direto no código |
| primitive/extra/ffffff-0 | `--primitive-extra-ffffff-0` | C | #ffffff 0% | 0 | sem uso direto no código |
| component/streak-day/state-empty | `--component-streak-day-state-empty` | C | →primitive/extra/ffffff-0 | 0 | sem uso direto no código |
| primitive/extra/e6e6e6 | `--primitive-extra-e6e6e6` | C | #e6e6e6 | 0 | sem uso direto no código |
| component/icon/default | `--component-icon-default` | C | →primitive/extra/e6e6e6 | 0 | sem uso direto no código |
| component/cover/background | `--component-cover-background` | C | →primitive/black | 0 | sem uso direto no código |
| primitive/extra/121212 | `--primitive-extra-121212` | C | #121212 | 0 | sem uso direto no código |
| component/cover/fade-start | `--component-cover-fade-start` | C | →primitive/extra/121212 | 0 | sem uso direto no código |
| primitive/extra/212121-0 | `--primitive-extra-212121-0` | C | #212121 0% | 0 | sem uso direto no código |
| component/cover/fade-end | `--component-cover-fade-end` | C | →primitive/extra/212121-0 | 0 | sem uso direto no código |
| primitive/extra/ff4701 | `--primitive-extra-ff4701` | C | #ff4701 | 0 | sem uso direto no código |
| component/cover/glow-start | `--component-cover-glow-start` | C | →primitive/extra/ff4701 | 0 | sem uso direto no código |
| primitive/extra/ff9003 | `--primitive-extra-ff9003` | C | #ff9003 | 0 | sem uso direto no código |
| component/cover/glow-end | `--component-cover-glow-end` | C | →primitive/extra/ff9003 | 0 | sem uso direto no código |
| primitive/extra/ffd0b2 | `--primitive-extra-ffd0b2` | C | #ffd0b2 | 0 | sem uso direto no código |
| component/cover/logo-highlight | `--component-cover-logo-highlight` | C | →primitive/extra/ffd0b2 | 0 | sem uso direto no código |
| primitive/extra/252525 | `--primitive-extra-252525` | C | #252525 | 0 | sem uso direto no código |
| component/docs/section-bg | `--component-docs-section-bg` | C | →primitive/extra/252525 | 0 | sem uso direto no código |
| primitive/extra/ffffff-10 | `--primitive-extra-ffffff-10` | C | #ffffff 10% | 0 | sem uso direto no código |
| component/docs/section-border | `--component-docs-section-border` | C | →primitive/extra/ffffff-10 | 0 | sem uso direto no código |
| primitive/extra/b3b3b3 | `--primitive-extra-b3b3b3` | C | #b3b3b3 | 0 | sem uso (Figma e código) |
| component/docs/label | `--component-docs-label` | C | →primitive/extra/b3b3b3 | 0 | sem uso (Figma e código) |
| primitive/extra/e5e5e5 | `--primitive-extra-e5e5e5` | C | #e5e5e5 | 0 | sem uso (Figma e código) |
| component/docs/heading | `--component-docs-heading` | C | →primitive/extra/e5e5e5 | 0 | sem uso (Figma e código) |
| primitive/extra/ffffff | `--primitive-extra-ffffff` | C | #ffffff | 0 | sem uso direto no código |
| component/docs/title | `--component-docs-title` | C | →primitive/extra/ffffff | 0 | sem uso direto no código |
| primitive/extra/959596 | `--primitive-extra-959596` | C | #959596 | 0 | sem uso direto no código |
| component/gauge/dot-on | `--component-gauge-dot-on` | C | →primitive/extra/959596 | 0 | sem uso direto no código |
| component/gauge/dot-off | `--component-gauge-dot-off` | C | →primitive/extra/959596 | 0 | sem uso direto no código |
| space/12 | `--space-12` | F | →primitive/space/12 | 0 | sem uso direto no código |
| space/10 | `--space-10` | F | →primitive/space/10 | 0 | sem uso direto no código |
| primitive/space/14 | `--primitive-space-14` | F | 14 | 0 | sem uso direto no código |
| space/14 | `--space-14` | F | →primitive/space/14 | 0 | sem uso direto no código |
| radius/2xs | `--radius-2xs` | F | →primitive/radius/2 | 0 | sem uso direto no código |
| radius/xs | `--radius-xs` | F | →primitive/radius/4 | 0 | sem uso direto no código |
| radius/sm | `--radius-sm` | F | →primitive/radius/6 | 1 | em uso |
| radius/md | `--radius-md` | F | →primitive/radius/8 | 5 | em uso |
| primitive/black/11 | `--primitive-black-11` | C | #000000 11% | 0 | sem uso direto no código |
| primitive/extra/ececee | `--primitive-extra-ececee` | C | #ececee | 0 | sem uso direto no código |
| primitive/extra/6b6b73 | `--primitive-extra-6b6b73` | C | #6b6b73 | 0 | sem uso direto no código |
| primitive/extra/efe9dc | `--primitive-extra-efe9dc` | C | #efe9dc | 0 | sem uso direto no código |
| primitive/extra/f8f4ea | `--primitive-extra-f8f4ea` | C | #f8f4ea | 0 | sem uso direto no código |
| primitive/extra/e4dccb | `--primitive-extra-e4dccb` | C | #e4dccb | 0 | sem uso direto no código |
| primitive/extra/26211d | `--primitive-extra-26211d` | C | #26211d | 0 | sem uso direto no código |
| primitive/extra/85796a | `--primitive-extra-85796a` | C | #85796a | 0 | sem uso direto no código |
| primitive/extra/0e1226 | `--primitive-extra-0e1226` | C | #0e1226 | 0 | sem uso direto no código |
| primitive/extra/171b38 | `--primitive-extra-171b38` | C | #171b38 | 0 | sem uso direto no código |
| primitive/extra/20254a | `--primitive-extra-20254a` | C | #20254a | 0 | sem uso direto no código |
| primitive/extra/0b0e1d | `--primitive-extra-0b0e1d` | C | #0b0e1d | 0 | sem uso (Figma e código) |
