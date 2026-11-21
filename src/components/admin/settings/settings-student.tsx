"use client"

import { Eye, GripVertical, Plus } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { FIRST_WEEK, MAX_CUSTOM_QUESTIONS, NO_QUESTIONS, resetAsNewStudent, useOnboardingSettings, type CustomQuestion, type FirstWeekItem, type OnboardingSettings } from "@/lib/data/student-start"
import { setStored } from "@/lib/prototype-store"
import { cn } from "@/lib/utils"
import { Field, NativeSelect, SettingRow, useCommunityData } from "../kit"
import { AdminButton, Panel, PanelHeader, Tag } from "../ui"

import { SettingsPage, Segmented, RowMenu } from "./settings-parts"

// ---------- ADM-49

const AFTER = [["home", "Go to Home"], ["lesson", "Start the first lesson"], ["call", "Book a call"]] as const

const BUILT_IN = [
  { id: "experience", title: "How long have you traded?", meta: "Choice · 4 options", required: true },
  { id: "markets", title: "What do you trade?", meta: "Choice · Futures, Forex, Stocks, Crypto", required: true },
  { id: "goal", title: "Your account size", meta: "Choice · optional", required: false },
] as const

const OLD_MESSAGE = "Welcome! Start with the first lesson of Foundations, then book your first live session."

export function useOnboarding() {
  const { coach } = useCoach()
  const s = useOnboardingSettings(coach.slug)
  const set = (p: Partial<OnboardingSettings>) => setStored(`${coach.slug}:student-onboarding`, { ...s, ...p })
  return { coach, s, set }
}

export function StudentOnboarding() {
  const { coach, s, set } = useOnboarding()
  const [after, setAfter] = useCommunityData<(typeof AFTER)[number][0]>(coach.slug, "onboarding-after", "lesson")
  const custom = s.custom ?? NO_QUESTIONS
  const editQuestion = (id: string, patch: Partial<CustomQuestion>) => set({ custom: custom.map((c) => (c.id === id ? { ...c, ...patch } : c)) })
  return (
    <SettingsPage title="Onboarding questions" text="What new students answer before their first lesson.">
      <Panel>
        <PanelHeader title="Welcome" />
        <Field label="Message">
          <Input value={s.message === OLD_MESSAGE ? `Welcome to ${coach.name}. Two minutes and you're in.` : s.message} onChange={(e) => set({ message: e.target.value })} />
        </Field>
        <div className="flex items-center gap-3">
          <div className="grid aspect-video w-24 shrink-0 place-items-center rounded-a-sm bg-gradient-to-br from-a-raised to-a-selected t-caption text-a-text-3">{s.video ? "" : "No video"}</div>
          <div className="grid flex-1 gap-0.5">
            <span className="t-body-m">Welcome video</span>
            <span className="t-caption text-a-text-2">{s.video ? "1:42 · plays once" : "Not added yet"}</span>
          </div>
          <AdminButton hierarchy="secondary" size="md" onClick={() => set({ video: !s.video })}>
            {s.video ? "Change" : "Upload"}
          </AdminButton>
        </div>
      </Panel>
      <Panel>
        <PanelHeader title="Short profile" />
        <div className="grid gap-2">
          {BUILT_IN.map((q) => {
            const on = s.questions[q.id]
            return (
              <div key={q.id} className={cn("flex items-center gap-2 rounded-a-md border border-a-border bg-a-field px-2 py-2", !on && "opacity-50")}>
                <GripVertical className="size-4 shrink-0 text-a-icon" />
                <div className="grid min-w-0 flex-1">
                  <span className="t-body-m">{q.title}</span>
                  <span className="t-caption text-a-text-2">{on ? q.meta : "Switched off"}</span>
                </div>
                {q.required && on && <Tag>Required</Tag>}
                <RowMenu label={`Options for ${q.title}`} items={[{ text: on ? "Turn off" : "Turn on", onClick: () => set({ questions: { ...s.questions, [q.id]: !on } }) }]} />
              </div>
            )
          })}
          {custom.map((c) => (
            <div key={c.id} className="grid gap-2 rounded-a-md border border-a-border bg-a-field px-2 py-2">
              <div className="flex items-center gap-2">
                <GripVertical className="size-4 shrink-0 text-a-icon" />
                <Input aria-label="Question" value={c.text} placeholder="What do you want to get from this community?" onChange={(e) => editQuestion(c.id, { text: e.target.value })} className="h-8 flex-1" />
                <NativeSelect aria-label="Answer type" value={c.kind} onChange={(e) => editQuestion(c.id, { kind: e.target.value as CustomQuestion["kind"] })}>
                  <option value="short">Short answer</option>
                  <option value="choice">Choose one</option>
                </NativeSelect>
                <RowMenu label="Options for this question" items={[{ text: "Delete", onClick: () => set({ custom: custom.filter((x) => x.id !== c.id) }) }]} />
              </div>
              {c.kind === "choice" && (
                <Input aria-label="Choices, separated by commas" value={c.options.join(", ")} placeholder="Choices, separated by commas" onChange={(e) => editQuestion(c.id, { options: e.target.value.split(",").map((o) => o.trimStart()) })} className="h-8" />
              )}
            </div>
          ))}
          {custom.length < MAX_CUSTOM_QUESTIONS && (
            <AdminButton hierarchy="ghost" size="md" className="justify-self-start" onClick={() => set({ custom: [...custom, { id: `q${Date.now()}`, text: "", kind: "short", options: [] }] })}>
              <Plus /> Add your own question
            </AdminButton>
          )}
        </div>
      </Panel>
      <Panel>
        <PanelHeader title="After the profile" />
        <Segmented label="After the profile" value={after} onChange={setAfter} options={AFTER} />
      </Panel>
    </SettingsPage>
  )
}

export function FirstWeek() {
  const { coach, s, set } = useOnboarding()
  const items = (Object.keys(FIRST_WEEK) as FirstWeekItem[]).filter((id) => {
    const m = FIRST_WEEK[id].module
    return !m || coach.modules[m]
  })
  return (
    <SettingsPage title="Home in the first week" text="New students see a Start here card and a short checklist on Home until they finish or close it.">
      <Panel className="gap-2">
        <PanelHeader title="Start here" className="pb-1" />
        <div className="divide-y divide-a-border-subtle">
          <SettingRow label="Start here card" text="First lesson, next live session, introduce yourself">
            <Switch checked={s.startHere} onCheckedChange={(v) => set({ startHere: v })} />
          </SettingRow>
          {items.map((id) => (
            <SettingRow key={id} label={FIRST_WEEK[id].label} text={FIRST_WEEK[id].text}>
              <Switch checked={s.firstWeek.includes(id)} onCheckedChange={(v) => set({ firstWeek: v ? items.filter((x) => x === id || s.firstWeek.includes(x)) : s.firstWeek.filter((x) => x !== id) })} aria-label={FIRST_WEEK[id].label} />
            </SettingRow>
          ))}
        </div>
      </Panel>
      <Panel className="gap-2">
        <PanelHeader
          title="Before Home"
          description="Every step can be skipped by the student."
          actions={
            <AdminButton
              hierarchy="secondary"
              size="md"
              onClick={() => {
                resetAsNewStudent(coach.slug)
                window.open(`/site/${coach.slug}/start`, "_blank")
              }}
            >
              <Eye /> Try it as a new student
            </AdminButton>
          }
        />
        <div className="divide-y divide-a-border-subtle">
          <SettingRow label="Ask to link Discord" text="One click; the role follows their tier">
            <Switch checked={s.discord} onCheckedChange={(v) => set({ discord: v })} />
          </SettingRow>
          <SettingRow label="Short tour" text="Three tips over the menu">
            <Switch checked={s.tour} onCheckedChange={(v) => set({ tour: v })} />
          </SettingRow>
          <SettingRow label="How students log in">
            <NativeSelect aria-label="How students log in" value={s.login} onChange={(e) => set({ login: e.target.value as OnboardingSettings["login"] })}>
              <option value="code">E-mail code</option>
              <option value="password">Password</option>
              <option value="both">Both, and Discord</option>
            </NativeSelect>
          </SettingRow>
        </div>
      </Panel>
    </SettingsPage>
  )
}

