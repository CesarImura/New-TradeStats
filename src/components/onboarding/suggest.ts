import type { ModuleId } from "@/lib/data/coaches"
import type { Account, Audience } from "@/lib/data/communities"
import type { TemplateId } from "@/lib/theme/types"

export const AUDIENCES: { id: Audience; label: string; text: string }[] = [
  { id: "starting", label: "Just starting", text: "No paying students yet" },
  { id: "small", label: "Under 100", text: "A small group" },
  { id: "growing", label: "100 – 500", text: "Growing" },
  { id: "large", label: "500 or more", text: "An established community" },
]

/** Where the coach runs things today. "Platforms" hold paying members we'd move over. */
export const TOOLS = [
  { id: "discord", label: "Discord" },
  { id: "telegram", label: "Telegram" },
  { id: "whop", label: "Whop", platform: true },
  { id: "skool", label: "Skool", platform: true },
  { id: "kajabi", label: "Kajabi or Teachable", platform: true },
  { id: "patreon", label: "Patreon", platform: true },
  { id: "youtube", label: "YouTube only" },
  { id: "none", label: "Nothing yet" },
]

export const OFFERS: { id: string; label: string; module?: ModuleId }[] = [
  { id: "courses", label: "Video courses", module: "courses" },
  { id: "live", label: "Live trading sessions", module: "calendar" },
  { id: "charts", label: "Chart analysis", module: "charts" },
  { id: "community", label: "Community chat", module: "community" },
  { id: "journal", label: "Trade reviews", module: "journal" },
  { id: "calls", label: "1:1 coaching calls", module: "calendar" },
  { id: "signals", label: "Signals or alerts" },
]

type Answers = NonNullable<Account["answers"]>

/** Route B (free setup call) for big communities, and for mid-size ones moving off another platform. */
export function routeFor(a: Answers): "B" | "C" {
  const switching = a.tools.some((t) => TOOLS.find((x) => x.id === t)?.platform)
  if (a.audience === "large") return "B"
  if (a.audience === "growing" && switching) return "B"
  return "C"
}

/** Modules the wizard switches on, from what the coach offers. AI is on for everyone. */
export function suggestedModules(a?: Answers): Record<ModuleId, boolean> {
  const on = new Set<ModuleId>(["courses", "ai"])
  for (const o of a?.offers ?? []) {
    const m = OFFERS.find((x) => x.id === o)?.module
    if (m) on.add(m)
  }
  if (!a) ["calendar", "charts", "journal", "community"].forEach((m) => on.add(m as ModuleId))
  // Traders who go live or send signals work on charts.
  if (a?.offers.some((o) => o === "live" || o === "signals")) on.add("charts")
  return { courses: on.has("courses"), calendar: on.has("calendar"), charts: on.has("charts"), community: on.has("community"), journal: on.has("journal"), ranking: false, ai: true }
}

/** A starting template that fits: a trading desk for live/signals, calm for courses and 1:1, social for big groups. */
export function suggestedTemplate(a?: Answers): TemplateId {
  if (!a) return "terminal"
  if (a.offers.includes("live") || a.offers.includes("signals")) return "terminal"
  if (a.audience === "large" || a.offers.includes("community")) return "pulse"
  return "atelier"
}
