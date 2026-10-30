"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { heightOf } from "@/components/widgets/registry"
import { DEFAULT_WORDING, type Coach, type ModuleId } from "@/lib/data/coaches"
import { pageLayout } from "@/lib/theme/resolve"
import { TEMPLATES, TEMPLATE_IDS } from "@/lib/theme/templates"
import type { CoachTheme, TemplateId } from "@/lib/theme/types"
import type { PageId, PageLayout } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { card } from "./states"

/** Prototype builds only: the menu item and the route behind it are off in production. */
export const CAN_SAVE_TEMPLATE = process.env.NODE_ENV !== "production"

const MODULES = Object.keys(DEFAULT_WORDING).filter((k) => !["home", "student", "students", "lesson"].includes(k)) as ModuleId[]

/**
 * Prototype only: write the design on screen (unpublished changes included)
 * into one of the starting templates: the whole look, the Home, and every
 * page the coach has arranged. The coach's name, logo, words and menu stay
 * out. Writes src/lib/theme/template-data.json through /api/dev/templates.
 */
export function SaveTemplateDialog({ coach, theme, open, onOpenChange }: { coach: Coach; theme: CoachTheme; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [id, setId] = useState<TemplateId>(theme.template)
  const [name, setName] = useState(TEMPLATES[theme.template].name)
  const [blurb, setBlurb] = useState(TEMPLATES[theme.template].blurb)
  const [saving, setSaving] = useState(false)

  const choose = (t: TemplateId) => {
    setId(t)
    setName(TEMPLATES[t].name)
    setBlurb(TEMPLATES[t].blurb)
  }

  // Home always; module pages only once the coach has arranged them (otherwise they're just title and tool).
  const pages: Partial<Record<PageId, PageLayout>> = { home: pageLayout(coach, "home", theme.template, undefined, heightOf) }
  for (const m of MODULES) if (coach.pages?.[m]?.default) pages[m] = pageLayout(coach, m, theme.template, undefined, heightOf)
  const arranged = Object.keys(pages).filter((p) => p !== "home")

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/dev/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name, blurb, theme, pages }),
      })
      const out = await res.json()
      if (!res.ok) throw new Error(out.error ?? res.statusText)
      toast.success(`Saved to the ${name} template`, { description: `${out.widgets} widgets on ${out.pages.length} page${out.pages.length === 1 ? "" : "s"} · ${out.file}` })
      onOpenChange(false)
    } catch (e) {
      toast.error("Couldn't save the template", { description: e instanceof Error ? e.message : String(e) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Save as template</DialogTitle>
          <DialogDescription>Prototype only. Replaces a starting template with the design you see here, unpublished changes included. Git keeps the old version.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Template to replace</Label>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Template to replace">
              {TEMPLATE_IDS.map((t) => (
                <button
                  key={t}
                  role="radio"
                  aria-checked={id === t}
                  onClick={() => choose(t)}
                  className={cn("px-3 py-2 text-left text-sm", card(id === t))}
                >
                  <span className="block font-medium">{TEMPLATES[t].name}</span>
                  <span className="block text-xs text-muted-foreground">{t === theme.template ? "This design's base" : "Replace"}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tpl-name">Name</Label>
            <Input id="tpl-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tpl-blurb">One line about it</Label>
            <Textarea id="tpl-blurb" rows={2} value={blurb} onChange={(e) => setBlurb(e.target.value)} />
          </div>
          <div className="grid gap-1 rounded-lg bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">
            <span>
              <span className="font-medium text-foreground">Saved:</span> the look (colour, light/dark, greys for both modes and how they follow the brand, fonts, corners, depth, spacing, background, menu layout), the Home
              {arranged.length ? ` and ${arranged.length} arranged page${arranged.length === 1 ? "" : "s"} (${arranged.join(", ")})` : ""}.
            </span>
            <span>
              <span className="font-medium text-foreground">Not saved:</span> {coach.name}&rsquo;s name, logo, words and menu items, and per-tier layouts.
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || !name.trim()}>
            {saving ? "Saving…" : `Replace ${TEMPLATES[id].name}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
