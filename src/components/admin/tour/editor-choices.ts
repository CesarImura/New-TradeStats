import type { Overrides } from "@/lib/prototype-store"

/** What the coach picked in the onboarding's Design steps, read from the saved draft (Figma "Design · 01 Brand, 02 Look, 03 Layout"). */
export type EditorChoice = {
  /** The tab of the design editor the tour opens on: where the coach last made a choice. */
  step: "brand" | "theme" | "layout"
  /** "Terminal, dark": the look picked; undefined when nothing was picked. */
  look?: string
}

const TEMPLATE_NAME: Record<string, string> = { terminal: "Terminal", atelier: "Atelier", pulse: "Pulse" }

/**
 * The editor tour follows what was chosen in the onboarding (Gustavo, 18/11): it opens on the tab of the last choice and
 * says which look was picked. Without a saved choice (a fresh draft, a skipped Design step) it keeps the old start: Theme.
 */
export function editorChoice(draft: Overrides | null | undefined): EditorChoice {
  const theme = draft?.theme
  const template = theme?.template
  const look = template ? `${TEMPLATE_NAME[template] ?? template}${theme?.mode ? `, ${theme.mode}` : ""}` : undefined
  if (theme?.nav?.layout || theme?.trading?.profit) return { step: "layout", look }
  if (template || theme?.mode) return { step: "theme", look }
  if (theme?.primary || draft?.content?.name) return { step: "brand" }
  return { step: "theme" }
}
