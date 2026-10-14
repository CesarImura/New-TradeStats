"use client"

import { useState } from "react"
import { Bot, Check, FileUp, Pencil, Send, ShieldAlert, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { DEFAULT_AI, aiAnswer, type AiReply, type AiSetup } from "@/lib/data/ai"
import { AI_FEATURES, AI_KNOWLEDGE, AI_QUESTIONS, AI_USAGE } from "@/lib/data/people"
import { cn } from "@/lib/utils"
import { Field, Mono, Page, PageHeader, SettingRow, useCommunityData } from "../kit"

/** ADM-24 features and quotas, ADM-25 knowledge, ADM-26 personality, ADM-27 test and correct, ADM-28 questions asked. */
export function AiAdmin() {
  const { coach } = useCoach()
  const [ai, setAi] = useCommunityData(coach.slug, "ai", DEFAULT_AI)
  const set = (patch: Partial<AiSetup>) => setAi((x) => ({ ...x, ...patch }))
  // Everything is on by default except the weekly summary in the entry tier.
  const featureOn = (f: string, tier: string) => ai.features[f]?.[tier] ?? !(f === "weekly" && tier === coach.tiers[0]?.id)

  return (
    <Page>
      <PageHeader
        title="AI assistant"
        text={`Answers your ${coach.wording.students.toLowerCase()}' questions from your own lessons, in your way of trading. Students see it as “${coach.wording.ai}”. Everything it writes is marked as AI.`}
        guide="Training your AI · 3 min"
      />
      <Tabs defaultValue="personality" className="gap-5">
        <TabsList className="flex-wrap">
          <TabsTrigger value="personality">Personality</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
          <TabsTrigger value="features">Features & quotas</TabsTrigger>
          <TabsTrigger value="test">Test & correct</TabsTrigger>
          <TabsTrigger value="questions">Questions asked</TabsTrigger>
        </TabsList>

        <TabsContent value="personality">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="grid content-start gap-4">
              <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
                <span className="grid size-12 place-items-center rounded-lg bg-[var(--ts-yellow)] text-[#0a0a0a]">
                  <Bot className="size-6" />
                </span>
                <div className="grid flex-1 gap-0.5">
                  <span className="font-medium">{coach.wording.ai}</span>
                  <span className="text-sm text-muted-foreground">Rename it in Design → Menu and words.</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => toast("Upload a picture for your AI")}>
                  Change picture
                </Button>
              </div>
              <Field label="Tone" hint={ai.tone < 33 ? "Friendly and warm" : ai.tone > 66 ? "Direct, no small talk" : "Calm and clear"}>
                <Slider value={[ai.tone]} min={0} max={100} onValueChange={(v) => set({ tone: Array.isArray(v) ? v[0] : v })} aria-label="Tone" />
                <span className="flex justify-between text-xs text-muted-foreground">
                  <span>Warm</span>
                  <span>Direct</span>
                </span>
              </Field>
              <Field label="Answer length">
                <div className="grid grid-cols-3 gap-1 rounded-lg border p-1">
                  {(["short", "medium", "long"] as const).map((l) => (
                    <button key={l} onClick={() => set({ length: l })} className={cn("rounded-md py-1.5 text-sm capitalize", ai.length === l && "bg-muted font-medium")}>
                      {l}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="How you talk" hint="Examples or rules">
                <Textarea rows={3} value={ai.examples} onChange={(e) => set({ examples: e.target.value })} />
              </Field>
              <Field label="Never talk about">
                <Textarea rows={3} value={ai.avoid} onChange={(e) => set({ avoid: e.target.value })} />
              </Field>
              <p className="flex items-start gap-2 rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
                <ShieldAlert className="mt-0.5 size-3.5 shrink-0" /> Always on, can&apos;t be changed: no investment advice, no signals, no promises about results.
              </p>
            </div>
            <div className="grid content-start gap-2">
              <Mono className="text-muted-foreground">How it sounds</Mono>
              <div className="grid gap-2 rounded-lg border bg-card p-4 text-sm">
                <p className="justify-self-end rounded-lg bg-muted px-3 py-2">Should I trade during CPI?</p>
                <p className="rounded-lg bg-[var(--ts-yellow)]/10 px-3 py-2">
                  {ai.tone > 66
                    ? "No. Flat 10 minutes before and after. Trade the reaction once the first 5-minute candle closes."
                    : ai.tone < 33
                      ? "Good question! The rule we use is to stay flat 10 minutes before and after red news like CPI. Once the first 5-minute candle closes, you can look for the reaction."
                      : "Stay flat 10 minutes before and after red news like CPI. After the first 5-minute candle closes, trade the reaction."}
                  {ai.length !== "short" && <span className="mt-1 block text-xs text-muted-foreground">Module 3 · Daily loss limits, 08:02</span>}
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="knowledge" className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">What your AI learns from. New lessons and recordings are added automatically.</p>
            <Button variant="outline" onClick={() => toast("Add PDFs, docs or a list of questions and answers")}>
              <FileUp /> Add documents
            </Button>
          </div>
          <div className="divide-y rounded-lg border bg-card px-3">
            {AI_KNOWLEDGE.map((k) => (
              <SettingRow key={k.id} label={k.name} text={`${k.kind} · ${k.items}`}>
                <Badge variant="outline" className="font-normal text-muted-foreground">
                  {ai.knowledge[k.id] ? "Learned" : "Not used"}
                </Badge>
                <Switch checked={!!ai.knowledge[k.id]} onCheckedChange={(v) => set({ knowledge: { ...ai.knowledge, [k.id]: v } })} />
              </SettingRow>
            ))}
            {ai.corrections.length > 0 && (
              <SettingRow label="Your corrections" text={`${ai.corrections.length} answers you fixed in Test & correct`}>
                <Badge variant="outline">Learned</Badge>
              </SettingRow>
            )}
          </div>
        </TabsContent>

        <TabsContent value="features" className="grid gap-6">
          <div className="overflow-x-auto rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Feature</TableHead>
                  {coach.tiers.map((t) => (
                    <TableHead key={t.id} className="text-center">
                      {t.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {AI_FEATURES.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="whitespace-normal">
                      <div className="grid gap-0.5">
                        <span className="font-medium">{f.name}</span>
                        <span className="text-xs text-muted-foreground">{f.text}</span>
                      </div>
                    </TableCell>
                    {coach.tiers.map((t) => (
                      <TableCell key={t.id} className="text-center">
                        <Switch
                          checked={featureOn(f.id, t.id)}
                          disabled={f.id === "briefing"}
                          onCheckedChange={(v) => set({ features: { ...ai.features, [f.id]: { ...ai.features[f.id], [t.id]: v } } })}
                          aria-label={`${f.name} for ${t.name}`}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <section className="grid gap-2">
            <h2 className="font-medium">Questions per day</h2>
            <p className="text-sm text-muted-foreground">0 means unlimited. AI costs are on our side up to your plan&apos;s limit.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {coach.tiers.map((t, i) => {
                const u = AI_USAGE[Math.min(i, AI_USAGE.length - 1)]
                const q = ai.quotas[t.id] ?? u.quota
                return (
                  <div key={t.id} className="grid gap-2 rounded-lg border bg-card p-3">
                    <span className="flex items-center justify-between text-sm">
                      {t.name}
                      <Input
                        type="number"
                        min={0}
                        value={q}
                        onChange={(e) => set({ quotas: { ...ai.quotas, [t.id]: Number(e.target.value) } })}
                        className="h-7 w-20 text-right tabular-nums"
                        aria-label={`Daily questions for ${t.name}`}
                      />
                    </span>
                    <Progress value={Math.min(100, (u.used / 4000) * 100)} />
                    <span className="text-xs text-muted-foreground tabular-nums">{u.used.toLocaleString("en")} questions this month</span>
                  </div>
                )
              })}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="test">
          <TestChat onCorrect={(c) => set({ corrections: [...ai.corrections, c] })} />
        </TabsContent>

        <TabsContent value="questions" className="grid gap-3">
          <p className="text-sm text-muted-foreground">What students ask most this month. Questions without a lesson behind them are gaps you could fill.</p>
          <div className="overflow-x-auto rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Question</TableHead>
                  <TableHead className="text-right">Asked</TableHead>
                  <TableHead>Answered from</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {AI_QUESTIONS.map((q) => (
                  <TableRow key={q.q}>
                    <TableCell className="whitespace-normal">{q.q}</TableCell>
                    <TableCell className="text-right tabular-nums">{q.n}×</TableCell>
                    <TableCell>
                      {q.answered ? (
                        <span className="text-muted-foreground">{q.lesson}</span>
                      ) : (
                        <Badge variant="outline" className="border-[var(--ts-orange)]/50 text-[var(--ts-orange)]">
                          Gap · no lesson yet
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </Page>
  )
}

function TestChat({ onCorrect }: { onCorrect: (c: { q: string; a: string }) => void }) {
  const { coach } = useCoach()
  const [q, setQ] = useState("")
  const [log, setLog] = useState<{ q: string; a: AiReply; fixed?: string }[]>([])
  const [editing, setEditing] = useState<number | null>(null)
  const [fix, setFix] = useState("")

  return (
    <div className="grid gap-3 lg:max-w-3xl">
      <p className="text-sm text-muted-foreground">Ask what your students would ask. If an answer is wrong, correct it: your version becomes knowledge.</p>
      <div className="grid min-h-64 content-start gap-3 rounded-lg border bg-card p-4">
        {log.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Try: “Where do I put my stop on an ORB?”</p>}
        {log.map((m, i) => (
          <div key={i} className="grid gap-2">
            <p className="justify-self-end rounded-lg bg-muted px-3 py-2 text-sm">{m.q}</p>
            <div className="grid max-w-[85%] gap-1.5 rounded-lg bg-[var(--ts-yellow)]/8 px-3 py-2 text-sm">
              <span className="flex items-center gap-1.5 text-xs text-[var(--ts-yellow)]">
                <Sparkles className="size-3" /> {coach.wording.ai}
              </span>
              <p className={cn(m.fixed && "text-muted-foreground line-through")}>{m.a.text}</p>
              {m.fixed && <p>{m.fixed}</p>}
              {m.a.source && <span className="text-xs text-muted-foreground">{m.a.source}</span>}
              {editing === i ? (
                <div className="grid gap-2 pt-1">
                  <Textarea rows={3} value={fix} onChange={(e) => setFix(e.target.value)} />
                  <Button
                    size="sm"
                    className="justify-self-end"
                    onClick={() => {
                      setLog((l) => l.map((x, j) => (j === i ? { ...x, fixed: fix } : x)))
                      onCorrect({ q: m.q, a: fix })
                      setEditing(null)
                      toast("Correction saved", { description: "Your AI answers this from now on." })
                    }}
                  >
                    <Check /> Save correction
                  </Button>
                </div>
              ) : (
                !m.fixed && (
                  <button
                    onClick={() => {
                      setEditing(i)
                      setFix(m.a.text)
                    }}
                    className="flex items-center gap-1 justify-self-start text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="size-3" /> Correct this answer
                  </button>
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
          if (!q.trim()) return
          setLog((l) => [...l, { q: q.trim(), a: aiAnswer(q) }])
          setQ("")
        }}
      >
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask your AI…" />
        <Button type="submit">
          <Send /> Ask
        </Button>
      </form>
    </div>
  )
}
