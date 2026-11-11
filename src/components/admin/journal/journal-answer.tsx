"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowRight, ExternalLink, Mic, Pause, Plus, Square, X } from "@/components/icons"
import { toast } from "sonner"
import { TradeChart } from "@/components/charts/trade-chart"
import { useCoach } from "@/components/coach/coach-provider"
import { addFeedback, type allTrades } from "@/lib/data/feedback"
import type { STUDENTS } from "@/lib/data/people"
import { tierFor } from "@/lib/data/people"
import { pictureFrom } from "@/lib/images"
import { fmtPnl, fmtPrice, fmtR } from "@/lib/data/trades"
import { cn } from "@/lib/utils"
import { AdminButton, Panel, Tag } from "../ui"

type T = ReturnType<typeof allTrades>[number]
type Mode = "text" | "voice" | "video" | "screenshot"
const MODES: { id: Mode; label: string }[] = [{ id: "text", label: "Text" }, { id: "voice", label: "Voice note" }, { id: "video", label: "Video" }, { id: "screenshot", label: "Screenshot" }]
const field = "w-full rounded-a-md border border-a-border bg-a-field px-3.5 t-body-l text-a-text outline-none placeholder:text-a-text-3 transition-colors duration-300 hover:border-a-border-strong focus-visible:border-a-border-focus"
const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

/** Journal · 02 Answer a request, 03 Recording a video: the trade on the left, the answer on the right. */
export function AnswerPage({ trade: t, student: s, aiDraft, readOnly, onBack, onNext, onSkip, hasNext }: { trade: T; student: (typeof STUDENTS)[number]; aiDraft: string; readOnly?: boolean; onBack: () => void; onNext: () => void; onSkip: () => void; hasNext: boolean }) {
  const { coach, base } = useCoach()
  const [mode, setMode] = useState<Mode>("text")
  const [text, setText] = useState("")
  const [link, setLink] = useState("")
  const [rules, setRules] = useState<string[]>(t.rulesBroken)
  const [addingRule, setAddingRule] = useState(false)
  const [secs, setSecs] = useState(0)
  const [paused, setPaused] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const picker = useRef<HTMLInputElement>(null)
  const ask = t.thread.find((m) => m.from === "student")
  const earlier = t.thread.filter((m) => m.from === "coach")
  const recording = mode === "video" || mode === "voice"

  useEffect(() => {
    const id = setInterval(() => setElapsed((x) => x + 1), 60000)
    return () => clearInterval(id)
  }, [])
  useEffect(() => {
    if (!recording || paused) return
    const id = setInterval(() => setSecs((x) => x + 1), 1000)
    return () => clearInterval(id)
  }, [recording, paused])

  const say = (m: Parameters<typeof addFeedback>[2]["add"]) => addFeedback(coach.slug, t.id, { add: m })
  const stopRecording = () => {
    say({ from: "coach", kind: mode === "voice" ? "voice" : "video", text: `${mode === "voice" ? "Voice note" : "Video"} · ${Math.floor(Math.max(secs, 3) / 60)}:${String(Math.max(secs, 3) % 60).padStart(2, "0")}`, when: "just now" })
    toast.success(`${mode === "voice" ? "Voice note" : "Video"} added to your answer.`)
    setSecs(0)
    setPaused(false)
    setMode("text")
  }
  const cancelRecording = () => (setSecs(0), setPaused(false), setMode("text"))
  const done = (send: boolean) => {
    if (send && text.trim()) say({ from: "coach", kind: "text", text: text.trim() + (rules.length ? `\n\nRule to remind: ${rules.join(", ")}` : ""), when: "just now" })
    if (link.trim()) say({ from: "coach", kind: "chart", text: `Marked-up chart · ${t.symbol}`, link: `https://${link.trim().replace(/^https?:\/\//, "")}`, when: "just now" })
    addFeedback(coach.slug, t.id, { done: true })
    toast(`Feedback sent to ${s.name}`, { description: "They get a notification and an e-mail." })
    if (hasNext) onNext()
    else onBack()
  }
  const sendScreenshot = async (file: File | undefined) => {
    if (!file) return
    try {
      const url = await pictureFrom(file, { max: 960, quality: 0.8, keep: [] })
      say({ from: "coach", kind: "chart", text: "Screenshot", link: url, when: "just now" })
      toast.success("Screenshot added to your answer.")
      setMode("text")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "That picture couldn't be used.")
    }
  }

  const header = (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <div className="min-w-0 flex-1">
        <h1 className="t-title text-a-text">{s.name}</h1>
        <p className="t-body-m text-a-text-2">{tierFor(coach, s.tier).name} · asked {ask?.when ?? "recently"} · 48 trades journaled</p>
      </div>
      {!recording && (
        <AdminButton hierarchy="secondary" nativeButton={false} render={<a href={`${base}/students`} />}><ExternalLink /> Open profile</AdminButton>
      )}
      <AdminButton hierarchy="ghost" onClick={onSkip} disabled={!hasNext}>Skip</AdminButton>
      <AdminButton hierarchy="secondary" onClick={onNext} disabled={!hasNext}>Next request <ArrowRight /></AdminButton>
    </header>
  )

  if (mode === "video" || mode === "voice") {
    return (
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
        {header}
        <Panel className="min-w-0 gap-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Tag tone="danger" dot>Recording</Tag>
            <span className="t-mono-data text-a-text">{clock(secs)}</span>
            <span className="min-w-0 sm:ml-auto t-caption text-a-text-2">{mode === "video" ? "Your screen and camera" : "Your microphone"} · max 5 min</span>
          </div>
          <div className="relative grid aspect-[2.2] place-items-center overflow-hidden rounded-a-lg border border-a-border bg-gradient-to-b from-a-raised to-a-page">
            {mode === "voice" && <Mic className="size-8 text-a-text-3" aria-hidden />}
            {mode === "video" && <span className="absolute bottom-4 left-5 grid size-[120px] place-items-center rounded-full border border-a-border-strong bg-a-muted t-title-l text-a-text">{coach.mark}</span>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AdminButton hierarchy="ghost" onClick={cancelRecording}>Cancel recording</AdminButton>
            <span className="min-w-px flex-1" />
            <AdminButton hierarchy="secondary" onClick={() => setPaused((p) => !p)}><Pause /> {paused ? "Resume" : "Pause"}</AdminButton>
            <AdminButton onClick={stopRecording}><Square /> Stop and review</AdminButton>
          </div>
        </Panel>
      </div>
    )
  }

  const rows: [string, string][] = [
    ["Strategy", t.setup],
    ["Entry / Stop / Target", `${fmtPrice(t.entry)} · ${fmtPrice(t.stop)} · ${fmtPrice(t.target)}`],
    ["Size", t.size],
    ["How they felt", t.tags[0] ?? "—"],
    ["Planned before the trade", t.rulesBroken.length ? "No" : "Yes"],
  ]

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
      {header}
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,1fr)_480px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Panel className="gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="t-heading-s text-a-text">{t.symbol} · {t.side}</h2>
              <Tag tone={t.r >= 0 ? "success" : "danger"} dot>{fmtR(t.r)} · {fmtPnl(t.pnl)}</Tag>
              {t.rulesBroken[0] && <Tag tone="danger" dot>Broke {t.rulesBroken[0]}</Tag>}
              <span className="ml-auto t-caption text-a-text-3">{t.date} · {t.time}</span>
            </div>
            <div className="overflow-hidden rounded-a-lg border border-a-border">
              <TradeChart trade={t} dark background="#0a0a0a" />
            </div>
            <dl className="grid">
              {rows.map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4 py-1.5 t-body-m">
                  <dt className="text-a-text-2">{k}</dt>
                  <dd className="text-right text-a-text tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
            {t.note && <p className="t-caption text-a-text-2">Note: “{t.note}”</p>}
          </Panel>
          {ask && (
            <Panel className="gap-2">
              <span className="t-mono-label text-a-text-3">Their question</span>
              <p className="t-body-l text-a-text">“{ask.text}”</p>
            </Panel>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Panel className="gap-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="t-heading-m text-a-text">{readOnly ? "Your feedback" : "Your answer"}</h2>
              {!readOnly && <span className="t-caption text-a-text-3">Giving feedback · {Math.max(2, elapsed)} min</span>}
            </div>
            {readOnly ? (
              <ul className="grid gap-3">
                {earlier.length === 0 && <li className="t-body-m text-a-text-2">Marked done without a written answer.</li>}
                {earlier.map((m, i) => (
                  <li key={i} className="grid gap-1 rounded-a-md border border-a-border p-3 t-body-m text-a-text">
                    {m.kind === "chart" ? <a href={m.link} target="_blank" rel="noreferrer" className="underline underline-offset-4">{m.text}</a> : <p>{m.text}</p>}
                    <span className="t-caption text-a-text-3">{m.when}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <>
                <div role="tablist" aria-label="How to answer" className="grid grid-cols-4 gap-2">
                  {MODES.map((m) => (
                    <button key={m.id} type="button" role="tab" aria-selected={mode === m.id} onClick={() => (m.id === "screenshot" ? (setMode("screenshot"), picker.current?.click()) : (setMode(m.id), setSecs(0)))} className={cn("h-9 rounded-a-md border t-body-m outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-a-border-focus", mode === m.id ? "border-a-accent-strong text-a-text" : "border-a-border text-a-text-2 hover:bg-a-hover hover:text-a-text")}>{m.label}</button>
                  ))}
                </div>
                <input ref={picker} type="file" accept="image/*" aria-label="Screenshot" className="sr-only" onChange={(e) => (void sendScreenshot(e.target.files?.[0]), (e.target.value = ""))} />
                <textarea value={text} onChange={(e) => setText(e.target.value)} aria-label="Your answer" placeholder={`Answer ${s.name.split(" ")[0]}…`} className={cn(field, "min-h-[160px] resize-y py-3")} />
                <div className="flex items-center justify-between gap-3">
                  <AdminButton hierarchy="ghost" size="md" onClick={() => setText(aiDraft)}>AI first draft</AdminButton>
                </div>
                <label className="grid gap-2">
                  <span className="t-caption text-a-text-2">TradingView snapshot link <span className="text-a-text-3">Optional</span></span>
                  <span className="flex h-11 overflow-hidden rounded-a-md border border-a-border bg-a-field focus-within:border-a-border-focus">
                    <span className="grid place-items-center border-r border-a-border px-3 t-body-m text-a-text-2">https://</span>
                    <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="www.tradingview.com/x/…" className="min-w-0 flex-1 bg-transparent px-3 t-body-m text-a-text outline-none placeholder:text-a-text-3" />
                  </span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="t-caption text-a-text-2">Rule to remind</span>
                  {rules.map((r) => (
                    <span key={r} className="inline-flex h-5 items-center gap-1 rounded-a-xs bg-a-selected pl-2 t-mono-label-s text-a-text-2">
                      {r}
                      <button type="button" aria-label={`Remove ${r}`} onClick={() => setRules((x) => x.filter((y) => y !== r))} className="grid size-5 place-items-center outline-none hover:text-a-text focus-visible:text-a-text"><X className="size-3" /></button>
                    </span>
                  ))}
                  {addingRule ? (
                    <input autoFocus placeholder="e.g. Wait for the range to close" aria-label="New rule to remind" onBlur={(e) => (e.target.value.trim() && setRules((x) => [...x, e.target.value.trim()]), setAddingRule(false))} onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()} className="h-6 w-56 rounded-a-xs border border-a-border bg-a-field px-2 t-caption text-a-text outline-none focus-visible:border-a-border-focus" />
                  ) : (
                    <button type="button" onClick={() => setAddingRule(true)} className="flex items-center gap-1 t-caption text-a-text-2 outline-none hover:text-a-text focus-visible:text-a-text"><Plus className="size-3" /> Tag</button>
                  )}
                </div>
                <div className="flex items-center gap-3 border-t border-a-border-subtle pt-4">
                  <p className="min-w-0 flex-1 t-caption text-a-text-2">They get a notification and an e-mail.</p>
                  <AdminButton hierarchy="ghost" onClick={() => done(false)}>Mark done</AdminButton>
                  <AdminButton disabled={!text.trim() && !link.trim()} onClick={() => done(true)}>Send and mark done</AdminButton>
                </div>
              </>
            )}
          </Panel>

          <Panel className="gap-3">
            <div className="flex items-baseline justify-between">
              <h2 className="t-heading-m text-a-text">Earlier feedback</h2>
              <span className="t-caption text-a-text-3">{earlier.length}</span>
            </div>
            {earlier.length === 0 ? (
              <p className="t-body-m text-a-text-2">Nothing yet on this trade.</p>
            ) : (
              <ul className="grid gap-2">
                {earlier.map((m, i) => (
                  <li key={i} className="flex gap-2 t-body-m text-a-text">
                    <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-a-text-3" />
                    <span className="min-w-0 flex-1 truncate">{m.text}</span>
                    <span className="shrink-0 t-caption text-a-text-3">{m.when}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
