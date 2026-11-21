/** Spaces (topics) and rules for a coach's community. Posts belong to one space. */
export type Space = { id: string; name: string; text: string; /** Who sees it: a tier id, or everyone when empty. */ audience?: string; posts?: number }

export const DEFAULT_SPACES: Space[] = [
  { id: "news", name: "general", text: "Talk about anything trading", posts: 1240 },
  { id: "ideas", name: "trade-ideas", text: "Share setups before the open", posts: 486 },
  { id: "desk", name: "desk-only", text: "Daily plans for the desk", audience: "desk", posts: 212 },
  { id: "wins", name: "wins-and-lessons", text: "Post your best and worst trade", posts: 98 },
]

export const DEFAULT_RULES: string[] = [
  "No signals or copy-trading calls",
  "Be kind; critique the trade, not the person",
  "No promotion of other groups",
]
