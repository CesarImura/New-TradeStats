"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, LayoutGrid, Maximize, Minus, Plus } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { studentNav } from "@/components/coach/nav"
import { Button } from "@/components/ui/button"
import { getCoach } from "@/lib/data/coaches"
import { resolveCoach } from "@/lib/theme/resolve"
import { cn } from "@/lib/utils"
import { EditorBar, useDraftEditor } from "./editor-shell"

/** Every page is laid out at real desktop size on the canvas. */
const FRAME = { w: 1280, h: 820 }
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
  const coach = useMemo(() => resolveCoach(getCoach(slug)!, editor.working.content), [slug, editor.working.content])
  const pages = studentNav(coach, `/c/${slug}`).map((p, i) => ({
    ...p,
    x: (i % COLS) * (FRAME.w + GAP.x),
    y: Math.floor(i / COLS) * (FRAME.h + GAP.y),
  }))
  const rows = Math.ceil(pages.length / COLS)
  const world = {
    w: Math.min(pages.length, COLS) * (FRAME.w + GAP.x) - GAP.x,
    h: rows * (FRAME.h + GAP.y) - GAP.y,
  }

  const view = useRef<HTMLDivElement>(null)
  const [cam, setCam] = useState<Cam>({ x: 0, y: 0, z: 0.2 })
  const [animate, setAnimate] = useState(false)
  const [focus, setFocus] = useState<number | null>(null)
  const [ready, setReady] = useState(false)

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
    fitBox({ x: 0, y: -60, w: world.w, h: world.h + 60 }, 64)
  }, [fitBox, world.w, world.h])

  const open = (i: number) => {
    fitted.current = false
    setFocus(i)
    fitBox({ x: pages[i].x, y: pages[i].y, w: FRAME.w, h: FRAME.h }, 24, 56)
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
    <div className="-m-4 grid min-h-[calc(100svh-3.5rem)] grid-rows-[auto_1fr] md:-m-6 lg:-m-8 lg:h-[calc(100svh-3.5rem)]">
      <EditorBar
        slug={slug}
        active="pages"
        editor={editor}
        previewHref={`${focused?.href ?? `/c/${slug}`}?preview=draft`}
        guide={{
          title: "Your pages",
          text: "Every page your students see, side by side. Click one to zoom in and look closely; the Home page has its own widget builder.",
        }}
      />

      <div
        ref={view}
        className={cn("relative min-h-[70svh] touch-none overflow-hidden bg-muted/40 select-none lg:min-h-0", panning ? "cursor-grabbing" : "cursor-grab")}
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
            animate && "transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
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
              <div key={p.id} className="absolute" style={{ left: p.x, top: p.y, width: FRAME.w, height: FRAME.h }}>
                {/* The label keeps a readable size at any zoom. */}
                <div
                  className={cn(
                    "absolute bottom-full left-0 flex origin-bottom-left items-center gap-1.5 pb-2 text-[13px] whitespace-nowrap",
                    on ? "text-foreground" : "text-muted-foreground",
                  )}
                  style={{ transform: `scale(${1 / cam.z})` }}
                >
                  <Icon className="size-3.5" />
                  <span className="font-medium text-foreground">{p.label}</span>
                  {p.id !== "home" && <span className="font-mono text-[11px]">{p.href.replace(`/c/${slug}`, "")}</span>}
                  {p.id === "home" && <span className="rounded bg-foreground/8 px-1.5 py-0.5 text-[11px]">Widgets</span>}
                </div>
                <div
                  data-page={i}
                  className={cn(
                    "size-full overflow-hidden rounded-[18px] bg-background shadow-[0_1px_2px_rgb(0_0_0/0.06),0_12px_40px_-12px_rgb(0_0_0/0.25)] ring-1 ring-black/10 transition-[box-shadow] dark:ring-white/10",
                    !on && "hover:ring-[6px] hover:ring-primary/50",
                  )}
                >
                  <iframe
                    src={`${p.href}?preview=draft`}
                    title={`${p.label} page`}
                    loading="lazy"
                    tabIndex={on ? 0 : -1}
                    className={cn("size-full border-0", !on && "pointer-events-none")}
                    ref={stayOnPage}
                    onLoad={(e) => stayOnPage(e.currentTarget)}
                  />
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
            {focused.id === "home" && (
              <Button size="sm" nativeButton={false} render={<Link href={`/admin/${slug}/design/home`} />}>
                <LayoutGrid /> Edit widgets
              </Button>
            )}
          </div>
        )}

        {/* Zoom controls (bottom left: the prototype switcher sits bottom right) */}
        <div className="absolute bottom-3 left-3 flex items-center gap-3" onPointerDown={(e) => e.stopPropagation()}>
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
            <p className="pointer-events-none hidden text-xs text-muted-foreground md:block">
              Drag to move · Pinch or ⌘ + scroll to zoom · Click a page to open it
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
