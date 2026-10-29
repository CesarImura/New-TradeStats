/**
 * Our own UI ("ts-ui"): the admin area, sign-up, the setup wizard and the
 * launcher. Never the coach's platform; that is themed by the coach.
 *
 * Built on shadcn's components, in the spirit of Webflow's dark Designer: a
 * dense tool UI. Near-black page (#0a0a0b) with panels one step up (#161618)
 * edged by 1px lines, titled panels with a header band, recessed fields,
 * small tactile buttons (28px, 4px corners, a top highlight), 13px body text,
 * compact tables, tabs and menus. Geist and Carbon icons; TradeStats
 * colours stay: yellow for the main action, orange for selection and focus.
 *
 * Everything sits under `:root:has(.ts-ui)`, so menus and dialogs rendered
 * outside the tree match. Coach previews shown inside our UI (Design editor,
 * Home builder, template cards) are left alone.
 */

/** Coach-themed areas inside our UI. Component rules skip them. */
const COACH = `:where(.hb-canvas, [class*="tpl-"], [class^="pv-"], [class*=" pv-"], [data-coach-scope])`
const R = ":root:has(.ts-ui)"
/** A shadcn part inside our UI, but not inside a coach preview. */
const ui = (sel: string) => `${R} ${sel}:not(${COACH}, ${COACH} *)`
/** A border colour set on the element itself (transparent, a state colour, a brand colour). */
const CUSTOM_BORDER = `[class*="border-["], [class*="border-transparent"], [class*="border-white"], [class*="border-primary"], [class*="border-destructive"], [class*="border-red"], [class*="border-amber"], [class*="border-emerald"], [class*="border-green"], [class*="border-input"]`

export const TS = {
  bg: "#0a0a0b",
  layer1: "#161618",
  layer2: "#222226",
  layer3: "#2e2e33",
  layerHover1: "#1d1d20",
  layerHover2: "#2a2a2f",
  borderSubtle: "#232327",
  borderStrong: "#4a4a52",
  /** The 1px edge around panels, buttons and fields. */
  panelBorder: "#2a2a2f",
  /** Recessed field fill, darker than any panel. */
  field: "#0e0e10",
  text: "#f4f4f5",
  textSecondary: "#a8a8b1",
  /** Hints and descriptions: the quietest text that still reads at 4.5:1 on every panel. */
  textHelper: "#8b8b94",
  /** Main action: yellow button, near-black text. */
  cta: "#f8ff9e",
  ctaHover: "#ecf38a",
  /** Focus outlines, the open page, the active tab, selected options: orange. */
  interactive: "#ff5500",
  profit: "#42be65",
  loss: "#fa4d56",
  /** Loss as text on a loss tint (badges, counts): Carbon red 40, ≥ 5:1 on every panel. */
  lossText: "#ff8389",
} as const

export const TS_SYSTEM_CSS = `
${R} {
  --background: ${TS.bg}; --foreground: ${TS.text};
  --card: ${TS.layer1}; --card-foreground: ${TS.text};
  --popover: ${TS.layer2}; --popover-foreground: ${TS.text};
  --primary: ${TS.cta}; --primary-foreground: ${TS.bg};
  --secondary: ${TS.layer2}; --secondary-foreground: ${TS.text};
  --muted: ${TS.layer2}; --muted-foreground: ${TS.textSecondary};
  --accent: ${TS.layerHover2}; --accent-foreground: ${TS.text};
  --destructive: ${TS.loss};
  --border: ${TS.borderSubtle}; --input: ${TS.borderStrong};
  --ring: ${TS.interactive}; --radius: 4px;
  --chart-1: ${TS.interactive}; --chart-2: ${TS.cta}; --chart-3: ${TS.profit}; --chart-4: ${TS.loss}; --chart-5: ${TS.layer3};
  --highlight: ${TS.cta}; --highlight-foreground: ${TS.bg};
  --profit: ${TS.profit}; --loss: ${TS.loss}; --ts-loss-text: ${TS.lossText};
  --sidebar: #0e0e10; --sidebar-foreground: ${TS.textSecondary};
  --sidebar-primary: ${TS.cta}; --sidebar-primary-foreground: ${TS.bg};
  --sidebar-accent: ${TS.layer1}; --sidebar-accent-foreground: ${TS.text};
  --sidebar-border: ${TS.borderSubtle}; --sidebar-ring: ${TS.interactive};
  --ts-interactive: ${TS.interactive}; --ts-cta: ${TS.cta};
  --ts-layer-1: ${TS.layer1}; --ts-layer-2: ${TS.layer2}; --ts-layer-3: ${TS.layer3};
  --ts-hover-1: ${TS.layerHover1}; --ts-hover-2: ${TS.layerHover2};
  --coach-font-body: var(--ff-geist); --coach-font-heading: var(--ff-geist); --coach-font-label: var(--ff-geist-mono);
  color-scheme: dark;
}
${R} body { background: ${TS.bg}; font-family: var(--ff-geist), system-ui, sans-serif; font-feature-settings: "tnum" 0; letter-spacing: 0; -webkit-font-smoothing: antialiased; }
${R} ::selection { background: rgb(255 85 0 / 0.35); }

/* Focus: one 1px orange ring with a soft halo, like a selected element in an editor. */
${ui(":is([data-slot=button], [data-slot=tabs-trigger], [data-slot=checkbox], [data-slot=switch], [data-slot=sidebar-menu-button], a, button):focus-visible")} {
  outline: 1px solid var(--ring) !important; outline-offset: 1px; box-shadow: 0 0 0 3px rgb(255 85 0 / 0.18) !important; --tw-ring-shadow: 0 0 #0000;
}

/* Density: a tool, not a web page. 13px body, 11.5px small print, tighter line heights. */
${ui(".text-sm")} { font-size: 0.8125rem; line-height: 1.125rem; }
${ui(".text-xs")} { font-size: 0.71875rem; line-height: 1rem; }
${ui(".text-base")} { font-size: 0.875rem; line-height: 1.25rem; }
${ui(":is(h1, h2, h3)")} { letter-spacing: -0.005em; }

/*
 * Buttons: small and tactile. 28px (24px small), 4px corners, 12.5px medium text,
 * a 1px edge and a faint top highlight so they read as pressable on a dark panel.
 */
${ui("[data-slot=button]")} {
  border-radius: 4px; font-weight: 500; font-size: 0.78125rem; letter-spacing: 0.005em;
  transition: background-color .12s, border-color .12s, color .12s;
}
${ui("[data-slot=button]:is(.h-8, .h-9)")} { height: 1.75rem; }
${ui("[data-slot=button]:is(.size-8, .size-9)")} { width: 1.75rem; height: 1.75rem; }
${ui("[data-slot=button].h-7")} { height: 1.5rem; font-size: 0.75rem; }
${ui("[data-slot=button].size-7")} { width: 1.5rem; height: 1.5rem; }
${ui("[data-slot=button]:active")} { translate: none; }
${ui("[data-slot=button].bg-primary")} {
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.45), inset 0 -1px 0 rgb(0 0 0 / 0.12), 0 0 0 1px rgb(0 0 0 / 0.5);
}
${ui("[data-slot=button].bg-primary:hover")} { background: ${TS.ctaHover}; }
${ui(":is([data-slot=button].bg-secondary, [data-slot=button][class*='border-border'])")} {
  background: ${TS.layer2}; border-color: ${TS.panelBorder};
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.06), 0 1px 1px rgb(0 0 0 / 0.4);
}
${ui(":is([data-slot=button].bg-secondary, [data-slot=button][class*='border-border']):hover")} { background: ${TS.layer3}; border-color: #3a3a40; }
${ui("[data-slot=button][class*='hover:bg-muted']:not(.bg-secondary):not([class*='border-border']):hover")} { background: ${TS.layerHover2}; }

/* Fields: recessed. Darker than the panel they sit in, a 1px edge, 4px corners, 28px tall. */
${ui(":is([data-slot=input], [data-slot=textarea], [data-slot=select-trigger], select)")} {
  border-radius: 4px; background-color: ${TS.field}; border: 1px solid ${TS.panelBorder};
  box-shadow: inset 0 1px 2px rgb(0 0 0 / 0.35); font-size: 0.8125rem;
}
${ui(":is([data-slot=input], [data-slot=select-trigger], select):not(textarea)")} { height: 1.75rem; }
${ui(":is([data-slot=input], [data-slot=textarea], [data-slot=select-trigger], select):hover")} { border-color: #3a3a40; }
${ui(":is([data-slot=input], [data-slot=textarea], [data-slot=select-trigger], select):focus-visible")} {
  outline: none !important; border-color: var(--ring); box-shadow: 0 0 0 3px rgb(255 85 0 / 0.18) !important;
}
${ui("[data-slot=input]::placeholder, [data-slot=textarea]::placeholder")} { color: ${TS.textHelper}; }
${ui("[data-slot=checkbox]")} { border-radius: 3px; background: ${TS.field}; border-color: #3a3a40; }
${ui("[data-slot=checkbox][data-checked]")} { background: var(--primary); border-color: var(--primary); }
${ui("[data-slot=switch]")} { box-shadow: inset 0 1px 2px rgb(0 0 0 / 0.4); }

/*
 * Cards are panels: one surface, a 1px edge, 6px corners. A titled panel gets a
 * header band (13px semibold title, hairline under it), like an editor's
 * inspector sections.
 */
${ui("[data-slot=card]")} {
  --card-spacing: 0.75rem; border-radius: 6px; background: var(--card);
  box-shadow: 0 0 0 1px ${TS.panelBorder}; --tw-ring-color: transparent;
}
${ui("[data-slot=card][data-size=sm]")} { --card-spacing: 0.625rem; }
${ui("[data-slot=card] > [data-slot=card-header]:has([data-slot=card-title])")} {
  border-bottom: 1px solid ${TS.borderSubtle}; padding-bottom: var(--card-spacing);
}
${ui("[data-slot=card-title]")} { font-size: 0.8125rem; line-height: 1.125rem; font-weight: 600; letter-spacing: 0; }
/* Big numbers (KPI tiles) keep a readable size. */
${ui("[data-slot=card-title]:is(.text-2xl, .text-xl, .text-3xl)")} { font-size: 1.25rem; line-height: 1.75rem; font-weight: 500; letter-spacing: -0.01em; }
${ui("[data-slot=card-description]")} { font-size: 0.75rem; line-height: 1rem; color: ${TS.textHelper}; }
${ui("[data-slot=card-footer]")} { background: transparent; border-color: ${TS.borderSubtle}; }
/* Things inside a panel step up one layer, so they never vanish into it. */
${ui("[data-slot=card] :is(.bg-muted, .bg-secondary):not([data-slot=button])")} { background-color: var(--ts-layer-2); }
${ui("[data-slot=card] :is(.bg-card, .bg-background)")} { background-color: var(--ts-layer-2); }
${ui("[data-slot=card] [class*='hover:bg-muted']:hover")} { background-color: var(--ts-hover-2); }
${ui("[data-slot=card] .border, [data-slot=card] [class*='border-b'], [data-slot=card] [class*='border-t']")} { border-color: ${TS.panelBorder}; }
/* Hand-built boxes (any rounded box with a border) look like panels too: 1px edge, 6px corners (4px for small ones). */
${ui(":is(.rounded-lg, .rounded-xl, .rounded-2xl).border:not([data-slot])")} { border-radius: 6px; }
${ui(":is(.rounded-md, .rounded-sm).border:not([data-slot])")} { border-radius: 4px; }
/* Only boxes with the default border colour get the panel edge; transparent, coloured and selected borders keep theirs. */
${ui(`:is(.rounded-lg, .rounded-xl, .rounded-2xl, .rounded-md, .rounded-sm).border:not([data-slot], ${CUSTOM_BORDER})`)} { border-color: ${TS.panelBorder}; }
${ui(`:is(.rounded-lg, .rounded-xl).border:is(button, a):not(${CUSTOM_BORDER}):hover`)} { border-color: #3a3a40; }
${ui(".rounded-lg.border.bg-card, .rounded-xl.border.bg-card")} { background-color: var(--card); }
${ui(".border-dashed")} { border-color: #34343a; }

/* Tags: small, square, quiet. */
${ui("[data-slot=badge]")} { border-radius: 3px; height: 1.125rem; padding-inline: 0.3125rem; font-size: 0.6875rem; font-weight: 500; }
${ui("[data-slot=badge].bg-secondary")} { background: ${TS.layer3}; color: ${TS.text}; }

/* Tabs: compact line tabs, 32px, 12.5px text, an orange underline on the open one. */
${ui("[data-slot=tabs-list][data-variant=default]")} {
  background: transparent; border-radius: 0; padding: 0; height: 2rem !important; gap: 0.25rem;
  box-shadow: inset 0 -1px 0 var(--border);
}
${ui("[data-slot=tabs-list][data-variant=default] [data-slot=tabs-trigger]")} {
  flex: none; height: 100%; border-radius: 0; border: 0; padding: 0 0.625rem; background: transparent !important; box-shadow: none !important;
  color: ${TS.textHelper}; font-weight: 500; font-size: 0.78125rem;
}
${ui("[data-slot=tabs-list][data-variant=default] [data-slot=tabs-trigger]:hover")} { color: var(--foreground); }
${ui("[data-slot=tabs-list][data-variant=default] [data-slot=tabs-trigger][data-active]")} {
  color: var(--foreground); box-shadow: inset 0 -2px 0 var(--ts-interactive) !important;
}
${ui("[data-slot=tabs-list][data-variant=line] [data-slot=tabs-trigger]")} { border-radius: 0; }
${ui("[data-slot=tabs-list][data-variant=line] [data-slot=tabs-trigger]::after")} { background: var(--ts-interactive); }

/* Data tables: a panel with a 32px header band and 40px rows split by hairlines. */
${ui("[data-slot=table-container]")} { border-radius: 6px; box-shadow: 0 0 0 1px ${TS.panelBorder}; background: var(--ts-layer-1); }
${ui("[data-slot=table-header] [data-slot=table-row]")} { background: ${TS.layer1}; border-color: ${TS.borderSubtle}; }
${ui("[data-slot=table-head]")} {
  height: 2rem; padding-inline: 0.75rem; font-size: 0.71875rem; font-weight: 500; color: ${TS.textHelper}; letter-spacing: 0.01em;
}
${ui("[data-slot=table-body] [data-slot=table-row]")} { background: transparent; border-color: ${TS.borderSubtle}; }
${ui("[data-slot=table-cell]")} { height: 2.5rem; padding: 0.25rem 0.75rem; font-size: 0.8125rem; color: ${TS.textSecondary}; }
${ui("[data-slot=table-body] [data-slot=table-row]:hover")} { background: var(--ts-hover-1); }
${ui("[data-slot=table-body] [data-slot=table-row]:hover [data-slot=table-cell]")} { color: var(--foreground); }

/* Overlays: floating panels. One layer up, a 1px edge, a deep soft shadow. */
${ui(":is([data-slot=dialog-content], [data-slot=popover-content], [data-slot=dropdown-menu-content], [data-slot=context-menu-content], [data-slot=select-content], [data-slot=command])")} {
  border-radius: 6px; box-shadow: 0 0 0 1px #34343a, 0 12px 32px rgb(0 0 0 / 0.6), 0 2px 6px rgb(0 0 0 / 0.4); --tw-ring-color: transparent;
}
${ui("[data-slot=dialog-content]")} { background: var(--ts-layer-1); }
${ui(":is([data-slot=dropdown-menu-item], [data-slot=context-menu-item], [data-slot=select-item], [data-slot=command-item])")} {
  border-radius: 3px; min-height: 1.625rem; padding-block: 0.25rem; font-size: 0.78125rem;
}
${ui(":is([data-slot=dropdown-menu-item], [data-slot=context-menu-item], [data-slot=select-item], [data-slot=command-item]):is(:hover, [data-highlighted], [data-selected=true])")} { background: var(--ts-hover-2); }
${ui("[data-slot=sheet-content]")} { background: var(--ts-layer-1); box-shadow: -1px 0 0 ${TS.panelBorder}, -16px 0 40px rgb(0 0 0 / 0.5); }
${ui("[data-slot=tooltip-content]")} {
  border-radius: 4px; background: ${TS.layer3}; color: ${TS.text}; font-size: 0.71875rem; padding: 0.25rem 0.5rem;
  box-shadow: 0 0 0 1px #3a3a40, 0 4px 12px rgb(0 0 0 / 0.5);
}
${ui(":is([data-slot=progress], [data-slot=progress-track], [data-slot=progress-indicator])")} { border-radius: 999px; }
${ui(":is([data-slot=progress], [data-slot=progress-track])")} { background: var(--ts-layer-3); height: 4px; }
${ui("[data-slot=separator]")} { background: var(--border); }

/* Side navigation: logo, then the community card, then quiet 30px rows (12.5px text, 16px icons); the open page is a filled pill. */
${ui("[data-slot=sidebar-container]")} { border-color: ${TS.borderSubtle}; }
${ui("[data-slot=sidebar-group]")} { padding-block: 0.375rem; }
${ui("[data-slot=sidebar-menu]")} { gap: 1px; }
${ui("[data-slot=sidebar-menu-button]")} { border-radius: 4px; color: ${TS.textHelper}; font-size: 0.78125rem; }
${ui("[data-slot=sidebar-menu-button] > svg")} { opacity: 0.8; }
${ui("[data-slot=sidebar-menu-button]:hover")} { background: var(--ts-hover-1); color: ${TS.textSecondary}; }
${ui("[data-slot=sidebar-menu-button]:hover > svg")} { opacity: 1; }
${ui("[data-slot=sidebar-menu-button]:not([data-size=lg])")} { height: 1.875rem; }
/* The open page: a filled pill, full-white text, orange icon. Everything else stays quiet. */
${ui("[data-slot=sidebar-menu-button][data-active]")} {
  background: var(--ts-layer-2); color: ${TS.text}; font-weight: 500; box-shadow: inset 0 0 0 1px ${TS.panelBorder};
}
${ui("[data-slot=sidebar-menu-button][data-active] > svg")} { opacity: 1; color: var(--ts-interactive); }
/* The community selector card keeps its own text colour. */
${ui("[data-slot=sidebar-menu-button].ts-switcher")} { color: ${TS.text}; }
${ui("[data-slot=sidebar-group-label]")} {
  height: 1.5rem; font-family: var(--ff-geist-mono), ui-monospace, monospace; font-size: 0.65625rem; letter-spacing: 0.06em; text-transform: uppercase; color: ${TS.textHelper};
}
/* Folded to icons: the group names fade out. Pull them up by their own height (not shadcn's 32px) and let clicks through, so they never sit on an icon. */
${ui("[data-slot=sidebar][data-collapsible=icon] [data-slot=sidebar-group-label]")} { margin-top: -1.5rem; pointer-events: none; }
`

/**
 * The admin area on top of the base look: a floating canvas, after Linear and
 * Vercel. The side menu and the page share one near-black ground with no lines
 * between them; everything the admin works on sits on one rounded canvas a step
 * lighter. On the canvas, panels are soft fills, not outlines: depth comes from
 * surface steps, and hairlines are kept only where they help reading (table
 * rows, tab bars). Geist throughout, 14px body, 8px controls, 12px panels,
 * monochrome selection. Dark only. Orange stays for focus and charts, yellow
 * for the main action.
 *
 * Components can use the tokens directly: --adm-ground, --adm-canvas,
 * --adm-surface, --adm-raised, --adm-hover, --adm-line.
 */
const A = ":root:has(.ts-admin)"
const adm = (sel: string) => `${A} ${sel}:not(${COACH}, ${COACH} *)`
export const ADMIN = {
  /** Behind everything: the side menu and the gutter around the canvas. */
  ground: "#09090b",
  /** The rounded canvas the page sits on. */
  canvas: "#111113",
  /** A panel on the canvas. */
  surface: "#18181b",
  /** Something inside a panel (a nested box, a selected tile). */
  raised: "#202024",
  hover: "#1d1d21",
  /** The few hairlines left: table rows, tab bars. */
  line: "rgb(255 255 255 / 0.06)",
  /** The faint edge that keeps a fill from looking flat. */
  edge: "rgb(255 255 255 / 0.05)",
  idle: "#8b8b94",
} as const

export const TS_ADMIN_CSS = `
${A} {
  --radius: 8px; --background: ${ADMIN.canvas}; --card: ${ADMIN.surface}; --popover: ${ADMIN.raised};
  --border: ${ADMIN.line}; --input: rgb(255 255 255 / 0.1);
  --muted: ${ADMIN.surface}; --secondary: ${ADMIN.surface}; --accent: ${ADMIN.raised};
  --sidebar: ${ADMIN.ground}; --sidebar-border: transparent; --sidebar-accent: rgb(255 255 255 / 0.07);
  --ts-layer-1: ${ADMIN.surface}; --ts-layer-2: ${ADMIN.raised}; --ts-hover-1: ${ADMIN.hover}; --ts-hover-2: #26262b;
  --adm-ground: ${ADMIN.ground}; --adm-canvas: ${ADMIN.canvas}; --adm-surface: ${ADMIN.surface};
  --adm-raised: ${ADMIN.raised}; --adm-hover: ${ADMIN.hover}; --adm-line: ${ADMIN.line}; --adm-edge: ${ADMIN.edge};
  --coach-font-body: var(--ff-geist); --coach-font-heading: var(--ff-geist); --coach-font-label: var(--ff-geist-mono);
}
${A} body { background: ${ADMIN.ground}; font-family: var(--ff-geist), system-ui, sans-serif; letter-spacing: 0; -webkit-font-smoothing: antialiased; }
${adm(":is(h1, h2, h3)")} { letter-spacing: -0.02em; }
${adm(".font-mono, kbd, code")} { font-family: var(--ff-geist-mono), ui-monospace, monospace; }

/* The canvas: one rounded sheet floating on the ground, a faint edge instead of a line. */
${adm("[data-slot=sidebar-inset]")} { background: ${ADMIN.canvas}; box-shadow: 0 0 0 1px ${ADMIN.edge}, 0 1px 3px rgb(0 0 0 / 0.4); }
${adm(".ts-admin-bar")} { background: color-mix(in srgb, ${ADMIN.canvas} 85%, transparent); }

/* Type: a readable page, not a tool panel. */
${adm(".text-sm")} { font-size: 0.875rem; line-height: 1.25rem; }
${adm(".text-xs")} { font-size: 0.75rem; line-height: 1rem; }
${adm(".text-base")} { font-size: 0.9375rem; line-height: 1.375rem; }

/* Buttons: 32px, 8px corners, flat. Outline buttons are a soft fill, not a frame. */
${adm("[data-slot=button]")} { border-radius: 8px; font-size: 0.8125rem; }
${adm("[data-slot=button]:is(.h-8, .h-9)")} { height: 2rem; }
${adm("[data-slot=button]:is(.size-8, .size-9)")} { width: 2rem; height: 2rem; }
${adm("[data-slot=button].h-7")} { height: 1.75rem; font-size: 0.78125rem; border-radius: 7px; }
${adm("[data-slot=button].size-7")} { width: 1.75rem; height: 1.75rem; border-radius: 7px; }
${adm("[data-slot=button].bg-primary")} { box-shadow: none; }
${adm(":is([data-slot=button].bg-secondary, [data-slot=button][class*='border-border'])")} {
  background: rgb(255 255 255 / 0.05); border-color: transparent; box-shadow: inset 0 0 0 1px ${ADMIN.edge};
}
${adm(":is([data-slot=button].bg-secondary, [data-slot=button][class*='border-border']):hover")} { background: rgb(255 255 255 / 0.09); border-color: transparent; }

/* Fields: 34px, 8px corners, a soft fill with a faint edge. */
${adm(":is([data-slot=input], [data-slot=textarea], [data-slot=select-trigger], select)")} {
  border-radius: 8px; background-color: rgb(255 255 255 / 0.04); border-color: rgb(255 255 255 / 0.08); box-shadow: none; font-size: 0.875rem;
}
${adm(":is([data-slot=input], [data-slot=textarea], [data-slot=select-trigger], select):hover")} { border-color: rgb(255 255 255 / 0.14); }
${adm(":is([data-slot=input], [data-slot=select-trigger], select):not(textarea)")} { height: 2.125rem; }
${adm("[data-slot=checkbox]")} { border-radius: 4px; background: rgb(255 255 255 / 0.04); border-color: rgb(255 255 255 / 0.16); }

/* Panels: a fill one step up from the canvas, 12px corners, no outline, no header band. */
${adm("[data-slot=card]")} { --card-spacing: 1.25rem; border-radius: 12px; background: ${ADMIN.surface}; box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.03); }
${adm("[data-slot=card][data-size=sm]")} { --card-spacing: 1rem; }
${adm("[data-slot=card] > [data-slot=card-header]:has([data-slot=card-title])")} { border-bottom: 0; padding-bottom: 0; }
${adm("[data-slot=card-title]")} { font-size: 0.9375rem; line-height: 1.375rem; font-weight: 500; letter-spacing: -0.01em; }
${adm("[data-slot=card-title]:is(.text-2xl, .text-xl, .text-3xl)")} { font-size: 1.625rem; line-height: 2rem; font-weight: 500; letter-spacing: -0.025em; }
${adm("[data-slot=card-description]")} { font-size: 0.8125rem; line-height: 1.125rem; }
${adm("[data-slot=card-footer]")} { border-color: ${ADMIN.line}; }

/*
 * Hand-built boxes (rounded, bordered divs) become fills too: the frame goes,
 * a surface takes its place. Boxes that set their own fill keep it; boxes with
 * a coloured, transparent or selected border keep that border.
 */
${adm(`:is(.rounded-lg, .rounded-xl, .rounded-2xl).border:not([data-slot])`)} { border-radius: 12px; }
${adm(`:is(.rounded-md, .rounded-sm).border:not([data-slot])`)} { border-radius: 8px; }
${adm(`:is(.rounded-lg, .rounded-xl, .rounded-2xl, .rounded-md, .rounded-sm).border:not([data-slot], .border-dashed, ${CUSTOM_BORDER})`)} { border-color: transparent; }
${adm(`:is(.rounded-lg, .rounded-xl, .rounded-2xl, .rounded-md, .rounded-sm).border:not([data-slot], .border-dashed, ${CUSTOM_BORDER}):not([class*="bg-"])`)} { background-color: ${ADMIN.surface}; }
${adm(`:is(.rounded-lg, .rounded-xl, .rounded-2xl, .rounded-md, .rounded-sm).border:is(button, a):not(${CUSTOM_BORDER}):hover`)} { background-color: ${ADMIN.hover}; border-color: transparent; }
${adm(".border-dashed")} { border-color: rgb(255 255 255 / 0.12); }
${adm(".bg-card")} { background-color: ${ADMIN.surface}; }
${adm(":is(.bg-muted, .bg-secondary):not([data-slot=button], [data-slot=tabs-list])")} { background-color: ${ADMIN.surface}; }

/* Inside a panel, everything steps up one more surface so it never vanishes into it. */
${adm(`:is([data-slot=card], .rounded-lg.border, .rounded-xl.border) :is(.rounded-lg, .rounded-xl, .rounded-md, .rounded-sm).border:not([data-slot], .border-dashed, ${CUSTOM_BORDER}):not([class*="bg-"])`)} { background-color: ${ADMIN.raised}; }
${adm(":is([data-slot=card], .rounded-lg.border, .rounded-xl.border) :is(.bg-muted, .bg-secondary, .bg-card, .bg-background):not([data-slot=button])")} { background-color: ${ADMIN.raised}; }
${adm("[data-slot=card] [class*='hover:bg-muted']:hover")} { background-color: #26262b; }
${adm(":is([data-slot=card], .rounded-lg.border, .rounded-xl.border) :is([class*='border-b'], [class*='border-t'], [class*='divide-'] > *)")} { border-color: ${ADMIN.line}; }

/* Tags: soft. */
${adm("[data-slot=badge]")} { border-radius: 6px; height: 1.25rem; padding-inline: 0.4375rem; font-size: 0.71875rem; }
${adm("[data-slot=badge].bg-secondary")} { background: rgb(255 255 255 / 0.08); }
${adm("[data-slot=badge][class*='border-border']")} { border-color: transparent; background: rgb(255 255 255 / 0.06); }

/* Tabs: plain words on a faint hairline; the open one is white with a white underline. */
${adm("[data-slot=tabs-list][data-variant=default]")} { background: transparent; height: 2.5rem !important; gap: 1.25rem; box-shadow: inset 0 -1px 0 ${ADMIN.line}; }
${adm("[data-slot=tabs-list][data-variant=default] [data-slot=tabs-trigger]")} { padding: 0 0.125rem; font-size: 0.875rem; color: ${ADMIN.idle}; }
${adm("[data-slot=tabs-list][data-variant=default] [data-slot=tabs-trigger][data-active]")} { box-shadow: inset 0 -2px 0 var(--foreground) !important; }
${adm("[data-slot=tabs-list][data-variant=line] [data-slot=tabs-trigger]::after")} { background: var(--foreground); }

/* Tables: no frame, just a quiet header and hairlines between rows. */
${adm("[data-slot=table-container]")} { border-radius: 0; box-shadow: none; background: transparent; }
${adm("[data-slot=table-header] [data-slot=table-row]")} { background: transparent; border-color: ${ADMIN.line}; }
${adm("[data-slot=table-head]")} { height: 2.5rem; padding-inline: 0.75rem; font-size: 0.8125rem; font-weight: 400; color: ${ADMIN.idle}; }
${adm("[data-slot=table-body] [data-slot=table-row]")} { border-color: ${ADMIN.line}; }
${adm("[data-slot=table-body] [data-slot=table-row]:hover")} { background: rgb(255 255 255 / 0.025); }
${adm("[data-slot=table-cell]")} { height: 3.25rem; padding-inline: 0.75rem; font-size: 0.875rem; }

/* Overlays: floating sheets, 12px corners, a faint edge and a deep shadow. */
${adm(":is([data-slot=dialog-content], [data-slot=popover-content], [data-slot=dropdown-menu-content], [data-slot=context-menu-content], [data-slot=select-content], [data-slot=command])")} {
  border-radius: 12px; box-shadow: 0 0 0 1px rgb(255 255 255 / 0.08), 0 16px 48px rgb(0 0 0 / 0.6);
}
${adm(":is([data-slot=dialog-content], [data-slot=sheet-content])")} { background: ${ADMIN.canvas}; }
${adm("[data-slot=sheet-content]")} { box-shadow: -1px 0 0 ${ADMIN.edge}, -24px 0 48px rgb(0 0 0 / 0.5); }
${adm(":is([data-slot=dropdown-menu-item], [data-slot=context-menu-item], [data-slot=select-item], [data-slot=command-item])")} {
  border-radius: 6px; min-height: 2rem; font-size: 0.875rem;
}
${adm("[data-slot=tooltip-content]")} { border-radius: 6px; font-size: 0.75rem; box-shadow: 0 0 0 1px rgb(255 255 255 / 0.08), 0 4px 12px rgb(0 0 0 / 0.5); }

/* Side menu: on the ground, no edge. Sentence-case group names, 34px rows, a soft white pill on the open page. */
/* Red badges read on their tint (the coach's platform has its own rule, from the coach's loss colour). */
${adm("[data-slot=badge].text-destructive")} { color: var(--ts-loss-text); }
${adm("[data-slot=sidebar-container]")} { border: 0; }
${adm("[data-slot=sidebar-group]")} { padding-block: 0.375rem; }
${adm("[data-slot=sidebar-menu]")} { gap: 1px; }
${adm("[data-slot=sidebar-group-label]")} {
  height: 2rem; font-family: var(--ff-geist), system-ui, sans-serif; font-size: 0.75rem; font-weight: 500; letter-spacing: 0; text-transform: none; color: #80808a;
}
${adm("[data-slot=sidebar-menu-button]")} { border-radius: 8px; color: ${ADMIN.idle}; font-size: 0.875rem; gap: 0.75rem; }
${adm("[data-slot=sidebar-menu-button]:not([data-size=lg])")} { height: 2.125rem; }
${adm("[data-slot=sidebar-menu-button] > svg")} { opacity: 1; width: 1.125rem; height: 1.125rem; }
${adm("[data-slot=sidebar-menu-button]:hover")} { background: rgb(255 255 255 / 0.04); color: ${TS.text}; }
${adm("[data-slot=sidebar-menu-button][data-active]")} { background: rgb(255 255 255 / 0.07); color: ${TS.text}; box-shadow: none; }
${adm("[data-slot=sidebar-menu-button][data-active] > svg")} { color: ${TS.text}; }
${adm("[data-slot=sidebar][data-collapsible=icon] [data-slot=sidebar-group-label]")} { margin-top: -2rem; }
`
