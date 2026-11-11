"use client"

import { useState } from "react"
import Link from "next/link"
import { MoreHorizontal, Plus, Star, Trophy } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { isFreeTier, useGroups, useTiers } from "@/lib/data/access"
import { ADMIN_BADGES, COMPETITIONS, COMPETITION_METRICS, POINTS, competitionState, dayLabel, type Competition } from "@/lib/data/people"
import { cn } from "@/lib/utils"
import { PageHeader, useCommunityData } from "../kit"
import { AdminButton, AdminField, AdminFilter, AdminModal, AdminSegmented, AdminTable, AdminTableFooter, AdminTableHead, AdminTabs, AdminTd, AdminTh, AdminTr, Callout, EmptyState, Panel, PanelHeader, Tag, adminControl } from "../ui"

export type RankingSetup = { metric: string; period: string; nicknames: boolean; optOut: boolean; competitions: Competition[]; points: typeof POINTS; badges?: typeof ADMIN_BADGES }
export const DEFAULT_RANKING: RankingSetup = { metric: "discipline", period: "month", nicknames: true, optOut: true, competitions: COMPETITIONS, points: POINTS, badges: ADMIN_BADGES }

/** Saved setups from before the redesign hold competitions and points in the old shape: use the new ones then. */
export function normalizeRanking(r: RankingSetup): RankingSetup {
  const fresh = Array.isArray(r.competitions) && r.competitions.every((c) => "who" in c)
  const pts = Array.isArray(r.points) && r.points.every((p) => "on" in p)
  return { ...r, competitions: fresh ? r.competitions : COMPETITIONS, points: pts ? r.points : POINTS, badges: r.badges ?? ADMIN_BADGES }
}

/** Admin leaderboard (Figma 537:7990): points this month, with the shape of the other periods and each student's group. */
const BOARD = [
  { name: "Sara Kowalski", initials: "SK", tier: "Trading Desk", group: "mastermind", points: 2410, rules: 96, change: 3, week: 0.28, all: 3.6 },
  { name: "Jonas Weber", initials: "JW", tier: "Inner Circle", group: "oct", points: 2180, rules: 91, change: -1, week: 0.25, all: 4.1 },
  { name: "Mia Sørensen", initials: "MS", tier: "Trading Desk", group: "oct", points: 1960, rules: 88, change: 5, week: 0.3, all: 3.2 },
  { name: "Lena Ito", initials: "LI", tier: "1:1 VIP", group: "nov", points: 1720, rules: 93, change: 0, week: 0.22, all: 3.9 },
  { name: "Alex Moreau", initials: "AM", tier: "Trading Desk", group: "oct", points: 1604, rules: 74, change: -2, week: 0.2, all: 3.7 },
  { name: "Priya Nair", initials: "PN", tier: "Inner Circle", group: "nov", points: 1511, rules: 90, change: 1, week: 0.26, all: 4.4 },
]
const PERIODS = [{ value: "week", label: "This week" }, { value: "month", label: "This month" }, { value: "all", label: "All time" }]
const TABS = [{ id: "leaderboard", label: "Leaderboard" }, { id: "competitions", label: "Competitions" }, { id: "points", label: "Points & badges" }] as const
type Tab = (typeof TABS)[number]["id"]
const metricName = (m: Competition["metric"]) => COMPETITION_METRICS.find((x) => x.value === m)?.label ?? m

/** Ranking (Figma 537:7989: 01 Leaderboard, 02 Competitions, 03 New competition, 04 Points & badges). */
export function RankingAdmin() {
  const { coach, base } = useCoach()
  const [stored, setR] = useCommunityData(coach.slug, "ranking", DEFAULT_RANKING)
  const r = normalizeRanking(stored)
  const [tab, setTab] = useState<Tab>("leaderboard")
  const [editing, setEditing] = useState<Competition | "new" | null>(null)
  const [group, setGroup] = useState("all")
  const set = (p: Partial<RankingSetup>) => setR((x) => ({ ...normalizeRanking(x), ...p }))

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4">
      <PageHeader
        title="Ranking"
        text="Leaderboard, competitions, points and badges"
        actions={
          <>
            <Tag tone="warning" dot>V2</Tag>
            <AdminButton onClick={() => setEditing("new")}>
              <Plus /> New competition
            </AdminButton>
          </>
        }
      />
      {!coach.modules.ranking && (
        <Callout tone="warning" icon={<Trophy className="size-4" />} action={<AdminButton nativeButton={false} render={<Link href={`${base}/design`} />} hierarchy="secondary" size="md">Review</AdminButton>}>
          Ranking is switched off, so students don&apos;t see it yet.
        </Callout>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <AdminTabs label="Ranking sections" tabs={TABS} value={tab} onChange={setTab} />
        {tab === "leaderboard" && <LeaderboardControls period={r.period} setPeriod={(v) => set({ period: v })} group={group} setGroup={setGroup} />}
      </div>
      {tab === "leaderboard" && <Leaderboard period={r.period} group={group} />}
      {tab === "competitions" && <Competitions list={r.competitions} setList={(l) => set({ competitions: l })} onEdit={setEditing} onNew={() => setEditing("new")} />}
      {tab === "points" && <PointsAndBadges r={r} set={set} />}
      <CompetitionModal
        item={editing}
        onClose={() => setEditing(null)}
        onSave={(c, isNew) => {
          set({ competitions: isNew ? [c, ...r.competitions] : r.competitions.map((x) => (x.id === c.id ? c : x)) })
          setTab("competitions")
          toast(isNew ? `${c.name} scheduled` : `${c.name} saved`, { description: isNew ? "Students see it in Ranking and get a notification." : undefined })
        }}
      />
    </div>
  )
}

function LeaderboardControls({ period, setPeriod, group, setGroup }: { period: string; setPeriod: (v: string) => void; group: string; setGroup: (v: string) => void }) {
  const { coach } = useCoach()
  const groups = useGroups(coach)
  return (
    <>
      <div className="flex-1" />
      <AdminSegmented size="sm" label="Period" value={period} onChange={setPeriod} options={PERIODS} className="w-[300px] max-sm:w-full" />
      <AdminFilter label="Group" ariaLabel="Group" value={group} onValueChange={setGroup} options={[{ value: "all", label: "All groups" }, ...groups.map((g) => ({ value: g.id, label: g.name }))]} />
    </>
  )
}

function Leaderboard({ period, group }: { period: string; group: string }) {
  const rows = BOARD.filter((b) => group === "all" || b.group === group)
    .map((b) => ({ ...b, shown: Math.round(period === "week" ? b.points * b.week : period === "all" ? b.points * b.all : b.points) }))
    .sort((a, b) => b.shown - a.shown)
  return (
    <AdminTable minWidth={760} scrollLabel="Leaderboard" footer={<AdminTableFooter>Ranks by points: lessons, journal entries and rules kept. Students can opt out.</AdminTableFooter>}>
      <AdminTableHead>
        <AdminTh width={64}>#</AdminTh>
        <AdminTh>Student</AdminTh>
        <AdminTh width={200}>Tier</AdminTh>
        <AdminTh width={130} align="end">Points</AdminTh>
        <AdminTh width={140} align="end">Rules kept</AdminTh>
        <AdminTh width={110} align="end">Move</AdminTh>
      </AdminTableHead>
      <tbody>
        {rows.length === 0 && (
          <tr className="border-t border-a-border">
            <td colSpan={6} className="px-5 py-10 text-center t-body-m text-a-text-2">No one in this group has points yet.</td>
          </tr>
        )}
        {rows.map((l, i) => (
          <AdminTr key={l.name}>
            <AdminTd className={cn("tabular-nums", i < 3 && "text-a-text-accent")}>{i + 1}</AdminTd>
            <AdminTd>
              <div className="flex items-center gap-2.5 text-a-text">
                <Avatar className="size-8"><AvatarFallback>{l.initials}</AvatarFallback></Avatar>
                {l.name}
              </div>
            </AdminTd>
            <AdminTd>{l.tier}</AdminTd>
            <AdminTd align="end" className="text-a-text">{l.shown.toLocaleString("en")}</AdminTd>
            <AdminTd align="end">{l.rules}%</AdminTd>
            <AdminTd align="end" className={l.change > 0 ? "text-a-success" : l.change < 0 ? "text-a-danger" : ""}>{l.change > 0 ? `+${l.change}` : l.change < 0 ? `−${Math.abs(l.change)}` : "0"}</AdminTd>
          </AdminTr>
        ))}
      </tbody>
    </AdminTable>
  )
}

// ---------- Competitions

function Competitions({ list, setList, onEdit, onNew }: { list: Competition[]; setList: (l: Competition[]) => void; onEdit: (c: Competition) => void; onNew: () => void }) {
  if (list.length === 0) return <EmptyState icon={Trophy} title="No competitions yet" description="Run one for a month: pick what ranks students and a prize." actions={<AdminButton onClick={onNew}><Plus /> New competition</AdminButton>} />
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
      {list.map((c) => {
        const st = competitionState(c)
        return (
          <Panel key={c.id} className="gap-4">
            <div className="flex items-center gap-2">
              <h2 className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 t-heading-m text-a-text">
                {c.name}
                {st.status === "upcoming" && <Tag tone="accent" dot>Starts in {st.days} {st.days === 1 ? "day" : "days"}</Tag>}
                {st.status === "running" && <Tag tone="success" dot>Running · {st.days} {st.days === 1 ? "day" : "days"} left</Tag>}
                {st.status === "ended" && <Tag>Ended</Tag>}
              </h2>
              <DropdownMenu>
                <DropdownMenuTrigger render={<AdminButton aria-label={`Actions for ${c.name}`} hierarchy="ghost" size="md" iconOnly className="-mr-2" />}>
                  <MoreHorizontal />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(c)}>{st.status === "ended" ? "View" : "Edit"}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => {
                      const before = list
                      setList(list.filter((x) => x.id !== c.id))
                      toast(`${c.name} deleted`, { action: { label: "Undo", onClick: () => setList(before) } })
                    }}>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <dl className="grid grid-cols-3 gap-4 px-1">
              {([["Ranks by", metricName(c.metric)], ["Prize", c.prize], ["Entrants", String(c.entrants)]] as const).map(([k, v]) => (
                <div key={k} className="grid min-w-0 gap-1.5">
                  <dt className="t-mono-label-s text-a-text-2">{k}</dt>
                  <dd className="truncate t-body-l text-a-text" title={v}>{v}</dd>
                </div>
              ))}
            </dl>
            <p className="t-caption text-a-text-2">{st.status === "ended" ? `Ended ${dayLabel(c.end)}${c.winner ? ` · Winner: ${c.winner}` : ""}` : `${dayLabel(c.start)} – ${dayLabel(c.end)}`}</p>
          </Panel>
        )
      })}
    </div>
  )
}

function CompetitionModal({ item, onClose, onSave }: { item: Competition | "new" | null; onClose: () => void; onSave: (c: Competition, isNew: boolean) => void }) {
  const { coach } = useCoach()
  const tiers = useTiers(coach).filter((t) => !isFreeTier(t))
  const groups = useGroups(coach)
  const blank: Competition = { id: "", name: "", metric: "rules", start: "2026-11-15", end: "2026-11-30", prize: "", entrants: 0, who: "everyone", picked: [], nicknames: true }
  const [c, setC] = useState<Competition>(blank)
  const [key, setKey] = useState<string | null>(null)
  const [tried, setTried] = useState(false)
  const k = item === null ? null : item === "new" ? "new" : item.id
  // Open with this competition's values each time (derived state, no effect).
  if (k !== key && k !== null) {
    setKey(k)
    setC(item === "new" ? blank : { ...(item as Competition) })
    setTried(false)
  }
  if (k === null && key !== null) setKey(null)
  const isNew = item === "new"
  const ended = !isNew && item !== null && competitionState(item).status === "ended"
  const set = (p: Partial<Competition>) => setC((v) => ({ ...v, ...p }))
  const errors = { name: c.name.trim() ? "" : "Give it a name", dates: c.end < c.start ? "It can't end before it starts" : "", who: c.who === "pick" && !(c.picked?.length) ? "Pick at least one tier or group" : "" }
  const submit = () => {
    setTried(true)
    if (Object.values(errors).some(Boolean)) return
    onSave({ ...c, status: ({ upcoming: "scheduled", running: "running", ended: "ended" } as const)[competitionState(c).status], id: isNew ? `c${Date.now()}` : c.id, name: c.name.trim(), prize: c.prize.trim() || "Bragging rights" }, isNew)
    onClose()
  }
  const toggle = (id: string, on: boolean) => set({ picked: on ? [...(c.picked ?? []), id] : (c.picked ?? []).filter((x) => x !== id) })

  return (
    <AdminModal
      open={item !== null}
      onOpenChange={(o) => !o && onClose()}
      title={isNew ? "New competition" : ended ? c.name : "Edit competition"}
      subtitle="Students see it in Ranking and get a notification."
      className="sm:max-w-[560px]"
      bodyClassName="gap-5"
      footer={
        <>
          <AdminButton hierarchy="ghost" onClick={onClose}>{ended ? "Close" : "Cancel"}</AdminButton>
          {!ended && <AdminButton onClick={submit}>{isNew ? "Create competition" : "Save competition"}</AdminButton>}
        </>
      }>
      <fieldset disabled={ended} className="contents">
        <div className="contents" onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); submit() } }}>
          <AdminField label="Name" error={tried ? errors.name : undefined}>
            <input value={c.name} maxLength={60} onChange={(e) => set({ name: e.target.value })} placeholder="November discipline cup" className={cn(adminControl, "h-11")} />
          </AdminField>
          <div className="grid gap-1.5">
            <span className="t-caption text-a-text">Ranks by</span>
            <AdminSegmented label="Ranks by" value={c.metric} onChange={(v) => set({ metric: v })} options={COMPETITION_METRICS} />
          </div>
          <div className="grid grid-cols-2 items-start gap-3 max-sm:grid-cols-1">
            <AdminField label="Starts" error={tried ? errors.dates : undefined}>
              <input type="date" value={c.start} onChange={(e) => set({ start: e.target.value })} className={cn(adminControl, "h-11")} />
            </AdminField>
            <AdminField label="Ends">
              <input type="date" value={c.end} onChange={(e) => set({ end: e.target.value })} className={cn(adminControl, "h-11")} />
            </AdminField>
          </div>
          <div className="grid gap-1.5">
            <span className="t-caption text-a-text">Who can enter</span>
            <AdminSegmented label="Who can enter" value={c.who} onChange={(v) => set({ who: v })} options={[{ value: "everyone", label: "Everyone" }, { value: "pick", label: "Pick tiers or groups" }]} />
            {c.who === "pick" && (
              <div className="mt-1 flex flex-wrap gap-x-5 gap-y-2">
                {[...tiers.map((t) => ({ id: t.id, name: t.name })), ...groups.map((g) => ({ id: g.id, name: g.name }))].map((o) => (
                  <label key={o.id} className="flex items-center gap-2.5 t-body-m text-a-text">
                    <Checkbox checked={(c.picked ?? []).includes(o.id)} onCheckedChange={(v) => toggle(o.id, !!v)} />
                    {o.name}
                  </label>
                ))}
                {tried && errors.who && <span className="w-full t-caption text-a-danger">{errors.who}</span>}
              </div>
            )}
          </div>
          <AdminField label="Prize" optional>
            <input value={c.prize} onChange={(e) => set({ prize: e.target.value })} placeholder="A free month of Trading Desk" className={cn(adminControl, "h-11")} />
          </AdminField>
          <span className="h-px bg-a-border" aria-hidden />
          <label className="flex items-center justify-between gap-4">
            <span className="grid"><span className="t-body-m text-a-text">Nicknames instead of real names</span><span className="t-caption text-a-text-2">They still see their own position</span></span>
            <Switch checked={c.nicknames} onCheckedChange={(v) => set({ nicknames: v })} />
          </label>
        </div>
      </fieldset>
    </AdminModal>
  )
}

// ---------- Points & badges

function PointsAndBadges({ r, set }: { r: RankingSetup; set: (p: Partial<RankingSetup>) => void }) {
  const [adding, setAdding] = useState(false)
  const badges = r.badges ?? ADMIN_BADGES
  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <AdminTable minWidth={420} scrollLabel="Points per action">
        <AdminTableHead>
          <AdminTh>What ranks students</AdminTh>
          <AdminTh width={130} align="end">Points</AdminTh>
          <AdminTh width={90} align="end">On</AdminTh>
        </AdminTableHead>
        <tbody>
          {r.points.map((p, i) => (
            <AdminTr key={p.action}>
              <AdminTd className={cn("text-a-text", !p.on && "text-a-text-2")}>{p.action}</AdminTd>
              <AdminTd align="end">
                <PointsCell label={p.action} value={p.points} onChange={(n) => set({ points: r.points.map((x, j) => (j === i ? { ...x, points: n } : x)) })} />
              </AdminTd>
              <AdminTd align="end">
                <Switch checked={p.on} onCheckedChange={(v) => set({ points: r.points.map((x, j) => (j === i ? { ...x, on: v } : x)) })} aria-label={`${p.action} on`} />
              </AdminTd>
            </AdminTr>
          ))}
        </tbody>
      </AdminTable>
      <Panel className="gap-3">
        <PanelHeader title="Badges" />
        <ul className="flex flex-col gap-3">
          {badges.map((b) => (
            <li key={b.id} className="flex items-center gap-3">
              <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-a-accent-soft text-a-text-accent"><Star className="size-4" /></span>
              <span className="grid min-w-0 flex-1">
                <span className="truncate t-body-m text-a-text">{b.name}</span>
                <span className="truncate t-caption text-a-text-2">{b.text}</span>
              </span>
              <span className="shrink-0 t-caption text-a-text-2 tabular-nums">{b.earned} students</span>
            </li>
          ))}
        </ul>
        <div>
          <AdminButton hierarchy="ghost" size="md" onClick={() => setAdding(true)}><Plus /> New badge</AdminButton>
        </div>
      </Panel>
      <BadgeModal open={adding} onClose={() => setAdding(false)} onAdd={(b) => (set({ badges: [...badges, b] }), toast(`${b.name} added`))} />
    </div>
  )
}

/** A number that reads as text until you select it: then an input. */
function PointsCell({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  const [edit, setEdit] = useState(false)
  const [draft, setDraft] = useState("")
  const done = () => {
    setEdit(false)
    const n = Math.floor(Number(draft))
    if (draft.trim() !== "" && Number.isFinite(n) && n >= 0) onChange(n)
  }
  if (edit)
    return (
      <input
        autoFocus
        type="number"
        min={0}
        aria-label={`Points for ${label}`}
        value={draft}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={done}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            done()
          }
          if (e.key === "Escape") setEdit(false)
        }}
        className="h-7 w-20 rounded-a-md border border-a-border-focus bg-a-field px-2 text-right t-body-m text-a-text tabular-nums outline-none"
      />
    )
  return (
    <button type="button" aria-label={`${label}: ${value} points. Change`} onClick={() => (setDraft(String(value)), setEdit(true))} className="-mr-1.5 rounded-a-sm px-1.5 py-1 t-body-m text-a-text-2 tabular-nums outline-none transition-colors duration-300 hover:bg-a-hover hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus pointer-coarse:min-h-10">
      {value}
    </button>
  )
}

function BadgeModal({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (b: (typeof ADMIN_BADGES)[number]) => void }) {
  const [name, setName] = useState("")
  const [text, setText] = useState("")
  const [tried, setTried] = useState(false)
  const close = () => {
    onClose()
    setTimeout(() => (setName(""), setText(""), setTried(false)), 200)
  }
  const add = () => {
    setTried(true)
    if (!name.trim() || !text.trim()) return
    onAdd({ id: `b${Date.now()}`, name: name.trim(), text: text.trim(), earned: 0 })
    close()
  }
  return (
    <AdminModal open={open} onOpenChange={(o) => !o && close()} title="New badge" subtitle="Students get it when they do what you describe." className="sm:max-w-[480px]" bodyClassName="gap-4" footer={<><AdminButton hierarchy="ghost" onClick={close}>Cancel</AdminButton><AdminButton onClick={add}>Add badge</AdminButton></>}>
      <AdminField label="Name" error={tried && !name.trim() ? "Give it a name" : undefined}>
        <input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="Early bird" className={cn(adminControl, "h-11")} />
      </AdminField>
      <AdminField label="How it's earned" error={tried && !text.trim() ? "Say how a student earns it" : undefined}>
        <input value={text} maxLength={80} onChange={(e) => setText(e.target.value)} placeholder="Joined 5 live sessions" className={cn(adminControl, "h-11")} />
      </AdminField>
    </AdminModal>
  )
}
