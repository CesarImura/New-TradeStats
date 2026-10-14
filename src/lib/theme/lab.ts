import type { FontId } from "@/lib/fonts"
import { BRAND_COLORS, FONT_PAIRS, HIGHLIGHT_COLORS } from "@/components/admin/design/options"
import { onColor } from "./derive"
import { TEMPLATES, TEMPLATE_IDS } from "./templates"
import type { CoachTheme, Mode, TemplateId } from "./types"

/** One theme in the theme lab, with a name saying what it is. */
export type LabTheme = { id: string; name: string; note?: string; theme: CoachTheme }


function make(template: TemplateId, mode: Mode, patch: Partial<CoachTheme> = {}): CoachTheme {
  const base = TEMPLATES[template].theme
  const primary = patch.primary ?? base.primary
  return {
    ...base,
    mode,
    ...patch,
    primary,
    primaryForeground: patch.primaryForeground ?? (patch.primary ? onColor(primary) : base.primaryForeground),
    fonts: { ...base.fonts, ...patch.fonts },
    nav: { ...base.nav, ...patch.nav },
  }
}

/** Each template with each brand colour from the colour picker. */
export function matrixSet(templates: TemplateId[], mode: Mode | "both"): LabTheme[] {
  const modes: Mode[] = mode === "both" ? ["light", "dark"] : [mode]
  return templates.flatMap((tpl) =>
    modes.flatMap((m) =>
      BRAND_COLORS.map((c) => ({
        id: `${tpl}-${m}-${c}`,
        name: `${TEMPLATES[tpl].name} · ${m} · ${c}`,
        theme: make(tpl, m, { primary: c }),
      })),
    ),
  )
}

const font = (heading: FontId, body: FontId, label: FontId = body) => ({ heading, body, label })

/**
 * Coaches who arrive with their own brand. Each is something a real trading
 * brand might ask for, picked to push the engine where it is weakest.
 */
export const BRANDED: LabTheme[] = [
  {
    id: "neon",
    name: "Neon desk",
    note: "Acid green on black, mono everything",
    theme: make("terminal", "dark", { primary: "#39ff14", fonts: font("space-mono", "geist", "space-mono"), highlight: "#ff2bd6" }),
  },
  {
    id: "pastel",
    name: "Soft pastel",
    note: "Pale pink brand, serif, pill buttons",
    theme: make("pulse", "light", { primary: "#f9b4c8", fonts: font("instrument-serif", "dm-sans"), buttonShape: "pill", radius: 24 }),
  },
  {
    id: "yellow-light",
    name: "Yellow brand, light",
    note: "TradeStats yellow as the main colour on white",
    theme: make("terminal", "light", { primary: "#f8ff9e" }),
  },
  {
    id: "navy-dark",
    name: "Navy on dark",
    note: "A deep brand colour almost the same as the page",
    theme: make("pulse", "dark", { primary: "#14215c" }),
  },
  {
    id: "black-brand",
    name: "Black brand",
    note: "Monochrome luxury, black buttons on white",
    theme: make("atelier", "light", { primary: "#0a0a0a", fonts: font("instrument-serif", "geist", "geist-mono"), labelStyle: "caps" }),
  },
  {
    id: "red-atelier",
    name: "Red on Atelier",
    note: "Red brand over the template's green-tinted greys",
    theme: make("atelier", "light", { primary: "#e11d48" }),
  },
  {
    id: "gold",
    name: "Gold, dark serif",
    note: "Prop-firm luxury: gold on near-black, serif headings",
    theme: make("atelier", "dark", { primary: "#c9a227", fonts: font("fraunces", "manrope"), headingWeight: 600 }),
  },
  {
    id: "cyan-pulse",
    name: "Cyan crypto",
    note: "Bright cyan with a mint highlight",
    theme: make("pulse", "dark", { primary: "#00e5ff", highlight: "#00d39a" }),
  },
  {
    id: "orange-light-pulse",
    name: "Orange on Pulse",
    note: "Our orange on Pulse's blue-tinted greys",
    theme: make("pulse", "light", { primary: "#ff5500" }),
  },
  {
    id: "purple-terminal",
    name: "Purple terminal, light",
    note: "Square, mono labels, purple brand on white",
    theme: make("terminal", "light", { primary: "#6b3dff" }),
  },
  {
    id: "brown",
    name: "Earthy",
    note: "Muted brown brand, airy, no borders",
    theme: make("atelier", "light", { primary: "#8b5e3c", density: "airy" }),
  },
  {
    id: "mixed",
    name: "Everything mixed",
    note: "Square cards, pill buttons, heavy shadows, mono caps, serif",
    theme: make("terminal", "light", {
      primary: "#0ea5e9",
      radius: 0,
      buttonShape: "pill",
      shadow: "strong",
      fonts: font("fraunces", "archivo", "space-mono"),
      headingWeight: 700,
    }),
  },
]

/** A seeded random number generator, so a set can be shared by its seed. */
function rng(seed: number) {
  let s = seed % 2147483647 || 1
  return () => ((s = (s * 16807) % 2147483647), (s - 1) / 2147483646)
}

/** Every setting picked at random, the way a coach clicking around might end up. */
export function randomSet(seed: number, n = 12): LabTheme[] {
  const r = rng(seed)
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(r() * xs.length)]
  const extra = ["#39ff14", "#f9b4c8", "#f8ff9e", "#14215c", "#c9a227", "#00e5ff", "#8b5e3c", "#ffd166"]
  return Array.from({ length: n }, (_, i) => {
    const tpl = pick(TEMPLATE_IDS)
    const pair = pick(FONT_PAIRS)
    const primary = pick([...BRAND_COLORS, ...extra])
    return {
      id: `rand-${seed}-${i}`,
      name: `Random ${i + 1}`,
      note: `${TEMPLATES[tpl].name} base · ${pair.name} fonts · ${primary}`,
      theme: make(tpl, pick(["light", "dark"] as const), {
        primary,
        highlight: r() < 0.5 ? pick(HIGHLIGHT_COLORS) : undefined,
        radius: pick([0, 2, 6, 10, 14, 20, 28]),
        buttonShape: pick(["square", "rounded", "pill"] as const),
        shadow: pick(["none", "soft", "strong"] as const),
        borders: r() < 0.5,
        density: pick(["compact", "comfortable", "airy"] as const),
        fonts: { heading: pair.heading, body: pair.body, label: pair.label },
        labelStyle: r() < 0.4 ? "caps" : "plain",
        headingWeight: pick([400, 500, 600, 700] as const),
        effects: pick(["flat", "soft", "vivid"] as const),
        background: pick(["plain", "grid", "glow", "dots", "gradient"] as const),
      }),
    }
  })
}
