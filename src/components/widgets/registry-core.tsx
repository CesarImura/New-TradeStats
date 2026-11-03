import { BookOpen, Download, ChartCandlestick, MessagesSquare, NotebookPen, CalendarDays, Handshake, Sparkles, Trophy, type LucideIcon } from "@/components/icons"
import { type ModuleId } from "@/lib/data/coaches"
import { CORE_H, COLS, coreType } from "@/lib/widgets/layout"
import { corePage } from "./catalog/core"
import type { Setting, WidgetDef } from "./registry"

/** Settings of a page's own tool (its core widget), shown when the coach selects it in Design → Pages. */
const CORE_SETTINGS: Partial<Record<ModuleId, Setting[]>> = {
  courses: [
    {
      key: "columns",
      label: "Courses per row",
      type: "select",
      options: [
        { value: "auto", label: "Fit the page" },
        { value: "2", label: "2" },
        { value: "3", label: "3" },
        { value: "4", label: "4" },
      ],
    },
    {
      key: "card",
      label: "Course cards",
      type: "select",
      options: [
        { value: "cover", label: "Cover on top" },
        { value: "side", label: "Cover beside" },
        { value: "list", label: "List, no cover" },
      ],
    },
    { key: "filters", label: "Filter by area", type: "toggle", defaultOn: true },
    { key: "resume", label: "Pick up where you left off", type: "toggle", defaultOn: true },
  ],
  calendar: [
    {
      key: "view",
      label: "Opens on",
      type: "select",
      options: [
        { value: "week", label: "Week" },
        { value: "month", label: "Month" },
        { value: "list", label: "List" },
      ],
    },
    { key: "book", label: "Book a 1:1 button", type: "toggle", defaultOn: true },
    {
      key: "open",
      label: "An event opens in",
      type: "select",
      options: [
        { value: "tray", label: "A tray from the side" },
        { value: "popover", label: "A popover by the event" },
        { value: "popup", label: "A pop-up in the middle" },
      ],
    },
    {
      key: "style",
      label: "Event blocks",
      type: "select",
      options: [
        { value: "tinted", label: "Tinted" },
        { value: "solid", label: "Solid" },
        { value: "outline", label: "Outline" },
      ],
    },
    {
      key: "colors",
      label: "Colours",
      type: "select",
      options: [
        { value: "shades", label: "Shades of my colour" },
        { value: "multi", label: "A colour per type" },
        { value: "mono", label: "Greys, lives in my colour" },
      ],
    },
  ],
  journal: [
    { key: "equity", label: "Equity chart", type: "toggle", defaultOn: true },
    { key: "weeks", label: "Last 4 weeks", type: "toggle", defaultOn: true },
    { key: "rulesCard", label: "Rules kept, 30 days", type: "toggle", defaultOn: true },
    { key: "setups", label: "By setup", type: "toggle", defaultOn: true },
    { key: "insight", label: "Your week (AI note)", type: "toggle", defaultOn: true },
    { key: "rulesTab", label: "Rules tab", type: "toggle", defaultOn: true },
  ],
  charts: [
    { key: "planTitle", label: "Game plan title", type: "text", placeholder: "Coach's game plan" },
    { key: "levelsTitle", label: "Levels title", type: "text", placeholder: "Levels" },
    { key: "actions", label: "Log a trade and Ask buttons", type: "toggle", defaultOn: true },
    { key: "note", label: "The coach's note", type: "toggle", defaultOn: true },
    { key: "trades", label: "My trades", type: "toggle", defaultOn: true },
  ],
  community: [
    { key: "feedTitle", label: "Feed title", type: "text", placeholder: "From the coach" },
    { key: "spaces", label: "Space filters", type: "toggle", defaultOn: true },
    { key: "rules", label: "Community rules", type: "toggle", defaultOn: true },
  ],
  ranking: [
    { key: "boardTitle", label: "Leaderboard title", type: "text", placeholder: "Leaderboard" },
    { key: "competition", label: "Running competition", type: "toggle", defaultOn: true },
    { key: "level", label: "Your level", type: "toggle", defaultOn: true },
    { key: "badges", label: "Badges", type: "toggle", defaultOn: true },
  ],
  ai: [
    { key: "intro", label: "Line above the title", type: "text", placeholder: "Answers from the coach's lessons" },
    { key: "welcome", label: "Welcome headline", type: "text", placeholder: "Ask anything about trading the coach's way" },
    { key: "welcomeText", label: "Welcome text", type: "textarea", placeholder: "Answers come from the lessons…" },
    { key: "placeholder", label: "Question field hint", type: "text", placeholder: "Ask…" },
  ],
  downloads: [
    { key: "whatsNew", label: "Show what's new", type: "toggle", defaultOn: true },
    { key: "search", label: "Search box", type: "toggle", defaultOn: true },
  ],
  partners: [{ key: "affiliate", label: "Show the student's affiliate link", type: "toggle", defaultOn: true }],
}

const CORE: { page: ModuleId; name: string; description: string; icon: LucideIcon }[] = [
  { page: "courses", name: "Courses", description: "The course catalogue and lessons", icon: BookOpen },
  { page: "calendar", name: "Calendar", description: "Lives, events and booking", icon: CalendarDays },
  { page: "charts", name: "Chart", description: "The chart with the coach's view", icon: ChartCandlestick },
  { page: "community", name: "Community feed", description: "The coach's posts and announcements", icon: MessagesSquare },
  { page: "journal", name: "Journal", description: "Trades, stats and feedback", icon: NotebookPen },
  { page: "ranking", name: "Leaderboard", description: "The ranking and its rules", icon: Trophy },
  { page: "ai", name: "AI chat", description: "Questions to the AI coach", icon: Sparkles },
  { page: "downloads", name: "Downloads", description: "Indicators, templates and files to download", icon: Download },
  { page: "partners", name: "Partner offers", description: "Offers from brokers, prop firms and tools, and the affiliate link", icon: Handshake },
]

export const CORE_WIDGETS: WidgetDef[] = CORE.map((c) => ({
  type: coreType(c.page),
  name: c.name,
  description: c.description,
  group: "Page",
  icon: c.icon,
  core: c.page,
  variants: [{ value: "page", label: "Full page", h: CORE_H, minH: 6, maxH: CORE_H, minW: 6, maxW: COLS }],
  settings: CORE_SETTINGS[c.page],
  defaultW: COLS,
  minW: 6,
  Component: corePage(c.page),
}))
