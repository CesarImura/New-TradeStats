import type { Coach } from "@/lib/data/coaches"

/** What a student can switch on in Profile › Notifications. `email` is the consent to get the same notices by e-mail. */
export type StudentNoticePrefs = { feedback: boolean; lessons: boolean; events: boolean; community: boolean; email: boolean; /** When the student switched e-mail on (the consent record of the prototype); empty while it is off. */ emailSince?: string }

/**
 * In-app notices are on from the start (they only show in the app); e-mail is OFF until the student switches it on
 * (decision 21/11: consent has to be an action, never a default; GDPR art. 7 and the ePrivacy rules for non-service e-mail).
 */
export const DEFAULT_STUDENT_PREFS: StudentNoticePrefs = { feedback: true, lessons: true, events: true, community: false, email: false }

export const STUDENT_PREFS_KEY = "notifications"
export const STUDENT_READ_KEY = "student-notification-read"

export type StudentNotice = { id: string; kind: Exclude<keyof StudentNoticePrefs, "email">; title: string; detail: string; time: string; href: string }

/** Sample notices of the demo communities, in the coach's own words. A platform made in setup has none yet. */
export function studentNotices(coach: Coach): StudentNotice[] {
  const lesson = coach.wording.lesson
  return [
    { id: "s1", kind: "feedback", title: `${coach.coachName} answered your trade`, detail: "NQ long · Entries that don't chase", time: "2h", href: "journal" },
    { id: "s2", kind: "events", title: "Live trading starts in 1 hour", detail: "NY open, live trading", time: "Today", href: "calendar" },
    { id: "s3", kind: "lessons", title: `New ${lesson.toLowerCase()}: Daily loss limits`, detail: "Risk management", time: "Yesterday", href: "courses" },
    { id: "s4", kind: "community", title: "Announcement: weekly review moved", detail: "Friday, 17:00 CET", time: "2d", href: "community" },
  ]
}

/** Which notices show: only the kinds the student switched on. */
export const visibleStudentNotices = (list: StudentNotice[], prefs: StudentNoticePrefs) => list.filter((n) => prefs[n.kind])
