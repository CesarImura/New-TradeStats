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
  /** Three designs per widget; the first is the default. */
  variants: { value: string; label: string }[]
  settings?: Setting[]
  /** Width in twelfths when added, and the narrowest it can go before its content breaks. */
  defaultSpan: number
  minSpan: number
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
      { value: "hero", label: "Large" },
      { value: "card", label: "Compact" },
      { value: "spotlight", label: "Cover" },
    ],
    settings: [
      { key: "title", label: "Small label", type: "text", placeholder: "Start here" },
      { key: "course", label: "Course", type: "select", options: COURSE_OPTIONS },
    ],
    defaultSpan: 8,
    minSpan: 4,
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
      { value: "list", label: "List" },
      { value: "cards", label: "Cards" },
      { value: "rings", label: "Rings" },
    ],
    defaultSpan: 8,
    minSpan: 4,
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
      { value: "card", label: "Card" },
      { value: "banner", label: "Colour block" },
      { value: "countdown", label: "Countdown" },
    ],
    defaultSpan: 4,
    minSpan: 3,
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
      { value: "list", label: "List" },
      { value: "timeline", label: "Timeline" },
      { value: "days", label: "Week strip" },
    ],
    settings: [{ key: "news", label: "Include economic news", type: "toggle", defaultOn: true }],
    defaultSpan: 6,
    minSpan: 3,
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
      { value: "list", label: "List" },
      { value: "impact", label: "Table" },
      { value: "next", label: "Next big one" },
    ],
    defaultSpan: 4,
    minSpan: 3,
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
      { value: "chart", label: "Daily bars" },
      { value: "number", label: "Big number" },
      { value: "calendar", label: "Heatmap" },
    ],
    defaultSpan: 4,
    minSpan: 3,
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
      { value: "number", label: "Number" },
      { value: "ring", label: "Ring" },
      { value: "breakdown", label: "Per rule" },
    ],
    defaultSpan: 4,
    minSpan: 3,
    Component: RulesFollowed,
  },
  {
    type: "first-week",
    name: "First-week checklist",
    description: "Turns a new member into an active one",
    group: "Progress",
    icon: CircleCheck,
    variants: [
      { value: "checklist", label: "Checklist" },
      { value: "steps", label: "Steps" },
      { value: "progress", label: "Ring" },
    ],
    defaultSpan: 4,
    minSpan: 3,
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
      { value: "number", label: "Number" },
      { value: "podium", label: "Podium" },
      { value: "leaderboard", label: "Top list" },
    ],
    defaultSpan: 4,
    minSpan: 3,
    Component: MyRank,
  },
  {
    type: "announcement",
    name: "Latest announcement",
    description: "Your newest announcement",
    group: "Community",
    icon: Megaphone,
    variants: [
      { value: "highlight", label: "Highlighted" },
      { value: "plain", label: "Plain" },
      { value: "pinned", label: "Post" },
    ],
    defaultSpan: 4,
    minSpan: 3,
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
      { value: "card", label: "Card" },
      { value: "banner", label: "Banner" },
      { value: "members", label: "Who's online" },
    ],
    settings: [{ key: "text", label: "Text", type: "textarea" }],
    defaultSpan: 4,
    minSpan: 3,
    Component: Discord,
  },
  {
    type: "welcome-video",
    name: "Welcome video",
    description: "A personal message from you",
    group: "Coach and brand",
    icon: Video,
    variants: [
      { value: "side", label: "Side by side" },
      { value: "stacked", label: "Video on top" },
      { value: "minimal", label: "Quote" },
    ],
    settings: [
      { key: "title", label: "Title", type: "text" },
      { key: "text", label: "Text", type: "textarea" },
    ],
    defaultSpan: 12,
    minSpan: 4,
    Component: WelcomeVideo,
  },
  {
    type: "banner",
    name: "Banner",
    description: "A headline with a button, e.g. an offer or launch",
    group: "Coach and brand",
    icon: ImageIcon,
    variants: [
      { value: "brand", label: "Brand colour" },
      { value: "highlight", label: "Highlight" },
      { value: "plain", label: "Plain" },
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
    defaultSpan: 12,
    minSpan: 6,
    Component: Banner,
  },
  {
    type: "text",
    name: "Text",
    description: "A heading and a paragraph, or a quote",
    group: "Coach and brand",
    icon: Type,
    variants: [
      { value: "plain", label: "Plain" },
      { value: "quote", label: "Quote" },
      { value: "centered", label: "Centred" },
    ],
    settings: [
      { key: "title", label: "Heading", type: "text" },
      { key: "text", label: "Text", type: "textarea" },
    ],
    defaultSpan: 6,
    minSpan: 3,
    Component: TextBlock,
  },
  {
    type: "partner-links",
    name: "Partner links",
    description: "Brokers, prop firms and tools you recommend",
    group: "Coach and brand",
    icon: Handshake,
    variants: [
      { value: "list", label: "List" },
      { value: "tiles", label: "Tiles" },
      { value: "chips", label: "Chips" },
    ],
    defaultSpan: 4,
    minSpan: 3,
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
      { value: "search", label: "Search box" },
      { value: "chat", label: "Example chat" },
      { value: "compact", label: "Compact" },
    ],
    defaultSpan: 12,
    minSpan: 3,
    Component: AiAsk,
  },
]

export const WIDGET_GROUPS: WidgetGroup[] = ["Learning", "Calendar", "Journal", "Progress", "Community", "Coach and brand", "AI"]

export const getWidget = (type: string) => WIDGETS.find((w) => w.type === type)
