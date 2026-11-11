"use client"

import { useState } from "react"
import { CalendarClock, Check, LayoutGrid, MoreHorizontal, Plus, Trash2 } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { DEFAULT_RULES, DEFAULT_SPACES, type Space } from "@/lib/data/community"
import { ANNOUNCEMENTS, DISCORD_ROLES } from "@/lib/data/people"
import { cn } from "@/lib/utils"
import { PageHeader, useCommunityData } from "../kit"
import { SetupTip, useWizardCommunity } from "../setup-checklist"
import { AdminButton, AdminDrawer, AdminField, AdminFilter, AdminModal, AdminSegmented, AdminTable, AdminTableFooter, AdminTableHead, AdminTabs, AdminTd, AdminTh, AdminTr, Callout, EmptyState, Panel, SortHint, SortableRow, Tag, adminControl, useMoveFeedback } from "../ui"
import { dropLine } from "@/components/kit/drop-line"

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
const SERVER_ROLES = ["@inner-circle", "@core", "@desk", "@vip", "@members", "@funded", "No role"]
const CHANNELS = [
  { id: "platform", label: "Platform", post: "On the platform" },
  { id: "email", label: "E-mail", post: "By e-mail" },
  { id: "discord", label: "Discord", post: "In Discord" },
] as const
const BOT_POSTS = [
  ["lesson", "New lesson published", "#announcements"],
  ["live", "A live session starts", "#live"],
  ["chart", "A new marked-up chart", "#charts"],
] as const
const TABS = [
  { id: "announcements", label: "Announcements" },
  { id: "spaces", label: "Spaces & rules" },
  { id: "discord", label: "Discord" },
] as const
type Tab = (typeof TABS)[number]["id"]

/** Community (Figma 534:7152, 01 to 05): announcements, spaces and rules, and the Discord connection. */
export function CommunityAdmin() {
  const { coach } = useCoach()
  const [list, setList] = useCommunityData<Announcement[]>(coach.slug, "announcements", ANNOUNCEMENTS)
  const [spaces, setSpaces] = useCommunityData<Space[]>(coach.slug, "spaces", DEFAULT_SPACES)
  const [rules, setRules] = useCommunityData<string[]>(coach.slug, "rules", DEFAULT_RULES)
  const [d, setD] = useCommunityData(coach.slug, "discord", useWizardCommunity(coach.slug) ? NO_DISCORD : DEFAULT_DISCORD)
  const [tab, setTab] = useState<Tab>("announcements")
  const [composing, setComposing] = useState(false)
  const [editing, setEditing] = useState<Space | "new" | null>(null)

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4">
      <PageHeader
        title="Community"
        text="Announcements, spaces and Discord"
        actions={
          tab === "spaces" ? (
            <AdminButton onClick={() => setEditing("new")}><Plus /> New space</AdminButton>
          ) : (
            <AdminButton onClick={() => setComposing(true)}><Plus /> New announcement</AdminButton>
          )
        }
      />
      <SetupTip task="discord" />
      <AdminTabs label="Community" tabs={TABS} value={tab} onChange={setTab} className="self-start" />

      {tab === "announcements" && <AnnouncementsTab list={list} setList={setList} d={d} setD={setD} />}
      {tab === "spaces" && <SpacesTab spaces={spaces} setSpaces={setSpaces} rules={rules} setRules={setRules} onEdit={setEditing} />}
      {tab === "discord" && <DiscordTab d={d} setD={setD} />}

      <AnnouncementDrawer open={composing} onOpenChange={setComposing} onPost={(a) => setList((l) => [{ ...a, space: spaces[0]?.id }, ...l])} />
      <SpaceDialog space={editing} onClose={() => setEditing(null)} onSave={(s) => setSpaces((l) => (l.some((x) => x.id === s.id) ? l.map((x) => (x.id === s.id ? s : x)) : [...l, s]))} />
    </div>
  )
}

/* ---------- 01 Announcements ---------- */

function AnnouncementsTab({ list, setList, d, setD }: { list: Announcement[]; setList: (n: Announcement[] | ((c: Announcement[]) => Announcement[])) => void; d: DiscordSetup; setD: (n: DiscordSetup | ((c: DiscordSetup) => DiscordSetup)) => void }) {
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
            <AdminTh width={236}>Sent to</AdminTh>
            <AdminTh width={236}>When</AdminTh>
            <AdminTh width={64} />
          </AdminTableHead>
          <tbody>
            {list.map((a) => (
              <AdminTr key={a.id}>
                <AdminTd>
                  <div className="flex min-w-0 items-center gap-2.5">
                    {a.pinned && <Tag tone="accent" dot>Pinned</Tag>}
                    <div className="grid min-w-0 gap-0.5">
                      <span className="truncate t-body-m text-a-text">{a.title}</span>
                      <span className="truncate t-caption text-a-text-2">{a.body}</span>
                    </div>
                  </div>
                </AdminTd>
                <AdminTd>{a.channels.map((c) => CHANNELS.find((x) => x.id === c)?.label).join(", ")}</AdminTd>
                <AdminTd className={cn("whitespace-nowrap", a.scheduled && "text-a-text-accent")}>{a.scheduled ? `Scheduled · ${a.scheduled}` : `Sent · ${a.when}`}</AdminTd>
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
      <Panel className="gap-3">
        <h2 className="t-heading-s text-a-text">Automatic announcements</h2>
        <div className="flex flex-col gap-3">
          {BOT_POSTS.map(([id, label]) => (
            <label key={id} className="flex items-center justify-between gap-3 t-body-m text-a-text">
              {label}
              <Switch checked={!!d.posts[id]} onCheckedChange={(v) => setD((x) => ({ ...x, posts: { ...x.posts, [id]: v } }))} />
            </label>
          ))}
        </div>
      </Panel>
    </>
  )
}

/* ---------- 02 New announcement ---------- */

function AnnouncementDrawer({ open, onOpenChange, onPost }: { open: boolean; onOpenChange: (o: boolean) => void; onPost: (a: Announcement) => void }) {
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

/* ---------- 03 Spaces and rules ---------- */

function SpacesTab({ spaces, setSpaces, rules, setRules, onEdit }: { spaces: Space[]; setSpaces: (n: Space[] | ((c: Space[]) => Space[])) => void; rules: string[]; setRules: (n: string[] | ((c: string[]) => string[])) => void; onEdit: (s: Space) => void }) {
  const { coach } = useCoach()
  const [drag, setDrag] = useState<number | null>(null)
  const [over, setOver] = useState<number | null>(null)
  const { flashed, moved, Live } = useMoveFeedback()
  const n = spaces.length
  const reorder = (from: number, to: number) => {
    if (from === to || to < 0 || to >= n) return
    const before = spaces
    const next = [...before]
    const [m] = next.splice(from, 1)
    next.splice(to, 0, m)
    setSpaces(next)
    moved(m.id, `${m.name} moved to ${to + 1} of ${n}.`)
    toast(`# ${m.name} moved to ${to + 1} of ${n}.`, { id: "space-undo", action: { label: "Undo", onClick: () => setSpaces(before) } })
  }
  const drop = (i: number) => {
    if (drag !== null) reorder(drag, i)
    setDrag(null)
    setOver(null)
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,784fr)_minmax(0,400fr)]">
      <Panel className="gap-0 overflow-hidden p-0">
        <SortHint id="space-sort-hint" />
        <Live />
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <h2 className="t-heading-s text-a-text">Spaces</h2>
          {n > 1 && <span className="t-caption text-a-text-3">Drag to reorder</span>}
        </div>
        {n === 0 && <p className="border-t border-a-border px-5 py-8 text-center t-body-m text-a-text-2">No spaces yet. Add one for each topic.</p>}
        {spaces.map((s, i) => {
          const tier = s.audience ? coach.tiers.find((t) => t.id === s.audience)?.name : undefined
          return (
            <div key={s.id} onDragOver={(e) => drag !== null && (e.preventDefault(), setOver(i))} onDrop={() => drop(i)} className={cn("border-t border-a-border", over === i && drag !== null && drag !== i && dropLine(drag < i ? "after" : "before"))}>
              <SortableRow
                className="rounded-none"
                dragging={drag === i}
                active={flashed(s.id)}
                handle={{
                  label: `Reorder ${s.name}`,
                  hintId: "space-sort-hint",
                  onMove: (by) => reorder(i, i + by),
                  draggable: true,
                  onDragStart: (e) => {
                    setDrag(i)
                    e.dataTransfer.effectAllowed = "move"
                    const row = e.currentTarget.closest("[data-slot=sortable-row]") ?? e.currentTarget
                    e.dataTransfer.setDragImage(row, 24, 26)
                  },
                  onDragEnd: () => (setDrag(null), setOver(null)),
                }}
                title={<># {s.name}</>}
                description={s.text}
                trailing={
                  <>
                    <Tag>{tier ?? "Everyone"}</Tag>
                    {s.posts !== undefined && <span className="t-caption text-a-text-2 tabular-nums">{s.posts >= 1000 ? `${(s.posts / 1000).toFixed(1)}k` : s.posts} posts</span>}
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<AdminButton hierarchy="ghost" size="md" iconOnly aria-label={`Actions for ${s.name}`} />}><MoreHorizontal /></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(s)}>Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => (setSpaces((l) => l.filter((x) => x.id !== s.id)), toast(`# ${s.name} deleted`))}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                }
              />
            </div>
          )
        })}
      </Panel>
      <RulesPanel rules={rules} setRules={setRules} />
    </div>
  )
}

function RulesPanel({ rules, setRules }: { rules: string[]; setRules: (n: string[] | ((c: string[]) => string[])) => void }) {
  const [edit, setEdit] = useState<number | null>(null)
  return (
    <Panel className="gap-3">
      <h2 className="t-heading-s text-a-text">Community rules</h2>
      <ol className="flex flex-col gap-3">
        {rules.map((r, i) => (
          <li key={i} className="group/rule flex items-start gap-2 t-body-m">
            <span className="w-4 shrink-0 text-center t-caption leading-[18px] text-a-text-accent tabular-nums">{i + 1}</span>
            {edit === i ? (
              <input autoFocus aria-label={`Rule ${i + 1}`} defaultValue={r} onBlur={(e) => (setRules((l) => (e.target.value.trim() ? l.map((x, j) => (j === i ? e.target.value.trim() : x)) : l.filter((_, j) => j !== i))), setEdit(null))} onKeyDown={(e) => (e.key === "Enter" && e.currentTarget.blur()) || (e.key === "Escape" && setEdit(null))} className={cn(adminControl, "h-8 min-w-0 flex-1 py-0 t-body-m")} />
            ) : (
              <>
                <button type="button" onClick={() => setEdit(i)} aria-label={`Edit rule ${i + 1}: ${r}`} className="min-w-0 flex-1 rounded-a-xs text-left text-a-text outline-none focus-visible:ring-2 focus-visible:ring-a-border-focus">{r}</button>
                <button type="button" aria-label={`Delete rule ${i + 1}`} onClick={() => setRules((l) => l.filter((_, j) => j !== i))} className="grid size-5 shrink-0 place-items-center rounded-a-xs text-a-text-3 opacity-0 outline-none transition-opacity hover:text-a-text focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-a-border-focus group-hover/rule:opacity-100 pointer-coarse:size-8 pointer-coarse:opacity-100">
                  <Trash2 className="size-3.5" />
                </button>
              </>
            )}
          </li>
        ))}
      </ol>
      <AdminButton hierarchy="ghost" size="md" className="w-fit" onClick={() => (setRules((l) => [...l, ""]), setEdit(rules.length))}>
        <Plus /> Add rule
      </AdminButton>
    </Panel>
  )
}

function SpaceDialog({ space, onClose, onSave }: { space: Space | "new" | null; onClose: () => void; onSave: (s: Space) => void }) {
  const { coach } = useCoach()
  const [last, setLast] = useState<Space | "new" | null>(space)
  const [name, setName] = useState("")
  const [text, setText] = useState("")
  const [audience, setAudience] = useState("")
  if (space && space !== last) {
    setLast(space)
    setName(space === "new" ? "" : space.name)
    setText(space === "new" ? "" : space.text)
    setAudience(space === "new" ? "" : (space.audience ?? ""))
  }
  const shown = space ?? last
  const slug = name.trim().replace(/^#\s*/, "").toLowerCase().replace(/\s+/g, "-")
  return (
    <AdminModal open={!!space} onOpenChange={(o) => !o && onClose()} title={shown === "new" ? "New space" : "Edit space"} subtitle="A topic your students can post in and filter the feed by." className="sm:max-w-[480px]"
      footer={
        <div className="flex w-full items-center gap-2">
          <span aria-hidden className="h-px min-w-px flex-1" />
          <AdminButton hierarchy="ghost" onClick={onClose}>Cancel</AdminButton>
          <AdminButton disabled={!slug} onClick={() => (onSave({ ...(shown && shown !== "new" ? shown : { id: `s${Date.now()}`, posts: 0 }), name: slug, text: text.trim(), audience: audience || undefined }), onClose())}>Save</AdminButton>
        </div>
      }>
      <AdminField label="Name" hint="Lowercase, with dashes">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="trade-ideas" className={cn(adminControl, "h-11")} />
      </AdminField>
      <AdminField label="What is it for?" optional>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Share setups before the open" className={cn(adminControl, "h-11")} />
      </AdminField>
      <div className="grid gap-1.5">
        <span className="t-caption text-a-text">Who sees it</span>
        <AdminFilter ariaLabel="Who sees it" value={audience} onValueChange={setAudience} options={[{ value: "", label: "Everyone" }, ...coach.tiers.map((t) => ({ value: t.id, label: t.name }))]} className="w-full justify-between" />
      </div>
    </AdminModal>
  )
}

/* ---------- 04 and 05 Discord ---------- */

function DiscordTab({ d, setD }: { d: DiscordSetup; setD: (n: DiscordSetup | ((c: DiscordSetup) => DiscordSetup)) => void }) {
  const { coach } = useCoach()
  if (!d.connected) {
    return (
      <EmptyState
        icon={LayoutGrid}
        title="Connect your Discord server"
        description="Students get the right role for their tier, and our bot posts what's new. Takes about 2 minutes."
        className="py-12"
        actions={<AdminButton onClick={() => (setD((x) => ({ ...x, connected: true })), toast("Discord connected", { description: "Roles are checked now." }))}>Connect Discord</AdminButton>}
      />
    )
  }
  return (
    <>
      <Callout tone="success" icon={<Check className="size-4" />} action={<AdminButton hierarchy="secondary" size="md" onClick={() => toast("Roles checked", { description: "Every member has the role of their tier." })}>Review</AdminButton>}>
        Discord connected · {coach.org} Traders · Roles checked 2 min ago
      </Callout>
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,572fr)_minmax(0,612fr)]">
        <Panel className="gap-0 overflow-hidden p-0">
          <div className="grid gap-1 px-5 py-4">
            <h2 className="t-heading-s text-a-text">Role for each tier</h2>
            <p className="t-caption text-a-text-2">Given when someone joins, removed when they cancel.</p>
          </div>
          {coach.tiers.map((t) => (
            <div key={t.id} className="flex h-[52px] items-center justify-between gap-3 border-t border-a-border px-5 t-body-m text-a-text">
              <span className="min-w-0 truncate">{t.name}</span>
              <AdminFilter ariaLabel={`Role for ${t.name}`} value={d.roles[t.id] ?? "No role"} onValueChange={(v) => setD((x) => ({ ...x, roles: { ...x.roles, [t.id]: v } }))} options={[...new Set([d.roles[t.id] ?? "No role", ...SERVER_ROLES])].map((r) => ({ value: r, label: r }))} />
            </div>
          ))}
        </Panel>
        <Panel className="gap-3">
          <div className="grid gap-0.5">
            <h2 className="t-heading-s text-a-text">Our bot posts in Discord</h2>
            <p className="t-caption text-a-text-2">So your server knows what&apos;s new on the platform.</p>
          </div>
          <div className="flex flex-col gap-3">
            {BOT_POSTS.map(([id, label, channel]) => (
              <label key={id} className="flex items-center gap-2.5 t-body-m text-a-text">
                <Switch checked={!!d.posts[id]} onCheckedChange={(v) => setD((x) => ({ ...x, posts: { ...x.posts, [id]: v } }))} />
                {label}
                <span aria-hidden className="h-px min-w-px flex-1" />
                <span className="t-caption text-a-text-3">{channel}</span>
              </label>
            ))}
          </div>
          <hr className="m-0 h-px border-0 bg-a-border-subtle" />
          <label className="flex items-center justify-between gap-6">
            <span className="grid gap-0.5">
              <span className="t-body-m text-a-text">Remove the role when someone cancels</span>
              <span className="t-caption text-a-text-2">At the end of their paid period</span>
            </span>
            <Switch checked={d.removeOnCancel} onCheckedChange={(v) => setD((x) => ({ ...x, removeOnCancel: v }))} />
          </label>
        </Panel>
      </div>
    </>
  )
}

export function DiscordMark({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M19.3 5.3A16.6 16.6 0 0 0 15.2 4l-.5 1a15.4 15.4 0 0 0-5.4 0l-.5-1a16.5 16.5 0 0 0-4.1 1.3C2.1 9.2 1.4 13 1.7 16.7a16.7 16.7 0 0 0 5 2.6l1.1-1.7c-.6-.2-1.2-.5-1.7-.9l.4-.3a11.9 11.9 0 0 0 11 0l.4.3c-.5.4-1.1.7-1.7.9l1.1 1.7a16.6 16.6 0 0 0 5-2.6c.4-4.3-.7-8-3-11.4ZM8.7 14.4c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm6.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z" />
    </svg>
  )
}
