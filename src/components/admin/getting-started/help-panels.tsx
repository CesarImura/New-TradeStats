"use client"

import { useState } from "react"
import { toast } from "@/lib/toast"
import { AdminButton, AdminDrawer, AdminModal, adminControl } from "@/components/admin/ui"
import { ChoiceChip } from "@/components/onboarding/signup-frame"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

/**
 * Help (Figma 1650:68502, 1650:68578, 1650:68654): the three ways to get a hand from Getting started. Chat is an Admin / Drawer,
 * the setup call and "have us set it up" are Admin / Modals. Prototype only: nothing is sent anywhere.
 */
export type HelpKind = "chat" | "call" | "setup"

type Props = { kind: HelpKind | null; onClose: () => void }

const checkboxClass = "mt-0.5 border-a-border-strong data-checked:border-[var(--admin-color-control-on)] data-checked:bg-[var(--admin-color-control-on)] data-checked:text-white"

export function HelpPanels({ kind, onClose }: Props) {
  const close = (o: boolean) => !o && onClose()
  return (
    <>
      <ChatDrawer open={kind === "chat"} onOpenChange={close} />
      <CallModal open={kind === "call"} onOpenChange={close} />
      <SetupModal open={kind === "setup"} onOpenChange={close} />
    </>
  )
}

type Message = { from: "team" | "you"; text: string }
const START: Message[] = [
  { from: "team", text: "Hi Lio, I’m Sam from the Traderhub team. How can I help you set up?" },
  { from: "you", text: "How do I add my videos from YouTube?" },
  { from: "team", text: "Open Content, choose New course and pick Import links. Paste one link per line and we do the rest. Want me to walk you through it on a call?" },
]

function ChatDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [messages, setMessages] = useState(START)
  const [draft, setDraft] = useState("")
  const send = (e: React.FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    setMessages((m) => [...m, { from: "you", text }])
    setDraft("")
  }
  return (
    <AdminDrawer open={open} onOpenChange={onOpenChange} title="Chat with us" subtitle="We usually reply within a few minutes." bodyClassName="gap-5 px-6 py-6">
      {messages.map((m, i) => (
        <div key={i} className={cn("flex max-w-[380px] flex-col gap-1.5", m.from === "you" ? "items-end self-end" : "items-start")}>
          <span className="t-caption text-a-text-3">{m.from === "you" ? "You" : "Sam · Traderhub"}</span>
          <p className="rounded-a-lg bg-a-raised px-3.5 py-2.5 t-body-m text-a-text">{m.text}</p>
        </div>
      ))}
      <form onSubmit={send} className="sticky bottom-0 -mx-6 mt-auto -mb-6 flex items-center gap-2 border-t border-a-border bg-a-panel px-6 py-4">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message…" aria-label="Message" className={cn(adminControl, "h-9 flex-1")} />
        <AdminButton type="submit" disabled={!draft.trim()}>
          Send
        </AdminButton>
      </form>
    </AdminDrawer>
  )
}

/** The days and times offered in the Figma, as plain labels: the prototype books nothing real. */
const DAYS = ["Mon 17", "Tue 18", "Wed 19", "Thu 20", "Fri 21"]
const TIMES = ["09:30", "10:00", "11:30", "14:00", "15:30", "16:00"]

function CallModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [day, setDay] = useState("Tue 18")
  const [time, setTime] = useState("14:00")
  return (
    <AdminModal
      open={open}
      onOpenChange={onOpenChange}
      title="Book a setup call"
      subtitle="30 minutes with someone from our team to go through your first steps."
      overlay="plain"
      bodyClassName="gap-6 px-6 py-6 sm:px-12 sm:py-12"
      footer={
        <>
          <AdminButton hierarchy="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </AdminButton>
          <AdminButton
            onClick={() => {
              toast(`Call booked for ${day} at ${time}.`)
              onOpenChange(false)
            }}
          >
            Confirm call
          </AdminButton>
        </>
      }
    >
      <div role="radiogroup" aria-label="Pick a day" className="flex flex-col gap-3">
        <span className="t-caption text-a-text-2">Pick a day</span>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <ChoiceChip key={d} checked={day === d} onClick={() => setDay(d)}>
              {d}
            </ChoiceChip>
          ))}
        </div>
      </div>
      <div role="radiogroup" aria-label="Pick a time" className="flex flex-col gap-3">
        <span className="t-caption text-a-text-2">Pick a time</span>
        <div className="flex flex-wrap gap-2">
          {TIMES.map((t) => (
            <ChoiceChip key={t} checked={time === t} onClick={() => setTime(t)}>
              {t}
            </ChoiceChip>
          ))}
        </div>
      </div>
      <p className="t-caption text-a-text-2">30 minutes · Video call in the platform · Europe/Lisbon</p>
    </AdminModal>
  )
}

const WORK = [
  { id: "design", title: "Design your platform", text: "Logo, colours, look and layout" },
  { id: "tiers", title: "Create your tiers", text: "Names, prices and what each one unlocks" },
  { id: "course", title: "Add your first course", text: "Upload your videos and we build the lessons" },
  { id: "payouts", title: "Connect payouts", text: "You enter your bank details yourself", off: true },
]

function SetupModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [picked, setPicked] = useState<string[]>(WORK.filter((w) => !w.off).map((w) => w.id))
  const [note, setNote] = useState("")
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  return (
    <AdminModal
      open={open}
      onOpenChange={onOpenChange}
      title="Have us set it up"
      subtitle="Our team builds the first version for you."
      overlay="plain"
      bodyClassName="gap-5 px-6 py-6 sm:px-12 sm:py-12"
      footer={
        <>
          <AdminButton hierarchy="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </AdminButton>
          <AdminButton
            disabled={!picked.length}
            onClick={() => {
              toast("Request sent. We reply within one business day.")
              onOpenChange(false)
            }}
          >
            Send request
          </AdminButton>
        </>
      }
    >
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-4 t-caption text-a-text-2">What should we set up for you?</legend>
        {WORK.map((w) => (
          <label key={w.id} className="flex items-start gap-3">
            <Checkbox checked={picked.includes(w.id)} onCheckedChange={() => toggle(w.id)} className={checkboxClass} />
            <span className="flex flex-col gap-0.5">
              <span className="t-body-m text-a-text">{w.title}</span>
              <span className="t-caption text-a-text-2">{w.text}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <label className="flex flex-col gap-2">
        <span className="t-caption text-a-text">
          Anything we should know? <span className="text-a-text-3">Optional</span>
        </span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Tell us about your courses, tiers or the look you want…" className={cn(adminControl, "min-h-[88px] resize-none py-2.5")} />
      </label>
      <p className="t-caption text-a-text-2">We reply within one business day. You review everything before it goes live.</p>
    </AdminModal>
  )
}
