"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, LayoutGrid, Maximize, Minus, Plus } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { studentNav } from "@/components/coach/nav"
import { Button } from "@/components/ui/button"
import { getDemoCoach } from "@/lib/data/coaches"
import { useCustomCommunities } from "@/lib/data/use-communities"
import { resolveCoach } from "@/lib/theme/resolve"
import { cn } from "@/lib/utils"
import { EditorBar, useDraftEditor } from "./editor-shell"

/** Every page is laid out at real desktop width on the canvas; its height is its own (FRAME.h until measured, never below MIN_H). */
const FRAME = { w: 1280, h: 820 }
const MIN_H = 560
const MAX_H = 8000
const COLS = 3
const GAP = { x: 160, y: 220 }
const MIN_Z = 0.05
const MAX_Z = 1.5

type Cam = { x: number; y: number; z: number }

/**
 * A zoomed-in page is live (scroll it, hover the widgets) but stays on its own
 * page: clicks on links and buttons inside it do nothing.
 */
const guarded = new WeakSet<Document>()
function stayOnPage(frame: HTMLIFrameElement | null) {
  const doc = frame?.contentDocument
  if (!doc || guarded.has(doc)) return
  guarded.add(doc)
  doc.addEventListener(
    "click",
    (e) => {
      if ((e.target as Element).closest("a, button")) {
        e.preventDefault()
        e.stopPropagation()
      }
    },
    true,
  )
  // Escape still leads back to all pages when the page has keyboard focus.
  doc.addEventListener("keydown", (e) => e.key === "Escape" && window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })))
}

/** The pages fill their window (min-h-svh), so their content height is read with that floor lifted for a moment. */
const FLOOR_OFF = ".min-h-svh, [class*='min-h-[calc(100svh']{min-height:0!important}"

/** Reports a page's content height now and whenever it grows; returns the cleanup. */
function watchHeight(frame: HTMLIFrameElement, report: (h: number) => void) {
  const doc = frame.contentDocument
  if (!doc?.body) return () => {}
  const measure = () => {
    const style = doc.createElement("style")
    style.textContent = FLOOR_OFF
    doc.head.append(style)
    const h = Math.ceil(doc.body.getBoundingClientRect().height)
    style.remove()
    if (h > 0) report(h)
  }
  measure()
  const ro = new ResizeObserver(measure)
  ro.observe(doc.body)
  const timers = [400, 1500, 3500].map((ms) => window.setTimeout(measure, ms))
  return () => {
    ro.disconnect()
    timers.forEach(window.clearTimeout)
  }
}

const clampZ = (z: number) => Math.min(MAX_Z, Math.max(MIN_Z, z))

/**
 * ADM-38: all of the students' pages side by side on an infinite canvas, so
 * a coach can compare them. Drag to move around, pinch or ⌘-scroll to zoom,
 * click a page to zoom into it (it becomes live: scroll it, hover the widgets).
 */
export function PagesCanvas() {
  const { coach: published } = useCoach()
  const slug = published.slug
  const editor = useDraftEditor(slug)
  // Wizard-made communities aren't known on the server or at first paint; use the published coach meanwhile.
  const custom = useCustomCommunities()
  const original = getDemoCoach(slug) ?? custom.find((c) => c.slug === slug) ?? published
  const coach = useMemo(() => resolveCoach(original, editor.working.content), [original, editor.working.content])
  const [heights, setHeights] = useState<Record<string, number>>({})
  const nav = studentNav(coach, `/c/${slug}`)
  const heightOf = (id: string) => Math.min(MAX_H, Math.max(MIN_H, heights[id] ?? FRAME.h))
  // A row is as tall as its tallest page; each page keeps its own height inside it.
  const rows = Math.ceil(nav.length / COLS)
  const rowTops: number[] = []
  for (let r = 0, top = 0; r < rows; r++) {
    rowTops.push(top)
    top += Math.max(...nav.slice(r * COLS, r * COLS + COLS).map((p) => heightOf(p.id))) + GAP.y
  }
  const pages = nav.map((p, i) => ({ ...p, x: (i % COLS) * (FRAME.w + GAP.x), y: rowTops[Math.floor(i / COLS)], h: heightOf(p.id) }))
  const world = {
    w: Math.min(pages.length, COLS) * (FRAME.w + GAP.x) - GAP.x,
    h: Math.max(...pages.map((p) => p.y + p.h)),
  }
  // fitAll reads the world through a ref, so a page growing doesn't re-run the resize effect and recentre a camera the coach moved.
  const worldRef = useRef(world)
  useEffect(() => {
    worldRef.current = world
  })
  const watchers = useRef(new Map<string, () => void>())
  useEffect(() => {
    const all = watchers.current
    return () => all.forEach((stop) => stop())
  }, [])
  const watch = (id: string, frame: HTMLIFrameElement) => {
    watchers.current.get(id)?.()
    watchers.current.set(
      id,
      watchHeight(frame, (h) => setHeights((cur) => (cur[id] === h ? cur : { ...cur, [id]: h }))),
    )
  }

  const view = useRef<HTMLDivElement>(null)
  const [cam, setCam] = useState<Cam>({ x: 0, y: 0, z: 0.2 })
  const [animate, setAnimate] = useState(false)
  const [focus, setFocus] = useState<number | null>(null)
  const [ready, setReady] = useState(false)
  // The pages load one after the other, the one in focus first: with all of them compiling at once (in development) the
  // server's build files get written over each other and it answers with errors. A page that never loads is skipped after 10 s.
  const [turn, setTurn] = useState(1)
  useEffect(() => {
    const id = setTimeout(() => setTurn((t) => (t === turn ? t + 1 : t)), 10000)
    return () => clearTimeout(id)
  }, [turn])

  /** Move the camera so a box (in world units) fits the view with some padding. */
  const fitBox = useCallback((box: { x: number; y: number; w: number; h: number }, pad: number, top = 0) => {
    const el = view.current
    if (!el) return
    const vw = el.clientWidth
    const vh = el.clientHeight - top
    const z = clampZ(Math.min((vw - pad * 2) / box.w, (vh - pad * 2) / box.h))
    setAnimate(true)
    setCam({
      z,
      x: (vw - box.w * z) / 2 - box.x * z,
      y: top + (vh - box.h * z) / 2 - box.y * z,
    })
  }, [])

  // True while the camera shows the automatic "all pages" view, so it can follow size changes.
  const fitted = useRef(false)

  const fitAll = useCallback(() => {
    fitted.current = true
    setFocus(null)
    fitBox({ x: 0, y: -60, w: worldRef.current.w, h: worldRef.current.h + 60 }, 64)
  }, [fitBox])

  const open = (i: number) => {
    fitted.current = false
    setFocus(i)
    fitBox({ x: pages[i].x, y: pages[i].y, w: FRAME.w, h: pages[i].h }, 24, 56)
  }

  // Show all pages each time the canvas is shown, and keep them in view as its size
  // changes (the admin menu opening, say) until the coach moves the camera.
  useEffect(() => {
    const el = view.current
    if (!el) return
    let first = true
    const ro = new ResizeObserver(() => {
      if (el.clientWidth > 0 && (first || fitted.current)) {
        first = false
        fitAll()
        setAnimate(false)
        setReady(true)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [fitAll])

  // Escape goes back to all pages.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && focus !== null && fitAll()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [focus, fitAll])

  /** Zoom by a factor around a point in the view (defaults to the centre). */
  const zoomBy = useCallback((k: number, at?: { x: number; y: number }, smooth = true) => {
    const el = view.current
    if (!el) return
    const p = at ?? { x: el.clientWidth / 2, y: el.clientHeight / 2 }
    fitted.current = false
    setAnimate(smooth)
    setCam((c) => {
      const z = clampZ(c.z * k)
      return {
        z,
        x: p.x - ((p.x - c.x) * z) / c.z,
        y: p.y - ((p.y - c.y) * z) / c.z,
      }
    })
  }, [])

  // Trackpad: two-finger scroll pans, pinch (sent as ctrl + wheel) or ⌘ + wheel zooms.
  useEffect(() => {
    const el = view.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.ctrlKey || e.metaKey) {
        const r = el.getBoundingClientRect()
        zoomBy(Math.exp(-e.deltaY * 0.01), { x: e.clientX - r.left, y: e.clientY - r.top }, false)
      } else {
        fitted.current = false
        setAnimate(false)
        setCam((c) => ({ ...c, x: c.x - e.deltaX, y: c.y - e.deltaY }))
      }
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [zoomBy])

  // Drag anywhere to pan; a press that doesn't move is a click on the page under it.
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null)
  const [panning, setPanning] = useState(false)
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest("button, a")) return
    drag.current = { x: e.clientX, y: e.clientY, moved: false }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (!d.moved && Math.hypot(dx, dy) < 4) return
    if (!d.moved) setPanning(true)
    d.moved = true
    d.x = e.clientX
    d.y = e.clientY
    fitted.current = false
    setAnimate(false)
    setCam((c) => ({ ...c, x: c.x + dx, y: c.y + dy }))
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current
    drag.current = null
    setPanning(false)
    if (!d || d.moved) return
    // The view captured the pointer, so find what is actually under it.
    const card = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-page]")
    if (card) open(Number(card.dataset.page))
    else if (focus !== null) fitAll()
  }

  const focused = focus !== null ? pages[focus] : null
  const dot = 22 * cam.z < 8 ? 22 * 4 * cam.z : 22 * cam.z // keep the dots from getting too dense when zoomed out

  return (
    // A screen of its own over the admin, like the Design workspace: the same bar, the same colours.
    <div role="dialog" aria-modal aria-label="All pages" className="fixed inset-0 z-50 grid grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-background [--background:#0b0b0c] [--border:rgb(255_255_255/0.08)] [--ring:rgb(244_244_245/0.6)]">
      <EditorBar
        slug={slug}
        title="All pages"
        back={{ href: `/admin/${slug}/design?mode=arrange&panel=pages${focused ? `&page=${focused.id}` : ""}`, label: "Design" }}
        editor={editor}
        previewHref={`${focused?.href ?? `/c/${slug}`}?preview=draft`}
        guide={{
          title: "Your pages",
          text: "Every page your students see, side by side. Click one to zoom in and look closely, then open it in Design to arrange its widgets.",
        }}
      />

      <div
        ref={view}
        className={cn("relative min-h-[70svh] touch-none overflow-clip bg-[#2b2b2e] select-none [overflow-anchor:none] lg:min-h-0", panning ? "cursor-grabbing" : "cursor-grab")}
        style={{
          backgroundImage: "radial-gradient(circle, color-mix(in oklab, var(--foreground) 13%, transparent) 1px, transparent 1.4px)",
          backgroundSize: `${dot}px ${dot}px`,
          backgroundPosition: `${cam.x}px ${cam.y}px`,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          drag.current = null
          setPanning(false)
        }}
      >
        <div
          className={cn(
            "absolute top-0 left-0 origin-top-left",
            animate && "transition-transform duration-500 ease-out",
            !ready && "opacity-0",
          )}
          style={{
            transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.z})`,
            width: world.w,
            height: world.h,
          }}
          onTransitionEnd={() => setAnimate(false)}
        >
          {pages.map((p, i) => {
            const Icon = p.icon
            const on = focus === i
            return (
              <div key={p.id} className="absolute" style={{ left: p.x, top: p.y, width: FRAME.w, height: p.h }}>
                {/* The label keeps a readable size at any zoom. */}
                <div
                  className={cn(
                    "absolute bottom-full left-0 flex origin-bottom-left items-center gap-1.5 pb-2 text-[0.8125rem] whitespace-nowrap",
                    on ? "text-foreground" : "text-muted-foreground",
                  )}
                  style={{ transform: `scale(${1 / cam.z})` }}
                >
                  <Icon className="size-3.5" />
                  <span className="font-medium text-foreground">{p.label}</span>
                  {p.id !== "home" && <span className="font-mono text-[0.6875rem]">{p.href.replace(`/c/${slug}`, "")}</span>}
                  {p.id === "home" && <span className="rounded bg-foreground/8 px-1.5 py-0.5 text-[0.6875rem]">Widgets</span>}
                </div>
                <div
                  data-page={i}
                  className={cn(
                    "size-full overflow-hidden rounded-[18px] bg-background shadow-[0_1px_2px_rgb(0_0_0/0.06),0_12px_40px_-12px_rgb(0_0_0/0.25)] ring-1 ring-black/10 transition-[box-shadow] dark:ring-white/10",
                    !on && "hover:ring-[6px] hover:ring-primary/50",
                  )}
                >
                  {(i < turn || on) && (
                    <iframe
                      src={`${p.href}?preview=draft`}
                      title={`${p.label} page`}
                      loading="lazy"
                      tabIndex={on ? 0 : -1}
                      className={cn("size-full border-0", !on && "pointer-events-none")}
                      ref={stayOnPage}
                      onLoad={(e) => {
                        stayOnPage(e.currentTarget)
                        watch(p.id, e.currentTarget)
                        // Its turn is done: the next page's, after a short rest.
                        if (i === turn - 1) setTimeout(() => setTurn((t) => (t === turn ? t + 1 : t)), 400)
                      }}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Zoomed into a page */}
        {focused && (
          <div
            className="absolute inset-x-0 top-0 flex items-center gap-2 border-b bg-background/85 px-3 py-2 backdrop-blur"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Button variant="ghost" size="sm" onClick={fitAll}>
              <ArrowLeft /> All pages
            </Button>
            <span className="text-sm font-medium">{focused.label}</span>
            <span className="hidden text-xs text-muted-foreground sm:inline">Live preview of your draft · Esc to go back</span>
            <div className="ml-auto flex items-center gap-1">
              {pages.map((p, i) => (
                <Button key={p.id} variant={i === focus ? "secondary" : "ghost"} size="xs" onClick={() => open(i)}>
                  {p.label}
                </Button>
              ))}
            </div>
            <Button size="sm" nativeButton={false} render={<Link href={`/admin/${slug}/design?mode=arrange&panel=pages&page=${focused.id}`} />}>
              <LayoutGrid /> Edit widgets
            </Button>
          </div>
        )}

        {/* Zoom controls, bottom centre like the editor's canvas bar (the prototype switcher sits bottom left) */}
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3" onPointerDown={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-0.5 rounded-lg border bg-background p-0.5 shadow-sm" onPointerDown={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon-sm" aria-label="Zoom out" onClick={() => zoomBy(1 / 1.25)}>
              <Minus />
            </Button>
            <button
              className="w-12 text-center text-xs tabular-nums text-muted-foreground hover:text-foreground"
              onClick={() => zoomBy(1 / cam.z)}
              title="Zoom to 100%"
            >
              {Math.round(cam.z * 100)}%
            </button>
            <Button variant="ghost" size="icon-sm" aria-label="Zoom in" onClick={() => zoomBy(1.25)}>
              <Plus />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Show all pages" title="Show all pages" onClick={fitAll}>
              <Maximize />
            </Button>
          </div>
          {!focused && (
            <p className="pointer-events-none hidden text-xs whitespace-nowrap text-muted-foreground xl:block">
              Drag to move · Pinch or ⌘ + scroll to zoom · Click a page to open it
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
