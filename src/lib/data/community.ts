/** Spaces (topics) and rules for a coach's community. Posts belong to one space. */
export type Space = { id: string; name: string; text: string }

export const DEFAULT_SPACES: Space[] = [
  { id: "news", name: "Announcements", text: "What's new and what's coming" },
  { id: "ideas", name: "Trade ideas", text: "Setups and levels for the week" },
  { id: "wins", name: "Wins and lessons", text: "What worked and what did not" },
]

export const DEFAULT_RULES: string[] = [
  "Be respectful. We all started somewhere.",
  "No signals or financial advice. Share your reasoning, not a tip.",
  "No promotion or links to other services.",
]
