import type { Setting, WidgetDef } from "@/components/lab/reui-widgets/registry"

/**
 * Amounts of content to try a widget with (prototype only), in the stress
 * bench and the builder: its sample, nothing yet, the least a coach could
 * type, or far too much.
 */
export type Content = "sample" | "empty" | "short" | "long"
export const CONTENTS: Content[] = ["sample", "empty", "short", "long"]

const LONG_LINE = "Risk management before entries: the complete pre-market routine for volatile sessions"
const LONG_TEXT = "Before every session, write down the levels you care about, the news that could move them and the one setup you will take. If the market does something else, you sit on your hands. Keep it boring, keep it written down, and review it every Friday with the group so the habit sticks for good."
const LONG_WORD = "Supercalifragilisticexpialidocious-risk-management"

/** Settings filled for a content level: long titles, a paragraph, many list lines; or one word each. */
export function propsFor(def: WidgetDef, content: Content): Record<string, string | boolean> {
  if (content === "sample" || content === "empty") return {}
  const out: Record<string, string | boolean> = {}
  for (const s of def.settings ?? []) out[s.key] = valueFor(s, content)
  return out
}

function valueFor(s: Setting, content: "short" | "long"): string | boolean {
  if (s.type === "toggle") return content === "long"
  if (s.type === "select") return s.options[0]?.value ?? ""
  if (s.type === "image") return ""
  if (s.key === "url") return content === "long" ? "https://www.example-trading-academy.com/very/long/path/to/a/resource?ref=widget" : "https://x.co"
  if (s.key === "date") return "2026-11-01 09:00"
  if (s.key === "items") {
    if (content === "short") return "Rules | Read them"
    return Array.from({ length: 12 }, (_, i) => `${i % 3 === 0 ? LONG_WORD : LONG_LINE} ${i + 1} | ${i % 2 ? LONG_TEXT : "https://example.com/" + "a".repeat(40)}`).join("\n")
  }
  if (s.type === "textarea") return content === "long" ? LONG_TEXT : "Hi"
  return content === "long" ? (s.key === "button" ? "Reserve my place in the next live cohort" : LONG_LINE) : "Go"
}

