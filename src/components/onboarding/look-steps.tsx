"use client"

import Link from "next/link"
import { ArrowDown, ArrowUp, ExternalLink, LayoutDashboard } from "@/components/icons"
import { FONT_PAIRS } from "@/components/admin/design/options"
import { Field, More, Segmented } from "@/components/admin/design/controls"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import type { CustomCommunity } from "@/lib/data/communities"
import { FONT_LIBRARY, type FontId } from "@/lib/fonts"
import { resolveTheme } from "@/lib/theme/resolve"
import type { CoachTheme, TemplateId } from "@/lib/theme/types"
import { defaultHome } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { Choice } from "./frame"
import type { StepProps } from "./wizard"

type ThemePatch = Partial<Omit<CoachTheme, "nav" | "fonts">> & { nav?: Partial<CoachTheme["nav"]>; fonts?: Partial<CoachTheme["fonts"]> }

/** Wizard steps write the coach's design straight into the new community, like Design does into a draft. */
export function themeUpdater(community: CustomCommunity, update: StepProps["update"]) {
  const theme = resolveTheme(community)
  const set = (patch: ThemePatch) =>
    update({
      overrides: {
        ...community.overrides,
        ...patch,
        nav: patch.nav ? { ...theme.nav, ...patch.nav } : community.overrides.nav,
        fonts: patch.fonts ? { ...theme.fonts, ...patch.fonts } : community.overrides.fonts,
      } as CustomCommunity["overrides"],
    })
  return { theme, set }
}

/** "Open the full Design editor", with a way back to the same step. */
export function FullEditorLink({ slug, page = "design" }: { slug: string; page?: string }) {
  return (
    <Link href={`/admin/${slug}/${page}?from=setup`} className="flex w-fit items-center gap-1.5 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
      <ExternalLink className="size-3.5" /> Open the full {page === "design" ? "Design editor" : "Home builder"}
    </Link>
  )
}

// ---------- ONB-16 · Fonts & style

export function StyleStep({ community, update }: StepProps) {
  const { theme, set } = themeUpdater(community, update)
  const num = (v: number | readonly number[]) => (Array.isArray(v) ? v[0] : (v as number))

  return (
    <div className="grid gap-7">
      <Field label="Fonts">
        <div className="grid grid-cols-2 gap-2">
          {FONT_PAIRS.map((p) => {
            const on = theme.fonts.heading === p.heading && theme.fonts.body === p.body
            return (
              <button
                key={p.name}
                onClick={() => set({ fonts: { heading: p.heading, body: p.body, label: p.label } })}
                aria-pressed={on}
                className={cn("grid gap-1 rounded-[var(--radius)] border bg-card p-3 text-left hover:border-white/25", on && "border-[var(--ts-interactive)] hover:border-[var(--ts-interactive)]")}
              >
                <span className="text-2xl leading-none" style={{ fontFamily: FONT_LIBRARY[p.heading].css }}>
                  Aa
                </span>
                <span className="text-xs text-muted-foreground" style={{ fontFamily: FONT_LIBRARY[p.body].css }}>
                  {p.name} · {FONT_LIBRARY[p.heading].label}
                </span>
              </button>
            )
          })}
        </div>
      </Field>

      <Field label="Corners" hint={theme.radius <= 3 ? "Sharp" : theme.radius >= 16 ? "Very round" : "Round"}>
        <Slider value={[theme.radius]} min={0} max={24} step={1} onValueChange={(v) => set({ radius: num(v) })} aria-label="Corner roundness" />
      </Field>

      <More label="More style options">
        {(["heading", "body", "label"] as const).map((role) => (
          <Field key={role} label={role === "heading" ? "Headings" : role === "body" ? "Text" : "Small labels"}>
            <select
              value={theme.fonts[role]}
              onChange={(e) => set({ fonts: { [role]: e.target.value as FontId } })}
              className="h-9 rounded-[var(--radius)] border bg-card px-2 text-sm"
            >
              {Object.entries(FONT_LIBRARY).map(([id, f]) => (
                <option key={id} value={id}>
                  {f.label}
                </option>
              ))}
            </select>
          </Field>
        ))}
        <Field label="Buttons">
          <Segmented
            label="Button shape"
            value={theme.buttonShape}
            onChange={(buttonShape) => set({ buttonShape })}
            options={[
              { value: "square", label: <span className="h-4 w-8 rounded-[2px] bg-current opacity-70" /> },
              { value: "rounded", label: <span className="h-4 w-8 rounded-[5px] bg-current opacity-70" /> },
              { value: "pill", label: <span className="h-4 w-8 rounded-full bg-current opacity-70" /> },
            ]}
          />
        </Field>
        <Field label="Shadows">
          <Segmented
            label="Shadows"
            value={theme.shadow}
            onChange={(shadow) => set({ shadow })}
            options={[
              { value: "none", label: "None" },
              { value: "soft", label: "Soft" },
              { value: "strong", label: "Strong" },
            ]}
          />
        </Field>
        <Field label="Spacing">
          <Segmented
            label="Spacing"
            value={theme.density}
            onChange={(density) => set({ density })}
            options={[
              { value: "compact", label: "Compact" },
              { value: "comfortable", label: "Comfortable" },
              { value: "airy", label: "Airy" },
            ]}
          />
        </Field>
        <Field label="Heading weight">
          <Segmented
            label="Heading weight"
            value={theme.headingWeight}
            onChange={(headingWeight) => set({ headingWeight })}
            options={[
              { value: 400, label: "Light" },
              { value: 500, label: "Medium" },
              { value: 700, label: "Bold" },
            ]}
          />
        </Field>
        <Field label="Small labels">
          <Segmented
            label="Small labels"
            value={theme.labelStyle}
            onChange={(labelStyle) => set({ labelStyle })}
            options={[
              { value: "plain", label: "Normal" },
              { value: "caps", label: "UPPERCASE" },
            ]}
          />
        </Field>
        <label className="flex items-center justify-between gap-3 text-[0.8rem] font-medium">
          Outline on cards
          <Switch checked={theme.borders} onCheckedChange={(borders) => set({ borders })} />
        </label>
      </More>
      <FullEditorLink slug={community.slug} />
    </div>
  )
}

// ---------- ONB-17 · Home page

const HOMES: { id: TemplateId; name: string; text: string }[] = [
  { id: "terminal", name: "Trading desk", text: "Next live, journal and news up front" },
  { id: "atelier", name: "Calm", text: "Your welcome video and the next lesson" },
  { id: "pulse", name: "Community", text: "Results, ranking and Discord on top" },
]

export function HomeStep({ community, update }: StepProps) {
  const current = community.home?.default ? community.setup?.home : undefined
  return (
    <div className="grid gap-5">
      <div className="grid gap-2" role="radiogroup" aria-label="Home layout">
        <Choice
          checked={!current}
          onClick={() => update({ home: undefined, setup: { ...community.setup, home: undefined } })}
          title="Keep the template's Home"
          text="Made for the template you picked"
          icon={<LayoutDashboard className="size-4" />}
        />
        {HOMES.filter((h) => h.id !== community.template).map((h) => (
          <Choice
            key={h.id}
            checked={current === h.id}
            onClick={() => update({ home: { default: defaultHome(h.id, community) }, setup: { ...community.setup, home: h.id } })}
            title={h.name}
            text={h.text}
            icon={<LayoutDashboard className="size-4" />}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">The preview on the right shows it with sample data. Move, resize and add widgets in the Home builder, any time.</p>
      <FullEditorLink slug={community.slug} page="design/home" />
    </div>
  )
}

// ---------- ONB-11 · Sections & menu (the extended module step uses these)

export function MenuOptions({ community, update }: StepProps) {
  const { theme, set } = themeUpdater(community, update)
  const move = (i: number, by: number) => {
    const m = [...community.menu]
    const [x] = m.splice(i, 1)
    m.splice(i + by, 0, x)
    update({ menu: m })
  }
  return (
    <More label="Menu order, position and more">
      <Field label="Menu order">
        <div className="grid gap-1">
          {community.menu
            .filter((m) => community.modules[m])
            .map((m) => {
              const i = community.menu.indexOf(m)
              return (
                <div key={m} className="flex items-center gap-2 rounded-[var(--radius)] border bg-card px-3 py-1.5 text-sm">
                  <span className="flex-1">{community.wording[m]}</span>
                  <button disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${community.wording[m]} up`} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button disabled={i === community.menu.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${community.wording[m]} down`} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                    <ArrowDown className="size-3.5" />
                  </button>
                </div>
              )
            })}
        </div>
      </Field>
      <Field label="Menu position">
        <Segmented
          label="Menu position"
          value={theme.nav.layout}
          onChange={(layout) => set({ nav: { layout } })}
          options={[
            { value: "side", label: "Side" },
            { value: "top", label: "Top" },
          ]}
        />
      </Field>
      <Field label="Menu items">
        <Segmented
          label="Menu items"
          value={theme.nav.style}
          onChange={(style) => set({ nav: { style } })}
          options={[
            { value: "labels", label: "Icons and names" },
            { value: "icons", label: "Icons only" },
          ]}
        />
      </Field>
      {theme.nav.layout === "top" && (
        <Field label="Logo">
          <Segmented
            label="Logo position"
            value={theme.nav.logo}
            onChange={(logo) => set({ nav: { logo } })}
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Centre" },
            ]}
          />
        </Field>
      )}
      <Field label="Home is called">
        <input
          value={community.wording.home}
          onChange={(e) => update({ wording: { ...community.wording, home: e.target.value } })}
          className="h-9 rounded-[var(--radius)] border bg-card px-3 text-sm outline-none focus:border-[var(--ts-interactive)]"
        />
      </Field>
    </More>
  )
}
