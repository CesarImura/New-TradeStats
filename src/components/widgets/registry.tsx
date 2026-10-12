import {
  CalendarDays,
  CircleCheck,
  Gauge,
  GraduationCap,
  Handshake,
  Image as ImageIcon,
  LineChart,
  Megaphone,
  MessageSquareText,
  Newspaper,
  PlayCircle,
  Radio,
  Sparkles,
  Trophy,
  Type,
  Video,
  type LucideIcon,
} from "lucide-react"
import type { ModuleId } from "@/lib/data/coaches"
import { AiAsk, Banner, PartnerLinks, TextBlock, WelcomeVideo } from "./brand"
import { EconNews, NextLive, ThisWeek } from "./calendar"
import { Announcement, Discord } from "./community"
import { JournalPnl, RulesFollowed } from "./journal"
import { ContinueLesson, CourseProgress } from "./learning"
import { FirstWeek, MyRank } from "./progress"
import type { WidgetProps } from "./shared"

export type WidgetGroup = "Learning" | "Calendar" | "Journal" | "Progress" | "Community" | "Coach and brand" | "AI"

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
  /** Three designs per widget; the first is the default. Each needs its own height in rows. */
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
    type: "continue-lesson",
    name: "Continue lesson",
    description: "The next lesson to watch, with progress",
    group: "Learning",
    icon: PlayCircle,
    module: "courses",
    variants: [
      { value: "progress", label: "Progress bar", h: 3, minH: 3 },
      { value: "card", label: "Compact", h: 2, minH: 2 },
      { value: "cover", label: "Cover", h: 3, minH: 3 },
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
    description: "All courses with progress; locked ones show the tier",
    group: "Learning",
    icon: GraduationCap,
    module: "courses",
    variants: [
      { value: "rings", label: "Rings", h: 3, minH: 3 },
      { value: "bars", label: "Bars", h: 4, minH: 3 },
      { value: "dots", label: "Lesson dots", h: 4, minH: 3 },
    ],
    defaultW: 8,
    minW: 4,
    Component: CourseProgress,
  },
  {
    type: "next-live",
    name: "Next live session",
    description: "When the next live is, with a reminder",
    group: "Calendar",
    icon: Radio,
    module: "calendar",
    variants: [
      { value: "countdown", label: "Countdown", h: 3, minH: 3 },
      { value: "timeline", label: "Day timeline", h: 3, minH: 3 },
      { value: "block", label: "Colour block", h: 3, minH: 3 },
    ],
    defaultW: 4,
    minW: 3,
    Component: NextLive,
  },
  {
    type: "this-week",
    name: "This week",
    description: "Lives, calls and workshops coming up",
    group: "Calendar",
    icon: CalendarDays,
    module: "calendar",
    variants: [
      { value: "week", label: "Week", h: 3, minH: 3 },
      { value: "timeline", label: "Timeline", h: 4, minH: 4 },
      { value: "list", label: "List", h: 4, minH: 3 },
    ],
    settings: [{ key: "news", label: "Include economic news", type: "toggle", defaultOn: true }],
    defaultW: 6,
    minW: 3,
    Component: ThisWeek,
  },
  {
    type: "econ-news",
    name: "Economic news",
    description: "Rate decisions, CPI, NFP and your no-trade marks",
    group: "Calendar",
    icon: Newspaper,
    module: "calendar",
    variants: [
      { value: "impact", label: "Impact bars", h: 3, minH: 3 },
      { value: "next", label: "Next big one", h: 4, minH: 3 },
      { value: "list", label: "List", h: 4, minH: 3 },
    ],
    defaultW: 4,
    minW: 3,
    Component: EconNews,
  },
  {
    type: "journal-pnl",
    name: "P&L",
    description: "The student's own result from their journal",
    group: "Journal",
    icon: LineChart,
    module: "journal",
    variants: [
      { value: "bars", label: "Daily bars", h: 3, minH: 3 },
      { value: "curve", label: "Equity curve", h: 3, minH: 3 },
      { value: "heatmap", label: "Heatmap", h: 4, minH: 3 },
    ],
    defaultW: 4,
    minW: 3,
    Component: JournalPnl,
  },
  {
    type: "rules-followed",
    name: "Rules followed",
    description: "How well the student sticks to your rules",
    group: "Journal",
    icon: Gauge,
    module: "journal",
    variants: [
      { value: "radar", label: "Radar", h: 4, minH: 3 },
      { value: "ring", label: "Ring", h: 2, minH: 2 },
      { value: "streak", label: "Streak", h: 2, minH: 2 },
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
      { value: "checklist", label: "Checklist", h: 3, minH: 3 },
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
      { value: "trend", label: "Trend", h: 3, minH: 3 },
      { value: "podium", label: "Podium", h: 3, minH: 3 },
      { value: "leaderboard", label: "Top list", h: 5, minH: 4 },
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
      { value: "highlight", label: "Highlighted", h: 3, minH: 2 },
      { value: "plain", label: "Plain", h: 3, minH: 2 },
      { value: "post", label: "Post", h: 3, minH: 3 },
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
      { value: "card", label: "Card", h: 3, minH: 3 },
      { value: "banner", label: "Banner", h: 2, minH: 2 },
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
      { value: "stacked", label: "Video on top", h: 5, minH: 5 },
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
      { value: "brand", label: "Brand colour", h: 2, minH: 2 },
      { value: "highlight", label: "Highlight", h: 2, minH: 2 },
      { value: "plain", label: "Plain", h: 2, minH: 2 },
    ],
    settings: [
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
    minW: 6,
    Component: Banner,
  },
  {
    type: "text",
    name: "Text",
    description: "A heading and a paragraph, or a quote",
    group: "Coach and brand",
    icon: Type,
    variants: [
      { value: "plain", label: "Plain", h: 2, minH: 2 },
      { value: "quote", label: "Quote", h: 2, minH: 2 },
      { value: "centered", label: "Centred", h: 2, minH: 2 },
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
      { value: "list", label: "List", h: 4, minH: 4 },
      { value: "tiles", label: "Tiles", h: 4, minH: 3 },
      { value: "chips", label: "Chips", h: 1, minH: 1 },
    ],
    defaultW: 4,
    minW: 3,
    Component: PartnerLinks,
  },
  {
    type: "ai-ask",
    name: "Ask the AI",
    description: "A search box for your AI assistant",
    group: "AI",
    icon: Sparkles,
    module: "ai",
    variants: [
      { value: "search", label: "Search box", h: 3, minH: 3 },
      { value: "chat", label: "Example chat", h: 4, minH: 4 },
      { value: "quota", label: "Questions left", h: 3, minH: 3 },
    ],
    defaultW: 12,
    minW: 4,
    Component: AiAsk,
  },
]

export const WIDGET_GROUPS: WidgetGroup[] = ["Learning", "Calendar", "Journal", "Progress", "Community", "Coach and brand", "AI"]

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
