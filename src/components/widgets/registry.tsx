import { BookOpen, ChartCandlestick, MessagesSquare, NotebookPen, CalendarDays, CircleCheck, Gauge, GraduationCap, Handshake, Image as ImageIcon, LineChart, Megaphone, MessageSquareText, Newspaper, PlayCircle, Radio, Sparkles, Trophy, Type, Video, BadgeCheck, CalendarClock, MessageSquareReply, ShieldAlert, type LucideIcon } from "@/components/icons"
import type { ModuleId } from "@/lib/data/coaches"
import { CORE_H, COLS, coreType, type PageId } from "@/lib/widgets/layout"
import { corePage } from "./core"
import { PageHeader } from "./page"
import { AiAsk, Banner, PartnerLinks, TextBlock, WelcomeVideo } from "./brand"
import { EconNews, NextLive } from "./calendar"
import { Announcement, Discord } from "./community"
import { JournalPnl, RulesFollowed } from "./journal"
import { ContinueLesson, CourseProgress } from "./learning"
import { FirstWeek, MyRank } from "./progress"
import { BookCall, CoachFeedback } from "./coaching"
import { CoachProfile, Upgrade } from "./offer"
import type { WidgetProps } from "./shared"
import { Drawdown } from "./trading"

export type WidgetGroup = "Learning" | "Calendar" | "Journal" | "Coaching" | "Progress" | "Community" | "Coach and brand" | "AI" | "Page"

export type Setting =
  | { key: string; label: string; type: "text"; placeholder?: string }
  | { key: string; label: string; type: "textarea"; placeholder?: string }
  | { key: string; label: string; type: "select"; options: { value: string; label: string }[] }
  | { key: string; label: string; type: "toggle"; defaultOn?: boolean }

export type WidgetDef = {
  type: string
  name: string
  description: string
  group: WidgetGroup
  icon: LucideIcon
  /** Only offered, and only shown to students, when this module is on. */
  module?: ModuleId
  /** A page's core widget: always on that page, never in the library, can't be removed or duplicated. */
  core?: ModuleId
  /** Three or more designs per widget; the first is the default. Each needs its own height in rows. */
  variants: { value: string; label: string; h: number; minH: number }[]
  settings?: Setting[]
  /** Width in columns when added, and the narrowest it can go before its content breaks. */
  defaultW: number
  minW: number
  Component: (p: WidgetProps) => React.ReactNode
}

const COURSE_OPTIONS = [
  { value: "foundations", label: "Foundations" },
  { value: "playbook", label: "Price action playbook" },
]

export const WIDGETS: WidgetDef[] = [
  {
    type: "page-header",
    name: "Page title",
    description: "The page's title, with a small label and an intro",
    group: "Page",
    icon: Type,
    variants: [
      { value: "plain", label: "Plain", h: 2, minH: 1 },
      { value: "centered", label: "Centred", h: 2, minH: 1 },
      { value: "banner", label: "Banner", h: 3, minH: 2 },
    ],
    settings: [
      { key: "title", label: "Title", type: "text", placeholder: "The page's name" },
      { key: "eyebrow", label: "Small label", type: "text" },
      { key: "text", label: "Intro", type: "textarea", placeholder: "One or two sentences for your students" },
    ],
    defaultW: 12,
    minW: 4,
    Component: PageHeader,
  },
  {
    type: "continue-lesson",
    name: "Continue lesson",
    description: "The next lesson to watch, with progress",
    group: "Learning",
    icon: PlayCircle,
    module: "courses",
    variants: [
      { value: "progress", label: "Next lesson", h: 3, minH: 3 },
      { value: "cover", label: "Cover", h: 3, minH: 3 },
      { value: "card", label: "One line", h: 2, minH: 2 },
      { value: "media", label: "Media", h: 4, minH: 3 },
    ],
    settings: [
      { key: "title", label: "Small label", type: "text", placeholder: "Start here" },
      { key: "course", label: "Course", type: "select", options: COURSE_OPTIONS },
    ],
    defaultW: 8,
    minW: 4,
    Component: ContinueLesson,
  },
  {
    type: "course-progress",
    name: "Courses",
    description: "All courses with progress, locked ones show the tier, and what unlocks next",
    group: "Learning",
    icon: GraduationCap,
    module: "courses",
    variants: [
      { value: "rings", label: "Rings", h: 3, minH: 3 },
      { value: "bars", label: "List", h: 4, minH: 3 },
      { value: "unlocks", label: "Next unlock", h: 4, minH: 3 },
    ],
    defaultW: 8,
    minW: 4,
    Component: CourseProgress,
  },
  {
    type: "next-live",
    name: "Up next",
    description: "The next live, call or workshop, today on a timeline, or the week ahead",
    group: "Calendar",
    icon: Radio,
    module: "calendar",
    variants: [
      { value: "countdown", label: "Countdown", h: 5, minH: 3 },
      { value: "timeline", label: "Today", h: 4, minH: 3 },
      { value: "week", label: "Week", h: 4, minH: 3 },
      { value: "split", label: "Split", h: 3, minH: 3 },
    ],
    settings: [{ key: "news", label: "Include market news", type: "toggle", defaultOn: true }],
    defaultW: 4,
    minW: 3,
    Component: NextLive,
  },
  {
    type: "econ-news",
    name: "Market calendar",
    description: "Rate decisions, CPI, NFP, your no-trade marks and which market sessions are open",
    group: "Calendar",
    icon: Newspaper,
    module: "calendar",
    variants: [
      { value: "next", label: "Next big one", h: 4, minH: 3 },
      { value: "week", label: "This week", h: 4, minH: 3 },
      { value: "sessions", label: "Sessions", h: 4, minH: 3 },
      { value: "timeline", label: "Timeline", h: 5, minH: 3 },
    ],
    defaultW: 4,
    minW: 3,
    Component: EconNews,
  },
  {
    type: "journal-pnl",
    name: "Performance",
    description: "The student's results from their journal: P&L, equity curve and edge",
    group: "Journal",
    icon: LineChart,
    module: "journal",
    variants: [
      { value: "curve", label: "Equity curve", h: 5, minH: 3 },
      { value: "bars", label: "Daily P&L", h: 4, minH: 3 },
      { value: "heatmap", label: "Calendar", h: 4, minH: 3 },
      { value: "hero", label: "Hero", h: 4, minH: 3 },
      { value: "hours", label: "By hour", h: 4, minH: 3 },
      { value: "compare", label: "Compare", h: 5, minH: 3 },
    ],
    defaultW: 4,
    minW: 3,
    Component: JournalPnl,
  },
  {
    type: "rules-followed",
    name: "Discipline",
    description: "How well the student keeps your rules",
    group: "Journal",
    icon: Gauge,
    module: "journal",
    variants: [
      { value: "radar", label: "Gauge", h: 5, minH: 3 },
      { value: "streak", label: "Clean streak", h: 3, minH: 3 },
      { value: "rules", label: "Rule by rule", h: 4, minH: 3 },
      { value: "hero", label: "Hero", h: 4, minH: 3 },
      { value: "grid", label: "Heatmap", h: 4, minH: 3 },
      { value: "compare", label: "Compare", h: 5, minH: 3 },
    ],
    defaultW: 4,
    minW: 3,
    Component: RulesFollowed,
  },
  {
    type: "first-week",
    name: "First-week checklist",
    description: "Turns a new member into an active one",
    group: "Progress",
    icon: CircleCheck,
    variants: [
      { value: "steps", label: "Steps", h: 2, minH: 2 },
      { value: "ring", label: "Ring", h: 2, minH: 2 },
      { value: "checklist", label: "Checklist", h: 4, minH: 3 },
      { value: "path", label: "Timeline", h: 5, minH: 3 },
    ],
    defaultW: 4,
    minW: 3,
    Component: FirstWeek,
  },
  {
    type: "my-rank",
    name: "Ranking",
    description: "The student's place on your leaderboard",
    group: "Progress",
    icon: Trophy,
    module: "ranking",
    variants: [
      { value: "trend", label: "Trend", h: 4, minH: 3 },
      { value: "podium", label: "Podium", h: 3, minH: 3 },
      { value: "leaderboard", label: "Top list", h: 5, minH: 4 },
      { value: "hero", label: "Hero", h: 4, minH: 3 },
      { value: "compare", label: "Compare", h: 5, minH: 3 },
    ],
    defaultW: 4,
    minW: 3,
    Component: MyRank,
  },
  {
    type: "announcement",
    name: "Latest announcement",
    description: "Your newest announcement",
    group: "Community",
    icon: Megaphone,
    variants: [
      { value: "plain", label: "Headline", h: 3, minH: 2 },
      { value: "post", label: "Post", h: 4, minH: 3 },
      { value: "line", label: "One line", h: 1, minH: 1 },
      { value: "media", label: "Media", h: 4, minH: 3 },
    ],
    defaultW: 4,
    minW: 3,
    Component: Announcement,
  },
  {
    type: "discord",
    name: "Discord",
    description: "Invite to your Discord server",
    group: "Community",
    icon: MessageSquareText,
    module: "community",
    variants: [
      { value: "online", label: "Who's online", h: 3, minH: 3 },
      { value: "card", label: "Channels", h: 4, minH: 3 },
      { value: "banner", label: "One row", h: 2, minH: 1 },
      { value: "heatmap", label: "Heatmap", h: 4, minH: 3 },
    ],
    settings: [{ key: "text", label: "Text", type: "textarea" }],
    defaultW: 4,
    minW: 3,
    Component: Discord,
  },
  {
    type: "welcome-video",
    name: "Welcome video",
    description: "A personal message from you",
    group: "Coach and brand",
    icon: Video,
    variants: [
      { value: "side", label: "Side by side", h: 4, minH: 4 },
      { value: "stacked", label: "Video on top", h: 5, minH: 4 },
      { value: "minimal", label: "Quote", h: 3, minH: 3 },
    ],
    settings: [
      { key: "title", label: "Title", type: "text" },
      { key: "text", label: "Text", type: "textarea" },
    ],
    defaultW: 12,
    minW: 4,
    Component: WelcomeVideo,
  },
  {
    type: "banner",
    name: "Banner",
    description: "A headline with a button, e.g. an offer or launch",
    group: "Coach and brand",
    icon: ImageIcon,
    variants: [
      { value: "headline", label: "Headline", h: 2, minH: 2 },
      { value: "picture", label: "With picture", h: 3, minH: 2 },
      { value: "slim", label: "One line", h: 1, minH: 1 },
    ],
    settings: [
      { key: "eyebrow", label: "Small label", type: "text", placeholder: "Limited places" },
      { key: "title", label: "Headline", type: "text" },
      { key: "text", label: "Text", type: "textarea" },
      { key: "button", label: "Button text", type: "text", placeholder: "Find out more" },
      {
        key: "target",
        label: "Button opens",
        type: "select",
        options: [
          { value: "courses", label: "Courses" },
          { value: "calendar", label: "Calendar" },
          { value: "community", label: "Community" },
          { value: "profile", label: "Upgrade" },
        ],
      },
    ],
    defaultW: 12,
    minW: 4,
    Component: Banner,
  },
  {
    type: "text",
    name: "Text",
    description: "A heading and a paragraph, a quote, or numbered steps",
    group: "Coach and brand",
    icon: Type,
    variants: [
      { value: "plain", label: "Plain", h: 3, minH: 2 },
      { value: "quote", label: "Quote", h: 3, minH: 2 },
      { value: "steps", label: "Steps", h: 3, minH: 2 },
    ],
    settings: [
      { key: "title", label: "Heading", type: "text" },
      { key: "text", label: "Text", type: "textarea" },
    ],
    defaultW: 6,
    minW: 3,
    Component: TextBlock,
  },
  {
    type: "partner-links",
    name: "Partner links",
    description: "Brokers, prop firms and tools you recommend",
    group: "Coach and brand",
    icon: Handshake,
    variants: [
      { value: "list", label: "List", h: 5, minH: 3 },
      { value: "tiles", label: "Logo wall", h: 4, minH: 3 },
      { value: "chips", label: "Chips", h: 1, minH: 1 },
    ],
    defaultW: 4,
    minW: 3,
    Component: PartnerLinks,
  },
  {
    type: "ai-ask",
    name: "Ask the AI",
    description: "A question box for your AI assistant, with one insight from the student's trades",
    group: "AI",
    icon: Sparkles,
    module: "ai",
    variants: [
      { value: "search", label: "Question box", h: 3, minH: 2 },
      { value: "chat", label: "Example chat", h: 5, minH: 4 },
      { value: "insight", label: "Insight from trades", h: 4, minH: 3 },
    ],
    defaultW: 12,
    minW: 4,
    Component: AiAsk,
  },
  {
    type: "book-call",
    name: "Book a 1:1",
    description: "Free times with you, booked in one tap",
    group: "Calendar",
    icon: CalendarClock,
    module: "calendar",
    variants: [
      { value: "slots", label: "Time slots", h: 4, minH: 3 },
      { value: "next", label: "Next free", h: 3, minH: 3 },
      { value: "allowance", label: "Calls left", h: 2, minH: 2 },
      { value: "split", label: "Split", h: 3, minH: 3 },
    ],
    defaultW: 4,
    minW: 3,
    Component: BookCall,
  },
  {
    type: "drawdown",
    name: "Risk limits",
    description: "How close the account is to its loss limits",
    group: "Journal",
    icon: ShieldAlert,
    module: "journal",
    variants: [
      { value: "gauge", label: "Gauge", h: 4, minH: 3 },
      { value: "bars", label: "Daily limit", h: 4, minH: 3 },
      { value: "curve", label: "Balance and floor", h: 4, minH: 3 },
      { value: "hero", label: "Hero", h: 4, minH: 3 },
    ],
    defaultW: 4,
    minW: 3,
    Component: Drawdown,
  },
  {
    type: "coach-feedback",
    name: "Coach feedback",
    description: "Trade reviews waiting and answered",
    group: "Coaching",
    icon: MessageSquareReply,
    module: "journal",
    variants: [
      { value: "queue", label: "Queue", h: 3, minH: 3 },
      { value: "latest", label: "Latest reply", h: 3, minH: 3 },
      { value: "stats", label: "Answered", h: 2, minH: 2 },
      { value: "thread", label: "Timeline", h: 5, minH: 3 },
    ],
    defaultW: 4,
    minW: 3,
    Component: CoachFeedback,
  },
  {
    type: "upgrade",
    name: "Upgrade",
    description: "Their tier next to the next one, shown only when there is one",
    group: "Coach and brand",
    icon: Sparkles,
    variants: [
      { value: "compare", label: "Compare", h: 5, minH: 4 },
      { value: "banner", label: "Banner", h: 2, minH: 2 },
      { value: "card", label: "Price", h: 4, minH: 3 },
      { value: "split", label: "Split", h: 3, minH: 3 },
    ],
    settings: [{ key: "button", label: "Button text", type: "text", placeholder: "Upgrade to …" }],
    defaultW: 6,
    minW: 3,
    Component: Upgrade,
  },
  {
    type: "coach-profile",
    name: "Coach profile",
    description: "Your photo, title, numbers and socials",
    group: "Coach and brand",
    icon: BadgeCheck,
    variants: [
      { value: "card", label: "Card", h: 4, minH: 3 },
      { value: "hero", label: "Large", h: 4, minH: 3 },
      { value: "compact", label: "One row", h: 2, minH: 2 },
      { value: "media", label: "Media", h: 4, minH: 3 },
    ],
    defaultW: 4,
    minW: 3,
    Component: CoachProfile,
  },
]

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
}

const CORE: { page: ModuleId; name: string; description: string; icon: LucideIcon }[] = [
  { page: "courses", name: "Courses", description: "The course catalogue and lessons", icon: BookOpen },
  { page: "calendar", name: "Calendar", description: "Lives, events and booking", icon: CalendarDays },
  { page: "charts", name: "Chart", description: "The chart with the coach's view", icon: ChartCandlestick },
  { page: "community", name: "Community feed", description: "Posts, channels and replies", icon: MessagesSquare },
  { page: "journal", name: "Journal", description: "Trades, stats and feedback", icon: NotebookPen },
  { page: "ranking", name: "Leaderboard", description: "The ranking and its rules", icon: Trophy },
  { page: "ai", name: "AI chat", description: "Questions to the AI coach", icon: Sparkles },
]

for (const c of CORE) {
  WIDGETS.push({
    type: coreType(c.page),
    name: c.name,
    description: c.description,
    group: "Page",
    icon: c.icon,
    core: c.page,
    variants: [{ value: "page", label: "Full page", h: CORE_H, minH: 6 }],
    settings: CORE_SETTINGS[c.page],
    defaultW: COLS,
    minW: 6,
    Component: corePage(c.page),
  })
}

/** Widgets offered first on each module page; Home offers every widget. */
export const PAGE_WIDGETS: Record<ModuleId, string[]> = {
  courses: ["continue-lesson", "course-progress"],
  calendar: ["next-live", "econ-news", "book-call"],
  charts: ["econ-news", "journal-pnl"],
  journal: ["journal-pnl", "rules-followed", "drawdown", "coach-feedback", "ai-ask"],
  community: ["announcement", "discord", "my-rank"],
  ranking: ["my-rank", "first-week"],
  ai: ["ai-ask"],
}
/** Widgets that make sense on any page. */
export const ANYWHERE = ["page-header", "banner", "text", "welcome-video", "announcement", "upgrade", "partner-links", "coach-profile", "book-call"]

/** The library for a page, in sections. Home: by group, as before. */
export function librarySections(page: PageId): { title: string; types: string[] }[] {
  const all = WIDGETS.filter((w) => !w.core)
  if (page === "home") return WIDGET_GROUPS.map((g) => ({ title: g, types: all.filter((w) => w.group === g).map((w) => w.type) }))
  const own = PAGE_WIDGETS[page]
  return [
    { title: "For this page", types: own },
    { title: "Anywhere", types: ANYWHERE.filter((t) => !own.includes(t)) },
  ]
}

export const WIDGET_GROUPS: WidgetGroup[] = ["Learning", "Calendar", "Journal", "Coaching", "Progress", "Community", "Coach and brand", "AI"]

export const getWidget = (type: string) => WIDGETS.find((w) => w.type === type)

/** Height rules for a widget in a given look. */
export function lookOf(def: WidgetDef, variant?: string) {
  return def.variants.find((v) => v.value === variant) ?? def.variants[0]
}

/** Standard height for a widget's look, used when converting older layouts. */
export function heightOf(w: { type: string; variant?: string }) {
  const def = getWidget(w.type)
  return def ? lookOf(def, w.variant).h : 4
}

/** Rows a Detailed widget gets on top of its layout's height: room for the extra list or stats. */
export const DETAILED_EXTRA_ROWS = 2

/** Standard height for a widget's layout at a given Detail. */
export function heightFor(def: WidgetDef, variant?: string, detail?: "compact" | "standard" | "detailed") {
  return lookOf(def, variant).h + (detail === "detailed" ? DETAILED_EXTRA_ROWS : 0)
}
