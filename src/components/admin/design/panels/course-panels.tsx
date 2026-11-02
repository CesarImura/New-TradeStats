"use client"

import { Switch } from "@/components/ui/switch"
import { courseSections, type CoursePageDraft, type CourseSectionId } from "@/lib/data/course-page"
import { cn } from "@/lib/utils"
import { Field, Segmented } from "../fields/controls"
import { useDesign } from "../fields/design-fields"
import { menuRow, SortableMenu, SortHandle, SortHint, SWITCH_OFF } from "../fields/menu-sort"
import { InspectorTop } from "./widget-inspector"

/** The course page's draft and how to save it: one step in Undo per change, like every other setting. */
function useCoursePage() {
  const { working, commit } = useDesign()
  const page: CoursePageDraft = working.content.coursePage ?? {}
  const set = (next: CoursePageDraft, key: string) => commit({ ...working, content: { ...working.content, coursePage: next } }, `course-${key}`)
  return { page, set }
}

/** Left: the sections of the page inside a course, top to bottom. Drag one by its handle, or switch it off. */
export function CourseSections() {
  const { page, set } = useCoursePage()
  const list = courseSections(page)
  const byId = new Map(list.map((s) => [s.id, s]))
  const toggle = (id: CourseSectionId, on: boolean) => {
    const hidden = (page.hidden ?? []).filter((x) => x !== id)
    set({ ...page, hidden: on ? hidden : [...hidden, id] }, `show-${id}`)
  }
  return (
    // The hairline under the title, like every other section.
    <div className="grid gap-4 border-t border-[color:color-mix(in_oklab,var(--foreground)_10%,transparent)] px-5 pt-6 pb-6">
      <p className="text-xs leading-4 text-muted-foreground">One page for every course. Drag a section to move it, or switch it off.</p>
      <SortHint home={false} />
      <SortableMenu<CourseSectionId>
        items={list.map((s) => s.id)}
        nameOf={(id) => byId.get(id)?.label ?? id}
        onSave={(order, key) => set({ ...page, order }, key)}
        row={(id) => {
          const s = byId.get(id)!
          return (
            <div data-field={`course-${id}`} className={cn(menuRow(!s.on), "gap-1 py-2")}>
              <SortHandle />
              <span className="grid min-w-0 flex-1">
                <span className={cn("text-sm font-medium", !s.on && "text-muted-foreground line-through")}>{s.label}</span>
                <span className="text-xs text-muted-foreground">{s.hint}</span>
              </span>
              <Switch size="sm" className={SWITCH_OFF} checked={s.on} aria-label={`Show ${s.label}`} onCheckedChange={(on) => toggle(id, on)} />
            </div>
          )
        }}
      />
    </div>
  )
}

/** Right: how the header and the lessons look. */
export function CourseInspector() {
  const { page, set } = useCoursePage()
  return (
    <div>
      <InspectorTop>
        <span className="truncate text-[0.9375rem] font-semibold">Course page</span>
      </InspectorTop>
      <div className="grid gap-5 px-5 pb-5">
        <Field label="Header">
          <Segmented
            label="Header"
            value={page.hero ?? "banner"}
            onChange={(hero) => set({ ...page, hero }, "hero")}
            options={[
              { value: "banner", label: "With picture", hint: "The course picture above the title" },
              { value: "plain", label: "Words only", hint: "Just the title and progress" },
            ]}
          />
        </Field>
        <Field label="Lessons">
          <Segmented
            label="Lessons"
            value={page.lessons ?? "list"}
            onChange={(lessons) => set({ ...page, lessons }, "lessons")}
            options={[
              { value: "list", label: "List", hint: "One line per lesson" },
              { value: "cards", label: "Cards", hint: "A picture from the video, the play button and a Done mark" },
            ]}
          />
        </Field>
        <p className="text-xs leading-4 text-muted-foreground">The picture of a lesson is its thumbnail (Admin → Content). Without one, the course cover shows.</p>
      </div>
    </div>
  )
}
