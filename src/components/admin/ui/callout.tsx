import { cva, type VariantProps } from "class-variance-authority"
import { AlertTriangle, Info } from "@/components/icons"
import { cn } from "@/lib/utils"

/** Admin / Callout (Figma 'Admin · Data display'). Radius 12, padding 10/14, gap 10; the tone sets fill and text. Keep the message in words, never the colour alone. */
const callout = cva("flex min-w-0 items-center gap-2.5 rounded-a-lg px-3.5 py-2.5 t-body-m", {
  variants: {
    tone: {
      neutral: "bg-a-hover text-a-text",
      accent: "bg-a-accent-soft text-a-text-accent",
      success: "bg-a-success-soft text-a-success",
      warning: "bg-a-warning-soft text-a-warning",
      danger: "bg-a-danger-soft text-a-danger",
    },
  },
  defaultVariants: { tone: "neutral" },
})

export function Callout({ tone = "neutral", icon, action, className, children, ...props }: React.ComponentProps<"div"> & VariantProps<typeof callout> & { icon?: React.ReactNode | false; action?: React.ReactNode }) {
  const glyph = icon === false ? null : (icon ?? (tone === "warning" || tone === "danger" ? <AlertTriangle className="size-4" /> : <Info className="size-4" />))
  return (
    <div role="status" className={cn(callout({ tone }), className)} {...props}>
      {glyph && <span aria-hidden className="grid shrink-0 place-items-center">{glyph}</span>}
      <span className="min-w-0 flex-1">{children}</span>
      {action && <span className="shrink-0">{action}</span>}
    </div>
  )
}
