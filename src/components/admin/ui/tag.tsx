import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/** Admin / Tag (576:414). Mono 10 uppercase. Tone carries the meaning, never the colour alone: keep the label. */
const tag = cva("inline-flex h-5 shrink-0 items-center gap-1.5 rounded-a-xs px-2 t-mono-label-s whitespace-nowrap", {
  variants: {
    tone: {
      neutral: "bg-a-selected text-a-text-2",
      accent: "bg-a-accent-soft text-a-text-accent",
      success: "bg-a-success-soft text-a-success",
      warning: "bg-a-warning-soft text-a-warning",
      danger: "bg-a-danger-soft text-a-danger",
      info: "bg-a-info-soft text-a-info",
    },
  },
  defaultVariants: { tone: "neutral" },
})
const dot: Record<string, string> = {
  neutral: "bg-a-text-3", accent: "bg-a-accent-strong", success: "bg-a-success-fill", warning: "bg-a-warning-fill", danger: "bg-a-danger-fill", info: "bg-a-info-fill",
}

export function Tag({ tone = "neutral", dot: showDot = false, className, children, ...props }: React.ComponentProps<"span"> & VariantProps<typeof tag> & { dot?: boolean }) {
  return (
    <span className={cn(tag({ tone }), className)} {...props}>
      {showDot && <span aria-hidden className={cn("size-1.5 rounded-full", dot[tone ?? "neutral"])} />}
      {children}
    </span>
  )
}
