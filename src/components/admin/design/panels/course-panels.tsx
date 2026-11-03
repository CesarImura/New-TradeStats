"use client"

import { useMemo } from "react"
import { ArrowDown, ArrowLeft, ArrowUp } from "@/components/icons"
import { themeVars } from "@/lib/theme/css"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { courseSections, type CoursePageDraft, type CourseSectionId } from "@/lib/data/course-page"
import { cn } from "@/lib/utils"
import { Field, Segmented } from "../fields/controls"
import { useDesign } from "../fields/design-fields"
import { EASE } from "../states"
import { TILE_IDLE } from "../thumbs/option-art"
import { menuRow, SortableMenu, SortHandle, SortHint, SWITCH_OFF } from "../fields/menu-sort"
import { InspectorTop } from "./widget-inspector"

/** The course page's draft and how to save it: one step in Undo per change, like every other setting. */
function useCoursePage() {
  const { working, commit } = useDesign()
  const page: CoursePageDraft = working.content.coursePage ?? {}
  const set = (next: CoursePageDraft, key: string) => commit({ ...working, content: { ...working.content, coursePage: next } }, `course-${key}`)
  return { page, set }
}

/**
 * The page inside a course, drawn (64 × 40) like the editor's other pictures (option-art.tsx): a framed card in the coach's
 * draft colours (page, card, text) with the brand colour as the one accent, and its corner radius. Never a fixed hex.
 */
function CoursePageArt() {
  const { theme } = useDesign()
  const well = useMemo(() => {
    const v = themeVars(theme) as Record<string, string>
    return { "--a-page": v["--background"], "--a-card": v["--card"], "--a-accent": v["--brand-mark"] ?? v["--primary"], color: v["--foreground"] } as React.CSSProperties
  }, [theme])
  const rx = Math.max(0.5, Math.min(8, theme.radius / 3))
  return (
    // The well is the draft's page colour, like the editor's other pictures.
    <span aria-hidden className="block overflow-hidden rounded-[7px]" style={{ ...well, background: "var(--a-page)" }}>
      <svg viewBox="0 0 64 40" className="block aspect-[8/5] w-full" fill="none">
        <rect x="9" y="5" width="46" height="30" rx={rx} fill="var(--a-card)" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.2" />
        {/* The course name, and its picture with the play button */}
        <rect x="13" y="9" width="14" height="2" rx="1" fill="currentColor" opacity="0.35" />
        <rect x="13" y="13.5" width="10" height="3.5" rx="1.75" fill="currentColor" opacity="0.85" />
        <circle cx="46" cy="13" r="4.5" fill="var(--a-accent)" />
        <path d="M44.8 10.9 L48.6 13 L44.8 15.1 Z" fill="var(--a-page)" />
        {/* Two lessons, the first one done */}
        {[0, 1].map((i) => (
          <g key={i}>
            <rect x="13" y={21 + i * 6.5} width="38" height="4.5" rx="1.5" fill="currentColor" fillOpacity="0.08" />
            <circle cx="16.2" cy={23.25 + i * 6.5} r="1.4" fill={i === 0 ? "var(--a-accent)" : "none"} stroke={i === 0 ? "none" : "currentColor"} strokeOpacity="0.5" strokeWidth="0.7" />
            <rect x="20" y={22.4 + i * 6.5} width={i === 0 ? 24 : 17} height="1.7" rx="0.85" fill="currentColor" fillOpacity="0.5" />
          </g>
        ))}
      </svg>
    </span>
  )
}

/** On Playbook's widgets panel: the way into the page inside a course, as a picture tile like the editor's other choices. */
export function CoursePageLink({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="border-t border-[color:color-mix(in_oklab,var(--foreground)_10%,transparent)] px-5 pt-4 pb-6">
      <p className="mb-2.5 px-0.5 font-[family-name:var(--ff-geist-mono)] text-[0.6875rem] font-medium tracking-[0.08em] text-muted-foreground uppercase">Other screen</p>
      <button
        type="button"
        onClick={onOpen}
        className={cn("group/opt flex w-full items-center gap-3 rounded-[10px] border p-1 pr-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] active:scale-[0.99] motion-reduce:active:scale-100", EASE, TILE_IDLE)}
      >
        <span className="w-[84px] shrink-0">
          <CoursePageArt />
        </span>
        <span className="grid min-w-0 flex-1 gap-0.5">
          <span className="truncate text-[0.8125rem] font-semibold text-foreground">Course page</span>
          <span className="truncate text-[0.6875rem] text-muted-foreground">Each course</span>
        </span>
      </button>
    </div>
  )
}

/** Inside the course page: the way back to Playbook, a button like the editor's other actions. */
export function BackToPlaybook({ onBack }: { onBack: () => void }) {
  return (
    <div className="px-5 pt-1 pb-4">
      <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={onBack}>
        <ArrowLeft /> Back to Playbook
      </Button>
    </div>
  )
}

/** Left: the sections of the page inside a course, top to bottom. Drag one by its handle, switch it off, or select it to edit it on the right. */
export function CourseSections({ selected, onSelect }: { selected: CourseSectionId | null; onSelect: (id: CourseSectionId | null) => void }) {
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
      <p className="text-xs leading-4 text-muted-foreground">Select a section to edit it. Drag to move it, or switch it off.</p>
      <SortHint home={false} />
      <SortableMenu<CourseSectionId>
        items={list.map((s) => s.id)}
        nameOf={(id) => byId.get(id)?.label ?? id}
        onSave={(order, key) => set({ ...page, order }, key)}
        row={(id) => {
          const s = byId.get(id)!
          const on = selected === id
          return (
            <div data-field={`course-${id}`} className={cn(menuRow(!s.on), "gap-1 py-2", on && "border-[var(--ts-interactive)] bg-white/[0.05] hover:border-[var(--ts-interactive)]")}>
              <SortHandle />
              <button type="button" aria-pressed={on} onClick={() => onSelect(on ? null : id)} className="grid min-w-0 flex-1 rounded-md py-0.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]">
                <span className={cn("text-sm font-medium", !s.on && "text-muted-foreground line-through")}>{s.label}</span>
                <span className="text-xs text-muted-foreground">{s.hint}</span>
              </button>
              <Switch size="sm" className={SWITCH_OFF} checked={s.on} aria-label={`Show ${s.label}`} onCheckedChange={(v) => toggle(id, v)} />
            </div>
          )
        }}
      />
    </div>
  )
}

/** Right: the selected section (what it is, whether it shows, where it sits, and its own settings), or a prompt to pick one. */
export function CourseInspector({ selected, onSelect }: { selected: CourseSectionId | null; onSelect: (id: CourseSectionId | null) => void }) {
  const { page, set } = useCoursePage()
  const list = courseSections(page)
  const at = list.findIndex((s) => s.id === selected)
  const section = at >= 0 ? list[at] : null
  if (!section) {
    return (
      <div>
        <InspectorTop>
          <span className="truncate text-[0.875rem] font-semibold">Course page</span>
        </InspectorTop>
        <div className="grid gap-3 px-5 pb-5">
          <p className="text-xs leading-4 text-muted-foreground">The page inside a course, the same for every course. Select a section on the left to edit it.</p>
        </div>
      </div>
    )
  }
  const toggle = (on: boolean) => {
    const hidden = (page.hidden ?? []).filter((x) => x !== section.id)
    set({ ...page, hidden: on ? hidden : [...hidden, section.id] }, `show-${section.id}`)
  }
  const move = (by: -1 | 1) => {
    const order = list.map((s) => s.id)
    const [id] = order.splice(at, 1)
    order.splice(at + by, 0, id)
    set({ ...page, order }, `move-${section.id}`)
  }
  return (
    <div>
      <InspectorTop onClose={() => onSelect(null)}>
        <span className="truncate text-[0.875rem] font-semibold">{section.label}</span>
      </InspectorTop>
      <div className="grid gap-5 px-5 pb-5">
        <p className="text-xs leading-4 text-muted-foreground">{section.hint}.</p>
        <Field label="Show on the page">
          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <span className="text-sm">{section.on ? "Shown to students" : "Hidden"}</span>
            <Switch size="sm" className={SWITCH_OFF} checked={section.on} aria-label={`Show ${section.label}`} onCheckedChange={toggle} />
          </div>
        </Field>
        <Field label="Position" hint={`${at + 1} of ${list.length}`}>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" disabled={at === 0} onClick={() => move(-1)}>
              <ArrowUp /> Move up
            </Button>
            <Button variant="outline" size="sm" disabled={at === list.length - 1} onClick={() => move(1)}>
              <ArrowDown /> Move down
            </Button>
          </div>
        </Field>
        {section.id === "hero" && (
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
        )}
        {section.id === "modules" && (
          <>
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
          </>
        )}
      </div>
    </div>
  )
}
