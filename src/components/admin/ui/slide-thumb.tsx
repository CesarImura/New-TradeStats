"use client"

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react"
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type AnimationPlaybackControls } from "motion/react"
import { cn } from "@/lib/utils"

/** Interior segmented control spring (stiffness 520, damping 34, mass 0.45): about 410 ms, no overshoot, interruptible. */
export const THUMB_SPRING = { type: "spring", stiffness: 520, damping: 34, mass: 0.45 } as const

/**
 * Follows the active item of a row: left, width, top, height of `[data-slide="<key>"]` inside `ref`, as motion values.
 * The first measure and any resize jump; a change of the active item runs the spring from where the thumb is (so a click
 * mid-slide continues instead of restarting). With reduced motion it always jumps.
 */
export function useSlideBox(ref: RefObject<HTMLElement | null>, activeKey: string | undefined, signature: string) {
  const reduced = useReducedMotion()
  const x = useMotionValue(0)
  const w = useMotionValue(0)
  const y = useMotionValue(0)
  const h = useMotionValue(0)
  const rowW = useMotionValue(0)
  const rowH = useMotionValue(0)
  const [measured, setMeasured] = useState(false)
  const first = useRef(true)
  const runs = useRef<AnimationPlaybackControls[]>([])

  const measure = useCallback(
    (spring: boolean) => {
      const root = ref.current
      if (!root || activeKey === undefined) return false
      const el = root.querySelector<HTMLElement>(`:scope > [data-slide="${CSS.escape(activeKey)}"]`)
      if (!el) return false
      runs.current.forEach((r) => r.stop())
      runs.current = []
      y.set(el.offsetTop)
      h.set(el.offsetHeight)
      rowW.set(root.offsetWidth)
      rowH.set(root.offsetHeight)
      if (spring && !reduced) runs.current = [animate(x, el.offsetLeft, THUMB_SPRING), animate(w, el.offsetWidth, THUMB_SPRING)]
      else {
        x.set(el.offsetLeft)
        w.set(el.offsetWidth)
      }
      return true
    },
    [ref, activeKey, reduced, x, w, y, h, rowW, rowH],
  )

  useLayoutEffect(() => {
    const ok = measure(!first.current)
    if (ok) {
      first.current = false
      setMeasured(true)
    }
  }, [measure, signature])

  // The row can change size without the active item changing (window, font load, a count growing): re-register, no spring.
  // `measure` is read through a ref and the observer's first call (it fires once on observe) is ignored; otherwise every
  // change of the active item would re-subscribe, get that first call and make the thumb jump instead of slide.
  const latest = useRef(measure)
  useLayoutEffect(() => {
    latest.current = measure
  }, [measure])
  useEffect(() => {
    const root = ref.current
    if (!root) return
    let ready = false
    const ro = new ResizeObserver(() => (ready ? latest.current(false) : void (ready = true)))
    ro.observe(root)
    void document.fonts?.ready.then(() => latest.current(false))
    return () => ro.disconnect()
  }, [ref])

  useEffect(() => () => runs.current.forEach((r) => r.stop()), [])
  return { x, w, y, h, rowW, rowH, measured }
}

export type SlideLayer = "base" | "copy" | "hit"
export type SlideState = { active: boolean; hovered: boolean; /** Before the first measure (server render): the active item still shows its own fill. */ pre: boolean; hover: { onPointerEnter: () => void; onPointerLeave: () => void } }

/**
 * The sliding thumb of a segmented control or tab group (interior.dev "Segmented control", Gustavo 19/11): three layers with the same
 * geometry. 1) the muted labels (`base`, in the flow, they size the row), 2) a thumb that carries a counter-moving copy of every
 * label in the active colour (`copy`), so the colour changes exactly where the thumb's edge crosses a glyph, 3) the real buttons
 * on top (`hit`, transparent, they keep the roles, focus ring and input). Thumb and copy share one spring value.
 * `renderItem(item, layer, state)` returns the element of that layer; base and copy are aria-hidden spans, hit the button.
 * Items must have no margin: the layers register by size and offset.
 */
export function SlideTrack<I extends { key: string }>({ items, activeKey, rowClass, wrapClass, thumbClass, renderItem }: { items: readonly I[]; activeKey: string | undefined; rowClass: string; wrapClass?: string; thumbClass: string; renderItem: (item: I, layer: SlideLayer, state: SlideState) => ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const { x, w, y, h, rowW, rowH, measured } = useSlideBox(ref, activeKey, items.map((i) => i.key).join("|"))
  const copyX = useTransform(x, (v) => -v)
  const copyY = useTransform(y, (v) => -v)
  const state = (i: I): SlideState => ({ active: i.key === activeKey, hovered: hovered === i.key, pre: !measured && i.key === activeKey, hover: { onPointerEnter: () => setHovered(i.key), onPointerLeave: () => setHovered((c) => (c === i.key ? null : c)) } })
  return (
    <div ref={ref} className={cn("relative", rowClass, wrapClass)}>
      {items.map((i) => (
        <Fragment key={i.key}>{renderItem(i, "base", state(i))}</Fragment>
      ))}
      <motion.span aria-hidden className={cn("pointer-events-none absolute left-0 overflow-hidden", thumbClass, !measured && "invisible")} style={{ x, width: w, top: y, height: h }}>
        <motion.span className={cn("absolute left-0", rowClass)} style={{ x: copyX, top: copyY, width: rowW, height: rowH }}>
          {items.map((i) => (
            <Fragment key={i.key}>{renderItem(i, "copy", state(i))}</Fragment>
          ))}
        </motion.span>
      </motion.span>
      <div className={cn("absolute inset-0", rowClass)}>
        {items.map((i) => (
          <Fragment key={i.key}>{renderItem(i, "hit", state(i))}</Fragment>
        ))}
      </div>
    </div>
  )
}
