"use client"

import { useEffect, useRef, useState } from "react"
import { LayoutGrid } from "@/components/icons"
import { AdminProgress } from "@/components/admin/ui"
import { cn } from "@/lib/utils"

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
  name,
}: {
  src: string
  device: keyof typeof SIZES
  /** A narrower desktop than the platform's 1440, for screens that are one card (Join): they read larger in the frame. */
  desktopWidth?: number
  frameRef?: React.Ref<HTMLIFrameElement>
  /** The platform's name, for the loading message. */
  name?: string
}) {
  const box = useRef<HTMLDivElement>(null)
  const [space, setSpace] = useState({ w: 0, h: 0 })
  // Which frame has finished loading: a new address or device starts loading again (Figma Canvas 04: Preview loading).
  const key = `${device}|${src}`
  const [loaded, setLoaded] = useState<string | null>(null)
  const loading = loaded !== key
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
          className={cn("overflow-hidden bg-background ring-1 ring-a-border transition-opacity duration-300 ease-out", loading && "opacity-0")}
          style={{ width: size.w * scale, height: height * scale, borderRadius: fixed ? 28 : 12 }}
        >
          <iframe
            key={device}
            ref={frameRef}
            src={src}
            title="Live preview of your platform"
            onLoad={() => setLoaded(key)}
            style={{ width: size.w, height, transform: `scale(${scale})`, transformOrigin: "0 0", border: 0 }}
          />
        </div>
      )}
      {loading && (
        <div role="status" className="absolute inset-0 grid place-content-center justify-items-center gap-2 text-center">
          <span aria-hidden className="mb-2 grid size-7 place-items-center rounded-a-sm bg-a-accent-soft text-a-text-accent">
            <LayoutGrid className="size-4" />
          </span>
          <p className="t-body-l text-a-text">Loading the preview</p>
          <p className="t-body-m text-a-text-2">Applying your changes{name ? ` to ${name}` : ""}.</p>
          <AdminProgress value={40} indeterminate label="Loading the preview" className="mt-2 w-44" />
        </div>
      )}
    </div>
  )
}
