"use client"

import Link from "next/link"
import { ExternalLink, LayoutDashboard } from "@/components/icons"
import { More } from "@/components/admin/design/controls"
import { DesignField, useDesign } from "@/components/admin/design/design-fields"
import type { TemplateId } from "@/lib/theme/types"
import { defaultHome } from "@/lib/widgets/layout"
import { Choice } from "./frame"
import type { StepProps } from "./wizard"

/**
 * The wizard's look steps show the Design workspace's own fields
 * (design-fields.tsx), editing the same draft, inside <WizardDesign>.
 */

/** "Open the full Design editor", with a way back to the same step. */
export function FullEditorLink({ slug, page = "design" }: { slug: string; page?: string }) {
  return (
    <Link href={`/admin/${slug}/${page}?from=setup`} className="flex w-fit items-center gap-1.5 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
      <ExternalLink className="size-3.5" /> Open the full {page === "design" ? "Design editor" : "Home builder"}
    </Link>
  )
}

// ---------- ONB-16 · Fonts & style

export function StyleStep({ community }: StepProps) {
  return (
    <div className="grid gap-7">
      <DesignField id="fonts" />
      <DesignField id="corners" />
      <More label="More style options">
        <DesignField id="heading-weight" />
        <DesignField id="labels" />
        <DesignField id="buttons" />
        <DesignField id="shadows" />
        <DesignField id="density" />
        <DesignField id="borders" />
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
  const { coach, theme, working, change } = useDesign()
  const current = coach.pages?.home?.default ? community.setup?.home : undefined
  const setHome = (id: TemplateId | undefined) => {
    // Home lives in the draft's pages, as in Design; "keep the template's" clears it there.
    const pages = { ...working.content.pages }
    if (id) pages.home = { default: defaultHome(id, coach) }
    else delete pages.home
    change({ content: { home: undefined, pages } }, "home")
    update({ home: undefined, setup: { ...community.setup, home: id } })
  }
  return (
    <div className="grid gap-5">
      <div className="grid gap-2" role="radiogroup" aria-label="Home layout">
        <Choice
          checked={!current}
          onClick={() => setHome(undefined)}
          title="Keep the template's Home"
          text="Made for the template you picked"
          icon={<LayoutDashboard className="size-4" />}
        />
        {HOMES.filter((h) => h.id !== theme.template).map((h) => (
          <Choice key={h.id} checked={current === h.id} onClick={() => setHome(h.id)} title={h.name} text={h.text} icon={<LayoutDashboard className="size-4" />} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">The preview on the right shows it with sample data. Move, resize and add widgets in the Home builder, any time.</p>
      <FullEditorLink slug={community.slug} page="design/home" />
    </div>
  )
}

// ---------- ONB-11 · Sections & menu (the extended module step uses these)

export function MenuOptions() {
  return (
    <More label="Menu order, position and more">
      <DesignField id="nav-layout" />
      <DesignField id="nav-style" />
      <DesignField id="nav-logo" />
      <DesignField id="menu-items" />
    </More>
  )
}
