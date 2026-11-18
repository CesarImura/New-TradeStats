"use client"

import { RotateCcw } from "@/components/icons"
import { toast } from "sonner"
import type { Mode, TemplateId } from "@/lib/theme/types"
import { cn } from "@/lib/utils"
import { Field, More } from "../fields/controls"
import { PillSegmented, SelectionCard } from "../fields/choice-cards"
import { DesignField, useDesign } from "../fields/design-fields"
import { type Look } from "../looks"
import { LAYOUTS, THEMES, layoutOf, layoutPatch, looksOf, lookPatch, matchLook } from "../presets"
import { PaletteField } from "../fields/palette-field"
import { CAN_SAVE_TEMPLATE } from "./save-template"
import { useConfirmSwitch } from "./switch-look"
import { SECTION_LABEL } from "../panels/settings-panel"

/**
 * Design's own panels (brand, looks, menu), shared by the Design workspace
 * and the setup wizard; the theme's settings are in settings-panel.tsx.
 */
export function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    // minmax(0,1fr): a grid track never grows past the panel to fit a long word or a truncated line (they shrink instead).
    // The same block as the theme's groups (settings-panel.tsx): hairline on top, the same padding and title.
    <section className="grid grid-cols-[minmax(0,1fr)] gap-3 border-t border-a-border-subtle px-5 pt-6 pb-6">
      {title && <h3 className={cn(SECTION_LABEL, "flex h-6 items-center")}>{title}</h3>}
      {children}
    </section>
  )
}

/**
 * Theme (Figma Editor · 2 Style · 02-06): Dark or Light on top, the three themes as the setup shows them (Terminal,
 * Atelier, Pulse), then the theme's two variations. A theme sets the personality only (fonts, corners, buttons,
 * shadow, borders, labels, heading weight, widget style): colours, logo, menu, spacing and background stay. When
 * the coach changes one of those by hand the theme shows "Custom" with Reset; switching theme then asks first.
 */
export function ThemeTab() {
  const { theme, change, undo } = useDesign()
  const [ask, dialog] = useConfirmSwitch()
  const look = matchLook(theme)
  const custom = !look
  const variations = looksOf(theme.template)
  const apply = (l: Look, said: string) => {
    change({ theme: lookPatch(l) }, "look")
    toast(`${said} applied. Your colours and logo stay.`, undo ? { action: { label: "Undo", onClick: undo } } : undefined)
  }
  const pick = (id: TemplateId) => {
    if (id === theme.template) return
    const first = looksOf(id)[0]
    // Only a design the coach tuned by hand would be lost: then it asks (and keeps the old one in Earlier versions).
    ask(THEMES.find((t) => t.id === id)!.name, () => apply(first, THEMES.find((t) => t.id === id)!.name), custom)
  }
  return (
    <>
      <Section>
        <div className="flex h-6 items-center gap-2">
          <h3 className={SECTION_LABEL}>Theme</h3>
          {custom && <span aria-label="changed" className="size-1.5 rounded-full bg-a-accent-strong" />}
          <span className="flex-1" />
          {custom && (
            <button
              type="button"
              onClick={() => apply(variations[0], variations[0].name)}
              className="flex h-6 items-center gap-1 rounded-md px-1.5 t-caption text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-a-border-focus"
            >
              <RotateCcw className="size-3" /> Reset
            </button>
          )}
        </div>
        {custom && <p className="t-caption text-a-text-3">Your own mix. Pick a theme to start again from it.</p>}
        <Field id="mode" label="Mode" inline>
          <PillSegmented<Mode>
            label="Light or dark"
            value={theme.mode}
            onChange={(mode) => change({ theme: { mode } }, "mode")}
            options={[
              { value: "dark", label: "Dark" },
              { value: "light", label: "Light" },
            ]}
            className="[&>button]:w-[54px] [&>button]:px-0"
          />
        </Field>
        <div role="radiogroup" aria-label="Theme" className="grid gap-2" data-field="template">
          {THEMES.map((t) => (
            <SelectionCard key={t.id} checked={theme.template === t.id} onSelect={() => pick(t.id)} title={t.name} description={t.summary} img={t.img} imgClass="aspect-[147/100]" radius="rounded-a-md" />
          ))}
        </div>
        <Field id="look" label="Variation" hint={look ? look.blurb : "Your own mix"}>
          <div role="radiogroup" aria-label="Variation" className="flex flex-wrap gap-2">
            {variations.map((l) => (
              <button
                key={l.id}
                type="button"
                role="radio"
                aria-checked={look?.id === l.id}
                onClick={() => look?.id !== l.id && apply(l, l.name)}
                className={cn(
                  "h-9 rounded-full border px-4 t-body-m outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-a-border-focus",
                  look?.id === l.id ? "border-a-border-active bg-a-raised text-a-text" : "border-a-border text-a-text-2 hover:border-a-border-strong hover:text-a-text",
                )}
              >
                {l.name}
              </button>
            ))}
          </div>
        </Field>
        {dialog}
      </Section>
      {/* A tool for the team (saving templates and the template's greys), apart from the themes. */}
      {CAN_SAVE_TEMPLATE && (
        <Section>
          <PaletteField />
        </Section>
      )}
    </>
  )
}

/**
 * Layout (Figma Editor · 2 Style · 08): the four ready-made layouts of the setup, then the same four settings in
 * detail. Spacing belongs here, not to the theme. Changing a detail leaves no layout marked: "Custom".
 */
export function LayoutTab() {
  const { theme, change } = useDesign()
  const active = layoutOf(theme)
  return (
    <>
      <Section>
        <div className="flex h-6 items-center gap-2">
          <h3 className={SECTION_LABEL}>Layout</h3>
          {!active && <span aria-label="changed" className="size-1.5 rounded-full bg-a-accent-strong" />}
        </div>
        {!active && <p className="t-caption text-a-text-3">Your own layout. Pick one to start again from it.</p>}
        <div role="radiogroup" aria-label="Layout" className="grid gap-2" data-field="layout">
          {LAYOUTS.map((l) => (
            <SelectionCard key={l.id} checked={active === l.id} onSelect={() => active !== l.id && change({ theme: layoutPatch(l, theme) }, "layout")} title={l.name} description={l.text} img={l.img} imgClass="aspect-[236/100]" radius="rounded-a-md" />
          ))}
        </div>
      </Section>
      <Section title="Details">
        <DesignField id="nav-layout" />
        <DesignField id="nav-frame" />
        <DesignField id="layout-widgets" />
        <DesignField id="density" />
      </Section>
    </>
  )
}

export function MenuStep() {
  return (
    <>
      <Section>
        <DesignField id="menu-items" />
      </Section>
      <Section title="Menu style">
        <DesignField id="nav-marker" />
      </Section>
      <Section>
        <DesignField id="nav-search" />
        <DesignField id="nav-signout" />
      </Section>
      <Section>
        <More label="Menu style">
          <DesignField id="nav-style" />
          <DesignField id="nav-logo" />
        </More>
        <More label="Menu background">
          <DesignField id="nav-fill" />
          <DesignField id="nav-image" />
        </More>
        <More label="What you call things">
          <DesignField id="wording" />
        </More>
      </Section>
    </>
  )
}
