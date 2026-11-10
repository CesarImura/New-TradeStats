import { cn } from "@/lib/utils"

/**
 * Admin / Dropzone (Figma): dashed 4/4, radius 10, padding 28/16, gap 6. Hover (and an active drag) = hover fill + accent border.
 * Filled turns the dashes into a solid, borderless area, so show the file item instead.
 */
export function Dropzone({ over, className, ...props }: React.ComponentProps<"button"> & { over?: boolean }) {
  return (
    <button
      type="button"
      data-over={over ? "true" : undefined}
      className={cn(
        "flex w-full flex-col items-center gap-1.5 rounded-a-10 border border-dashed border-a-border-strong px-4 py-7 text-center transition-colors duration-300 ease-out hover:border-[var(--admin-color-border-active)] hover:bg-a-hover data-[over=true]:border-[var(--admin-color-border-active)] data-[over=true]:bg-a-hover disabled:pointer-events-none disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-a-border-focus focus-visible:outline-none",
        className
      )}
      {...props}
    />
  )
}
