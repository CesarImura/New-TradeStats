"use client"

import { useId } from "react"
import { cn } from "@/lib/utils"

/**
 * The Traderhub logo (Figma: Admin / Logo 1096:2456, mark 23 x 24.5). The only mark to use anywhere: the "T" with a
 * gradient from top to bottom (#FF4701 → #FF9003). Tones match the Figma: brand (white wordmark, dark backgrounds),
 * brand-light (black wordmark, light backgrounds), and the one-colour white, gray (#757575) and black, flat on mark and
 * wordmark. Never the flat orange "T" or the "TradeStats" wordmark (both retired on 13/11).
 */
export type LogoTone = "brand" | "brand-light" | "black" | "gray" | "white"

/** Top and bottom of the gradient per tone. Brand reads the Figma tokens (color/brand-gradient-start and -end). */
const BRAND: [string, string] = ["var(--admin-color-brand-gradient-start)", "var(--admin-color-brand-gradient-end)"]
const STOPS: Record<LogoTone, [string, string]> = {
  brand: BRAND,
  "brand-light": BRAND,
  black: ["#0a0a0a", "#0a0a0a"],
  gray: ["#757575", "#757575"],
  white: ["#ffffff", "#ffffff"],
}

const PATH = "M15.264 0V8.02976L7.63283 0H0V8.25179H15.0558L7.5279 16.6155V24.5333H15.264V8.25179H23V0H15.264Z"

/** The "T" alone. `size` is its height in px (the width follows, 23 : 24.5). */
export function LogoMark({ tone = "brand", size = 25, className }: { tone?: LogoTone; size?: number; className?: string }) {
  // One gradient per mark: ids from useId hold characters that url(#…) can't take.
  const id = `th-logo-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
  const [top, bottom] = STOPS[tone]
  return (
    <svg width={(size * 23) / 25} height={size} viewBox="0 0 23 25" fill="none" aria-hidden className={cn("shrink-0", className)}>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="11.5" y1="0" x2="11.5" y2="24.5333">
          <stop style={{ stopColor: top }} />
          <stop offset="1" style={{ stopColor: bottom }} />
        </linearGradient>
      </defs>
      <path d={PATH} fill={`url(#${id})`} />
    </svg>
  )
}

/** The mark and the "Traderhub" wordmark (Admin / Logo: 10 px apart, Heading M). */
export function Logo({ tone = "brand", size = 25, className, wordClassName }: { tone?: LogoTone; size?: number; className?: string; wordClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark tone={tone} size={size} />
      <span className={cn("t-heading-m", tone === "brand" ? "text-a-text" : WORD[tone], wordClassName)}>Traderhub</span>
    </span>
  )
}

/** Wordmark colour per tone (Figma component/logo/wordmark/* and mono/*). */
const WORD: Record<Exclude<LogoTone, "brand">, string> = { "brand-light": "text-[#0a0a0a]", black: "text-[#0a0a0a]", gray: "text-[#757575]", white: "text-white" }
