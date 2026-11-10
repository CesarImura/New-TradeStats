import { cn } from "@/lib/utils"

/**
 * Admin / Option card (Figma): radius 10, padding 14/16, gap 12, 1px border.
 * Default border, Hover border strong, Active raised fill + accent border, Disabled 40%.
 */
const optionCard =
  "flex w-full items-center gap-3 rounded-a-10 border border-a-border px-4 py-3.5 text-left transition-colors duration-300 ease-out hover:border-a-border-strong data-[active=true]:border-[var(--admin-color-border-active)] data-[active=true]:bg-a-raised disabled:pointer-events-none disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-a-border-focus focus-visible:outline-none"

export function OptionCard({ active, className, ...props }: React.ComponentProps<"button"> & { active?: boolean }) {
  return <button type="button" data-active={active ? "true" : undefined} aria-pressed={active} className={cn(optionCard, className)} {...props} />
}
