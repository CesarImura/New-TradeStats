"use client"

import { useState } from "react"
import { Check, FileUp, Pencil, Play, Send, ShieldAlert, Sparkles } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { DEFAULT_AI, aiAnswer, type AiReply, type AiSetup } from "@/lib/data/ai"
import { AI_FEATURES, AI_KNOWLEDGE, AI_QUESTIONS, AI_USAGE } from "@/lib/data/people"
import { cn } from "@/lib/utils"
import { Field, Mono, Page, PageHeader, SettingRow, useCommunityData } from "../kit"
import { AdminButton, AdminProgress, Panel, PanelHeader, StatPanel, Tag } from "../ui"

/** ADM-24 features and quotas, ADM-25 knowledge, ADM-26 personality, ADM-27 test and correct, ADM-28 questions asked. */
export function AiAdmin() {
  const { coach } = useCoach()
  const [ai, setAi] = useCommunityData(coach.slug, "ai", DEFAULT_AI)
  const [tab, setTab] = useState("personality")
  const set = (patch: Partial<AiSetup>) => setAi((x) => ({ ...x, ...patch }))
  // Everything is on by default except the weekly summary in the entry tier.
  const featureOn = (f: string, tier: string) => ai.features[f]?.[tier] ?? !(f === "weekly" && tier === coach.tiers[0]?.id)

  return (
    <Page>
      <PageHeader
        title="AI assistant"
        text="Answers students 24/7 from your courses and notes"
        actions={
          <>
            <AdminButton hierarchy="secondary" onClick={() => setTab("test")}>
              <Play /> Test it
            </AdminButton>
            <AdminButton onClick={() => toast.success("Published. Students get the new answers now.")}>Publish changes</AdminButton>
          </>
        }
      />
      <Tabs value={tab} onValueChange={(v) => setTab(String(v))} className="gap-5">
        <TabsList className="flex-wrap">
          <TabsTrigger value="personality">Personality</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
          <TabsTrigger value="features">Features & quotas</TabsTrigger>
          <TabsTrigger value="test">Test & correct</TabsTrigger>
          <TabsTrigger value="questions">Questions <span className="text-muted-foreground tabular-nums">1.4k</span></TabsTrigger>
        </TabsList>
        <StatPanel
          stats={[
            { label: "Questions this month", value: "1,412", delta: "+22% vs last month", tone: "success" },
            { label: "Answered alone", value: "91%", delta: "9% sent to you" },
            { label: "Corrections", value: 14, delta: "Used in every answer" },
            { label: "Most asked", value: "Stops on ORB", delta: "64 times" },
          ]}
        />

        <TabsContent value="personality">
          <div className="grid items-start gap-4 lg:grid-cols-2">
            <Panel>
              <PanelHeader title="How it sounds" />
              <div className="grid gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback className="text-xs">{coach.wording.ai.split(" ").map((w) => w[0]).join("").slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 gap-1">
                    <Field label="Name">
                      <Input value={coach.wording.ai} readOnly aria-readonly />
                    </Field>
                    <span className="t-caption text-a-text-2">Rename it in Design → Menu and words.</span>
                  </div>
                </div>
                <Field label="Tone">
                  <div role="radiogroup" aria-label="Tone" className="grid grid-cols-3 gap-2">
                    {([["Calm and clear", 50], ["Friendly and warm", 15], ["Direct, no small talk", 85]] as const).map(([label, v]) => {
                      const on = label === (ai.tone < 33 ? "Friendly and warm" : ai.tone > 66 ? "Direct, no small talk" : "Calm and clear")
                      return (
                        <button key={label} type="button" role="radio" aria-checked={on} onClick={() => set({ tone: v })} className={cn("rounded-a-md border border-a-border-subtle px-2 py-2 t-body-m transition-colors duration-300 hover:bg-a-hover", on && "border-a-border-strong bg-a-selected")}>
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </Field>
                <Field label="Answer length">
                  <div role="radiogroup" aria-label="Answer length" className="grid grid-cols-3 gap-2">
                    {(["short", "medium", "long"] as const).map((l) => (
                      <button key={l} type="button" role="radio" aria-checked={ai.length === l} onClick={() => set({ length: l })} className={cn("rounded-a-md border border-a-border-subtle px-2 py-2 t-body-m capitalize transition-colors duration-300 hover:bg-a-hover", ai.length === l && "border-a-border-strong bg-a-selected")}>
                        {l === "long" ? "Detailed" : l}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            </Panel>
            <div className="grid gap-4">
              <Panel>
                <PanelHeader title="Rules" />
                <div className="grid gap-4">
                  <Field label="Never talk about">
                    <Textarea rows={2} value={ai.avoid} onChange={(e) => set({ avoid: e.target.value })} />
                  </Field>
                  <Field label="Examples or rules">
                    <Textarea rows={3} value={ai.examples} onChange={(e) => set({ examples: e.target.value })} />
                  </Field>
                  <p className="flex items-start gap-2 rounded-lg border border-dashed border-a-border-strong px-3 py-2 text-xs text-muted-foreground">
                    <ShieldAlert className="mt-0.5 size-3.5 shrink-0" /> Always on, can&apos;t be changed: no investment advice, no signals, no promises about results.
                  </p>
                </div>
              </Panel>
            <div className="grid content-start gap-2">
              <Mono className="text-muted-foreground">How it sounds</Mono>
              <div className="grid gap-2 rounded-lg border bg-card p-4 text-sm">
                <p className="justify-self-end rounded-lg bg-muted px-3 py-2">Should I trade during CPI?</p>
                <p className="rounded-lg bg-[var(--ts-cta)]/10 px-3 py-2">
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
          </div>
        </TabsContent>

        <TabsContent value="knowledge" className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">Your AI only answers from what you add here. New lessons and recordings are added automatically.</p>
            <AdminButton onClick={() => toast("Add PDFs, docs or a list of questions and answers")} hierarchy="secondary">
              <FileUp /> Add documents
            </AdminButton>
          </div>
          <div className="divide-y rounded-lg border bg-card px-3">
            {AI_KNOWLEDGE.map((k) => (
              <SettingRow key={k.id} label={k.name} text={`${k.kind} · ${k.items}`}>
                <Tag>{ai.knowledge[k.id] ? "Learned" : "Not used"}</Tag>
                <Switch checked={!!ai.knowledge[k.id]} onCheckedChange={(v) => set({ knowledge: { ...ai.knowledge, [k.id]: v } })} />
              </SettingRow>
            ))}
            {ai.corrections.length > 0 && (
              <SettingRow label="Your corrections" text={`${ai.corrections.length} answers you fixed in Test & correct`}>
                <Tag>Learned</Tag>
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
                    <AdminProgress label="Quota used" value={Math.min(100, (u.used / 4000) * 100)} />
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
                        <Tag tone="accent">Gap · no lesson yet</Tag>
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
            <div className="grid max-w-[85%] gap-1.5 rounded-lg bg-[var(--ts-cta)]/8 px-3 py-2 text-sm">
              <span className="flex items-center gap-1.5 text-xs text-[var(--ts-cta)]">
                <Sparkles className="size-3" /> {coach.wording.ai}
              </span>
              <p className={cn(m.fixed && "text-muted-foreground line-through")}>{m.a.text}</p>
              {m.fixed && <p>{m.fixed}</p>}
              {m.a.source && <span className="text-xs text-muted-foreground">{m.a.source}</span>}
              {editing === i ? (
                <div className="grid gap-2 pt-1">
                  <Textarea rows={3} value={fix} onChange={(e) => setFix(e.target.value)} />
                  <AdminButton
                    
                    className="justify-self-end"
                    onClick={() => {
                      setLog((l) => l.map((x, j) => (j === i ? { ...x, fixed: fix } : x)))
                      onCorrect({ q: m.q, a: fix })
                      setEditing(null)
                      toast("Correction saved", { description: "Your AI answers this from now on." })
                    }} size="md">
                    <Check /> Save correction
                  </AdminButton>
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
        <AdminButton type="submit">
          <Send /> Ask
        </AdminButton>
      </form>
    </div>
  )
}
