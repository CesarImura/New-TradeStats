import type { CoachTheme, TemplateId } from "@/lib/theme/types"
import type { HomeLayouts, PageLayouts } from "@/lib/widgets/layout"
import { CircleHelp, Download, FileText, Flag, Gift, Info, Lightbulb, Link2, Star, Users, type LucideIcon } from "@/components/icons"
import { customCommunities } from "./communities"

export type ModuleId = "courses" | "calendar" | "charts" | "community" | "journal" | "ranking" | "ai" | "downloads" | "partners"

/** An id in the student menu: a module, or `page:<id>` for a page the coach added. */
export type MenuId = ModuleId | `page:${string}`
export const isPageId = (m: string): m is `page:${string}` => m.startsWith("page:")
export const pageIdOf = (m: string) => m.slice(5)

export type PageIcon = "star" | "file" | "link" | "download" | "flag" | "gift" | "info" | "lightbulb" | "help" | "users"

export const PAGE_ICONS: Record<PageIcon, LucideIcon> = {
  star: Star,
  file: FileText,
  link: Link2,
  download: Download,
  flag: Flag,
  gift: Gift,
  info: Info,
  lightbulb: Lightbulb,
  help: CircleHelp,
  users: Users,
}

/** A page the coach added to the student menu. Built from widgets like every other page; its layout lives in `Coach.pages["page:<id>"]`. */
export type CustomPage = { id: string; name: string; icon: PageIcon; on?: boolean }

/** Words the coach can rename. Keys are ours; values are what students see. */
export type Wording = {
  home: string
  courses: string
  calendar: string
  charts: string
  community: string
  journal: string
  ranking: string
  ai: string
  downloads: string
  partners: string
  student: string
  students: string
  lesson: string
}

export type Tier = { id: string; name: string; price: string; cadence: string; members: number }

export type Coach = {
  slug: string
  /** The coach's business. One business can run several communities. */
  org: string
  name: string
  coachName: string
  /** Short mark shown in the logo tile when there is no uploaded logo. */
  mark: string
  logo?: string
  tagline: string
  template: TemplateId
  /** What the coach changed on top of the template. */
  overrides: Partial<CoachTheme>
  wording: Wording
  modules: Record<ModuleId, boolean>
  menu: MenuId[]
  /** Pages the coach added to the menu (each is in `menu` as `page:<id>`). */
  customPages?: CustomPage[]
  /** Older communities (and the setup wizard) keep Home's layouts here; resolveCoach moves them into pages.home. */
  home?: HomeLayouts
  /** Layouts the coach built, per page and tier. Without one, Home follows the template and a module page is just its core widget. */
  pages?: PageLayouts
  tiers: Tier[]
  discordUrl?: string
}

export const DEFAULT_WORDING: Wording = {
  home: "Home",
  courses: "Courses",
  calendar: "Calendar",
  charts: "Charts",
  community: "Community",
  journal: "Journal",
  ranking: "Ranking",
  ai: "AI assistant",
  downloads: "Downloads",
  partners: "Partners",
  student: "Student",
  students: "Students",
  lesson: "Lesson",
}

export const COACHES: Coach[] = [
  {
    slug: "northline",
    org: "Northline",
    name: "Northline Trading",
    coachName: "Marco",
    mark: "N",
    tagline: "Futures day trading with a rulebook.",
    template: "terminal",
    overrides: {},
    wording: { ...DEFAULT_WORDING, courses: "Playbook", charts: "Desk", students: "Traders", student: "Trader", ai: "Ask Marco" },
    modules: { courses: true, calendar: true, charts: true, community: true, journal: true, ranking: false, ai: true, downloads: true, partners: true },
    menu: ["courses", "calendar", "charts", "journal", "community", "ai", "ranking", "downloads", "partners"],
    tiers: [
      { id: "core", name: "Core", price: "€149", cadence: "month", members: 141 },
      { id: "desk", name: "Trading Desk", price: "€390", cadence: "month", members: 37 },
      { id: "vip", name: "1:1 VIP", price: "€2,400", cadence: "quarter", members: 4 },
    ],
    discordUrl: "https://discord.gg/",
  },
  {
    slug: "sophia",
    org: "Sophia Lane",
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
    modules: { courses: true, calendar: true, charts: false, community: true, journal: true, ranking: false, ai: true, downloads: true, partners: false },
    menu: ["courses", "calendar", "community", "journal", "charts", "ai", "ranking", "downloads", "partners"],
    tiers: [
      { id: "academy", name: "Academy", price: "€79", cadence: "month", members: 412 },
      { id: "circle", name: "Inner Circle", price: "€249", cadence: "month", members: 58 },
    ],
  },
  {
    slug: "kairo",
    org: "Kairo FX",
    name: "Kairo FX",
    coachName: "Kairo",
    mark: "K",
    tagline: "Forex and prop firm challenges, done properly.",
    template: "pulse",
    overrides: { primary: "#6b3dff" },
    wording: { ...DEFAULT_WORDING, courses: "Bootcamp", calendar: "Live room", charts: "Markets", ai: "Kairo AI" },
    modules: { courses: true, calendar: true, charts: true, community: true, journal: true, ranking: true, ai: true, downloads: true, partners: true },
    menu: ["courses", "charts", "calendar", "journal", "ranking", "community", "ai", "downloads", "partners"],
    tiers: [
      { id: "free", name: "Free", price: "€0", cadence: "month", members: 1830 },
      { id: "pro", name: "Pro", price: "€99", cadence: "month", members: 266 },
      { id: "funded", name: "Funded Track", price: "€990", cadence: "once", members: 31 },
    ],
  },
  {
    slug: "northline-options",
    org: "Northline",
    name: "Northline Options Lab",
    coachName: "Marco",
    mark: "NO",
    tagline: "A second community: options income strategies.",
    template: "terminal",
    overrides: { primary: "#16a34a", mode: "light", nav: { layout: "top", style: "labels", logo: "left" } },
    wording: { ...DEFAULT_WORDING, courses: "Lab", students: "Members", student: "Member" },
    modules: { courses: true, calendar: true, charts: false, community: true, journal: false, ranking: false, ai: false, downloads: true, partners: false },
    menu: ["courses", "calendar", "community", "journal", "charts", "ai", "ranking", "downloads", "partners"],
    tiers: [{ id: "lab", name: "Lab", price: "€59", cadence: "month", members: 96 }],
  },
]

/** One of the demo communities that ship with the prototype (known on the server too). */
export function getDemoCoach(slug: string) {
  return COACHES.find((c) => c.slug === slug)
}

/** A demo community, or in the browser also one created with the setup wizard. */
export function getCoach(slug: string): Coach | undefined {
  return getDemoCoach(slug) ?? customCommunities().find((c) => c.slug === slug)
}

/** Addresses the wizard can create. The server can't see them, so it only checks the format. */
export function isCommunitySlug(slug: string) {
  return /^[a-z0-9][a-z0-9-]{1,39}$/.test(slug)
}
