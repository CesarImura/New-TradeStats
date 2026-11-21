import type { ModuleId } from "@/lib/data/coaches"
import type { Account } from "@/lib/data/communities"

/** Where the coach runs things today. "Platforms" hold paying members we'd move over. */
export const TOOLS: { id: string; label: string; platform?: boolean; ask?: boolean }[] = [
  { id: "discord", label: "Discord", ask: true },
  { id: "kajabi", label: "Kajabi", platform: true, ask: true },
  { id: "whop", label: "Whop", platform: true, ask: true },
  { id: "none", label: "Nothing", ask: true },
  { id: "telegram", label: "Telegram" },
  { id: "skool", label: "Skool", platform: true },
  { id: "patreon", label: "Patreon", platform: true },
  { id: "youtube", label: "YouTube only" },
]

export const OFFERS: { id: string; label: string; module?: ModuleId; ask?: boolean }[] = [
  { id: "courses", label: "Courses", module: "courses", ask: true },
  { id: "live", label: "Live trading", module: "calendar", ask: true },
  { id: "calls", label: "1:1 coaching", module: "calendar", ask: true },
  { id: "signals", label: "Signals", ask: true },
  { id: "charts", label: "Chart analysis", module: "charts" },
  { id: "community", label: "Community chat", module: "community" },
  { id: "journal", label: "Trade reviews", module: "journal" },
]

type Answers = NonNullable<Account["answers"]>

/** Modules the wizard switches on, from what the coach offers. AI is on for everyone. */
export function suggestedModules(a?: Answers): Record<ModuleId, boolean> {
  // The three questions don't ask about these, so they start on for everyone.
  const on = new Set<ModuleId>(["courses", "ai", "community", "journal"])
  for (const o of a?.offers ?? []) {
    const m = OFFERS.find((x) => x.id === o)?.module
    if (m) on.add(m)
  }
  if (!a) ["calendar", "charts", "journal", "community"].forEach((m) => on.add(m as ModuleId))
  // Traders who go live or send signals work on charts.
  if (a?.offers.some((o) => o === "live" || o === "signals")) on.add("charts")
  return { courses: on.has("courses"), calendar: on.has("calendar"), charts: on.has("charts"), community: on.has("community"), journal: on.has("journal"), ranking: false, ai: true, downloads: true, partners: a?.audience === "growing" || a?.audience === "large" }
}
