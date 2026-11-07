"use client"

import { useEffect, useRef, useState } from "react"

// Desktop at 1440: with the menu beside it the page area stays over 60rem, so the preview shows the same
// three-column layout as the platform on a desktop screen (at 1280 it fell back to the two-column one).
const SIZES = { desktop: { w: 1440, h: 900 }, tablet: { w: 820, h: 1180 }, phone: { w: 390, h: 844 } } as const

/**
 * The coach's real platform, loaded in a frame with ?preview=draft so it
 * shows unpublished changes. It updates live as settings change.
 * Scaled down to fit the space it has.
 */
export function PreviewFrame({
  src,
  device,
  frameRef,
  desktopWidth,
}: {
  src: string
  device: keyof typeof SIZES
  /** A narrower desktop than the platform's 1440, for screens that are one card (Join): they read larger in the frame. */
  desktopWidth?: number
  frameRef?: React.Ref<HTMLIFrameElement>
}) {
  const box = useRef<HTMLDivElement>(null)
  const [space, setSpace] = useState({ w: 0, h: 0 })
  const size = device === "desktop" && desktopWidth ? { ...SIZES.desktop, w: desktopWidth } : SIZES[device]

  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSpace({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const fixed = device !== "desktop"
  const scale = space.w ? Math.min(1, (space.w - 96) / size.w, fixed ? (space.h - 80) / size.h : 1) : 0
  const height = fixed ? size.h : Math.max(size.h, (space.h - 80) / (scale || 1))

  return (
    <div ref={box} className="relative grid h-full min-h-0 place-items-start justify-center overflow-hidden px-12 pt-10">
      {scale > 0 && (
        <div
          // The same frame as the canvas in Pages: its corners and its shadow.
          className="overflow-hidden bg-background ring-1 ring-white/[0.08]"
          style={{ width: size.w * scale, height: height * scale, borderRadius: fixed ? 28 : 12 }}
        >
          <iframe
            key={device}
            ref={frameRef}
            src={src}
            title="Live preview of your platform"
            style={{ width: size.w, height, transform: `scale(${scale})`, transformOrigin: "0 0", border: 0 }}
          />
        </div>
      )}
    </div>
  )
}
