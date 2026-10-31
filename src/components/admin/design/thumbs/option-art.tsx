"use client"

import { createContext, useContext, useMemo } from "react"
import { cn } from "@/lib/utils"
import { themeVars } from "@/lib/theme/css"
import { useDesign } from "../fields/design-fields"
import type { PanelStyle } from "@/lib/theme/types"
import { EASE } from "../states"

/*
 * Pictures for the few choices whose difference is a shape (the card: its surface, shadow and chart box); every other
 * choice is a word (Segmented), so the panel stays quiet. Drawn (64 × 40) in the coach's DRAFT design: its page, card
 * and text colours (light or dark), its brand colour as the one accent, its corner radius. The tile around them
 * (chosen = the editor's white edge) is the editor's own selection, never the coach's.
 */

/** The art's colours, set on each picture's well by OptionTiles from the draft theme. */
const O = "var(--a-accent)"
const INK = "currentColor"
const PAGE = "var(--a-page)"
const CARD = "var(--a-card)"

/** The draft's corner radius in the art's scale (a 48-unit card): the pictures are as round or square as the widgets. */
const ArtCtx = createContext({ rx: 4 })
const useRx = () => useContext(ArtCtx).rx

/** A chosen picture tile (an option here, a layout or a widget in the gallery): the orange edge, and a warm wash rising from its foot. */
export const TILE_ON = "border-[color:var(--ts-interactive)] bg-[linear-gradient(to_top,color-mix(in_oklab,var(--ts-interactive)_18%,transparent),color-mix(in_oklab,var(--ts-interactive)_2%,transparent)_70%)] shadow-[0_0_0_1px_var(--ts-interactive),0_6px_18px_-8px_color-mix(in_oklab,var(--ts-interactive)_55%,transparent)]"
/** A picture tile at rest: a faint fill, one step lighter on hover. */
export const TILE_IDLE = "border-transparent bg-[color:color-mix(in_oklab,var(--foreground)_4%,transparent)] hover:bg-[color:color-mix(in_oklab,var(--foreground)_7%,transparent)]"

export type Option<T> = { value: T; label: string; hint?: string; art: React.ReactNode }

/**
 * A choice as picture tiles (the reference's option cards): the art in a dark well, the name under it. The chosen one
 * gets the orange edge and a warm wash rising from its foot; the others lift a step on hover.
 */
export function OptionTiles<T extends string | number>({ label, value, options, onChange, cols = 3, id }: { label: string; value: T; options: Option<T>[]; onChange: (v: T) => void; cols?: 2 | 3 | 4; id?: string }) {
  const { theme } = useDesign()
  // The draft's colours for the art: its page, card, text and brand, and what reads on the brand.
  const well = useMemo(() => {
    const v = themeVars(theme) as Record<string, string>
    return { "--a-page": v["--background"], "--a-card": v["--card"], "--a-accent": v["--brand-mark"] ?? v["--primary"], "--a-on": v["--on-brand"] ?? v["--primary-foreground"], "--a-ink": v["--foreground"], color: v["--foreground"] } as React.CSSProperties
  }, [theme])
  const art = useMemo(() => ({ rx: Math.max(0.5, Math.min(8, theme.radius / 3)) }), [theme.radius])
  return (
    <div
      role="radiogroup"
      aria-label={label}
      data-field={id}
      // A radio group moves with the arrow keys: the next or previous option is chosen and takes the focus.
      onKeyDown={(e) => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
        if (!step) return
        e.preventDefault()
        const i = (options.findIndex((o) => o.value === value) + step + options.length) % options.length
        onChange(options[i].value)
        ;(e.currentTarget.children[i] as HTMLElement | undefined)?.focus()
      }}
      className={cn("grid gap-1.5", { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" }[cols])}
    >
      {options.map((o, i) => {
        const on = o.value === value
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={on}
            // One stop for Tab: the chosen option, or the first when none is.
            tabIndex={on || (i === 0 && !options.some((x) => x.value === value)) ? 0 : -1}
            title={o.hint}
            onClick={() => onChange(o.value)}
            className={cn(
              "group/opt grid min-w-0 gap-1 rounded-[10px] border p-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] active:scale-[0.97] motion-reduce:active:scale-100",
              EASE,
              on ? TILE_ON : TILE_IDLE,
            )}
          >
            <span aria-hidden className="block overflow-hidden rounded-[7px]" style={{ ...well, background: PAGE }}>
              <ArtCtx.Provider value={art}>{o.art}</ArtCtx.Provider>
            </span>
            <span className={cn("truncate px-1 pb-0.5 text-[0.6875rem] font-semibold", on ? "text-foreground" : "text-muted-foreground group-hover/opt:text-foreground")}>{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/** The frame every picture is drawn in. */
function Art({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 64 40" className={cn("block aspect-[8/5] w-full", className)} fill="none">
      {children}
    </svg>
  )
}

/** A name line and a figure, the top of every pictured widget. */
function Head({ x = 12, y = 11 }: { x?: number; y?: number }) {
  return (
    <>
      <rect x={x} y={y} width="16" height="2" rx="1" fill={INK} opacity="0.35" />
      <rect x={x} y={y + 5} width="11" height="3.5" rx="1.75" fill={INK} opacity="0.85" />
    </>
  )
}
/** The small line chart inside a pictured card. */
const CARD_LINE = "M12,27 L18,24.5 L23,25.5 L29,21.5 L35,23 L41,19 L46,20 L52,17"

/** A widget in one of the card surfaces, with the shadow and the chart box it can have. */
export function CardArt({ surface = "raised", shadow, panel }: { surface?: "raised" | "grey" | "outline"; shadow?: "none" | "soft" | "strong"; panel?: PanelStyle }) {
  const rx = useRx()
  const fill = surface === "outline" ? "none" : surface === "grey" ? "color-mix(in oklab, var(--a-ink) 9%, var(--a-page))" : CARD
  const glow = shadow === "strong" ? "color-mix(in oklab, var(--a-accent) 50%, transparent)" : "rgb(0 0 0 / 0.5)"
  return (
    <Art>
      {shadow && shadow !== "none" && <rect x="9" y={shadow === "strong" ? 11 : 9} width="46" height="26" rx={rx} fill={glow} style={{ filter: `blur(${shadow === "strong" ? 3.5 : 2}px)` }} />}
      <rect x="8" y="5" width="48" height="28" rx={rx} fill={fill} stroke={surface === "outline" ? INK : "none"} strokeOpacity="0.4" strokeWidth="0.8" />
      {surface === "raised" && <line x1="12" x2="52" y1="5.5" y2="5.5" stroke={INK} strokeOpacity="0.12" strokeWidth="0.6" />}
      <Head y={9} />
      {panel === "filled" && <rect x="11" y="18" width="42" height="12" rx="1.5" fill={INK} opacity="0.08" />}
      {panel === "outline" && <rect x="11" y="18" width="42" height="12" rx="1.5" stroke={INK} strokeOpacity="0.35" strokeWidth="0.6" />}
      <path d={CARD_LINE} stroke={O} strokeWidth="1.2" strokeLinejoin="round" />
      <path d={`${CARD_LINE} L52,29 L12,29 Z`} fill={O} opacity="0.16" />
    </Art>
  )
}

