"use client"

import { useCoach } from "@/components/coach/coach-provider"
import { Lock } from "@/components/icons"
import { Switch } from "@/components/ui/switch"
import { DEFAULT_NOTICE_PREFS, NOTICE_KINDS, NOTICE_PREFS_KEY, REQUIRED_NOTICES, emailOn, normalizePrefs, panelOn, type NoticeKind, type NoticePrefs } from "@/lib/data/admin-notifications"
import { useCommunityData } from "../kit"
import { Panel, PanelHeader, Tag } from "../ui"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { DataCard, SettingsPage } from "./settings-parts"

/**
 * Settings › Your business › Notifications, in four blocks (Figma Settings · 03b Notifications):
 * Always on (read-only), Activity (bell and e-mail per alert), Daily summary, News from Traderhub.
 * Saved as you type, like every other page here. The bell panel reads the same data (lib/data/admin-notifications).
 */
export function Notifications() {
  const { coach } = useCoach()
  const [stored, setPrefs] = useCommunityData<NoticePrefs>(coach.slug, NOTICE_PREFS_KEY, DEFAULT_NOTICE_PREFS)
  const prefs = normalizePrefs(stored)
  const set = (kind: NoticeKind, channel: "panel" | "email", on: boolean) =>
    setPrefs((p) => { const n = normalizePrefs(p); return { ...n, kinds: { ...n.kinds, [kind]: { ...n.kinds[kind], [channel]: on } } } })

  return (
    <SettingsPage title="Notifications" text="What we tell you about, in the bell and by e-mail.">
      <section aria-labelledby="notif-required" className="flex flex-col gap-2">
        <Heading id="notif-required" title="Always on" text="We always tell you about these. They are about your account, your plan and your payouts." />
        <DataCard rowHeight={53}>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Alert</TableHead>
              <TableHead className="max-sm:hidden">When</TableHead>
              <TableHead colSpan={2} className="w-56"><span className="sr-only">Status</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {REQUIRED_NOTICES.map((n) => (
              <TableRow key={n.id}>
                <TableCell><Name name={n.name} when={n.when} /></TableCell>
                <TableCell className="text-a-text-2 max-sm:hidden">{n.when}</TableCell>
                <TableCell colSpan={2}>
                  <span className="inline-flex items-center gap-1.5 t-caption text-a-text-2">
                    <Lock aria-hidden className="size-3.5 text-a-icon" />
                    Always on
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataCard>
      </section>

      <section aria-labelledby="notif-activity" className="flex flex-col gap-2">
        <Heading id="notif-activity" title="Activity" text="E-mails say that something happened, not who or how much. Open the bell for the details." />
        <DataCard rowHeight={53}>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Alert</TableHead>
              <TableHead className="max-sm:hidden">When</TableHead>
              <TableHead className="w-28">In the bell</TableHead>
              <TableHead className="w-28">By e-mail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {NOTICE_KINDS.map((k) => (
              <TableRow key={k.id}>
                <TableCell><Name name={k.name} when={k.when} /></TableCell>
                <TableCell className="text-a-text-2 max-sm:hidden">{k.when}</TableCell>
                <TableCell>
                  <Switch checked={panelOn(prefs, k.id)} onCheckedChange={(v) => set(k.id, "panel", v)} aria-label={`${k.name} in the bell`} />
                </TableCell>
                <TableCell>
                  <Switch checked={emailOn(prefs, k.id)} onCheckedChange={(v) => set(k.id, "email", v)} aria-label={`${k.name} by e-mail`} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataCard>
      </section>

      <Panel>
        <PanelHeader
          className="flex-nowrap gap-x-6"
          title="Daily summary"
          description="One e-mail each morning with your sales, new students and what needs you. Sent only on days something happened."
          actions={<Switch checked={prefs.daily} onCheckedChange={(v) => setPrefs((p) => ({ ...normalizePrefs(p), daily: v }))} aria-label="Daily summary e-mail" />}
        />
      </Panel>

      <Panel>
        <PanelHeader
          className="flex-nowrap gap-x-6"
          title="News from Traderhub"
          description="Tips and new features, now and then. Off until you turn it on, and every e-mail has a link to stop it."
          actions={
            <>
              {prefs.news && <Tag tone="success" className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200">On</Tag>}
              <Switch checked={prefs.news} onCheckedChange={(v) => setPrefs((p) => ({ ...normalizePrefs(p), news: v }))} aria-label="News from Traderhub by e-mail" />
            </>
          }
        />
      </Panel>
    </SettingsPage>
  )
}

/** The name, and on a phone the "when" line under it (the When column is hidden there). */
function Name({ name, when }: { name: string; when: string }) {
  return (
    <span className="flex flex-col">
      {name}
      <span className="t-caption text-a-text-2 sm:hidden">{when}</span>
    </span>
  )
}

function Heading({ id, title, text }: { id: string; title: string; text: string }) {
  return (
    <header className="flex flex-col gap-0.5">
      <h3 id={id} className="t-heading-s text-a-text">{title}</h3>
      <p className="t-body-m text-a-text-2">{text}</p>
    </header>
  )
}
