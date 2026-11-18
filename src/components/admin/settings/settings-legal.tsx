"use client"

import { useState } from "react"
import { Info } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { cn } from "@/lib/utils"
import { useCommunityData } from "../kit"
import { AdminButton, AdminDrawer, AdminField, adminControl } from "../ui"
import { useWizardCommunity } from "../setup-checklist"
import { account } from "@/lib/data/communities"
import { SettingsPage, DataCard } from "./settings-parts"

// ---------- ADM-48 · Legal pages (Getting started · Add your legal pages, Figma 1049:2788 to 1049:4189)

type LegalId = "imprint" | "privacy" | "terms" | "risk"
type Imprint = { name: string; address: string; email: string; vat?: string }
const NO_IMPRINT: Imprint = { name: "", address: "", email: "" }
const NO_TEXTS: Record<string, string> = {}
const NO_DATES: Record<string, string> = {}
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Our starting texts, filled in with the platform's name. The coach stays responsible for them. */
const TEMPLATE: Record<Exclude<LegalId, "imprint">, (name: string) => string> = {
  privacy: (n) => `${n} runs this platform. We collect your name, e-mail and payment details only to give you access to your courses and to bill you. We never sell your data. You can ask us to delete it at any time.`,
  terms: (n) => `These terms apply to every membership of ${n}. Your membership renews each period until you cancel. You can cancel at any time in your account; your access stays until the end of the period you paid for. Courses and materials are for your own use only.`,
  risk: (n) => `Trading futures, forex and CFDs carries a high level of risk. ${n} offers education only, not investment advice. Past results do not guarantee future results.`,
}
const LEGAL_PAGES: { id: LegalId; name: string; subtitle: string }[] = [
  { id: "imprint", name: "Imprint", subtitle: "Who runs this platform. Required by law in Germany." },
  { id: "privacy", name: "Privacy policy", subtitle: "Our template, filled in with your details" },
  { id: "terms", name: "Terms of service", subtitle: "Our template, filled in with your details" },
  { id: "risk", name: "Risk disclaimer", subtitle: "Our template, filled in with your details" },
]

export function Legal() {
  const { coach } = useCoach()
  // A platform made at sign-up starts with nothing set up; the demo platforms have their pages already.
  const fresh = !!useWizardCommunity(coach.slug)
  const [texts, setTexts] = useCommunityData<Record<string, string>>(coach.slug, "legal-v2", NO_TEXTS)
  const [imprint, setImprint] = useCommunityData<Imprint>(coach.slug, "legal-imprint", NO_IMPRINT)
  // The legal name given in Payouts, if any: the imprint starts from it (Flavio, 14/11).
  const [payouts] = useCommunityData<{ name?: string }>(coach.slug, "payouts-v2", {})
  const [dates, setDates] = useCommunityData<Record<string, string>>(coach.slug, "legal-dates", NO_DATES)
  const [sel, setSel] = useState<LegalId | null>(null)
  const isSet = (id: LegalId) => !fresh || (id === "imprint" ? !!imprint.name : texts[id] !== undefined)
  const all = LEGAL_PAGES.every((l) => isSet(l.id))
  const nextOpen = LEGAL_PAGES.find((l) => !isSet(l.id))?.id
  const source = (id: LegalId) => (!isSet(id) ? "Not set up" : id === "imprint" ? "Your text" : texts[id] !== undefined && texts[id] !== TEMPLATE[id](coach.name) && fresh ? "Our template · edited" : "Our template")
  const updated = (id: LegalId) => (!isSet(id) ? "—" : dates[id] ?? (fresh ? "Today" : "2 Oct"))

  // Saving one page leads to the next one not set up yet (imprint, then the three templates).
  const saved = (id: LegalId) => {
    setDates((d) => ({ ...d, [id]: "Today" }))
    const next = LEGAL_PAGES.find((l) => l.id !== id && !isSet(l.id))?.id
    setSel(fresh && next ? next : null)
  }

  return (
    <SettingsPage title="Legal pages" text="Linked in the footer of your site and at checkout.">
      <div data-tour="legal-table" data-complete={all || undefined} className="rounded-a-lg">
        <DataCard rowHeight={53}>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Page</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-16"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {LEGAL_PAGES.map((l) => (
              <TableRow key={l.id}>
                <TableCell>{l.name}</TableCell>
                <TableCell className="text-a-text-2">{source(l.id)}</TableCell>
                <TableCell className="text-a-text-2">{updated(l.id)}</TableCell>
                <TableCell className="text-right">
                  {/* One page at a time, in order (Figma 1049:2788): Set up on the next one, Edit on those done. */}
                  {isSet(l.id) ? (
                    <AdminButton hierarchy="ghost" size="md" onClick={() => setSel(l.id)}>
                      Edit
                    </AdminButton>
                  ) : (
                    l.id === nextOpen && (
                      <AdminButton hierarchy="secondary" size="md" data-tour={l.id === "imprint" ? "legal-imprint-setup" : "legal-next"} onClick={() => setSel(l.id)}>
                        Set up
                      </AdminButton>
                    )
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataCard>
      </div>
      <div className="flex items-center gap-2 rounded-a-md bg-a-subtle px-3 py-2.5 t-body-m">
        <Info className="size-4 shrink-0 text-a-icon" />
        Trading carries risk. The risk disclaimer is shown on every sales page and can&apos;t be turned off.
      </div>
      <LegalDrawer
        page={LEGAL_PAGES.find((l) => l.id === sel) ?? null}
        first={!!sel && !isSet(sel)}
        imprint={!fresh && !imprint.name ? { name: `${coach.org}`, address: "", email: "" } : imprint}
        legalName={payouts.name}
        text={sel && sel !== "imprint" ? texts[sel] ?? TEMPLATE[sel](coach.name) : ""}
        onClose={() => setSel(null)}
        onSaveImprint={(v) => (setImprint(v), saved("imprint"))}
        onSaveText={(id, v) => (setTexts((x) => ({ ...x, [id]: v })), saved(id))}
        template={sel && sel !== "imprint" ? TEMPLATE[sel](coach.name) : ""}
      />
    </SettingsPage>
  )
}

/** One legal page in a drawer: the imprint's fields, or a template's text (Figma 1049:3267, 1049:3728). */
export function LegalDrawer({ page, first, imprint, legalName, text, onClose, onSaveImprint, onSaveText, template }: { page: { id: LegalId; name: string; subtitle: string } | null; first: boolean; imprint: Imprint; legalName?: string; text: string; template: string; onClose: () => void; onSaveImprint: (v: Imprint) => void; onSaveText: (id: Exclude<LegalId, "imprint">, v: string) => void }) {
  const [form, setForm] = useState<Imprint>(imprint)
  const [body, setBody] = useState(text)
  const [key, setKey] = useState<string | null>(null)
  const [tried, setTried] = useState(false)
  // Open on what was saved (derived state, no effect).
  if ((page?.id ?? null) !== key) {
    setKey(page?.id ?? null)
    // A blank imprint starts from what we know: the legal name from Payouts (or the sign-up name) and the sign-up e-mail.
    const me = page ? account() : null
    setForm({ ...imprint, name: imprint.name || legalName || me?.name || "", email: imprint.email || me?.email || "" })
    setBody(text)
    setTried(false)
  }
  const errors = { name: form.name.trim().length < 2, address: form.address.trim().length < 6, email: !EMAIL.test(form.email.trim()) }
  const save = () => {
    if (!page) return
    setTried(true)
    if (page.id === "imprint") {
      if (errors.name || errors.address || errors.email) return
      onSaveImprint({ name: form.name.trim(), address: form.address.trim(), email: form.email.trim(), vat: form.vat?.trim() || undefined })
    } else if (body.trim()) onSaveText(page.id, body.trim())
  }
  const area = "w-full rounded-a-md border border-a-border-subtle bg-a-field px-3 py-3 t-body-l text-a-text outline-none placeholder:text-a-text-3 transition-colors duration-300 hover:border-a-border-strong focus-visible:border-a-border-focus resize-y"
  return (
    <AdminDrawer
      open={!!page}
      onOpenChange={(o) => !o && onClose()}
      title={page?.name}
      subtitle={page?.subtitle}
      bodyClassName="gap-5"
      footer={
        <>
          {page && page.id !== "imprint" && !first && (
            <AdminButton hierarchy="ghost" className="mr-auto" disabled={body === template} onClick={() => setBody(template)}>
              Back to our template
            </AdminButton>
          )}
          <AdminButton hierarchy="ghost" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton onClick={save}>{page?.id !== "imprint" && first ? "Use this text" : "Save"}</AdminButton>
        </>
      }
    >
      {page?.id === "imprint" && (
        <div data-tour="legal-imprint" className="flex flex-col gap-5">
          <AdminField label="Name or company" error={tried && errors.name ? "Type your legal name or your company’s name." : undefined}>
            {(p) => <input {...p} autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your legal name" className={cn(adminControl, "h-11")} />}
          </AdminField>
          <AdminField label="Address" error={tried && errors.address ? "Add the full address: street, postcode and city." : undefined}>
            {(p) => <textarea {...p} rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street and number, postcode, city" className={area} />}
          </AdminField>
          <AdminField label="E-mail" error={tried && errors.email ? "Check the e-mail address." : undefined}>
            {(p) => <input {...p} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="An e-mail students can reach you at" className={cn(adminControl, "h-11")} />}
          </AdminField>
          <AdminField label="VAT ID" optional hint="Only if you have one">
            {(p) => <input {...p} value={form.vat ?? ""} onChange={(e) => setForm({ ...form, vat: e.target.value.toUpperCase() })} placeholder="DE123456789" className={cn(adminControl, "h-11")} />}
          </AdminField>
        </div>
      )}
      {page && page.id !== "imprint" && (
        <div data-tour="legal-template" className="flex flex-col gap-1.5">
          <AdminField label="Text" hint="Change anything that doesn’t fit your business. Have a lawyer check it if you can.">
            {(p) => <textarea {...p} rows={8} value={body} onChange={(e) => setBody(e.target.value)} className={area} />}
          </AdminField>
        </div>
      )}
    </AdminDrawer>
  )
}

