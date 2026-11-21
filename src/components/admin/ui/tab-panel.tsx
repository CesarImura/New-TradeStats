"use client"

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { AnimatePresence, animate, motion, useReducedMotion, type AnimationPlaybackControls } from "motion/react"
import { cn } from "@/lib/utils"

/** The one ease of the product (ease-out, long tail): fast start, soft landing. */
const EASE = [0.22, 1, 0.36, 1] as const
/** New content arrives in 300 ms; the old one leaves in 110 ms (shorter than the arrival, so the two never fight on screen). */
export const PANEL_IN = { duration: 0.3, ease: EASE } as const
export const PANEL_OUT = { duration: 0.11, ease: "easeIn" } as const
/** How far content travels sideways (px) when the new tab is to the right or left of the old one; without an order it only rises 6 px. */
const SHIFT = 12
/** Reduced motion keeps the same markup (so the server and the browser agree) and just plays every move in zero time. */
const INSTANT = { duration: 0 } as const

/** -1 if `to` is before `from` in `order`, 1 if after, 0 when unknown or the same. */
export function tabDirection(order: readonly string[] | undefined, from: string, to: string): -1 | 0 | 1 {
  if (!order || from === to) return 0
  const a = order.indexOf(from)
  const b = order.indexOf(to)
  if (a < 0 || b < 0) return 0
  return b > a ? 1 : -1
}

/**
 * Content of a tab (Admin / Tab panel). Put it around what the tabs switch and give it the tab's `value`.
 * - The new content fades in while it travels 12 px from the side of the new tab (`order` = the tab ids in their order; without it, it rises 6 px).
 * - The old content leaves faster (110 ms) and out of the flow, so the two never push each other.
 * - The height follows: it is held while the swap happens and eases to the new height (300 ms), then goes back to auto, so what sits below the panel slides instead of jumping.
 * - Reduced motion: no movement and no height ease, the content just swaps (same markup, so the server render matches).
 * `className` styles the pane (flex, gap), `outerClassName` the frame. Use `TabStackPane` when every pane must stay mounted (equal heights).
 */
export function TabPanel({ value, order, className, outerClassName, children }: { value: string; order?: readonly string[]; className?: string; outerClassName?: string; children: ReactNode }) {
  const reduced = useReducedMotion()
  const [state, setState] = useState({ value, dir: 0 as -1 | 0 | 1 })
  if (state.value !== value) setState({ value, dir: tabDirection(order, state.value, value) })

  const frame = useRef<HTMLDivElement>(null)
  const run = useRef<AnimationPlaybackControls | null>(null)
  const lock = useRef<number | null>(null)
  const first = useRef(true)
  const swap = useRef(0)
  const safety = useRef<number | undefined>(undefined)
  // The height the frame had when nothing was moving: the height to start from when the tab changes (the old pane is already out of the flow by then).
  const settled = useRef(0)
  useEffect(() => {
    const el = frame.current
    if (!el) return
    const ro = new ResizeObserver(() => lock.current === null && (settled.current = el.getBoundingClientRect().height))
    ro.observe(el)
    settled.current = el.getBoundingClientRect().height
    return () => ro.disconnect()
  }, [])

  // Before the browser paints the swap: hold the height the old content had, then ease to the new one.
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const el = frame.current
    if (!el || reduced) return
    const id = ++swap.current
    const release = () => {
      if (swap.current !== id) return
      el.style.height = ""
      lock.current = null
    }
    run.current?.stop()
    window.clearTimeout(safety.current)
    const from = lock.current ?? settled.current
    // The new pane is in the DOM now: its natural height is the one to ease to (the old pane, leaving, is out of the flow).
    const pane = el.querySelector<HTMLElement>(`:scope > [data-pane="${CSS.escape(state.value)}"]`)
    const to = pane ? pane.offsetHeight : from
    lock.current = to
    if (Math.abs(to - from) < 1) return release()
    el.style.height = `${from}px`
    run.current = animate(el, { height: [`${from}px`, `${to}px`] }, { ...PANEL_IN, onComplete: release })
    // A throttled tab can skip the animation's end: the height is released anyway.
    safety.current = window.setTimeout(release, 900)
  }, [state.value, reduced])
  useEffect(() => () => (run.current?.stop(), window.clearTimeout(safety.current)), [])

  const x = state.dir * SHIFT
  const y = state.dir === 0 ? 6 : 0
  return (
    <div ref={frame} data-slot="tab-panel" className={cn("relative min-w-0 [overflow:clip] [overflow-clip-margin:12px]", outerClassName)}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={state.value}
          data-pane={state.value}
          initial={reduced ? false : { opacity: 0, x, y }}
          animate={{ opacity: 1, x: 0, y: 0, transition: reduced ? INSTANT : PANEL_IN }}
          exit={{ opacity: 0, x: reduced ? 0 : -x / 2, y: state.dir === 0 && !reduced ? -2 : 0, transition: reduced ? INSTANT : PANEL_OUT }}
          className={cn("flex min-w-0 flex-col gap-4", className)}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/**
 * One pane of a stack that keeps every tab mounted in the same grid cell (the tallest one sets the height, as in Overview › Content).
 * The active pane is in; the others fade and drift 12 px to the side of the active one (`from`: -1 left, 1 right) and become invisible and inert at the end of the move.
 * Below 680 px of container width the hidden pane leaves the flow (it would stretch the card), so only the fade plays there.
 */
export function TabStackPane({ active, from = 0, className, children }: { active: boolean; from?: -1 | 0 | 1; className?: string; children: ReactNode }) {
  return (
    <div
      aria-hidden={!active}
      inert={!active}
      style={{ transform: active ? undefined : `translate(${from * SHIFT}px, ${from === 0 ? 6 : 0}px)` }}
      className={cn(
        "col-start-1 row-start-1 min-w-0 transition-[opacity,transform,visibility] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        active ? "visible opacity-100 duration-300 delay-75" : "invisible opacity-0 duration-150 @max-[679px]:absolute @max-[679px]:inset-x-0 @max-[679px]:top-0",
        className,
      )}
    >
      {children}
    </div>
  )
}
