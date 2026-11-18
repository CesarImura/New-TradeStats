"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CalendarDays, ChevronRight, MessageCircle, Wrench } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { AdminPageHeader, Callout, Panel, PanelHeader, TimelineStep } from "@/components/admin/ui"
import { cn } from "@/lib/utils"
import { GoLiveModal, LiveModal } from "./go-live"
import { useSetupSteps } from "./use-setup-steps"
import { useTourState } from "../tour/tour"
import { TOURS, isTourId, type TourId } from "../tour/tours"
import { useCatalog } from "@/lib/data/learning"

/**
 * Admin · Getting started (Figma 958:6684 and the "done" states 991:7443, 1028:76858, 1046:675, 1049:2, 1050:2).
 * While the platform is a draft this page replaces the Overview: five steps in any order (1237:61209), then Go live. On the right,
 * the progress ("5 of 5 steps done") and a way to get help.
 */
export function GettingStarted() {
  const router = useRouter()
  const { coach, base } = useCoach()
  const { steps, doneCount, total, current, community, skip, skipped, allPutOff } = useSetupSteps()
  const [goLive, setGoLive] = useState(false)
  // A tour left half way (Skip or Do it later): its item says where, and Resume goes back there (Figma 1066:1047).
  // One tour runs at a time; any other left half way was paused where it was (Flavio, 14/11).
  const { pausedAt } = useTourState()
  const live = community?.status === "live"
  // "Your … is saved" only when something is (QA 14/11): a tier exists only once it was saved; a course once it was created.
  const catalog = useCatalog(coach)
  const savedLine = (id: TourId) =>
    id === "course" ? (catalog.courses.length ? TOURS.course.saved : "Resume picks up where you left off.") : id === "tier" ? "Resume picks up where you left off." : TOURS[id].saved
  const intro = live ? "Your platform is live. Next, bring in your first students." : doneCount === total ? "Everything is set up. Go live to open your platform to students." : allPutOff ? "Come back to these when you're ready. Go live opens once all five are done." : "Your platform is a draft. Do these five steps in any order, then go live."

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title={`Welcome, ${coach.coachName}`} subtitle={intro} />
      <div className="flex flex-col items-start gap-4 lg:flex-row">
        <ol aria-label="Setup steps" className="flex w-full min-w-0 flex-1 flex-col">
          {steps.map((s, i) => {
            const state = s.done ? "done" : s.id === current ? "current" : s.id === "live" ? "upcoming" : "open"
            const at = isTourId(s.id) && !s.done ? pausedAt(s.id) : undefined
            const paused = at && isTourId(s.id) ? TOURS[s.id].steps.find((x) => x.id === at.at) : undefined
            const resume = !!paused
            return (
              <TimelineStep
                key={s.id}
                step={i + 1}
                state={state}
                first={i === 0}
                last={i === steps.length - 1}
                title={s.title}
                tag={!s.done && s.id !== "live" && skipped.includes(s.id) && s.id !== current ? "Skipped" : undefined}
                description={paused && isTourId(s.id) ? `Paused at “${paused.title}”. ${savedLine(s.id)}` : s.description}
                action={resume ? "Resume" : s.action}
                disabledHint="Finish the five steps first"
                onSkip={s.id === "live" || total - doneCount < 2 ? undefined : () => skip(s.id)}
                onAction={() => (s.id === "live" ? setGoLive(true) : router.push(resume && at?.path ? `${at.path}${at.path.includes("?") ? "&" : "?"}tour=${s.id}` : s.href))}
                onEdit={s.id === "live" ? undefined : () => router.push(s.href.replace(/[?&]tour=\w+/, ""))}
                // Optional, once Design is done (Flavio, 14/11): a short tour of the full design editor. Not one of the five.
                guide={s.id === "design" && s.done && !live && !TOURS.editor.done(community) ? { label: "Tour the design editor", onClick: () => router.push(`${base}/design?tour=editor`) } : undefined}
              />
            )
          })}
        </ol>
        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-[380px] lg:pt-1.5">
          <Panel className="gap-3">
            <span className="t-mono-label text-a-text-3">{live ? "Live" : "Ready to go live"}</span>
            <p className="flex items-baseline gap-2">
              <span className="t-metric text-a-text tabular-nums">{doneCount}</span>
              <span className="t-body-l text-a-text-2">of {total} steps done</span>
            </p>
            <div className="flex gap-1 pb-2" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={doneCount} aria-label="Setup progress">
              {Array.from({ length: total }, (_, i) => (
                <span key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors duration-300", i < doneCount ? "bg-a-accent" : "bg-a-border")} />
              ))}
            </div>
            {!live && <Callout>Your progress is saved as you go.</Callout>}
          </Panel>
          <Panel>
            <PanelHeader title="Need a hand?" className="min-h-7" />
            <div className="flex flex-col gap-3">
              {[
                { icon: MessageCircle, label: "Chat with us" },
                { icon: CalendarDays, label: "Book a setup call" },
                { icon: Wrench, label: "Have us set it up" },
              ].map(({ icon: Icon, label }) => (
                <button key={label} type="button" onClick={() => toast(`${label}: opens our help in the real product.`)} className="group flex items-center gap-3 rounded-a-sm py-2 text-left t-body-m text-a-text outline-none transition-colors duration-150 hover:text-a-text-accent focus-visible:ring-2 focus-visible:ring-a-border-focus">
                  <Icon aria-hidden className="size-4 text-a-text-accent" />
                  <span className="flex-1">{label}</span>
                  <ChevronRight aria-hidden className="size-4 text-a-icon transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </Panel>
        </div>
      </div>
      <GoLiveModal open={goLive} onOpenChange={setGoLive} />
      <LiveModal />
    </div>
  )
}
