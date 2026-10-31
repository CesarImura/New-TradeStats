"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "@/components/icons"
import { cn } from "@/lib/utils"

/**
 * The app's own dropdown (Base UI Select), in place of the system's native list: it opens in the theme's colours,
 * with the keyboard (arrows, Enter, type to jump) and screen readers working. For a plain list of choices use
 * `SelectField`; the parts below are for anything richer.
 */
const Select = SelectPrimitive.Root

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return <SelectPrimitive.Group data-slot="select-group" className={cn("scroll-my-1 p-1", className)} {...props} />
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return <SelectPrimitive.Value data-slot="select-value" className={cn("flex min-w-0 flex-1 truncate text-left", className)} {...props} />
}

function SelectTrigger({ className, size = "default", children, ...props }: SelectPrimitive.Trigger.Props & { size?: "xs" | "sm" | "default" }) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        // The chevron keeps 8px from the edge at every size: room on the right is part of the trigger, not of each caller.
        "flex w-fit min-w-0 cursor-pointer items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none",
        "hover:bg-[color-mix(in_oklab,var(--foreground)_4%,transparent)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-popup-open:border-ring",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground dark:bg-input/30 dark:hover:bg-input/50",
        "data-[size=default]:h-9 data-[size=sm]:h-8 data-[size=xs]:h-7 data-[size=xs]:rounded-[4px] data-[size=xs]:pl-2 data-[size=xs]:text-xs",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon render={<ChevronDownIcon className="size-3.5 text-muted-foreground transition-transform duration-150 in-data-popup-open:rotate-180" />} />
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "start",
  alignOffset = 0,
  alignItemWithTrigger = false,
  ...props
}: SelectPrimitive.Popup.Props & Pick<SelectPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger">) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner side={side} sideOffset={sideOffset} align={align} alignOffset={alignOffset} alignItemWithTrigger={alignItemWithTrigger} className="isolate z-50">
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={cn(
            "relative isolate z-50 max-h-[min(var(--available-height),20rem)] min-w-(--anchor-width) origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10",
            "duration-150 ease-out data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List className="p-1">{children}</SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({ className, ...props }: SelectPrimitive.GroupLabel.Props) {
  return <SelectPrimitive.GroupLabel data-slot="select-label" className={cn("px-2 py-1 text-xs text-muted-foreground", className)} {...props} />
}

function SelectItem({ className, children, ...props }: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-pointer items-center gap-1.5 rounded-md py-1.5 pr-8 pl-2 text-sm outline-hidden select-none",
        "data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator render={<span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />}>
        <CheckIcon className="size-3.5" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({ className, ...props }: SelectPrimitive.Separator.Props) {
  return <SelectPrimitive.Separator data-slot="select-separator" className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)} {...props} />
}

function SelectScrollUpButton({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow data-slot="select-scroll-up-button" className={cn("top-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1", className)} {...props}>
      <ChevronUpIcon className="size-3.5" />
    </SelectPrimitive.ScrollUpArrow>
  )
}

function SelectScrollDownButton({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow data-slot="select-scroll-down-button" className={cn("bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1", className)} {...props}>
      <ChevronDownIcon className="size-3.5" />
    </SelectPrimitive.ScrollDownArrow>
  )
}

export type SelectOption = { value: string; label: React.ReactNode; disabled?: boolean }

/**
 * A plain list of choices, the drop-in for a native <select>: string values in, string values out. The trigger
 * shows the chosen option's label; `className` goes on the trigger.
 */
function SelectField({
  value,
  onValueChange,
  options,
  size = "sm",
  placeholder,
  className,
  contentClassName,
  disabled,
  id,
  title,
  "aria-label": ariaLabel,
}: {
  value: string
  onValueChange: (value: string) => void
  options: readonly SelectOption[]
  size?: "xs" | "sm" | "default"
  placeholder?: React.ReactNode
  className?: string
  contentClassName?: string
  disabled?: boolean
  id?: string
  title?: string
  "aria-label"?: string
}) {
  return (
    <Select items={options} value={value} onValueChange={(v) => v != null && onValueChange(String(v))} disabled={disabled}>
      <SelectTrigger id={id} size={size} title={title} aria-label={ariaLabel} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

type OptionProps = { value?: string | number; children?: React.ReactNode; disabled?: boolean }

/**
 * The same dropdown with a native <select>'s API, so a <select> becomes `<SelectOptions>` with its <option>s,
 * `value`/`defaultValue` and `onChange={(e) => e.target.value}` as they were. Without a value it starts on the
 * first option, like the native one. `className` goes on the trigger.
 */
function SelectOptions({
  value,
  defaultValue,
  onChange,
  children,
  size = "sm",
  className,
  disabled,
  id,
  title,
  "aria-label": ariaLabel,
}: {
  value?: string | number
  defaultValue?: string | number
  onChange?: (e: { target: { value: string } }) => void
  children?: React.ReactNode
  size?: "xs" | "sm" | "default"
  className?: string
  disabled?: boolean
  id?: string
  title?: string
  "aria-label"?: string
}) {
  const options: SelectOption[] = React.Children.toArray(children).flatMap((c) => {
    if (!React.isValidElement<OptionProps>(c) || c.type !== "option") return []
    const { value: v, children: label, disabled: off } = c.props
    return [{ value: String(v ?? React.Children.toArray(label).join("")), label, disabled: off }]
  })
  const controlled = value !== undefined
  return (
    <Select
      items={options}
      {...(controlled ? { value: String(value) } : { defaultValue: String(defaultValue ?? options[0]?.value ?? "") })}
      onValueChange={(v) => v != null && onChange?.({ target: { value: String(v) } })}
      disabled={disabled}
    >
      <SelectTrigger id={id} size={size} title={title} aria-label={ariaLabel} className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export { Select, SelectContent, SelectField, SelectOptions, SelectGroup, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue }
