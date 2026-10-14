/**
 * Our own UI ("ts-ui"): the admin area, sign-up, the setup wizard and the
 * launcher. Never the coach's platform; that is themed by the coach.
 *
 * Follows shadcn's components and IBM Carbon's Gray 100 theme: layered
 * surfaces (#161616 → #262626 → #393939) instead of shadows and borders,
 * square-ish corners (2–4px), IBM Plex, Carbon icons, a 4/8px rhythm, dense
 * data tables, line tabs and fields with a bottom rule. No brand colour while
 * TradeStats' own is a placeholder: the main action and every selection or
 * focus mark is white.
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

export const TS = {
  bg: "#161616",
  layer1: "#262626",
  layer2: "#393939",
  layer3: "#525252",
  layerHover1: "#333333",
  layerHover2: "#474747",
  borderSubtle: "#393939",
  borderStrong: "#6f6f6f",
  text: "#f4f4f4",
  textSecondary: "#c6c6c6",
  textHelper: "#8d8d8d",
  /** Main action: white button, near-black text. */
  cta: "#ffffff",
  ctaHover: "#e0e0e0",
  /** Focus outlines, the open page, the active tab, selected options. */
  interactive: "#f4f4f4",
  profit: "#42be65",
  loss: "#fa4d56",
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
  --chart-1: ${TS.text}; --chart-2: #8d8d8d; --chart-3: ${TS.profit}; --chart-4: ${TS.loss}; --chart-5: ${TS.layer3};
  --highlight: ${TS.cta}; --highlight-foreground: ${TS.bg};
  --profit: ${TS.profit}; --loss: ${TS.loss};
  --sidebar: ${TS.bg}; --sidebar-foreground: ${TS.textSecondary};
  --sidebar-primary: ${TS.cta}; --sidebar-primary-foreground: ${TS.bg};
  --sidebar-accent: ${TS.layer1}; --sidebar-accent-foreground: ${TS.text};
  --sidebar-border: ${TS.borderSubtle}; --sidebar-ring: ${TS.interactive};
  --ts-interactive: ${TS.interactive}; --ts-cta: ${TS.cta};
  --ts-layer-1: ${TS.layer1}; --ts-layer-2: ${TS.layer2}; --ts-layer-3: ${TS.layer3};
  --ts-hover-1: ${TS.layerHover1}; --ts-hover-2: ${TS.layerHover2};
  --coach-font-body: var(--ff-plex); --coach-font-heading: var(--ff-plex); --coach-font-label: var(--ff-plex-mono);
  color-scheme: dark;
}
${R} body { background: ${TS.bg}; font-family: var(--ff-plex), system-ui, sans-serif; font-feature-settings: "tnum" 0; letter-spacing: 0.01em; }
${R} ::selection { background: rgb(255 255 255 / 0.25); }

r-spacing: 0.01em; }
${R} ::selection { background: rgb(255 85 0 / 0.35); }

/* Focus: one 2px white outline everywhere, no glow. */
${ui(":is([data-slot=button], [data-slot=input], [data-slot=textarea], [data-slot=select-trigger], [data-slot=tabs-trigger], [data-slot=checkbox], [data-slot=switch], [data-slot=sidebar-menu-button], a, button, select):focus-visible")} {
  outline: 2px solid var(--ring) !important; outline-offset: 1px; box-shadow: none !important; --tw-ring-shadow: 0 0 #0000;
}

/* Buttons: rectangular, medium weight. Primary is white; secondary a grey layer; outline a white hairline. */
${ui("[data-slot=button]")} { border-radius: 2px; font-weight: 500; letter-spacing: 0.01em; }
${ui("[data-slot=button]:active")} { translate: none; }
${ui("[data-slot=button].bg-primary:hover")} { background: ${TS.ctaHover}; }
${ui("[data-slot=button].bg-secondary")} { background: ${TS.layer2}; }
${ui("[data-slot=button].bg-secondary:hover")} { background: ${TS.layerHover2}; }
${ui("[data-slot=button][class*='border-border']")} { background: transparent; border-color: ${TS.borderStrong}; }
${ui("[data-slot=button][class*='border-border']:hover")} { background: var(--ts-hover-1); border-color: ${TS.textHelper}; }

/* Fields: Carbon fields. A filled layer one step above what they sit on, with a bottom rule. */
${ui(":is([data-slot=input], [data-slot=textarea], [data-slot=select-trigger], select)")} {
  border-radius: 0; background-color: var(--ts-layer-1); border-color: transparent; box-shadow: inset 0 -1px 0 ${TS.borderStrong};
}
${ui(":is([data-slot=card], [data-slot=dialog-content], [data-slot=sheet-content], [data-slot=popover-content]) :is([data-slot=input], [data-slot=textarea], [data-slot=select-trigger], select)")} {
  background-color: var(--ts-layer-2);
}
${ui(":is([data-slot=input], [data-slot=textarea], [data-slot=select-trigger], select):hover")} { background-color: var(--ts-hover-1); }
${ui(":is([data-slot=card], [data-slot=dialog-content], [data-slot=sheet-content], [data-slot=popover-content]) :is([data-slot=input], [data-slot=textarea], [data-slot=select-trigger], select):hover")} { background-color: var(--ts-hover-2); }
${ui(":is([data-slot=input], [data-slot=textarea], [data-slot=select-trigger], select):focus-visible")} { outline-offset: -2px !important; }
${ui("[data-slot=input]::placeholder, [data-slot=textarea]::placeholder")} { color: ${TS.textHelper}; }
${ui("[data-slot=checkbox]")} { border-radius: 2px; border-color: ${TS.text}; }
${ui("[data-slot=checkbox][data-checked]")} { background: ${TS.text}; color: ${TS.bg}; }
${ui("[data-slot=switch][data-checked]")} { background: ${TS.text}; }
${ui("[data-slot=switch][data-checked] [data-slot=switch-thumb]")} { background: ${TS.bg}; }

/* Cards: Carbon tiles. A flat layer, no outline, no shadow; the layer step does the separating. */
${ui("[data-slot=card]")} { border-radius: var(--radius); box-shadow: none; --tw-ring-color: transparent; background: var(--card); }
${ui("[data-slot=card-title]")} { font-weight: 600; letter-spacing: 0; }
/* Things inside a tile step up one layer, so they never vanish into it. */
${ui("[data-slot=card] :is(.bg-muted, .bg-secondary)")} { background-color: var(--ts-layer-2); }
${ui("[data-slot=card] :is(.bg-card, .bg-background)")} { background-color: var(--ts-layer-2); }
${ui("[data-slot=card] [class*='hover:bg-muted']:hover")} { background-color: var(--ts-hover-2); }
${ui("[data-slot=card] .border, [data-slot=card] [class*='border-b'], [data-slot=card] [class*='border-t']")} { border-color: ${TS.layer3}; }

/* Tags: square, compact, grey. */
${ui("[data-slot=badge]")} { border-radius: 2px; height: 1.25rem; padding-inline: 0.375rem; font-weight: 500; }
${ui("[data-slot=badge].bg-secondary")} { background: ${TS.layer3}; color: ${TS.text}; }

/* Tabs: Carbon line tabs. Text tabs with a white indicator on a hairline. */
${ui("[data-slot=tabs-list][data-variant=default]")} {
  background: transparent; border-radius: 0; padding: 0; height: 2.5rem !important; gap: 0;
  box-shadow: inset 0 -1px 0 var(--border);
}
${ui("[data-slot=tabs-list][data-variant=default] [data-slot=tabs-trigger]")} {
  flex: none; height: 100%; border-radius: 0; border: 0; padding: 0 1rem; background: transparent !important; box-shadow: none !important;
  color: var(--muted-foreground); font-weight: 400;
}
${ui("[data-slot=tabs-list][data-variant=default] [data-slot=tabs-trigger]:hover")} { color: var(--foreground); background: var(--ts-hover-1) !important; }
${ui("[data-slot=tabs-list][data-variant=default] [data-slot=tabs-trigger][data-active]")} {
  color: var(--foreground); font-weight: 500; box-shadow: inset 0 -2px 0 var(--ts-interactive) !important;
}
${ui("[data-slot=tabs-list][data-variant=line] [data-slot=tabs-trigger]")} { border-radius: 0; }
${ui("[data-slot=tabs-list][data-variant=line] [data-slot=tabs-trigger]::after")} { background: var(--ts-interactive); }

/* Data tables: a header band, 48px rows, 16px gutters, rows separated by the layer below. */
${ui("[data-slot=table-header] [data-slot=table-row]")} { background: var(--ts-layer-2); border-color: transparent; }
${ui("[data-slot=table-head]")} { height: 3rem; padding-inline: 1rem; font-size: 0.875rem; font-weight: 600; color: var(--foreground); letter-spacing: 0.01em; }
${ui("[data-slot=table-body] [data-slot=table-row]")} { background: var(--ts-layer-1); border-color: var(--ts-layer-2); }
${ui("[data-slot=table-cell]")} { height: 3rem; padding: 0.375rem 1rem; color: ${TS.textSecondary}; }
${ui("[data-slot=table-body] [data-slot=table-row]:hover")} { background: var(--ts-hover-1); }
${ui("[data-slot=table-body] [data-slot=table-row]:hover [data-slot=table-cell]")} { color: var(--foreground); }

/* Overlays: one layer up, a soft short shadow, no outline. */
${ui(":is([data-slot=dialog-content], [data-slot=popover-content], [data-slot=dropdown-menu-content], [data-slot=context-menu-content], [data-slot=select-content], [data-slot=command])")} {
  border-radius: var(--radius); box-shadow: 0 2px 6px rgb(0 0 0 / 0.5); --tw-ring-color: transparent;
}
${ui("[data-slot=dialog-content]")} { background: var(--ts-layer-1); }
${ui(":is([data-slot=dropdown-menu-item], [data-slot=context-menu-item], [data-slot=select-item], [data-slot=command-item])")} { border-radius: 0; }
${ui(":is([data-slot=dropdown-menu-item], [data-slot=context-menu-item], [data-slot=select-item], [data-slot=command-item]):is(:hover, [data-highlighted], [data-selected=true])")} { background: var(--ts-hover-2); }
${ui("[data-slot=sheet-content]")} { background: var(--ts-layer-1); box-shadow: none; }
${ui("[data-slot=tooltip-content]")} { border-radius: 2px; background: ${TS.text}; color: ${TS.bg}; }
${ui(":is([data-slot=progress], [data-slot=progress-track], [data-slot=progress-indicator])")} { border-radius: 0; }
${ui(":is([data-slot=progress], [data-slot=progress-track])")} { background: var(--ts-layer-3); }
${ui("[data-slot=progress-indicator]")} { background: var(--ts-interactive); }
${ui("[data-slot=separator]")} { background: var(--border); }

/* Side navigation: Carbon UI shell. Full-width grey rows, a white bar on the open page. */
${ui("[data-slot=sidebar-container]")} { border-color: var(--border); }
${ui("[data-slot=sidebar-menu-button]")} { border-radius: 0; color: ${TS.textSecondary}; }
${ui("[data-slot=sidebar-menu-button]:hover")} { background: var(--ts-hover-1); color: ${TS.text}; }
${ui("[data-slot=sidebar-menu-button]:not([data-size=lg])")} { height: 2rem; }
${ui("[data-slot=sidebar-menu-button][data-active]")} { box-shadow: inset 3px 0 0 var(--ts-interactive); background: var(--ts-layer-1); color: ${TS.text}; font-weight: 600; }
${ui("[data-slot=sidebar-group-label]")} {
  font-family: var(--ff-plex-mono), ui-monospace, monospace; font-size: 0.6875rem; letter-spacing: 0.06em; text-transform: uppercase; color: ${TS.textHelper};
}
`
