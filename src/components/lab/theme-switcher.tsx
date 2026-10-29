"use client"

import { Check, ChevronDown, Columns3, LayoutGrid, Pencil, Plus, Trash2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import type { Mode } from "@/lib/theme/types"
import { cn } from "@/lib/utils"
import { CONTROL_FOCUS } from "./lab-controls"
import { baseLabel, deleteTheme, resolveLab, restoreTheme, type LabThemeEntry, type LabThemes } from "./lab-themes"

/**
 * A theme's colours in a 20px chip: the page, a card on it and the brand
 * colour as a dot, so themes tell apart at a glance in every list.
 */
export function ThemeChip({ entry, mode, size = 20 }: { entry: LabThemeEntry; mode: Mode; size?: number }) {
  const t = resolveLab(entry, mode)
  const p = t.palettes[mode]
  return (
    <span aria-hidden className="relative grid shrink-0 place-items-center overflow-hidden rounded-[6px] ring-1 ring-(--c-hair) ring-inset" style={{ width: size, height: size, background: p.background }}>
      <span className="absolute inset-x-[22%] top-[22%] bottom-0 rounded-t-[3px]" style={{ background: p.card, boxShadow: `inset 0 0 0 1px ${p.border}` }} />
      <span className="relative mt-[22%] size-[34%] rounded-full" style={{ background: t.primary }} />
    </span>
  )
}

/** Closes a panel on Escape or a click outside `ref`. */
export function useDismiss(open: boolean, ref: React.RefObject<HTMLElement | null>, close: () => void) {
  useEffect(() => {
    if (!open) return
    const out = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && close()
    const esc = (e: KeyboardEvent) => e.key === "Escape" && close()
    document.addEventListener("pointerdown", out)
    document.addEventListener("keydown", esc)
    return () => {
      document.removeEventListener("pointerdown", out)
      document.removeEventListener("keydown", esc)
    }
  }, [open, ref, close])
}

/** The floating panel under a bar button. */
export const PANEL = "absolute top-11 z-40 grid w-[19rem] max-w-[calc(100vw-2rem)] rounded-xl border p-1.5 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.35)]"
export const panelStyle = { borderColor: "var(--c-hair)", background: "var(--c-bar)" }

/** A small grey heading inside a panel. */
export function PanelHeading({ children }: { children: React.ReactNode }) {
  return <div className="px-2.5 pt-2 pb-1 text-[0.6875rem] font-medium tracking-wide text-(--c-t3) uppercase">{children}</div>
}

/** Keyboard shortcut text in a key cap. */
export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border px-1 text-[0.6875rem] leading-4 font-normal text-(--c-t3)" style={{ borderColor: "var(--c-hair)" }}>
      {children}
    </kbd>
  )
}

/**
 * The theme switcher: the theme everything in the library is shown in, one
 * click from anywhere. Starting points first, then the themes made here;
 * each row edits in place. [ and ] step through themes without opening it.
 */
export function ThemeSwitcher({ lab, mode, onEdit, onNew, onManage, onCompare }: { lab: LabThemes; mode: Mode; onEdit: (id: string) => void; onNew: () => void; onManage: () => void; onCompare: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(open, ref, () => setOpen(false))
  const { active, all } = lab
  const built = all.filter((t) => t.builtIn)
  const mine = all.filter((t) => !t.builtIn)
  const close = (f: () => void) => () => {
    setOpen(false)
    f()
  }
  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        title="Theme the library is shown in ( [ and ] to step through )"
        className={cn("flex h-9 max-w-[15rem] shrink-0 items-center gap-2 rounded-lg border pr-2 pl-1.5 text-sm transition-colors duration-150", CONTROL_FOCUS, open ? "bg-(--c-on)" : "hover:bg-(--c-on)")}
        style={{ borderColor: "var(--c-hair)", background: open ? undefined : "var(--c-page)" }}
      >
        <ThemeChip entry={active} mode={mode} size={24} />
        <span className="grid min-w-0 text-left leading-tight">
          <span className="text-[0.6875rem] text-(--c-t3)">Theme</span>
          <span className="truncate font-medium">{active.name}</span>
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-(--c-t3) transition-transform duration-150", open && "rotate-180")} />
      </button>
      {open && (
        <div role="menu" className={cn(PANEL, "left-0 max-h-[min(36rem,calc(100svh-6rem))] overflow-y-auto")} style={panelStyle}>
          <PanelHeading>Starting points</PanelHeading>
          {built.map((t) => (
            <ThemeRow key={t.id} entry={t} mode={mode} active={t.id === active.id} onPick={close(() => lab.pick(t.id))} onEdit={close(() => onEdit(t.id))} />
          ))}
          <PanelHeading>My themes</PanelHeading>
          {mine.length === 0 && <p className="px-2.5 pb-2 text-[0.8125rem] text-(--c-t3)">None yet. Make one from any starting point.</p>}
          {mine.map((t) => (
            <ThemeRow key={t.id} entry={t} mode={mode} active={t.id === active.id} onPick={close(() => lab.pick(t.id))} onEdit={close(() => onEdit(t.id))} onDelete={() => removeTheme(t)} />
          ))}
          <div className="my-1 h-px" style={{ background: "var(--c-hair)" }} />
          <MenuAction icon={<Plus className="size-4" />} label="New theme" onClick={close(onNew)} />
          <MenuAction icon={<Pencil className="size-4" />} label={active.builtIn ? `Customize ${active.name}` : `Edit ${active.name}`} hint="E" onClick={close(() => onEdit(active.id))} />
          <MenuAction icon={<Columns3 className="size-4" />} label="Compare themes" hint="C" onClick={close(onCompare)} />
          <MenuAction icon={<LayoutGrid className="size-4" />} label="Manage themes" onClick={close(onManage)} />
        </div>
      )}
    </div>
  )
}

/** Delete a made theme, with Undo in the toast. */
export function removeTheme(entry: LabThemeEntry) {
  const gone = deleteTheme(entry.id)
  if (gone)
    toast(`Deleted ${gone.name}`, {
      action: { label: "Undo", onClick: () => restoreTheme(gone) },
    })
}

/** The delete warning, in place: what goes, and Delete or Keep. */
export function DeleteConfirm({ name, onDelete, onKeep }: { name: string; onDelete: () => void; onKeep: () => void }) {
  return (
    <div role="alertdialog" aria-label={`Delete ${name}?`} className="grid gap-2 p-2">
      <p className="text-sm font-medium">Delete {name}?</p>
      <p className="text-[0.8125rem] text-(--c-t2)">It is removed from this browser. You can undo it right after.</p>
      <div className="flex gap-1.5">
        <button type="button" autoFocus onClick={onDelete} className={cn("h-8 flex-1 rounded-lg px-3 text-sm font-medium text-white", CONTROL_FOCUS)} style={{ background: "#cf222e" }}>
          Delete
        </button>
        <button type="button" onClick={onKeep} className={cn("h-8 flex-1 rounded-lg border px-3 text-sm hover:bg-(--c-on)", CONTROL_FOCUS)} style={{ borderColor: "var(--c-hair)" }}>
          Keep
        </button>
      </div>
    </div>
  )
}

/** One theme in a list: chip, name and base; ticked when it is the one in use. On hover, edit and (for made themes) delete, which asks first. */
export function ThemeRow({
  entry,
  mode,
  active,
  onPick,
  onEdit,
  onDelete,
  role = "menuitemradio",
}: {
  entry: LabThemeEntry
  mode: Mode
  active: boolean
  onPick: () => void
  onEdit?: () => void
  onDelete?: () => void
  role?: string
}) {
  const [confirm, setConfirm] = useState(false)
  if (confirm && onDelete)
    return (
      <div className="my-0.5 rounded-lg" style={{ background: "var(--c-on)" }}>
        <DeleteConfirm name={entry.name} onDelete={() => (setConfirm(false), onDelete())} onKeep={() => setConfirm(false)} />
      </div>
    )
  const tools = onEdit || onDelete
  return (
    <div className="group/row relative flex items-center">
      <button
        type="button"
        role={role}
        aria-checked={active}
        onClick={onPick}
        className={cn("flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2.5 text-left text-sm transition-colors duration-150", CONTROL_FOCUS, active ? "bg-(--c-on)" : "hover:bg-(--c-on)")}
      >
        <ThemeChip entry={entry} mode={mode} />
        <span className={cn("grid min-w-0 flex-1 leading-tight", tools && "group-hover/row:pr-14 group-focus-within/row:pr-14")}>
          <span className={cn("truncate", active && "font-medium")}>{entry.name}</span>
          {!entry.builtIn && <span className="truncate text-[0.6875rem] text-(--c-t3)">on {baseLabel(entry.base)}</span>}
        </span>
        {active && <Check className={cn("size-4 shrink-0", tools && "group-hover/row:invisible group-focus-within/row:invisible")} />}
      </button>
      {tools && (
        <span className="absolute right-1.5 flex gap-0.5 opacity-0 transition-opacity duration-150 group-hover/row:opacity-100 group-focus-within/row:opacity-100">
          {onEdit && (
            <RowTool label={entry.builtIn ? `Customize a copy of ${entry.name}` : `Edit ${entry.name}`} onClick={onEdit}>
              <Pencil className="size-3.5" />
            </RowTool>
          )}
          {onDelete && (
            <RowTool label={`Delete ${entry.name}`} onClick={() => setConfirm(true)} danger>
              <Trash2 className="size-3.5" />
            </RowTool>
          )}
        </span>
      )}
    </div>
  )
}

/** A small icon button that shows on a row's hover. */
export function RowTool({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={(e) => (e.stopPropagation(), onClick())}
      aria-label={label}
      title={label}
      className={cn("grid size-7 place-items-center rounded-md text-(--c-t2) transition-colors duration-150 hover:bg-(--c-bar)", danger ? "hover:text-[#cf222e]" : "hover:text-(--c-t1)", CONTROL_FOCUS)}
    >
      {children}
    </button>
  )
}

export function MenuAction({ icon, label, hint, onClick }: { icon: React.ReactNode; label: string; hint?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn("flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-left text-sm text-(--c-t2) transition-colors duration-150 hover:bg-(--c-on) hover:text-(--c-t1)", CONTROL_FOCUS)}
    >
      {icon}
      <span className="flex-1 truncate">{label}</span>
      {hint && <Kbd>{hint}</Kbd>}
    </button>
  )
}
