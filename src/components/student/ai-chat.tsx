"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowUp, BookOpen, CandlestickChart, Sparkles } from "lucide-react"
import { useCoach } from "@/components/coach/coach-provider"
import { AiMark, useStudentTier } from "@/components/courses/shared"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { DEFAULT_AI, SUGGESTED, aiAnswer, aiTradeAnswer, type AiReply } from "@/lib/data/ai"
import { TRADES, fmtR } from "@/lib/data/trades"
import { useStored } from "@/lib/prototype-store"
import { cn } from "@/lib/utils"

type Msg = { from: "me" | "ai"; text: string; reply?: AiReply; typing?: boolean }

/** STU-17 · Chat with the coach's AI, ask about a trade, see what's left of today's questions. */
export function StudentAi() {
  const { coach } = useCoach()
  const tier = useStudentTier()
  const ai = useStored(`${coach.slug}:ai`, DEFAULT_AI)
  const quota = ai.quotas[tier] ?? 30
  const [log, setLog] = useState<Msg[]>([])
  const [q, setQ] = useState("")
  const [picking, setPicking] = useState(false)
  const end = useRef<HTMLDivElement>(null)
  const used = 4 + log.filter((m) => m.from === "me").length
  const left = quota === 0 ? Infinity : Math.max(0, quota - used)

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [log])

  const ask = (text: string, reply: AiReply) => {
    if (left <= 0) return
    setLog((l) => [...l, { from: "me", text }, { from: "ai", text: "", typing: true }])
    setTimeout(() => setLog((l) => [...l.slice(0, -1), { from: "ai", text: reply.text, reply }]), 900)
  }

  return (
    <div className="flex flex-col page-gap">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="eyebrow">Answers from {coach.coachName}&apos;s lessons</span>
          <h1 className="text-3xl leading-tight md:text-4xl">{coach.wording.ai}</h1>
        </div>
        <div className="grid w-48 gap-1.5 text-sm">
          <span className="flex justify-between text-muted-foreground">
            Questions today <span className="text-foreground tabular-nums">{quota === 0 ? "Unlimited" : `${left} left`}</span>
          </span>
          {quota > 0 && <Progress value={(used / quota) * 100} />}
        </div>
      </div>

      <Card className="min-h-[52svh] gap-0 p-0">
        <div className="flex flex-1 flex-col gap-4 p-5">
          {log.length === 0 && (
            <div className="grid flex-1 place-items-center py-8 text-center">
              <div className="grid max-w-md justify-items-center gap-4">
                <span className="grid size-12 place-items-center rounded-(--r-inner) bg-primary text-primary-foreground">
                  <Sparkles className="size-6" />
                </span>
                <div className="grid gap-1">
                  <p className="text-lg">Ask anything about trading the {coach.coachName} way</p>
                  <p className="text-sm text-muted-foreground">Answers come from the lessons, with the exact minute to rewatch. No signals, no investment advice.</p>
                </div>
                <div className="grid w-full gap-2">
                  {SUGGESTED.map((s) => (
                    <button key={s} onClick={() => ask(s, aiAnswer(s))} className="rounded-(--r-inner) border px-3 py-2 text-left text-sm hover:bg-muted">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {log.map((m, i) =>
            m.from === "me" ? (
              <p key={i} className="max-w-[80%] self-end rounded-(--r-inner) bg-primary px-3.5 py-2 text-sm text-primary-foreground">
                {m.text}
              </p>
            ) : (
              <div key={i} className="grid max-w-[85%] gap-2 self-start rounded-(--r-inner) bg-muted px-3.5 py-2.5 text-sm">
                <AiMark className="justify-self-start" />
                {m.typing ? (
                  <span className="flex gap-1 py-1" aria-label="Thinking">
                    {[0, 1, 2].map((d) => (
                      <span key={d} className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${d * 120}ms` }} />
                    ))}
                  </span>
                ) : (
                  <>
                    <p>{m.text}</p>
                    {m.reply?.source && (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {m.reply.trade ? <CandlestickChart className="size-3.5" /> : <BookOpen className="size-3.5" />}
                        {m.reply.source}
                      </span>
                    )}
                  </>
                )}
              </div>
            ),
          )}
          <div ref={end} />
        </div>

        <div className="grid gap-2 border-t p-3">
          {picking && (
            <div className="grid gap-1 rounded-(--r-inner) border p-1">
              {TRADES.slice(0, 4).map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setPicking(false)
                    ask(`What about my ${t.symbol} ${t.side} on ${t.date}?`, aiTradeAnswer(t))
                  }}
                  className="flex items-center gap-3 rounded-(--r-inner) px-2.5 py-1.5 text-left text-sm hover:bg-muted"
                >
                  <span className="w-24 text-muted-foreground">{t.date}</span>
                  <span className="flex-1">
                    {t.symbol} {t.side} · {t.setup}
                  </span>
                  <span className={cn("tabular-nums", t.r >= 0 ? "text-profit" : "text-loss")}>{fmtR(t.r)}</span>
                </button>
              ))}
            </div>
          )}
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (q.trim()) ask(q.trim(), aiAnswer(q))
              setQ("")
            }}
          >
            <Button type="button" variant="outline" onClick={() => setPicking((p) => !p)} className="shrink-0">
              <CandlestickChart /> <span className="hidden sm:inline">Ask about a trade</span>
            </Button>
            <Textarea
              rows={1}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  e.currentTarget.form?.requestSubmit()
                }
              }}
              placeholder={left > 0 ? `Ask ${coach.wording.ai}…` : "No questions left today. Back tomorrow."}
              disabled={left <= 0}
              className="max-h-32 min-h-9 resize-none"
            />
            <Button type="submit" size="icon" disabled={!q.trim() || left <= 0} aria-label="Send">
              <ArrowUp />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
