"use client"

import Link from "next/link"
import { useState } from "react"
import { ExternalLink, LayoutDashboard } from "@/components/icons"
import { Field, Segmented } from "@/components/admin/design/controls"
import { useDesign } from "@/components/admin/design/design-fields"
import { LookCards } from "@/components/admin/design/design-steps"
import { designTabs, SettingsPanel, without } from "@/components/admin/design/settings-panel"
import { useAccount } from "@/lib/data/use-communities"
import type { TemplateId } from "@/lib/theme/types"
import { getWidget, heightFor } from "@/components/widgets/registry"
import { pageLayout } from "@/lib/theme/resolve"
import { defaultHome, withDetail, type Detail, type WidgetInstance } from "@/lib/widgets/layout"
import { Choice } from "./frame"
import { suggestedTemplate } from "./suggest"
import type { StepProps } from "./wizard"

/**
 * Parts of the wizard's Pages step, and the link to the full Design editor.
 * The Brand, Look and Menu steps use the Design workspace's own panels
 * (design-steps.tsx, settings-panel.tsx), editing the same draft, inside <WizardDesign>.
 */

/**
 * A link to the full Design editor, with a way back to setup. `query` picks the
 * step it opens on (e.g. "step=look"); `href` replaces the whole link.
 */
export function FullEditorLink({ slug, query, href, label = "Open the full Design editor" }: { slug: string; query?: string; href?: string; label?: string }) {
  return (
    <Link href={href ?? `/admin/${slug}/design?${query ? `${query}&` : ""}from=setup`} className="flex w-fit items-center gap-1.5 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
      <ExternalLink className="size-3.5" /> {label}
    </Link>
  )
}

// ---------- ONB-16 · Look (the looks, with the one that fits marked, then the Design editor's own fine-tune sections)

/** The theme sections of the Design editor, for fine-tuning a look here the same way. */
const FINE_TUNE = designTabs({}, ["type", "shape", "widgets", "page"])

export function LookPanel({ community }: StepProps) {
  const { working, commit } = useDesign()
  const acc = useAccount()
  const [tab, setTab] = useState("type")
  return (
    <div className="-mx-4 -mt-5 md:-mx-5">
      <LookCards suggested={suggestedTemplate(acc?.answers)} />
      <div className="px-4 pt-4 pb-2 text-[0.6875rem] font-medium tracking-[0.06em] text-muted-foreground uppercase md:px-5">Fine-tune</div>
      <div className="flex h-[30rem] border-y">
        <SettingsPanel tabs={FINE_TUNE} tab={tab} onTab={setTab} draft={working.theme} onReset={(keys) => commit({ ...working, theme: without(working.theme, keys) }, "reset")} />
      </div>
      <div className="px-4 py-5 md:px-5">
        <FullEditorLink slug={community.slug} query="step=look" />
      </div>
    </div>
  )
}

// ---------- ONB-17 · Pages (the Home page)

const HOMES: { id: TemplateId; name: string; text: string }[] = [
  { id: "terminal", name: "Trading desk", text: "Next live, journal and news up front" },
  { id: "atelier", name: "Calm", text: "Your welcome video and the next lesson" },
  { id: "pulse", name: "Community", text: "Results, ranking and Discord on top" },
]

const DETAILS: { value: Detail; label: string; hint: string }[] = [
  { value: "compact", label: "Compact", hint: "Just the one essential thing per widget: calm and quick to read." },
  { value: "standard", label: "Standard", hint: "The main figure with its chart or list." },
  { value: "detailed", label: "Detailed", hint: "Everything each widget can show. Widgets grow taller to fit." },
]

/** Extra rows a widget needs at a Detail (Detailed adds rows; Compact and Standard share a height). */
const growFor = (w: WidgetInstance, to: Detail) => {
  const def = getWidget(w.type)
  return def ? heightFor(def, w.variant, to) - heightFor(def, w.variant, w.detail) : 0
}

export function HomeStep({ community, update }: StepProps) {
  const { coach, theme, working, change } = useDesign()
  const current = community.setup?.home
  const detail = community.setup?.detail ?? "standard"
  /**
   * Home lives in the draft's pages, as in Design. It's rebuilt from the
   * chosen layout each time, then given the chosen Detail; "the template's
   * Home" at Standard clears it, so Home keeps following the template.
   */
  const apply = (home: TemplateId | undefined, d: Detail) => {
    const pages = { ...working.content.pages }
    if (!home && d === "standard") delete pages.home
    else {
      const base = home ? defaultHome(home, coach) : pageLayout({ ...coach, pages: { ...coach.pages, home: undefined } }, "home", theme.template)
      pages.home = { default: d === "standard" ? base : withDetail(base, d, growFor) }
    }
    change({ content: { home: undefined, pages } }, "home")
    update({ home: undefined, setup: { ...community.setup, home, detail: d } })
  }
  return (
    <div className="grid gap-6">
      <div className="grid gap-2" role="radiogroup" aria-label="Home layout">
        <Choice checked={!current} onClick={() => apply(undefined, detail)} title="Keep the template's Home" text="Made for the template you picked" icon={<LayoutDashboard className="size-4" />} />
        {HOMES.filter((h) => h.id !== theme.template).map((h) => (
          <Choice key={h.id} checked={current === h.id} onClick={() => apply(h.id, detail)} title={h.name} text={h.text} icon={<LayoutDashboard className="size-4" />} />
        ))}
      </div>
      <Field id="widget-detail" label="How much each widget shows" hint="Per widget later, in Design">
        <Segmented label="How much each widget shows" value={detail} options={DETAILS.map(({ value, label }) => ({ value, label }))} onChange={(d) => apply(current, d)} />
        <p className="text-xs text-muted-foreground">{DETAILS.find((o) => o.value === detail)?.hint}</p>
      </Field>
      <p className="text-xs text-muted-foreground">The preview on the right shows it with sample data. Move, resize and add widgets in the Home builder, any time.</p>
      <FullEditorLink slug={community.slug} href={`/admin/${community.slug}/design?step=pages&from=setup`} label="Open Design → Pages" />
    </div>
  )
}
