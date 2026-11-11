"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { ArrowRight, Pencil, Play, Plus, Search } from "@/components/icons"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ADMIN_STUDENTS, COURSES, FEEDBACK_REQUESTS } from "@/lib/data/sample"
import { cn } from "@/lib/utils"

type GroupId = "students" | "journal" | "content" | "go"
type Item = {
  id: string
  group: GroupId
  title: string
  detail?: string
  href: string
  /** Keyboard shortcut shown on the right, and listened for when the palette is closed: "g s" is G then S, "c" is C. */
  keys?: string
  initials?: string
  icon?: "edit" | "play" | "arrow" | "plus"
}

const GROUPS: { id: GroupId; label: string; max: number }[] = [
  { id: "students", label: "Students", max: 4 },
  { id: "journal", label: "Journal & feedback", max: 3 },
  { id: "content", label: "Content", max: 4 },
  { id: "go", label: "Go to", max: 6 },
]

/** Sample contact details for the people in the sample data (Figma 524:13831 shows e-mail and tier). */
const PEOPLE: Record<string, { email: string; tier: string }> = {
  "Alex Moreau": { email: "alex.m@fastmail.com", tier: "Core" },
  "Mia Sørensen": { email: "mia.s@proton.me", tier: "Trading Desk" },
  "Tom Becker": { email: "tom@beckerfx.de", tier: "Core" },
  "Lena Ito": { email: "lena.ito@gmail.com", tier: "Core" },
  "Jonas Pereira": { email: "jonas.p@outlook.com", tier: "1:1 VIP" },
  "Sara Kowalski": { email: "sara.k@wp.pl", tier: "Trading Desk" },
}
const EXTRA_STUDENTS = [{ id: "x1", name: "Mikael Koski", initials: "MK", email: "mk@koski.fi", tier: "Inner Circle" }]

/** Where "g" then a letter goes, and what "c" does. Shown on the matching rows. */
const GO_KEYS: Record<string, string> = { overview: "g o", journal: "g j", content: "g c", downloads: "g d", livestreams: "g l", sales: "g s", partners: "g p", ranking: "g r" }

const NAV: { id: string; label: string; path: string }[] = [
  { id: "overview", label: "Overview", path: "" },
  { id: "students", label: "Students", path: "/students" },
  { id: "journal", label: "Journal & feedback", path: "/journal" },
  { id: "content", label: "Content", path: "/content" },
  { id: "downloads", label: "Downloads", path: "/downloads" },
  { id: "calendar", label: "Calendar", path: "/calendar" },
  { id: "livestreams", label: "Livestreams", path: "/livestreams" },
  { id: "charts", label: "Charts", path: "/charts" },
  { id: "community", label: "Community", path: "/community" },
  { id: "ai", label: "AI assistant", path: "/ai" },
  { id: "partners", label: "Partners", path: "/partners" },
  { id: "ranking", label: "Ranking", path: "/ranking" },
  { id: "design", label: "Design", path: "/design" },
  { id: "settings", label: "Settings", path: "/settings" },
]

function buildItems(base: string): Item[] {
  const students: Item[] = [
    ...ADMIN_STUDENTS.map((s) => ({ id: s.id, name: s.name, initials: s.initials, email: PEOPLE[s.name]?.email ?? "", tier: PEOPLE[s.name]?.tier ?? s.tier })),
    ...EXTRA_STUDENTS,
  ].map((s) => ({ id: `student-${s.id}`, group: "students", title: s.name, detail: `${s.email} · ${s.tier}`, initials: s.initials, href: `${base}/students` }))
  const journal: Item[] = FEEDBACK_REQUESTS.map((f) => ({ id: `journal-${f.id}`, group: "journal", title: `Request from ${f.student}`, detail: `“${f.note}” · ${f.waiting} ago`, icon: "edit", href: `${base}/journal` }))
  const content: Item[] = COURSES.flatMap((c) =>
    c.modules.flatMap((m) => m.lessons.map((l) => ({ id: `lesson-${l.id}`, group: "content" as const, title: `Lesson · ${l.title}`, detail: `${c.title} · ${m.title.split(" · ")[0]}`, icon: "play" as const, href: `${base}/content` })))
  )
  const go: Item[] = [
    { id: "go-new-coupon", group: "go", title: "New coupon", icon: "plus", keys: "c", href: `${base}/sales` },
    { id: "go-go-live", group: "go", title: "Go live", icon: "plus", href: `${base}/livestreams` },
    { id: "go-sales-transactions", group: "go", title: "Sales & payments → Transactions", icon: "arrow", keys: GO_KEYS.sales, href: `${base}/sales` },
    ...NAV.filter((n) => n.id !== "sales").map<Item>((n) => ({ id: `go-${n.id}`, group: "go", title: n.label, icon: "arrow", keys: GO_KEYS[n.id], href: `${base}${n.path}` })),
  ]
  return [...students, ...journal, ...content, ...go]
}

/** Lower case, no accents, so "sorensen" finds "Sørensen". */
const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ø/g, "o").replace(/æ/g, "ae").replace(/ß/g, "ss").replace(/ł/g, "l")

function search(items: Item[], query: string): Item[] {
  const tokens = fold(query).split(/\s+/).filter(Boolean)
  const hits = tokens.length
    ? items.filter((i) => {
        const hay = fold(`${i.title} ${i.detail ?? ""}`)
        return tokens.every((t) => hay.includes(t))
      })
    : items.filter((i) => i.group === "go")
  const first = tokens[0] ?? ""
  // Titles that start with what you typed come first, inside each group.
  const rank = (i: Item) => (first && fold(i.title).replace(/^lesson · |^request from /, "").startsWith(first) ? 0 : 1)
  return GROUPS.flatMap((g) => hits.filter((i) => i.group === g.id).sort((a, b) => rank(a) - rank(b)).slice(0, g.max))
}

const isEditable = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName))

/**
 * ⌘K search (Figma 524:13831). Opened from the topbar field, the search button on small screens, or ⌘K / Ctrl K.
 * Closed, it also listens for the shortcuts it lists: G then a letter to go somewhere, C for a new coupon.
 * Opening is instant on purpose: people open it hundreds of times a day.
 */
export function CommandPalette({ open, onOpenChange, base }: { open: boolean; onOpenChange: (o: boolean) => void; base: string }) {
  const router = useRouter()
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const all = useMemo(() => buildItems(base), [base])
  const results = useMemo(() => search(all, query), [all, query])
  const current = results[Math.min(active, results.length - 1)]
  const optionId = (i: Item) => `${listId}-${i.id}`

  const go = (href: string) => {
    onOpenChange(false)
    router.push(href)
  }
  const change = (o: boolean) => {
    if (o) {
      setQuery("")
      setActive(0)
    }
    onOpenChange(o)
  }

  useEffect(() => {
    let gAt = 0
    const keyed = all.filter((i) => i.keys)
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        change(!open)
        return
      }
      if (open || e.metaKey || e.ctrlKey || e.altKey || e.repeat || e.isComposing || isEditable(e.target) || document.querySelector("[role=dialog], [role=menu], [role=listbox]")) return
      const key = e.key.toLowerCase()
      const hit = keyed.find((i) => (Date.now() - gAt < 1200 ? i.keys === `g ${key}` : i.keys === key))
      if (hit) {
        e.preventDefault()
        gAt = 0
        router.push(hit.href)
      } else gAt = key === "g" ? Date.now() : 0
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // `change` only wraps state setters and onOpenChange.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, all, router])

  const move = (to: number) => {
    const next = (to + results.length) % Math.max(results.length, 1)
    setActive(next)
    // Keep the row in view while arrowing; the mouse never calls this.
    requestAnimationFrame(() => document.getElementById(optionId(results[next]))?.scrollIntoView({ block: "nearest" }))
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={change}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-a-scrim" />
        <DialogPrimitive.Popup
          initialFocus={inputRef}
          data-slot="command-palette"
          className="fixed top-4 left-1/2 z-50 flex max-h-[calc(100svh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 flex-col overflow-hidden rounded-[14px] border border-a-border-strong bg-a-raised text-a-text shadow-[0_30px_60px_rgb(0_0_0/0.6)] outline-none sm:top-[140px] sm:max-h-[calc(100svh-156px)] sm:w-[640px]"
        >
          <DialogPrimitive.Title className="sr-only">Search</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">Search students, lessons, payments and settings. Use the arrow keys to move and Enter to open.</DialogPrimitive.Description>
          <div className="flex h-11 shrink-0 items-center gap-2 rounded-t-a-md border-b border-a-border-subtle bg-a-field px-3">
            <Search aria-hidden className="size-4 shrink-0 text-a-icon" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActive(0)
              }}
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing) return
                if (e.key === "ArrowDown") {
                  e.preventDefault()
                  move(active + 1)
                } else if (e.key === "ArrowUp") {
                  e.preventDefault()
                  move(active - 1)
                } else if (e.key === "Home" && !query) {
                  e.preventDefault()
                  move(0)
                } else if (e.key === "End" && !query) {
                  e.preventDefault()
                  move(results.length - 1)
                } else if (e.key === "Enter" && current) {
                  e.preventDefault()
                  go(current.href)
                }
              }}
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-activedescendant={current ? optionId(current) : undefined}
              aria-autocomplete="list"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="Search"
              aria-label="Search"
              className="t-body-l min-w-0 flex-1 bg-transparent text-a-text outline-none placeholder:text-a-text-3"
            />
          </div>
          <div id={listId} role="listbox" aria-label="Results" className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {results.length === 0 ? (
              <div className="flex flex-col items-center gap-1 px-4 py-10 text-center">
                <span className="t-body-m text-a-text">No results for “{query.trim()}”</span>
                <span className="t-caption text-a-text-2">Try a student name, a lesson or a page.</span>
              </div>
            ) : (
              GROUPS.map((g) => {
                const rows = results.filter((r) => r.group === g.id)
                if (!rows.length) return null
                return (
                  <div key={g.id} role="group" aria-label={g.label} className="flex flex-col gap-0.5 px-2.5 pt-2.5 pb-1.5">
                    <span aria-hidden className="t-mono-label-s text-a-text-3">{g.label}</span>
                    {rows.map((r) => {
                      const on = r === current
                      return (
                        <div
                          key={r.id}
                          id={optionId(r)}
                          role="option"
                          aria-selected={on}
                          onMouseMove={() => !on && setActive(results.indexOf(r))}
                          onClick={() => go(r.href)}
                          className={cn("flex cursor-pointer items-center gap-2.5 rounded-a-md px-2.5 py-2", on && "bg-a-muted")}
                        >
                          {r.initials ? (
                            <Avatar className="size-8 shrink-0">
                              <AvatarFallback className="text-xs">{r.initials}</AvatarFallback>
                            </Avatar>
                          ) : (
                            <span aria-hidden className="grid w-3.5 shrink-0 place-items-center text-a-icon">
                              {r.icon === "edit" && <Pencil className="size-3.5" />}
                              {r.icon === "play" && <Play className="size-3" />}
                              {r.icon === "arrow" && <ArrowRight className="size-3.5" />}
                              {r.icon === "plus" && <Plus className="size-4" />}
                            </span>
                          )}
                          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="t-body-m truncate text-a-text">{r.title}</span>
                            {r.detail && <span className="t-caption truncate text-a-text-2">{r.detail}</span>}
                          </span>
                          {r.keys ? (
                            <span aria-hidden className="t-micro shrink-0 uppercase text-a-text-3">{r.keys}</span>
                          ) : (
                            on && <span aria-hidden className="t-micro shrink-0 text-a-text-3">↵ Open</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2 border-t border-a-selected px-4 py-2.5 t-micro text-a-text-3">
            <span className="truncate">↑↓ to move · ↵ to open · Esc to close</span>
            <span className="ml-auto hidden truncate sm:block">Search students, lessons, payments and settings</span>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
