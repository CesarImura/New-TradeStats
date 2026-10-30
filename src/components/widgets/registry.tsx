import { ArrowRight, BookOpen, Download, GalleryHorizontal, ChartCandlestick, MessagesSquare, NotebookPen, CalendarDays, CircleCheck, Gauge, GraduationCap, Handshake, Image as ImageIcon, LineChart, Megaphone, MessageSquareText, Newspaper, PlayCircle, Radio, Sparkles, Trophy, Type, Video, BadgeCheck, CalendarClock, MessageSquareReply, ShieldAlert, CircleHelp, Link2, type LucideIcon } from "@/components/icons"
import { isPageId, type ModuleId } from "@/lib/data/coaches"
import { CORE_H, COLS, coreType, type PageId } from "@/lib/widgets/layout"
import { corePage } from "./core"
import { PageHeader } from "./page"
import { AiAsk, Banner, PartnerLinks, TextBlock, WelcomeVideo } from "./brand"
import { ButtonBlock, Countdown, Embed, Faq, Hero, ImageBlock, Links } from "./content"
import { EconNews, NextLive } from "./calendar"
import { Announcement, CommunityFeed, Discord } from "./community"
import { JournalPnl, RulesFollowed } from "./journal"
import { LatestDownloads } from "./files"
import { ContinueLesson, CourseProgress } from "./learning"
import { FirstWeek, MyRank } from "./progress"
import { BookCall, CoachFeedback } from "./coaching"
import { CoachProfile, Upgrade } from "./offer"
import type { WidgetProps } from "./shared"
import { Drawdown } from "./trading"
import { NEW_WIDGETS } from "./more/registry"
import { Shelf } from "./media"

export type WidgetGroup = "Learning" | "Calendar" | "Journal" | "Coaching" | "Progress" | "Community" | "Your content" | "Coach and brand" | "AI" | "Page"

export type Setting =
  | { key: string; label: string; type: "text"; placeholder?: string }
  | { key: string; label: string; type: "textarea"; placeholder?: string }
  | { key: string; label: string; type: "select"; options: { value: string; label: string }[] }
  | { key: string; label: string; type: "toggle"; defaultOn?: boolean }
  /** An uploaded picture: `props[key]` is a data URL, or empty for the sample picture. */
  | { key: string; label: string; type: "image" }

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
  /**
   * Three or more designs per widget; the first is the default. Each has its own height in rows and the box it
   * looks right in: the shortest and narrowest before it gets squeezed, the tallest and widest before it only
   * stretches. Measured on /lab/stress?range=axes (every width at its height, every height at its default
   * width, sample and long content), then judged; the builder keeps it inside.
   */
  variants: { value: string; label: string; h: number; minH: number; maxH: number; minW: number; maxW: number; /** More rows when narrower than `below` columns (a layout that stacks there). */ narrow?: { below: number; minH: number }; /** Fewer rows from `from` columns up (a layout that lies flat there). */ wide?: { from: number; maxH: number }; /** Rows at Compact and Detailed when they differ from `h` and `h + DETAILED_EXTRA_ROWS`: measured so the card is as tall as what it shows. */ hd?: { compact?: number; detailed?: number } }[]
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

/** The student pages a coach's button can open. */
const PAGE_TARGETS = [
  { value: "courses", label: "Courses" },
  { value: "calendar", label: "Calendar" },
  { value: "community", label: "Community" },
  { value: "profile", label: "Upgrade" },
]

export const WIDGETS: WidgetDef[] = [
  {
    type: "page-header",
    name: "Page title",
    description: "The page's title, with a small label and an intro",
    group: "Page",
    icon: Type,
    variants: [
      { value: "plain", label: "Plain", h: 1, minH: 1, maxH: 2, minW: 4, maxW: 12 },
      { value: "centered", label: "Centred", h: 1, minH: 1, maxH: 2, minW: 4, maxW: 12 },
      { value: "banner", label: "Banner", h: 1, minH: 1, maxH: 3, minW: 4, maxW: 12 },
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
      { value: "progress", label: "Next lesson", h: 3, minH: 3, maxH: 4, minW: 4, maxW: 12 },
      { value: "cover", label: "Cover", h: 3, minH: 3, maxH: 4, minW: 4, maxW: 12 },
      { value: "card", label: "One line", h: 2, minH: 2, maxH: 2, minW: 4, maxW: 12 },
      { value: "media", label: "Media", h: 4, minH: 3, maxH: 4, minW: 4, maxW: 12 },
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
    type: "shelf",
    name: "Shelf",
    description: "Posters of your courses, lessons or files, in a row, a carousel or a grid",
    group: "Learning",
    icon: GalleryHorizontal,
    variants: [
      { value: "row", label: "Row", h: 6, minH: 4, maxH: 8, minW: 4, maxW: 12 },
      { value: "carousel", label: "Carousel", h: 7, minH: 5, maxH: 9, minW: 8, maxW: 12 },
      { value: "grid", label: "Grid", h: 8, minH: 4, maxH: 12, minW: 4, maxW: 12 },
    ],
    settings: [
      { key: "title", label: "Title", type: "text", placeholder: "Courses" },
      {
        key: "source",
        label: "Show",
        type: "select",
        options: [
          { value: "courses", label: "Courses" },
          { value: "lessons", label: "Continue watching" },
          { value: "downloads", label: "Downloads" },
        ],
      },
      {
        key: "shape",
        label: "Poster shape",
        type: "select",
        options: [
          { value: "", label: "Best for what it shows" },
          { value: "portrait", label: "Portrait" },
          { value: "landscape", label: "Landscape" },
          { value: "square", label: "Square" },
        ],
      },
      {
        key: "words",
        label: "Words",
        type: "select",
        options: [
          { value: "over", label: "On the picture" },
          { value: "below", label: "Under the picture" },
        ],
      },
      {
        key: "nav",
        label: "Carousel shows",
        type: "select",
        options: [
          { value: "dots", label: "Dots" },
          { value: "counter", label: "Counter (3 / 8)" },
          { value: "none", label: "Arrows only" },
        ],
      },
      { key: "autoplay", label: "Carousel moves on its own", type: "toggle" },
    ],
    defaultW: 12,
    minW: 4,
    Component: Shelf,
  },
  {
    type: "course-progress",
    name: "Courses",
    description: "All courses with progress, locked ones show the tier, and what unlocks next",
    group: "Learning",
    icon: GraduationCap,
    module: "courses",
    variants: [
      { value: "rings", label: "Rings", h: 3, minH: 3, wide: { from: 8, maxH: 3 }, maxH: 4, minW: 4, maxW: 8 },
      { value: "bars", label: "List", h: 4, minH: 3, maxH: 4, minW: 4, maxW: 12 },
      { value: "unlocks", label: "Next unlock", h: 3, minH: 3, maxH: 3, minW: 4, maxW: 12, hd: { detailed: 3 } },
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
      { value: "countdown", label: "Countdown", h: 5, minH: 3, maxH: 6, minW: 3, maxW: 8, hd: { compact: 3 } },
      { value: "timeline", label: "Today", h: 4, minH: 3, wide: { from: 6, maxH: 3 }, maxH: 4, minW: 3, maxW: 8, hd: { compact: 3 } },
      { value: "week", label: "Week", h: 4, minH: 3, maxH: 4, minW: 3, maxW: 12 },
      { value: "split", label: "Split", h: 3, minH: 3, maxH: 5, minW: 3, maxW: 8 },
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
      { value: "next", label: "Next big one", h: 3, minH: 3, maxH: 3, minW: 3, maxW: 12 },
      { value: "week", label: "This week", h: 4, minH: 3, maxH: 5, minW: 3, maxW: 12, hd: { compact: 3, detailed: 5 } },
      { value: "sessions", label: "Sessions", h: 4, minH: 3, maxH: 4, minW: 3, maxW: 12, hd: { compact: 3, detailed: 5 } },
      { value: "timeline", label: "Timeline", h: 5, minH: 3, maxH: 7, minW: 3, maxW: 12, hd: { compact: 4, detailed: 6 } },
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
      { value: "curve", label: "Equity curve", h: 5, minH: 3, maxH: 6, minW: 3, maxW: 12 },
      { value: "bars", label: "Daily P&L", h: 4, minH: 3, maxH: 5, minW: 3, maxW: 12 },
      { value: "heatmap", label: "Calendar", h: 4, minH: 4, maxH: 6, minW: 3, maxW: 12 },
      { value: "hero", label: "Hero", h: 4, minH: 3, maxH: 4, minW: 3, maxW: 12 },
      { value: "hours", label: "By hour", h: 4, minH: 3, maxH: 5, minW: 3, maxW: 12, hd: { detailed: 5 } },
      { value: "compare", label: "Compare", h: 5, minH: 3, maxH: 7, minW: 3, maxW: 12, hd: { compact: 4, detailed: 6 } },
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
      { value: "radar", label: "Gauge", h: 4, minH: 3, maxH: 6, minW: 3, maxW: 7, hd: { detailed: 5 } },
      { value: "streak", label: "Clean streak", h: 3, minH: 3, maxH: 5, minW: 3, maxW: 12 },
      { value: "rules", label: "Rule by rule", h: 4, minH: 3, maxH: 5, minW: 3, maxW: 12, hd: { compact: 3, detailed: 5 } },
      { value: "hero", label: "Hero", h: 4, minH: 3, maxH: 4, minW: 3, maxW: 12 },
      { value: "grid", label: "Heatmap", h: 4, minH: 3, maxH: 5, minW: 3, maxW: 12 },
      { value: "compare", label: "Compare", h: 5, minH: 3, maxH: 7, minW: 3, maxW: 12, hd: { compact: 4, detailed: 6 } },
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
      { value: "steps", label: "Steps", h: 2, minH: 2, maxH: 3, minW: 3, maxW: 12 },
      { value: "ring", label: "Ring", h: 2, minH: 2, maxH: 2, minW: 3, maxW: 12 },
      { value: "checklist", label: "Checklist", h: 4, minH: 3, maxH: 5, minW: 3, maxW: 12, hd: { detailed: 5 } },
      { value: "path", label: "Timeline", h: 5, minH: 3, maxH: 6, minW: 3, maxW: 12, hd: { compact: 3, detailed: 5 } },
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
      { value: "trend", label: "Trend", h: 4, minH: 3, wide: { from: 8, maxH: 4 }, maxH: 5, minW: 3, maxW: 8, hd: { compact: 3 } },
      { value: "podium", label: "Podium", h: 3, minH: 3, maxH: 4, minW: 3, maxW: 8 },
      { value: "leaderboard", label: "Top list", h: 5, minH: 4, maxH: 6, minW: 3, maxW: 12 },
      { value: "hero", label: "Hero", h: 4, minH: 3, maxH: 4, minW: 3, maxW: 12 },
      { value: "compare", label: "Compare", h: 5, minH: 3, maxH: 6, minW: 3, maxW: 12, hd: { compact: 4, detailed: 5 } },
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
      { value: "plain", label: "Headline", h: 3, minH: 2, maxH: 5, minW: 3, maxW: 12, hd: { compact: 2 } },
      { value: "post", label: "Post", h: 4, minH: 3, maxH: 5, minW: 3, maxW: 12, hd: { compact: 3, detailed: 4 } },
      { value: "line", label: "One line", h: 1, minH: 1, maxH: 1, minW: 3, maxW: 12 },
      { value: "media", label: "Media", h: 4, minH: 3, maxH: 4, minW: 3, maxW: 12 },
    ],
    defaultW: 4,
    minW: 3,
    Component: Announcement,
  },
  {
    type: "community-feed",
    name: "Community feed",
    description: "The newest posts from your own feed, pinned first",
    group: "Community",
    icon: MessagesSquare,
    module: "community",
    variants: [
      { value: "list", label: "Recent posts", h: 4, minH: 3, maxH: 4, minW: 3, maxW: 12, hd: { compact: 3, detailed: 5 } },
      { value: "line", label: "One row", h: 1, minH: 1, maxH: 1, minW: 3, maxW: 12 },
    ],
    defaultW: 4,
    minW: 3,
    Component: CommunityFeed,
  },
  {
    type: "discord",
    name: "Discord",
    description: "Invite to your Discord server",
    group: "Community",
    icon: MessageSquareText,
    module: "community",
    variants: [
      { value: "online", label: "Who's online", h: 3, minH: 3, maxH: 4, minW: 3, maxW: 12, hd: { detailed: 4 } },
      { value: "card", label: "Channels", h: 4, minH: 3, maxH: 5, minW: 3, maxW: 12, hd: { compact: 3, detailed: 5 } },
      { value: "banner", label: "One row", h: 2, minH: 1, maxH: 2, minW: 3, maxW: 12 },
      { value: "heatmap", label: "Heatmap", h: 4, minH: 4, maxH: 6, minW: 3, maxW: 12 },
      { value: "join", label: "Join card", h: 4, minH: 3, maxH: 5, minW: 3, maxW: 12, hd: { compact: 3, detailed: 5 } },
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
      { value: "side", label: "Side by side", h: 4, minH: 4, narrow: { below: 7, minH: 6 }, maxH: 7, minW: 4, maxW: 12 },
      { value: "stacked", label: "Video on top", h: 5, minH: 5, narrow: { below: 7, minH: 6 }, maxH: 8, minW: 4, maxW: 12 },
      { value: "minimal", label: "Quote", h: 3, minH: 3, maxH: 4, minW: 4, maxW: 12 },
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
    group: "Your content",
    icon: ImageIcon,
    variants: [
      { value: "headline", label: "Headline", h: 3, minH: 2, maxH: 3, minW: 4, maxW: 12, hd: { detailed: 3 } },
      { value: "picture", label: "With picture", h: 3, minH: 2, maxH: 4, minW: 4, maxW: 12 },
      { value: "slim", label: "One line", h: 1, minH: 1, maxH: 1, minW: 4, maxW: 12 },
    ],
    settings: [
      { key: "eyebrow", label: "Small label", type: "text", placeholder: "Limited places" },
      { key: "title", label: "Headline", type: "text" },
      { key: "text", label: "Text", type: "textarea" },
      { key: "button", label: "Button text", type: "text", placeholder: "Find out more" },
      { key: "target", label: "Button opens", type: "select", options: PAGE_TARGETS },
    ],
    defaultW: 12,
    minW: 4,
    Component: Banner,
  },
  {
    type: "text",
    name: "Text",
    description: "A heading and a paragraph, a quote, or numbered steps, with an optional button",
    group: "Your content",
    icon: Type,
    variants: [
      { value: "plain", label: "Plain", h: 3, minH: 2, maxH: 5, minW: 3, maxW: 12 },
      { value: "quote", label: "Quote", h: 3, minH: 2, maxH: 4, minW: 3, maxW: 12 },
      { value: "steps", label: "Steps", h: 3, minH: 3, wide: { from: 8, maxH: 3 }, maxH: 4, minW: 3, maxW: 12, hd: { detailed: 3 } },
    ],
    settings: [
      { key: "title", label: "Heading", type: "text" },
      { key: "text", label: "Text", type: "textarea" },
      { key: "button", label: "Button text", type: "text", placeholder: "Leave empty for no button" },
      { key: "target", label: "Button opens", type: "select", options: PAGE_TARGETS },
    ],
    defaultW: 6,
    minW: 3,
    Component: TextBlock,
  },
  {
    type: "image",
    name: "Image",
    description: "A picture of yours, with an optional caption",
    group: "Your content",
    icon: ImageIcon,
    variants: [
      { value: "cover", label: "Fill", h: 4, minH: 2, maxH: 5, minW: 3, maxW: 12 },
      { value: "caption", label: "With caption", h: 5, minH: 3, maxH: 5, minW: 3, maxW: 12 },
      { value: "side", label: "Beside text", h: 4, minH: 3, maxH: 4, minW: 3, maxW: 12 },
    ],
    settings: [
      { key: "image", label: "Picture", type: "image" },
      { key: "title", label: "Title", type: "text" },
      { key: "text", label: "Caption or text", type: "textarea" },
    ],
    defaultW: 6,
    minW: 3,
    Component: ImageBlock,
  },
  {
    type: "button",
    name: "Button",
    description: "One call to action, e.g. book a call or open a link",
    group: "Your content",
    icon: ArrowRight,
    variants: [
      { value: "filled", label: "Filled", h: 2, minH: 1, maxH: 2, minW: 3, maxW: 6 },
      { value: "outline", label: "Outline", h: 2, minH: 1, maxH: 2, minW: 3, maxW: 6 },
      { value: "row", label: "One row", h: 1, minH: 1, maxH: 1, minW: 2, maxW: 8 },
    ],
    settings: [
      { key: "title", label: "Label", type: "text", placeholder: "Book a call" },
      { key: "text", label: "Small text", type: "text" },
      { key: "target", label: "Opens", type: "select", options: [PAGE_TARGETS[1], PAGE_TARGETS[0], ...PAGE_TARGETS.slice(2), { value: "url", label: "A web address" }] },
      { key: "url", label: "Web address", type: "text", placeholder: "https://…" },
    ],
    defaultW: 4,
    minW: 2,
    Component: ButtonBlock,
  },
  {
    type: "embed",
    name: "Embed",
    description: "A video or a page from elsewhere: YouTube, Vimeo, a form",
    group: "Your content",
    icon: PlayCircle,
    variants: [
      { value: "video", label: "Video", h: 5, minH: 3, maxH: 5, minW: 3, maxW: 12 },
      { value: "page", label: "Page", h: 8, minH: 4, maxH: 8, minW: 3, maxW: 12 },
      { value: "row", label: "One row", h: 1, minH: 1, maxH: 1, minW: 3, maxW: 12 },
    ],
    settings: [
      { key: "url", label: "Address", type: "text", placeholder: "https://youtu.be/… or any page" },
      { key: "title", label: "Title", type: "text" },
    ],
    defaultW: 6,
    minW: 3,
    Component: Embed,
  },
  {
    type: "hero",
    name: "Hero",
    description: "A big picture or video with a headline and a button",
    group: "Your content",
    icon: Megaphone,
    variants: [
      { value: "image", label: "Picture", h: 6, minH: 4, maxH: 8, minW: 6, maxW: 12 },
      { value: "video", label: "Video", h: 6, minH: 4, maxH: 8, minW: 6, maxW: 12 },
      { value: "split", label: "Split", h: 5, minH: 4, maxH: 5, minW: 6, maxW: 12 },
      { value: "featured", label: "Featured", h: 8, minH: 6, maxH: 10, minW: 8, maxW: 12 },
    ],
    settings: [
      { key: "image", label: "Picture", type: "image" },
      { key: "eyebrow", label: "Small label", type: "text" },
      { key: "title", label: "Headline", type: "text", placeholder: "Trade with a plan" },
      { key: "text", label: "Text", type: "textarea" },
      { key: "button", label: "Button text", type: "text", placeholder: "Start here" },
      { key: "target", label: "Button opens", type: "select", options: PAGE_TARGETS },
    ],
    defaultW: 12,
    minW: 6,
    Component: Hero,
  },
  {
    type: "faq",
    name: "Questions",
    description: "Questions and answers, opened one at a time",
    group: "Your content",
    icon: CircleHelp,
    variants: [
      { value: "list", label: "List", h: 4, minH: 3, wide: { from: 8, maxH: 4 }, maxH: 5, minW: 3, maxW: 12, hd: { detailed: 4 } },
      { value: "two", label: "Two columns", h: 4, minH: 3, wide: { from: 8, maxH: 3 }, maxH: 5, minW: 3, maxW: 12, hd: { detailed: 4 } },
      { value: "row", label: "One row", h: 1, minH: 1, maxH: 1, minW: 3, maxW: 12 },
    ],
    settings: [
      { key: "title", label: "Title", type: "text", placeholder: "Questions" },
      { key: "items", label: "Questions and answers", type: "textarea", placeholder: "One per line: question | answer" },
    ],
    defaultW: 6,
    minW: 3,
    Component: Faq,
  },
  {
    type: "links",
    name: "Links",
    description: "A list of links: tools, documents, pages",
    group: "Your content",
    icon: Link2,
    variants: [
      { value: "list", label: "List", h: 4, minH: 2, maxH: 5, minW: 4, maxW: 12, hd: { detailed: 5 } },
      { value: "tiles", label: "Tiles", h: 4, minH: 3, maxH: 6, minW: 4, maxW: 12 },
      { value: "row", label: "One row", h: 1, minH: 1, maxH: 1, minW: 5, maxW: 12 },
    ],
    settings: [
      { key: "title", label: "Title", type: "text", placeholder: "Links" },
      { key: "items", label: "Links", type: "textarea", placeholder: "One per line: name | address" },
    ],
    defaultW: 4,
    minW: 2,
    Component: Links,
  },
  {
    type: "countdown",
    name: "Countdown",
    description: "Counts down to a date: a launch, a cohort start, a challenge",
    group: "Your content",
    icon: CalendarClock,
    variants: [
      { value: "big", label: "Big", h: 2, minH: 2, maxH: 3, minW: 3, maxW: 6, hd: { detailed: 2 } },
      { value: "line", label: "One line", h: 1, minH: 1, maxH: 1, minW: 2, maxW: 12 },
      { value: "card", label: "With text", h: 4, minH: 3, maxH: 5, minW: 3, maxW: 8, hd: { compact: 3 } },
    ],
    settings: [
      { key: "title", label: "Title", type: "text", placeholder: "Next cohort starts" },
      { key: "date", label: "Date and time", type: "text", placeholder: "2026-11-01 09:00" },
      { key: "text", label: "Text", type: "textarea" },
      { key: "button", label: "Button text", type: "text", placeholder: "Save my spot" },
      { key: "target", label: "Button opens", type: "select", options: PAGE_TARGETS },
    ],
    defaultW: 4,
    minW: 2,
    Component: Countdown,
  },
  {
    type: "partner-links",
    name: "Partner links",
    description: "Brokers, prop firms and tools you recommend",
    group: "Coach and brand",
    icon: Handshake,
    module: "partners",
    variants: [
      { value: "list", label: "List", h: 6, minH: 3, maxH: 7, minW: 4, maxW: 12, hd: { compact: 5, detailed: 6 } },
      { value: "tiles", label: "Logo wall", h: 4, minH: 3, maxH: 5, minW: 3, maxW: 12 },
      { value: "chips", label: "Chips", h: 1, minH: 1, maxH: 1, minW: 5, maxW: 12 },
    ],
    defaultW: 4,
    minW: 3,
    Component: PartnerLinks,
  },
  {
    type: "latest-downloads",
    name: "Latest downloads",
    description: "The newest files, with a link to all",
    group: "Learning",
    icon: Download,
    module: "downloads",
    variants: [
      { value: "list", label: "List", h: 4, minH: 3, maxH: 5, minW: 3, maxW: 12 },
      { value: "tiles", label: "Tiles", h: 5, minH: 3, maxH: 6, minW: 3, maxW: 12 },
      { value: "row", label: "One line", h: 1, minH: 1, maxH: 1, minW: 4, maxW: 12 },
    ],
    settings: [
      {
        key: "count",
        label: "Files shown",
        type: "select",
        options: [
          { value: "3", label: "3" },
          { value: "5", label: "5" },
          { value: "8", label: "8" },
        ],
      },
    ],
    defaultW: 4,
    minW: 3,
    Component: LatestDownloads,
  },
  {
    type: "ai-ask",
    name: "Ask the AI",
    description: "A question box for your AI assistant, with one insight from the student's trades",
    group: "AI",
    icon: Sparkles,
    module: "ai",
    variants: [
      { value: "search", label: "Question box", h: 3, minH: 2, maxH: 4, minW: 4, maxW: 12, hd: { detailed: 4 } },
      { value: "chat", label: "Example chat", h: 5, minH: 4, maxH: 7, minW: 4, maxW: 8, hd: { compact: 4, detailed: 6 } },
      { value: "insight", label: "Insight from trades", h: 4, minH: 3, maxH: 5, minW: 4, maxW: 12 },
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
      { value: "slots", label: "Time slots", h: 4, minH: 3, maxH: 5, minW: 3, maxW: 12, hd: { compact: 3, detailed: 4 } },
      { value: "next", label: "Next free", h: 3, minH: 3, maxH: 3, minW: 3, maxW: 12, hd: { detailed: 4 } },
      { value: "allowance", label: "Calls left", h: 2, minH: 2, maxH: 2, minW: 3, maxW: 8 },
      { value: "split", label: "Split", h: 3, minH: 3, maxH: 4, minW: 3, maxW: 12 },
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
      { value: "gauge", label: "Gauge", h: 4, minH: 3, maxH: 6, minW: 3, maxW: 7, hd: { detailed: 4 } },
      { value: "bars", label: "Daily limit", h: 4, minH: 3, maxH: 4, minW: 3, maxW: 12, hd: { compact: 3, detailed: 5 } },
      { value: "curve", label: "Balance and floor", h: 4, minH: 3, maxH: 5, minW: 3, maxW: 12 },
      { value: "hero", label: "Hero", h: 4, minH: 3, maxH: 4, minW: 3, maxW: 12 },
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
      { value: "queue", label: "Queue", h: 3, minH: 3, maxH: 5, minW: 3, maxW: 12 },
      { value: "latest", label: "Latest reply", h: 3, minH: 3, maxH: 3, minW: 3, maxW: 12 },
      { value: "stats", label: "Answered", h: 2, minH: 2, maxH: 2, minW: 3, maxW: 8 },
      { value: "thread", label: "Timeline", h: 5, minH: 3, maxH: 6, minW: 3, maxW: 12, hd: { compact: 3, detailed: 5 } },
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
      { value: "compare", label: "Compare", h: 5, minH: 4, maxH: 6, minW: 3, maxW: 8 },
      { value: "banner", label: "Banner", h: 2, minH: 2, maxH: 2, minW: 4, maxW: 12 },
      { value: "card", label: "Price", h: 4, minH: 3, maxH: 5, minW: 3, maxW: 12, hd: { detailed: 5 } },
      { value: "split", label: "Split", h: 3, minH: 3, maxH: 4, minW: 3, maxW: 12 },
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
      { value: "card", label: "Card", h: 4, minH: 3, maxH: 5, minW: 3, maxW: 8 },
      { value: "hero", label: "Large", h: 4, minH: 3, maxH: 6, minW: 3, maxW: 8 },
      { value: "compact", label: "One row", h: 2, minH: 2, maxH: 2, minW: 3, maxW: 12 },
      { value: "media", label: "Media", h: 4, minH: 3, maxH: 4, minW: 3, maxW: 12 },
    ],
    defaultW: 4,
    minW: 3,
    Component: CoachProfile,
  },
]

// The widgets added in the library (Recent trades, R distribution, Leaderboard…): same catalogue, after the originals.
WIDGETS.push(...NEW_WIDGETS)

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

for (const c of CORE) {
  WIDGETS.push({
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
  })
}

/** Widgets offered first on each module page; Home offers every widget. */
export const PAGE_WIDGETS: Record<ModuleId, string[]> = {
  courses: ["continue-lesson", "course-progress", "shelf"],
  calendar: ["next-live", "econ-news", "watchlist", "book-call"],
  charts: ["econ-news", "journal-pnl", "watchlist", "open-positions"],
  journal: ["journal-pnl", "rules-followed", "drawdown", "recent-trades", "open-positions", "r-distribution", "pnl-by-instrument", "pnl-by-weekday", "win-rate-trend", "check-in", "goals", "trading-streak", "coach-feedback", "ai-ask"],
  community: ["discord", "community-feed", "announcement", "my-rank"],
  ranking: ["my-rank", "leaderboard", "first-week"],
  ai: ["ai-ask"],
  downloads: ["latest-downloads"],
  partners: ["partner-links"],
}
/** Widgets that make sense on any page. */
export const ANYWHERE = ["page-header", "text", "image", "button", "banner", "embed", "hero", "faq", "links", "countdown", "welcome-video", "announcement", "upgrade", "partner-links", "latest-downloads", "coach-profile", "book-call", "shelf"]

/** The library for a page, in sections. Home: by group, as before. */
export function librarySections(page: PageId): { title: string; types: string[] }[] {
  const all = WIDGETS.filter((w) => !w.core)
  if (page === "home") return WIDGET_GROUPS.map((g) => ({ title: g, types: all.filter((w) => w.group === g).map((w) => w.type) }))
  if (isPageId(page)) {
    const mine = all.filter((w) => w.group === "Your content").map((w) => w.type)
    const anywhere = ANYWHERE.filter((t) => !mine.includes(t))
    const shown = new Set([...mine, ...anywhere])
    return [
      { title: "Your content", types: mine },
      { title: "Anywhere", types: anywhere },
      ...WIDGET_GROUPS.filter((g) => g !== "Your content").map((g) => ({ title: g, types: all.filter((w) => w.group === g && !shown.has(w.type)).map((w) => w.type) })),
    ]
  }
  const own = PAGE_WIDGETS[page]
  return [
    { title: "For this page", types: own },
    { title: "Anywhere", types: ANYWHERE.filter((t) => !own.includes(t)) },
  ]
}

export const WIDGET_GROUPS: WidgetGroup[] = ["Your content", "Learning", "Calendar", "Journal", "Coaching", "Progress", "Community", "Coach and brand", "AI"]

export const getWidget = (type: string) => WIDGETS.find((w) => w.type === type)

/** Height rules for a widget in a given look. */
export function lookOf(def: WidgetDef, variant?: string) {
  return def.variants.find((v) => v.value === variant) ?? def.variants[0]
}

/** The widths a page offers, in grid columns: one column, two of three, the whole page. */
export const PAGE_WIDTHS = [4, 8, COLS]

/** The page width a saved `w` draws at: 4 to 7 is one column, 8 to 11 two of three, 12 the whole page. */
export const pageWidth = (w: number) => (w >= COLS ? COLS : w >= 8 ? 8 : 4)

const nearest = (list: number[], to: number) => list.reduce((a, b) => (Math.abs(b - to) < Math.abs(a - to) ? b : a))

/** The page widths a widget's layout allows (its minW to maxW), or the nearest one when none falls inside. */
export function widthsFor(def: WidgetDef, variant?: string) {
  const { minW, maxW } = lookOf(def, variant)
  const ok = PAGE_WIDTHS.filter((w) => w >= minW && w <= maxW)
  return ok.length ? ok : [nearest(PAGE_WIDTHS, minW)]
}

/** The page width closest to `w` that the layout allows. Adding, dropping, resizing and changing layout all go through it. */
export const fitWidth = (def: WidgetDef, variant: string | undefined, w: number) => {
  const ok = widthsFor(def, variant)
  return ok.includes(pageWidth(w)) ? pageWidth(w) : nearest(ok, pageWidth(w))
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
  const v = lookOf(def, variant)
  if (detail === "detailed") return v.hd?.detailed ?? v.h + DETAILED_EXTRA_ROWS
  if (detail === "compact") return v.hd?.compact ?? v.h
  return v.h
}

/** Rows a layout gains (or loses) at a Detail, against its Standard height. */
export const extraRows = (def: WidgetDef, variant: string | undefined, detail?: "compact" | "standard" | "detailed") => heightFor(def, variant, detail) - lookOf(def, variant).h

/**
 * Which parts of a widget's own style apply to it (Design → This widget → Style). A picture behind the card only on
 * content widgets: on charts, tables and figures it would fight the data, so data widgets take a tone only. Image,
 * Embed and Welcome video are a picture or a player already. Charts and Numbers show only where the widget draws a
 * bar or gauge, or a headline figure.
 */
const IMAGE_OK = new Set(["page-header", "banner", "hero", "text", "button", "countdown", "faq", "links", "announcement", "continue-lesson", "course-progress", "latest-downloads", "partner-links", "coach-profile", "upgrade", "discord"])
const HAS_CHART = new Set(["continue-lesson", "course-progress", "next-live", "econ-news", "rules-followed", "first-week", "announcement", "discord", "welcome-video", "ai-ask", "book-call", "drawdown", "coach-feedback", "upgrade"])
const HAS_FIGURE = new Set(["course-progress", "next-live", "econ-news", "journal-pnl", "rules-followed", "my-rank", "discord", "book-call", "drawdown", "coach-feedback", "upgrade", "coach-profile"])
export const styleParts = (type: string) => ({ image: IMAGE_OK.has(type), chart: HAS_CHART.has(type), figure: HAS_FIGURE.has(type) })
