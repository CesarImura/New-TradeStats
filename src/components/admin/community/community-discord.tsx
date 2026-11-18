"use client"

import { Check, LayoutGrid } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Switch } from "@/components/ui/switch"
import { AdminButton, AdminFilter, Callout, EmptyState, Panel } from "../ui"
import { DiscordSetup, SERVER_ROLES, BOT_POSTS } from "./community-parts"

/* ---------- 04 and 05 Discord ---------- */

export function DiscordTab({ d, setD }: { d: DiscordSetup; setD: (n: DiscordSetup | ((c: DiscordSetup) => DiscordSetup)) => void }) {
  const { coach } = useCoach()
  if (!d.connected) {
    return (
      <EmptyState
        icon={LayoutGrid}
        title="Connect your Discord server"
        description="Students get the right role for their tier, and our bot posts what's new. Takes about 2 minutes."
        className="py-12"
        actions={<AdminButton onClick={() => (setD((x) => ({ ...x, connected: true })), toast("Discord connected", { description: "Roles are checked now." }))}>Connect Discord</AdminButton>}
      />
    )
  }
  return (
    <>
      <Callout tone="success" icon={<Check className="size-4" />} action={<AdminButton hierarchy="secondary" size="md" onClick={() => toast("Roles checked", { description: "Every member has the role of their tier." })}>Review</AdminButton>}>
        Discord connected · {coach.org} Traders · Roles checked 2 min ago
      </Callout>
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,572fr)_minmax(0,612fr)]">
        <Panel className="gap-0 overflow-hidden p-0">
          <div className="grid gap-1 px-5 py-4">
            <h2 className="t-heading-s text-a-text">Role for each tier</h2>
            <p className="t-caption text-a-text-2">Given when someone joins, removed when they cancel.</p>
          </div>
          {coach.tiers.map((t) => (
            <div key={t.id} className="flex h-[52px] items-center justify-between gap-3 border-t border-a-border px-5 t-body-m text-a-text">
              <span className="min-w-0 truncate">{t.name}</span>
              <AdminFilter ariaLabel={`Role for ${t.name}`} value={d.roles[t.id] ?? "No role"} onValueChange={(v) => setD((x) => ({ ...x, roles: { ...x.roles, [t.id]: v } }))} options={[...new Set([d.roles[t.id] ?? "No role", ...SERVER_ROLES])].map((r) => ({ value: r, label: r }))} />
            </div>
          ))}
        </Panel>
        <Panel className="gap-3">
          <div className="grid gap-0.5">
            <h2 className="t-heading-s text-a-text">Our bot posts in Discord</h2>
            <p className="t-caption text-a-text-2">So your server knows what&apos;s new on the platform.</p>
          </div>
          <div className="flex flex-col gap-3">
            {BOT_POSTS.map(([id, label, channel]) => (
              <label key={id} className="flex items-center gap-2.5 t-body-m text-a-text">
                <Switch checked={!!d.posts[id]} onCheckedChange={(v) => setD((x) => ({ ...x, posts: { ...x.posts, [id]: v } }))} />
                {label}
                <span aria-hidden className="h-px min-w-px flex-1" />
                <span className="t-caption text-a-text-3">{channel}</span>
              </label>
            ))}
          </div>
          <hr className="m-0 h-px border-0 bg-a-border-subtle" />
          <label className="flex items-center justify-between gap-6">
            <span className="grid gap-0.5">
              <span className="t-body-m text-a-text">Remove the role when someone cancels</span>
              <span className="t-caption text-a-text-2">At the end of their paid period</span>
            </span>
            <Switch checked={d.removeOnCancel} onCheckedChange={(v) => setD((x) => ({ ...x, removeOnCancel: v }))} />
          </label>
        </Panel>
      </div>
    </>
  )
}


export function DiscordMark({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M19.3 5.3A16.6 16.6 0 0 0 15.2 4l-.5 1a15.4 15.4 0 0 0-5.4 0l-.5-1a16.5 16.5 0 0 0-4.1 1.3C2.1 9.2 1.4 13 1.7 16.7a16.7 16.7 0 0 0 5 2.6l1.1-1.7c-.6-.2-1.2-.5-1.7-.9l.4-.3a11.9 11.9 0 0 0 11 0l.4.3c-.5.4-1.1.7-1.7.9l1.1 1.7a16.6 16.6 0 0 0 5-2.6c.4-4.3-.7-8-3-11.4ZM8.7 14.4c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm6.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z" />
    </svg>
  )
}

