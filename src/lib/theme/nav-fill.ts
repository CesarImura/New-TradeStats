import { contrast } from "./contrast"
import type { CoachTheme, NavFill } from "./types"

/** Brand fills the menu only when its text colour reads on it (AA); a light brand colour offers Tinted instead. */
export const brandMenuReads = (t: Pick<CoachTheme, "primary" | "primaryForeground">) => contrast(t.primaryForeground, t.primary) >= 4.5

/** The menu fill a theme draws: a saved Brand that no longer reads (the brand colour changed) is drawn Tinted. */
export const navFillOf = (t: Pick<CoachTheme, "nav" | "primary" | "primaryForeground">): NavFill => {
  const fill = t.nav.fill ?? "page"
  return fill === "brand" && !brandMenuReads(t) ? "tint" : fill
}
