"use client"

import { createContext, useContext } from "react"

/**
 * The id of the visible label a setting row draws beside its control. Base UI's Switch and Checkbox are a
 * `span role=switch|checkbox`, so a <label> or a text beside them doesn't name them for screen readers; the
 * row hands its label id down and the control uses it as `aria-labelledby` unless it has its own name.
 */
export const ControlLabel = createContext<string | undefined>(undefined)

/** `aria-labelledby` for a control inside a labelled row, when the caller gave it no name of its own. */
export function useControlLabel(props: { "aria-label"?: string; "aria-labelledby"?: string }) {
  const id = useContext(ControlLabel)
  return props["aria-label"] || props["aria-labelledby"] ? props["aria-labelledby"] : id
}
