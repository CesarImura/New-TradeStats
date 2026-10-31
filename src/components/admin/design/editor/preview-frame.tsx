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
}: {
  src: string
  device: keyof typeof SIZES
  frameRef?: React.Ref<HTMLIFrameElement>
}) {
  const box = useRef<HTMLDivElement>(null)
  const [space, setSpace] = useState({ w: 0, h: 0 })
  const size = SIZES[device]

  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSpace({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const fixed = device !== "desktop"
  const scale = space.w ? Math.min(1, (space.w - 32) / size.w, fixed ? (space.h - 32) / size.h : 1) : 0
  const height = fixed ? size.h : Math.max(size.h, (space.h - 32) / (scale || 1))

  return (
    <div ref={box} className="relative grid h-full min-h-0 place-items-start justify-center overflow-hidden p-4">
      {scale > 0 && (
        <div
          className="overflow-hidden rounded-xl bg-background shadow-xl ring-1 ring-black/10"
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
