"use client"

import { createContext, useContext, useRef, useState } from "react"
import { ArrowDown, ArrowUp, ImagePlus, Palette, Pencil, Trash2, X } from "@/components/icons"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { isPageId, type Coach, type ModuleId } from "@/lib/data/coaches"
import { FONT_LIBRARY, type FontId } from "@/lib/fonts"
import type { Overrides } from "@/lib/prototype-store"
import { themeToCss, themeVars } from "@/lib/theme/css"
import { onColor } from "@/lib/theme/derive"
import { pictureFrom } from "@/lib/images"
import { BACKDROPS, NAV_MIN_DIM } from "@/lib/theme/backdrops"
import { colorsFromLogo } from "@/lib/theme/logo-colors"
import { TEMPLATES, TEMPLATE_IDS } from "@/lib/theme/templates"
import { chartStyleOf, headerFormOf, widgetFinishOf, type CoachTheme, type NavFill, type NavMarker, type TemplateId } from "@/lib/theme/types"
import { brandMenuReads, navFillOf } from "@/lib/theme/nav-fill"
import { SelectOptions } from "@/components/kit/select-field"
import { cn } from "@/lib/utils"
import { BackgroundControl } from "./background-control"
import { Field, More, Segmented, SliderField, Swatches } from "./controls"
import { FixedFirst, HIDDEN_INPUT, menuRow, SWITCH_OFF, SortableMenu, SortHandle, SortHint, useSort } from "./menu-sort"
import { AddPageButton, PageRow } from "./pages-field"
import { BRAND_COLORS, FONT_PAIRS, HIGHLIGHT_COLORS } from "../options"
import { TradingColoursField } from "./trading-colours"
import { card } from "../states"
import { useConfirmSwitch } from "../editor/switch-look"

/**
 * Every Design setting, defined once by id. The left panel (Brand kit, Menu
 * and words), the style inspector and click-to-edit all render settings from
 * here, so a setting looks and behaves the same wherever it shows up. The ids
 * are the `fields` that src/lib/design-pick.ts maps preview parts to.
 */

export type DesignCtx = {
  coach: Coach
  theme: CoachTheme
  working: Overrides
  change: (patch: Partial<Overrides>, key: string) => void
  commit: (next: Overrides, key: string) => void
  /** Keeps the design as it is now in Earlier versions (the Design editor; the wizard and the lab have none). */
  keepVersion?: (label: string) => void
  /** Goes back one step (the Design editor), so a toast can offer Undo right after a big change. */
  undo?: () => void
  /** Opens a page of the platform on the canvas to arrange and edit it (the Design editor; the wizard has none). */
  openPage?: (id: string) => void
}

const Ctx = createContext<DesignCtx | null>(null)
export const DesignProvider = Ctx.Provider
/** The coach, theme and draft the fields are editing. */
export const useDesign = () => useContext(Ctx)!

export const MODULE_NAMES: Record<ModuleId, string> = {
  courses: "Courses",
  calendar: "Calendar",
  charts: "Charts",
  community: "Community",
  journal: "Journal",
  ranking: "Ranking",
  ai: "AI assistant",
  downloads: "Downloads",
  partners: "Partners",
}

/** One setting by id. Menu items are `menu-<module>` (and `menu-home`). */
export function DesignField({ id }: { id: string }) {
  const F = FIELDS[id]
  if (F) return <F />
  return id.startsWith("menu-") ? <MenuRow id={id.slice(5)} /> : null
}

/** A titled block of settings in a panel. */
export function Group({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("grid gap-4 border-b px-4 pt-3 pb-5 last:border-b-0", className)}>
      <h3 className="text-[0.6875rem] font-medium tracking-[0.06em] text-muted-foreground uppercase">{title}</h3>
      {children}
    </section>
  )
}

/* ---------- Brand ---------- */

function TemplateField() {
  const { theme, working, commit } = useDesign()
  const [ask, dialog] = useConfirmSwitch()
  return (
    <Field id="template" label="Template" hint={TEMPLATES[theme.template].name}>
      <div className="grid grid-cols-3 gap-2">
        {TEMPLATE_IDS.map((id) => (
          <TemplateCard
            key={id}
            id={id}
            selected={theme.template === id}
            primary={theme.primary}
            onSelect={() =>
              theme.template !== id &&
              ask(TEMPLATES[id].name, () =>
                commit(
                  {
                    content: working.content,
                    theme: { template: id, primary: theme.primary, primaryForeground: theme.primaryForeground, highlight: working.theme.highlight },
                  },
                  "template",
                ),
              )
            }
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Switching keeps your name, logo, colours and menu. Style and layout start from the new template.</p>
      {dialog}
    </Field>
  )
}

function NameField() {
  const { coach, change } = useDesign()
  return (
    <Field id="name" label="Platform name">
      <Input aria-label="Platform name" value={coach.name} onChange={(e) => change({ content: { name: e.target.value } }, "name")} />
    </Field>
  )
}

function LogoField() {
  const { coach, theme, change } = useDesign()
  const [suggested, setSuggested] = useState<string[]>([])
  const input = useRef<HTMLInputElement>(null)
  const onLogo = (logo: string | undefined) => change({ content: { logo } }, "logo")
  const pickColor = (c: string) => change({ theme: { primary: c, primaryForeground: onColor(c) } }, "primary")

  const onFile = async (file: File) => {
    let small: string
    try {
      small = await pictureFrom(file, { max: 256, type: "image/png", keep: ["svg"] })
    } catch (err) {
      toast.error((err as Error).message)
      return
    }
    onLogo(small)
    setSuggested(await colorsFromLogo(small))
  }

  return (
    <Field id="logo" label="Logo" hint="Square PNG or SVG">
      <div className="flex items-center gap-3">
        {coach.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coach.logo} alt="Your logo" className="size-10 rounded-[6px] border object-contain p-1" />
        ) : (
          <span className="grid size-10 place-items-center rounded-[6px] text-sm font-semibold" style={{ background: theme.primary, color: onColor(theme.primary) }}>
            {coach.mark}
          </span>
        )}
        <div className="flex flex-wrap gap-1.5">
          <Button variant="outline" size="sm" onClick={() => input.current?.click()}>
            <ImagePlus /> {coach.logo ? "Replace" : "Upload logo"}
          </Button>
          {/* Its colours again, for a logo uploaded before (they show by themselves after an upload). */}
          {coach.logo && !suggested.length && (
            <Button variant="ghost" size="sm" onClick={async () => setSuggested(await colorsFromLogo(coach.logo!))} title="Use a colour from your logo">
              <Palette /> Colours
            </Button>
          )}
          {coach.logo && (
            <Button variant="ghost" size="sm" onClick={() => { onLogo(undefined); setSuggested([]) }} aria-label="Remove logo">
              <Trash2 />
            </Button>
          )}
        </div>
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onFile(f)
            e.target.value = ""
          }}
        />
      </div>
      {suggested.length > 0 && (
        <div className="flex items-center gap-2 rounded-[4px] bg-muted p-2 text-xs">
          <span className="text-muted-foreground">From your logo</span>
          {suggested.map((c) => (
            <button key={c} onClick={() => pickColor(c)} className="size-5 rounded-full ring-1 ring-[color:color-mix(in_oklab,var(--foreground)_14%,transparent)] ring-inset transition-transform hover:scale-110" style={{ background: c }} aria-label={`Use ${c}`} />
          ))}
        </div>
      )}
    </Field>
  )
}

function PrimaryField() {
  const { theme, change } = useDesign()
  return (
    <Field id="primary" label="Brand colour">
      <Swatches label="Brand colour" value={theme.primary} colors={BRAND_COLORS} onChange={(c) => change({ theme: { primary: c, primaryForeground: onColor(c) } }, "primary")} />
    </Field>
  )
}

function HighlightField() {
  const { theme, change } = useDesign()
  return (
    <Field id="highlight" label="Highlight colour">
      <Swatches
        label="Highlight colour"
        value={theme.highlight ?? theme.palettes[theme.mode].highlight}
        colors={HIGHLIGHT_COLORS}
        onChange={(c) => change({ theme: { highlight: c } }, "highlight")}
      />
    </Field>
  )
}

function ModeField() {
  const { theme, change } = useDesign()
  return (
    <Field id="mode" label="Light or dark">
      <Segmented
        label="Light or dark"
        value={theme.mode}
        onChange={(mode) => change({ theme: { mode } }, "mode")}
        options={[
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
        ]}
      />
    </Field>
  )
}

/* ---------- Type ---------- */

function FontsField() {
  const { theme, change } = useDesign()
  return (
    <div data-field="fonts" className="grid gap-1.5">
      <span className="text-xs font-medium text-[color:color-mix(in_oklab,var(--foreground)_60%,transparent)]">Font pair</span>
      <div className="grid grid-cols-2 gap-2">
        {FONT_PAIRS.map((p) => {
          // The label font too: two pairs share a heading and body and differ only in their labels.
          const on = theme.fonts.heading === p.heading && theme.fonts.body === p.body && theme.fonts.label === p.label
          return (
            <button
              key={p.name}
              onClick={() => change({ theme: { fonts: { heading: p.heading, body: p.body, label: p.label } } }, "fonts")}
              aria-pressed={on}
              className={cn("grid gap-1 p-2.5 text-left", card(on))}
            >
              <span className="text-xl leading-none" style={{ fontFamily: FONT_LIBRARY[p.heading].css }}>Aa</span>
              <span className="truncate text-[0.6875rem] text-muted-foreground" style={{ fontFamily: FONT_LIBRARY[p.body].css }}>
                {p.name} · {FONT_LIBRARY[p.heading].label}
              </span>
            </button>
          )
        })}
      </div>
      <More label="Choose fonts one by one">
        {(["heading", "body", "label"] as const).map((role) => (
          <Field key={role} label={role === "heading" ? "Headings" : role === "body" ? "Text" : "Small labels"}>
            <SelectOptions
              value={theme.fonts[role]}
              onChange={(e) => change({ theme: { fonts: { [role]: e.target.value as FontId } } }, `font-${role}`)}
              className="h-7 rounded-[4px] border bg-background px-2 text-xs"
            >
              {Object.entries(FONT_LIBRARY).map(([id, f]) => (
                <option key={id} value={id}>
                  {f.label}
                </option>
              ))}
            </SelectOptions>
          </Field>
        ))}
        <p className="text-xs text-muted-foreground">Uploading your own font file comes later.</p>
      </More>
    </div>
  )
}

function HeadingWeightField() {
  const { theme, change } = useDesign()
  return (
    <Field id="heading-weight" label="Heading weight">
      <Segmented
        label="Heading weight"
        value={theme.headingWeight}
        onChange={(headingWeight) => change({ theme: { headingWeight } }, "weight")}
        options={[
          { value: 400, label: "Light" },
          { value: 500, label: "Medium" },
          { value: 700, label: "Bold" },
        ]}
      />
    </Field>
  )
}

function LabelsField() {
  const { theme, change } = useDesign()
  return (
    <Field id="labels" label="Small labels">
      <Segmented
        label="Small labels"
        value={theme.labelStyle}
        onChange={(labelStyle) => change({ theme: { labelStyle } }, "labels")}
        options={[
          { value: "plain", label: "Normal" },
          { value: "caps", label: "UPPERCASE" },
        ]}
      />
    </Field>
  )
}

/* ---------- Shape, depth, spacing ---------- */

function CornersField() {
  const { theme, change } = useDesign()
  return (
    <SliderField
      id="corners"
      label="Corners"
      value={theme.radius}
      min={0}
      max={24}
      unit="px"
      format={(r) => `${r <= 3 ? "Sharp" : r >= 16 ? "Very round" : "Round"} · ${r}px`}
      onChange={(radius) => change({ theme: { radius } }, "radius")}
    />
  )
}

function ButtonsField() {
  const { theme, change } = useDesign()
  return (
    <Field id="buttons" label="Buttons">
      <Segmented
        label="Button shape"
        value={theme.buttonShape}
        onChange={(buttonShape) => change({ theme: { buttonShape } }, "buttons")}
        options={[
          { value: "square", label: <span className="h-3.5 w-7 rounded-[2px] bg-current opacity-70" aria-label="Square" /> },
          { value: "rounded", label: <span className="h-3.5 w-7 rounded-[5px] bg-current opacity-70" aria-label="Rounded" /> },
          { value: "pill", label: <span className="h-3.5 w-7 rounded-full bg-current opacity-70" aria-label="Pill" /> },
        ]}
      />
    </Field>
  )
}

function ShadowsField() {
  const { theme, change } = useDesign()
  return (
    <Field id="shadows" label="Shadows">
      <Segmented
        label="Shadows"
        value={theme.shadow}
        onChange={(shadow) => change({ theme: { shadow } }, "shadow")}
        options={[
          { value: "none", label: "None" },
          { value: "soft", label: "Soft" },
          { value: "strong", label: "Strong" },
        ]}
      />
    </Field>
  )
}

function BordersField() {
  const { theme, change } = useDesign()
  return (
    <label data-field="borders" className="flex items-center justify-between gap-3 text-xs font-medium text-[color:color-mix(in_oklab,var(--foreground)_60%,transparent)]">
      Outline on cards
      <Switch checked={theme.borders} onCheckedChange={(borders) => change({ theme: { borders } }, "borders")} />
    </label>
  )
}

function DensityField() {
  const { theme, change } = useDesign()
  return (
    <Field id="density" label="Spacing">
      <Segmented
        label="Spacing"
        value={theme.density}
        onChange={(density) => change({ theme: { density } }, "density")}
        options={[
          { value: "compact", label: "Compact" },
          { value: "comfortable", label: "Comfortable" },
          { value: "airy", label: "Airy" },
        ]}
      />
    </Field>
  )
}

function ChartStyleField() {
  const { theme, change } = useDesign()
  return (
    <Field id="chart-style" label="Bars and gauges" hint={{ ticks: "Segments, like an instrument", solid: "One filled bar", thin: "A fine line", blocks: "A few thick blocks", dots: "A row of small squares" }[chartStyleOf(theme)]}>
      <Segmented
        label="Bars and gauges"
        value={chartStyleOf(theme)}
        onChange={(chartStyle) => change({ theme: { chartStyle } }, "chart-style")}
        options={[{ value: "ticks", label: "Ticks" }, { value: "solid", label: "Solid" }, { value: "thin", label: "Thin" }, { value: "blocks", label: "Blocks" }, { value: "dots", label: "Dots" }]}
      />
    </Field>
  )
}

function WidgetFinishField() {
  const { theme, change } = useDesign()
  return (
    <Field id="widget-finish" label="Finish" hint={{ none: "Nothing extra", corners: "Small brackets on each widget's corners", grid: "A field of small crosses behind the widgets" }[widgetFinishOf(theme)]}>
      <Segmented
        label="Finish"
        value={widgetFinishOf(theme)}
        onChange={(widgetFinish) => change({ theme: { widgetFinish } }, "widget-finish")}
        options={[{ value: "none", label: "None" }, { value: "corners", label: "Corners" }, { value: "grid", label: "Grid" }]}
      />
    </Field>
  )
}

function HeaderFormField() {
  const { theme, change } = useDesign()
  return (
    <Field id="header-form" label="Widget names" hint={{ top: "Icon, name and value on top", label: "A small label line, no icon", caption: "Under the content, like a caption", tag: "The icon in a tile, the name in a pill", path: "Section / name, a fine line under it" }[headerFormOf(theme)]}>
      <Segmented
        label="Widget names"
        value={headerFormOf(theme)}
        onChange={(headerForm) => change({ theme: { headerForm } }, "header-form")}
        options={[{ value: "top", label: "Top" }, { value: "label", label: "Label" }, { value: "caption", label: "Caption" }, { value: "tag", label: "Tag" }, { value: "path", label: "Path" }]}
      />
    </Field>
  )
}

function BackgroundField() {
  const { theme, change } = useDesign()
  return (
    <div data-field="background">
      <BackgroundControl theme={theme} onChange={(patch, key) => change({ theme: patch }, key)} />
    </div>
  )
}

/* ---------- Menu ---------- */

function NavLayoutField() {
  const { theme, change } = useDesign()
  return (
    <Field id="nav-layout" label="Menu position">
      <Segmented
        label="Menu position"
        value={theme.nav.layout}
        onChange={(layout) => change({ theme: { nav: { layout } } }, "nav-layout")}
        options={[
          { value: "side", label: "Side" },
          { value: "top", label: "Top" },
        ]}
      />
    </Field>
  )
}

function NavStyleField() {
  const { theme, change } = useDesign()
  return (
    <Field id="nav-style" label="Menu items">
      <Segmented
        label="Menu items"
        value={theme.nav.style}
        onChange={(style) => change({ theme: { nav: { style } } }, "nav-style")}
        options={[
          { value: "labels", label: "Icons and names" },
          { value: "icons", label: "Icons only" },
        ]}
      />
    </Field>
  )
}

function NavFrameField() {
  const { theme, change } = useDesign()
  return (
    <Field id="nav-frame" label="Menu frame" hint={theme.nav.frame === "floating" ? "Pages float on the menu's colour" : "Menu and page are one surface"}>
      <Segmented
        label="Menu frame"
        value={theme.nav.frame ?? "classic"}
        onChange={(frame) => change({ theme: { nav: { frame } } }, "nav-frame")}
        options={[
          { value: "classic", label: "Classic" },
          { value: "floating", label: "Floating" },
        ]}
      />
    </Field>
  )
}

/** The menu's background: the page colour (as it is), a wash of the brand, the brand colour, or nothing. Brand only when its text reads on it. */
function NavFillField() {
  const { theme, change } = useDesign()
  const now = navFillOf(theme)
  const options: { value: NavFill; label: string; hint: string }[] = [
    { value: "page", label: "Page", hint: "The same colour as the page" },
    { value: "tint", label: "Tinted", hint: "A light wash of your brand colour" },
    ...(brandMenuReads(theme) ? [{ value: "brand" as const, label: "Brand", hint: "Your brand colour, with text that reads on it" }] : []),
    { value: "clear", label: "Clear", hint: "No fill and no line: the page background shows through" },
  ]
  return (
    <Field id="nav-fill" label="Menu background">
      <Segmented label="Menu background" value={now} onChange={(fill) => change({ theme: { nav: { fill } } }, "nav-fill")} options={options} />
    </Field>
  )
}

/** The open page's marker in the menu, drawn on a small menu: Soft, Pill, Brand, Rail or Editorial. */
const MARKERS: { value: NavMarker; label: string }[] = [
  { value: "soft", label: "Soft" },
  { value: "pill", label: "Pill" },
  { value: "brand", label: "Brand" },
  { value: "rail", label: "Rail" },
  { value: "editorial", label: "Editorial" },
]
const markerLine: Record<NavMarker, string> = {
  soft: "rounded-[3px] bg-[color-mix(in_oklab,var(--a-ink)_15%,transparent)]",
  pill: "rounded-full bg-[color-mix(in_oklab,var(--a-accent)_25%,transparent)]",
  brand: "rounded-[3px] bg-[var(--a-accent)]",
  rail: "rounded-r-[3px] border-l-2 border-[var(--a-accent)] bg-transparent",
  editorial: "rounded-none border-b border-[color-mix(in_oklab,var(--a-ink)_50%,transparent)] bg-transparent",
}
function NavMarkerField() {
  const { theme, change } = useDesign()
  const now = theme.nav.marker ?? "soft"
  // The little menus are drawn in the draft's own colours (light or dark), not the editor's.
  const v = themeVars(theme) as Record<string, string>
  const well = { "--a-ink": v["--foreground"], "--a-accent": v["--brand-mark"] ?? v["--primary"], backgroundColor: v["--background"] } as React.CSSProperties
  return (
    <div data-field="nav-marker" className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Menu style">
      {MARKERS.map((m) => (
        <button key={m.value} type="button" role="radio" aria-checked={now === m.value} onClick={() => change({ theme: { nav: { marker: m.value } } }, "nav-marker")} className={cn("grid gap-1.5 p-1.5 text-left", card(now === m.value))}>
          <span style={well} className="grid aspect-[16/10] content-center gap-1.5 rounded-[4px] px-3 ring-1 ring-black/10">
            <span className="h-1.5 w-3/4 rounded-full bg-[color-mix(in_oklab,var(--a-ink)_20%,transparent)]" />
            <span className={cn("h-2.5 w-full", markerLine[m.value])} />
            <span className="h-1.5 w-2/3 rounded-full bg-[color-mix(in_oklab,var(--a-ink)_20%,transparent)]" />
          </span>
          <span className="px-0.5 text-xs font-medium">{m.label}</span>
        </button>
      ))}
    </div>
  )
}

function NavSearchField() {
  const { theme, change } = useDesign()
  return (
    <Field id="nav-search" label="Search in the menu">
      <Segmented
        label="Search in the menu"
        value={theme.nav.search === false ? "no" : "yes"}
        onChange={(v) => change({ theme: { nav: { search: v === "yes" } } }, "nav-search")}
        options={[
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ]}
      />
    </Field>
  )
}

function NavSignOutField() {
  const { theme, change } = useDesign()
  return (
    <Field id="nav-signout" label="Log out" hint={theme.nav.signOut === "menu" ? "A row at the foot of the side menu, and in the account menu" : "In the account menu, under the avatar"}>
      <Segmented
        label="Log out"
        value={theme.nav.signOut ?? "account"}
        onChange={(signOut) => change({ theme: { nav: { signOut } } }, "nav-signout")}
        options={[
          { value: "account", label: "Account menu" },
          { value: "menu", label: "In the menu" },
        ]}
      />
    </Field>
  )
}

/** A picture on the menu: the library's, or the coach's own, with how much of the menu colour covers it. */
function NavImageField() {
  const { theme, change } = useDesign()
  const file = useRef<HTMLInputElement>(null)
  const image = theme.nav.image
  const uploaded = image && !image.startsWith("preset:") ? image : undefined
  const set = (patch: Partial<CoachTheme["nav"]>, key: string) => change({ theme: { nav: patch } }, key)
  return (
    <Field id="nav-image" label="Menu image">
      <div className="grid gap-3">
        <div className="grid grid-cols-3 gap-2">
          {BACKDROPS.map((b) => (
            <button key={b.id} type="button" onClick={() => set({ image: `preset:${b.id}` }, "nav-image")} aria-pressed={image === `preset:${b.id}`} className={cn("grid gap-1 p-1 text-left text-[0.6875rem]", card(image === `preset:${b.id}`))}>
              <span className="aspect-[4/3] rounded-[4px] bg-[#0b0c10] ring-1 ring-white/10" style={{ backgroundImage: b.css, backgroundSize: "cover", backgroundPosition: "center" }} />
              <span className="truncate px-0.5 text-muted-foreground">{b.name}</span>
            </button>
          ))}
          <button type="button" onClick={() => file.current?.click()} aria-pressed={!!uploaded} className={cn("grid gap-1 p-1 text-left text-[0.6875rem]", card(!!uploaded))}>
            <span className="grid aspect-[4/3] place-items-center rounded-[4px] border border-dashed bg-cover bg-center" style={uploaded ? { backgroundImage: `url("${uploaded}")` } : undefined}>
              {!uploaded && <ImagePlus className="size-4 text-muted-foreground" />}
            </span>
            <span className="truncate px-0.5 text-muted-foreground">{uploaded ? "Yours" : "Upload"}</span>
          </button>
        </div>
        <input
          ref={file}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ""
            if (!f) return
            try {
              set({ image: await pictureFrom(f, { max: 800, side: "width", quality: 0.8, keep: [] }) }, "nav-image")
            } catch (err) {
              toast.error((err as Error).message)
            }
          }}
        />
        {image && (
          <>
            <SliderField label="Image covered by" value={Math.max(NAV_MIN_DIM, theme.nav.imageDim ?? 80)} min={NAV_MIN_DIM} max={95} unit="%" onChange={(imageDim) => set({ imageDim }, "nav-image-dim")} />
            <button type="button" onClick={() => set({ image: undefined, imageDim: undefined }, "nav-image")} className="flex h-7 w-fit items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <X className="size-3.5" /> No image
            </button>
          </>
        )}
      </div>
    </Field>
  )
}

function NavLogoField() {
  const { theme, change } = useDesign()
  if (theme.nav.layout !== "top") return null
  return (
    <Field id="nav-logo" label="Logo position">
      <Segmented
        label="Logo position"
        value={theme.nav.logo}
        onChange={(logo) => change({ theme: { nav: { logo } } }, "nav-logo")}
        options={[
          { value: "left", label: "Left" },
          { value: "center", label: "Centre" },
        ]}
      />
    </Field>
  )
}

/**
 * One menu item: rename it, move it, switch it off. `home` can only be renamed. In Design's sortable list a row
 * moves by its handle (menu-sort.tsx); elsewhere (no handle) by its arrows.
 */
function MenuRow({ id }: { id: string }) {
  const { coach, change, openPage } = useDesign()
  const sort = useSort()
  /** The way to the page itself: a pencil that opens it on the canvas, to arrange and edit its widgets. */
  const edit = (page: string, name: string) =>
    openPage && (
      <Button variant="ghost" size="icon" style={{ width: 36, height: 36 }} className="size-9 shrink-0 bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] hover:bg-[color-mix(in_oklab,var(--foreground)_12%,transparent)]" aria-label={`Edit the ${name} page`} title={`Edit the ${name} page`} onClick={() => openPage(page)}>
        <Pencil className="size-[1.125rem]" />
      </Button>
    )
  if (id === "home")
    return (
      <div data-field="menu-home" className={cn(menuRow(), "gap-2.5 py-1.5 pr-1.5")}>
        <FixedFirst />
        <Input className="h-9 min-w-0 flex-1" value={coach.wording.home} onChange={(e) => change({ content: { wording: { home: e.target.value } } }, "w-home")} aria-label="Name for Home" />
        {edit("home", "Home")}
      </div>
    )
  if (isPageId(id)) return <PageRow id={id} />
  const m = id as ModuleId
  const i = coach.menu.indexOf(m)
  if (i < 0) return null
  return (
    <div data-field={`menu-${m}`} className={cn(menuRow(!coach.modules[m]), "gap-2.5 py-1.5 pr-1.5", !sort && "pl-2.5")}>
      <SortHandle />
      <Input
        className={cn("h-9 min-w-0 flex-1", HIDDEN_INPUT)}
        value={coach.wording[m]}
        disabled={!coach.modules[m]}
        onChange={(e) => change({ content: { wording: { [m]: e.target.value } } }, `w-${m}`)}
        aria-label={`Name for ${MODULE_NAMES[m]}`}
        // A renamed page keeps its own name in the tooltip, so "Desk" still reads as Charts.
        title={MODULE_NAMES[m]}
        placeholder={MODULE_NAMES[m]}
      />
      <div className="flex shrink-0 items-center gap-2">
        {coach.modules[m] && edit(m, MODULE_NAMES[m])}
        {!sort && (
          <>
            <Button variant="ghost" size="icon-xs" disabled={i === 0} aria-label={`Move ${MODULE_NAMES[m]} up`} onClick={() => change({ content: { menu: move(coach.menu, i, -1) } }, `menu-${Date.now()}`)}>
              <ArrowUp />
            </Button>
            <Button variant="ghost" size="icon-xs" disabled={i === coach.menu.length - 1} aria-label={`Move ${MODULE_NAMES[m]} down`} onClick={() => change({ content: { menu: move(coach.menu, i, 1) } }, `menu-${Date.now()}`)}>
              <ArrowDown />
            </Button>
          </>
        )}
        <Switch size="sm" className={cn("ml-1.5", SWITCH_OFF)} checked={coach.modules[m]} aria-label={`Show ${MODULE_NAMES[m]}`} onCheckedChange={(on) => change({ content: { modules: { [m]: on } } }, `mod-${m}`)} />
      </div>
    </div>
  )
}

function MenuItemsField() {
  const { coach } = useDesign()
  return (
    <div className="grid gap-1.5">
      <SortHint />
      <MenuRow id="home" />
      <SortableMenu
        items={coach.menu}
        nameOf={(m) => (isPageId(m) ? (coach.customPages?.find((p) => `page:${p.id}` === m)?.name ?? "Page") : coach.wording[m as ModuleId])}
        row={(m) => <MenuRow id={m} />}
      />
      <AddPageButton />
    </div>
  )
}

function WordingField() {
  const { coach, change } = useDesign()
  return (
    <div data-field="wording" className="grid gap-4">
      <Field label="Your students are called">
        <div className="grid grid-cols-2 gap-2">
          <Input value={coach.wording.student} onChange={(e) => change({ content: { wording: { student: e.target.value } } }, "w-student")} aria-label="Singular" />
          <Input value={coach.wording.students} onChange={(e) => change({ content: { wording: { students: e.target.value } } }, "w-students")} aria-label="Plural" />
        </div>
      </Field>
      <Field label="A lesson is called">
        <Input value={coach.wording.lesson} onChange={(e) => change({ content: { wording: { lesson: e.target.value } } }, "w-lesson")} />
      </Field>
    </div>
  )
}

const FIELDS: Record<string, () => React.ReactNode> = {
  template: TemplateField,
  name: NameField,
  logo: LogoField,
  primary: PrimaryField,
  highlight: HighlightField,
  trading: TradingColoursField,
  mode: ModeField,
  fonts: FontsField,
  "heading-weight": HeadingWeightField,
  labels: LabelsField,
  corners: CornersField,
  buttons: ButtonsField,
  shadows: ShadowsField,
  borders: BordersField,
  density: DensityField,
  background: BackgroundField,
  "chart-style": ChartStyleField,
  "header-form": HeaderFormField,
  "widget-finish": WidgetFinishField,
  "nav-layout": NavLayoutField,
  "nav-style": NavStyleField,
  "nav-logo": NavLogoField,
  "nav-frame": NavFrameField,
  "nav-fill": NavFillField,
  "nav-marker": NavMarkerField,
  "nav-search": NavSearchField,
  "nav-image": NavImageField,
  "nav-signout": NavSignOutField,
  "menu-items": MenuItemsField,
  wording: WordingField,
}

/* ---------- Helpers ---------- */

/** Mini preview of a template, drawn with that template's real theme. */
function TemplateCard({ id, selected, primary, onSelect }: { id: TemplateId; selected: boolean; primary: string; onSelect: () => void }) {
  const t = { ...TEMPLATES[id].theme, primary, primaryForeground: onColor(primary) }
  const scope = `.tpl-${id}`
  return (
    <button
      onClick={onSelect}
      aria-pressed={selected}
      className={cn("grid gap-1.5 p-1 text-left", card(selected))}
    >
      <style dangerouslySetInnerHTML={{ __html: themeToCss(t, scope) }} />
      <span className={`tpl-${id} ${t.mode === "light" ? "light" : ""} grid aspect-[4/3] content-start gap-1.5 overflow-hidden rounded-[min(var(--radius),6px)] bg-background p-2 ring-1 ring-black/10`}>
        <span className="h-1.5 w-8 rounded-full bg-foreground/70" />
        <span className="grid gap-1 rounded-[min(var(--radius),6px)] bg-card p-1.5" style={{ boxShadow: "var(--card-shadow)" }}>
          <span className="h-1 w-10 rounded-full bg-foreground/40" />
          <span className="h-2 w-7 rounded-[var(--button-radius)] bg-primary" />
        </span>
      </span>
      <span className="px-0.5 text-[0.6875rem] font-medium">{TEMPLATES[id].name}</span>
    </button>
  )
}

export function move<T>(list: T[], i: number, by: number) {
  const next = [...list]
  const [item] = next.splice(i, 1)
  next.splice(i + by, 0, item)
  return next
}
