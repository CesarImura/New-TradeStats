import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/** Admin / Callout (Figma): radius 12, padding 10/14, gap 10, Body/M. Tone sets fill and text; neutral keeps primary text. */
const callout = cva("flex items-center gap-2.5 rounded-a-lg px-3.5 py-2.5 t-body-m", {
  variants: {
    tone: {
      neutral: "bg-a-hover text-a-text [&_svg]:text-a-icon",
      accent: "bg-a-accent-soft text-a-text-accent",
      success: "bg-a-success-soft text-a-success",
      warning: "bg-a-warning-soft text-a-warning",
      danger: "bg-a-danger-soft text-a-danger",
    },
  },
  defaultVariants: { tone: "neutral" },
})

/** `icon` sits first, `action` last (usually a small secondary AdminButton). */
export function Callout({ tone, icon, action, className, children, ...props }: React.ComponentProps<"div"> & VariantProps<typeof callout> & { icon?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div role={tone === "danger" || tone === "warning" ? "alert" : "status"} className={cn(callout({ tone }), className)} {...props}>
      {icon && <span aria-hidden className="shrink-0 [&_svg]:size-4">{icon}</span>}
      <div className="min-w-0 flex-1">{children}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
