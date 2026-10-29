"use client"

import { Columns3, Download, LayoutTemplate, MoreHorizontal, Redo2, Shuffle, Undo2, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { DesignProvider } from "@/components/admin/design/design-fields"
import { Field, Segmented } from "@/components/admin/design/controls"
import { LookCards, Section } from "@/components/admin/design/design-steps"
import { designTabs, MENU_LOOK, Readability, ResetButton, SettingsPanel, THEME_GROUPS, without } from "@/components/admin/design/settings-panel"
import { getDemoCoach } from "@/lib/data/coaches"
import type { Overrides, ThemeDraft } from "@/lib/prototype-store"
import { auditTheme } from "@/lib/theme/contrast"
import { resolveCoach } from "@/lib/theme/resolve"
import { TEMPLATES, TEMPLATE_IDS } from "@/lib/theme/templates"
import { CAN_SAVE_TEMPLATE } from "@/components/admin/design/save-template"
import { toast } from "sonner"
import type { CoachTheme, Mode, TemplateId } from "@/lib/theme/types"
import { cn } from "@/lib/utils"
import { CONTROL_FOCUS } from "./lab-controls"
import { BASES, exportTheme, mergeDraft, resolveLab, saveTheme, setCompared, type LabThemeEntry, type LabThemes } from "./lab-themes"
import { DarkColoursField, EntryContext, shuffled } from "./theme-editor-fields"
import { MenuAction, PANEL, panelStyle, ThemeChip, useDismiss } from "./theme-switcher"

const coach = resolveCoach(getDemoCoach("northline")!)

const DARK_COLOURS = { title: "Dark mode", note: "Use other brand colours when the page is dark", fields: ["lab-dark"], keys: [], words: "dark mode night colours brand highlight" }

/** What a library theme starts from (its base) and the ready-made looks on top. */
function LookTab({ entry }: { entry: LabThemeEntry }) {
  return (
    <>
      <Section>
        <Field label="Starts from" hint="Your changes stay on top">
          <Segmented label="Starts from" value={entry.base} onChange={(b) => saveTheme({ ...entry, base: b })} options={BASES.map((b) => ({ value: b.id, label: b.label }))} />
        </Field>
      </Section>
      <LookCards templates={false} />
    </>
  )
}

const OWN = { "lab-dark": DarkColoursField }

/**
 * The shadcn tokens the Design editor's fields are drawn with, mapped onto
 * the library's own chrome, so the editor looks like the library and not
 * like the theme it edits. `:root:has(.lab-ui)` reaches the colour picker,
 * which opens outside the panel.
 */
export const labUiCss = (c: Record<string, string>, scope: string) => {
  const v = `--background:${c["--c-side"]};--foreground:${c["--c-t1"]};--card:${c["--c-bar"]};--card-foreground:${c["--c-t1"]};--popover:${c["--c-bar"]};--popover-foreground:${c["--c-t1"]};--muted:${c["--c-on"]};--muted-foreground:${c["--c-t2"]};--accent:${c["--c-on"]};--accent-foreground:${c["--c-t1"]};--border:${c["--c-hair"]};--input:${c["--c-hair"]};--ring:${c["--c-t2"]};--primary:${c["--c-t1"]};--primary-foreground:${c["--c-page"]};--secondary:${c["--c-on"]};--secondary-foreground:${c["--c-t1"]};--ts-interactive:${c["--c-t1"]};--radius:0.5rem;--coach-font-label:var(--ff-geist);--coach-font-body:var(--ff-geist);font-family:var(--ff-geist)`
  // The fields' boxes, chosen segment and slider track in the library's own ladder, so they read in light as well as dark.
  const ctl = `--ctl-box:${c["--c-page"]};--ctl-line:${c["--c-hair"]};--ctl-line-hover:${c["--c-t3"]};--ctl-on:${c["--c-bar"]};--ctl-on-shadow:0 0 0 1px ${c["--c-hair"]},0 1px 2px 0 rgb(0 0 0/0.1);--ctl-track:${c["--c-hair"]}`
  // Scoped by the page's light or dark class, so a style left from the server render (drawn in the other mode) can't win.
  return `:root:has(.${scope} .lab-ui){${v};${ctl}}.${scope} .lab-ui{${v};${ctl};color:var(--foreground)}`
}

/**
 * Edit a theme made in the library, live: the widgets beside it (see
 * ThemeStudio) show it as you change it, and it saves on every change. Undo and redo (⌘Z, ⇧⌘Z) step
 * through this session's changes; each group resets on its own.
 */
export function ThemeEditor({ entry, lab, mode, onClose, onCompare, onLayouts }: { entry: LabThemeEntry; lab: LabThemes; mode: Mode; onClose: () => void; onCompare: () => void; onLayouts: () => void }) {
  const [tab, setTab] = useState("brand")
  // This session's history, oldest first; `at` is the step shown.
  const [hist, setHist] = useState<{ steps: ThemeDraft[]; at: number; key: string | null; time: number }>({ steps: [entry.draft], at: 0, key: null, time: 0 })
  const draft = entry.draft
  const theme: CoachTheme = useMemo(() => resolveLab(entry, mode), [entry, mode])
  const checks = auditTheme(theme, { fixes: true })
  const fails = checks.filter((c) => !c.pass)

  const apply = (next: ThemeDraft, key: string | null) => {
    saveTheme({ ...entry, draft: next })
    setHist((h) => {
      const now = Date.now()
      // A slider drag or typing is one step: the same setting again within a moment replaces the last step.
      const merge = key !== null && key === h.key && now - h.time < 800 && h.at === h.steps.length - 1 && h.at > 0
      const base = h.steps.slice(0, h.at + (merge ? 0 : 1))
      return { steps: [...base, next], at: base.length, key, time: now }
    })
  }
  const step = (by: number) => {
    const at = hist.at + by
    if (at < 0 || at >= hist.steps.length) return
    saveTheme({ ...entry, draft: hist.steps[at] })
    setHist({ ...hist, at, key: null })
  }
  const ctx = useMemo(
    () => ({
      coach,
      theme,
      working: { theme: draft, content: {} } as Overrides,
      change: (patch: Partial<Overrides>, key: string) => patch.theme && apply(mergeDraft(draft, patch.theme), key),
      commit: (next: Overrides, key: string) => apply(mergeDraft({}, next.theme), key),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme, draft, hist],
  )

  // ⌘Z / ⇧⌘Z while the editor is open, unless typing in a field.
  const stepRef = useRef(step)
  useEffect(() => {
    stepRef.current = step
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest("input, textarea, select, [contenteditable]")
      if (typing || !(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return
      e.preventDefault()
      stepRef.current(e.shiftKey ? 1 : -1)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  const changes = Object.keys(draft).filter((k) => k !== "primaryForeground").length
  const baseName = BASES.find((b) => b.id === entry.base)?.label ?? entry.base
  // The same sections as the admin's Design; a library theme has no name, logo or pages of its own.
  const tabs = designTabs({
    brand: { blurb: "The brand colours. Name and logo belong to each coach.", groups: [THEME_GROUPS.colour[0], DARK_COLOURS, THEME_GROUPS.colour[1]] },
    look: { blurb: "What this theme starts from, and ready-made looks on top. Your colours stay.", content: <LookTab entry={entry} /> },
    menu: { blurb: "The menu's layout. It shows on the platform, not in this preview.", groups: [MENU_LOOK] },
    pages: {
      blurb: "Which widgets each page holds, and where.",
      content: (
        <div className="grid justify-items-start gap-3 px-4 py-5">
          <p className="text-[0.8125rem] text-muted-foreground">Pages are laid out in Layouts, and any layout shows in any theme.</p>
          <button type="button" onClick={onLayouts} className={cn("h-8 rounded-lg border px-3 text-[0.8125rem] text-foreground hover:bg-muted", CONTROL_FOCUS)}>
            Open Layouts
          </button>
        </div>
      ),
    },
  })

  return (
    <aside
      aria-label={`Edit ${entry.name}`}
      className="lab-ui flex h-[55svh] w-full shrink-0 flex-col border-t sm:h-auto sm:w-[23rem] sm:border-t-0 sm:border-l"
      style={{ borderColor: "var(--c-hair)", background: "var(--c-side)" }}
    >
      {/* Name and close; then history, readability and compare; then what it starts from. */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 border-b px-4 pt-3 pb-4" style={{ borderColor: "var(--c-hair)" }}>
        <div className="flex items-center gap-2">
          <ThemeChip entry={entry} mode={mode} size={28} />
          <input
            value={entry.name}
            onChange={(e) => saveTheme({ ...entry, name: e.target.value })}
            onBlur={(e) => !e.target.value.trim() && saveTheme({ ...entry, name: "Untitled theme" })}
            aria-label="Theme name"
            title="Rename"
            className="h-9 min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 text-[0.9375rem] font-medium outline-none hover:border-(--c-hair) focus:border-(--c-t3)"
          />
          <Icon label="Close the editor (Esc)" onClick={onClose}>
            <X className="size-4" />
          </Icon>
        </div>
        <div className="flex items-center gap-0.5">
          <Icon label="Undo (⌘Z)" onClick={() => step(-1)} disabled={hist.at === 0}>
            <Undo2 className="size-4" />
          </Icon>
          <Icon label="Redo (⇧⌘Z)" onClick={() => step(1)} disabled={hist.at >= hist.steps.length - 1}>
            <Redo2 className="size-4" />
          </Icon>

          <span className="min-w-0 flex-1 truncate pl-1.5 text-xs text-(--c-t3)">{changes ? `${changes} ${changes === 1 ? "change" : "changes"}` : "No changes"}</span>
          <Readability fails={fails} total={checks.length} />
          <ResetButton
            title={`Back to ${baseName}?`}
            text={`All ${changes} ${changes === 1 ? "change" : "changes"} to ${entry.name} go, and it looks like ${baseName} again. You can undo it (⌘Z).`}
            disabled={!changes}
            onReset={() => {
              apply({}, null)
              toast(`${entry.name} is back to ${baseName}`, { action: { label: "Undo", onClick: () => stepRef.current(-1) } })
            }}
          />
          <Icon label="Shuffle: a random look on top of this theme (your colours stay)" onClick={() => apply(mergeDraft(draft, shuffled(theme)), null)}>
            <Shuffle className="size-4" />
          </Icon>
          <MoreMenu
            entry={entry}
            baseName={baseName}
            onCompare={() => {
              setCompared([entry.id, entry.base])
              onCompare()
            }}
          />
        </div>
      </div>

      <EntryContext.Provider value={entry}>
        <DesignProvider value={ctx}>
          <SettingsPanel tabs={tabs} tab={tab} onTab={setTab} draft={draft} onReset={(keys) => apply(without(draft, keys), null)} own={OWN} />
        </DesignProvider>
      </EntryContext.Provider>
      <p className="border-t px-4 py-2.5 text-xs text-(--c-t3)" style={{ borderColor: "var(--c-hair)" }}>
        Saved in this browser · follows the light/dark switch
      </p>
    </aside>
  )
}

/** Less frequent actions: compare with the base, export, and write it into a template. */
function MoreMenu({ entry, baseName, onCompare }: { entry: LabThemeEntry; baseName: string; onCompare: () => void }) {
  const [open, setOpen] = useState(false)
  const [tpl, setTpl] = useState<TemplateId | null>(null)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(open, ref, () => (setOpen(false), setTpl(null)))
  const save = async (id: TemplateId) => {
    setSaving(true)
    try {
      const theme = resolveLab(entry, TEMPLATES[id].theme.mode)
      const res = await fetch("/api/dev/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, name: entry.name, theme, pages: TEMPLATES[id].pages }) })
      const out = await res.json()
      if (!res.ok) throw new Error(out.error ?? res.statusText)
      toast.success(`${entry.name} is now the ${TEMPLATES[id].name} template`, { description: `Its look, with ${TEMPLATES[id].name}'s pages · ${out.file}` })
      setOpen(false)
      setTpl(null)
    } catch (e) {
      toast.error("Couldn't save the template", { description: e instanceof Error ? e.message : String(e) })
    } finally {
      setSaving(false)
    }
  }
  return (
    <div ref={ref} className="relative">
      <Icon label="More" onClick={() => setOpen(!open)}>
        <MoreHorizontal className="size-4" />
      </Icon>
      {open && (
        <div role="menu" className={cn(PANEL, "top-10 right-0 w-64")} style={panelStyle}>
          {tpl ? (
            <div className="grid gap-2 p-2">
              <p className="text-sm">Replace the {TEMPLATES[tpl].name} template with this look?</p>
              <p className="text-[0.8125rem] text-(--c-t2)">Its pages stay. This writes the template file in the code (git keeps the old one), so every new coach starting from {TEMPLATES[tpl].name} gets it.</p>
              <div className="flex gap-1.5">
                <button type="button" disabled={saving} onClick={() => save(tpl)} className={cn("h-8 flex-1 rounded-lg bg-(--c-t1) px-3 text-sm font-medium text-(--c-page) disabled:opacity-50", CONTROL_FOCUS)}>
                  {saving ? "Saving…" : "Replace"}
                </button>
                <button type="button" onClick={() => setTpl(null)} className={cn("h-8 flex-1 rounded-lg border px-3 text-sm hover:bg-(--c-on)", CONTROL_FOCUS)} style={{ borderColor: "var(--c-hair)" }}>
                  Back
                </button>
              </div>
            </div>
          ) : (
            <>
              <MenuAction icon={<Columns3 className="size-4" />} label={`Compare with ${baseName}`} onClick={() => (setOpen(false), onCompare())} />
              <MenuAction icon={<Download className="size-4" />} label="Export as a file" onClick={() => (setOpen(false), exportTheme(entry))} />
              {CAN_SAVE_TEMPLATE && (
                <>
                  <div className="my-1 h-px" style={{ background: "var(--c-hair)" }} />
                  <span className="px-2.5 pt-1 pb-0.5 text-[0.6875rem] font-medium tracking-wide text-(--c-t3) uppercase">Make it a template</span>
                  {TEMPLATE_IDS.map((id) => (
                    <MenuAction key={id} icon={<LayoutTemplate className="size-4" />} label={`Replace ${TEMPLATES[id].name}…`} onClick={() => setTpl(id)} />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function Icon({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-lg text-(--c-t2) transition-colors duration-150 hover:bg-(--c-on) hover:text-(--c-t1) disabled:opacity-35 disabled:hover:bg-transparent",
        CONTROL_FOCUS,
      )}
    >
      {children}
    </button>
  )
}
