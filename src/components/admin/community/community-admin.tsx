"use client"

import { useState } from "react"
import { Bell, CalendarClock, Check, Hash, Megaphone, Pin, Plus, RefreshCw, Send, Trash2, Unplug } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { DEFAULT_RULES, DEFAULT_SPACES, type Space } from "@/lib/data/community"
import { ANNOUNCEMENTS, DISCORD_ROLES } from "@/lib/data/people"
import { DISCORD } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { Field, Mono, NativeSelect, Page, PageHeader, SettingRow, useCommunityData } from "../kit"
import { SetupTip, useWizardCommunity } from "../setup-checklist"

export type Announcement = (typeof ANNOUNCEMENTS)[number] & { tiers?: string[]; scheduled?: string; space?: string }
type DiscordSetup = { connected: boolean; roles: Record<string, string>; posts: Record<string, boolean>; removeOnCancel: boolean }
const DEFAULT_DISCORD: DiscordSetup = {
  connected: true,
  roles: Object.fromEntries(DISCORD_ROLES.map((r) => [r.tier, r.role])),
  posts: { lesson: true, live: true, announcement: true, chart: false },
  removeOnCancel: true,
}
/** A community made in setup starts without Discord (the demo ones have it connected). */
const NO_DISCORD: DiscordSetup = { ...DEFAULT_DISCORD, connected: false }
const SERVER_ROLES = ["@Core", "@Trading Desk", "@VIP", "@Members", "@Funded", "No role"]
const CHANNELS = [
  { id: "platform", label: "On the platform" },
  { id: "email", label: "By e-mail" },
  { id: "discord", label: "In Discord" },
] as const

/** ADM-17 Discord connection and roles, ADM-18 announcements. */
export function CommunityAdmin() {
  const { coach } = useCoach()
  const [list, setList] = useCommunityData<Announcement[]>(coach.slug, "announcements", ANNOUNCEMENTS)
  const [spaces, setSpaces] = useCommunityData<Space[]>(coach.slug, "spaces", DEFAULT_SPACES)
  const [rules, setRules] = useCommunityData<string[]>(coach.slug, "rules", DEFAULT_RULES)
  const [d, setD] = useCommunityData(coach.slug, "discord", useWizardCommunity(coach.slug) ? NO_DISCORD : DEFAULT_DISCORD)

  return (
    <Page>
      <PageHeader
        title="Community"
        text={`Your Discord, connected to your tiers, and announcements to your ${coach.wording.students.toLowerCase()}. Students see it as “${coach.wording.community}”.`}
        guide="Connecting Discord · 2 min"
      />
      <SetupTip task="discord" />
      <Tabs defaultValue="announcements" className="gap-5">
        <TabsList>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="spaces">Spaces</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="discord">Discord</TabsTrigger>
        </TabsList>
        <TabsContent value="announcements">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Composer spaces={spaces} onPost={(a) => setList((l) => [a, ...l])} />
            <div className="grid content-start gap-3">
              <h2 className="font-medium">Sent</h2>
              {list.map((a) => (
                <article key={a.id} className="grid gap-3 rounded-lg border bg-card p-4">
                  <div className="flex items-start gap-3">
                    {a.pinned && <Pin className="mt-0.5 size-3.5 shrink-0 text-[var(--ts-interactive)]" />}
                    <span className="flex-1 font-medium">{a.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{a.scheduled ? `Scheduled · ${a.scheduled}` : a.when}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{a.body}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {a.space && spaces.find((x) => x.id === a.space) && (
                      <Badge variant="secondary" className="font-normal">
                        {spaces.find((x) => x.id === a.space)?.name}
                      </Badge>
                    )}
                    {a.channels.map((c) => (
                      <Badge key={c} variant="outline" className="font-normal">
                        {CHANNELS.find((x) => x.id === c)?.label}
                      </Badge>
                    ))}
                    <span className="ml-auto text-xs text-muted-foreground tabular-nums">{a.scheduled ? "Not sent yet" : `Read by ${a.reads}`}</span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={a.pinned ? "Unpin" : "Pin"}
                      onClick={() => setList((l) => l.map((x) => (x.id === a.id ? { ...x, pinned: !x.pinned } : x)))}
                    >
                      <Pin />
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="spaces">
          <SpacesTab spaces={spaces} setSpaces={setSpaces} />
        </TabsContent>

        <TabsContent value="rules">
          <RulesTab rules={rules} setRules={setRules} />
        </TabsContent>

        <TabsContent value="discord" className="grid gap-6">
          <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4">
            <span className="grid size-11 place-items-center rounded-lg bg-[#5865F2] text-white">
              <DiscordMark />
            </span>
            <div className="grid flex-1 gap-0.5">
              <span className="font-medium">{d.connected ? `${coach.org} server` : "Connect your Discord server"}</span>
              <span className="text-sm text-muted-foreground">
                {d.connected
                  ? `${DISCORD.members.toLocaleString("en")} members · ${DISCORD.online} online · our bot gives and removes roles by tier`
                  : "Students link their Discord in one click and get the right role automatically."}
              </span>
            </div>
            {d.connected ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => toast("Roles checked", { description: "3 members got their role, 1 lost it (cancelled)." })}>
                  <RefreshCw /> Check roles now
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setD((x) => ({ ...x, connected: false }))}>
                  <Unplug /> Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => {
                  setD((x) => ({ ...x, connected: true }))
                  toast("Discord connected", { description: "Opens Discord to add our bot to your server." })
                }}
              >
                Connect Discord
              </Button>
            )}
          </div>

          {d.connected && (
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="grid content-start gap-1">
                <h2 className="font-medium">Role for each tier</h2>
                <p className="text-sm text-muted-foreground">Given when someone joins, removed when they cancel.</p>
                <div className="mt-2 divide-y rounded-lg border bg-card px-3">
                  {coach.tiers.map((t, i) => (
                    <SettingRow key={t.id} label={t.name} text={`${t.members} members`}>
                      <NativeSelect value={d.roles[t.id] ?? DISCORD_ROLES[i]?.role ?? "No role"} onChange={(e) => setD((x) => ({ ...x, roles: { ...x.roles, [t.id]: e.target.value } }))}>
                        {SERVER_ROLES.map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </NativeSelect>
                    </SettingRow>
                  ))}
                  <SettingRow label="Remove the role when someone cancels" text="At the end of their paid period">
                    <Switch checked={d.removeOnCancel} onCheckedChange={(v) => setD((x) => ({ ...x, removeOnCancel: v }))} />
                  </SettingRow>
                </div>
              </section>
              <section className="grid content-start gap-1">
                <h2 className="font-medium">Our bot posts in Discord</h2>
                <p className="text-sm text-muted-foreground">So your server knows what&apos;s new on the platform.</p>
                <div className="mt-2 divide-y rounded-lg border bg-card px-3">
                  {(
                    [
                      ["lesson", "New lesson published", "#announcements"],
                      ["live", "A live session starts", "#live"],
                      ["announcement", "Your announcements", "#announcements"],
                      ["chart", "A new marked-up chart", "#trade-ideas"],
                    ] as const
                  ).map(([id, label, channel]) => (
                    <SettingRow key={id} label={label} text={<span className="inline-flex items-center gap-1"><Hash className="size-3" />{channel.slice(1)}</span>}>
                      <Switch checked={!!d.posts[id]} onCheckedChange={(v) => setD((x) => ({ ...x, posts: { ...x.posts, [id]: v } }))} />
                    </SettingRow>
                  ))}
                </div>
              </section>
            </div>
          )}
          <p className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
            <Mono className="mr-1.5 text-[var(--ts-cta)]">Later</Mono>
            Our own feed with channels, posts and shared trades replaces the Discord link for coaches who want everything in one place (STU-12).
          </p>
        </TabsContent>
      </Tabs>
    </Page>
  )
}

function Composer({ spaces, onPost }: { spaces: Space[]; onPost: (a: Announcement) => void }) {
  const { coach } = useCoach()
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [channels, setChannels] = useState<string[]>(["platform", "email", "discord"])
  const [tiers, setTiers] = useState<string[]>([])
  const [pin, setPin] = useState(false)
  const [space, setSpace] = useState("")
  const [later, setLater] = useState(false)
  const [when, setWhen] = useState("Tue 13 Oct, 08:00")

  return (
    <div className="grid content-start gap-3 rounded-lg border bg-card p-4">
      <h2 className="flex items-center gap-2 font-medium">
        <Megaphone className="size-4" /> New announcement
      </h2>
      <Field label="Title">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New module is live" />
      </Field>
      <Field label="Message">
        <Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder="What should everyone know?" />
      </Field>
      {spaces.length > 0 && (
        <Field label="Post in">
          <NativeSelect value={space || spaces[0].id} onChange={(e) => setSpace(e.target.value)}>
            {spaces.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      )}
      <div className="grid gap-2">
        <span className="text-[0.8125rem] font-medium">Send it</span>
        <div className="flex flex-wrap gap-3">
          {CHANNELS.map((c) => (
            <label key={c.id} className="flex items-center gap-1.5 text-sm">
              <Checkbox checked={channels.includes(c.id)} onCheckedChange={(v) => setChannels((x) => (v ? [...x, c.id] : x.filter((y) => y !== c.id)))} />
              {c.label}
            </label>
          ))}
        </div>
      </div>
      <div className="grid gap-2">
        <span className="text-[0.8125rem] font-medium">To</span>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setTiers([])} className={cn("rounded-md border px-2.5 py-1 text-sm bg-card", tiers.length === 0 && "border-[var(--ts-interactive)]")}>
            Everyone
          </button>
          {coach.tiers.map((t) => (
            <button
              key={t.id}
              onClick={() => setTiers((x) => (x.includes(t.id) ? x.filter((y) => y !== t.id) : [...x, t.id]))}
              className={cn("rounded-md border px-2.5 py-1 text-sm bg-card", tiers.includes(t.id) && "border-[var(--ts-interactive)]")}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>
      <div className="divide-y border-t">
        <SettingRow label="Pin to the top" text="Also shows as the Announcement widget on Home">
          <Switch checked={pin} onCheckedChange={setPin} />
        </SettingRow>
        <SettingRow label="Send later">
          {later && <Input value={when} onChange={(e) => setWhen(e.target.value)} className="h-8 w-44" aria-label="When" />}
          <Switch checked={later} onCheckedChange={setLater} />
        </SettingRow>
      </div>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Bell className="size-3.5" /> Students get a notification
        </span>
        <Button
          className="ml-auto"
          disabled={!title.trim() || !body.trim() || channels.length === 0}
          onClick={() => {
            onPost({ id: `n${Date.now()}`, title: title.trim(), body: body.trim(), when: "just now", pinned: pin, channels, reads: 0, tiers, scheduled: later ? when : undefined, space: spaces.length ? space || spaces[0].id : undefined })
            toast(later ? `Scheduled for ${when}` : "Announcement sent", { icon: later ? <CalendarClock className="size-4" /> : <Check className="size-4" /> })
            setTitle("")
            setBody("")
            setPin(false)
          }}
        >
          <Send /> {later ? "Schedule" : "Send now"}
        </Button>
      </div>
    </div>
  )
}

function SpacesTab({ spaces, setSpaces }: { spaces: Space[]; setSpaces: (n: Space[] | ((c: Space[]) => Space[])) => void }) {
  const edit = (id: string, patch: Partial<Space>) => setSpaces((l) => l.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  return (
    <section className="grid max-w-2xl content-start gap-1">
      <h2 className="font-medium">Spaces</h2>
      <p className="text-sm text-muted-foreground">Topics your students can filter the feed by. Every post goes in one space.</p>
      <div className="mt-2 grid gap-2">
        {spaces.map((s) => (
          <div key={s.id} className="flex items-center gap-2 rounded-lg border bg-card p-2.5">
            <Hash className="size-4 shrink-0 text-muted-foreground" />
            <Input aria-label="Space name" value={s.name} onChange={(e) => edit(s.id, { name: e.target.value })} className="h-8 w-44" />
            <Input aria-label="Short description" value={s.text} onChange={(e) => edit(s.id, { text: e.target.value })} className="h-8 flex-1" placeholder="What is it for?" />
            <Button variant="ghost" size="icon-xs" aria-label={`Delete ${s.name}`} onClick={() => setSpaces((l) => l.filter((x) => x.id !== s.id))}>
              <Trash2 />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="justify-self-start" onClick={() => setSpaces((l) => [...l, { id: `s${Date.now()}`, name: "New space", text: "" }])}>
          <Plus /> Add a space
        </Button>
      </div>
    </section>
  )
}

function RulesTab({ rules, setRules }: { rules: string[]; setRules: (n: string[] | ((c: string[]) => string[])) => void }) {
  return (
    <section className="grid max-w-2xl content-start gap-1">
      <h2 className="font-medium">Community rules</h2>
      <p className="text-sm text-muted-foreground">Students see these at the top of the community.</p>
      <div className="mt-2 grid gap-2">
        {rules.map((r, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg border bg-card p-2.5">
            <span className="w-5 text-center text-xs text-muted-foreground tabular-nums">{i + 1}</span>
            <Input aria-label={`Rule ${i + 1}`} value={r} onChange={(e) => setRules((l) => l.map((x, j) => (j === i ? e.target.value : x)))} className="h-8 flex-1" />
            <Button variant="ghost" size="icon-xs" aria-label={`Delete rule ${i + 1}`} onClick={() => setRules((l) => l.filter((_, j) => j !== i))}>
              <Trash2 />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="justify-self-start" onClick={() => setRules((l) => [...l, ""])}>
          <Plus /> Add a rule
        </Button>
      </div>
    </section>
  )
}

export function DiscordMark({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M19.3 5.3A16.6 16.6 0 0 0 15.2 4l-.5 1a15.4 15.4 0 0 0-5.4 0l-.5-1a16.5 16.5 0 0 0-4.1 1.3C2.1 9.2 1.4 13 1.7 16.7a16.7 16.7 0 0 0 5 2.6l1.1-1.7c-.6-.2-1.2-.5-1.7-.9l.4-.3a11.9 11.9 0 0 0 11 0l.4.3c-.5.4-1.1.7-1.7.9l1.1 1.7a16.6 16.6 0 0 0 5-2.6c.4-4.3-.7-8-3-11.4ZM8.7 14.4c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm6.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z" />
    </svg>
  )
}
