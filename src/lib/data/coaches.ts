import type { CoachTheme, TemplateId } from "@/lib/theme/types"

export type ModuleId = "courses" | "calendar" | "community" | "journal" | "ranking" | "ai"
export type WidgetId =
  | "start-here"
  | "first-week"
  | "next-lesson"
  | "journal-week"
  | "next-event"
  | "announcement"
  | "econ"
  | "rank"

/** Words the coach can rename. Keys are ours; values are what students see. */
export type Wording = {
  home: string
  courses: string
  calendar: string
  community: string
  journal: string
  ranking: string
  ai: string
  student: string
  students: string
  lesson: string
}

export type Tier = { id: string; name: string; price: string; cadence: string; members: number }

export type Coach = {
  slug: string
  name: string
  coachName: string
  /** Short mark shown in the logo tile. */
  mark: string
  tagline: string
  template: TemplateId
  /** What the coach changed on top of the template. */
  overrides: Partial<CoachTheme>
  wording: Wording
  modules: Record<ModuleId, boolean>
  menu: ModuleId[]
  homeWidgets: WidgetId[]
  tiers: Tier[]
  discordUrl?: string
}

const DEFAULT_WORDING: Wording = {
  home: "Home",
  courses: "Courses",
  calendar: "Calendar",
  community: "Community",
  journal: "Journal",
  ranking: "Ranking",
  ai: "AI assistant",
  student: "Student",
  students: "Students",
  lesson: "Lesson",
}

export const COACHES: Coach[] = [
  {
    slug: "northline",
    name: "Northline Trading",
    coachName: "Marco",
    mark: "N",
    tagline: "Futures day trading with a rulebook.",
    template: "terminal",
    overrides: {},
    wording: { ...DEFAULT_WORDING, courses: "Playbook", students: "Traders", student: "Trader", ai: "Ask Marco" },
    modules: { courses: true, calendar: true, community: true, journal: true, ranking: false, ai: true },
    menu: ["courses", "calendar", "journal", "community", "ai", "ranking"],
    homeWidgets: ["start-here", "next-lesson", "journal-week", "next-event", "econ", "announcement"],
    tiers: [
      { id: "core", name: "Core", price: "€149", cadence: "month", members: 141 },
      { id: "desk", name: "Trading Desk", price: "€390", cadence: "month", members: 37 },
      { id: "vip", name: "1:1 VIP", price: "€2,400", cadence: "quarter", members: 4 },
    ],
    discordUrl: "https://discord.gg/",
  },
  {
    slug: "sophia",
    name: "Sophia Lane Mentorship",
    coachName: "Sophia",
    mark: "SL",
    tagline: "Swing trading for people with a day job.",
    template: "atelier",
    overrides: {},
    wording: {
      ...DEFAULT_WORDING,
      courses: "Academy",
      calendar: "Sessions",
      community: "Circle",
      journal: "Trade diary",
      students: "Mentees",
      student: "Mentee",
      ai: "Study buddy",
    },
    modules: { courses: true, calendar: true, community: true, journal: true, ranking: false, ai: true },
    menu: ["courses", "calendar", "community", "journal", "ai", "ranking"],
    homeWidgets: ["start-here", "first-week", "next-lesson", "next-event", "announcement"],
    tiers: [
      { id: "academy", name: "Academy", price: "€79", cadence: "month", members: 412 },
      { id: "circle", name: "Inner Circle", price: "€249", cadence: "month", members: 58 },
    ],
  },
  {
    slug: "kairo",
    name: "Kairo FX",
    coachName: "Kairo",
    mark: "K",
    tagline: "Forex and prop firm challenges, done properly.",
    template: "pulse",
    overrides: { primary: "#6b3dff" },
    wording: { ...DEFAULT_WORDING, courses: "Bootcamp", calendar: "Live room", ai: "Kairo AI" },
    modules: { courses: true, calendar: true, community: true, journal: true, ranking: true, ai: true },
    menu: ["courses", "calendar", "journal", "ranking", "community", "ai"],
    homeWidgets: ["start-here", "next-lesson", "rank", "journal-week", "next-event", "econ"],
    tiers: [
      { id: "free", name: "Free", price: "€0", cadence: "month", members: 1830 },
      { id: "pro", name: "Pro", price: "€99", cadence: "month", members: 266 },
      { id: "funded", name: "Funded Track", price: "€990", cadence: "once", members: 31 },
    ],
  },
]

export function getCoach(slug: string) {
  return COACHES.find((c) => c.slug === slug)
}
