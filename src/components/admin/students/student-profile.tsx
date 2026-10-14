"use client"

import { useState } from "react"
import { Eye, Mail, MessageSquareText, Sparkles } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { DEMO_ADMIN } from "@/lib/data/account"
import { GROUPS, TEAM, tierFor, type Student } from "@/lib/data/people"
import { COURSES, courseProgress } from "@/lib/data/sample"
import { TRADES, fmtPnl, fmtR } from "@/lib/data/trades"
import { cn } from "@/lib/utils"
import { HealthDot, Mono, NativeSelect, SettingRow, useCommunityData } from "../kit"

const NO_NOTES: Record<string, Student["notes"]> = {}

/** ADM-04 · Everything about one student, with the AI briefing (ADM-07) before a call. */
export function StudentProfile({ student: s, onOpenChange, onMessage }: { student: Student | null; onOpenChange: (o: boolean) => void; onMessage: (s: Student) => void }) {
  const { coach } = useCoach()
  const [notes, setNotes] = useCommunityData(coach.slug, "student-notes", NO_NOTES)
  const [draft, setDraft] = useState("")
  const [briefing, setBriefing] = useState(false)
  if (!s) return <Sheet open={false} onOpenChange={onOpenChange} />

  const myNotes = [...(notes[s.id] ?? []), ...s.notes]
  const tier = tierFor(coach, s.tier)

  return (
    <Sheet open={!!s} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-2xl">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-start gap-3 pr-8">
            <Avatar className="size-12">
              <AvatarFallback>{s.initials}</AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 flex-1 gap-1">
              <SheetTitle className="text-lg">{s.name}</SheetTitle>
              <SheetDescription>
                {tier.name}
                {s.group ? ` · ${s.group}` : ""} · joined {s.joined} · {s.email}
              </SheetDescription>
              <span className="flex items-center gap-2 text-sm">
                <HealthDot health={s.health} /> {s.reason ?? "All good"}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={() => onMessage(s)}>
              <Mail /> Message
            </Button>
            <Button size="sm" variant="outline" onClick={() => setBriefing((b) => !b)}>
              <Sparkles /> Briefing for a call
            </Button>
            <Button size="sm" variant="outline" onClick={() => toast(`Viewing the platform as ${s.name}`, { description: `${tier.name}${s.group ? `, ${s.group}` : ""}` })}>
              <Eye /> View as {s.name.split(" ")[0]}
            </Button>
          </div>
          {briefing && (
            <div className="mt-3 grid gap-2 rounded-lg border border-[var(--ts-cta)]/25 bg-[var(--ts-cta)]/5 p-3 text-sm">
              <Mono className="text-[var(--ts-cta)]">AI briefing · only you see this</Mono>
              <ul className="grid gap-1 text-muted-foreground">
                <li>· {s.trades30} trades in 30 days, {s.rules}% of rules kept. Most broken: “Stop never moved further away”.</li>
                <li>· Losing trades cluster after 12:00; mornings average +0.8R.</li>
                <li>· Last question to the AI: “Where exactly do I put my stop on an ORB?”</li>
                <li>· Open: {TRADES.filter((t) => t.review === "waiting").length} trades waiting for your review.</li>
              </ul>
            </div>
          )}
        </SheetHeader>

        <Tabs defaultValue="overview" className="min-h-0 flex-1 gap-0">
          <TabsList variant="line" className="w-full shrink-0 justify-start gap-0 overflow-x-auto border-b px-4 [scrollbar-width:none]">
            {["overview", "progress", "journal", "notes", "access", "billing", "history"].map((t) => (
              <TabsTrigger key={t} value={t} className="capitalize">
                {t}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <TabsContent value="overview" className="grid gap-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ["Course progress", `${s.progress}%`],
                  ["Active", `${s.activeDays} of 14 days`],
                  ["Rules kept", s.broker ? `${s.rules}%` : "–"],
                  ["Paid so far", `€${s.paid.toLocaleString("en")}`],
                ].map(([l, v]) => (
                  <div key={l} className="grid gap-1 rounded-lg border p-3">
                    <span className="text-xs text-muted-foreground">{l}</span>
                    <span className="text-lg tabular-nums">{v}</span>
                  </div>
                ))}
              </div>
              <div className="grid gap-1 divide-y rounded-lg border px-3">
                <SettingRow label="Broker" text={s.broker ? "Trades sync automatically" : "Not connected yet"}>
                  <Badge variant={s.broker ? "secondary" : "outline"}>{s.broker ? "Connected" : "Not connected"}</Badge>
                </SettingRow>
                <SettingRow label="Discord" text={s.discord ? "Role given by tier" : "Hasn't linked Discord"}>
                  <Badge variant={s.discord ? "secondary" : "outline"}>{s.discord ? "Linked" : "Not linked"}</Badge>
                </SettingRow>
                <SettingRow label="Assistant coach" text="Sees this student's feedback requests and notes">
                  <NativeSelect defaultValue={s.coach ?? ""} onChange={(e) => toast(e.target.value ? `${s.name} assigned to ${e.target.value}` : "Assistant coach removed")}>
                    <option value="">Nobody</option>
                    {TEAM.filter((t) => t.role === "Assistant coach").map((t) => (
                      <option key={t.name} value={t.name.split(" ")[0]}>
                        {t.name}
                      </option>
                    ))}
                  </NativeSelect>
                </SettingRow>
              </div>
            </TabsContent>

            <TabsContent value="progress" className="grid gap-4">
              {COURSES.map((c, i) => {
                const v = Math.max(0, Math.min(100, s.progress + (i === 0 ? 20 : i === 1 ? -20 : -60)))
                return (
                  <div key={c.id} className="grid gap-1.5">
                    <div className="flex justify-between text-sm">
                      <span>{c.title}</span>
                      <span className="text-muted-foreground tabular-nums">{c.locked && tier.id !== "vip" ? "No access" : `${v}%`}</span>
                    </div>
                    <Progress value={c.locked && tier.id !== "vip" ? 0 : v} />
                    <span className="text-xs text-muted-foreground">Average of all students: {courseProgress(c) + 9}%</span>
                  </div>
                )
              })}
            </TabsContent>

            <TabsContent value="journal" className="grid gap-2">
              {!s.broker ? (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{s.name.split(" ")[0]} hasn&apos;t connected a broker yet.</p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">Read-only. You see the journal as {s.name.split(" ")[0]} does.</p>
                  {TRADES.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                      <span className="w-24 shrink-0 text-xs text-muted-foreground">{t.date}</span>
                      <span className="w-24 shrink-0 font-medium">
                        {t.symbol} {t.side}
                      </span>
                      <span className="flex-1 truncate text-muted-foreground">{t.setup}</span>
                      {t.review === "waiting" && <Badge variant="outline">Review asked</Badge>}
                      <span className={cn("w-14 text-right tabular-nums", t.r >= 0 ? "text-[var(--profit)]" : "text-[var(--loss)]")}>{fmtR(t.r)}</span>
                      <span className="hidden w-20 text-right text-muted-foreground tabular-nums sm:block">{fmtPnl(t.pnl)}</span>
                    </div>
                  ))}
                </>
              )}
            </TabsContent>

            <TabsContent value="notes" className="grid gap-3">
              <div className="grid gap-2">
                <Textarea rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Private note. Only your team sees it." />
                <Button
                  size="sm"
                  className="justify-self-end"
                  disabled={!draft.trim()}
                  onClick={() => {
                    setNotes((n) => ({ ...n, [s.id]: [{ by: DEMO_ADMIN.name.split(" ")[0], when: "just now", text: draft.trim() }, ...(n[s.id] ?? [])] }))
                    setDraft("")
                  }}
                >
                  <MessageSquareText /> Add note
                </Button>
              </div>
              {myNotes.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
              {myNotes.map((n, i) => (
                <div key={i} className="grid gap-1 rounded-lg border p-3 text-sm">
                  <span className="text-xs text-muted-foreground">
                    {n.by} · {n.when}
                  </span>
                  <p>{n.text}</p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="access" className="grid gap-1 divide-y">
              <SettingRow label="Tier" text="Upgrades start now. Downgrades at the end of the period.">
                <NativeSelect defaultValue={tier.id} onChange={(e) => toast(`${s.name} moves to ${coach.tiers.find((t) => t.id === e.target.value)?.name}`)}>
                  {coach.tiers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} · {t.price}
                    </option>
                  ))}
                </NativeSelect>
              </SettingRow>
              <SettingRow label="Group" text="What a group unlocks starts on the group's start date">
                <NativeSelect defaultValue={s.group ?? ""} onChange={(e) => toast(e.target.value ? `Added to ${e.target.value}` : "Removed from the group")}>
                  <option value="">No group</option>
                  {GROUPS.map((g) => (
                    <option key={g.id} value={g.name}>
                      {g.name}
                    </option>
                  ))}
                </NativeSelect>
              </SettingRow>
              <SettingRow label="Extra access" text="Give one course for free, on top of the tier">
                <Button size="sm" variant="outline" onClick={() => toast("Pick a course to unlock for this student")}>
                  Add a course
                </Button>
              </SettingRow>
              <SettingRow label="Pause access" text="Keeps the account and the journal. Nothing is deleted.">
                <Switch onCheckedChange={(v) => toast(v ? "Access paused" : "Access back on")} />
              </SettingRow>
            </TabsContent>

            <TabsContent value="billing" className="grid gap-3">
              <div className="grid gap-1 divide-y rounded-lg border px-3">
                <SettingRow label="Plan">
                  <span className="text-sm">
                    {tier.name} · {"price" in tier ? `${tier.price} / ${(tier as { cadence?: string }).cadence ?? "month"}` : ""}
                  </span>
                </SettingRow>
                <SettingRow label="Next payment">
                  <span className="text-sm">{s.reason === "Payment failed" ? "Retrying Wed 14 Oct" : "1 Nov 2026"}</span>
                </SettingRow>
                <SettingRow label="Card">
                  <span className="text-sm text-muted-foreground">Visa ·· 4242{s.reason === "Payment failed" ? " · expired" : ""}</span>
                </SettingRow>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => toast("Payment link sent", { description: `${s.name} gets an e-mail to update the card.` })}>
                  Send payment link
                </Button>
                <Button size="sm" variant="outline" onClick={() => toast("Refund the last payment?", { description: "In the real product this asks to confirm." })}>
                  Refund last payment
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => toast("Cancel at the end of the period?", { description: "In the real product this asks to confirm." })}>
                  Cancel membership
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <ol className="relative grid gap-4 border-l pl-4">
                {s.history.map((h, i) => (
                  <li key={i} className="grid gap-0.5 text-sm">
                    <span className="absolute -left-[4.5px] mt-1.5 size-2 rounded-full bg-muted-foreground/60" />
                    <span className="text-xs text-muted-foreground">{h.when}</span>
                    {h.text}
                  </li>
                ))}
              </ol>
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
