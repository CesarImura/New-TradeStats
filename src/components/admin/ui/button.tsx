import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Admin / Button (Figma 572:28569). Hierarchy × size, states by CSS.
 * Sizes as in Figma _Base Button: sm 24 (r6, 12px), md 28 (12px), lg 32 (13px), xl 36 (13px, default). `iconOnly` makes it square.
 * Secondary and danger have a 1 px outline that Figma puts outside the size, so they are 2 px taller and wider than the same size without one (38 for xl).
 */
const button = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-a-md t-body-m-medium outline-none select-none transition-colors duration-300 ease-out focus-visible:ring-2 focus-visible:ring-a-border-focus pointer-coarse:min-h-10 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      hierarchy: {
        primary: "bg-[var(--admin-component-button-primary-bg-default)] text-[var(--admin-component-button-primary-content)] hover:bg-[var(--admin-component-button-primary-bg-hover)]",
        secondary: "text-a-text shadow-[inset_0_0_0_1px_var(--admin-component-button-secondary-border)] hover:bg-a-hover",
        ghost: "text-a-text-2 hover:bg-a-hover hover:text-a-text",
        danger: "text-a-danger shadow-[inset_0_0_0_1px_var(--admin-component-button-danger-border)] hover:bg-a-danger-soft",
        highlight: "bg-[var(--admin-component-button-highlight-bg-default)] text-[var(--admin-component-button-highlight-content)] hover:bg-[var(--admin-component-button-highlight-bg-hover)]",
      },
      size: {
        sm: "h-6 px-2 rounded-a-sm t-caption-medium",
        md: "h-7 px-2.5 t-caption-medium",
        lg: "h-8 px-3",
        xl: "h-9 px-3.5",
      },
      iconOnly: { true: "px-0 pointer-coarse:min-w-10", false: "" },
    },
    compoundVariants: [
      { iconOnly: true, size: "sm", class: "w-6" },
      { iconOnly: true, size: "md", class: "w-7" },
      { iconOnly: true, size: "lg", class: "w-8" },
      { iconOnly: true, size: "xl", class: "w-9" },
      ...(["secondary", "danger"] as const).flatMap((hierarchy) => [
        { hierarchy, size: "sm" as const, class: "h-[26px] px-[9px]" },
        { hierarchy, size: "md" as const, class: "h-[30px] px-[11px]" },
        { hierarchy, size: "lg" as const, class: "h-[34px] px-[13px]" },
        { hierarchy, size: "xl" as const, class: "h-[38px] px-[15px]" },
        { hierarchy, iconOnly: true, size: "sm" as const, class: "h-[26px] w-[26px] px-0" },
        { hierarchy, iconOnly: true, size: "md" as const, class: "h-[30px] w-[30px] px-0" },
        { hierarchy, iconOnly: true, size: "lg" as const, class: "h-[34px] w-[34px] px-0" },
        { hierarchy, iconOnly: true, size: "xl" as const, class: "h-[38px] w-[38px] px-0" },
      ]),
    ],
    defaultVariants: { hierarchy: "primary", size: "xl", iconOnly: false },
  }
)

export type AdminButtonProps = ButtonPrimitive.Props & VariantProps<typeof button>

export function AdminButton({ className, hierarchy, size, iconOnly, ...props }: AdminButtonProps) {
  return <ButtonPrimitive data-slot="admin-button" className={cn(button({ hierarchy, size, iconOnly }), className)} {...props} />
}
export { button as adminButton }
