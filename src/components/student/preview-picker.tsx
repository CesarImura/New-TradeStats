"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { describe, elementsFor, resolve, type PickMessage, type PickTarget } from "@/lib/design-pick"

/** Admin selection colour (TradeStats orange), fixed so it never takes on the coach's theme. */
const ACCENT = "#ff5500"

type Box = { x: number; y: number; w: number; h: number }
const rect = (el: Element): Box => {
  const r = el.getBoundingClientRect()
  return { x: r.left, y: r.top, w: r.width, h: r.height }
}

/**
 * Inside the Design preview frame only: in select mode, hovering outlines the
 * part of the page a setting controls and clicking tells the editor which
 * setting that is. Links, buttons and menus don't react while selecting.
 */
export function PreviewPicker() {
  const [on, setOn] = useState(false)
  const [hover, setHover] = useState<{ target: PickTarget; el: Element } | null>(null)
  const [picked, setPicked] = useState<{ target: PickTarget; el: Element } | null>(null)
  const [shown, setShown] = useState<Element[]>([])
  const [, tick] = useState(0)

  // Talk to the editor around the frame.
  useEffect(() => {
    const post = (m: PickMessage) => window.parent !== window && window.parent.postMessage(m, window.location.origin)
    const onMessage = (e: MessageEvent<PickMessage>) => {
      if (e.origin !== window.location.origin) return
      if (e.data?.type === "design-pick-mode") {
        setOn(e.data.on)
        if (!e.data.on) {
          setHover(null)
          setPicked(null)
        }
      }
      if (e.data?.type === "design-show") setShown(e.data.targets.length ? elementsFor(e.data.targets) : [])
    }
    window.addEventListener("message", onMessage)
    post({ type: "design-pick-ready" })
    return () => window.removeEventListener("message", onMessage)
  }, [])

  // Pointer handling in the capture phase, so the page's own handlers never run while selecting.
  useEffect(() => {
    if (!on) return
    const block = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
    }
    const move = (e: PointerEvent) => setHover(resolve(e.target as Element))
    const leave = () => setHover(null)
    const click = (e: MouseEvent) => {
      block(e)
      const hit = resolve(e.target as Element)
      if (!hit) return
      setPicked(hit)
      window.parent.postMessage({ type: "design-pick", target: hit.target } satisfies PickMessage, window.location.origin)
    }
    const opts = { capture: true }
    document.addEventListener("pointermove", move, opts)
    document.documentElement.addEventListener("pointerleave", leave)
    document.addEventListener("click", click, opts)
    for (const t of ["pointerdown", "mousedown", "pointerup", "mouseup", "dblclick", "contextmenu", "submit"]) document.addEventListener(t, block, opts)
    document.documentElement.style.cursor = "pointer"
    return () => {
      document.removeEventListener("pointermove", move, opts)
      document.documentElement.removeEventListener("pointerleave", leave)
      document.removeEventListener("click", click, opts)
      for (const t of ["pointerdown", "mousedown", "pointerup", "mouseup", "dblclick", "contextmenu", "submit"]) document.removeEventListener(t, block, opts)
      document.documentElement.style.cursor = ""
    }
  }, [on])

  // Keep outlines on their elements through scrolling, resizing and live theme changes.
  const visible = on && (hover || picked || shown.length > 0)
  useEffect(() => {
    if (!visible) return
    let id = 0
    const loop = () => {
      tick((n) => n + 1)
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [visible])

  if (!on) return null
  const live = (el?: Element) => el && el.isConnected
  return createPortal(
    <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 2147483647 }}>
      {shown.filter(live).map((el, i) => (
        <Outline key={i} box={rect(el)} tone="soft" />
      ))}
      {picked && live(picked.el) && <Outline box={rect(picked.el)} tone="solid" label={describe(picked.target).label} />}
      {hover && live(hover.el) && hover.el !== picked?.el && <Outline box={rect(hover.el)} tone="dashed" label={describe(hover.target).label} />}
    </div>,
    document.body,
  )
}

function Outline({ box, tone, label }: { box: Box; tone: "solid" | "dashed" | "soft"; label?: string }) {
  const inset = box.y < 22
  return (
    <div
      style={{
        position: "absolute",
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        outline: `2px ${tone === "dashed" ? "dashed" : "solid"} ${ACCENT}`,
        outlineOffset: -1,
        background: tone === "soft" ? `${ACCENT}14` : undefined,
        borderRadius: 2,
      }}
    >
      {label && (
        <span
          style={{
            position: "absolute",
            left: -1,
            top: inset ? 2 : -22,
            height: 20,
            padding: "0 6px",
            display: "flex",
            alignItems: "center",
            background: ACCENT,
            color: "#000",
            font: "500 11px/1 'IBM Plex Sans', system-ui, sans-serif",
            whiteSpace: "nowrap",
            borderRadius: 2,
          }}
        >
          {label}
        </span>
      )}
    </div>
  )
}
