"use client"

import { useEffect, useState } from "react"
import { Download } from "@/components/icons"
import { toast } from "@/lib/toast"
import { useCoach } from "@/components/coach/coach-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { cn } from "@/lib/utils"
import { Field, useCommunityData } from "../kit"
import { AdminButton, AdminModal, Panel, PanelHeader, Tag } from "../ui"
import { SettingsPage, DataCard, Segmented, RowMenu } from "./settings-parts"

// ---------- ADM-50

export function Tax() {
  const { coach } = useCoach()
  const [vat, setVat] = useCommunityData<"included" | "added">(coach.slug, "vat-mode", "included")
  return (
    <SettingsPage title="Invoices and VAT" text="What appears on the invoices students get.">
      <Panel>
        <PanelHeader title="On your invoices" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Legal name">
            <Input defaultValue={`${coach.name} GmbH`} />
          </Field>
          <Field label="VAT number">
            <Input defaultValue="DE 312 456 789" />
          </Field>
        </div>
        <Field label="Address">
          <Input defaultValue="Bahnhofstrasse 1, 8001 Zürich" />
        </Field>
        <Field label="Invoice number starts at">
          <Input defaultValue="NT-2025-0001" />
        </Field>
      </Panel>
      <Panel>
        <PanelHeader title="VAT" />
        <Segmented label="VAT" value={vat} onChange={setVat} options={[["included", "Prices include VAT"], ["added", "VAT is added at checkout"]] as const} />
        <p className="t-caption text-a-text-2">We work out the right rate for each student&apos;s country.</p>
      </Panel>
    </SettingsPage>
  )
}

// ---------- ADM-51

type Member = { name: string; initials: string; email: string; role: "Owner" | "Coach" | "Moderator"; can: string; invited?: string }

const TEAM_V2: Member[] = [
  { name: "Kairo Fernandes", initials: "KF", email: "kairo@kairofx.trading", role: "Owner", can: "Everything" },
  { name: "Ana Ribeiro", initials: "AR", email: "ana@kairofx.trading", role: "Coach", can: "Content, Journal, Livestreams" },
  { name: "Leo Martins", initials: "LM", email: "leo@kairofx.trading", role: "Moderator", can: "Community, Journal" },
  { name: "Rui Costa", initials: "RC", email: "rui@gmail.com", role: "Moderator", can: "Moderator", invited: "sent 2 d ago" },
]

const ROLE_OPTIONS = [
  ["Coach", "Edits content, answers the journal, goes live"],
  ["Moderator", "Keeps the community and journal in order"],
] as const

const MATRIX = [
  ["Coach", "Edit", "Edit", "View", "—"],
  ["Moderator", "View", "Edit", "—", "—"],
]

export function Team() {
  const { coach } = useCoach()
  const [team, setTeam] = useCommunityData<Member[]>(coach.slug, "team-v2", TEAM_V2)
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"Coach" | "Moderator">("Moderator")
  // The header's "Invite to the team" button asks this page to open the dialog.
  useEffect(() => {
    const onInvite = () => setOpen(true)
    document.addEventListener("settings:invite", onInvite)
    return () => document.removeEventListener("settings:invite", onInvite)
  }, [])
  const send = () => {
    const name = email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    setTeam((t) => [...t, { name, initials: name.slice(0, 2).toUpperCase(), email, role, can: role, invited: "sent just now" }])
    setOpen(false)
    setEmail("")
    toast(`Invite sent to ${email}`)
  }
  return (
    <SettingsPage title="Team and roles" text={`People who help you run ${coach.name}.`}>
      <DataCard>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Person</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Can do</TableHead>
            <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {team.map((m) => (
            <TableRow key={m.email}>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <Avatar className="size-8">
                    <AvatarFallback className="text-xs">{m.initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid">
                    <span className="t-body-m">{m.name}</span>
                    <span className="t-caption text-a-text-2">{m.email}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {m.invited ? (
                  <Tag tone="warning">Invited</Tag>
                ) : m.role === "Owner" ? (
                  <Tag>Owner</Tag>
                ) : (
                  <Tag>{m.role}</Tag>
                )}
              </TableCell>
              <TableCell className="text-a-text-2">{m.invited ? `${m.can} · ${m.invited}` : m.can}</TableCell>
              <TableCell className="text-right">
                {m.role !== "Owner" && (
                  <RowMenu
                    label={`Options for ${m.name}`}
                    items={[
                      ...(m.invited ? [{ text: "Resend invite", onClick: () => toast(`Invite sent again to ${m.email}`) }] : []),
                      { text: m.role === "Coach" ? "Make moderator" : "Make coach", onClick: () => setTeam((t) => t.map((x) => (x.email === m.email ? { ...x, role: m.role === "Coach" ? "Moderator" : "Coach" } : x))) },
                      { text: "Remove", onClick: () => setTeam((t) => t.filter((x) => x.email !== m.email)) },
                    ]}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataCard>
      <Panel>
        <PanelHeader title="Roles" />
        <DataCard className="bg-a-field" rowHeight={45} scrollLabel="What each role can do">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Role</TableHead>
              {["Content", "Students", "Sales", "Settings"].map((h) => (
                <TableHead key={h} className="text-right">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {MATRIX.map(([r, ...cells]) => (
              <TableRow key={r}>
                <TableCell>{r}</TableCell>
                {cells.map((c, i) => (
                  <TableCell key={i} className="text-right text-a-text-2">
                    {c}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </DataCard>
      </Panel>
      <AdminModal open={open} onOpenChange={setOpen} title="Invite to the team" subtitle="They get an e-mail with a link to join." footer={<><AdminButton hierarchy="ghost" onClick={() => setOpen(false)}>
              Cancel
            </AdminButton>
            <AdminButton disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())} onClick={send}>
              Send invite
            </AdminButton></>}>
          
          <div className="grid gap-4">
            <Field label="E-mail">
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="rui@gmail.com" />
            </Field>
            <div role="radiogroup" aria-label="Role" className="grid gap-2">
              <span className="t-caption-medium">Role</span>
              {ROLE_OPTIONS.map(([r, text]) => (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={role === r}
                  onClick={() => setRole(r)}
                  className={cn("flex items-center gap-3 rounded-a-md border px-3 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-a-border-focus", role === r ? "border-[var(--admin-color-control-on)] bg-a-raised" : "border-a-border hover:bg-a-hover")}
                >
                  <span className={cn("grid size-4 shrink-0 place-items-center rounded-full border", role === r ? "border-a-accent-strong" : "border-a-border-strong")}>
                    {role === r && <span className="size-2 rounded-full bg-a-accent-strong" />}
                  </span>
                  <span className="grid">
                    <span className="t-body-m">{r}</span>
                    <span className="t-caption text-a-text-2">{text}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
          
        
</AdminModal>
    </SettingsPage>
  )
}

// ---------- ADM-52

const INVOICES = [
  ["November 2025", "€99.00"],
  ["October 2025", "€99.00"],
]

export function Plan() {
  return (
    <SettingsPage title="Your plan with us" text="What you pay Traderhub.">
      <Panel>
        <PanelHeader title="Plan" />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-0.5">
            <span className="t-heading-l">Pro</span>
            <span className="t-body-m text-a-text-2">€99 / month + 5% of sales · renews 1 Dec</span>
          </div>
          <AdminButton hierarchy="secondary" onClick={() => toast("Change plan", { description: "Upgrades start now; downgrades at the end of the month." })}>
            Change plan
          </AdminButton>
        </div>
        <div className="grid gap-4 pt-2 sm:grid-cols-3">
          {[["Students", "189 / 500"], ["Storage", "42 / 100 GB"], ["Team", "4 / 5"]].map(([l, v]) => (
            <div key={l} className="grid gap-1">
              <span className="t-micro text-a-text-3">{l}</span>
              <span className="t-heading-xl">{v}</span>
            </div>
          ))}
        </div>
      </Panel>
      <Panel className="gap-3">
        <PanelHeader title="Design packages" />
        <div className="flex items-center justify-between gap-3">
          <div className="grid">
            <span className="t-body-m">Pro template pack</span>
            <span className="t-caption text-a-text-2">3 extra templates for your site</span>
          </div>
          <Tag tone="success">Active</Tag>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="grid">
            <span className="t-body-m">Custom design</span>
            <span className="t-caption text-a-text-2">We design your site with you · one-time</span>
          </div>
          <AdminButton hierarchy="secondary" size="md" onClick={() => toast("Custom design requested", { description: "We'll book a short call to start." })}>
            Learn more
          </AdminButton>
        </div>
      </Panel>
      <DataCard rowHeight={53}>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Invoice from us</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-32"><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {INVOICES.map(([d, amount]) => (
            <TableRow key={d}>
              <TableCell>{d}</TableCell>
              <TableCell className="text-right text-a-text-2 tabular-nums">{amount}</TableCell>
              <TableCell>
                <Tag tone="success">Paid</Tag>
              </TableCell>
              <TableCell className="text-right">
                <AdminButton hierarchy="ghost" size="md" onClick={() => toast("Invoice downloaded")}>
                  <Download /> Download
                </AdminButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataCard>
    </SettingsPage>
  )
}

