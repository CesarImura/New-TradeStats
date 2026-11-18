"use client"
import { useState } from "react"
import { Slider as SliderPrimitive } from "@base-ui/react/slider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { SelectOptions } from "@/components/kit/select-field"
import { cn } from "@/lib/utils"
import { Swatch } from "./swatch"
import { BOX } from "./field-styles"

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i
const normHex = (v: string) => {
  const h = v.replace("#", "").toLowerCase()
  return `#${h.length === 3 ? [...h].map((c) => c + c).join("") : h}`
}

// ---------- colour maths (hex ⇄ RGB ⇄ HSV ⇄ HSL)

type HSV = { h: number; s: number; v: number }
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const toRgb = (hex: string) => {
  const n = Number.parseInt(normHex(hex).slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const
}
const toHex = (r: number, g: number, b: number) => `#${[r, g, b].map((x) => Math.round(clamp(x, 0, 255)).toString(16).padStart(2, "0")).join("")}`
function rgbToHsv(r: number, g: number, b: number): HSV {
  const [R, G, B] = [r / 255, g / 255, b / 255]
  const max = Math.max(R, G, B)
  const d = max - Math.min(R, G, B)
  const h = d === 0 ? 0 : max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4
  return { h: (h * 60 + 360) % 360, s: max === 0 ? 0 : d / max, v: max }
}
function hsvToRgb({ h, s, v }: HSV) {
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    return 255 * (v - v * s * Math.max(0, Math.min(k, 4 - k, 1)))
  }
  return [f(5), f(3), f(1)] as const
}
const hsvToHex = (c: HSV) => toHex(...hsvToRgb(c))
const hexToHsv = (hex: string) => rgbToHsv(...toRgb(hex))
function rgbToHsl(r: number, g: number, b: number) {
  const { h, s, v } = rgbToHsv(r, g, b)
  const l = v * (1 - s / 2)
  return [Math.round(h), Math.round(l === 0 || l === 1 ? 0 : ((v - l) / Math.min(l, 1 - l)) * 100), Math.round(l * 100)] as const
}
function hslToHex(h: number, s: number, l: number) {
  const L = l / 100
  const v = L + (s / 100) * Math.min(L, 1 - L)
  return hsvToHex({ h, s: v === 0 ? 0 : 2 * (1 - L / v), v })
}

/** Drag inside an element: reports the pointer as 0–1 on both axes, from press to release. */
function useDrag(onMove: (x: number, y: number) => void) {
  return {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      const el = e.currentTarget
      el.setPointerCapture(e.pointerId)
      const at = (ev: { clientX: number; clientY: number }) => {
        const r = el.getBoundingClientRect()
        onMove(clamp((ev.clientX - r.left) / r.width, 0, 1), clamp((ev.clientY - r.top) / r.height, 0, 1))
      }
      at(e)
      const move = (ev: PointerEvent) => at(ev)
      const up = () => {
        el.removeEventListener("pointermove", move)
        el.removeEventListener("pointerup", up)
        el.removeEventListener("pointercancel", up)
      }
      el.addEventListener("pointermove", move)
      el.addEventListener("pointerup", up)
      el.addEventListener("pointercancel", up)
    },
  }
}

type EyeDropperCtor = new () => { open: () => Promise<{ sRGBHexColor: string }> }

/**
 * Our colour picker, after toolcraft's: a full-bleed square for shade
 * (saturation left to right, brightness top to bottom), a hairline rainbow for
 * hue with the same square thumb as every slider, then the value as Hex, RGB
 * or HSL numbers, and an eyedropper where the browser has one. Replaces the
 * browser's own picker, which can't be styled.
 */
function ColorPickerPanel({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  // Hue and saturation are kept here so they survive greys and black, where the hex code loses them.
  const [hsv, setHsv] = useState<HSV>(() => hexToHsv(value))
  const [shown, setShown] = useState(value)
  if (normHex(value) !== normHex(shown)) {
    setShown(value)
    if (hsvToHex(hsv) !== normHex(value)) setHsv(hexToHsv(value))
  }
  const [mode, setMode] = useState<"hex" | "rgb" | "hsl">("hex")
  const set = (next: HSV) => {
    setHsv(next)
    const hex = hsvToHex(next)
    setShown(hex)
    onChange(hex)
  }
  const area = useDrag((x, y) => set({ ...hsv, s: x, v: 1 - y }))
  const hue = `hsl(${hsv.h} 100% 50%)`
  const rgb = toRgb(value)
  const hsl = rgbToHsl(...rgb)
  const dropper = typeof window !== "undefined" ? (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper : undefined

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)]">
      <div
        {...area}
        role="slider"
        aria-label="Shade: saturation and brightness"
        aria-valuenow={Math.round(hsv.s * 100)}
        aria-valuetext={`${Math.round(hsv.s * 100)}% saturation, ${Math.round(hsv.v * 100)}% brightness`}
        tabIndex={0}
        onKeyDown={(e) => {
          const d = e.shiftKey ? 0.1 : 0.01
          const k: Record<string, [number, number]> = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, d], ArrowDown: [0, -d] }
          if (!k[e.key]) return
          e.preventDefault()
          set({ ...hsv, s: clamp(hsv.s + k[e.key][0], 0, 1), v: clamp(hsv.v + k[e.key][1], 0, 1) })
        }}
        className="relative aspect-square w-full cursor-crosshair rounded-t-[5px] touch-none outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--ring)] focus-visible:ring-inset"
        style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hue})` }}
      >
        <span
          className="pointer-events-none absolute size-3.5 -translate-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.35),0_1px_3px_rgb(0_0_0/0.4)]"
          style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: value }}
        />
      </div>
      <div className="h-px bg-a-selected" />

      <div className="grid gap-3 p-3">
        <div className="flex items-center gap-2.5">
          {dropper && (
            <button
              type="button"
              aria-label="Pick a colour from the screen"
              title="Pick a colour from the screen"
              onClick={async () => {
                try {
                  const { sRGBHexColor } = await new dropper().open()
                  set(hexToHsv(sRGBHexColor))
                } catch {
                  // Escape closes the eyedropper without a colour.
                }
              }}
              className="grid size-6 shrink-0 place-items-center rounded-[3px] text-muted-foreground transition-colors hover:bg-a-selected hover:text-foreground"
            >
              <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden>
                <path d="M10.5 2.5a1.8 1.8 0 0 1 2.5 0l.5.5a1.8 1.8 0 0 1 0 2.5L12 7l-3-3 1.5-1.5Z" />
                <path d="M9 4 3.5 9.5 3 13l3.5-.5L12 7" />
              </svg>
            </button>
          )}
          <SliderPrimitive.Root
            value={hsv.h}
            min={0}
            max={359}
            largeStep={30}
            onValueChange={(v) => set({ ...hsv, h: Array.isArray(v) ? v[0] : (v as number) })}
            thumbAlignment="edge"
            aria-label="Hue"
            className="min-w-0 flex-1"
          >
            <SliderPrimitive.Control className="relative flex h-[18px] w-full touch-none items-center select-none">
              <SliderPrimitive.Track
                className="relative h-0.5 w-full grow rounded-full"
                style={{ background: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" }}
              />
              <SliderPrimitive.Thumb aria-label="Hue" className="relative block size-[9px] shrink-0 cursor-grab rounded-[2px] bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.45)] transition-transform outline-none select-none before:absolute before:top-1/2 before:left-1/2 before:size-[18px] before:-translate-1/2 hover:scale-125 focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ring)] active:cursor-grabbing data-[dragging]:scale-125" />
            </SliderPrimitive.Control>
          </SliderPrimitive.Root>
        </div>

        <div className="flex items-center gap-1.5">
          <SelectOptions
            value={mode}
            onChange={(e) => setMode(e.target.value as typeof mode)}
            aria-label="Colour format"
            className={cn(BOX, "w-[3.75rem] shrink-0 cursor-pointer px-1.5 font-medium")}
          >
            <option value="hex">Hex</option>
            <option value="rgb">RGB</option>
            <option value="hsl">HSL</option>
          </SelectOptions>
          {mode === "hex" ? (
            <HexInput value={value} onChange={(hex) => set(hexToHsv(hex))} label="Hex code" className={cn(BOX, "w-0 min-w-0 flex-1 px-2")} />
          ) : (
            <div className={cn(BOX, "flex min-w-0 flex-1 divide-x divide-a-border")}>
              {(mode === "rgb"
                ? (["R", "G", "B"] as const).map((n, i) => ({ n, v: rgb[i], max: 255, to: (x: number) => toHex(...(rgb.map((c, j) => (j === i ? x : c)) as [number, number, number])) }))
                : (["H", "S", "L"] as const).map((n, i) => ({
                    n,
                    v: hsl[i],
                    max: i === 0 ? 359 : 100,
                    to: (x: number) => hslToHex(...(hsl.map((c, j) => (j === i ? x : c)) as [number, number, number])),
                  }))
              ).map((c) => (
                <NumberCell key={c.n} label={c.n} value={c.v} max={c.max} onChange={(x) => set(hexToHsv(c.to(x)))} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** One number in the RGB / HSL row: type it, or use the arrow keys (Shift for tens). */
function NumberCell({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (n: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null)
  const done = () => {
    const n = Number.parseInt(draft ?? "", 10)
    if (!Number.isNaN(n)) onChange(clamp(n, 0, max))
    setDraft(null)
  }
  return (
    <input
      value={draft ?? String(value)}
      inputMode="numeric"
      aria-label={label}
      title={label}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={done}
      onKeyDown={(e) => {
        if (e.key === "Enter") done()
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault()
          onChange(clamp(value + (e.key === "ArrowUp" ? 1 : -1) * (e.shiftKey ? 10 : 1), 0, max))
          setDraft(null)
        }
      }}
      className="w-0 min-w-0 flex-1 bg-transparent text-center font-[family-name:var(--coach-font-label)] t-caption tabular-nums outline-none"
    />
  )
}

/** A hex code you can type or paste; it applies once complete, and bad codes snap back on leaving. */
function HexInput({ value, onChange, label, className }: { value: string; onChange: (c: string) => void; label: string; className?: string }) {
  const [draft, setDraft] = useState<string | null>(null)
  const commit = (v: string) => {
    if (HEX.test(v.trim())) onChange(normHex(v.trim()))
    setDraft(null)
  }
  return (
    <input
      value={draft ?? value.toUpperCase()}
      onChange={(e) => {
        setDraft(e.target.value)
        if (HEX.test(e.target.value.trim()) && e.target.value.replace("#", "").trim().length === 6) onChange(normHex(e.target.value.trim()))
      }}
      onFocus={(e) => e.target.select()}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit((e.target as HTMLInputElement).value)
        if (e.key === "Escape") setDraft(null)
      }}
      spellCheck={false}
      aria-label={label}
      className={cn("bg-transparent t-mono-data uppercase outline-none", className)}
    />
  )
}

/**
 * Opens our colour picker from any trigger (a swatch, a chip). `children` is
 * rendered as the trigger.
 */
export function ColorPicker({ value, onChange, label, children }: { value: string; onChange: (c: string) => void; label: string; children: React.ReactElement }) {
  return (
    <Popover>
      <PopoverTrigger render={children} aria-label={`Pick ${label.toLowerCase()}`} />
      <PopoverContent align="start" sideOffset={6} className="w-[236px] gap-0 rounded-[6px] p-0">
        <ColorPickerPanel value={value} onChange={onChange} />
      </PopoverContent>
    </Popover>
  )
}

/**
 * Any colour, the toolcraft way: a swatch that opens our picker, and the hex
 * code in mono, typed or pasted.
 */
export function ColorField({ value, onChange, label }: { value: string; onChange: (c: string) => void; label: string }) {
  return (
    <div className={cn(BOX, "flex items-center gap-2 pr-2 pl-1")}>
      <ColorPicker value={value} onChange={onChange} label={label}>
        <button
          type="button"
          title="Pick any colour"
          className="relative size-5 shrink-0 cursor-pointer rounded-[3px] ring-1 after:absolute after:-inset-0.5 after:content-[''] ring-a-border-strong ring-inset outline-none focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-[color:var(--ring)]"
          style={{ background: value }}
        />
      </ColorPicker>
      <HexInput value={value} onChange={onChange} label={`${label} hex code`} className="w-0 min-w-0 flex-1 self-stretch" />
    </div>
  )
}

/** Colour presets as round chips (the selected one ringed), with the exact colour as a hex field under them. */
export function Swatches({
  value,
  colors,
  onChange,
  label,
}: {
  value: string
  colors: string[]
  onChange: (c: string) => void
  label: string
}) {
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label={label}>
        {colors.map((c) => {
          const on = c.toLowerCase() === value.toLowerCase()
          return (
            <Swatch key={c} role="radio" aria-checked={on} aria-label={c} onClick={() => onChange(c)} color={c} selected={on} />
          )
        })}
      </div>
      <ColorField value={value} onChange={onChange} label={label} />
    </div>
  )
}
