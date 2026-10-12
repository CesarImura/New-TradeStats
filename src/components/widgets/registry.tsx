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
  type LucideIcon,
} from "lucide-react"
import type { ModuleId } from "@/lib/data/coaches"
import * as W from "./library"

export type WidgetGroup = "Learning" | "Calendar" | "Journal" | "Community" | "Progress" | "Coach and brand" | "AI"

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
  variants?: { value: string; label: string }[]
  settings?: Setting[]
  /** Looks best across the full width (hint shown in the builder). */
  wide?: boolean
  Component: (p: W.WidgetProps) => React.ReactNode
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
      { value: "card", label: "Card" },
    ],
    settings: [
      { key: "title", label: "Small label", type: "text", placeholder: "Start here" },
      { key: "course", label: "Course", type: "select", options: COURSE_OPTIONS },
    ],
    Component: W.ContinueLesson,
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
    ],
    Component: W.CourseProgress,
  },
  {
    type: "next-live",
    name: "Next live session",
    description: "When the next live is, with Join and add to calendar",
    group: "Calendar",
    icon: Radio,
    module: "calendar",
    variants: [
      { value: "card", label: "Card" },
      { value: "banner", label: "Colour block" },
    ],
    Component: W.NextLive,
  },
  {
    type: "this-week",
    name: "This week",
    description: "Lives, calls and workshops coming up",
    group: "Calendar",
    icon: CalendarDays,
    module: "calendar",
    settings: [{ key: "news", label: "Include economic news", type: "toggle", defaultOn: true }],
    Component: W.ThisWeek,
  },
  {
    type: "econ-news",
    name: "Economic news",
    description: "Rate decisions, CPI, NFP and your no-trade marks",
    group: "Calendar",
    icon: Newspaper,
    module: "calendar",
    Component: W.EconNews,
  },
  {
    type: "journal-pnl",
    name: "P&L this week",
    description: "The student's own result from their journal",
    group: "Journal",
    icon: LineChart,
    module: "journal",
    variants: [
      { value: "chart", label: "Daily bars" },
      { value: "number", label: "Big number" },
    ],
    Component: W.JournalPnl,
  },
  {
    type: "rules-followed",
    name: "Rules followed",
    description: "How well the student sticks to your rules",
    group: "Journal",
    icon: Gauge,
    module: "journal",
    Component: W.RulesFollowed,
  },
  {
    type: "first-week",
    name: "First-week checklist",
    description: "Turns a new member into an active one",
    group: "Progress",
    icon: CircleCheck,
    Component: W.FirstWeek,
  },
  {
    type: "my-rank",
    name: "My rank",
    description: "The student's place on your leaderboard",
    group: "Progress",
    icon: Trophy,
    module: "ranking",
    Component: W.MyRank,
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
    ],
    Component: W.Announcement,
  },
  {
    type: "discord",
    name: "Discord",
    description: "Invite to your Discord server",
    group: "Community",
    icon: MessageSquareText,
    module: "community",
    settings: [{ key: "text", label: "Text", type: "textarea" }],
    Component: W.Discord,
  },
  {
    type: "welcome-video",
    name: "Welcome video",
    description: "A personal message from you",
    group: "Coach and brand",
    icon: PlayCircle,
    wide: true,
    settings: [
      { key: "title", label: "Title", type: "text" },
      { key: "text", label: "Text", type: "textarea" },
    ],
    Component: W.WelcomeVideo,
  },
  {
    type: "banner",
    name: "Banner",
    description: "A headline with a button, e.g. an offer or launch",
    group: "Coach and brand",
    icon: ImageIcon,
    wide: true,
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
    Component: W.Banner,
  },
  {
    type: "text",
    name: "Text",
    description: "A heading and a paragraph",
    group: "Coach and brand",
    icon: Type,
    settings: [
      { key: "title", label: "Heading", type: "text" },
      { key: "text", label: "Text", type: "textarea" },
    ],
    Component: W.TextBlock,
  },
  {
    type: "partner-links",
    name: "Partner links",
    description: "Brokers, prop firms and tools you recommend",
    group: "Coach and brand",
    icon: Handshake,
    Component: W.PartnerLinks,
  },
  {
    type: "ai-ask",
    name: "Ask the AI",
    description: "A search box for your AI assistant",
    group: "AI",
    icon: Sparkles,
    module: "ai",
    wide: true,
    Component: W.AiAsk,
  },
]

export const WIDGET_GROUPS: WidgetGroup[] = ["Learning", "Calendar", "Journal", "Progress", "Community", "Coach and brand", "AI"]

export const getWidget = (type: string) => WIDGETS.find((w) => w.type === type)

