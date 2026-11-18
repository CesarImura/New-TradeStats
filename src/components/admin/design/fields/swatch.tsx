import { cn } from "@/lib/utils"
import { SWATCH_ON } from "../states"

/**
 * A round colour chip (Figma Admin / Swatch: 20 px, hairline ring, a 24 px click area). The selected one is ringed in white
 * and a little larger. `children` replace the single colour when a chip shows two (profit and loss halves).
 */
export function Swatch({ color, selected, className, children, ...props }: Omit<React.ComponentProps<"button">, "color"> & { color?: string; selected?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      style={color ? { background: color } : undefined}
      className={cn(
        "relative size-5 rounded-full ring-1 ring-a-border-strong ring-inset transition-transform outline-none after:absolute after:-inset-0.5 after:content-[''] hover:scale-110 focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ring)]",
        selected && cn("scale-110 hover:scale-110", SWATCH_ON),
        className,
      )}
    >
      {children}
    </button>
  )
}
