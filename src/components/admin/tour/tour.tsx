"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { setStored, useStored } from "@/lib/prototype-store"
import { cn } from "@/lib/utils"
import { AdminButton, StepIndicator } from "../ui"
import { isTourId, TOURS, tourKey, type Side, type Tour, type TourState, type TourStep } from "./tours"

const NONE: TourState = null
type Box = { x: number; y: number; w: number; h: number; open?: boolean }

/** The tour in progress for this platform, and the ways to move it. */
export function useTourState() {
  const { coach } = useCoach()
  const key = tourKey(coach.slug)
  const state = useStored<TourState>(key, NONE)
  const set = useCallback((next: TourState | ((s: TourState) => TourState)) => setStored<TourState>(key, next, NONE), [key])
  return { state, set, tour: state ? TOURS[state.id] : undefined }
}

/**
 * Getting started · the tour layer (Figma: Tour overlay, Spotlight ring, Coachmark, Course tour pill and panel).
 * Mounted once in the admin shell. Opening a page with `?tour=<id>` starts that tour with its panel open; the pill
 * stays in the corner until the tour is done, so it can be resumed from any page.
 */
export function TourLayer() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const { coach, base } = useCoach()
  const { state, set, tour } = useTourState()
  const asked = params.get("tour")

  // ?tour=… (from Getting started): open that tour's panel, or resume it, then drop the parameter.
  useEffect(() => {
    if (!isTourId(asked)) return
    set((s) => (s?.id === asked ? { ...s, started: !!s.at, panel: !s.at } : { id: asked, started: false, panel: true }))
    const rest = new URLSearchParams(params.toString())
    rest.delete("tour")
    router.replace(`${pathname}${rest.size ? `?${rest}` : ""}`, { scroll: false })
  }, [asked, params, pathname, router, set])

  // Followed even while paused: doing the last thing by hand still completes the item.
  const step = useActiveStep(tour, !!state)

  // The panel folds back into the pill when the coach goes to another page (the pill stays).
  const lastPath = useRef(pathname)
  useEffect(() => {
    if (lastPath.current === pathname) return
    lastPath.current = pathname
    set((s) => (s?.panel && !asked ? { ...s, panel: false } : s))
  }, [pathname, asked, set])
  const stepIndex = tour && step ? tour.steps.indexOf(step) : -1

  // Remember the furthest step (Getting started says "Paused at …"); the last one completes the item.
  useEffect(() => {
    if (!tour || !step || !state) return
    if (step.final && !state.done) {
      tour.complete(coach.slug)
      set((s) => (s ? { ...s, done: true, at: step.id } : s))
      return
    }
    const at = state.at ? tour.steps.findIndex((x) => x.id === state.at) : -1
    if (state.started && stepIndex > at) {
      const q = new URLSearchParams(location.search)
      q.delete("tour")
      set((s) => (s ? { ...s, at: step.id, path: `${pathname}${q.size ? `?${q}` : ""}` } : s))
    }
  }, [tour, step, stepIndex, state, coach.slug, set, pathname])

  if (!tour || !state) return null
  const part = step ? step.part : state.at ? tour.steps.find((x) => x.id === state.at)?.part ?? 0 : 0
  const progress = state.done ? 1 : state.at ? (part + (state.started ? 0.5 : 0)) / tour.parts.length : 0

  const pause = () => set((s) => (s ? { ...s, started: false, panel: false } : s))
  const finish = () => {
    set(null)
    router.push(`${base}/getting-started`)
  }

  return createPortal(
    <>
      {state.started && step && <Spotlight key={tour.id} step={step} tour={tour} onSkip={pause} onFinish={finish} />}
      <Pill tour={tour} done={!!state.done} label={state.done ? step?.pill ?? tour.doneTitle : tour.title} progress={progress} open={state.panel} onToggle={() => (state.done ? finish() : set((s) => (s ? { ...s, panel: !s.panel } : s)))} />
      {state.panel && !state.done && <Panel tour={tour} part={state.at ? part : 0} resumed={!!state.at} onStart={() => set((s) => (s ? { ...s, started: true, panel: false } : s))} />}
    </>,
    document.body,
  )
}

/** The last step of the tour whose target is on screen, followed as the page changes. */
function useActiveStep(tour: Tour | undefined, on: boolean) {
  const [id, setId] = useState<string | null>(null)
  useEffect(() => {
    if (!tour || !on) return
    let frame = 0
    const check = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        let found: string | null = null
        for (const s of tour.steps) if (visible(document.querySelector(s.target))) found = s.id
        setId(found)
      })
    }
    check()
    const mo = new MutationObserver(check)
    mo.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-state", "data-picked", "data-named", "data-tour", "class", "hidden"] })
    // Focus moves change some steps too ("name the lesson" stays while its field is being typed in).
    addEventListener("focusin", check)
    addEventListener("focusout", check)
    return () => {
      mo.disconnect()
      cancelAnimationFrame(frame)
      removeEventListener("focusin", check)
      removeEventListener("focusout", check)
    }
  }, [tour, on])
  return on && tour ? tour.steps.find((s) => s.id === id) : undefined
}

/** On screen, and not inside a dialog or drawer that is closing (Base UI keeps it for its exit animation). */
const visible = (el: Element | null): el is HTMLElement =>
  !!el && (el as HTMLElement).getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden" && !el.closest("[data-ending-style], [data-closed]")

/** Where the target is, kept in step with scrolling, resizing and layout changes. */
function useBox(selector: string) {
  const [box, setBox] = useState<Box | null>(null)
  useLayoutEffect(() => {
    let frame = 0
    let last = ""
    const tick = () => {
      const el = document.querySelector(selector)
      const r = el && visible(el) ? el.getBoundingClientRect() : null
      // A menu opened from the target (Visibility): the coachmark steps aside so it never covers the options.
      const open = !!el && (el.getAttribute("aria-expanded") === "true" || !!el.querySelector('[aria-expanded="true"]'))
      const next = r ? `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.width)},${Math.round(r.height)},${open}` : ""
      if (next !== last) {
        last = next
        setBox(r ? { x: r.x, y: r.y, w: r.width, h: r.height, open } : null)
      }
      frame = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(frame)
  }, [selector])
  return box
}

const PAD = 8 // the cut-out is the target plus 8 on each side (Figma: 124 x 36 button, 140 x 52 ring)
const GAP = 18 // from the cut-out to the coachmark (the 10 px arrow sits in it)
const W = 320

function Spotlight({ step, tour, onSkip, onFinish }: { step: TourStep; tour: Tour; onSkip: () => void; onFinish: () => void }) {
  const box = useBox(step.target)
  const card = useRef<HTMLDivElement>(null)
  const [h, setH] = useState(152)
  const scrolled = useRef<string | null>(null)

  // Bring the target into view once per step.
  useEffect(() => {
    if (scrolled.current === step.id) return
    scrolled.current = step.id
    const el = document.querySelector(step.target)
    if (!el) return
    const r = el.getBoundingClientRect()
    if (r.top < 64 || r.bottom > innerHeight - 64) el.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })
  }, [step])
  const shown = !!box
  useLayoutEffect(() => {
    const el = card.current
    if (!el) return
    const ro = new ResizeObserver(() => setH(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [step.id, shown])

  if (!box) return null
  const hole = { x: box.x - PAD, y: box.y - PAD, w: box.w + PAD * 2, h: box.h + PAD * 2 }
  const inDialog = !!document.querySelector(step.target)?.closest("[role=dialog]")
  const { side, x, y, arrow } = place(hole, h, step.side)
  const Hint = { bottom: ArrowUp, top: ArrowDown, right: ArrowLeft, left: ArrowRight }[side]
  const progressIndex = step.part

  return (
    <>
      {/* The page around the target is dimmed (a dialog or drawer dims it already). Under menus and popovers (z 50), so a
          select opened from the target stays bright. */}
      {!inDialog && (
        <svg aria-hidden className="pointer-events-none fixed inset-0 z-40 size-full">
          <path fillRule="evenodd" d={`M0 0H${innerWidth}V${innerHeight}H0Z M${hole.x} ${hole.y}h${hole.w}v${hole.h}h-${hole.w}Z`} style={{ fill: "var(--admin-color-bg-scrim)" }} />
        </svg>
      )}
    <div className="pointer-events-none fixed inset-0 z-[60]" data-tour-layer>
      <div aria-hidden className="absolute rounded-a-lg border-2 border-a-border-active transition-[left,top,width,height] duration-300 ease-out motion-reduce:transition-none" style={{ left: hole.x, top: hole.y, width: hole.w, height: hole.h }} />
      <div
        ref={card}
        key={step.id}
        role="dialog"
        aria-label={step.title}
        onPointerDown={(e) => e.stopPropagation()}
        className={cn("absolute flex flex-col gap-2 rounded-a-lg border border-a-border bg-a-panel p-4 shadow-[0_12px_32px_rgb(0_0_0/0.5)] transition-opacity duration-200 ease-out motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-[0.97] motion-safe:duration-200 motion-safe:ease-out", box.open ? "pointer-events-none opacity-0" : "pointer-events-auto")}
        style={{ left: x, top: y, width: W }}
      >
        <Arrow side={side} offset={arrow} />
        <div className="flex items-center gap-3">
          <h2 className="min-w-0 flex-1 t-heading-s text-a-text">{step.title}</h2>
          <span aria-label={`Part ${progressIndex + 1} of ${tour.parts.length}`} className="flex shrink-0 gap-0.5">
            {tour.parts.map((p, i) => (
              <span key={p} className={cn("h-1 w-3 rounded-full transition-colors duration-300", i <= progressIndex || step.final ? "bg-a-accent" : "bg-a-border")} />
            ))}
          </span>
        </div>
        <p className="t-body-m whitespace-pre-line text-a-text-2">{step.body}</p>
        {step.final ? (
          <div className="pt-2">
            <AdminButton size="xl" className="w-full" onClick={onFinish}>
              Back to Getting started
            </AdminButton>
          </div>
        ) : (
          <div className="flex items-center gap-3 pt-2">
            <span className="flex min-w-0 flex-1 items-center gap-1.5 t-body-m-medium text-a-text-accent">
              <Hint aria-hidden className="size-4 shrink-0" />
              {step.hint}
            </span>
            <AdminButton hierarchy="ghost" size="xl" className="pr-0" onClick={onSkip}>
              {step.later ? "Do it later" : "Skip"}
            </AdminButton>
          </div>
        )}
      </div>
    </div>
    </>
  )
}

/** Where the coachmark goes: the step's side if it fits, else the first that does; kept on screen with a 16 px margin. */
function place(hole: Box, h: number, want: Side = "bottom") {
  const vw = innerWidth
  const vh = innerHeight
  const fits: Record<Side, boolean> = {
    bottom: hole.y + hole.h + GAP + h < vh - 16,
    top: hole.y - GAP - h > 16,
    right: hole.x + hole.w + GAP + W < vw - 16,
    left: hole.x - GAP - W > 16,
  }
  const side = fits[want] ? want : (["bottom", "right", "left", "top"] as Side[]).find((s) => fits[s]) ?? "bottom"
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
  if (side === "bottom" || side === "top") {
    const x = clamp(hole.x + hole.w / 2 - W / 2, 16, vw - W - 16)
    const y = side === "bottom" ? hole.y + hole.h + GAP : hole.y - GAP - h
    return { side, x, y, arrow: clamp(hole.x + hole.w / 2 - x, 20, W - 20) }
  }
  // Beside a tall target the coachmark sits on its middle; beside a short one, level with its top (Figma 1031:2, 1023:2).
  const y = clamp(hole.h > h ? hole.y + hole.h / 2 - h / 2 : hole.y, 16, vh - h - 16)
  const x = side === "right" ? hole.x + hole.w + GAP : hole.x - GAP - W
  return { side, x, y, arrow: clamp(hole.y + hole.h / 2 - y, 20, h - 20) }
}

/** The 18 x 10 notch pointing at the target, panel fill with the default edge. */
function Arrow({ side, offset }: { side: Side; offset: number }) {
  const rot = { bottom: 0, top: 180, right: -90, left: 90 }[side]
  const pos: React.CSSProperties =
    side === "bottom" ? { top: -10, left: offset - 9 } : side === "top" ? { bottom: -10, left: offset - 9 } : side === "right" ? { left: -14, top: offset - 5 } : { right: -14, top: offset - 5 }
  return (
    <svg aria-hidden width="18" height="10" viewBox="0 0 18 10" className="absolute" style={{ ...pos, transform: `rotate(${rot}deg)` }}>
      <path d="M0 10 L9 1 L18 10" style={{ fill: "var(--admin-color-bg-panel)", stroke: "var(--admin-color-border-default)" }} strokeWidth="1" />
    </svg>
  )
}

/** Course tour pill (Figma: 36 px, panel fill, the progress ring and the tour's name). Opens and closes the panel. */
function Pill({ label, progress, open, onToggle }: { tour: Tour; done: boolean; label: string; progress: number; open: boolean; onToggle: () => void }) {
  const { right, bottom } = useCorner()
  return (
    <button
      type="button"
      onClick={onToggle}
      onPointerDown={(e) => e.stopPropagation()}
      aria-expanded={open}
      className="fixed z-[60] flex h-9 items-center gap-2 rounded-full border border-a-border bg-a-panel px-3 t-body-m-medium text-a-text outline-none transition-[background-color,right] duration-300 ease-out hover:bg-a-raised focus-visible:ring-2 focus-visible:ring-a-border-focus active:scale-[0.97] motion-reduce:transition-none"
      style={{ right, bottom }}
    >
      {open ? (
        <>
          {label}
          <Ring value={progress} />
        </>
      ) : (
        <>
          <Ring value={progress} />
          {label}
        </>
      )}
    </button>
  )
}

/**
 * The pill's corner: 32 px from the edges (Figma). With a drawer open it moves to the drawer's left so it never covers
 * its buttons; the prototype's own view switcher (not part of the product) keeps it a row higher.
 */
function useCorner() {
  const [corner, setCorner] = useState({ right: 32, bottom: 32 })
  useEffect(() => {
    let frame = 0
    const tick = () => {
      const d = document.querySelector('[data-slot="sheet-content"][data-side="right"]:not([data-ending-style]):not([data-closed])')
      const bar = document.querySelector("[data-proto-bar]")
      const right = d ? innerWidth - d.getBoundingClientRect().left + 24 : 32
      const bottom = bar && !d ? Math.max(32, innerHeight - bar.getBoundingClientRect().top + 12) : 32
      setCorner((c) => (Math.abs(c.right - right) > 1 || Math.abs(c.bottom - bottom) > 1 ? { right, bottom } : c))
      frame = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(frame)
  }, [])
  return corner
}

function Ring({ value }: { value: number }) {
  const r = 7.5
  const c = 2 * Math.PI * r
  return (
    <svg aria-hidden width="18" height="18" viewBox="0 0 18 18" className="-rotate-90">
      <circle cx="9" cy="9" r={r} fill="none" strokeWidth="2" style={{ stroke: "var(--admin-color-border-default)" }} />
      <circle cx="9" cy="9" r={r} fill="none" strokeWidth="2" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0.06, value))} className="transition-[stroke-dashoffset] duration-500 ease-out motion-reduce:transition-none" style={{ stroke: "var(--admin-color-accent-default)" }} />
    </svg>
  )
}

/** The tour's parts, the current one with Start (or Resume). Figma "Course tour panel": 298 px, 12 above the pill. */
function Panel({ tour, part, resumed, onStart }: { tour: Tour; part: number; resumed: boolean; onStart: () => void }) {
  const { right, bottom } = useCorner()
  return (
    <section
      aria-label={tour.title}
      onPointerDown={(e) => e.stopPropagation()}
      className="fixed z-[60] flex w-[298px] max-w-[calc(100vw-2rem)] flex-col gap-3 rounded-a-lg border border-a-border bg-a-panel px-4 pt-4 pb-3 shadow-[0_12px_32px_rgb(0_0_0/0.5)] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-200 motion-safe:ease-out"
      style={{ right, bottom: bottom + 48 }}
    >
      <h2 className="t-heading-s text-a-text">{tour.title}</h2>
      <ol className="flex flex-col gap-1">
        {tour.parts.map((p, i) => (
          <li key={p} aria-current={i === part ? "step" : undefined} className={cn("flex items-center gap-3 rounded-a-md p-2", i === part && "bg-a-field")}>
            <StepIndicator step={i + 1} state={i < part ? "done" : i === part ? "current" : "upcoming"} />
            <span className={cn("min-w-0 flex-1", i === part ? "t-body-m-medium text-a-text" : i < part ? "t-body-m text-a-text-2" : "t-body-m text-a-text-3")}>{p}</span>
            {i === part && (
              <AdminButton size="xl" onClick={onStart}>
                {resumed ? "Resume" : "Start"}
              </AdminButton>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
