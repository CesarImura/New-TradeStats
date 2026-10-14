"use client"

import { Fragment, useState } from "react"
import { Check, ChevronRight, Eye, Minus, RotateCcw } from "lucide-react"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  GROUP_RULES,
  courseTiers,
  moduleTiers,
  saveAccess,
  setPreviewAs,
  useAccess,
  useGroups,
  useTiers,
  type GroupRule,
  type PreviewAs,
} from "@/lib/data/access"
import { saveCatalog, useCatalog, type Course } from "@/lib/data/learning"
import { STUDENTS, tierFor } from "@/lib/data/people"
import { cn } from "@/lib/utils"
import { Mono } from "../kit"

/**
 * ADM-14: areas, courses and modules × tiers and groups. Access is set high up
 * and inherited downwards; a module can differ from its course. Groups decide
 * when their members get a course (drip from the group's start).
 */
export function AccessOverview() {
  const { coach } = useCoach()
  const catalog = useCatalog(coach)
  const tiers = useTiers(coach)
  const groups = useGroups(coach)
  const access = useAccess(coach.slug)
  const [openCourses, setOpenCourses] = useState<string[]>([])
  const all = tiers.map((t) => t.id)
  const courses = catalog.courses.filter((c) => c.status !== "archived")
  const areas = catalog.areas.filter((a) => courses.some((c) => c.area === a))

  const setCourseTiers = (ids: string[], tier: string, on: boolean) =>
    saveCatalog(coach, (c) => ({
      ...c,
      courses: c.courses.map((co) => {
        if (!ids.includes(co.id)) return co
        const current = courseTiers(co, all)
        const next = on ? [...new Set([...current, tier])] : current.filter((t) => t !== tier)
        return { ...co, tiers: next.length === all.length ? [] : next }
      }),
    }))

  const setModule = (course: Course, moduleId: string, tier: string, on: boolean) =>
    saveAccess(coach.slug, (a) => {
      const current = moduleTiers(a, course, moduleId, all)
      const next = on ? [...new Set([...current, tier])] : current.filter((t) => t !== tier)
      return { ...a, modules: { ...a.modules, [`${course.id}/${moduleId}`]: next } }
    })

  const resetModule = (course: Course, moduleId: string) =>
    saveAccess(coach.slug, (a) => {
      const modules = { ...a.modules }
      delete modules[`${course.id}/${moduleId}`]
      return { ...a, modules }
    })

  const setRule = (courseId: string, groupId: string, rule: GroupRule) =>
    saveAccess(coach.slug, (a) => ({ ...a, groups: { ...a.groups, [`${courseId}/${groupId}`]: rule } }))

  const cols = tiers.length + groups.length

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Set access on an area or a course and everything inside follows. Open a course to give one module to a different tier. Groups decide when their members get each course.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border p-0.5 text-sm" role="radiogroup" aria-label="Locked content">
            {(
              [
                ["show", "Show locked, with upgrade"],
                ["hide", "Hide locked"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                role="radio"
                aria-checked={access.locked === v}
                onClick={() => saveAccess(coach.slug, (a) => ({ ...a, locked: v }))}
                className={cn("rounded-md px-2.5 py-1 text-muted-foreground", access.locked === v && "bg-muted text-foreground")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th className="w-[38%] px-3 py-2 text-left font-normal" rowSpan={2}>
                <Mono className="text-muted-foreground">Content</Mono>
              </th>
              <th colSpan={tiers.length} className="border-l px-3 pt-2 text-left font-normal">
                <Mono className="text-muted-foreground">Tiers</Mono>
              </th>
              {groups.length > 0 && (
                <th colSpan={groups.length} className="border-l px-3 pt-2 text-left font-normal">
                  <Mono className="text-muted-foreground">Groups · opens</Mono>
                </th>
              )}
            </tr>
            <tr className="border-b">
              {tiers.map((t, i) => (
                <th key={t.id} className={cn("px-2 pb-2 text-center text-xs font-medium", i === 0 && "border-l")}>
                  {t.name}
                </th>
              ))}
              {groups.map((g, i) => (
                <th key={g.id} className={cn("px-2 pb-2 text-center text-xs font-medium", i === 0 && "border-l")}>
                  {g.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {areas.map((area) => {
              const inArea = courses.filter((c) => c.area === area)
              return (
                <Fragment key={area}>
                  <tr className="border-b bg-muted/40">
                    <td className="px-3 py-2 font-medium">{area}</td>
                    {tiers.map((t, i) => {
                      const n = inArea.filter((c) => courseTiers(c, all).includes(t.id)).length
                      const state = n === inArea.length ? "on" : n === 0 ? "off" : "some"
                      return (
                        <td key={t.id} className={cn("text-center", i === 0 && "border-l")}>
                          <Cell
                            state={state}
                            label={`${area} for ${t.name}`}
                            onClick={() =>
                              setCourseTiers(
                                inArea.map((c) => c.id),
                                t.id,
                                state !== "on",
                              )
                            }
                          />
                        </td>
                      )
                    })}
                    {groups.map((g, i) => (
                      <td key={g.id} className={cn(i === 0 && "border-l")} />
                    ))}
                  </tr>
                  {inArea.map((c) => {
                    const expanded = openCourses.includes(c.id)
                    return (
                      <Fragment key={c.id}>
                        <tr className="border-b">
                          <td className="py-1.5 pr-3 pl-5">
                            <button
                              onClick={() => setOpenCourses((o) => (expanded ? o.filter((x) => x !== c.id) : [...o, c.id]))}
                              className="flex items-center gap-1.5 text-left"
                              aria-expanded={expanded}
                            >
                              <ChevronRight className={cn("size-3.5 text-muted-foreground transition-transform", expanded && "rotate-90")} />
                              {c.title}
                              {c.status !== "published" && <span className="text-xs text-muted-foreground">· {c.status}</span>}
                            </button>
                          </td>
                          {tiers.map((t, i) => (
                            <td key={t.id} className={cn("text-center", i === 0 && "border-l")}>
                              <Cell
                                state={courseTiers(c, all).includes(t.id) ? "on" : "off"}
                                label={`${c.title} for ${t.name}`}
                                onClick={() => setCourseTiers([c.id], t.id, !courseTiers(c, all).includes(t.id))}
                              />
                            </td>
                          ))}
                          {groups.map((g, i) => {
                            const rule = access.groups[`${c.id}/${g.id}`] ?? "tier"
                            return (
                              <td key={g.id} className={cn("px-1.5 text-center", i === 0 && "border-l")}>
                                <select
                                  value={rule}
                                  onChange={(e) => setRule(c.id, g.id, e.target.value as GroupRule)}
                                  aria-label={`${c.title} for ${g.name}`}
                                  title={GROUP_RULES.find((r) => r.value === rule)?.label}
                                  className={cn(
                                    "h-7 rounded-md border border-transparent bg-transparent px-1 text-xs outline-none hover:border-input focus-visible:border-ring [&>option]:bg-popover",
                                    rule === "tier" ? "text-muted-foreground" : "text-foreground",
                                  )}
                                >
                                  {GROUP_RULES.map((r) => (
                                    <option key={r.value} value={r.value}>
                                      {r.short}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            )
                          })}
                        </tr>
                        {expanded &&
                          c.modules.map((m) => {
                            const overridden = !!access.modules[`${c.id}/${m.id}`]
                            const list = moduleTiers(access, c, m.id, all)
                            return (
                              <tr key={m.id} className="border-b bg-muted/15">
                                <td className="py-1.5 pr-3 pl-11 text-muted-foreground">
                                  <span className="flex items-center gap-2">
                                    <span className="truncate">{m.title}</span>
                                    {overridden && (
                                      <button onClick={() => resetModule(c, m.id)} className="flex shrink-0 items-center gap-1 text-xs text-[var(--ts-orange)] hover:underline">
                                        <RotateCcw className="size-3" /> follow course
                                      </button>
                                    )}
                                  </span>
                                </td>
                                {tiers.map((t, i) => (
                                  <td key={t.id} className={cn("text-center", i === 0 && "border-l")}>
                                    <Cell
                                      state={list.includes(t.id) ? "on" : "off"}
                                      inherited={!overridden}
                                      label={`${m.title} for ${t.name}`}
                                      onClick={() => setModule(c, m.id, t.id, !list.includes(t.id))}
                                    />
                                  </td>
                                ))}
                                {groups.map((g, i) => (
                                  <td key={g.id} className={cn("text-center text-xs text-muted-foreground", i === 0 && "border-l")}>
                                    ·
                                  </td>
                                ))}
                              </tr>
                            )
                          })}
                      </Fragment>
                    )
                  })}
                </Fragment>
              )
            })}
            {courses.length === 0 && (
              <tr>
                <td colSpan={cols + 1} className="px-3 py-10 text-center text-muted-foreground">
                  No courses yet. Add one in Content and it shows up here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Cell state="on" label="" /> Included
        </span>
        <span className="flex items-center gap-1.5">
          <Cell state="on" inherited label="" /> Follows the course
        </span>
        <span className="flex items-center gap-1.5">
          <Cell state="some" label="" /> Some courses
        </span>
        <span>Groups: “Tier” follows the member&apos;s tier; “+7 d” opens 7 days after the group starts.</span>
      </div>
    </div>
  )
}

function Cell({ state, inherited, label, onClick }: { state: "on" | "off" | "some"; inherited?: boolean; label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={state === "on"}
      tabIndex={onClick ? undefined : -1}
      className={cn(
        "mx-auto my-1 grid size-6 place-items-center rounded-[5px] border transition-colors",
        state === "off" && "border-input hover:border-foreground/40",
        state === "some" && "border-[var(--ts-yellow)]/60 text-[var(--ts-yellow)]",
        state === "on" && !inherited && "border-[var(--ts-yellow)] bg-[var(--ts-yellow)] text-[#0a0a0a]",
        state === "on" && inherited && "border-[var(--ts-yellow)]/40 text-[var(--ts-yellow)]/80",
        !onClick && "pointer-events-none",
      )}
    >
      {state === "on" ? <Check className="size-3.5" strokeWidth={3} /> : state === "some" ? <Minus className="size-3.5" strokeWidth={3} /> : null}
    </button>
  )
}

/** ADM-15: see the student side as a tier, a group or one student. Opens it in a new tab. */
export function PreviewAsMenu({ size = "default" }: { size?: "default" | "sm" }) {
  const { coach } = useCoach()
  const tiers = useTiers(coach)
  const groups = useGroups(coach)
  const go = (p: PreviewAs, path = "") => {
    setPreviewAs(coach.slug, p)
    window.open(`/c/${coach.slug}${path}`, "_blank")
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size={size} />}>
        <Eye /> Preview as
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel>A tier</DropdownMenuLabel>
          {tiers.map((t) => (
            <DropdownMenuItem key={t.id} onClick={() => go({ kind: "tier", id: t.id, label: t.name })}>
              {t.name}
              <span className="ml-auto text-xs text-muted-foreground">{t.price}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        {groups.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>A group</DropdownMenuLabel>
              {groups.map((g) => (
                <DropdownMenuItem key={g.id} onClick={() => go({ kind: "group", id: g.id, label: g.name }, "/courses")}>
                  {g.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>One student</DropdownMenuLabel>
          {STUDENTS.slice(0, 4).map((s) => {
            const t = tierFor(coach, s.tier)
            return (
              <DropdownMenuItem key={s.id} onClick={() => go({ kind: "tier", id: t.id, label: `${s.name} · ${t.name}` })}>
                {s.name}
                <span className="ml-auto text-xs text-muted-foreground">{t.name}</span>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
