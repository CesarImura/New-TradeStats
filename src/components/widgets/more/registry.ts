import { BarChart3, Eye, FileSpreadsheet, Flag, Flame, LayoutGrid, LineChart, NotebookPen, Sigma, Trophy, Wallet } from "@/components/icons"
import type { WidgetDef } from "@/components/widgets/registry"
import { Goals, SessionCheckIn, TradingStreak, Watchlist } from "./habits"
import { Leaderboard } from "./leaderboard"
import { OpenPositions, PnlByInstrument, PnlByWeekday, RDistribution, RecentTrades, WinRateTrend } from "./trading"

/**
 * Widgets added in the library, in the same shape as the main registry. They
 * are part of WIDGETS (registry.tsx), so the library, the admin builder and
 * the student pages all offer them. Listed in the order they were added,
 * newest last.
 */
export const NEW_WIDGETS: WidgetDef[] = [
  {
    type: "recent-trades",
    name: "Recent trades",
    description: "The latest trades in a table: sort by time, R or P&L, page through",
    group: "Journal",
    icon: FileSpreadsheet,
    variants: [
      { value: "table", label: "Table", h: 5, minH: 4, maxH: 6, minW: 4, maxW: 12 },
      { value: "list", label: "List", h: 5, minH: 4, maxH: 6, minW: 4, maxW: 12, hd: { compact: 4 } },
    ],
    defaultW: 6,
    minW: 4,
    Component: RecentTrades,
  },
  {
    type: "open-positions",
    name: "Open positions",
    description: "Trades still open, with their P&L moving live",
    group: "Journal",
    icon: Wallet,
    variants: [
      { value: "table", label: "Table", h: 4, minH: 3, maxH: 5, minW: 4, maxW: 12, hd: { detailed: 4 } },
      { value: "cards", label: "Cards", h: 4, minH: 3, maxH: 4, minW: 4, maxW: 12 },
    ],
    defaultW: 6,
    minW: 4,
    Component: OpenPositions,
  },
  {
    type: "r-distribution",
    name: "R distribution",
    description: "How trade results spread in R multiples",
    group: "Journal",
    icon: BarChart3,
    variants: [
      { value: "histogram", label: "Histogram", h: 4, minH: 3, maxH: 5, minW: 4, maxW: 12 },
      { value: "summary", label: "Summary", h: 3, minH: 3, maxH: 3, minW: 4, maxW: 8, hd: { detailed: 3 } },
    ],
    defaultW: 4,
    minW: 4,
    Component: RDistribution,
  },
  {
    type: "pnl-by-instrument",
    name: "P&L by instrument",
    description: "Which markets make and lose money",
    group: "Journal",
    icon: LayoutGrid,
    variants: [
      { value: "bars", label: "Bars", h: 4, minH: 3, maxH: 5, minW: 4, maxW: 12, hd: { detailed: 4 } },
      { value: "table", label: "Table", h: 4, minH: 3, maxH: 4, minW: 4, maxW: 12, hd: { detailed: 4 } },
    ],
    defaultW: 4,
    minW: 4,
    Component: PnlByInstrument,
  },
  {
    type: "pnl-by-weekday",
    name: "P&L by weekday",
    description: "Which days of the week work best",
    group: "Journal",
    icon: Sigma,
    variants: [
      { value: "bars", label: "Bars", h: 4, minH: 3, maxH: 5, minW: 4, maxW: 12, hd: { compact: 3, detailed: 4 } },
      { value: "heatmap", label: "Heatmap", h: 4, minH: 3, maxH: 5, minW: 4, maxW: 6 },
    ],
    defaultW: 4,
    minW: 4,
    Component: PnlByWeekday,
  },
  {
    type: "win-rate-trend",
    name: "Win rate trend",
    description: "The share of winning trades over time",
    group: "Journal",
    icon: LineChart,
    variants: [
      { value: "trend", label: "Trend", h: 4, minH: 3, maxH: 4, minW: 4, maxW: 12 },
      { value: "compare", label: "You and the group", h: 4, minH: 3, maxH: 5, minW: 4, maxW: 12 },
    ],
    defaultW: 4,
    minW: 4,
    Component: WinRateTrend,
  },
  {
    type: "watchlist",
    name: "Watchlist",
    description: "The markets the student follows, with price and change",
    group: "Calendar",
    icon: Eye,
    variants: [
      { value: "list", label: "List", h: 5, minH: 4, maxH: 6, minW: 4, maxW: 12, hd: { compact: 4, detailed: 6 } },
      { value: "tiles", label: "Tiles", h: 5, minH: 4, wide: { from: 6, maxH: 4 }, maxH: 5, minW: 4, maxW: 12 },
    ],
    defaultW: 4,
    minW: 4,
    Component: Watchlist,
  },
  {
    type: "goals",
    name: "Goals",
    description: "This month's goals and how close each one is",
    group: "Progress",
    icon: Flag,
    variants: [
      { value: "list", label: "List", h: 4, minH: 3, maxH: 5, minW: 4, maxW: 12 },
      { value: "rings", label: "Rings", h: 3, minH: 3, maxH: 4, minW: 4, maxW: 12, hd: { detailed: 3 } },
    ],
    defaultW: 4,
    minW: 4,
    Component: Goals,
  },
  {
    type: "trading-streak",
    name: "Trading streak",
    description: "Days in a row with every rule kept, on a month calendar",
    group: "Progress",
    icon: Flame,
    variants: [
      { value: "month", label: "Month", h: 5, minH: 4, maxH: 6, minW: 4, maxW: 6 },
      { value: "streak", label: "Streak", h: 3, minH: 2, maxH: 3, minW: 4, maxW: 8, hd: { detailed: 3 } },
    ],
    defaultW: 4,
    minW: 4,
    Component: TradingStreak,
  },
  {
    type: "check-in",
    name: "Session check-in",
    description: "Mood and sleep before trading, with a nudge when it's a bad day",
    group: "Journal",
    icon: NotebookPen,
    variants: [
      { value: "mood", label: "Mood", h: 4, minH: 3, maxH: 5, minW: 4, maxW: 12, hd: { compact: 3, detailed: 4 } },
      { value: "notes", label: "With a plan", h: 6, minH: 5, maxH: 6, minW: 4, maxW: 12, hd: { detailed: 6 } },
    ],
    defaultW: 4,
    minW: 4,
    Component: SessionCheckIn,
  },
]

NEW_WIDGETS.push({
  type: "leaderboard",
  name: "Leaderboard",
  description: "The group's ranking as a table, sortable, with your own row marked",
  group: "Progress",
  icon: Trophy,
  variants: [
    { value: "table", label: "Table", h: 6, minH: 5, maxH: 7, minW: 4, maxW: 12, hd: { compact: 5, detailed: 6 } },
    { value: "compact", label: "Top and you", h: 5, minH: 4, maxH: 6, minW: 4, maxW: 12, hd: { detailed: 5 } },
  ],
  defaultW: 6,
  minW: 4,
  Component: Leaderboard,
})

export const NEW_TYPES = new Set(NEW_WIDGETS.map((w) => w.type))

/** A few words per widget for the grid and the search. */
export const WIDGET_TAGS: Record<string, string[]> = {
  "recent-trades": ["table", "interactive"],
  "open-positions": ["table", "live"],
  "r-distribution": ["chart"],
  "pnl-by-instrument": ["chart", "table"],
  "pnl-by-weekday": ["chart"],
  "win-rate-trend": ["chart", "interactive"],
  watchlist: ["table", "chart"],
  goals: ["progress"],
  "trading-streak": ["calendar"],
  "check-in": ["form", "interactive"],
  leaderboard: ["table", "interactive"],
  "journal-pnl": ["chart", "interactive"],
  "rules-followed": ["chart", "interactive"],
  "next-live": ["calendar", "interactive"],
  "econ-news": ["calendar"],
  "my-rank": ["chart", "table"],
  drawdown: ["chart"],
  faq: ["interactive"],
  "book-call": ["interactive"],
  countdown: ["live"],
}
