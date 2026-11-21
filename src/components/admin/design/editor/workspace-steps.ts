import { createContext } from "react"
import type { DataMode } from "@/components/widgets/parts/shared"
import { type PickTarget } from "@/lib/design-pick"

/** Design's sections, in the order a coach goes through them; the theme ones are the library's theme editor's. */
export type Step = "brand" | "look" | "layout" | "type" | "shape" | "widgets" | "page" | "menu" | "pages" | "course" | "join"
export const STEP_IDS: Step[] = ["brand", "look", "layout", "type", "shape", "widgets", "page", "menu", "pages", "course", "join"]

/** Where a part clicked in the preview is set. */
export const STEP_OF: Record<string, Step> = {
  logo: "brand",
  highlight: "brand",
  nav: "layout",
  buttons: "widgets",
  headings: "type",
  labels: "type",
  cards: "widgets",
  "brand-surface": "brand",
  background: "page",
}
/** The settings to flash after a click. */
export const FLASH: Partial<Record<PickTarget, string[]>> = {
  buttons: ["corners", "buttons"],
  headings: ["fonts", "heading-weight"],
  labels: ["labels"],
  cards: ["widget-set"],
  "brand-surface": ["primary"],
  background: ["background"],
  highlight: ["highlight"],
  logo: ["logo", "name"],
  nav: ["nav-layout"],
}

/** What the widget panel's style changes reach: the selected widget, or every widget. Place, size and content are always one widget's. */
export type Scope = "one" | "all"

/** Sections that now live in Pages, as All widgets (every widget's style, Shape's settings included): old links and clicks open it there. */
export const IN_PAGES = (s: string) => s === "widgets" || s === "shape"
/** Who the canvas and the preview show the platform to (the Preview popover). */
export const PREVIEW_AS: { value: DataMode; label: string; hint: string }[] = [
  { value: "sample", label: "Sample", hint: "Sample data" },
  { value: "empty", label: "New", hint: "A new student: their first week" },
  { value: "inactive", label: "Inactive", hint: "An inactive student" },
  { value: "finished", label: "Finished", hint: "A student who finished a course" },
]

export const StepCtx = createContext<{ go: (s: Step) => void }>({ go: () => {} })
