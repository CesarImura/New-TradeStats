"use client"

import { useEffect, useRef, useState } from "react"
import { ExternalLink, MoreHorizontal, Plus, X } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { BLOCK_INFO, blockHint, defaultBlocks, resetSalesPage, saveSalesPage, useSalesPage, type Block, type BlockType } from "@/lib/data/sales-page"
import { cn } from "@/lib/utils"
import { dropLine } from "@/components/kit/drop-line"
import { AdminButton, AdminField, Panel, SortHint, SortableRow, Tag, adminControl, useMoveFeedback } from "../ui"

/** Sales · 06 Sales page, header actions (Figma 536:7152). */
export function SalesPageActions({ slug, onReset }: { slug: string; onReset: () => void }) {
  return (
    <>
      <AdminButton hierarchy="ghost" onClick={onReset}>Reset to template</AdminButton>
      <AdminButton nativeButton={false} render={<a href={`/site/${slug}`} target="_blank" rel="noreferrer" />} hierarchy="secondary">
        <ExternalLink /> Open page
      </AdminButton>
    </>
  )
}

/** Sales · 06 Sales page (Figma 536:7152): blocks on the left, the live page on the right. The block being edited is dashed in the page. */
export function SalesPageEditor({ resetSignal }: { resetSignal: number }) {
  const { coach } = useCoach()
  const blocks = useSalesPage(coach)
  const [sel, setSel] = useState<string>(blocks[0]?.id ?? "")
  const [drag, setDrag] = useState<number | null>(null)
  const [over, setOver] = useState<number | null>(null)
  const { flashed, moved, Live } = useMoveFeedback()
  const block = blocks.find((b) => b.id === sel) ?? blocks[0]
  const n = blocks.length
  const url = `/site/${coach.slug}`
  const frame = useRef<HTMLIFrameElement>(null)
  const name = (b: Block) => BLOCK_INFO[b.type].name

  const update = (id: string, patch: Partial<Block>) => saveSalesPage(coach, (list) => list.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  const reorder = (from: number, to: number) => {
    if (from === to || to < 0 || to >= n) return
    const before = blocks
    const next = [...before]
    const [m] = next.splice(from, 1)
    next.splice(to, 0, m)
    saveSalesPage(coach, () => next)
    moved(m.id, `${name(m)} moved to ${to + 1} of ${n}.`)
    toast(`${name(m)} moved to ${to + 1} of ${n}.`, { id: "block-undo", action: { label: "Undo", onClick: () => saveSalesPage(coach, () => before) } })
  }
  const drop = (i: number) => {
    if (drag !== null) reorder(drag, i)
    setDrag(null)
    setOver(null)
  }
  const remove = (b: Block) => {
    const before = blocks
    saveSalesPage(coach, (l) => l.filter((x) => x.id !== b.id))
    if (sel === b.id) setSel(blocks.find((x) => x.id !== b.id)?.id ?? "")
    toast(`${name(b)} removed`, { id: "block-undo", action: { label: "Undo", onClick: () => saveSalesPage(coach, () => before) } })
  }
  const missing = (Object.keys(BLOCK_INFO) as BlockType[]).filter((t) => !blocks.some((b) => b.type === t))
  const add = (t: BlockType) => {
    const proto = defaultBlocks(coach).find((b) => b.type === t)
    if (!proto) return
    saveSalesPage(coach, (l) => [...l, proto])
    setSel(proto.id)
    toast(`${BLOCK_INFO[t].name} added`, { description: "At the bottom of the page." })
  }

  // The header's "Reset to template" asks for a reset: each click resets once, with an undo.
  const seen = useRef(resetSignal)
  useEffect(() => {
    if (resetSignal === seen.current) return
    seen.current = resetSignal
    const before = blocks
    resetSalesPage(coach)
    setSel(defaultBlocks(coach)[0]?.id ?? "")
    toast("Sales page reset to the template", { action: { label: "Undo", onClick: () => saveSalesPage(coach, () => before) } })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal])

  // The page is on our own origin, so the editor marks the block being edited itself (the page stays as it is) and scrolls it into view.
  const mark = () => {
    const doc = frame.current?.contentDocument
    const win = frame.current?.contentWindow
    if (!doc || !win) return
    doc.querySelectorAll<HTMLElement>("[data-editing]").forEach((x) => {
      x.removeAttribute("data-editing")
      x.style.outline = ""
    })
    const el = block ? doc.getElementById(block.id) : null
    if (!el) return
    el.setAttribute("data-editing", "")
    el.style.outline = "2px dashed var(--ts-cta)"
    el.style.outlineOffset = "-2px"
    win.scrollTo({ top: el.getBoundingClientRect().top + win.scrollY - 64, behavior: "smooth" })
  }
  useEffect(() => {
    mark()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block?.id])
  const loaded = mark

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
      <Panel className="gap-0 p-3">
        <SortHint id="block-sort-hint" />
        <Live />
        <div className="flex items-center justify-between gap-3 px-2 pt-1 pb-3">
          <h2 className="t-mono-label text-a-text-2">Blocks · top to bottom</h2>
          <DropdownMenu>
            <DropdownMenuTrigger render={<AdminButton hierarchy="ghost" size="md" />}>
              <Plus /> Block
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {missing.length === 0 && <DropdownMenuItem disabled>Every block is on the page</DropdownMenuItem>}
              {missing.map((t) => (
                <DropdownMenuItem key={t} onClick={() => add(t)}>{BLOCK_INFO[t].name}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <ol className="grid gap-1">
          {blocks.map((b, i) => (
            <li key={b.id} onDragOver={(e) => drag !== null && (e.preventDefault(), setOver(i))} onDrop={() => drop(i)} className={cn("rounded-a-md", over === i && drag !== null && drag !== i && dropLine(drag < i ? "after" : "before"))}>
              <SortableRow
                dragging={drag === i}
                active={sel === b.id || flashed(b.id)}
                className={cn("cursor-pointer", !b.on && "opacity-60")}
                onClick={() => setSel(b.id)}
                handle={{
                  label: `Reorder ${name(b)}`,
                  hintId: "block-sort-hint",
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
                title={<button type="button" onClick={() => setSel(b.id)} aria-current={sel === b.id ? "true" : undefined} className="max-w-full truncate rounded-a-xs text-left outline-none focus-visible:ring-2 focus-visible:ring-a-border-focus">{name(b)}</button>}
                description={blockHint(b)}
                trailing={
                  <>
                    {!b.on && <Tag>Hidden</Tag>}
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<AdminButton hierarchy="ghost" size="md" iconOnly aria-label={`Actions for ${name(b)}`} onClick={(e) => e.stopPropagation()} />}>
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => update(b.id, { on: !b.on })}>{b.on ? "Hide from the page" : "Show on the page"}</DropdownMenuItem>
                        <DropdownMenuItem disabled={i === 0} onClick={() => reorder(i, i - 1)}>Move up</DropdownMenuItem>
                        <DropdownMenuItem disabled={i === n - 1} onClick={() => reorder(i, i + 1)}>Move down</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => remove(b)}>Remove</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                }
              />
            </li>
          ))}
          {n === 0 && <li className="rounded-a-md border border-dashed border-a-border-strong px-4 py-6 text-center t-body-m text-a-text-2">No blocks. Add one with “+ Block”.</li>}
        </ol>

        {block && (
          <div className="mt-3 flex flex-col gap-4 border-t border-a-border px-2 pt-4 pb-2">
            <h3 className="t-body-m-medium text-a-text">{name(block)}</h3>
            <AdminField label="Heading">
              <input value={block.title} onChange={(e) => update(block.id, { title: e.target.value })} className={cn(adminControl, "h-11")} />
            </AdminField>
            {block.type !== "results" && block.type !== "faq" && block.type !== "week" && (
              <AdminField label="Text">
                <textarea value={block.text} onChange={(e) => update(block.id, { text: e.target.value })} className={cn(adminControl, "block h-24 resize-none py-2.5")} />
              </AdminField>
            )}
            {block.items && (
              <div className="grid gap-3">
                {block.items.map((it, i) => (
                  <div key={i} className="grid gap-1.5 rounded-a-md border border-a-border p-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        value={block.type === "faq" ? it.q : (it.who ?? "")}
                        aria-label={block.type === "faq" ? `Question ${i + 1}` : `Name ${i + 1}`}
                        onChange={(e) => update(block.id, { items: block.items!.map((x, j) => (j === i ? (block.type === "faq" ? { ...x, q: e.target.value } : { ...x, who: e.target.value }) : x)) })}
                        placeholder={block.type === "faq" ? "Question" : "Name · detail"}
                        className={cn(adminControl, "h-9 min-w-0 flex-1")}
                      />
                      <AdminButton aria-label={`Remove ${block.type === "faq" ? "question" : "quote"} ${i + 1}`} onClick={() => update(block.id, { items: block.items!.filter((_, j) => j !== i) })} hierarchy="ghost" size="md" iconOnly>
                        <X />
                      </AdminButton>
                    </div>
                    <textarea
                      value={it.a}
                      aria-label={block.type === "faq" ? `Answer ${i + 1}` : `Quote ${i + 1}`}
                      onChange={(e) => update(block.id, { items: block.items!.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)) })}
                      placeholder={block.type === "faq" ? "Answer" : "What they said"}
                      className={cn(adminControl, "block h-16 resize-none py-2")}
                    />
                  </div>
                ))}
                <div>
                  <AdminButton onClick={() => update(block.id, { items: [...block.items!, block.type === "faq" ? { q: "", a: "" } : { q: "", a: "", who: "" }] })} hierarchy="secondary" size="md">
                    <Plus /> {block.type === "faq" ? "Question" : "Quote"}
                  </AdminButton>
                </div>
              </div>
            )}
            {(block.type === "tiers" || block.type === "curriculum" || block.type === "groups") && (
              <p className="t-caption text-a-text-2">
                Filled in for you from {block.type === "tiers" ? "Tiers & prices" : block.type === "groups" ? "Groups" : "Content"}. Hidden tiers and draft courses don&apos;t show.
              </p>
            )}
          </div>
        )}
      </Panel>

      <Panel className="gap-0 overflow-hidden p-0">
        <div className="flex items-center justify-between gap-2 border-b border-a-border px-4 py-2.5">
          <span className="truncate t-mono-label text-a-text-2">{coach.slug}.tradestats.app · live</span>
        </div>
        <iframe ref={frame} key={coach.slug} onLoad={loaded} src={`${url}?preview=draft`} title="Sales page preview" className="h-[72vh] w-full bg-background" />
      </Panel>
    </div>
  )
}
