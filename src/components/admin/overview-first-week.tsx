"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Copy, ExternalLink, ListBulleted, Plus, RadioButtonChecked } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { AdminButton, AdminPageHeader, AdminProgress, EmptyState, Metric, Panel, StepIndicator, Tag } from "@/components/admin/ui"
import { useWizardCommunity, useSetupTasks, type TaskId } from "@/components/admin/setup-checklist"
import { useTiers } from "@/lib/data/access"
import { setStored, useStored } from "@/lib/prototype-store"
import { TEMPLATES } from "@/lib/theme/templates"
import { cn } from "@/lib/utils"

/**
 * Which Overview to show. A community with no students yet gets the first-week one; `?state=first-week` shows it
 * for any community (the prototype's way to review it), `?state=running` forces the everyday one.
 */
export function useFirstWeek(): "demo" | "new" | null {
  const params = useSearchParams()
  const { coach } = useCoach()
  const wizard = useWizardCommunity(coach.slug)
  const state = params.get("state")
  if (state === "first-week") return "demo"
  if (state === "running") return null
  return wizard && !wizard.setup?.invited ? "new" : null
}

/** The six steps, in Figma's order and words (524:9409), with a rough time for each. */
const STEPS: { id: TaskId; title: string; text: string; action: string; minutes: number }[] = [
  { id: "brand", title: "Pick your brand and template", text: "", action: "", minutes: 0 },
  { id: "membership", title: "Create your first membership", text: "", action: "", minutes: 0 },
  { id: "course", title: "Upload your first course", text: "Videos upload in the background", action: "Add a course", minutes: 5 },
  { id: "payouts", title: "Connect payouts", text: "Needed before your first sale", action: "Connect Stripe", minutes: 5 },
  { id: "live", title: "Schedule a livestream", text: "Students see it on their home", action: "Schedule", minutes: 2 },
  { id: "invite", title: "Invite your first students", text: "Import a list or share your link", action: "Invite", minutes: 3 },
]
/** What the review state (`?state=first-week`) shows as already done. */
const DEMO_DONE: TaskId[] = ["brand", "membership"]

const cadence = (c: string) => (c === "month" ? "/mo" : c === "year" ? "/yr" : c === "quarter" ? "/qtr" : "")

/** ADM-01, first week: a new community has no numbers yet, so the Overview leads with what to do next. Figma: Admin · 02 Overview 02. */
export function FirstWeekOverview({ demo }: { demo: boolean }) {
  const { coach, base, theme } = useCoach()
  const tasks = useSetupTasks()
  const tiers = useTiers(coach)
  const wizard = useWizardCommunity(coach.slug)
  const hiddenStored = useStored<boolean>(`${coach.slug}:setup-hidden`, false)
  const [hiddenDemo, setHiddenDemo] = useState(false)
  const hidden = demo ? hiddenDemo : hiddenStored
  const studentBase = base.replace("/admin/", "/c/")

  const done = (id: TaskId) => (demo ? DEMO_DONE.includes(id) : !!tasks.find((t) => t.id === id)?.done)
  const href = (id: TaskId) => tasks.find((t) => t.id === id)?.href ?? base
  const doneCount = STEPS.filter((s) => done(s.id)).length
  const minutes = STEPS.filter((s) => !done(s.id)).reduce((n, s) => n + s.minutes, 0)
  const tier = tiers.find((t) => t.name.trim() && Number(t.price.replace(/[^\d.,]/g, "").replace(",", ".")) > 0)
  const detail: Partial<Record<TaskId, string>> = {
    brand: `${coach.name} · ${TEMPLATES[theme.template]?.name ?? "Terminal"}`,
    membership: tier ? `${tier.name} · ${tier.price}${cadence(tier.cadence)}` : "Free or paid, your choice",
  }
  const invite = href("invite")
  const live = !wizard || wizard.status === "live"

  const copyLink = async () => {
    const link = `${window.location.origin}${studentBase}`
    try {
      await navigator.clipboard.writeText(link)
      toast("Invite link copied", { description: link })
    } catch {
      toast.error("Couldn't copy the link", { description: link })
    }
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <AdminPageHeader
        title={`Good morning, ${coach.coachName}`}
        subtitle={`${coach.name} · ${live ? "live since today" : "not published yet"} · 0 students yet`}
        actions={
          <>
            <AdminButton hierarchy="secondary" size="xl" nativeButton={false} render={<Link href={studentBase} target="_blank" rel="noreferrer" />}>
              <ExternalLink /> View your site
            </AdminButton>
            <AdminButton size="xl" nativeButton={false} render={<Link href={invite} />}>
              <Plus /> Invite students
            </AdminButton>
          </>
        }
      />

      {!hidden && (
        <Panel className="gap-0 overflow-hidden p-0" aria-label="Setup checklist">
          <header className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-[18px]">
            <div className="flex min-w-0 flex-col gap-1">
              <h2 className="t-heading-m text-a-text">{doneCount === STEPS.length ? "You're all set" : "Finish setting up"}</h2>
              <p className="t-body-m text-a-text-2">
                {doneCount} of {STEPS.length} done{minutes > 0 && ` · about ${minutes} minutes left`}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-4 max-sm:w-full">
              <AdminProgress value={(doneCount / STEPS.length) * 100} tone="accent" label="Setup progress" className="w-[200px] max-sm:flex-1" />
              <AdminButton hierarchy="ghost" size="md" onClick={() => (demo ? setHiddenDemo(true) : setStored<boolean>(`${coach.slug}:setup-hidden`, true, false))}>
                Hide
              </AdminButton>
            </div>
          </header>
          <ol>
            {STEPS.map((s, i) => {
              const isDone = done(s.id)
              return (
                <li key={s.id} className="flex items-center gap-3 border-t border-a-selected px-4 py-3.5">
                  <StepIndicator step={i + 1} state={isDone ? "success" : "upcoming"} />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="t-body-l truncate text-a-text">{s.title}</span>
                    <span className="t-caption truncate text-a-text-2">{isDone ? detail[s.id] : s.text}</span>
                  </div>
                  {isDone ? (
                    <Tag tone="success" dot>Done</Tag>
                  ) : (
                    <AdminButton hierarchy="secondary" size="md" className="shrink-0" nativeButton={false} render={<Link href={href(s.id)} />}>
                      {s.action}
                    </AdminButton>
                  )}
                </li>
              )
            })}
          </ol>
        </Panel>
      )}

      <Panel className="gap-0 p-0">
        <div className="grid grid-cols-2 divide-a-border lg:grid-cols-4 lg:divide-x">
          {[
            { label: "Students", value: "0", delta: "Invite people to start" },
            { label: "Revenue this month", value: "€0", delta: "First payout after your first sale" },
            { label: "Lessons watched", value: "—", delta: "Shows once students join" },
            { label: "Journal entries", value: "—", delta: "Shows once students trade" },
          ].map((m, i) => (
            <Metric key={m.label} {...m} wrap className={cn(i < 2 && "max-lg:border-b max-lg:border-a-border", i % 2 === 0 && "max-lg:border-r max-lg:border-a-border")} />
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <EmptyState
          icon={RadioButtonChecked}
          title="No livestream scheduled"
          description="Students see your next live session at the top of their home page."
          actions={
            <AdminButton hierarchy="secondary" size="md" nativeButton={false} render={<Link href={href("live")} />}>
              Schedule a livestream
            </AdminButton>
          }
        />
        <EmptyState
          icon={ListBulleted}
          title="No activity yet"
          description="Sign-ups, payments and journal requests show up here as they happen."
          actions={
            <AdminButton hierarchy="secondary" size="md" onClick={copyLink}>
              <Copy className="size-3.5" /> Copy invite link
            </AdminButton>
          }
        />
      </div>
    </div>
  )
}
