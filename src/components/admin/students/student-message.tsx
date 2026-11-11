"use client"

import { useState } from "react"
import { toast } from "sonner"
import { X } from "@/components/icons"
import type { Student } from "@/lib/data/people"
import { cn } from "@/lib/utils"
import { AdminButton, AdminField, AdminModal, Tag, adminControl } from "../ui"

const CHANNELS = [
  { id: "app", label: "In their notifications" },
  { id: "email", label: "By e-mail" },
  { id: "discord", label: "In Discord" },
] as const
type Channel = (typeof CHANNELS)[number]["id"]

/** Admin / Radio (Figma 545:…): 16px ring, the accent dot grows in. A plain button so it works in a row of choices. */
function Radio({ checked, disabled, onSelect, children }: { checked: boolean; disabled?: boolean; onSelect: () => void; children: React.ReactNode }) {
  return (
    <button type="button" role="radio" aria-checked={checked} disabled={disabled} onClick={onSelect}
      className="flex items-center gap-2 rounded-a-xs t-body-m text-a-text outline-none focus-visible:ring-2 focus-visible:ring-a-border-focus disabled:pointer-events-none disabled:text-a-text-3 pointer-coarse:min-h-10">
      <span aria-hidden className={cn("grid size-4 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors duration-300", checked ? "border-a-border-active" : "border-a-border-strong", disabled && "opacity-40")}>
        <span className={cn("size-2 rounded-full bg-a-accent transition-transform duration-200 ease-out motion-reduce:transition-none", checked ? "scale-100" : "scale-0")} />
      </span>
      {children}
    </button>
  )
}

/** Students · 05 Message (Figma 556:9825): one student or a selection. Who gets it as chips you can take off, a subject, the message, and where it arrives. */
export function MessageDialog({ to, onClose }: { to: Student[] | null; onClose: () => void }) {
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [channel, setChannel] = useState<Channel>("app")
  const [removed, setRemoved] = useState<string[]>([])

  // While the modal fades out `to` is already null: keep the last list so the title and chips do not change under the animation.
  const [last, setLast] = useState<Student[] | null>(to)
  if (to && to !== last) setLast(to)
  const all = to ?? last ?? []
  const who = all.filter((s) => !removed.includes(s.id))
  const linked = who.filter((s) => s.discord).length
  const discord = who.length > 0 && linked === who.length
  const title = all.length === 1 ? `Message ${all[0].name}` : `Message ${all.length} students`
  const count = who.length === 1 ? who[0].name : `${who.length} students`

  const close = () => {
    onClose()
    setTimeout(() => {
      setSubject("")
      setBody("")
      setChannel("app")
      setRemoved([])
    }, 200)
  }
  const send = () => {
    if (!body.trim() || who.length === 0) return
    toast(`Message sent to ${count}`, { description: channel === "app" ? "It arrives in their notifications." : channel === "email" ? "It is on its way by e-mail." : "It is on its way in Discord." })
    close()
  }

  return (
    <AdminModal
      open={!!to}
      onOpenChange={(o) => !o && close()}
      title={title}
      className="sm:max-w-[600px]"
      bodyClassName="gap-5"
      footer={
        <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-2">
          <span className="t-caption text-a-text-3">{"{first}"} is replaced by each name</span>
          <span aria-hidden className="h-px min-w-px flex-1" />
          <AdminButton hierarchy="ghost" onClick={close}>Cancel</AdminButton>
          <AdminButton disabled={!body.trim() || who.length === 0} onClick={send}>{who.length > 1 ? `Send to ${who.length}` : "Send"}</AdminButton>
        </div>
      }>
      <div className="contents" onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === "Enter" && (e.preventDefault(), send())}>
      <div className="flex flex-col gap-4">
        <div className="flex min-h-[38px] flex-wrap items-center gap-x-2.5 gap-y-1.5 rounded-a-md border border-a-border-subtle bg-a-field px-3 py-[9px]">
          <span className="t-body-m text-a-text-2">To</span>
          <ul aria-label="Recipients" className="flex min-w-0 flex-wrap gap-1.5">
            {who.map((s) => (
              <li key={s.id}>
                <Tag className="max-w-full gap-1 pr-1">
                  <span className="truncate">{s.name}</span>
                  {who.length > 1 && (
                    <button type="button" aria-label={`Remove ${s.name}`} onClick={() => setRemoved((r) => [...r, s.id])} className="grid size-3.5 shrink-0 place-items-center rounded-a-xs text-a-text-3 outline-none transition-colors duration-200 hover:bg-a-hover hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus pointer-coarse:size-6">
                      <X className="size-3" />
                    </button>
                  )}
                </Tag>
              </li>
            ))}
            {who.length === 0 && <li className="t-body-m text-a-text-3">No one left. Close and pick again.</li>}
          </ul>
          <span aria-hidden className="h-px min-w-px flex-1" />
          <span className="t-caption text-a-text-2 tabular-nums">{who.length === 1 ? "1 student" : `${who.length} students`}</span>
        </div>
        <AdminField label="Subject">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Quick check-in" className={cn(adminControl, "h-11")} />
        </AdminField>
        <AdminField label="Message">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={"Hi {first},\n\n"}
            className={cn(adminControl, "block h-[138px] resize-none py-2.5")}
          />
        </AdminField>
      </div>
      <hr className="m-0 h-px shrink-0 border-0 bg-a-border-subtle" />
      <div role="radiogroup" aria-label="Send it" className="flex flex-col gap-2.5">
        <h3 className="t-mono-label text-a-text-2">Send it</h3>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {CHANNELS.map((c) =>
            c.id === "discord" ? (
              <span key={c.id} className="flex items-center gap-2">
                <Radio checked={channel === "discord"} disabled={!discord} onSelect={() => setChannel("discord")}>{c.label}</Radio>
                {!discord && <span className="t-caption text-a-text-3">{linked === 0 ? "Not connected" : `${linked} of ${who.length} linked`}</span>}
              </span>
            ) : (
              <Radio key={c.id} checked={channel === c.id} onSelect={() => setChannel(c.id)}>{c.label}</Radio>
            ),
          )}
        </div>
      </div>
      </div>
    </AdminModal>
  )
}
