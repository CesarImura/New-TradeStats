"use client"

import { Clock, CornerDownLeft, Search } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"

/** Anything the palette can open: a widget or a component. */
export type PaletteItem = { id: string; kind: "Widget" | "Component" | "Theme" | "Layout" | "Page"; name: string; group: string; description: string; tags: string[]; isNew?: boolean }

const RECENT_KEY = "wb-recent"

/** Fuzzy score: every query letter in order; earlier, consecutive and word-start matches score higher. */
function score(q: string, text: string) {
  const t = text.toLowerCase()
  if (t.includes(q)) return 1000 - t.indexOf(q) * 2 - t.length * 0.1
  let at = -1
  let total = 0
  let run = 0
  for (const ch of q) {
    const next = t.indexOf(ch, at + 1)
    if (next < 0) return -1
    run = next === at + 1 ? run + 1 : 0
    total += 10 + run * 5 + (next === 0 || t[next - 1] === " " ? 8 : 0) - (next - at)
    at = next
  }
  return total
}

function readRecent(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]")
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 6) : []
  } catch {
    return []
  }
}

/**
 * ⌘K / Ctrl K search over every widget and component (prototype only).
 * Type to filter (fuzzy), ↑ ↓ to move, Enter to open, Escape to close. With no
 * query it shows what was opened recently.
 */
export function CommandPalette({ items, open, onOpenChange, onPick }: { items: PaletteItem[]; open: boolean; onOpenChange: (v: boolean) => void; onPick: (item: PaletteItem) => void }) {
  const [q, setQ] = useState("")
  const [at, setAt] = useState(0)
  const [recent, setRecent] = useState<string[]>([])
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const still = useReducedMotion()

  // ⌘K / Ctrl K anywhere toggles it.
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener("keydown", key)
    return () => document.removeEventListener("keydown", key)
  }, [open, onOpenChange])

  useEffect(() => {
    if (!open) return
    // Fresh each time it opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecent(readRecent())
    setQ("")
    setAt(0)
    requestAnimationFrame(() => input.current?.focus())
  }, [open])

  const query = q.trim().toLowerCase()
  const results = useMemo(() => {
    if (!query) {
      const r = recent.map((id) => items.find((x) => x.id === id)).filter((x): x is PaletteItem => !!x)
      return r.length ? r : items.slice(0, 8)
    }
    return items
      .map((x) => ({ x, s: Math.max(score(query, x.name) * 2, score(query, `${x.group} ${x.tags.join(" ")}`), score(query, x.description) * 0.5) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 12)
      .map((r) => r.x)
  }, [query, items, recent])

  const pick = (item: PaletteItem) => {
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify([item.id, ...readRecent().filter((x) => x !== item.id)].slice(0, 6)))
    } catch {}
    onOpenChange(false)
    onPick(item)
  }

  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-index="${at}"]`)?.scrollIntoView({ block: "nearest" })
  }, [at])

  if (!open) return null
  const title = !query ? (recent.length ? "Recent" : "Suggestions") : `${results.length} ${results.length === 1 ? "result" : "results"}`
  return (
    <div className="fixed inset-0 z-[60] grid place-items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search widgets and components">
      <motion.div className="absolute inset-0 bg-black/45" onClick={() => onOpenChange(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: still ? 0 : 0.15 }} />
      <motion.div
        className="relative w-[min(640px,92vw)] overflow-hidden rounded-2xl border shadow-[0_24px_64px_-16px_rgb(0_0_0/0.5)]"
        style={{ borderColor: "var(--c-hair)", background: "var(--c-bar)" }}
        initial={still ? false : { opacity: 0, scale: 0.98, y: -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault()
            setAt((x) => Math.min(results.length - 1, x + 1))
          } else if (e.key === "ArrowUp") {
            e.preventDefault()
            setAt((x) => Math.max(0, x - 1))
          } else if (e.key === "Enter" && results[at]) {
            e.preventDefault()
            pick(results[at])
          } else if (e.key === "Escape") {
            e.preventDefault()
            e.stopPropagation()
            onOpenChange(false)
          }
        }}
      >
        <label className="flex h-14 items-center gap-3 border-b px-4" style={{ borderColor: "var(--c-hair)" }}>
          <Search className="size-5 shrink-0 text-(--c-t3)" />
          <input
            ref={input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setAt(0)
            }}
            placeholder="Search widgets and components…"
            aria-label="Search widgets and components"
            aria-controls="palette-results"
            aria-activedescendant={results[at] ? `palette-${results[at].id}` : undefined}
            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-(--c-t3)"
          />
          <kbd className="rounded border px-1.5 text-[0.6875rem] text-(--c-t3)" style={{ borderColor: "var(--c-hair)" }}>
            Esc
          </kbd>
        </label>
        <div ref={list} id="palette-results" role="listbox" aria-label={title} className="max-h-[min(60vh,440px)] overflow-y-auto p-2">
          <p className="flex items-center gap-1.5 px-3 pt-1 pb-2 text-xs text-(--c-t3)">
            {!query && recent.length > 0 && <Clock className="size-3" />}
            {title}
          </p>
          {results.length === 0 && <p className="px-3 py-8 text-center text-sm text-(--c-t2)">Nothing matches “{q}”. Try a category like “chart” or “inputs”.</p>}
          {results.map((x, i) => (
            <div
              key={x.id}
              id={`palette-${x.id}`}
              data-index={i}
              role="option"
              aria-selected={i === at}
              onPointerMove={() => setAt(i)}
              onClick={() => pick(x)}
              className={cn("flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5", i === at && "bg-(--c-on)")}
            >
              <span className="grid min-w-0 flex-1 gap-0.5">
                <span className="flex items-center gap-2 text-sm font-medium">
                  {x.name}
                  {x.isNew && (
                    <span className="rounded-full border px-1.5 text-[0.625rem] leading-4 font-normal" style={{ borderColor: "var(--brand-mark)", color: "var(--brand-text)" }}>
                      New
                    </span>
                  )}
                </span>
                <span className="truncate text-xs text-(--c-t2)">{x.description}</span>
              </span>
              <span className="shrink-0 text-xs text-(--c-t3)">
                {x.kind} · {x.group}
              </span>
              {i === at && <CornerDownLeft className="size-3.5 shrink-0 text-(--c-t3)" />}
            </div>
          ))}
        </div>
        <div className="flex gap-4 border-t px-4 py-2.5 text-xs text-(--c-t3)" style={{ borderColor: "var(--c-hair)" }}>
          <span>↑ ↓ move</span>
          <span>Enter open</span>
          <span>⌘K toggle</span>
        </div>
      </motion.div>
    </div>
  )
}
