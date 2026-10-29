"use client"

import { Check } from "@/components/icons"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { mono } from "@/components/onboarding/frame"
import { themeToCss } from "@/lib/theme/css"
import { onColor } from "@/lib/theme/derive"
import { TEMPLATES } from "@/lib/theme/templates"
import type { CoachTheme, TemplateId } from "@/lib/theme/types"
import { cn } from "@/lib/utils"
import { More, SliderField } from "./controls"
import { DesignField, useDesign } from "./design-fields"
import { DEPTH_NAMES, LOOKS, SPACING_NAMES, currentLook, depthOf, fromDepth, fromRoundness, fromSpacing, roundnessOf, spacingOf, type Look } from "./looks"
import { PaletteField } from "./palette-field"
import { CAN_SAVE_TEMPLATE } from "./save-template"

/**
 * The Design steps' panels, shared by the Design workspace and the setup
 * wizard (the wizard's first steps are these same panels).
 */
export function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-b px-4 pt-3.5 pb-5 last:border-b-0">
      {title && <h3 className="text-[0.6875rem] font-medium tracking-[0.06em] text-muted-foreground uppercase">{title}</h3>}
      {children}
    </section>
  )
}

/** Logo, name, colour and mode: the Brand step's settings. */
export function BrandFields() {
  return (
    <Section>
      <DesignField id="logo" />
      <DesignField id="name" />
      <DesignField id="primary" />
      <DesignField id="mode" />
      <More label="Second colour and trading colours">
        <DesignField id="highlight" />
        <DesignField id="trading" />
      </More>
    </Section>
  )
}

/** `suggested`: the template to mark "Fits you" (the first look on it). */
export function LookStep({ theme, suggested }: { theme: CoachTheme; suggested?: TemplateId }) {
  const { coach, change } = useDesign()
  const active = currentLook(theme)
  return (
    <>
      <Section>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Look">
          {LOOKS.map((l) => (
            <LookCard
              key={l.id}
              look={l}
              theme={theme}
              selected={active?.id === l.id}
              fits={!!suggested && l.id === LOOKS.find((x) => x.template === suggested)?.id}
              onSelect={() => {
                change({ theme: { template: l.template, ...l.set } }, "look")
                toast(`${l.name} look applied. Your colours and logo stay.`)
              }}
            />
          ))}
        </div>
        {!active && <p className="text-xs text-muted-foreground">Your own mix. Pick a look to start again from it.</p>}
      </Section>
      <Section title="Fine-tune">
        <SliderField
          id="corners"
          label="Roundness"
          value={roundnessOf(theme)}
          min={0}
          max={24}
          format={(r) => (r <= 3 ? "Sharp" : r >= 16 ? "Very round" : "Round")}
          onChange={(r) => change({ theme: fromRoundness(r) }, "roundness")}
        />
        <SliderField id="shadows" label="Depth" value={depthOf(theme)} min={0} max={2} format={(d) => DEPTH_NAMES[d]} onChange={(d) => change({ theme: fromDepth(d) }, "depth")} />
        <SliderField id="density" label="Spacing" value={spacingOf(theme)} min={0} max={2} format={(s) => SPACING_NAMES[s]} onChange={(s) => change({ theme: fromSpacing(s) }, "spacing")} />
        <DesignField id="widget-style" />
        <DesignField id="widget-set" />
        <DesignField id="card-surface" />
        <DesignField id="header-form" />
        <DesignField id="figure-style" />
        <DesignField id="chart-style" />
        <DesignField id="panel-style" />
        <DesignField id="star-style" />
        <DesignField id="widget-finish" />
        <DesignField id="widget-header" />
      </Section>
      <Section>
        <More label="Advanced">
          <DesignField id="fonts" />
          <DesignField id="heading-weight" />
          <DesignField id="widget-font" />
          <DesignField id="labels" />
          <DesignField id="buttons" />
          <DesignField id="effects" />
          <DesignField id="borders" />
          <DesignField id="background" />
          {CAN_SAVE_TEMPLATE && <PaletteField />}
          <p className="text-xs text-muted-foreground">
            Looks are built on three templates ({Object.values(TEMPLATES).map((t) => t.name).join(", ")}). {coach.name} is on {TEMPLATES[theme.template].name}.
          </p>
        </More>
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
      <Section>
        <More label="Menu layout">
          <DesignField id="nav-layout" />
          <DesignField id="nav-frame" />
          <DesignField id="nav-style" />
          <DesignField id="nav-logo" />
        </More>
        <More label="What you call things">
          <DesignField id="wording" />
        </More>
      </Section>
    </>
  )
}

/** A look as a small card drawn in that look, with the coach's own colour. */
export function LookCard({ look, theme, selected, fits, onSelect }: { look: Look; theme: CoachTheme; selected: boolean; fits?: boolean; onSelect: () => void }) {
  const t: CoachTheme = {
    ...TEMPLATES[look.template].theme,
    ...look.set,
    mode: theme.mode,
    primary: theme.primary,
    primaryForeground: onColor(theme.primary),
  }
  const cls = `tpl-look-${look.id}`
  return (
    <button
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "grid gap-1.5 rounded-[6px] border p-1.5 text-left outline-none hover:border-[#3a3a40] focus-visible:border-[var(--ts-interactive)]",
        selected && "border-[var(--ts-interactive)] hover:border-[var(--ts-interactive)]",
      )}
    >
      <style dangerouslySetInnerHTML={{ __html: themeToCss(t, `.${cls}`) }} />
      <span className={cn(cls, t.mode === "light" && "light", "grid aspect-[16/10] content-start gap-1.5 overflow-hidden rounded-[4px] bg-background p-2 text-foreground")}>
        <span className="text-base leading-none" style={{ fontFamily: "var(--coach-font-heading)", fontWeight: look.set.headingWeight }}>
          Aa
        </span>
        <span className="grid gap-1 rounded-[min(var(--radius),12px)] bg-card p-1.5" style={{ boxShadow: "var(--card-shadow)", border: look.set.borders ? "1px solid var(--border)" : undefined }}>
          <span className="h-1 w-10 rounded-full bg-foreground/40" />
          <span className="h-2.5 w-9 rounded-[var(--button-radius)] bg-primary" />
        </span>
      </span>
      <span className="grid px-0.5">
        <span className="flex items-center gap-1 text-xs font-medium">
          {look.name}
          {selected && <Check className="size-3 text-[var(--ts-interactive)]" />}
          {fits && (
            <Badge variant="outline" className={cn(mono, "ml-auto h-5 border-[var(--ts-interactive)]/50 text-[0.58rem] text-[var(--ts-interactive)]")}>
              Fits you
            </Badge>
          )}
        </span>
        <span className="truncate text-[0.6875rem] text-muted-foreground">{look.blurb}</span>
      </span>
    </button>
  )
}
