"use client"

import { useEffect, useState } from "react"
import { Check, ExternalLink, MoreHorizontal, Plus, Settings, X } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { allTrades, useFeedback } from "@/lib/data/feedback"
import { STUDENTS, tierFor } from "@/lib/data/people"
import { STRATEGIES, TAGS, fmtR } from "@/lib/data/trades"
import { cn } from "@/lib/utils"
import { PageHeader, useCommunityData } from "../kit"
import { AdminButton, AdminField, AdminFilter, AdminModal, AdminSearch, AdminSegmented, AdminTable, AdminTableFooter, AdminTableHead, AdminTabs, AdminTd, AdminTh, AdminToolbar, AdminTr, CellPerson, EmptyState, Panel, StatPanel, Tag, adminControl } from "../ui"
import { AnswerPage } from "./journal-answer"

/** Who sent which sample trade. In the prototype every student shares the same sample journal. */
const OWNER: Record<string, string> = { t1: "s2", t2: "s5", t3: "s4", t4: "s1", t5: "s6", t6: "s7", t7: "s1" }
const AI_DRAFT: Record<string, string> = {
  t1: "The stop under the range low was fine. The problem is the entry: you bought 30 points above the range after the first push, so the stop had to be wide and the size small. Wait for the retest of the range high, or skip it.",
  t4: "Good read and a clean entry. Closing early before CPI talk is a valid reason, but then write it down as a rule before the trade, not during it. Next time: half off at 1R, rest to target.",
}
type Trades = ReturnType<typeof allTrades>

/** Journal & feedback (Figma 525:7152, 01 to 07): requests, answered, the rules of the journal, and the answer page. */
export function JournalAdmin() {
  const { coach } = useCoach()
  const store = useFeedback(coach.slug)
  const trades = allTrades(store)
  const waiting = trades.filter((t) => t.review === "waiting").sort((a, b) => a.id.localeCompare(b.id))
  const answered = trades.filter((t) => t.review === "answered")
  const [tab, setTab] = useState<"requests" | "answered" | "rules">("requests")
  const [q, setQ] = useState("")
  const [tier, setTier] = useState("all")
  const [sort, setSort] = useState("oldest")
  const [kind, setKind] = useState("all")
  const [since, setSince] = useState("30")
  const [openId, setOpenId] = useState<string | null>(null)
  const open = trades.find((t) => t.id === openId) ?? null

  // Opening a request is a page of its own: the browser's Back (and Esc) bring the list back, so the answer page needs no back button of its own.
  const show = (id: string | null) => {
    if (id) window.history.pushState({ journal: id }, "", `${window.location.pathname}?request=${id}`)
    else if (new URLSearchParams(window.location.search).has("request")) window.history.back()
    setOpenId(id)
  }
  useEffect(() => {
    const sync = () => setOpenId(new URLSearchParams(window.location.search).get("request"))
    sync()
    window.addEventListener("popstate", sync)
    return () => window.removeEventListener("popstate", sync)
  }, [])
  useEffect(() => {
    if (!openId) return
    const esc = (e: KeyboardEvent) => e.key === "Escape" && !document.querySelector("[role=dialog]") && show(null)
    window.addEventListener("keydown", esc)
    return () => window.removeEventListener("keydown", esc)
  })

  if (open) {
    const queue = trades.filter((x) => x.review === "waiting" && x.id !== open.id)
    const go = () => (queue[0] ? setOpenId(queue[0].id) : show(null))
    return <AnswerPage key={open.id} trade={open} student={STUDENTS.find((x) => x.id === OWNER[open.id])!} aiDraft={AI_DRAFT[open.id] ?? "Solid execution. The entry matched the setup; the exit came early. Write down what made you close."} readOnly={open.review !== "waiting"} hasNext={queue.length > 0} onBack={() => show(null)} onNext={go} onSkip={go} />
  }

  const searchLabel = tab === "answered" ? "Search answers" : "Search requests"
  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4">
      <PageHeader
        title="Journal & feedback"
        text="Journal, rules and feedback requests · 312 entries in the last 30 days"
        actions={
          tab === "rules" ? (
            <AdminButton hierarchy="secondary" nativeButton={false} render={<a href={`/c/${coach.slug}/journal`} target="_blank" rel="noreferrer" />}>
              <ExternalLink /> Preview as student
            </AdminButton>
          ) : (
            <AdminButton hierarchy="secondary" onClick={() => setTab("rules")}>
              <Settings /> Journal rules
            </AdminButton>
          )
        }
      />
      {tab !== "rules" && (
        <StatPanel
          stats={[
            { label: "Waiting for you", value: waiting.length, delta: waiting.length ? "Oldest 2 days" : "All caught up", tone: waiting.length ? "neutral" : "success" },
            { label: "Answered this week", value: answered.length, delta: "Median reply 6 h" },
            { label: "Rules kept", value: "84%", delta: "+3 pp vs last 30 days", tone: "success" },
            { label: "Journaling students", value: 121, delta: "60% of active students" },
          ]}
        />
      )}
      <AdminToolbar>
        <AdminTabs label="Journal" value={tab} onChange={setTab} tabs={[{ id: "requests", label: "Requests", count: waiting.length }, { id: "answered", label: "Answered", count: answered.length }, { id: "rules", label: "Rules" }]} />
        {tab !== "rules" && (waiting.length > 0 || tab === "answered") && (
          <>
            <div className="flex-1" />
            <AdminSearch value={q} onChange={setQ} placeholder={searchLabel} hint="⌘K" />
            {tab === "requests" ? (
              <>
                <AdminFilter label="Tier" ariaLabel="Tier" value={tier} onValueChange={setTier} options={[{ value: "all", label: "All tiers" }, ...coach.tiers.map((t) => ({ value: t.id, label: t.name }))]} />
                <AdminFilter label="Sort" ariaLabel="Sort" value={sort} onValueChange={setSort} options={[{ value: "oldest", label: "Oldest first" }, { value: "newest", label: "Newest first" }]} />
              </>
            ) : (
              <>
                <AdminFilter label="Type" ariaLabel="Type" value={kind} onValueChange={setKind} options={[{ value: "all", label: "All types" }, { value: "text", label: "Text" }, { value: "voice", label: "Voice note" }, { value: "video", label: "Video" }, { value: "chart", label: "Screenshot" }]} />
                <AdminFilter ariaLabel="Period" value={since} onValueChange={setSince} options={[{ value: "7", label: "Last 7 days" }, { value: "30", label: "Last 30 days" }, { value: "all", label: "All time" }]} />
              </>
            )}
          </>
        )}
      </AdminToolbar>

      {tab === "requests" &&
        (waiting.length === 0 ? (
          <EmptyState
            icon={Check}
            title="Nothing waiting"
            description="New feedback requests show up here. Students get a notification and an e-mail when you answer."
            actions={
              <>
                <AdminButton hierarchy="secondary" onClick={() => setTab("answered")}>See answered</AdminButton>
                <AdminButton hierarchy="ghost" onClick={() => setTab("rules")}>Journal rules</AdminButton>
              </>
            }
          />
        ) : (
          <RequestsTable trades={waiting} onOpen={show} q={q} tier={tier} sort={sort} />
        ))}
      {tab === "answered" && (answered.length === 0 ? <EmptyState icon={Check} title="Nothing answered yet" description="Feedback you send shows up here." /> : <AnsweredTable trades={answered} onOpen={show} q={q} kind={kind} since={since} />)}
      {tab === "rules" && <JournalRules />}
    </div>
  )
}

const ownerOf = (id: string) => STUDENTS.find((x) => x.id === OWNER[id])!

/** Figma 525:7153: who, what they asked, the trade, the rules, how long it has waited. */
function RequestsTable({ trades, onOpen, q, tier, sort }: { trades: Trades; onOpen: (id: string) => void; q: string; tier: string; sort: string }) {
  const { coach } = useCoach()
  const rows = trades
    .map((t) => ({ t, s: ownerOf(t.id), ask: t.thread.find((m) => m.from === "student") }))
    .filter(({ s, ask }) => (tier === "all" || s.tier === tier) && `${s.name} ${ask?.text ?? ""}`.toLowerCase().includes(q.toLowerCase()))
  if (sort === "newest") rows.reverse()
  if (rows.length === 0) return <EmptyState icon={Check} title="No requests match" description="Clear the search or the filters." />
  return (
    <AdminTable minWidth={1000} footer={<AdminTableFooter>{rows.length} {rows.length === 1 ? "request" : "requests"} · students get a notification and an e-mail when you answer</AdminTableFooter>}>
      <AdminTableHead>
        <AdminTh>Student</AdminTh>
        <AdminTh width={284}>Question</AdminTh>
        <AdminTh width={216}>Trade</AdminTh>
        <AdminTh width={186}>Rules</AdminTh>
        <AdminTh width={106} align="end">Waiting</AdminTh>
        <AdminTh width={106} />
      </AdminTableHead>
      <tbody>
        {rows.map(({ t, s, ask }) => (
          <AdminTr key={t.id}>
            <AdminTd><CellPerson initials={s.initials} name={s.name} subtitle={tierFor(coach, s.tier).name} /></AdminTd>
            <AdminTd className="truncate text-a-text">{ask ? `“${ask.text}”` : "—"}</AdminTd>
            <AdminTd className="whitespace-nowrap">
              <span className="text-a-text">{t.symbol} · {t.side} · </span>
              <span className={cn("tabular-nums", t.r > 0 ? "text-a-success" : t.r < 0 ? "text-a-danger" : "text-a-text")}>{fmtR(t.r)}</span>
            </AdminTd>
            <AdminTd>{t.rulesBroken.length ? <Tag tone="danger" dot className="max-w-full"><span className="truncate">Broke {t.rulesBroken[0]}</span></Tag> : t.r >= 0 ? <Tag tone="success" dot>All rules kept</Tag> : <span className="text-a-text-3">—</span>}</AdminTd>
            <AdminTd align="end" className="whitespace-nowrap">{ask?.when}</AdminTd>
            <AdminTd align="end"><AdminButton hierarchy="secondary" size="md" onClick={() => onOpen(t.id)}>Answer</AdminButton></AdminTd>
          </AdminTr>
        ))}
      </tbody>
    </AdminTable>
  )
}

/** Figma 525:7839: what you answered, in which form, and whether the student has seen it. */
function AnsweredTable({ trades, onOpen, q, kind, since }: { trades: Trades; onOpen: (id: string) => void; q: string; kind: string; since: string }) {
  const { coach } = useCoach()
  const days = (when?: string) => (!when || when === "today" || when === "just now" ? 0 : when === "yesterday" ? 1 : Number.parseInt(when) || 0)
  const rows = trades
    .map((t) => {
      const ask = t.thread.find((m) => m.from === "student")
      const reply = [...t.thread].reverse().find((m) => m.from === "coach")
      return { t, s: ownerOf(t.id), ask, reply, seen: Number(t.id.slice(1)) % 3 !== 0 }
    })
    .filter(({ s, ask, reply }) => `${s.name} ${ask?.text ?? ""}`.toLowerCase().includes(q.toLowerCase()) && (kind === "all" || reply?.kind === kind) && (since === "all" || days(reply?.when) <= Number(since)))
  if (rows.length === 0) return <EmptyState icon={Check} title="No answers match" description="Clear the search or the filters." />
  return (
    <AdminTable minWidth={960} footer={<AdminTableFooter>{rows.length} {rows.length === 1 ? "answer" : "answers"} · median reply 6 h</AdminTableFooter>}>
      <AdminTableHead>
        <AdminTh>Student</AdminTh>
        <AdminTh width={284}>Question</AdminTh>
        <AdminTh width={216}>Your answer</AdminTh>
        <AdminTh width={186}>Status</AdminTh>
        <AdminTh width={106} align="end">Sent</AdminTh>
        <AdminTh width={56} />
      </AdminTableHead>
      <tbody>
        {rows.map(({ t, s, ask, reply, seen }) => (
          <AdminTr key={t.id} onClick={() => onOpen(t.id)}>
            <AdminTd><CellPerson initials={s.initials} name={s.name} subtitle={tierFor(coach, s.tier).name} /></AdminTd>
            <AdminTd className="truncate text-a-text">{ask ? `“${ask.text}”` : "—"}</AdminTd>
            <AdminTd className="truncate text-a-text">{reply ? (reply.kind === "text" ? "Text" : reply.kind === "chart" ? "Screenshot + text" : reply.text) : "—"}</AdminTd>
            <AdminTd><Tag tone={seen ? "success" : "neutral"} dot>{seen ? "Seen" : "Not seen yet"}</Tag></AdminTd>
            <AdminTd align="end" className="whitespace-nowrap">{reply?.when ?? "—"}</AdminTd>
            <AdminTd align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger render={<AdminButton hierarchy="ghost" size="md" iconOnly aria-label={`Actions for ${s.name}`} />}><MoreHorizontal /></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onOpen(t.id)}>Open answer</DropdownMenuItem>
                  {!seen && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => toast(`Reminder sent to ${s.name}`, { description: "They get a notification." })}>Send a reminder</DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </AdminTd>
          </AdminTr>
        ))}
      </tbody>
    </AdminTable>
  )
}

/* ---------- 05 Rules and 06 New strategy ---------- */

type Strategy = (typeof STRATEGIES)[number] & { audience?: string[] }
type Rules = { strategies: Strategy[]; required: Record<string, boolean>; tags: string[]; tiers: Record<string, boolean> }
const DEFAULT_RULES: Rules = {
  strategies: STRATEGIES,
  required: { setup: true, stop: true, screenshot: false, note: false, emotion: true },
  tags: TAGS,
  tiers: {},
}
const REQUIRED = [
  { id: "setup", label: "Setup", text: "Which strategy the trade was" },
  { id: "stop", label: "Stop and target", text: "Planned before the trade" },
  { id: "emotion", label: "How they felt", text: "Calm, rushed, angry, bored" },
  { id: "screenshot", label: "Screenshot", text: "TradingView snapshot link" },
  { id: "note", label: "A note", text: "One line on why" },
]
const kept = (id: string) => 70 + ([...id].reduce((n, c) => n + c.charCodeAt(0), 0) % 25)

function JournalRules() {
  const { coach } = useCoach()
  const [r, setR] = useCommunityData(coach.slug, "journal-rules", DEFAULT_RULES)
  const [editing, setEditing] = useState<Strategy | "new" | null>(null)
  const [newTag, setNewTag] = useState<string | null>(null)
  const on = (id: string) => r.tiers[id] !== false
  const paid = coach.tiers.filter((t) => t.price !== "€0")
  const all = coach.tiers.every((t) => on(t.id))
  const paidOnly = !all && paid.every((t) => on(t.id)) && coach.tiers.filter((t) => t.price === "€0").every((t) => !on(t.id))
  const [pick, setPick] = useState(!all && !paidOnly)
  const audience = pick ? "pick" : all ? "all" : paidOnly ? "paid" : "pick"
  const setAudience = (v: string) => {
    setPick(v === "pick")
    if (v === "all") setR((x) => ({ ...x, tiers: {} }))
    if (v === "paid") setR((x) => ({ ...x, tiers: Object.fromEntries(coach.tiers.filter((t) => t.price === "€0").map((t) => [t.id, false])) }))
  }
  const names = coach.tiers.filter((t) => on(t.id)).map((t) => t.name)
  const sentence = names.length === 0 ? "Nobody has the journal." : `${names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`} ${names.length === 1 ? "students" : "students"} can journal and ask for feedback.`

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-4">
        <Panel className="gap-4">
          <h2 className="t-heading-s text-a-text">Who gets the journal</h2>
          <AdminSegmented label="Who gets the journal" value={audience} onChange={setAudience} options={[{ value: "all", label: "Everyone" }, { value: "paid", label: "Paid tiers" }, { value: "pick", label: "Pick tiers" }]} className="gap-1.5" />
          {audience === "pick" && (
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {coach.tiers.map((t) => (
                <label key={t.id} className="flex items-center gap-2 t-body-m text-a-text">
                  <Checkbox checked={on(t.id)} onCheckedChange={(v) => setR((x) => ({ ...x, tiers: { ...x.tiers, [t.id]: !!v } }))} />
                  {t.name}
                </label>
              ))}
            </div>
          )}
          <p className="t-body-m text-a-text-2">{sentence}</p>
        </Panel>

        <Panel className="gap-0 overflow-hidden p-0">
          <h2 className="px-5 py-4 t-heading-s text-a-text">Required for every trade</h2>
          {REQUIRED.map((f) => (
            <label key={f.id} className="flex min-h-[60px] items-center justify-between gap-6 border-t border-a-border px-5 py-3">
              <span className="grid gap-0.5">
                <span className="t-body-m text-a-text">{f.label}</span>
                <span className="t-caption text-a-text-2">{f.text}</span>
              </span>
              <Switch checked={!!r.required[f.id]} onCheckedChange={(v) => setR((x) => ({ ...x, required: { ...x.required, [f.id]: v } }))} />
            </label>
          ))}
        </Panel>

        <Panel className="gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="t-heading-s text-a-text">Tags</h2>
            <AdminButton hierarchy="secondary" size="md" onClick={() => setNewTag("")}><Plus /> New tag</AdminButton>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {r.tags.map((g) => (
              <Tag key={g} className="gap-1 pr-1">
                {g}
                <button type="button" aria-label={`Remove ${g}`} onClick={() => setR((x) => ({ ...x, tags: x.tags.filter((y) => y !== g) }))} className="grid size-4 place-items-center rounded-a-xs text-a-text-3 outline-none hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus pointer-coarse:size-6"><X className="size-3" /></button>
              </Tag>
            ))}
            {newTag !== null && (
              <input autoFocus aria-label="New tag" value={newTag} placeholder="New tag" onChange={(e) => setNewTag(e.target.value)} onBlur={() => (newTag.trim() && !r.tags.includes(newTag.trim()) && setR((x) => ({ ...x, tags: [...x.tags, newTag.trim()] })), setNewTag(null))} onKeyDown={(e) => (e.key === "Enter" && e.currentTarget.blur()) || (e.key === "Escape" && setNewTag(null))} className="h-5 w-28 rounded-a-xs border border-a-border-focus bg-a-field px-2 t-mono-label-s text-a-text outline-none" />
            )}
          </div>
        </Panel>
      </div>

      <Panel className="gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="t-heading-s text-a-text">Strategies and their rules</h2>
          <AdminButton hierarchy="secondary" size="md" onClick={() => setEditing("new")}><Plus /> New strategy</AdminButton>
        </div>
        <p className="t-body-m text-a-text-2">Students pick one per trade. The journal shows how well each rule is kept.</p>
        {r.strategies.length === 0 && <EmptyState compact title="No strategies yet. Add the first one." />}
        {r.strategies.map((s) => (
          <section key={s.id} className="grid gap-3 rounded-a-10 border border-a-border px-4 py-3.5">
            <div className="flex items-center gap-2">
              <h3 className="min-w-0 flex-1 truncate t-body-l text-a-text">{s.name}</h3>
              <span className="t-caption text-a-text-2 tabular-nums">{s.trades > 0 ? `Kept ${kept(s.id)}%` : "No trades yet"}</span>
              <DropdownMenu>
                <DropdownMenuTrigger render={<AdminButton hierarchy="ghost" size="md" iconOnly aria-label={`Actions for ${s.name}`} />}><MoreHorizontal /></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditing(s)}>Edit</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => (setR((x) => ({ ...x, strategies: x.strategies.filter((y) => y.id !== s.id) })), toast(`${s.name} deleted`))}>Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <ul className="grid gap-2.5">
              {s.rules.filter(Boolean).map((rule, k) => (
                <li key={k} className="flex items-start gap-2.5 t-body-m text-a-text">
                  <span aria-hidden className="mt-px grid size-4 shrink-0 place-items-center rounded-a-xs bg-a-accent text-a-on-accent"><Check className="size-3" /></span>
                  {rule}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </Panel>

      <StrategyModal strategy={editing} onClose={() => setEditing(null)} onSave={(s) => setR((x) => ({ ...x, strategies: x.strategies.some((y) => y.id === s.id) ? x.strategies.map((y) => (y.id === s.id ? s : y)) : [...x.strategies, s] }))} />
    </div>
  )
}

function StrategyModal({ strategy, onClose, onSave }: { strategy: Strategy | "new" | null; onClose: () => void; onSave: (s: Strategy) => void }) {
  const { coach } = useCoach()
  const [last, setLast] = useState<Strategy | "new" | null>(strategy)
  const [name, setName] = useState("")
  const [who, setWho] = useState<"all" | "tiers">("all")
  const [tiers, setTiers] = useState<string[]>([])
  const [rules, setRules] = useState<string[]>([""])
  if (strategy && strategy !== last) {
    setLast(strategy)
    setName(strategy === "new" ? "" : strategy.name)
    setWho(strategy !== "new" && strategy.audience?.length ? "tiers" : "all")
    setTiers(strategy === "new" ? [] : (strategy.audience ?? []))
    setRules(strategy === "new" ? [""] : strategy.rules.length ? strategy.rules : [""])
  }
  const shown = strategy ?? last
  const isNew = shown === "new"
  const save = () => {
    const clean = rules.map((x) => x.trim()).filter(Boolean)
    if (!name.trim() || !clean.length) return
    onSave({ ...(shown && shown !== "new" ? shown : { id: `s${Date.now()}`, trades: 0 }), name: name.trim(), rules: clean, audience: who === "tiers" ? tiers : undefined })
    toast(isNew ? "Strategy created" : "Strategy saved")
    onClose()
  }
  return (
    <AdminModal open={!!strategy} onOpenChange={(o) => !o && onClose()} title={isNew ? "New strategy" : "Edit strategy"} subtitle="Students pick it when they log a trade." className="sm:max-w-[560px]" bodyClassName="gap-5"
      footer={
        <div className="flex w-full items-center gap-2">
          <AdminButton hierarchy="ghost" disabled={rules.length <= 1} onClick={() => setRules((r) => r.slice(0, -1))}>Remove rule</AdminButton>
          <span aria-hidden className="h-px min-w-px flex-1" />
          <AdminButton hierarchy="ghost" onClick={onClose}>Cancel</AdminButton>
          <AdminButton disabled={!name.trim() || !rules.some((x) => x.trim())} onClick={save}>{isNew ? "Create strategy" : "Save"}</AdminButton>
        </div>
      }>
      <div className="flex flex-col gap-4">
        <AdminField label="Strategy name">
          <input autoFocus={isNew} value={name} onChange={(e) => setName(e.target.value)} placeholder="Opening range break" className={cn(adminControl, "h-11")} />
        </AdminField>
        <div className="grid gap-1.5">
          <span className="t-caption text-a-text">Who sees it</span>
          <AdminSegmented label="Who sees it" value={who} onChange={(v) => (setWho(v), v === "tiers" && !tiers.length && setTiers(coach.tiers.slice(1).map((t) => t.id)))} options={[{ value: "all", label: "Everyone" }, { value: "tiers", label: "Pick tiers" }]} />
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
      </div>
      <fieldset className="grid gap-2">
        <legend className="mb-1 t-caption text-a-text">Rules</legend>
        {rules.map((rule, i) => (
          <input key={i} aria-label={`Rule ${i + 1}`} value={rule} placeholder={i === 0 ? "Wait for the 5-min range to close" : "Stop under the range low"} onChange={(e) => setRules((r) => r.map((x, j) => (j === i ? e.target.value : x)))} className={cn(adminControl, "h-11")} />
        ))}
        <AdminButton hierarchy="ghost" size="md" className="w-fit" onClick={() => setRules((r) => [...r, ""])}><Plus /> Add a rule</AdminButton>
      </fieldset>
    </AdminModal>
  )
}
