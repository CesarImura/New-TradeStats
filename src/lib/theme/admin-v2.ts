import { A, adm } from "@/lib/theme/ts-system"

/**
 * Admin v2 on top of the legacy admin layer (TS_ADMIN_CSS).
 *
 * Every value comes from the Figma Admin collection through `--admin-*`
 * (src/app/admin-tokens.css). This sheet is appended after TS_ADMIN_CSS and
 * uses the same selectors, so it wins by order. It remaps the shadcn tokens so
 * pages that are not rebuilt yet already speak the v2 look: flat ink surfaces,
 * 1px hairlines, Helvetica Neue, Space Mono labels, orange primary.
 *
 * Rebuilt pages use `src/components/admin/ui/*` and do not depend on this.
 * Regenerate / extend: docs/admin-v2.md.
 */
const T = (n: string) => `var(--admin-${n})`

export const TS_ADMIN_V2_CSS = `
${A} {
  --radius: ${T("radius-md")};
  --background: ${T("color-bg-page")}; --foreground: ${T("color-text-primary")};
  --card: ${T("color-bg-panel")}; --card-foreground: ${T("color-text-primary")};
  --popover: ${T("color-bg-raised")}; --popover-foreground: ${T("color-text-primary")};
  --border: ${T("color-border-default")}; --input: ${T("color-border-strong")}; --ring: ${T("color-border-focus")};
  --muted: ${T("color-bg-muted")}; --muted-foreground: ${T("color-text-secondary")};
  --secondary: ${T("color-bg-muted")}; --secondary-foreground: ${T("color-text-primary")};
  --accent: ${T("color-bg-hover")}; --accent-foreground: ${T("color-text-primary")};
  --primary: ${T("color-accent-default")}; --primary-foreground: ${T("color-text-on-accent")};
  --destructive: ${T("color-status-danger")};
  --sidebar: ${T("color-bg-page")}; --sidebar-foreground: ${T("color-text-nav")};
  --sidebar-border: ${T("color-border-default")}; --sidebar-accent: ${T("color-bg-selected")};
  --ts-layer-1: ${T("color-bg-panel")}; --ts-layer-2: ${T("color-bg-raised")};
  --ts-hover-1: ${T("color-bg-hover")}; --ts-hover-2: ${T("color-bg-selected")};
  --adm-ground: ${T("color-bg-page")}; --adm-canvas: ${T("color-bg-page")}; --adm-surface: ${T("color-bg-panel")};
  --adm-raised: ${T("color-bg-raised")}; --adm-hover: ${T("color-bg-hover")};
  --adm-line: ${T("color-border-subtle")}; --adm-edge: ${T("color-border-default")};
  --coach-font-body: ${T("font-family-primary")}; --coach-font-heading: ${T("font-family-primary")}; --coach-font-label: ${T("font-family-mono")};
}
${A} body { background: ${T("color-bg-page")}; font-family: ${T("font-family-primary")}; color: ${T("color-text-primary")}; }
${adm(":is(h1, h2, h3)")} { letter-spacing: 0; }
${adm(":is(.font-mono, kbd, code)")} { font-family: ${T("font-family-mono")}; }

${adm(".ts-admin-bar")} { background: color-mix(in srgb, ${T("color-bg-page")} 88%, transparent); }

${adm(".text-sm")} { font-size: 0.8125rem; line-height: 1.25rem; }
${adm(".text-xs")} { font-size: 0.75rem; line-height: 1rem; }
${adm(".text-base")} { font-size: 0.875rem; line-height: 1.375rem; }

/* Buttons: Admin / Button. 36px, radius md, 13px Medium. */
${adm("[data-slot=button]")} { border-radius: ${T("component-button-radius")}; font-size: 0.8125rem; font-weight: 500; transition: background-color 0.3s ease-out, color 0.3s ease-out; }
${adm("[data-slot=button]:is(.h-8, .h-9)")} { height: 2.25rem; }
${adm("[data-slot=button]:is(.size-8, .size-9)")} { width: 2.25rem; height: 2.25rem; }
${adm("[data-slot=button].h-7")} { height: 1.75rem; font-size: 0.75rem; border-radius: ${T("component-button-radius-sm")}; }
${adm("[data-slot=button].size-7")} { width: 1.75rem; height: 1.75rem; border-radius: ${T("component-button-radius-sm")}; }
${adm("[data-slot=button]:is(.size-8, .size-9)")} { width: 2.25rem; height: 2.25rem; }
${adm("[data-slot=button].bg-primary")} { background: ${T("component-button-primary-bg-default")}; color: ${T("component-button-primary-content")}; box-shadow: none; }
${adm("[data-slot=button].bg-primary:hover")} { background: ${T("component-button-primary-bg-hover")}; }
${adm(":is([data-slot=button].bg-secondary, [data-slot=button][class*='border-border'])")} {
  background: transparent; border-color: transparent; box-shadow: inset 0 0 0 1px ${T("component-button-secondary-border")}; color: ${T("component-button-secondary-content")};
}
${adm(":is([data-slot=button].bg-secondary, [data-slot=button][class*='border-border']):hover")} { background: ${T("component-button-secondary-bg-hover")}; border-color: transparent; }
${adm("[data-slot=switch][data-checked] [data-slot=switch-thumb]")} { background: ${T("color-control-knob")} !important; }
${adm("[data-slot=switch][data-checked]")} { background: ${T("color-control-on")}; }

/* Fields: Admin / Field. 44px control, radius md, field fill, subtle hairline. */
${adm(":is([data-slot=input], [data-slot=textarea], [data-slot=select-trigger], select)")} {
  border-radius: ${T("radius-md")}; background-color: ${T("color-bg-field")}; border-color: ${T("color-border-subtle")}; box-shadow: none; font-size: 0.875rem;
}
${adm(":is([data-slot=input], [data-slot=textarea], [data-slot=select-trigger], select):hover")} { border-color: ${T("color-border-strong")}; }
${adm(":is([data-slot=input], [data-slot=textarea], [data-slot=select-trigger], select):focus-visible")} { border-color: ${T("color-border-focus")}; outline: 0; box-shadow: 0 0 0 3px color-mix(in srgb, ${T("color-border-focus")} 25%, transparent); }
${adm(":is([data-slot=input], [data-slot=select-trigger], select):not(textarea)")} { height: 2.75rem; }
${adm("[data-slot=checkbox]")} { border-radius: ${T("radius-xs")}; background: ${T("color-bg-field")}; border-color: ${T("color-border-strong")}; }

/* Panels: Admin / Panel. bg panel, 1px hairline, radius lg, padding 20. */
${adm("[data-slot=card]")} { --card-spacing: 1.25rem; border-radius: ${T("radius-lg")}; background: ${T("color-bg-panel")}; box-shadow: 0 0 0 1px ${T("color-border-default")}; }
${adm("[data-slot=card][data-size=sm]")} { --card-spacing: 1rem; }
${adm("[data-slot=card-title]")} { font: 400 1.125rem/1.5rem ${T("font-family-primary")}; letter-spacing: 0; }
${adm("[data-slot=card-title]:is(.text-2xl, .text-xl, .text-3xl)")} { font-size: 1.75rem; line-height: 2.25rem; }
${adm("[data-slot=card-description]")} { font-size: 0.8125rem; line-height: 1.125rem; color: ${T("color-text-secondary")}; }
${adm("[data-slot=card-footer]")} { border-color: ${T("color-border-subtle")}; }

/* Hand-built boxes follow the same panel recipe. */
${adm(":is(.rounded-lg, .rounded-xl, .rounded-2xl).border:not([data-slot])")} { border-radius: ${T("radius-lg")}; }
${adm(":is(.rounded-md, .rounded-sm).border:not([data-slot])")} { border-radius: ${T("radius-md")}; }
${adm(":is(.rounded-lg, .rounded-xl, .rounded-2xl, .rounded-md, .rounded-sm).border:not([data-slot], .border-dashed, [class*='border-['], [class*='border-transparent'], [class*='border-white'], [class*='border-primary'], [class*='border-destructive'], [class*='border-red'], [class*='border-amber'], [class*='border-emerald'], [class*='border-green'], [class*='border-input'])")} { border-color: ${T("color-border-default")}; }
${adm(":is(.rounded-lg, .rounded-xl, .rounded-2xl, .rounded-md, .rounded-sm).border:not([data-slot], .border-dashed, [class*='border-['], [class*='border-transparent'], [class*='border-white'], [class*='border-primary'], [class*='border-destructive'], [class*='border-red'], [class*='border-amber'], [class*='border-emerald'], [class*='border-green'], [class*='border-input']):not([class*='bg-'])")} { background-color: ${T("color-bg-panel")}; }
${adm(".bg-card")} { background-color: ${T("color-bg-panel")}; }
${adm(":is(.bg-muted, .bg-secondary):not([data-slot=button], [data-slot=tabs-list])")} { background-color: ${T("color-bg-panel")}; }
${adm(".border-dashed")} { border-color: ${T("color-border-strong")}; }
${adm(":is([data-slot=card], .rounded-lg.border, .rounded-xl.border) :is(.rounded-lg, .rounded-xl, .rounded-md, .rounded-sm).border:not([data-slot], .border-dashed, [class*='border-['], [class*='border-transparent'], [class*='border-primary'], [class*='border-destructive']):not([class*='bg-'])")} { background-color: ${T("color-bg-raised")}; border-color: ${T("color-border-subtle")}; }
${adm(":is([data-slot=card], .rounded-lg.border, .rounded-xl.border) :is(.bg-muted, .bg-secondary, .bg-card, .bg-background):not([data-slot=button])")} { background-color: ${T("color-bg-raised")}; }
${adm("[data-slot=card] [class*='hover:bg-muted']:hover")} { background-color: ${T("color-bg-hover")}; }

/* Tags: Admin / Tag. 20px, radius xs, Space Mono 10px uppercase. */
${adm("[data-slot=badge]")} { border-radius: ${T("radius-xs")}; height: 1.25rem; padding-inline: 0.5rem; font: 400 0.625rem/1 ${T("font-family-mono")}; letter-spacing: 0.06em; text-transform: uppercase; }
${adm("[data-slot=badge].bg-secondary")} { background: ${T("color-bg-selected")}; color: ${T("color-text-secondary")}; }
${adm("[data-slot=badge][class*='border-border']")} { border-color: transparent; background: ${T("color-bg-selected")}; }
${adm("[data-slot=badge].text-destructive")} { color: ${T("color-status-danger")}; }

/* Tabs: Admin / Tab group (Figma Toolbar > Tabs). A bordered group, 2px inside, 26px tabs; the open one is a raised pill. Counts are tertiary. */
${adm("[data-slot=tabs-list][data-variant=default]")} { background: transparent; height: auto !important; padding: ${T("space-2")}; gap: 0; border: 1px solid ${T("color-border-default")}; border-radius: ${T("radius-md")}; box-shadow: none; justify-content: flex-start; }
${adm("[data-slot=tabs-list][data-variant=default] [data-slot=tabs-trigger]")} { flex: 0 0 auto; height: 1.625rem; padding: 0 ${T("space-10")}; gap: ${T("space-6")}; font-size: 0.75rem; line-height: 1rem; font-weight: 400; color: ${T("color-text-secondary")}; border: 0; border-radius: ${T("radius-sm")}; }
${adm("[data-slot=tabs-list][data-variant=default] [data-slot=tabs-trigger]:hover")} { color: ${T("color-text-primary")}; }
${adm("[data-slot=tabs-list][data-variant=default] [data-slot=tabs-trigger][data-active]")} { background: ${T("color-bg-raised")}; color: ${T("color-text-primary")}; box-shadow: none !important; }
${adm("[data-slot=tabs-list][data-variant=default] [data-slot=tabs-trigger]::after")} { display: none; }
${adm("[data-slot=tabs-list][data-variant=default] [data-slot=tabs-trigger] > :is(.text-muted-foreground, .tabular-nums)")} { color: ${T("color-text-tertiary")}; }
${adm("[data-slot=tabs-list][data-variant=line] [data-slot=tabs-trigger]::after")} { background: ${T("color-accent-default")}; }

/* Tables: no frame, mono header, hairlines. */
${adm("[data-slot=table-header] [data-slot=table-row]")} { border-color: ${T("color-border-subtle")}; }
${adm("[data-slot=table-head]")} { height: 2.5rem; padding-inline: 0.75rem; font: 400 0.625rem/1 ${T("font-family-mono")}; letter-spacing: 0.06em; text-transform: uppercase; color: ${T("color-text-tertiary")}; }
${adm("[data-slot=table-body] [data-slot=table-row]")} { border-color: ${T("color-border-subtle")}; }
${adm("[data-slot=table-body] [data-slot=table-row]:hover")} { background: ${T("color-bg-hover")}; }
${adm("[data-slot=table-cell]")} { height: 3.25rem; padding-inline: 0.75rem; font-size: 0.8125rem; }

/* Overlays. */
${adm(":is([data-slot=dialog-content], [data-slot=popover-content], [data-slot=dropdown-menu-content], [data-slot=context-menu-content], [data-slot=select-content], [data-slot=command])")} {
  border-radius: ${T("radius-lg")}; background: ${T("color-bg-raised")}; box-shadow: 0 0 0 1px ${T("color-border-default")}, 0 14px 32px -12px rgb(0 0 0 / 0.6);
}
${adm(":is([data-slot=dialog-content], [data-slot=sheet-content])")} { background: ${T("color-bg-panel")}; }
${adm("[data-slot=sheet-content]")} { box-shadow: 0 0 0 1px ${T("color-border-default")}; }
${adm(":is([data-slot=dropdown-menu-item], [data-slot=context-menu-item], [data-slot=select-item], [data-slot=command-item])")} { border-radius: ${T("radius-sm")}; min-height: 2rem; font-size: 0.8125rem; }
${adm("[data-slot=tooltip-content]")} { border-radius: ${T("radius-sm")}; font-size: 0.75rem; }

/* Switcher button in the sidebar keeps the nav-item look. */
${adm("[data-slot=sidebar-menu-button]")} { border-radius: ${T("radius-md")}; color: ${T("color-text-nav")}; font-size: 0.8125rem; gap: 0.75rem; }
${adm("[data-slot=sidebar-menu-button]:not([data-size=lg])")} { height: 2.25rem; }
${adm("[data-slot=sidebar-menu-button]:hover")} { background: ${T("color-bg-hover")}; color: ${T("color-text-primary")}; }
${adm("[data-slot=sidebar-menu-button][data-active]")} { background: ${T("color-bg-selected")}; color: ${T("color-text-primary")}; }

@media (prefers-reduced-motion: reduce) {
  ${adm("[data-slot=button]")} { transition: none; }
}
`
