"use client"

import { useState } from "react"
import { Check, FileSpreadsheet, Link2 } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { GROUPS } from "@/lib/data/people"
import { cn } from "@/lib/utils"
import { Field, Mono, NativeSelect } from "../kit"

const SAMPLE = [
  ["Full name", "E-mail", "Plan", "Joined"],
  ["Hugo Martin", "hugo.martin@mail.fr", "Pro", "2025-11-02"],
  ["Ines Duarte", "ines.duarte@gmail.com", "Pro", "2026-01-15"],
  ["Marek Nowak", "marek@nowak.pl", "Basic", "2026-03-09"],
  ["Yuki Tanaka", "yuki.t@me.com", "Basic", "2026-06-21"],
]
const COLUMNS = ["Name", "E-mail", "Tier", "Joined date", "Don't import"]
const GUESS = ["Name", "E-mail", "Tier", "Joined date"]

/** ADM-03 · Bring students over: a CSV from Whop, Skool or Kajabi, or a list of e-mails. */
export function ImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { coach } = useCoach()
  const [step, setStep] = useState<"source" | "map" | "access">("source")
  const [mode, setMode] = useState<"csv" | "emails" | "link">("csv")
  const [emails, setEmails] = useState("")
  const [map, setMap] = useState(GUESS)
  const [tier, setTier] = useState(coach.tiers[0]?.id ?? "")
  const [group, setGroup] = useState("")
  const [invite, setInvite] = useState(true)
  const [keepBilling, setKeepBilling] = useState(true)
  const count = mode === "csv" ? SAMPLE.length - 1 : emails.split(/[\s,;]+/).filter((e) => e.includes("@")).length

  const close = () => {
    onOpenChange(false)
    setTimeout(() => setStep("source"), 200)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import or invite students</DialogTitle>
          <DialogDescription>
            {step === "source" && "From a file, a list of e-mails, or a link to share."}
            {step === "map" && "We matched the columns. Check they're right."}
            {step === "access" && `What ${count} students get.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1">
          {["source", "map", "access"].map((s, i) => (
            <span key={s} className={cn("h-0.5 flex-1 bg-white/10", ["source", "map", "access"].indexOf(step) >= i && "bg-[var(--ts-cta)]")} />
          ))}
        </div>

        {step === "source" && (
          <div className="grid gap-4">
            <div className="grid grid-cols-3 gap-2" role="radiogroup">
              {(
                [
                  ["csv", "A file", "CSV from Whop, Skool, Kajabi, Stripe"],
                  ["emails", "E-mails", "Paste a list"],
                  ["link", "A link", "Anyone with it can join"],
                ] as const
              ).map(([id, t, d]) => (
                <button
                  key={id}
                  role="radio"
                  aria-checked={mode === id}
                  onClick={() => setMode(id)}
                  className={cn("grid gap-0.5 rounded-lg border p-3 text-left text-sm hover:bg-muted", mode === id && "border-[var(--ts-interactive)]")}
                >
                  <span className="font-medium">{t}</span>
                  <span className="text-xs text-muted-foreground">{d}</span>
                </button>
              ))}
            </div>
            {mode === "csv" && (
              <div className="grid place-items-center gap-2 rounded-lg border border-dashed px-6 py-8 text-center">
                <FileSpreadsheet className="size-7 text-muted-foreground" />
                <p className="text-sm">Drop your file here</p>
                <p className="text-xs text-muted-foreground">Prototype: a sample file with 4 students is used.</p>
              </div>
            )}
            {mode === "emails" && <Textarea rows={6} value={emails} onChange={(e) => setEmails(e.target.value)} placeholder={"hugo@mail.fr\nines@gmail.com"} />}
            {mode === "link" && (
              <div className="grid gap-2">
                <div className="flex gap-2">
                  <Input readOnly value={`https://${coach.slug}.tradestats.app/join/${coach.tiers[0]?.id ?? "free"}-x8k2`} />
                  <Button variant="outline" onClick={() => toast("Link copied")}>
                    <Link2 /> Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Share it in Discord or on socials. People who join get the tier you pick next.</p>
              </div>
            )}
          </div>
        )}

        {step === "map" && (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {SAMPLE[0].map((h, i) => (
                    <TableHead key={h} className="h-auto py-2">
                      <div className="grid gap-1.5">
                        <Mono className="text-muted-foreground">{h}</Mono>
                        <NativeSelect value={map[i]} onChange={(e) => setMap((m) => m.map((x, j) => (j === i ? e.target.value : x)))} className="h-7 text-xs">
                          {COLUMNS.map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </NativeSelect>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {SAMPLE.slice(1).map((r) => (
                  <TableRow key={r[1]}>
                    {r.map((c, i) => (
                      <TableCell key={i} className={cn(map[i] === "Don't import" && "text-muted-foreground/50 line-through")}>
                        {c}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {step === "access" && (
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Tier">
                <NativeSelect value={tier} onChange={(e) => setTier(e.target.value)}>
                  {coach.tiers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} · {t.price}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Group" hint="Optional">
                <NativeSelect value={group} onChange={(e) => setGroup(e.target.value)}>
                  <option value="">No group</option>
                  {GROUPS.map((g) => (
                    <option key={g.id} value={g.name}>
                      {g.name}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
            {mode === "csv" && (
              <p className="text-xs text-muted-foreground">
                The file has a “Plan” column: Pro → {coach.tiers[1]?.name ?? coach.tiers[0]?.name}, Basic → {coach.tiers[0]?.name}. You can change it per student later.
              </p>
            )}
            <label className="flex items-start gap-2.5 text-sm">
              <Checkbox checked={invite} onCheckedChange={(v) => setInvite(!!v)} className="mt-0.5" />
              <span className="grid gap-0.5">
                Send the invite e-mail now
                <span className="text-xs text-muted-foreground">From {coach.coachName}, in your design. Otherwise they stay “Invited” until you send it.</span>
              </span>
            </label>
            {mode === "csv" && (
              <label className="flex items-start gap-2.5 text-sm">
                <Checkbox checked={keepBilling} onCheckedChange={(v) => setKeepBilling(!!v)} className="mt-0.5" />
                <span className="grid gap-0.5">
                  Keep their paid-until date
                  <span className="text-xs text-muted-foreground">Nobody pays twice: billing here starts when their current period ends.</span>
                </span>
              </label>
            )}
          </div>
        )}

        <DialogFooter>
          {step !== "source" && (
            <Button variant="ghost" onClick={() => setStep(step === "access" ? (mode === "csv" ? "map" : "source") : "source")}>
              Back
            </Button>
          )}
          {step === "source" && mode === "link" ? (
            <Button onClick={close}>Done</Button>
          ) : step !== "access" ? (
            <Button disabled={step === "source" && count === 0} onClick={() => setStep(step === "source" && mode === "csv" ? "map" : "access")}>
              Continue
            </Button>
          ) : (
            <Button
              onClick={() => {
                toast(`${count} students imported`, { description: invite ? "Invite e-mails are on their way." : "They're waiting as “Invited”." })
                close()
              }}
            >
              <Check /> Import {count}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
