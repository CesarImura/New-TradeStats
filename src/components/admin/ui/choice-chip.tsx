import { cn } from "@/lib/utils"

/**
 * Admin / Time slot and Day chip (Figma): field fill, 1px border, radius 8. Hover = focus border.
 * `soft` (Time slot) turns accent-soft + active border when on; `solid` (Day chip) turns the accent fill with on-accent text.
 */
export function ChoiceChip({ on, tone = "soft", className, ...props }: React.ComponentProps<"button"> & { on?: boolean; tone?: "soft" | "solid" }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      className={cn(
        "inline-flex min-h-9 items-center justify-center rounded-a-md border px-3 t-body-m text-a-text outline-none transition-colors duration-300 ease-out disabled:pointer-events-none disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-a-border-focus",
        on
          ? tone === "solid"
            ? "border-a-accent bg-a-accent text-a-on-accent"
            : "border-[var(--admin-color-border-active)] bg-a-accent-soft"
          : "border-a-border bg-a-field hover:border-a-border-focus",
        className
      )}
      {...props}
    />
  )
}
