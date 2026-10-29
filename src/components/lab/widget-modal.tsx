"use client"

import { AnimateUIProvider } from "@animate-ui/react/provider"
import { Check, ChevronLeft, ChevronRight, Link2, Info, MousePointerClick, RotateCcw, X } from "lucide-react"
import { MotionConfig, motion, useReducedMotion } from "motion/react"
import { useEffect, useRef, useState } from "react"
import { DETAILED_EXTRA_ROWS, type WidgetDef } from "@/components/lab/reui-widgets/registry"
import type { CoachTheme, Mode } from "@/lib/theme/types"
import type { Detail, Emphasis } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { LabButton, LabDivider, LabIconButton, LabSeg } from "./lab-controls"
import { colsOf, FOCUS, hair, Pane, px, rowsOf, rowsPx, t2, t3 } from "./widget-base"
import { StageCanvas } from "./stage-canvas"
import { ABOUT } from "./widget-about"
import { INTERACTIONS } from "./widget-interactions"

const DETAILS: Detail[] = ["compact", "standard", "detailed"]
const DETAIL_LABEL: Record<Detail, string> = { compact: "Compact", standard: "Standard", detailed: "Detailed" }
/** Which detail levels each widget layout renders differently, worked out once per session. */
const LEVELS = new Map<string, Detail[][]>()

/**
 * Renders the layout offscreen at the three detail levels, compares their
 * content and structure, and groups the levels that come out the same. Returns
 * the probe's ref, one level per group (Standard when it's in the group), and
 * a function mapping any level to its group's level.
 */
function useDetailLevels(key: string) {
  const probe = useRef<HTMLDivElement>(null)
  const [, bump] = useState(0)
  const groups = LEVELS.get(key)
  useEffect(() => {
    if (LEVELS.has(key)) return
    // Two frames: the widgets render and settle (container queries, counts) before they are compared.
    let id = requestAnimationFrame(() => {
      id = requestAnimationFrame(() => {
        const kids = probe.current ? [...probe.current.children] : []
        if (kids.length !== 3) return
        // Text, structure and classes: a level that only clamps text to fewer lines still counts as different.
        const sig = kids.map((k) => `${k.querySelectorAll("*").length}|${(k.textContent ?? "").replace(/\s+/g, " ")}|${[...k.querySelectorAll("[class]")].map((e) => e.getAttribute("class")).join(" ")}`)
        const out: Detail[][] = []
        DETAILS.forEach((d, n) => {
          const same = out.find((g) => sig[DETAILS.indexOf(g[0])] === sig[n])
          if (same) same.push(d)
          else out.push([d])
        })
        LEVELS.set(key, out)
        bump((x) => x + 1)
      })
    })
    return () => cancelAnimationFrame(id)
  }, [key])
  const pick = (g: Detail[]) => (g.includes("standard") ? "standard" : g[0])
  const levels = groups ? groups.map(pick) : null
  const groupOf = (d: Detail): Detail => {
    const g = groups?.find((x) => x.includes(d))
    return g ? pick(g) : d
  }
  return [probe, levels, groupOf] as const
}

/** Size of a layout card's preview in the carousel. */
const CARD_W = 224
const CARD_H = 136

/** The size of an element, kept up to date. */
function useBox<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, box] as const
}

/**
 * One widget up close (prototype only). Three zones: a header with what it
 * is and its states; a stage with the chosen layout large (scaled up to fill,
 * at most 1.6×) and ready to use; and a carousel of every layout to switch
 * to. ← and → step through the layouts. Escape, the close button or a click
 * outside closes it, and focus goes back to where it was.
 */
export function WidgetModal({
  def,
  variant,
  onVariant,
  onClose,
  scale,
  mode,
  theme,
  emphasis: pageEmphasis,
  detail: pageDetail,
}: {
  def: WidgetDef
  variant: string
  onVariant: (v: string) => void
  onClose: () => void
  extra: number
  scale: number
  mode: Mode
  theme: CoachTheme
  /** The page's values when the modal opens; changes here stay in the modal. */
  emphasis: Emphasis
  detail: Detail
}) {
  const [emphasis, setEmphasis] = useState(pageEmphasis)
  const [detail, setDetail] = useState(pageDetail)
  // Only the detail levels this layout actually renders differently (see useDetailLevels).
  const [probe, levels, groupOf] = useDetailLevels(`${def.type}/${variant}/${emphasis}`)
  const shownDetail = groupOf(detail)
  // The modal's own Detail decides the extra rows, not the page's.
  const extra = shownDetail === "detailed" ? DETAILED_EXTRA_ROWS : 0
  const i = Math.max(
    0,
    def.variants.findIndex((x) => x.value === variant),
  )
  const v = def.variants[i]
  const n = def.variants.length
  const step = (d: number) => onVariant(def.variants[(i + d + n) % n].value)
  const still = useReducedMotion()
  const dialog = useRef<HTMLDivElement>(null)
  const close = useRef<HTMLButtonElement>(null)
  const downOnBackdrop = useRef(false)
  const [stage, box] = useBox<HTMLDivElement>()
  const [copied, setCopied] = useState(false)
  // Inspecting interactions: replay the entry animations, outline what is clickable, slow or stop motion, list what to try.
  const [run, setRun] = useState(0)
  const [hits, setHits] = useState(false)
  // The About panel starts closed; the choice is remembered for the session.
  const [notes, setNotesState] = useState(() => {
    try {
      return sessionStorage.getItem("wb-about") === "open"
    } catch {
      return false
    }
  })
  const setNotes = (open: boolean) => {
    setNotesState(open)
    try {
      sessionStorage.setItem("wb-about", open ? "open" : "closed")
    } catch {}
  }
  // Preview: the widget alone, large. Builder: on a real-size grid, to select, move and resize it.
  const [view, setView] = useState<"preview" | "builder">("preview")
  const tries = INTERACTIONS[def.type] ?? []

  useEffect(() => {
    // Focus starts on Close for the keyboard (without the ring for a mouse click) and goes back on close.
    const back = document.activeElement as HTMLElement | null
    close.current?.focus({ focusVisible: false } as FocusOptions)
    // The page behind stays put while the modal is open.
    const html = document.documentElement
    const was = html.style.overflow
    html.style.overflow = "hidden"
    return () => {
      html.style.overflow = was
      back?.focus({ focusVisible: false } as FocusOptions)
    }
  }, [])

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Escape inside the About panel closes the panel, not the modal.
        if ((e.target as HTMLElement | null)?.closest("[data-about]")) return setNotes(false)
        return onClose()
      }
      // Tab stays inside the modal.
      if (e.key === "Tab" && dialog.current) {
        const all = [...dialog.current.querySelectorAll<HTMLElement>("button, a[href], input, [tabindex]:not([tabindex='-1'])")].filter((el) => !el.closest("[inert]") && el.offsetParent)
        const first = all[0]
        const last = all[all.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
        return
      }
      // Arrows switch layouts, unless the reader is typing or is inside the widget (its own controls may use them).
      const t = e.target as HTMLElement | null
      if (t?.closest("input, textarea, select, [data-stage]")) return
      // B switches between Preview and Builder.
      if (e.key.toLowerCase() === "b" && !e.metaKey && !e.ctrlKey) setView((x) => (x === "preview" ? "builder" : "preview"))
      if (e.key === "ArrowRight") step(1)
      if (e.key === "ArrowLeft") step(-1)
    }
    document.addEventListener("keydown", key)
    return () => document.removeEventListener("keydown", key)
  })

  const cols = colsOf(def, v.value)
  const w = px(cols)
  const rows = rowsOf(def, v.value, cols) + extra
  const h = rowsPx(rows)
  // As large as the stage allows, up to 1.6× real size; never under real size (the stage scrolls instead).
  const big = box.w ? Math.max(scale, Math.min(1.6 * scale, (box.w - 112) / w, (box.h - 72) / h)) : scale

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={`${def.name} · ${v.label}`}>
      {/* Closes only on a click that starts and ends here: a drag or resize released over the backdrop must not close it. */}
      <motion.div
        className="absolute inset-0 bg-black/55"
        onPointerDown={(e) => (downOnBackdrop.current = e.target === e.currentTarget)}
        onClick={(e) => downOnBackdrop.current && e.target === e.currentTarget && onClose()}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: still ? 0 : 0.18, ease: [0.23, 1, 0.32, 1] }}
      />
      <motion.div
        ref={dialog}
        className="relative flex h-[min(92vh,1100px)] w-[min(94vw,1280px)] flex-col overflow-hidden rounded-2xl border shadow-[0_24px_64px_-16px_rgb(0_0_0/0.5)]"
        style={{ ...hair, background: "var(--c-bar)" }}
        initial={still ? false : { opacity: 0, transform: "translateY(8px) scale(0.98)" }}
        animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
        transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Header, two rows: where this is and the ways out; then the name with its states. */}
        <div className="grid gap-4 border-b px-6 pt-5 pb-6" style={hair}>
          <div className="flex items-center justify-between gap-4">
            <span className={cn("text-[0.8125rem]", t2)}>
              {def.group} · {n} {n === 1 ? "layout" : "layouts"}
            </span>
            <div className="flex items-center gap-2">
              <LabIconButton onClick={copy} label={copied ? "Link copied" : "Copy link"}>
                {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
              </LabIconButton>
              <LabIconButton ref={close} onClick={onClose} label="Close (Esc)">
                <X className="size-4" />
              </LabIconButton>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
            <div className="grid min-w-0 gap-1.5">
              <h2 className="text-2xl leading-8 font-medium tracking-[-0.015em]">
                {def.name} <span className={cn("font-normal", t2)}>· {v.label}</span>
              </h2>
              {def.description && <p className={cn("max-w-2xl text-sm", t2)}>{def.description}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <LabSeg
                label="Emphasis"
                value={emphasis}
                onChange={setEmphasis}
                options={[
                  ["quiet", "Quiet"],
                  ["accent", "Accent"],
                  ["star", "Star"],
                ]}
              />
            </div>
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1 bg-(--c-page)">
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Inspection tools for the live widget. */}
            <div className="flex flex-wrap items-center gap-3 px-6 pt-4">
              <LabSeg
                inline
                label="Stage"
                value={view}
                onChange={setView}
                options={[
                  ["preview", "Preview"],
                  ["builder", "Builder"],
                ]}
              />
              <LabDivider />
              <LabButton onClick={() => setRun((r) => r + 1)} label="Replay" hint="Mount the widget again so its entry animations play">
                <RotateCcw className="size-4" />
              </LabButton>
              <LabButton onClick={() => setHits(!hits)} label="Hit areas" hint="Outline everything that can be clicked or focused" pressed={hits}>
                <MousePointerClick className="size-4" />
              </LabButton>
              <LabDivider />
              {levels && levels.length < 2 ? (
                <span className={cn("text-xs", t3)}>One detail level</span>
              ) : (
                <LabSeg inline label="Detail" value={shownDetail} onChange={setDetail} options={(levels ?? DETAILS).map((d) => [d, DETAIL_LABEL[d]] as [Detail, string])} />
              )}
              <span className="flex-1" />
              <LabButton onClick={() => setNotes(!notes)} label="About" hint="What this widget is, what it\u2019s for and what to try" expanded={notes}>
                <Info className="size-4" />
              </LabButton>
            </div>
            {/* Stage: the chosen layout, large and live; the stage keeps its size whichever layout shows. */}
            <div className="relative min-h-0 flex-1">
              <div ref={stage} data-stage data-hits={hits || undefined} className="absolute inset-0 overflow-auto">
                <style>{HIT_CSS}</style>
                <div
                  className={cn("grid min-h-full py-6", view === "builder" ? "place-items-start px-6" : "place-items-center px-14")}
                  // "safe": a canvas wider than the stage starts at the left edge, so all of it can be scrolled to.
                  style={view === "builder" ? { justifyContent: "safe center" } : undefined}
                >
                  <MotionConfig reducedMotion="user">
                    <AnimateUIProvider>
                      {view === "builder" ? (
                        <StageCanvas key={`${v.value}-${extra}-${run}`} def={def} variant={v} extra={extra} mode={mode} theme={theme} emphasis={emphasis} detail={shownDetail} />
                      ) : (
                        <div key={`${v.value}-${run}`} className="grid justify-items-center gap-3">
                          <Pane def={def} variant={v.value} h={rows} scale={big} mode={mode} theme={theme} emphasis={emphasis} detail={shownDetail} />
                          <span className={cn("text-xs tabular-nums", t3)}>{`${v.label} · ${cols}×${rows} on the grid · ${w}×${h}px`}</span>
                        </div>
                      )}
                    </AnimateUIProvider>
                  </MotionConfig>
                </div>
              </div>
              {n > 1 && view === "preview" && (
                <>
                  <StepButton side="left" onClick={() => step(-1)} label={`Previous layout: ${def.variants[(i - 1 + n) % n].label}`} />
                  <StepButton side="right" onClick={() => step(1)} label={`Next layout: ${def.variants[(i + 1) % n].label}`} />
                </>
              )}
            </div>
          </div>
          {/* Hidden in Builder: the 12-column grid needs the full width. */}
          {notes && view === "preview" && <AboutPanel type={def.type} current={v.value} variants={def.variants} tries={tries} onVariant={onVariant} />}
        </div>

        {/* Carousel: every layout as a card. */}
        <Carousel def={def} current={v.value} index={i} onPick={onVariant} extra={extra} mode={mode} theme={theme} emphasis={emphasis} detail={shownDetail} />
        {/* Offscreen: the layout at each detail level, compared once to find which levels differ. */}
        {!levels && (
          <div ref={probe} aria-hidden inert className="pointer-events-none fixed top-0 -left-[20000px] invisible">
            {DETAILS.map((d) => (
              <Pane key={d} def={def} variant={v.value} h={rowsOf(def, v.value) + (d === "detailed" ? DETAILED_EXTRA_ROWS : 0)} scale={1} mode={mode} theme={theme} emphasis={emphasis} detail={d} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

/** What the widget is and what it's for, its layouts, and (folded) what can be tried on it. */
function AboutPanel({ type, current, variants, tries, onVariant }: { type: string; current: string; variants: WidgetDef["variants"]; tries: string[]; onVariant: (v: string) => void }) {
  const still = useReducedMotion()
  const a = ABOUT[type]
  const rows: [string, string | undefined][] = [
    ["What it is", a?.what],
    ["What it\u2019s for", a?.for],
    ["Best for", a?.best],
    ["Data", a?.data],
  ]
  return (
    // Beside the stage on wide screens (the stage rescales); over it on narrow ones.
    <motion.aside
      data-about
      initial={still ? { opacity: 0 } : { opacity: 0, transform: "translateX(16px)" }}
      animate={{ opacity: 1, transform: "translateX(0px)" }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className="absolute inset-y-0 right-0 z-20 w-72 shrink-0 overflow-y-auto border-l p-5 shadow-[-12px_0_32px_-16px_rgb(0_0_0/0.35)] lg:static lg:shadow-none"
      style={{ ...hair, background: "var(--c-bar)" }}
      aria-label="About this widget"
    >
      <dl className="grid gap-4">
        {rows
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="grid gap-1">
              <dt className={cn("text-xs", t3)}>{k}</dt>
              <dd className="text-[0.8125rem] leading-5">{v}</dd>
            </div>
          ))}
        <div className="grid gap-1.5">
          <dt className={cn("text-xs", t3)}>Layouts</dt>
          <dd className="grid gap-1">
            {variants.map((x) => {
              const on = x.value === current
              return (
                <button
                  key={x.value}
                  type="button"
                  onClick={() => onVariant(x.value)}
                  aria-current={on ? "true" : undefined}
                  className={cn("grid gap-0.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-150", FOCUS, on ? "bg-(--c-on)" : "hover:bg-(--c-on)")}
                >
                  <span className={cn("text-[0.8125rem]", on ? "font-medium" : "")}>{x.label}</span>
                  {a?.layouts[x.value] && <span className={cn("text-xs leading-4", t2)}>{a.layouts[x.value]}</span>}
                </button>
              )
            })}
          </dd>
        </div>
      </dl>
      <details className="mt-5 border-t pt-4" style={hair}>
        <summary className={cn("cursor-pointer text-xs font-medium select-none", t2)}>Interactions{tries.length ? ` · ${tries.length}` : ""}</summary>
        {tries.length ? (
          <ul className="mt-3 grid gap-2">
            {tries.map((t) => (
              <li key={t} className={cn("flex gap-2 text-xs leading-4", t2)}>
                <span className="mt-1.5 size-1 shrink-0 rounded-full" style={{ background: "var(--brand-mark)" }} aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        ) : (
          <p className={cn("mt-3 text-xs leading-4", t2)}>None: this widget is static. Its look follows Emphasis and Detail.</p>
        )}
        <p className={cn("mt-3 text-xs leading-4", t3)}>Tab moves through the widget&rsquo;s controls. ← and → change the layout when focus is outside the widget.</p>
      </details>
    </motion.aside>
  )
}

function Carousel({
  def,
  current,
  index,
  onPick,
  extra,
  mode,
  theme,
  emphasis,
  detail,
}: {
  def: WidgetDef
  current: string
  index: number
  onPick: (v: string) => void
  extra: number
  mode: Mode
  theme: CoachTheme
  emphasis: Emphasis
  detail: Detail
}) {
  const rail = useRef<HTMLDivElement>(null)
  const [ends, setEnds] = useState({ start: true, end: true })
  const w = px(Math.max(...def.variants.map((x) => colsOf(def, x.value))))
  const n = def.variants.length
  // Which ends still have cards past them, for the arrows and the fades.
  const measure = () => {
    const r = rail.current
    if (r)
      setEnds({
        start: r.scrollLeft < 2,
        end: r.scrollLeft + r.clientWidth > r.scrollWidth - 2,
      })
  }
  useEffect(() => {
    measure()
    const r = rail.current
    if (!r) return
    const ro = new ResizeObserver(measure)
    ro.observe(r)
    return () => ro.disconnect()
  }, [])
  // Keep the chosen card in view.
  useEffect(() => {
    rail.current?.querySelector<HTMLElement>(`[data-variant="${current}"]`)?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "smooth",
    })
  }, [current])
  const page = (d: number) =>
    rail.current?.scrollBy({
      left: d * (rail.current.clientWidth - CARD_W),
      behavior: "smooth",
    })
  const fade = `linear-gradient(to right, ${ends.start ? "black" : "transparent"}, black 40px, black calc(100% - 40px), ${ends.end ? "black" : "transparent"})`
  return (
    <div className="grid gap-3 border-t px-6 pt-4 pb-5" style={hair}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm">
          <span className="font-medium">Layouts</span>
          <span className={cn("ml-2 tabular-nums", t3)}>
            {index + 1} / {n}
          </span>
        </p>
        <div className={cn("flex gap-1.5", ends.start && ends.end && "invisible")}>
          <LabIconButton onClick={() => page(-1)} label="Previous layouts" disabled={ends.start}>
            <ChevronLeft className="size-4" />
          </LabIconButton>
          <LabIconButton onClick={() => page(1)} label="Next layouts" disabled={ends.end}>
            <ChevronRight className="size-4" />
          </LabIconButton>
        </div>
      </div>
      <div
        ref={rail}
        role="radiogroup"
        aria-label="Layouts"
        onScroll={measure}
        className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-1 pt-1 pb-2 [scrollbar-width:thin]"
        style={{ maskImage: fade, WebkitMaskImage: fade }}
      >
        {def.variants.map((x) => {
          const on = x.value === current
          const fit = Math.min(1, (CARD_W - 28) / w, (CARD_H - 24) / rowsPx(rowsOf(def, x.value) + extra))
          return (
            // Not a <button>: the thumbnail holds the widget's own buttons, and buttons cannot nest.
            <div
              key={x.value}
              role="radio"
              tabIndex={on ? 0 : -1}
              aria-checked={on}
              aria-label={`Show layout ${x.label}`}
              data-variant={x.value}
              onClick={() => onPick(x.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onPick(x.value)
                }
              }}
              className={cn("group grid shrink-0 cursor-pointer snap-start gap-2 rounded-xl text-left", FOCUS)}
              style={{ width: CARD_W }}
            >
              <span
                inert
                aria-hidden
                className={cn("grid place-items-center overflow-hidden rounded-xl border bg-(--c-cell) transition-colors duration-150", !on && "group-hover:bg-(--c-cell-on)")}
                style={{
                  height: CARD_H,
                  borderColor: on ? "var(--brand-mark)" : "var(--c-hair)",
                  boxShadow: on ? "0 0 0 1px var(--brand-mark)" : undefined,
                }}
              >
                <Pane def={def} variant={x.value} h={rowsOf(def, x.value) + extra} scale={fit} mode={mode} theme={theme} emphasis={emphasis} detail={detail} />
              </span>
              <span className="flex min-w-0 items-center justify-between gap-2 px-1 text-xs">
                <span className={cn("truncate", on ? "font-medium text-(--c-t1)" : cn(t2, "group-hover:text-(--c-t1)"))}>{x.label}</span>
                {on && (
                  <span
                    className="shrink-0 rounded-full border px-1.5 text-[0.6875rem] leading-4"
                    style={{
                      borderColor: "var(--brand-mark)",
                      color: "var(--brand-text)",
                    }}
                  >
                    Selected
                  </span>
                )}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Outlines for "Hit areas": every element that takes a click or focus inside the stage. */
export const HIT_CSS = `[data-stage][data-hits] :is(button, a[href], input, select, textarea, summary, [role=button], [role=radio], [role=tab], [role=link], [tabindex]:not([tabindex="-1"])):not([data-step]) { outline: 1.5px dashed var(--brand-mark) !important; outline-offset: 2px; }`

/**
 * Motion speed for CSS transitions and animations inside the stage (the
 * Web Animations API sees them all): Slow plays them at a quarter speed, Off
 * jumps to their end. Motion and Animate UI follow the providers above.
 */
export function useMotionSpeed(ref: React.RefObject<HTMLElement | null>, speed: "normal" | "slow" | "off") {
  useEffect(() => {
    const tick = () => {
      for (const a of ref.current?.getAnimations({ subtree: true }) ?? []) {
        if (speed === "off") {
          try {
            a.finish()
          } catch {
            a.playbackRate = 1
          }
        } else a.playbackRate = speed === "slow" ? 0.25 : 1
      }
    }
    tick()
    const id = window.setInterval(tick, 50)
    return () => window.clearInterval(id)
  }, [ref, speed])
}

/** A round previous / next button at the side of the stage. */
export function StepButton({ side, onClick, label }: { side: "left" | "right"; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      data-step
      className={cn("absolute top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full border shadow-sm transition-colors duration-150 hover:bg-(--c-on)", side === "left" ? "left-4" : "right-4", FOCUS)}
      style={{ ...hair, background: "var(--c-bar)" }}
    >
      {side === "left" ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
    </button>
  )
}
