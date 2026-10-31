"use client"

import * as React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

export { SelectField, SelectOptions }
