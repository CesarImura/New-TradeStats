"use client"

import { useState } from "react"
import { CalendarClock, Check, MoreHorizontal, Pin } from "@/components/icons"
import { toast } from "@/lib/toast"
import { useCoach } from "@/components/coach/coach-provider"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { AdminButton, AdminDrawer, AdminField, AdminSegmented, AdminTable, AdminTableFooter, AdminTableHead, AdminTd, AdminTh, AdminTr, EmptyState, Panel, adminControl } from "../ui"
import { Announcement, DiscordSetup, CHANNELS, BOT_POSTS, SwitchCard } from "./community-parts"

/* ---------- 01 Announcements ---------- */

export function AnnouncementsTab({ list, setList, d, setD }: { list: Announcement[]; setList: (n: Announcement[] | ((c: Announcement[]) => Announcement[])) => void; d: DiscordSetup; setD: (n: DiscordSetup | ((c: DiscordSetup) => DiscordSetup)) => void }) {
  return (
    <>
      {list.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No announcements yet" description="Write the first one: students get it in the platform, by e-mail or in Discord." />
      ) : (
        <AdminTable
          minWidth={820}
          footer={<AdminTableFooter>Also shows as the Announcement widget on Home</AdminTableFooter>}>
          <AdminTableHead>
            <AdminTh>Announcement</AdminTh>
            <AdminTh width={200}>Sent to</AdminTh>
            <AdminTh width={230}>When</AdminTh>
            <AdminTh width={64} />
          </AdminTableHead>
          <tbody>
            {list.map((a) => (
              <AdminTr key={a.id}>
                <AdminTd>
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="grid min-w-0 gap-0.5">
                      <span className="flex min-w-0 items-center gap-1.5 t-body-m text-a-text">
                        <span className="truncate">{a.title}</span>
                        {a.pinned && <Pin className="size-4 shrink-0" aria-label="Pinned" />}
                      </span>
                      <span className="truncate t-caption text-a-text-2">{a.body}</span>
                    </div>
                  </div>
                </AdminTd>
                <AdminTd className="text-a-text-2">{a.channels.map((c) => CHANNELS.find((x) => x.id === c)?.label).join(", ")}</AdminTd>
                <AdminTd className={cn("whitespace-nowrap", a.scheduled ? "text-a-text-accent" : "text-a-text-3")}>{a.scheduled ? `Scheduled · ${a.scheduled}` : `Sent · ${a.when}`}</AdminTd>
                <AdminTd align="end">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<AdminButton hierarchy="ghost" size="md" iconOnly aria-label={`Actions for ${a.title}`} />}><MoreHorizontal /></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setList((l) => l.map((x) => (x.id === a.id ? { ...x, pinned: !x.pinned } : x)))}>{a.pinned ? "Unpin from the top" : "Pin to the top"}</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => (setList((l) => l.filter((x) => x.id !== a.id)), toast("Announcement deleted"))}>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </AdminTd>
              </AdminTr>
            ))}
          </tbody>
        </AdminTable>
      )}
      <Panel className="gap-4">
        <h2 className="t-heading-s text-a-text">Automatic announcements</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {BOT_POSTS.map(([id, label, , text]) => (
            <SwitchCard key={id} label={label} text={text} checked={!!d.posts[id]} onChange={(v) => setD((x) => ({ ...x, posts: { ...x.posts, [id]: v } }))} />
          ))}
        </div>
      </Panel>
    </>
  )
}

/* ---------- 02 New announcement ---------- */

export function AnnouncementDrawer({ open, onOpenChange, onPost }: { open: boolean; onOpenChange: (o: boolean) => void; onPost: (a: Announcement) => void }) {
  const { coach } = useCoach()
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [who, setWho] = useState<"all" | "tiers">("all")
  const [tiers, setTiers] = useState<string[]>([])
  const [later, setLater] = useState<"now" | "later">("now")
  const [at, setAt] = useState("")
  const [channels, setChannels] = useState<string[]>(["platform", "email", "discord"])
  const [pin, setPin] = useState(true)

  const reset = () => {
    setTitle("")
    setBody("")
    setWho("all")
    setTiers([])
    setLater("now")
    setAt("")
    setChannels(["platform", "email", "discord"])
    setPin(true)
  }
  const when = at ? new Date(at).toLocaleString("en", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).replace(",", "") : ""
  const missing = !title.trim() || !body.trim() || channels.length === 0 || (who === "tiers" && tiers.length === 0) || (later === "later" && !at)
  const close = () => {
    onOpenChange(false)
    setTimeout(reset, 250)
  }
  const send = () => {
    if (missing) return
    onPost({ id: `n${Date.now()}`, title: title.trim(), body: body.trim(), when: "just now", pinned: pin, channels, reads: 0, tiers: who === "tiers" ? tiers : [], scheduled: later === "later" ? when : undefined })
    toast(later === "later" ? `Scheduled for ${when}` : "Announcement sent", { icon: later === "later" ? <CalendarClock className="size-4" /> : <Check className="size-4" /> })
    close()
  }

  return (
    <AdminDrawer
      open={open}
      onOpenChange={(o) => (o ? onOpenChange(true) : close())}
      title="New announcement"
      subtitle="What should everyone know?"
      className="sm:data-[side=right]:w-[480px]"
      bodyClassName="gap-5"
      footer={
        <div className="flex w-full items-center gap-2">
          <AdminButton hierarchy="ghost" onClick={close}>Cancel</AdminButton>
          <span aria-hidden className="h-px min-w-px flex-1" />
          <AdminButton disabled={missing} onClick={send}>{later === "later" ? "Schedule" : "Send now"}</AdminButton>
        </div>
      }>
      <div className="flex flex-col gap-4">
        <AdminField label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New module is live" className={cn(adminControl, "h-11")} />
        </AdminField>
        <AdminField label="Message">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Module 3 covers daily loss limits and the end-of-day review…" className={cn(adminControl, "block h-[104px] resize-none py-2.5")} />
        </AdminField>
      </div>
      <hr className="m-0 h-px shrink-0 border-0 bg-a-border-subtle" />
      <div className="flex flex-col gap-4">
        <div className="grid gap-1.5">
          <span className="t-caption text-a-text">Who gets it</span>
          <AdminSegmented label="Who gets it" value={who} onChange={setWho} options={[{ value: "all", label: "Everyone" }, { value: "tiers", label: "Pick tiers" }]} />
          {who === "tiers" && (
            <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
              {coach.tiers.map((t) => (
                <label key={t.id} className="flex items-center gap-2 t-body-m text-a-text">
                  <Checkbox checked={tiers.includes(t.id)} onCheckedChange={(v) => setTiers((x) => (v ? [...x, t.id] : x.filter((y) => y !== t.id)))} />
                  {t.name}
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="grid gap-1.5">
          <span className="t-caption text-a-text">When</span>
          <AdminSegmented label="When" value={later} onChange={setLater} options={[{ value: "now", label: "Send now" }, { value: "later", label: "Send later" }]} />
          {later === "later" && <input type="datetime-local" aria-label="Send at" value={at} onChange={(e) => setAt(e.target.value)} className={cn(adminControl, "mt-1 h-11 scheme-dark")} />}
        </div>
      </div>
      <hr className="m-0 h-px shrink-0 border-0 bg-a-border-subtle" />
      <div className="flex flex-col gap-4">
        <fieldset className="grid gap-2.5">
          <legend className="mb-2.5 t-caption text-a-text">Post in</legend>
          {CHANNELS.map((c) => (
            <label key={c.id} className="flex items-center gap-2.5 t-body-m text-a-text">
              <Checkbox checked={channels.includes(c.id)} onCheckedChange={(v) => setChannels((x) => (v ? [...x, c.id] : x.filter((y) => y !== c.id)))} />
              {c.post}
              {c.id === "discord" && <span className="t-caption text-a-text-3">#announcements</span>}
            </label>
          ))}
        </fieldset>
        <label className="flex items-center justify-between gap-6">
          <span className="grid gap-0.5">
            <span className="t-body-m text-a-text">Pin to the top</span>
            <span className="t-caption text-a-text-2">Students see these at the top of the community</span>
          </span>
          <Switch checked={pin} onCheckedChange={setPin} />
        </label>
      </div>
    </AdminDrawer>
  )
}

