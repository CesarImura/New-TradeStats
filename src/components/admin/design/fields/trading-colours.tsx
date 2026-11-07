"use client"

import { ArrowDown, ArrowUp } from "@/components/icons"
import { cn } from "@/lib/utils"
import { ColorField } from "./controls"
import { useDesign } from "./design-fields"
import { SWATCH_ON } from "../states"

/** Ready-made up / down pairs. */
const SUGGESTED = [
  { name: "TradingView", profit: "#089981", loss: "#F23645" },
  { name: "Classic", profit: "#16A34A", loss: "#DC2626" },
  // Colour-blind safe: checked for protan, deutan and tritan separation on light and dark cards.
  { name: "Blue and orange (colour-blind safe)", profit: "#2962FF", loss: "#E65100" },
] as const

/**
 * The up and down colours: profit and loss in charts, figures and badges, on
 * every surface. Unset, the template's own are used. An empty pair is how a
 * reset is saved (so it survives the draft round trip).
 */
export function TradingColoursField() {
  const { theme, change } = useDesign()
  const set = !!(theme.trading?.profit && theme.trading.loss)
  const profit = set ? theme.trading!.profit : theme.palettes[theme.mode].profit
  const loss = set ? theme.trading!.loss : theme.palettes[theme.mode].loss
  const write = (p: string, l: string) => change({ theme: { trading: { profit: p, loss: l } } }, "trading")

  return (
    // The two colours, each with its arrow in that colour, then the ready-made pairs as swatches.
    <div data-field="trading" className="grid gap-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1.5">
          <span className="flex items-center gap-1 text-[0.8125rem] leading-5 text-[color:color-mix(in_oklab,var(--foreground)_60%,transparent)]">
            <ArrowUp className="size-3" style={{ color: profit }} /> Profit
          </span>
          <ColorField value={profit} onChange={(c) => write(c, loss)} label="Profit colour" />
        </div>
        <div className="grid gap-1.5">
          <span className="flex items-center gap-1 text-[0.8125rem] leading-5 text-[color:color-mix(in_oklab,var(--foreground)_60%,transparent)]">
            <ArrowDown className="size-3" style={{ color: loss }} /> Loss
          </span>
          <ColorField value={loss} onChange={(c) => write(profit, c)} label="Loss colour" />
        </div>
      </div>
      <div className="flex items-center gap-2" role="radiogroup" aria-label="Ready-made pairs">
        {SUGGESTED.map((s) => {
          const on = set && s.profit.toLowerCase() === profit.toLowerCase() && s.loss.toLowerCase() === loss.toLowerCase()
          return (
            <button
              key={s.name}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${s.name}: ${s.profit} up, ${s.loss} down`}
              title={s.name}
              onClick={() => write(s.profit, s.loss)}
              className={cn(
                // Two rounded halves (no overflow-hidden), so the 24px click area (after) isn't clipped.
                "relative flex size-5 rounded-full ring-1 ring-[color:color-mix(in_oklab,var(--foreground)_14%,transparent)] ring-inset transition-transform outline-none after:absolute after:-inset-0.5 after:content-[''] hover:scale-110 focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ring)]",
                on && cn("scale-110 hover:scale-110", SWATCH_ON),
              )}
            >
              <span className="h-5 w-2.5 rounded-l-full" style={{ background: s.profit }} />
              <span className="h-5 w-2.5 rounded-r-full" style={{ background: s.loss }} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
