"use client"

import Link from "next/link"
import { createContext, isValidElement, useContext, useEffect, useLayoutEffect, useRef, useState } from "react"
import type { WidgetHeader } from "@/lib/theme/types"
import type { WidgetNote } from "@/lib/widgets/layout"
import { cut } from "./card"

// The widget's frame: Emphasis and Detail per widget (WidgetFrame), read with useFrame() and useMore().

export type Emphasis = "quiet" | "accent" | "star"
export type Detail = "compact" | "standard" | "detailed"
/** The picture behind one widget's card and how much the card colour covers it (widget-scope.tsx sets it, W draws it). */
export type WidgetPicture = { style: React.CSSProperties; dim: number }
export const WidgetPictureContext = createContext<WidgetPicture | null>(null)

const FrameCtx = createContext<{ emphasis: Emphasis; detail: Detail; header?: Partial<WidgetHeader>; note?: WidgetNote; core?: boolean; fixed?: boolean }>({ emphasis: "accent", detail: "standard" })

/** Wraps one placed widget with its Emphasis, Detail, own header parts and own content (note). `core`: the page's own tool, which takes no note. */
export function WidgetFrame({
  emphasis = "accent",
  detail = "standard",
  header,
  note,
  core,
  fixed,
  live,
  children,
}: {
  emphasis?: Emphasis
  detail?: Detail
  header?: Partial<WidgetHeader>
  note?: WidgetNote
  core?: boolean
  /**
   * The cell gives the widget its height (the builder, the desktop grid), not its content (the library, phones).
   * Only then can the card be a size container: its shape (wide, tall) and its height can steer the layout.
   */
  fixed?: boolean
  /** On the student's own pages links navigate and forms submit; everywhere else (library, thumbnails, the editor) they stay inert. */
  live?: boolean
  children: React.ReactNode
}) {
  const box = useRef<HTMLDivElement>(null)
  // What the card says: its layout, the widget's own fields, the coach's note, the header parts, how much it stands out (Star draws bigger numbers). When it changes the level is worked out again.
  const own = isValidElement<{ variant?: string; props?: unknown }>(children) ? [children.props.variant, children.props.props] : []
  const shown = useFitDetail(detail, box, JSON.stringify([own, note, header, emphasis]))
  return (
    <FrameCtx.Provider value={{ emphasis, detail: shown, header, note, core, fixed }}>
      {/* Outside the live page widgets show interactions only: links and buttons keep hover, focus and press, but never leave the page. */}
      <div ref={box} className="contents [&_:is(button,a[href],[role=button],summary):not(:disabled)]:cursor-pointer" onClickCapture={live ? undefined : stayOnPage} onSubmitCapture={live ? undefined : (e) => e.preventDefault()}>
        {children}
      </div>
    </FrameCtx.Provider>
  )
}

const LEVELS: Detail[] = ["compact", "standard", "detailed"]

/**
 * The Detail a widget actually shows. When the card is too short for the
 * chosen level even after its optional parts gave way (useDropToFit), it
 * steps down one level at a time (Detailed → Standard → Compact) rather than
 * cut anything; when the card grows, it tries the chosen level again. The
 * card carries `data-detail-shown` while it shows less than was chosen, so
 * the builder can say why.
 */
function useFitDetail(detail: Detail, box: React.RefObject<HTMLDivElement | null>, contentKey: string) {
  const [chosen, setChosen] = useState(detail)
  const [shown, setShown] = useState(detail)
  // A new choice starts over from that level (adjusting state while rendering, as React recommends).
  if (chosen !== detail) {
    setChosen(detail)
    setShown(detail)
  }
  // New content (a layout, a field or the note changed): the level is worked out again from the chosen one, once the editing has paused.
  // Without it a card that stepped down for its old content stayed there (or never stepped down for its new one) until a reload.
  const [tick, setTick] = useState(0)
  const settled = useRef(contentKey)
  useEffect(() => {
    if (settled.current === contentKey) return
    const t = setTimeout(() => {
      settled.current = contentKey
      setShown(detail)
      setTick((n) => n + 1)
    }, 400)
    return () => clearTimeout(t)
  }, [contentKey, detail])
  // The coach's fonts load late: a level dropped on the first measurement, with the fallback font's wider letters, is worked out again from the chosen one once they are in.
  const latest = useRef(detail)
  latest.current = detail
  useEffect(() => {
    let live = true
    document.fonts?.ready.then(() => {
      if (!live) return
      setShown(latest.current)
      setTick((n) => n + 1)
    })
    return () => {
      live = false
    }
  }, [])
  useLayoutEffect(() => {
    const card = box.current?.querySelector<HTMLElement>("[data-slot=widget]")
    if (!card) return
    if (shown !== detail) card.dataset.detailShown = shown
    else delete card.dataset.detailShown
    const w = card.clientWidth
    const h = card.clientHeight
    const step = () => {
      const i = LEVELS.indexOf(shown)
      // A card the grid has not given its height yet (the Design canvas lays out after the first paint) has everything "cut": wait for its size.
      if (!card.clientHeight) return
      if (i > 0 && cut(card)) setShown(LEVELS[i - 1])
    }
    // Measured once things settle: lists pick their row count and parts give way first, so a level is only
    // dropped when that wasn't enough. A bigger card gets the chosen level back; a smaller one is checked again.
    let t = setTimeout(step, 250)
    const ro = new ResizeObserver(() => {
      if (shown !== detail && (card.clientHeight > h + 1 || card.clientWidth > w + 1)) return setShown(detail)
      clearTimeout(t)
      t = setTimeout(step, 250)
    })
    ro.observe(card)
    return () => {
      clearTimeout(t)
      ro.disconnect()
    }
  }, [shown, detail, box, tick])
  return shown
}

/** Cancels a link's navigation before Next's Link or the browser acts on it (both skip a prevented click). */
function stayOnPage(e: React.MouseEvent) {
  if ((e.target as Element).closest("a[href]")) e.preventDefault()
}

/** Props that turn a Button into a link: inside the app for a path, a new tab for a web address. */
export const link = (p: string) => ({ nativeButton: false as const, render: /^(https?:|mailto:)/.test(p) ? <a href={p} target="_blank" rel="noreferrer" /> : <Link href={p} /> })
export const useFrame = () => useContext(FrameCtx)
/** True from the given detail level up: `useMore("detailed")` is only true on Detailed. */
export function useMore(level: Detail = "standard") {
  const { detail } = useFrame()
  const rank = { compact: 0, standard: 1, detailed: 2 }
  return rank[detail] >= rank[level]
}
