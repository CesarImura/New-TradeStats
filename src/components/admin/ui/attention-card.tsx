"use client"

import { useState } from "react"
import { ArrowRight } from "@/components/icons"
import { cn } from "@/lib/utils"
import { AdminAvatar } from "./avatar"
import { AdminButton } from "./button"
import { EmptyState } from "./empty-state"
import { AdminDrawer } from "./modal"
import { Panel } from "./panel"
import { Tag } from "./tag"
import { AdminUnderlineTabs } from "./underline-tabs"

/**
 * Admin / Attention card and drawer (Figma Overview · 01 "Needs you today" and Sales · 01 "Payment alerts", Overview 01h and Sales 01c for the drawer).
 * One pattern, two cards: the Overview card lists what needs the coach across the whole Admin (`NeedsYouToday`), the Sales card only payments
 * (`PaymentAlerts`). Both show the few most urgent rows with one action each; "View all" opens the drawer with everything.
 */
export type AttentionTone = "danger" | "warning"
/** What stands at the left of a row: a person (initials, with the urgency dot) or any 32 px element (an icon tile). */
export type AttentionLead = { initials: string; tone?: AttentionTone } | { node: React.ReactNode }

export type AttentionRow = {
  id: string
  lead: AttentionLead
  name: string
  reason: string
  /** The row's one action: an `AdminButton`; the card gives it a fixed width so every action lines up. */
  action: React.ReactNode
}

/** `dot` is the urgency dot on the avatar: the card shows it, the drawer does not (its row already has the tag; Figma Sales 01c, Overview 01h). */
const Lead = ({ lead, dot = true }: { lead: AttentionLead; dot?: boolean }) => ("node" in lead ? <>{lead.node}</> : <AdminAvatar initials={lead.initials} status={dot ? lead.tone : undefined} />)

/** The card: title with the count, "View all →", and up to `max` rows. */
export function AttentionCard({ title, count, onViewAll, rows, empty, max = 4, fill = false, className }: { title: string; count?: number; onViewAll?: () => void; rows: AttentionRow[]; empty: string; max?: number; /** Rows share the card's height (the Overview card sits next to a taller one). */ fill?: boolean; className?: string }) {
  return (
    <Panel className={cn("gap-0 overflow-hidden p-0", className)}>
      <header className="flex min-h-[49px] items-center justify-between gap-2 px-5 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate t-heading-s text-a-text">{title}</h2>
          {count ? <Tag>{count}</Tag> : null}
        </div>
        {onViewAll && rows.length > 0 && (
          <AdminButton hierarchy="ghost" size="md" onClick={onViewAll} className="-mr-2.5">
            View all <ArrowRight />
          </AdminButton>
        )}
      </header>
      {rows.length === 0 ? (
        <EmptyState compact title={empty} className="m-5 mt-0 py-8" />
      ) : (
        <ul className={cn("flex flex-col", fill && "flex-1")}>
          {rows.slice(0, max).map((r) => (
            <li key={r.id} className={cn("flex items-center gap-3 border-t border-a-border px-5 py-3", fill && "flex-1")}>
              <Lead lead={r.lead} />
              <div className="flex min-w-0 flex-1 flex-col t-body-m">
                <span className="truncate text-a-text">{r.name}</span>
                <span className="truncate text-a-text-2">{r.reason}</span>
              </div>
              <div className="w-[106px] shrink-0 [&>*]:w-full">{r.action}</div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

export type AttentionItem = {
  id: string
  /** The tab it belongs to (besides "All"). */
  tab: string
  lead: AttentionLead
  name: string
  sub: string
  tag?: { label: string; tone: "danger" | "warning" | "neutral" }
  detail: string
  actions: { label: string; onClick: () => void }[]
}

/** The drawer: every item, urgent first, with tabs by kind. The list scrolls inside the drawer. */
export function AttentionDrawer({ open, onOpenChange, title, subtitle, tabs, items }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; subtitle: string; tabs: { id: string; label: string }[]; items: AttentionItem[] }) {
  const [tab, setTab] = useState("all")
  const shown = tab === "all" ? items : items.filter((i) => i.tab === tab)
  const all = [{ id: "all", label: "All" }, ...tabs].map((t) => ({ id: t.id, label: t.label, count: t.id === "all" ? items.length : items.filter((i) => i.tab === t.id).length }))
  return (
    <AdminDrawer open={open} onOpenChange={onOpenChange} title={title} subtitle={subtitle} width={520}>
      <AdminUnderlineTabs label={`${title} sections`} value={tab} onChange={setTab} tabs={all} />
      {shown.length === 0 ? (
        <EmptyState compact title="Nothing here." className="py-8" />
      ) : (
        <ul className="flex flex-col gap-3">
          {shown.map((i) => (
            <li key={i.id} className="flex flex-col gap-3 rounded-a-md border border-a-border p-4">
              <div className="flex items-center gap-3">
                <Lead lead={i.lead} dot={!i.tag} />
                <div className="flex min-w-0 flex-1 flex-col t-body-m">
                  <span className="truncate text-a-text">{i.name}</span>
                  <span className="truncate text-a-text-2">{i.sub}</span>
                </div>
                {i.tag && <Tag tone={i.tag.tone}>{i.tag.label}</Tag>}
              </div>
              <p className="t-caption text-a-text-2">{i.detail}</p>
              <div className="flex flex-wrap gap-2">
                {i.actions.map((a) => (
                  <AdminButton key={a.label} hierarchy="secondary" size="md" onClick={a.onClick}>{a.label}</AdminButton>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminDrawer>
  )
}
