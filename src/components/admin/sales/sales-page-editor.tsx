"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowDown, ArrowUp, ExternalLink, Plus, RotateCcw, X } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { BLOCK_INFO, resetSalesPage, saveSalesPage, useSalesPage, type Block } from "@/lib/data/sales-page"
import { cn } from "@/lib/utils"
import { Field, Mono } from "../kit"

/** ADM-40: the sales page from blocks. Order, switch on or off, edit the words; the page beside it updates live. */
export function SalesPageEditor() {
  const { coach } = useCoach()
  const blocks = useSalesPage(coach)
  const [sel, setSel] = useState(blocks[0]?.id)
  const block = blocks.find((b) => b.id === sel)
  const update = (id: string, patch: Partial<Block>) => saveSalesPage(coach, (list) => list.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  const move = (id: string, by: number) =>
    saveSalesPage(coach, (list) => {
      const i = list.findIndex((b) => b.id === id)
      const j = i + by
      if (j < 0 || j >= list.length) return list
      const next = [...list]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  const url = `/site/${coach.slug}`
  const frame = useRef<HTMLIFrameElement>(null)
  useEffect(() => {
    frame.current?.contentWindow?.postMessage({ type: "sales-page:show", id: sel }, window.location.origin)
  }, [sel])

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
      <div className="grid content-start gap-4">
        <div className="flex items-center justify-between">
          <Mono className="text-muted-foreground">Blocks · top to bottom</Mono>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              resetSalesPage(coach)
              toast("Sales page reset to the template")
            }}
          >
            <RotateCcw /> Reset
          </Button>
        </div>
        <ol className="grid gap-1">
          {blocks.map((b, i) => (
            <li key={b.id}>
              <div
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-2.5 py-2 transition-colors",
                  sel === b.id ? "border-[var(--ts-cta)]/60 bg-[var(--ts-cta)]/5" : "hover:bg-muted/50",
                  !b.on && "opacity-55",
                )}
              >
                <button onClick={() => setSel(b.id)} className="grid min-w-0 flex-1 text-left">
                  <span className="truncate text-sm font-medium">{BLOCK_INFO[b.type].name}</span>
                  <span className="truncate text-xs text-muted-foreground">{BLOCK_INFO[b.type].hint}</span>
                </button>
                <Button variant="ghost" size="icon-sm" aria-label="Move up" disabled={i === 0} onClick={() => move(b.id, -1)}>
                  <ArrowUp />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label="Move down" disabled={i === blocks.length - 1} onClick={() => move(b.id, 1)}>
                  <ArrowDown />
                </Button>
                <Switch checked={b.on} onCheckedChange={(v) => update(b.id, { on: v })} aria-label={`Show ${BLOCK_INFO[b.type].name}`} />
              </div>
            </li>
          ))}
        </ol>

        {block && (
          <div className="grid gap-3 rounded-lg border bg-card p-4">
            <Mono className="text-[var(--ts-interactive)]">{BLOCK_INFO[block.type].name}</Mono>
            <Field label="Heading">
              <Input value={block.title} onChange={(e) => update(block.id, { title: e.target.value })} />
            </Field>
            {block.type !== "results" && block.type !== "faq" && block.type !== "week" && (
              <Field label="Text">
                <Textarea rows={3} value={block.text} onChange={(e) => update(block.id, { text: e.target.value })} />
              </Field>
            )}
            {block.items && (
              <div className="grid gap-3">
                {block.items.map((it, i) => (
                  <div key={i} className="grid gap-1.5 rounded-md border p-2.5">
                    <div className="flex items-center gap-2">
                      <Input
                        value={block.type === "faq" ? it.q : (it.who ?? "")}
                        onChange={(e) => update(block.id, { items: block.items!.map((x, j) => (j === i ? (block.type === "faq" ? { ...x, q: e.target.value } : { ...x, who: e.target.value }) : x)) })}
                        placeholder={block.type === "faq" ? "Question" : "Name · detail"}
                        className="h-8"
                      />
                      <Button variant="ghost" size="icon-sm" aria-label="Remove" onClick={() => update(block.id, { items: block.items!.filter((_, j) => j !== i) })}>
                        <X />
                      </Button>
                    </div>
                    <Textarea
                      rows={2}
                      value={it.a}
                      onChange={(e) => update(block.id, { items: block.items!.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)) })}
                      placeholder={block.type === "faq" ? "Answer" : "What they said"}
                    />
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-self-start"
                  onClick={() => update(block.id, { items: [...block.items!, block.type === "faq" ? { q: "", a: "" } : { q: "", a: "", who: "" }] })}
                >
                  <Plus /> {block.type === "faq" ? "Question" : "Quote"}
                </Button>
              </div>
            )}
            {(block.type === "tiers" || block.type === "curriculum" || block.type === "groups") && (
              <p className="text-xs text-muted-foreground">
                Filled in for you from {block.type === "tiers" ? "Tiers & prices" : block.type === "groups" ? "Groups" : "Content"}. Hidden tiers and draft courses don&apos;t show.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid content-start gap-2">
        <div className="flex items-center justify-between gap-2">
          <Mono className="text-muted-foreground">{coach.slug}.tradestats.app · live</Mono>
          <Button variant="ghost" size="sm" nativeButton={false} render={<a href={url} target="_blank" rel="noreferrer" />}>
            <ExternalLink /> Open
          </Button>
        </div>
        <div className="overflow-hidden rounded-lg border bg-background">
          <iframe ref={frame} key={coach.slug} src={`${url}?preview=draft`} title="Sales page preview" className="h-[72vh] w-full" />
        </div>
      </div>
    </div>
  )
}
