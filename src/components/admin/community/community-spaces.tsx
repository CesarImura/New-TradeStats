"use client"

import { useState } from "react"
import { MoreHorizontal, Plus, Trash2 } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { type Space } from "@/lib/data/community"
import { cn } from "@/lib/utils"
import { AdminSelect, AdminButton, AdminField, AdminModal, Panel, SortHint, SortableRow, Tag, adminControl, useMoveFeedback } from "../ui"
import { dropLine } from "@/components/kit/drop-line"

/* ---------- 03 Spaces and rules ---------- */

export function SpacesTab({ spaces, setSpaces, rules, setRules, onEdit }: { spaces: Space[]; setSpaces: (n: Space[] | ((c: Space[]) => Space[])) => void; rules: string[]; setRules: (n: string[] | ((c: string[]) => string[])) => void; onEdit: (s: Space) => void }) {
  const { coach } = useCoach()
  const [drag, setDrag] = useState<number | null>(null)
  const [over, setOver] = useState<number | null>(null)
  const { flashed, moved, Live } = useMoveFeedback()
  const n = spaces.length
  const reorder = (from: number, to: number) => {
    if (from === to || to < 0 || to >= n) return
    const before = spaces
    const next = [...before]
    const [m] = next.splice(from, 1)
    next.splice(to, 0, m)
    setSpaces(next)
    moved(m.id, `${m.name} moved to ${to + 1} of ${n}.`)
    toast(`# ${m.name} moved to ${to + 1} of ${n}.`, { id: "space-undo", action: { label: "Undo", onClick: () => setSpaces(before) } })
  }
  const drop = (i: number) => {
    if (drag !== null) reorder(drag, i)
    setDrag(null)
    setOver(null)
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,784fr)_minmax(0,400fr)]">
      <Panel className="gap-0 overflow-hidden p-0">
        <SortHint id="space-sort-hint" />
        <Live />
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <h2 className="t-heading-s text-a-text">Spaces</h2>
          {n > 1 && <span className="t-caption text-a-text-3">Drag to reorder</span>}
        </div>
        {n === 0 && <p className="border-t border-a-border px-5 py-8 text-center t-body-m text-a-text-2">No spaces yet. Add one for each topic.</p>}
        {spaces.map((s, i) => {
          const tier = s.audience ? coach.tiers.find((t) => t.id === s.audience)?.name : undefined
          return (
            <div key={s.id} onDragOver={(e) => drag !== null && (e.preventDefault(), setOver(i))} onDrop={() => drop(i)} className={cn("border-t border-a-border", over === i && drag !== null && drag !== i && dropLine(drag < i ? "after" : "before"))}>
              <SortableRow
                className="rounded-none"
                dragging={drag === i}
                active={flashed(s.id)}
                handle={{
                  label: `Reorder ${s.name}`,
                  hintId: "space-sort-hint",
                  onMove: (by) => reorder(i, i + by),
                  draggable: true,
                  onDragStart: (e) => {
                    setDrag(i)
                    e.dataTransfer.effectAllowed = "move"
                    const row = e.currentTarget.closest("[data-slot=sortable-row]") ?? e.currentTarget
                    e.dataTransfer.setDragImage(row, 24, 26)
                  },
                  onDragEnd: () => (setDrag(null), setOver(null)),
                }}
                title={<># {s.name}</>}
                description={s.text}
                trailing={
                  <>
                    <Tag>{tier ?? "Everyone"}</Tag>
                    {s.posts !== undefined && <span className="t-caption text-a-text-2 tabular-nums">{s.posts >= 1000 ? `${(s.posts / 1000).toFixed(1)}k` : s.posts} posts</span>}
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<AdminButton hierarchy="ghost" size="md" iconOnly aria-label={`Actions for ${s.name}`} />}><MoreHorizontal /></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(s)}>Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => (setSpaces((l) => l.filter((x) => x.id !== s.id)), toast(`# ${s.name} deleted`))}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                }
              />
            </div>
          )
        })}
      </Panel>
      <RulesPanel rules={rules} setRules={setRules} />
    </div>
  )
}

export function RulesPanel({ rules, setRules }: { rules: string[]; setRules: (n: string[] | ((c: string[]) => string[])) => void }) {
  const [edit, setEdit] = useState<number | null>(null)
  return (
    <Panel className="gap-3">
      <h2 className="t-heading-s text-a-text">Community rules</h2>
      <ol className="flex flex-col gap-3">
        {rules.map((r, i) => (
          <li key={i} className="group/rule flex items-start gap-2 t-body-m">
            <span className="w-4 shrink-0 text-center t-caption leading-[18px] text-a-text-accent tabular-nums">{i + 1}</span>
            {edit === i ? (
              <input autoFocus aria-label={`Rule ${i + 1}`} defaultValue={r} onBlur={(e) => (setRules((l) => (e.target.value.trim() ? l.map((x, j) => (j === i ? e.target.value.trim() : x)) : l.filter((_, j) => j !== i))), setEdit(null))} onKeyDown={(e) => (e.key === "Enter" && e.currentTarget.blur()) || (e.key === "Escape" && setEdit(null))} className={cn(adminControl, "h-8 min-w-0 flex-1 py-0 t-body-m")} />
            ) : (
              <>
                <button type="button" onClick={() => setEdit(i)} aria-label={`Edit rule ${i + 1}: ${r}`} className="min-w-0 flex-1 rounded-a-xs text-left text-a-text outline-none focus-visible:ring-2 focus-visible:ring-a-border-focus">{r}</button>
                <button type="button" aria-label={`Delete rule ${i + 1}`} onClick={() => setRules((l) => l.filter((_, j) => j !== i))} className="grid size-5 shrink-0 place-items-center rounded-a-xs text-a-text-3 opacity-0 outline-none transition-opacity hover:text-a-text focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-a-border-focus group-hover/rule:opacity-100 pointer-coarse:size-8 pointer-coarse:opacity-100">
                  <Trash2 className="size-3.5" />
                </button>
              </>
            )}
          </li>
        ))}
      </ol>
      <AdminButton hierarchy="ghost" size="md" className="w-fit" onClick={() => (setRules((l) => [...l, ""]), setEdit(rules.length))}>
        <Plus /> Add rule
      </AdminButton>
    </Panel>
  )
}

export function SpaceDialog({ space, onClose, onSave }: { space: Space | "new" | null; onClose: () => void; onSave: (s: Space) => void }) {
  const { coach } = useCoach()
  const [last, setLast] = useState<Space | "new" | null>(space)
  const [name, setName] = useState("")
  const [text, setText] = useState("")
  const [audience, setAudience] = useState("")
  if (space && space !== last) {
    setLast(space)
    setName(space === "new" ? "" : space.name)
    setText(space === "new" ? "" : space.text)
    setAudience(space === "new" ? "" : (space.audience ?? ""))
  }
  const shown = space ?? last
  const slug = name.trim().replace(/^#\s*/, "").toLowerCase().replace(/\s+/g, "-")
  return (
    <AdminModal open={!!space} onOpenChange={(o) => !o && onClose()} title={shown === "new" ? "New space" : "Edit space"} subtitle="A topic your students can post in and filter the feed by." className="sm:max-w-[480px]"
      footer={
        <div className="flex w-full items-center gap-2">
          <span aria-hidden className="h-px min-w-px flex-1" />
          <AdminButton hierarchy="ghost" onClick={onClose}>Cancel</AdminButton>
          <AdminButton disabled={!slug} onClick={() => (onSave({ ...(shown && shown !== "new" ? shown : { id: `s${Date.now()}`, posts: 0 }), name: slug, text: text.trim(), audience: audience || undefined }), onClose())}>Save</AdminButton>
        </div>
      }>
      <AdminField label="Name" hint="Lowercase, with dashes">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="trade-ideas" className={cn(adminControl, "h-11")} />
      </AdminField>
      <AdminField label="What is it for?" optional>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Share setups before the open" className={cn(adminControl, "h-11")} />
      </AdminField>
      <div className="grid gap-1.5">
        <span className="t-caption text-a-text">Who sees it</span>
        <AdminSelect ariaLabel="Who sees it" value={audience} onValueChange={setAudience} options={[{ value: "", label: "Everyone" }, ...coach.tiers.map((t) => ({ value: t.id, label: t.name }))]} />
      </div>
    </AdminModal>
  )
}

