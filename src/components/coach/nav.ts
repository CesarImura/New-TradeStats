import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ChartCandlestick,
  CreditCard,
  GraduationCap,
  House,
  LayoutDashboard,
  MessagesSquare,
  MessageSquareText,
  NotebookPen,
  Palette,
  Settings,
  Sparkles,
  Trophy,
  Users,
  type LucideIcon,
} from "@/components/icons"
import type { Coach, ModuleId } from "@/lib/data/coaches"

export type NavItem = { id: string; label: string; href: string; icon: LucideIcon; screens: string }

const MODULE_ICON: Record<ModuleId, LucideIcon> = {
  courses: BookOpen,
  calendar: CalendarDays,
  charts: ChartCandlestick,
  community: MessagesSquare,
  discord: MessageSquareText,
  journal: NotebookPen,
  ranking: Trophy,
  ai: Sparkles,
}

/** Screen IDs from the platform map, shown on placeholder pages. */
export const MODULE_SCREENS: Record<ModuleId, string> = {
  courses: "STU-02 to STU-05, STU-29",
  calendar: "STU-06 to STU-09, STU-27",
  charts: "STU-32, STU-33",
  community: "STU-30",
  discord: "STU-11",
  journal: "STU-13 to STU-16, STU-28",
  ranking: "STU-25, STU-26",
  ai: "STU-17, STU-18",
}

/** The student menu: only modules the coach switched on, in the coach's order and words. */
export function studentNav(coach: Coach, base: string): NavItem[] {
  return [
    { id: "home", label: coach.wording.home, href: base, icon: House, screens: "STU-01" },
    ...coach.menu
      .filter((m) => coach.modules[m])
      .map((m) => ({
        id: m,
        label: coach.wording[m],
        href: `${base}/${m}`,
        icon: MODULE_ICON[m],
        screens: MODULE_SCREENS[m],
      })),
  ]
}

/** The admin menu is the same for every community, in our words, not the coach's. */
export function adminNav(_coach: Coach, base: string): { group: string; items: NavItem[] }[] {
  return [
    {
      group: "Today",
      items: [{ id: "overview", label: "Overview", href: base, icon: LayoutDashboard, screens: "ADM-01" }],
    },
    {
      group: "Coaching",
      items: [
        { id: "students", label: "Students", href: `${base}/students`, icon: Users, screens: "ADM-02 to ADM-07" },
        { id: "journal", label: "Journal & feedback", href: `${base}/journal`, icon: NotebookPen, screens: "ADM-05, ADM-06, ADM-16" },
        { id: "content", label: "Content", href: `${base}/content`, icon: GraduationCap, screens: "ADM-08 to ADM-15" },
        { id: "calendar", label: "Calendar", href: `${base}/calendar`, icon: CalendarDays, screens: "ADM-19 to ADM-23" },
        { id: "charts", label: "Charts", href: `${base}/charts`, icon: ChartCandlestick, screens: "ADM-57, ADM-58" },
        { id: "community", label: "Community", href: `${base}/community`, icon: MessagesSquare, screens: "ADM-17, ADM-18" },
        { id: "ai", label: "AI assistant", href: `${base}/ai`, icon: Sparkles, screens: "ADM-24 to ADM-28" },
      ],
    },
    {
      group: "Business",
      items: [
        { id: "sales", label: "Sales & payments", href: `${base}/sales`, icon: CreditCard, screens: "ADM-29 to ADM-36, ADM-41" },
        { id: "ranking", label: "Ranking", href: `${base}/ranking`, icon: BarChart3, screens: "ADM-53, ADM-54" },
      ],
    },
    {
      group: "Platform",
      items: [
        { id: "design", label: "Design", href: `${base}/design`, icon: Palette, screens: "ADM-37 to ADM-44" },
        { id: "settings", label: "Settings", href: `${base}/settings`, icon: Settings, screens: "ADM-45 to ADM-52" },
      ],
    },
  ]
}
