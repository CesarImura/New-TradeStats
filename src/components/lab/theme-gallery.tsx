"use client"

import { Columns3, Copy, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { auditTheme } from "@/lib/theme/contrast"
import { themeToCss } from "@/lib/theme/css"
import type { Mode } from "@/lib/theme/types"
import type { Detail, Emphasis } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { CONTROL_FOCUS } from "./lab-controls"
import { BASES, baseLabel, colourOf, createTheme, deleteTheme, duplicateTheme, importTheme, resolveLab, restoreTheme, setCompared, type LabThemeEntry, type LabThemes, type ThemeBase } from "./lab-themes"
import { MenuAction, PANEL, panelStyle, ThemeChip, useDismiss } from "./theme-switcher"
import { LIBRARY, meaningFor, Pane } from "./widget-base"

/** What each card shows of its theme: a chart widget and a list widget, the two that differ most between themes. */
const PREVIEW: [string, string][] = [
  ["journal-pnl", "curve"],
  ["next-live", "countdown"],
]

/**
 * Manage themes: every theme as a card drawn in that theme. Click a card to
 * show the library in it; its menu edits, copies, compares or deletes it.
 * Starting points can't be changed: customising one makes a copy.
 */
export function ThemeGallery({ lab, mode, emphasis, detail, onEdit }: { lab: LabThemes; mode: Mode; emphasis: Emphasis; detail: Detail; onEdit: (id: string) => void }) {
  const built = lab.all.filter((t) => t.builtIn)
  const css = useMemo(() => lab.all.map((t) => themeToCss(resolveLab(t, mode), `.gal-${t.id}`) + meaningFor(colourOf(t), mode, `.gal-${t.id}`)).join(""), [lab.all, mode])
  const grid = "grid gap-x-5 gap-y-7 [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]"
  return (
    <div className="grid gap-10 pb-16">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <section className="grid gap-4">
        <SectionHead title="My themes" note={lab.mine.length ? `${lab.mine.length} in this browser` : "Saved in this browser only"} />
        <div className={grid}>
          <NewCard onNew={(b) => onEdit(createTheme(b))} onImported={onEdit} />
          {lab.mine.map((t) => (
            <ThemeCard key={t.id} entry={t} lab={lab} mode={mode} emphasis={emphasis} detail={detail} onEdit={onEdit} />
          ))}
        </div>
      </section>
      <section className="grid gap-4">
        <SectionHead title="Starting points" note="Customising one makes your own copy" />
        <div className={grid}>
          {built.map((t) => (
            <ThemeCard key={t.id} entry={t} lab={lab} mode={mode} emphasis={emphasis} detail={detail} onEdit={onEdit} />
          ))}
        </div>
      </section>
    </div>
  )
}

function SectionHead({ title, note }: { title: string; note: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <h2 className="text-sm font-medium">{title}</h2>
      <span className="text-[0.8125rem] text-(--c-t3)">{note}</span>
    </div>
  )
}

/** A fresh theme: pick what it starts from. */
function NewCard({ onNew, onImported }: { onNew: (b: ThemeBase) => void; onImported: (id: string) => void }) {
  return (
    <div className="grid min-h-[17rem] content-center justify-items-center gap-4 rounded-xl border border-dashed p-6 text-center" style={{ borderColor: "var(--c-hair)" }}>
      <span className="grid size-10 place-items-center rounded-full border" style={{ borderColor: "var(--c-hair)" }}>
        <Plus className="size-5" />
      </span>
      <div className="grid gap-1">
        <span className="text-sm font-medium">New theme</span>
        <span className="text-[0.8125rem] text-(--c-t2)">Start from</span>
      </div>
      <div className="flex flex-wrap justify-center gap-1.5">
        {BASES.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => onNew(b.id)}
            className={cn("h-8 rounded-lg border px-3 text-[0.8125rem] transition-colors duration-150 hover:bg-(--c-on)", CONTROL_FOCUS)}
            style={{ borderColor: "var(--c-hair)", background: "var(--c-bar)" }}
          >
            {b.label}
          </button>
        ))}
      </div>
      <label className={cn("cursor-pointer rounded text-[0.8125rem] text-(--c-t2) underline-offset-4 hover:text-(--c-t1) hover:underline", CONTROL_FOCUS)}>
        or import a theme file
        <input
          type="file"
          accept=".json,application/json"
          className="sr-only"
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ""
            if (!f) return
            try {
              const id = await importTheme(f)
              onImported(id)
            } catch (err) {
              toast.error("Couldn't import the theme", { description: err instanceof Error ? err.message : String(err) })
            }
          }}
        />
      </label>
    </div>
  )
}

function ThemeCard({ entry, lab, mode, emphasis, detail, onEdit }: { entry: LabThemeEntry; lab: LabThemes; mode: Mode; emphasis: Emphasis; detail: Detail; onEdit: (id: string) => void }) {
  const theme = resolveLab(entry, mode)
  const checks = auditTheme(theme, { fixes: true })
  const fails = checks.filter((c) => !c.pass)
  const active = lab.active.id === entry.id
  const scope = `gal-${entry.id}`
  const changed = Object.keys(entry.draft).length
  return (
    <div className="group grid content-start gap-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => lab.pick(entry.id)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), lab.pick(entry.id))}
        aria-pressed={active}
        aria-label={`Show the library in ${entry.name}`}
        className={cn(
          scope,
          "relative grid h-[13rem] cursor-pointer grid-cols-2 items-center gap-3 overflow-hidden rounded-xl border p-4 text-left transition-shadow duration-150",
          CONTROL_FOCUS,
          active ? "ring-2 ring-(--c-t1)" : "hover:ring-1 hover:ring-(--c-t3)",
        )}
        style={{ borderColor: "var(--c-hair)", background: "var(--background)" }}
      >
        {/* Live widgets, inert: looking, not using. */}
        <span inert className="contents">
          {PREVIEW.map(([type, variant]) => {
            const def = LIBRARY.find((w) => w.type === type)
            return def ? (
              <span key={type} className="grid min-w-0 place-items-center">
                <Pane def={def} variant={variant} h={4} scale={0.46} mode={mode} theme={theme} emphasis={emphasis} detail={detail} scope={scope} />
              </span>
            ) : null
          })}
        </span>
        {active && <span className="absolute top-2.5 left-2.5 rounded-full bg-(--c-t1) px-2 text-[0.6875rem] leading-5 font-medium text-(--c-page)">In use</span>}
      </div>
      <div className="flex items-start gap-2.5 px-1">
        <ThemeChip entry={entry} mode={mode} />
        <div className="grid min-w-0 flex-1 gap-0.5">
          <span className="truncate text-[0.8125rem] font-medium">{entry.name}</span>
          <span className="flex flex-wrap items-center gap-x-2 text-xs text-(--c-t3)">
            {entry.builtIn ? "Starting point" : `on ${baseLabel(entry.base)} · ${changed} ${changed === 1 ? "change" : "changes"}`}
            <span title={fails.length ? fails.map((c) => `${c.label}: ${c.ratio.toFixed(1)}:1, needs ${c.min}:1`).join("\n") : "Every colour pair passes WCAG AA"} className="flex items-center gap-1">
              <span className="size-1.5 rounded-full" style={{ background: fails.length ? "var(--loss, #cf222e)" : "var(--c-t3)" }} />
              {fails.length ? `${fails.length} readability ${fails.length === 1 ? "issue" : "issues"}` : "Readable"}
            </span>
          </span>
        </div>
        <CardMenu entry={entry} lab={lab} onEdit={onEdit} />
      </div>
    </div>
  )
}

function CardMenu({ entry, lab, onEdit }: { entry: LabThemeEntry; lab: LabThemes; onEdit: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(open, ref, () => {
    setOpen(false)
    setConfirm(false)
  })
  const close = (f: () => void) => () => {
    setOpen(false)
    setConfirm(false)
    f()
  }
  const ids = lab.compared.map((t) => t.id)
  const compared = ids.includes(entry.id)
  const remove = () => {
    const gone = deleteTheme(entry.id)
    if (gone) toast(`Deleted ${gone.name}`, { action: { label: "Undo", onClick: () => restoreTheme(gone) } })
  }
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={`${entry.name}: more`}
        aria-expanded={open}
        className={cn("grid size-8 place-items-center rounded-lg text-(--c-t2) transition-colors duration-150 hover:bg-(--c-on) hover:text-(--c-t1)", CONTROL_FOCUS, open && "bg-(--c-on)")}
      >
        <MoreHorizontal className="size-4" />
      </button>
      {open && (
        <div role="menu" className={cn(PANEL, "top-9 right-0 w-56")} style={panelStyle}>
          {confirm ? (
            <div className="grid gap-2 p-2">
              <p className="text-sm">Delete {entry.name}?</p>
              <p className="text-[0.8125rem] text-(--c-t2)">You can undo it right after.</p>
              <div className="flex gap-1.5">
                <button type="button" onClick={close(remove)} className={cn("h-8 flex-1 rounded-lg px-3 text-sm font-medium text-white", CONTROL_FOCUS)} style={{ background: "#cf222e" }}>
                  Delete
                </button>
                <button type="button" onClick={() => setConfirm(false)} className={cn("h-8 flex-1 rounded-lg border px-3 text-sm hover:bg-(--c-on)", CONTROL_FOCUS)} style={{ borderColor: "var(--c-hair)" }}>
                  Keep
                </button>
              </div>
            </div>
          ) : (
            <>
              <MenuAction icon={<Pencil className="size-4" />} label={entry.builtIn ? "Customize a copy" : "Edit"} onClick={close(() => onEdit(entry.id))} />
              <MenuAction icon={<Copy className="size-4" />} label="Duplicate" onClick={close(() => duplicateTheme(entry))} />
              <MenuAction
                icon={<Columns3 className="size-4" />}
                label={compared ? "Remove from Compare" : "Add to Compare"}
                onClick={close(() => setCompared(compared ? ids.filter((x) => x !== entry.id) : [...ids, entry.id]))}
              />
              {!entry.builtIn && <MenuAction icon={<Trash2 className="size-4" />} label="Delete…" onClick={() => setConfirm(true)} />}
            </>
          )}
        </div>
      )}
    </div>
  )
}
