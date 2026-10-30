"use client"

import { cn } from "@/lib/utils"
import { ColorField, Field } from "./controls"
import { useDesign } from "./design-fields"
import { SWATCH_ON } from "./states"

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
    <Field id="trading" label="Trading colours" hint="Profit and loss, in charts and figures">
      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1">
          <span className="text-xs text-muted-foreground">Up / profit</span>
          <ColorField value={profit} onChange={(c) => write(c, loss)} label="Up / profit colour" />
        </div>
        <div className="grid gap-1">
          <span className="text-xs text-muted-foreground">Down / loss</span>
          <ColorField value={loss} onChange={(c) => write(profit, c)} label="Down / loss colour" />
        </div>
      </div>
      <div className="grid gap-1.5">
        <span className="text-xs text-muted-foreground">Suggested · the last pair is safe for colour-blind students</span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Suggested trading colours">
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
                  // No overflow-hidden (the halves are rounded instead), so the 24px click area (after) isn't clipped.
                  "relative flex rounded-full ring-1 ring-[color:color-mix(in_oklab,var(--foreground)_14%,transparent)] ring-inset transition-transform outline-none hover:scale-110 focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ring)] after:absolute after:inset-x-0 after:-inset-y-0.5 after:content-['']",
                  on && SWATCH_ON,
                )}
              >
                <span className="h-5 w-4 rounded-l-full" style={{ background: s.profit }} />
                <span className="h-5 w-4 rounded-r-full" style={{ background: s.loss }} />
              </button>
            )
          })}
        </div>
      </div>
      {set && (
        <button type="button" onClick={() => write("", "")} className="w-fit text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
          Reset to template
        </button>
      )}
    </Field>
  )
}
