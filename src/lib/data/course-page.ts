/**
 * The page inside a course, one layout for every course. The coach edits it in Design → Course: which sections show,
 * in what order, how the header looks and how lessons are drawn.
 */

export type CourseSectionId = "hero" | "continue" | "modules" | "coach" | "others"

export const COURSE_SECTIONS: { id: CourseSectionId; label: string; hint: string }[] = [
  { id: "hero", label: "Course header", hint: "Title, progress and the Start button" },
  { id: "continue", label: "Keep watching", hint: "The lesson they stopped at, and what comes next" },
  { id: "modules", label: "Modules and lessons", hint: "Everything in the course" },
  { id: "coach", label: "Your coach", hint: "Who teaches it" },
  { id: "others", label: "More courses", hint: "Other courses they can open" },
]

export type CoursePageDraft = {
  /** The order of the sections. Missing ones follow, in the standard order. */
  order?: CourseSectionId[]
  /** Sections the coach switched off. */
  hidden?: CourseSectionId[]
  /** Header: the course picture on top (banner), or the words alone (plain). */
  hero?: "banner" | "plain"
  /** Lessons: a list, or cards with a picture from the video. */
  lessons?: "list" | "cards"
}

/** The sections in the coach's order, each with whether it shows. */
export function courseSections(d: CoursePageDraft | undefined) {
  const order = [...(d?.order ?? []), ...COURSE_SECTIONS.map((s) => s.id).filter((id) => !(d?.order ?? []).includes(id))]
  return order.map((id) => ({ ...COURSE_SECTIONS.find((s) => s.id === id)!, on: !d?.hidden?.includes(id) }))
}
