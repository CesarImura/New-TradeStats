"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Check, CircleDashed, Info, Lightbulb, X } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useTiers } from "@/lib/data/access"
import type { CustomCommunity } from "@/lib/data/communities"
import { allLessons, isSampleCourse, useCatalog, type Catalog } from "@/lib/data/learning"
import { isSampleEvent, useSchedule } from "@/lib/data/schedule"
import { useCustomCommunities } from "@/lib/data/use-communities"
import { setStored, useHistory, useStored } from "@/lib/prototype-store"
import { cn } from "@/lib/utils"

/**
 * The getting-started checklist on the Overview, and the short how-to at the top of each screen it
 * leads to. Setup asks only for the brand, a look and a first membership; everything else waits here.
 *
 * Each "done" comes from what really happened. A community made in setup starts on the prototype's
 * sample courses, events and settings, so for it only the coach's own actions count (uploading videos,
 * adding an event, connecting). The demo communities count what their own data holds.
 */

export type TaskId = "brand" | "membership" | "course" | "live" | "payouts" | "discord" | "invite" | "design"

export type Task = { id: TaskId; label: string; text: string; href: string; done: boolean; required?: boolean }

/** The community made in setup with this address, if it is one. */
export function useWizardCommunity(slug: string): CustomCommunity | undefined {
  return useCustomCommunities().find((c) => c.slug === slug)
}

/** A tier students can join: it has a name, and is free or has a price above zero (setup can leave one half filled). */
const isRealTier = (t: { name: string; price: string }) => t.name.trim().length > 0 && (t.price === "Free" || Number(t.price.replace(/[^\d.,]/g, "").replace(",", ".")) > 0)

/** What a payouts or Discord setup holds; read here and in Sales and Community. */
type Connected = { done?: boolean; connected?: boolean }

export function useSetupTasks(): Task[] {
  const { coach, base } = useCoach()
  const wizard = useWizardCommunity(coach.slug)
  const tiers = useTiers(coach)
  const catalog = useCatalog(coach)
  const savedCatalog = useStored<Catalog | null>(`catalog:${coach.slug}`, null)
  const schedule = useSchedule(coach)
  const payouts = useStored<Connected | null>(`${coach.slug}:payouts`, null)
  const discord = useStored<Connected | null>(`${coach.slug}:discord`, null)
  const history = useHistory(coach.slug)

  const live = !wizard || wizard.status === "live"
  // A published course with a published lesson; for a community made in setup, one of its own (not a sample course).
  const lessons = (c: Catalog) => c.courses.some((x) => x.status === "published" && allLessons(x).some((l) => l.status === "published") && !(wizard && isSampleCourse(coach, x.id)))
  const inSetup = !live ? "/setup" : undefined

  return [
    {
      id: "brand",
      label: "Brand and look",
      text: live ? "Logo, colour and a look, published" : "Finish setup and publish",
      href: inSetup ?? `${base}/design`,
      done: live,
      required: true,
    },
    {
      id: "membership",
      label: "First membership",
      text: "What students join, free or paid",
      href: inSetup ?? `${base}/sales?tab=tiers`,
      done: tiers.some(isRealTier) && (!wizard || !!wizard.setup?.membership || live),
      required: true,
    },
    {
      id: "course",
      label: "Add your first course",
      text: "Upload videos; we suggest the lessons",
      href: `${base}/content`,
      done: wizard ? !!wizard.setup?.courses?.length || (!!savedCatalog && lessons(savedCatalog)) : lessons(catalog),
    },
    {
      id: "live",
      label: "Plan your first live session",
      text: "A live, call or workshop in the calendar",
      href: `${base}/calendar`,
      done: schedule.events.some((e) => !wizard || !isSampleEvent(coach, e.id)),
    },
    {
      id: "payouts",
      label: "Connect payouts",
      text: "Needed for paid tiers; free ones work without it",
      href: `${base}/sales?tab=payouts`,
      done: payouts?.done ?? (wizard ? wizard.setup?.payouts === "connected" : true),
    },
    {
      id: "discord",
      label: "Connect Discord",
      text: "Roles follow each student's tier",
      href: `${base}/community`,
      done: discord?.connected ?? !wizard,
    },
    {
      id: "invite",
      label: "Invite your first students",
      text: "A join link, e-mails or an import",
      // The invite page is where e-mail invites are sent and counted; the Students import is visual only in the prototype.
      href: wizard ? `/setup/invite?c=${wizard.slug}` : `${base}/students`,
      done: wizard ? (wizard.setup?.invited ?? 0) > 0 : coach.tiers.some((t) => t.members > 0),
    },
    {
      id: "design",
      label: "Menu, Home and fine-tuning",
      text: "Sections, names, Home layout, fonts and widgets",
      href: `${base}/design?step=menu`,
      // Setup publishes once; publishing again from Design means the coach went back to it.
      done: wizard ? history.length >= 2 : true,
    },
  ]
}

function TaskRow({ task }: { task: Task }) {
  return (
    <Link
      href={task.href}
      className={cn(
        "group flex items-start gap-2.5 rounded-lg border p-3 text-left text-sm transition-colors outline-none hover:bg-muted focus-visible:border-[var(--ts-interactive)] focus-visible:shadow-[0_0_0_3px_rgb(255_85_0/0.25)]",
        task.done && "text-muted-foreground",
      )}
    >
      {task.done ? <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden /> : <CircleDashed className="mt-0.5 size-4 shrink-0" aria-hidden />}
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className={cn("font-medium", !task.done && "text-foreground")}>
          {task.label}
          <span className="sr-only">{task.done ? " (done)" : " (to do)"}</span>
        </span>
        <span className="text-xs text-muted-foreground">{task.text}</span>
      </span>
      {!task.done && <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground group-hover:text-foreground" aria-hidden />}
    </Link>
  )
}

/** ADM-01 · Getting started: what it takes to open, then what can wait. */
export function SetupChecklist() {
  const tasks = useSetupTasks()
  const [open, setOpen] = useState(false)
  const needed = tasks.filter((t) => t.required)
  const later = tasks.filter((t) => !t.required)
  const done = tasks.filter((t) => t.done).length
  const neededLeft = needed.filter((t) => !t.done).length

  if (done === tasks.length && !open)
    return (
      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="size-4 text-primary" aria-hidden /> Getting started is done
          </CardTitle>
          <CardDescription>All {tasks.length} steps are complete.</CardDescription>
          <CardAction>
            <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
              Show the list
            </Button>
          </CardAction>
        </CardHeader>
      </Card>
    )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Getting started</CardTitle>
        <CardDescription>
          {neededLeft > 0 ? `${neededLeft} of ${needed.length} still needed to open your platform. The rest can wait.` : `Your platform is open. ${later.filter((t) => t.done).length} of ${later.length} next steps done.`}
        </CardDescription>
        <CardAction className="w-20 sm:w-40">
          <Progress value={(done / tasks.length) * 100} aria-label={`${done} of ${tasks.length} done`} />
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-5">
        <section className="grid gap-2" aria-labelledby="gs-needed">
          <h3 id="gs-needed" className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            To open your platform {neededLeft > 0 && <Badge variant="outline">Needed</Badge>}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {needed.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </div>
        </section>
        <section className="grid gap-2" aria-labelledby="gs-later">
          <h3 id="gs-later" className="text-xs font-medium text-muted-foreground">
            When you&apos;re ready
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {later.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </div>
        </section>
      </CardContent>
    </Card>
  )
}

/** The how-to for each step, a few plain lines; shown at the top of its screen until done or closed. */
const TIPS: Partial<Record<TaskId, { title: string; steps: string[]; action?: string }>> = {
  membership: { title: "Your first membership", steps: ["Open a tier to set its name, price and trial.", "Free tiers work without payouts.", "Add a second tier any time; students upgrade and pay the difference."] },
  course: { title: "Your first course", steps: ["Bulk upload drops a whole folder (we suggest modules and lessons from the file names), or start with New course.", "Publish the course: Publish course, at the top of the course.", "Publish at least one lesson: open it, then Access and publishing → Published. This step is done once the course and a lesson are both published."] },
  live: { title: "Your first live session", steps: ["Click New event, or a time in the calendar.", "Pick live, call or workshop, and who can join.", "Students get reminders and see it in their own time zone."] },
  payouts: { title: "Connecting payouts", steps: ["Four short steps: country, about you, bank account and an ID check.", "About five minutes. Money arrives every Monday.", "Only paid tiers need it."] },
  discord: { title: "Connecting Discord", steps: ["Open the Discord tab and connect your server.", "Pick the role each tier gets; we add and remove it automatically.", "Students link their Discord in one click."] },
  invite: { title: "Your first students", steps: ["Open the invite page and paste their e-mails, then Send invites. This step is done once invites are sent.", "They get an e-mail in your design and land on your Home.", "The same page has your join link to share anywhere."], action: "Open the invite page" },
}

const NO_TIPS: TaskId[] = []

/** The short how-to for a checklist step, on the screen it leads to. Closing it keeps it closed. */
export function SetupTip({ task }: { task: TaskId }) {
  const { coach } = useCoach()
  const t = useSetupTasks().find((x) => x.id === task)
  const closed = useStored<TaskId[]>(`${coach.slug}:setup-tips-closed`, NO_TIPS)
  const tip = TIPS[task]
  if (!tip || !t || t.done || closed.includes(task)) return null
  return (
    <aside className="flex items-start gap-3 rounded-lg border bg-card p-4 text-sm" aria-label={tip.title}>
      <Lightbulb className="mt-0.5 size-4 shrink-0 text-[var(--ts-interactive)]" aria-hidden />
      <div className="grid min-w-0 flex-1 gap-1.5">
        <p className="font-medium">{tip.title}</p>
        <ol className="grid list-decimal gap-1 pl-4 text-muted-foreground">
          {tip.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        {tip.action && (
          <Button size="sm" variant="outline" className="mt-1 w-fit" nativeButton={false} render={<Link href={t.href} />}>
            {tip.action} <ArrowRight />
          </Button>
        )}
      </div>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="Close this how-to"
        onClick={() => setStored<TaskId[]>(`${coach.slug}:setup-tips-closed`, (c) => [...c, task], NO_TIPS)}
      >
        <X />
      </Button>
    </aside>
  )
}

/**
 * A community made in setup starts on the prototype's sample courses, events and numbers so its screens
 * aren't empty. This line says so where they show; the items themselves carry a "Sample" label.
 */
export function SampleNotice({ show = true, children }: { show?: boolean; children: React.ReactNode }) {
  const { coach } = useCoach()
  const wizard = useWizardCommunity(coach.slug)
  if (!show || !wizard) return null
  return (
    <p className="flex items-start gap-2 rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
      <Info className="mt-px size-3.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  )
}
