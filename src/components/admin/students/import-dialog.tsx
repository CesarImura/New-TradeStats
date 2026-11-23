"use client"

import { useMemo, useState } from "react"
import { toast } from "@/lib/toast"
import { useCoach } from "@/components/coach/coach-provider"
import { Check, FileSpreadsheet, Link2 } from "@/components/icons"
import { Checkbox } from "@/components/ui/checkbox"
import { isOfferOnly } from "@/lib/data/access"
import { GROUPS, type Student } from "@/lib/data/people"
import { cn } from "@/lib/utils"
import { AdminSelect, AdminButton, AdminField, AdminFilter, AdminModal, AdminTable, AdminTableHead, AdminTd, AdminTh, AdminTr, Callout, Dropzone, FileItem, OptionCard, StepIndicator, adminControl } from "../ui"

/** What a "sample" CSV from another platform looks like: the first row is what the coach sees in the Example column. */
const SAMPLE_NAME = "students-export.csv"
const SAMPLE_HEAD = ["Full name", "E-mail", "Plan", "Team", "Joined", "Phone"]
const SAMPLE_ROWS = [
  ["Rafael Quintero", "rafael.quintero@gmail.com", "Basic", "—", "12/03/2025", "+33 6 12 34"],
  ["Greta Lindholm", "greta.lindholm@outlook.com", "Pro", "Futures A", "13/02/2025", "+46 70 123"],
  ["Samir Haddad", "samir@haddad.ma", "Basic", "—", "07/04/2025", "+212 6 12"],
  ["Elodie Marchand", "elodie.m@free.fr", "Pro", "—", "20/07/2025", "+33 6 98 76"],
]
const GUESS = ["Name", "E-mail", "Tier", "Group", "Joined date", "Don't import"]
const FIELDS = ["Name", "E-mail", "Tier", "Group", "Joined date", "Don't import"]
const MODES = [
  { id: "csv", title: "A file", description: "CSV from Whop, Skool or Kajabi" },
  { id: "emails", title: "E-mails", description: "Paste a list" },
  { id: "link", title: "A link", description: "Anyone with it can join" },
] as const
type Mode = (typeof MODES)[number]["id"]

/** Students · 03 Import or invite (Figma 1485:74593): choose where they come from, check the columns, invite. Three steps, the same modal throughout. */
export function ImportDialog({ open, onOpenChange, existing, onImported }: { open: boolean; onOpenChange: (o: boolean) => void; /** E-mails of the people who are already students, to tell them from the new ones. */ existing: string[]; /** The students this import creates: the list shows them as Invited. */ onImported: (added: Student[]) => void }) {
  const { coach } = useCoach()
  const [step, setStep] = useState(0)
  const [mode, setMode] = useState<Mode>("csv")
  const [file, setFile] = useState<string | null>(null)
  const [emails, setEmails] = useState("")
  const [map, setMap] = useState(GUESS)
  const [tier, setTier] = useState(coach.tiers[0]?.id ?? "")
  const [group, setGroup] = useState("")
  const [invite, setInvite] = useState(true)
  // What the last import really added (the typed list stops counting once those people are students).
  const [imported, setImported] = useState(0)

  // What was typed, sorted into the ones to invite, the ones who are already students and what is not an e-mail (repeats count once).
  const typed = useMemo(() => {
    const tokens = emails.split(/[\s,;]+/).filter(Boolean)
    const valid = [...new Set(tokens.filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)).map((e) => e.toLowerCase()))]
    const known = new Set(existing.map((e) => e.toLowerCase()))
    return { addresses: valid.filter((e) => !known.has(e)), already: valid.filter((e) => known.has(e)).length, invalid: tokens.filter((e) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)).length }
  }, [emails, existing])
  const addresses = typed.addresses
  const sold = coach.tiers.filter((t) => !isOfferOnly(t))
  const count = mode === "csv" ? SAMPLE_ROWS.length : mode === "emails" ? addresses.length : 0
  const tierName = coach.tiers.find((t) => t.id === tier)?.name ?? ""
  const csv = mode === "csv"
  const labels = ["Choose", csv ? "Check columns" : "Access", "Invite"]
  const mapped = map.filter((m) => m !== "Don't import")
  const noEmail = csv && !map.includes("E-mail")
  const doubled = csv && mapped.find((m, i) => mapped.indexOf(m) !== i)
  const blocked = noEmail || !!doubled

  const reset = () => {
    setStep(0)
    setMode("csv")
    setFile(null)
    setEmails("")
    setMap(GUESS)
    setGroup("")
    setInvite(true)
    setImported(0)
  }
  const close = () => {
    onOpenChange(false)
    setTimeout(reset, 200)
  }
  const done = () => {
    const people: { name: string; email: string; group?: string }[] =
      mode === "csv"
        ? SAMPLE_ROWS.map((r) => ({ name: r[map.indexOf("Name")] ?? r[0]!, email: r[map.indexOf("E-mail")]!, group: map.includes("Group") && r[map.indexOf("Group")] !== "—" ? r[map.indexOf("Group")] : undefined }))
        : addresses.map((email) => ({ name: nameFrom(email), email, group: group || undefined }))
    const added = people.map((p, i) => toStudent(p, tier, `${Date.now().toString(36)}${i}`)).filter((st) => !existing.some((e) => e.toLowerCase() === st.email.toLowerCase()))
    onImported(added)
    setImported(added.length)
    toast(`${added.length} ${added.length === 1 ? "student" : "students"} imported`, { description: invite ? "Invite e-mails are on their way." : "They're waiting as “Invited”." })
    setStep(2)
  }

  const subtitle = step === 0 ? "From a file, a list of e-mails, or a link to share." : step === 1 ? (csv ? "We matched the columns. Check they're right." : `What ${count} ${count === 1 ? "student gets" : "students get"}.`) : "All set."

  return (
    <AdminModal
      open={open}
      onOpenChange={(o) => (o ? onOpenChange(true) : close())}
      title="Import or invite students"
      subtitle={step === 1 && csv ? "From a file, a list of e-mails, or a link to share." : subtitle}
      className="sm:max-w-[720px]"
      bodyClassName="gap-5"
      footer={
        <div className="flex w-full items-center gap-2">
          {step === 1 && <AdminButton hierarchy="text" onClick={() => setStep(0)}>Back</AdminButton>}
          <span aria-hidden className="h-px min-w-px flex-1" />
          {step === 0 && mode === "link" && <AdminButton onClick={close}>Done</AdminButton>}
          {step === 0 && mode !== "link" && (
            <AdminButton disabled={csv ? !file : count === 0} onClick={() => setStep(1)}>Continue</AdminButton>
          )}
          {step === 1 && (
            <AdminButton disabled={blocked || count === 0} onClick={done}>
              Import {count} {count === 1 ? "student" : "students"}
            </AdminButton>
          )}
          {step === 2 && (
            <>
              <AdminButton hierarchy="secondary" onClick={reset}>Import more</AdminButton>
              <AdminButton onClick={close}>Done</AdminButton>
            </>
          )}
        </div>
      }>
      <ol aria-label="Steps" className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {labels.map((l, i) => (
          <li key={l} aria-current={i === step ? "step" : undefined} className="flex items-center gap-3">
            <span className="flex items-center gap-2">
              <StepIndicator step={i + 1} state={i < step ? "done" : i === step ? "current" : "upcoming"} />
              <span className={cn("t-body-m", i === step ? "text-a-text" : "text-a-text-2")}>{l}</span>
            </span>
            {i < labels.length - 1 && <span aria-hidden className="t-body-m text-a-text-3">—</span>}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="flex flex-col gap-4">
          <div role="radiogroup" aria-label="Where do they come from?" className="grid gap-2 sm:grid-cols-3">
            {MODES.map((m) => (
              <OptionCard key={m.id} checked={mode === m.id} onSelect={() => setMode(m.id)} title={m.title} description={m.description} />
            ))}
          </div>

          {csv &&
            (file ? (
              <FileItem name={file} status="done" meta={`${SAMPLE_ROWS.length} students · ${SAMPLE_HEAD.length} columns`} trailing={<AdminButton hierarchy="ghost" size="md" onClick={() => setFile(null)}>Replace</AdminButton>} />
            ) : (
              <>
                <Dropzone title="Drop your file here, or click" hint="A .csv with one student per row" icon={<FileSpreadsheet className="size-[22px]" />} accept=".csv,text/csv" onFiles={(f) => setFile(f[0]?.name.toLowerCase().endsWith(".csv") ? f[0].name : SAMPLE_NAME)} />
                <p className="t-caption text-a-text-3">
                  Any file shows the same sample of {SAMPLE_ROWS.length} students.{" "}
                  <button type="button" onClick={() => setFile(SAMPLE_NAME)} className="rounded-a-xs text-a-text-accent outline-none hover:underline focus-visible:ring-2 focus-visible:ring-a-border-focus">Use the sample file</button>
                </p>
              </>
            ))}

          {mode === "emails" && (
            <AdminField label="E-mails" hint={emails.trim() ? [`${addresses.length} to invite`, typed.already ? `${typed.already} already ${typed.already === 1 ? "a student" : "students"}` : "", typed.invalid ? `${typed.invalid} not valid` : ""].filter(Boolean).join(" · ") : "Separate with a comma, a space or a new line"}>
              <textarea rows={6} value={emails} onChange={(e) => setEmails(e.target.value)} placeholder={"hugo@mail.fr\nines@gmail.com"} className={cn(adminControl, "resize-none py-2.5")} />
            </AdminField>
          )}

          {mode === "link" && (
            <div className="grid gap-2">
              <div className="flex gap-2">
                <input readOnly aria-label="Invite link" value={`https://${coach.slug}.traderhub.io/join/${coach.tiers[0]?.id ?? "free"}-x8k2`} className={cn(adminControl, "h-11 min-w-0 flex-1 truncate")} />
                <AdminButton hierarchy="secondary" size="xl" onClick={() => toast("Link copied")}>
                  <Link2 /> Copy
                </AdminButton>
              </div>
              <p className="t-caption text-a-text-2">Share it in Discord or on socials. People who join get the first tier, {coach.tiers[0]?.name}.</p>
            </div>
          )}
        </div>
      )}

      {step === 1 && csv && file && (
        <>
          <FileItem name={file} status="done" meta={`${SAMPLE_ROWS.length} students · ${SAMPLE_HEAD.length} columns`} trailing={<AdminButton hierarchy="ghost" size="md" onClick={() => (setFile(null), setStep(0))}>Replace</AdminButton>} />
          <p className="t-body-m text-a-text-2">We matched the columns. Check they&apos;re right.</p>
          {(noEmail || doubled) && (
            <Callout tone="warning">{noEmail ? "Pick which column is the e-mail. We need it to invite people." : `Two columns become “${doubled}”. Give each its own, or skip one.`}</Callout>
          )}
          <AdminTable minWidth={0}>
            <AdminTableHead>
              <AdminTh>Column in your file</AdminTh>
              <AdminTh width={166} className="max-sm:hidden">Example</AdminTh>
              <AdminTh width={190}>Becomes</AdminTh>
            </AdminTableHead>
            <tbody>
              {SAMPLE_HEAD.map((h, i) => (
                <AdminTr key={h}>
                  <AdminTd className="text-a-text">{h}</AdminTd>
                  <AdminTd className={cn("max-sm:hidden", map[i] === "Don't import" && "opacity-60")}>{SAMPLE_ROWS[0][i]}</AdminTd>
                  <AdminTd>
                    <AdminFilter className="w-full justify-between" ariaLabel={`${h} becomes`} value={map[i]} onValueChange={(v) => setMap((m) => m.map((x, j) => (j === i ? v : x)))} options={FIELDS.map((f) => ({ value: f, label: f === "Tier" ? `Tier · ${tierName}` : f }))} />
                  </AdminTd>
                </AdminTr>
              ))}
            </tbody>
          </AdminTable>
          <InviteToggle invite={invite} setInvite={setInvite} coachName={coach.coachName} />
        </>
      )}

      {step === 1 && !csv && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField label="Tier">
              {() => <AdminSelect ariaLabel="Tier" value={tier} onValueChange={setTier} options={sold.map((t) => ({ value: t.id, label: `${t.name} · ${t.price}` }))} />}
            </AdminField>
            <AdminField label="Group" optional>
              {() => <AdminSelect ariaLabel="Group" value={group} onValueChange={setGroup} options={[{ value: "", label: "No group" }, ...GROUPS.map((g) => ({ value: g.name, label: g.name }))]} />}
            </AdminField>
          </div>
          <InviteToggle invite={invite} setInvite={setInvite} coachName={coach.coachName} />
        </>
      )}

      {step === 2 && (
        <Callout tone="success" icon={<Check className="size-4" />}>
          {imported} {imported === 1 ? "student" : "students"} imported{csv ? "" : ` as ${tierName}${group ? ` in ${group}` : ""}`}. {invite ? "Their invite e-mails are on their way." : "They stay “Invited” until you send the e-mail."}
        </Callout>
      )}
    </AdminModal>
  )
}

function InviteToggle({ invite, setInvite, coachName }: { invite: boolean; setInvite: (v: boolean) => void; coachName: string }) {
  return (
    <label className="flex items-start gap-2.5 t-body-m text-a-text">
      <Checkbox checked={invite} onCheckedChange={(v) => setInvite(!!v)} className="mt-px" />
      <span className="grid gap-0.5">
        Send the invite e-mail now
        {!invite && <span className="t-caption text-a-text-2">From {coachName}. They stay “Invited” until you send it.</span>}
      </span>
    </label>
  )
}

/** "rafael.quintero@gmail.com" → "Rafael Quintero": a name to show until the student fills in their own. */
const nameFrom = (email: string) => email.split("@")[0]!.split(/[._-]+/).filter(Boolean).map((w) => w[0]!.toUpperCase() + w.slice(1)).join(" ")

/** An imported person is an Invited student: no activity yet, nothing paid, in the tier (and group) picked here. */
function toStudent(p: { name: string; email: string; group?: string }, tier: string, id: string): Student {
  const initials = p.name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("")
  return {
    id: `n${id}`, name: p.name, initials, email: p.email, tier, group: p.group, progress: 0, lastActive: "never", activeDays: 0, health: "amber", reason: "Invited today, hasn't joined",
    joined: "invited 12 Nov", paid: 0, broker: false, discord: false, country: "—", trades30: 0, rules: 0, notes: [], history: [{ when: "Today", text: "Imported and invited" }],
  }
}
