"use client"

import { createContext, useContext, useRef, useState } from "react"
import { ArrowDown, ArrowUp, ImagePlus, Trash2, Wand2 } from "@/components/icons"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import type { Coach, ModuleId } from "@/lib/data/coaches"
import { FONT_LIBRARY, type FontId } from "@/lib/fonts"
import type { Overrides } from "@/lib/prototype-store"
import { themeToCss } from "@/lib/theme/css"
import { onColor } from "@/lib/theme/derive"
import { colorsFromLogo } from "@/lib/theme/logo-colors"
import { TEMPLATES, TEMPLATE_IDS } from "@/lib/theme/templates"
import { chartStyleOf, widgetStyleOf, type CoachTheme, type TemplateId } from "@/lib/theme/types"
import { cn } from "@/lib/utils"
import { BackgroundControl } from "./background-control"
import { Field, More, Segmented, SliderField, Swatches } from "./controls"
import { BRAND_COLORS, FONT_PAIRS, HIGHLIGHT_COLORS } from "./options"

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
              commit(
                {
                  content: working.content,
                  theme: { template: id, primary: theme.primary, primaryForeground: theme.primaryForeground, highlight: working.theme.highlight },
                },
                "template",
              )
            }
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Switching keeps your name, logo, colours and menu. Style and layout start from the new template.</p>
    </Field>
  )
}

function NameField() {
  const { coach, change } = useDesign()
  return (
    <Field id="name" label="Platform name">
      <Input value={coach.name} onChange={(e) => change({ content: { name: e.target.value } }, "name")} />
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
    const url = await new Promise<string>((res) => {
      const r = new FileReader()
      r.onload = () => res(r.result as string)
      r.readAsDataURL(file)
    })
    const small = await shrink(url, 256)
    onLogo(small)
    setSuggested(await colorsFromLogo(small))
  }

  return (
    <Field id="logo" label="Logo" hint="PNG or SVG, square">
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
          <span className="text-muted-foreground">Colours from your logo</span>
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
    <Field id="primary" label="Brand colour" hint="Buttons, links, active menu">
      <Swatches label="Brand colour" value={theme.primary} colors={BRAND_COLORS} onChange={(c) => change({ theme: { primary: c, primaryForeground: onColor(c) } }, "primary")} />
    </Field>
  )
}

function HighlightField() {
  const { theme, change } = useDesign()
  return (
    <Field id="highlight" label="Highlight colour" hint="Announcements, badges">
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
      <div className="grid grid-cols-2 gap-1.5">
        {FONT_PAIRS.map((p) => {
          const on = theme.fonts.heading === p.heading && theme.fonts.body === p.body
          return (
            <button
              key={p.name}
              onClick={() => change({ theme: { fonts: { heading: p.heading, body: p.body, label: p.label } } }, "fonts")}
              aria-pressed={on}
              className={cn("grid gap-1 rounded-[6px] border p-2.5 text-left hover:bg-muted", on && "border-[var(--ts-interactive)] hover:border-[var(--ts-interactive)]")}
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
            <select
              value={theme.fonts[role]}
              onChange={(e) => change({ theme: { fonts: { [role]: e.target.value as FontId } } }, `font-${role}`)}
              className="h-7 rounded-[4px] border bg-background px-2 text-xs"
            >
              {Object.entries(FONT_LIBRARY).map(([id, f]) => (
                <option key={id} value={id}>
                  {f.label}
                </option>
              ))}
            </select>
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

function EffectsField() {
  const { theme, change } = useDesign()
  return (
    <Field id="effects" label="Brand depth" hint="Tonal shift in brand cards">
      <Segmented
        label="Brand depth"
        value={theme.effects ?? "soft"}
        onChange={(effects) => change({ theme: { effects } }, "effects")}
        options={[
          { value: "flat", label: "Flat" },
          { value: "soft", label: "Subtle" },
          { value: "vivid", label: "Rich" },
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

function WidgetStyleField() {
  const { theme, change } = useDesign()
  return (
    <Field id="widget-style" label="Widget style" hint={{ instrument: "Mono figures, tick charts", soft: "Rounded, one surface", editorial: "Heading font, hairlines" }[widgetStyleOf(theme)]}>
      <Segmented
        label="Widget style"
        value={widgetStyleOf(theme)}
        onChange={(widgetStyle) => change({ theme: { widgetStyle } }, "widget-style")}
        options={[
          { value: "instrument", label: "Instrument" },
          { value: "soft", label: "Soft" },
          { value: "editorial", label: "Editorial" },
        ]}
      />
    </Field>
  )
}

function ChartStyleField() {
  const { theme, change } = useDesign()
  return (
    <Field id="chart-style" label="Bars and gauges" hint={{ ticks: "Segments, like an instrument", solid: "One filled bar", thin: "A fine line" }[chartStyleOf(theme)]}>
      <Segmented
        label="Bars and gauges"
        value={chartStyleOf(theme)}
        onChange={(chartStyle) => change({ theme: { chartStyle } }, "chart-style")}
        options={[
          { value: "ticks", label: "Ticks" },
          { value: "solid", label: "Solid" },
          { value: "thin", label: "Thin" },
        ]}
      />
    </Field>
  )
}

function CardSurfaceField() {
  const { theme, change } = useDesign()
  const surface = theme.cardSurface ?? "raised"
  return (
    <Field id="card-surface" label="Cards" hint={{ raised: "Cards stand on the page", grey: "Grey cards on the page colour", outline: "No fill, a fine outline" }[surface]}>
      <Segmented
        label="Cards"
        value={surface}
        onChange={(cardSurface) => change({ theme: { cardSurface } }, "card-surface")}
        options={[
          { value: "raised", label: theme.mode === "light" ? "White" : "Raised" },
          { value: "grey", label: "Grey" },
          { value: "outline", label: "Outline" },
        ]}
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

/** One menu item: rename it, move it, switch it off. `home` can only be renamed. */
function MenuRow({ id }: { id: string }) {
  const { coach, change } = useDesign()
  if (id === "home")
    return (
      <div data-field="menu-home" className="flex items-center gap-2 rounded-[6px] border p-1 pl-2.5">
        <span className="w-16 shrink-0 text-xs text-muted-foreground">Home</span>
        <Input className="h-6" value={coach.wording.home} onChange={(e) => change({ content: { wording: { home: e.target.value } } }, "w-home")} aria-label="Name for Home" />
        <span className="w-[4.25rem] shrink-0" />
      </div>
    )
  const m = id as ModuleId
  const i = coach.menu.indexOf(m)
  if (i < 0) return null
  return (
    <div data-field={`menu-${m}`} className={cn("flex items-center gap-2 rounded-[6px] border p-1 pl-2.5", !coach.modules[m] && "bg-muted/50")}>
      <span className={cn("w-16 shrink-0 truncate text-xs text-muted-foreground", !coach.modules[m] && "line-through")}>{MODULE_NAMES[m]}</span>
      <Input
        className="h-6"
        value={coach.wording[m]}
        disabled={!coach.modules[m]}
        onChange={(e) => change({ content: { wording: { [m]: e.target.value } } }, `w-${m}`)}
        aria-label={`Name for ${MODULE_NAMES[m]}`}
      />
      <div className="flex shrink-0 items-center">
        <Button variant="ghost" size="icon-xs" disabled={i === 0} aria-label={`Move ${MODULE_NAMES[m]} up`} onClick={() => change({ content: { menu: move(coach.menu, i, -1) } }, `menu-${Date.now()}`)}>
          <ArrowUp />
        </Button>
        <Button variant="ghost" size="icon-xs" disabled={i === coach.menu.length - 1} aria-label={`Move ${MODULE_NAMES[m]} down`} onClick={() => change({ content: { menu: move(coach.menu, i, 1) } }, `menu-${Date.now()}`)}>
          <ArrowDown />
        </Button>
        <Switch size="sm" className="ml-1" checked={coach.modules[m]} aria-label={`Show ${MODULE_NAMES[m]}`} onCheckedChange={(on) => change({ content: { modules: { [m]: on } } }, `mod-${m}`)} />
      </div>
    </div>
  )
}

function MenuItemsField() {
  const { coach } = useDesign()
  return (
    <div className="grid gap-1.5">
      <p className="text-xs text-muted-foreground">Rename, reorder or hide what students see. Hidden items disappear from the menu and Home.</p>
      <MenuRow id="home" />
      {coach.menu.map((m) => (
        <MenuRow key={m} id={m} />
      ))}
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
  mode: ModeField,
  fonts: FontsField,
  "heading-weight": HeadingWeightField,
  labels: LabelsField,
  corners: CornersField,
  buttons: ButtonsField,
  shadows: ShadowsField,
  effects: EffectsField,
  borders: BordersField,
  density: DensityField,
  background: BackgroundField,
  "widget-style": WidgetStyleField,
  "chart-style": ChartStyleField,
  "card-surface": CardSurfaceField,
  "nav-layout": NavLayoutField,
  "nav-style": NavStyleField,
  "nav-logo": NavLogoField,
  "nav-frame": NavFrameField,
  "menu-items": MenuItemsField,
  wording: WordingField,
}

/* ---------- Panels built from the fields ---------- */

/** Left panel: who you are. */
export function BrandKitPanel() {
  return (
    <>
      <Group title="Identity">
        <DesignField id="name" />
        <DesignField id="logo" />
      </Group>
      <Group title="Colours">
        <DesignField id="primary" />
        <DesignField id="highlight" />
        <DesignField id="mode" />
      </Group>
      <Group title="Starting point">
        <DesignField id="template" />
      </Group>
      <div className="m-4 rounded-[6px] border bg-card p-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Wand2 className="size-4" /> Want it to look exactly like your brand?
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Our designers can build your own design on top of these settings.</p>
        <Button variant="outline" size="sm" className="mt-2.5" onClick={() => toast("Design packages open from Settings → Our subscription.")}>
          See design packages
        </Button>
      </div>
    </>
  )
}

/** Left panel: the menu and the words students see. */
export function MenuPanel() {
  return (
    <>
      <Group title="Menu layout">
        <DesignField id="nav-layout" />
        <DesignField id="nav-frame" />
        <DesignField id="nav-style" />
        <DesignField id="nav-logo" />
      </Group>
      <Group title="Menu items">
        <DesignField id="menu-items" />
      </Group>
      <Group title="What you call things">
        <DesignField id="wording" />
      </Group>
    </>
  )
}

/** Inspector with nothing selected: the whole style, simple first. */
export function StylePanel() {
  return (
    <>
      <Group title="Type">
        <DesignField id="fonts" />
        <DesignField id="heading-weight" />
      </Group>
      <Group title="Shape">
        <DesignField id="corners" />
        <DesignField id="buttons" />
      </Group>
      <Group title="Depth">
        <DesignField id="shadows" />
        <DesignField id="effects" />
        <DesignField id="borders" />
      </Group>
      <Group title="Density">
        <DesignField id="density" />
      </Group>
      <Group title="Page">
        <DesignField id="background" />
        <More label="More style options">
          <DesignField id="labels" />
        </More>
      </Group>
    </>
  )
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
      className={cn("grid gap-1.5 rounded-[6px] p-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring", selected && "ring-1 ring-[var(--ts-interactive)]")}
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

function move<T>(list: T[], i: number, by: number) {
  const next = [...list]
  const [item] = next.splice(i, 1)
  next.splice(i + by, 0, item)
  return next
}

async function shrink(dataUrl: string, max: number) {
  if (dataUrl.startsWith("data:image/svg")) return dataUrl
  const img = new Image()
  img.src = dataUrl
  await img.decode()
  const s = Math.min(1, max / Math.max(img.width, img.height))
  const c = document.createElement("canvas")
  c.width = Math.round(img.width * s)
  c.height = Math.round(img.height * s)
  c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height)
  return c.toDataURL("image/png")
}
