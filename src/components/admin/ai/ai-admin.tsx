"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Check, Pencil, Play, Plus, Sparkles, Upload, X } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { DEFAULT_AI, aiAnswer, type AiReply, type AiSetup } from "@/lib/data/ai"
import { AI_FEATURES, AI_KNOWLEDGE, AI_LIMITS, AI_QUESTIONS, type AiResult } from "@/lib/data/people"
import { cn } from "@/lib/utils"
import { PageHeader, useCommunityData } from "../kit"
import { AdminButton, AdminField, AdminTable, AdminTableFooter, AdminTableHead, AdminTabs, AdminTd, AdminTh, AdminTr, AdminSegmented, CellPerson, EmptyState, FileIcon, Panel, PanelHeader, StatPanel, Tag, adminControl } from "../ui"

const TABS = [
  { id: "personality", label: "Personality" },
  { id: "knowledge", label: "Knowledge" },
  { id: "features", label: "Features & quotas" },
  { id: "test", label: "Test & correct" },
  { id: "questions", label: "Questions", count: "1.4k" },
] as const
type Tab = (typeof TABS)[number]["id"]

const TONES = [
  { value: "calm", label: "Calm and clear", at: 50 },
  { value: "warm", label: "Friendly and warm", at: 15 },
  { value: "direct", label: "Direct, no small talk", at: 85 },
] as const
const toneOf = (n: number) => (n < 33 ? "warm" : n > 66 ? "direct" : "calm")
const LENGTHS = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "long", label: "Detailed" },
] as const
const MAX_MB = 50

/** AI assistant (Figma 534:8164, 01 Personality, 02 Knowledge, 03 Features & quotas, 04 Test & correct, 05 Questions): what the coach's AI sounds like, what it knows, who gets what, and how it answers. */
export function AiAdmin() {
  const { coach, base } = useCoach()
  const [stored, setAi] = useCommunityData(coach.slug, "ai", DEFAULT_AI)
  // Older saved setups lack the newer fields: fill them from the defaults.
  const ai: AiSetup = { ...DEFAULT_AI, ...stored, never: Array.isArray(stored.never) ? stored.never : DEFAULT_AI.never, on: { ...DEFAULT_AI.on, ...(stored.on ?? {}) }, limits: stored.limits ?? {}, uploaded: stored.uploaded ?? [] }
  const [tab, setTab] = useState<Tab>("personality")
  const set = (patch: Partial<AiSetup>) => setAi((x) => ({ ...x, ...patch }))

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4">
      <PageHeader
        title="AI assistant"
        text="Answers students 24/7 from your courses and notes"
        actions={
          <>
            <Tag tone="warning" dot>V2</Tag>
            <AdminButton hierarchy="secondary" onClick={() => setTab("test")}>
              <Play /> Test it
            </AdminButton>
            <AdminButton onClick={() => toast.success("Published", { description: "Students get the new answers now." })}>Publish changes</AdminButton>
          </>
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <AdminTabs label="AI assistant" tabs={TABS} value={tab} onChange={setTab} />
      </div>

      {tab === "personality" && <Personality ai={ai} set={set} base={base} name={coach.wording.ai} />}
      {tab === "knowledge" && <Knowledge ai={ai} set={set} />}
      {tab === "features" && <Features ai={ai} set={set} />}
      {tab === "test" && <TestChat corrections={ai.corrections} onCorrect={(c) => set({ corrections: [c, ...ai.corrections] })} />}
      {tab === "questions" && <Questions />}
    </div>
  )
}

function Personality({ ai, set, base, name }: { ai: AiSetup; set: (p: Partial<AiSetup>) => void; base: string; name: string }) {
  const [adding, setAdding] = useState(false)
  const [topic, setTopic] = useState("")
  const add = () => {
    const t = topic.trim()
    if (t && !ai.never.some((n) => n.toLowerCase() === t.toLowerCase())) set({ never: [...ai.never, t] })
    setTopic("")
    setAdding(false)
  }
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()

  return (
    <>
      <StatPanel
        stats={[
          { label: "Questions this month", value: "1,412", delta: "+22% vs last month", tone: "success" },
          { label: "Answered alone", value: "91%", delta: "9% handed to you" },
          { label: "Corrections", value: 12 + ai.corrections.length, delta: "Used in every answer" },
          { label: "Most asked", value: "Stops on ORB", delta: "64 times" },
        ]}
      />
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="How it sounds" />
          <div className="flex items-start gap-4">
            <Avatar className="mt-6 size-10 shrink-0">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <AdminField label="Name">
                <input value={name} readOnly className={cn(adminControl, "h-11")} />
              </AdminField>
              <span className="t-caption text-a-text-2">
                Rename it in <Link href={`${base}/design`} className="rounded-a-xs underline-offset-2 outline-none hover:text-a-text hover:underline focus-visible:ring-2 focus-visible:ring-a-border-focus">Design → Menu and words</Link>.
              </span>
            </div>
          </div>
          <AdminField label="Tone">
            {() => <AdminSegmented label="Tone" value={toneOf(ai.tone)} onChange={(v) => set({ tone: TONES.find((t) => t.value === v)?.at ?? 50 })} options={TONES} />}
          </AdminField>
          <AdminField label="Answer length">
            {() => <AdminSegmented label="Answer length" value={ai.length} onChange={(v) => set({ length: v })} options={LENGTHS} />}
          </AdminField>
        </Panel>
        <Panel>
          <PanelHeader title="Rules" />
          <div className="flex flex-col gap-1.5">
            <span className="t-caption text-a-text">Never talk about</span>
            <ul aria-label="Never talk about" className="flex min-h-7 flex-wrap items-center gap-1.5">
              {ai.never.map((n) => (
                <li key={n}>
                  <Tag className="gap-1 pr-1">
                    {n}
                    <button type="button" aria-label={`Remove ${n}`} onClick={() => set({ never: ai.never.filter((x) => x !== n) })} className="grid size-4 place-items-center rounded-a-xs text-a-text-3 outline-none transition-colors duration-200 hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus pointer-coarse:size-6">
                      <X className="size-3" />
                    </button>
                  </Tag>
                </li>
              ))}
              <li>
                {adding ? (
                  <input
                    autoFocus
                    aria-label="Topic to avoid"
                    value={topic}
                    maxLength={60}
                    placeholder="A topic"
                    onChange={(e) => setTopic(e.target.value)}
                    onBlur={add}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        add()
                      }
                      if (e.key === "Escape") {
                        setTopic("")
                        setAdding(false)
                      }
                    }}
                    className="h-7 w-40 rounded-a-md border border-a-border-focus bg-a-field px-2.5 t-caption text-a-text outline-none placeholder:text-a-text-3"
                  />
                ) : (
                  <AdminButton hierarchy="ghost" size="md" onClick={() => setAdding(true)}>
                    <Plus /> Add
                  </AdminButton>
                )}
              </li>
            </ul>
          </div>
          <AdminField label="Examples or rules">
            <textarea value={ai.examples} onChange={(e) => set({ examples: e.target.value })} className={cn(adminControl, "block h-[110px] resize-none py-2.5")} />
          </AdminField>
        </Panel>
      </div>
    </>
  )
}

const kindOf = (name: string) => (/\.pdf$/i.test(name) ? "PDF" : /\.(csv|txt)$/i.test(name) ? "Q&A list" : "Document")

function Knowledge({ ai, set }: { ai: AiSetup; set: (p: Partial<AiSetup>) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  // What is being learned right now, and when each source finished learning. The FAQ is mid-learning when you open the tab.
  const [learning, setLearning] = useState<Record<string, boolean>>(() => Object.fromEntries(AI_KNOWLEDGE.filter((k) => k.learning).map((k) => [k.id, true])))
  const [fresh, setFresh] = useState<Record<string, boolean>>({})
  const timers = useRef<number[]>([])
  const learn = (id: string, ms = 2200) => {
    setLearning((l) => ({ ...l, [id]: true }))
    timers.current.push(window.setTimeout(() => (setLearning((l) => ({ ...l, [id]: false })), setFresh((f) => ({ ...f, [id]: true }))), ms))
  }
  useEffect(() => {
    const first = window.setTimeout(() => (setLearning((l) => ({ ...l, k4: false })), setFresh((f) => ({ ...f, k4: true }))), 3200)
    const t = timers.current
    return () => (window.clearTimeout(first), t.forEach((x) => window.clearTimeout(x)))
  }, [])

  const rows = [...AI_KNOWLEDGE.map((k) => ({ ...k, uploaded: false })), ...ai.uploaded.map((u) => ({ ...u, on: true, updated: "now", uploaded: true }))]
  const isOn = (id: string, dflt: boolean) => ai.knowledge[id] ?? dflt

  const upload = (files: File[]) => {
    const ok = files.filter((f) => f.size <= MAX_MB * 1024 * 1024)
    if (ok.length < files.length) toast.error(files.length === 1 ? `That file is over ${MAX_MB} MB` : `${files.length - ok.length} files are over ${MAX_MB} MB`, { description: "Split it or compress it, then try again." })
    if (!ok.length) return
    const added = ok.map((f, i) => ({ id: `u${Date.now()}${i}`, name: f.name, kind: kindOf(f.name), items: f.size < 1024 * 1024 ? `${Math.max(1, Math.round(f.size / 1024))} KB` : `${(f.size / 1024 / 1024).toFixed(1)} MB` }))
    set({ uploaded: [...ai.uploaded, ...added], knowledge: { ...ai.knowledge, ...Object.fromEntries(added.map((a) => [a.id, true])) } })
    added.forEach((a) => learn(a.id))
    toast(added.length === 1 ? `${added[0].name} added` : `${added.length} files added`, { description: "Your AI is learning from them." })
  }
  const pick = () => input.current?.click()
  const toggle = (id: string, on: boolean) => {
    set({ knowledge: { ...ai.knowledge, [id]: on } })
    if (on) learn(id)
    else setLearning((l) => ({ ...l, [id]: false }))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="t-body-m text-a-text-2">Your AI only answers from what you add here.</p>
        <AdminButton hierarchy="secondary" onClick={pick}>
          <Upload /> Add files
        </AdminButton>
      </div>
      <AdminTable minWidth={680}>
        <AdminTableHead>
          <AdminTh>Source</AdminTh>
          <AdminTh width={156}>Status</AdminTh>
          <AdminTh width={150}>Updated</AdminTh>
          <AdminTh width={88} align="end">Use it</AdminTh>
        </AdminTableHead>
        <tbody>
          {rows.map((k) => {
            const on = isOn(k.id, k.on)
            const busy = !!learning[k.id] && on
            const file = k.kind === "PDF" || k.uploaded
            return (
              <AdminTr key={k.id}>
                <AdminTd>
                  <div className="flex min-w-0 items-center gap-2.5">
                    {file && <FileIcon name={k.name} className="size-7 t-mono-label-s" />}
                    <div className="grid min-w-0 gap-0.5">
                      <span className="truncate t-body-m text-a-text">{k.name}</span>
                      <span className="truncate t-caption text-a-text-2">{k.kind} · {k.items}</span>
                    </div>
                  </div>
                </AdminTd>
                <AdminTd>
                  {!on ? <Tag>Not used</Tag> : busy ? <Tag tone="warning" dot>Learning…</Tag> : <Tag tone="success" dot>Learned</Tag>}
                </AdminTd>
                <AdminTd>{!on ? "—" : busy ? "now" : fresh[k.id] ? "just now" : k.updated}</AdminTd>
                <AdminTd align="end">
                  <Switch checked={on} onCheckedChange={(v) => toggle(k.id, v)} aria-label={`Use ${k.name}`} />
                </AdminTd>
              </AdminTr>
            )
          })}
        </tbody>
      </AdminTable>
      <div onDragOver={(e) => (e.preventDefault(), !over && setOver(true))} onDragLeave={() => setOver(false)} onDrop={(e) => (e.preventDefault(), setOver(false), e.dataTransfer.files.length && upload([...e.dataTransfer.files]))} className={cn("rounded-a-lg transition-colors duration-300", over && "bg-a-accent-soft")}>
        <EmptyState
          icon={Upload}
          title="Drop PDFs, docs or a list of questions and answers"
          description={`Up to ${MAX_MB} MB per file.`}
          className={cn("py-12", over && "border-a-border-active")}
          actions={
            <AdminButton onClick={pick}>
              <Upload /> Upload a file
            </AdminButton>
          }
        />
      </div>
      <input ref={input} type="file" multiple accept=".pdf,.doc,.docx,.txt,.csv" aria-label="Add files for your AI" className="sr-only" tabIndex={-1} onChange={(e) => (e.target.files?.length && upload([...e.target.files]), (e.target.value = ""))} />
    </div>
  )
}

const limitText = (n: number | null) => (n === null ? "—" : n === 0 ? "Unlimited" : String(n))

function Features({ ai, set }: { ai: AiSetup; set: (p: Partial<AiSetup>) => void }) {
  const { coach } = useCoach()
  // The free tier has no AI to tune: columns are the paid tiers.
  const tiers = coach.tiers.filter((t) => !/^\D*0$/.test(t.price))
  const limit = (f: string, tier: string, i: number): number | null => {
    const dflt = AI_LIMITS[f]?.[Math.min(i, 2)] ?? null
    if (f === "answer") return ai.quotas[tier] ?? dflt
    const own = ai.limits[`${f}:${tier}`]
    return own === undefined ? dflt : own
  }
  const save = (f: string, tier: string, n: number | null) => {
    if (f === "answer") set({ quotas: { ...ai.quotas, [tier]: n ?? 0 } })
    else set({ limits: { ...ai.limits, [`${f}:${tier}`]: n } })
  }

  return (
    <AdminTable
      minWidth={420 + tiers.length * 140}
      footer={<AdminTableFooter>Questions per day, per student. — means the tier doesn&apos;t get it. Select a number to change it.</AdminTableFooter>}>
      <AdminTableHead>
        <AdminTh>Feature</AdminTh>
        <AdminTh width={100}>On</AdminTh>
        {tiers.map((t) => (
          <AdminTh key={t.id} width={156} align="end">{t.name}</AdminTh>
        ))}
      </AdminTableHead>
      <tbody>
        {AI_FEATURES.map((f) => {
          const on = ai.on[f.id] ?? f.on
          return (
            <AdminTr key={f.id}>
              <AdminTd className="text-a-text">{f.name}</AdminTd>
              <AdminTd>
                <Switch checked={on} onCheckedChange={(v) => set({ on: { ...ai.on, [f.id]: v } })} aria-label={`${f.name} on`} />
              </AdminTd>
              {tiers.map((t, i) => (
                <AdminTd key={t.id} align="end" className={cn(!on && "opacity-60")}>
                  <QuotaCell label={`${f.name} for ${t.name}`} value={limit(f.id, t.id, i)} onChange={(n) => save(f.id, t.id, n)} />
                </AdminTd>
              ))}
            </AdminTr>
          )
        })}
      </tbody>
    </AdminTable>
  )
}

/** A number that reads as text until you select it: then an input. Empty means the tier doesn't get it, 0 means unlimited. */
function QuotaCell({ label, value, onChange }: { label: string; value: number | null; onChange: (n: number | null) => void }) {
  const [edit, setEdit] = useState(false)
  const [draft, setDraft] = useState("")
  const done = () => {
    setEdit(false)
    const t = draft.trim()
    if (t === "") return onChange(null)
    const n = Math.floor(Number(t))
    if (Number.isFinite(n) && n >= 0) onChange(n)
  }
  if (edit)
    return (
      <input
        autoFocus
        onFocus={(e) => e.currentTarget.select()}
        type="number"
        min={0}
        inputMode="numeric"
        aria-label={`${label}, questions per day`}
        value={draft}
        placeholder="—"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={done}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            done()
          }
          if (e.key === "Escape") setEdit(false)
        }}
        className="h-7 w-20 rounded-a-md border border-a-border-focus bg-a-field px-2 text-right t-body-m text-a-text tabular-nums outline-none placeholder:text-a-text-3"
      />
    )
  return (
    <button
      type="button"
      aria-label={`${label}: ${value === null ? "none" : value === 0 ? "unlimited" : `${value} a day`}. Change`}
      onClick={() => (setDraft(value === null ? "" : String(value)), setEdit(true))}
      className="-mr-1.5 rounded-a-sm px-1.5 py-1 t-body-m text-a-text-2 tabular-nums outline-none transition-colors duration-300 hover:bg-a-hover hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus pointer-coarse:min-h-10">
      {limitText(value)}
    </button>
  )
}

type Turn = { q: string; a: AiReply; good?: boolean; fixed?: string }
const FIRST: Turn = { q: "Should I trade during CPI?", a: { text: "No. CPI is marked as a no-trade event in your rules. Wait 15 minutes after the release, then look for your normal setup.", source: "Module 3 · Daily loss limits, 05:00" } }

function TestChat({ corrections, onCorrect }: { corrections: AiSetup["corrections"]; onCorrect: (c: { q: string; a: string }) => void }) {
  const [q, setQ] = useState("")
  const [log, setLog] = useState<Turn[]>([FIRST])
  const [editing, setEditing] = useState<number | null>(null)
  const [fix, setFix] = useState("")
  const box = useRef<HTMLDivElement>(null)
  const field = useRef<HTMLInputElement>(null)
  const last = useRef(log.length)
  useEffect(() => {
    // Keep the newest answer in view, but leave the page where it is when the tab opens.
    if (log.length !== last.current && box.current) box.current.scrollTop = box.current.scrollHeight
    last.current = log.length
  }, [log.length])

  const ask = () => {
    const t = q.trim()
    if (!t) {
      field.current?.focus()
      return
    }
    setLog((l) => [...l, { q: t, a: aiAnswer(t) }])
    setQ("")
  }
  const save = (i: number) => {
    const t = fix.trim()
    if (!t) return
    setLog((l) => l.map((x, j) => (j === i ? { ...x, fixed: t, good: false } : x)))
    onCorrect({ q: log[i].q, a: t })
    setEditing(null)
    toast("Correction saved", { description: "Your AI answers this from now on." })
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_384px]">
      <Panel>
        <PanelHeader title="Ask like a student" />
        <div ref={box} role="log" aria-label="Conversation" className="flex max-h-[520px] flex-col gap-3 overflow-y-auto">
          {log.map((m, i) => (
            <div key={i} className="flex flex-col gap-2">
              <p className="max-w-[85%] self-end rounded-a-md bg-a-selected px-3 py-2 t-body-m text-a-text [overflow-wrap:anywhere]">{m.q}</p>
              <div className="flex max-w-full flex-col gap-2 rounded-a-md border border-a-border bg-a-subtle p-3">
                <p className={cn("t-body-m text-a-text [overflow-wrap:anywhere]", m.fixed && "text-a-text-3 line-through")}>{m.a.text}</p>
                {m.fixed && (
                  <p className="flex items-start gap-1.5 t-body-m text-a-text [overflow-wrap:anywhere]">
                    <Sparkles aria-hidden className="mt-0.5 size-3.5 shrink-0 text-a-text-accent" /> {m.fixed}
                  </p>
                )}
                {m.a.source && (
                  <span className="flex flex-wrap items-center gap-2 t-caption text-a-text-2">
                    Answered from <Tag className="h-auto min-h-5 whitespace-normal py-0.5">{m.a.source}</Tag>
                  </span>
                )}
                {editing === i ? (
                  <div className="flex flex-col gap-2 pt-1">
                    <textarea autoFocus aria-label="Your version of the answer" value={fix} onChange={(e) => setFix(e.target.value)} onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                        e.preventDefault()
                        save(i)
                      }
                    }} className={cn(adminControl, "block h-24 resize-none py-2.5")} />
                    <div className="flex justify-end gap-2">
                      <AdminButton hierarchy="ghost" size="lg" onClick={() => setEditing(null)}>Cancel</AdminButton>
                      <AdminButton size="lg" disabled={!fix.trim()} onClick={() => save(i)}>
                        <Check /> Save correction
                      </AdminButton>
                    </div>
                  </div>
                ) : (
                  !m.fixed && (
                    <div className="flex flex-wrap items-center gap-2">
                      <AdminButton hierarchy="ghost" size="md" aria-pressed={!!m.good} className={cn(m.good && "text-a-success")} onClick={() => setLog((l) => l.map((x, j) => (j === i ? { ...x, good: !x.good } : x)))}>
                        <Check /> Good answer
                      </AdminButton>
                      <AdminButton hierarchy="secondary" size="md" onClick={() => (setEditing(i), setFix(m.a.text))}>
                        <Pencil /> Correct it
                      </AdminButton>
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            ask()
          }}>
          <input ref={field} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Ask your AI as a student" placeholder="Try: “Where do I put my stop on an ORB?”" className={cn(adminControl, "h-11 min-w-0 flex-1")} />
          <AdminButton type="submit" size="xl" className="h-11 px-5">Ask</AdminButton>
        </form>
      </Panel>
      <Panel>
        <PanelHeader title="Your corrections" />
        {corrections.length === 0 ? (
          <p className="t-body-m text-a-text-2">None yet. When an answer is wrong, select “Correct it” and write the right one.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {corrections.map((c, i) => (
              <li key={`${c.q}-${i}`} className="flex flex-col gap-0.5 rounded-a-md border border-a-border px-3 py-2.5">
                <span className="t-body-m text-a-text [overflow-wrap:anywhere]">{c.q}</span>
                <span className="t-caption text-a-text-2 [overflow-wrap:anywhere]">{c.a}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="t-caption text-a-text-3">Your AI answers this from now on.</p>
      </Panel>
    </div>
  )
}

const RESULT: Record<AiResult, { label: string; tone: "success" | "warning" | "neutral" }> = {
  answered: { label: "Answered", tone: "success" },
  handed: { label: "Handed to you", tone: "warning" },
  blocked: { label: "Not allowed", tone: "neutral" },
}

function Questions() {
  return (
    <AdminTable minWidth={860} scrollLabel="Questions students asked">
      <AdminTableHead>
        <AdminTh width={255}>Student</AdminTh>
        <AdminTh width={420}>Question</AdminTh>
        <AdminTh width={218}>Answered from</AdminTh>
        <AdminTh width={174}>Result</AdminTh>
        <AdminTh align="end">Asked</AdminTh>
      </AdminTableHead>
      <tbody>
        {AI_QUESTIONS.map((r) => (
          <AdminTr key={r.id}>
            <AdminTd><CellPerson initials={r.initials} name={r.student} /></AdminTd>
            <AdminTd className="text-a-text">{r.q}</AdminTd>
            <AdminTd>{r.from ?? "—"}</AdminTd>
            <AdminTd><Tag tone={RESULT[r.result].tone} dot={r.result !== "blocked"}>{RESULT[r.result].label}</Tag></AdminTd>
            <AdminTd align="end">{r.ago}</AdminTd>
          </AdminTr>
        ))}
      </tbody>
    </AdminTable>
  )
}
