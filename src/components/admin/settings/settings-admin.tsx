"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Plus, Store, Ticket, UserAdmin, Users, Wallet } from "@/components/icons"

import { useCoach } from "@/components/coach/coach-provider"








import { cn } from "@/lib/utils"
import { Page, PageHeader } from "../kit"
import { AdminButton } from "../ui"


import { General, Domain, Emails } from "./settings-business"
import { Legal } from "./settings-legal"
import { StudentOnboarding, FirstWeek } from "./settings-student"
import { Tax, Team, Plan } from "./settings-account"
/** Figma "Admin · 15 Settings": a menu of five groups (icon, mono label, pages) beside one page at a time. */
const GROUPS = [
  { label: "Your business", icon: Store, tabs: [["general", "General"], ["domain", "Web address"], ["email", "E-mails"], ["legal", "Legal pages"]] },
  { label: "Students", icon: Users, tabs: [["onboarding", "Onboarding questions"], ["firstweek", "Home in the first week"]] },
  { label: "Money", icon: Wallet, tabs: [["tax", "Invoices and VAT"]] },
  { label: "Team", icon: UserAdmin, tabs: [["team", "Team and roles"]] },
  { label: "Your plan", icon: Ticket, tabs: [["plan", "Plan and invoices"]] },
] as const

type TabId = (typeof GROUPS)[number]["tabs"][number][0]

/** ADM-45 to ADM-52. */
export function SettingsAdmin() {
  const initial = useSearchParams().get("tab")
  const pick = (v: string | null): TabId => ((GROUPS.flatMap((g) => g.tabs.map((t) => t[0])) as TabId[]).includes(v as TabId) ? (v as TabId) : "general")
  const [tab, setTab] = useState<TabId>(pick(initial))
  // Visited pages stay mounted: a link to another ?tab= (Getting started → Legal) must still switch the tab.
  const [seen, setSeen] = useState(initial)
  if (initial !== seen) {
    setSeen(initial)
    if (initial) setTab(pick(initial))
  }
  const { coach } = useCoach()
  return (
    <Page>
      <PageHeader
        title="Settings"
        text={`${coach.name} · saved as you type`}
        actions={
          tab === "team" ? (
            <AdminButton onClick={() => document.dispatchEvent(new CustomEvent("settings:invite"))}>
              <Plus /> Invite to the team
            </AdminButton>
          ) : undefined
        }
      />
      <div className="flex gap-6 max-md:flex-col">
        <SettingsNav value={tab} onChange={setTab} />
        <div className="min-w-0 flex-1">
          {tab === "general" && <General />}
          {tab === "domain" && <Domain />}
          {tab === "email" && <Emails />}
          {tab === "legal" && <Legal />}
          {tab === "onboarding" && <StudentOnboarding />}
          {tab === "firstweek" && <FirstWeek />}
          {tab === "tax" && <Tax />}
          {tab === "team" && <Team />}
          {tab === "plan" && <Plan />}
        </div>
      </div>
    </Page>
  )
}

/** Settings menu: group header (16px icon + mono label), 32px items, hairline between groups. The open page is a soft pill with an orange bar, like the sidebar. */
function SettingsNav({ value, onChange }: { value: TabId; onChange: (id: TabId) => void }) {
  return (
    <nav aria-label="Settings pages" className="flex shrink-0 flex-col md:w-[220px] max-md:flex-row max-md:gap-4 max-md:overflow-x-auto max-md:[scrollbar-width:none]">
      {GROUPS.map((g, i) => (
        <div key={g.label} className={cn("flex flex-col gap-0.5 max-md:flex-row max-md:items-center", i > 0 && "mt-3 border-t border-a-border-subtle pt-4 max-md:mt-0 max-md:border-t-0 max-md:pt-0")}>
          <div className="flex h-6 items-center gap-2 px-2 text-a-text-3 max-md:hidden">
            <g.icon className="size-4 text-a-icon" />
            <span className="t-micro">{g.label}</span>
          </div>
          {g.tabs.map(([id, label]) => {
            const active = id === value
            return (
              <button
                key={id}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => onChange(id)}
                className={cn(
                  "relative flex h-8 w-full shrink-0 items-center rounded-a-md border px-2.5 text-left t-body-m outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-a-border-focus max-md:w-auto max-md:whitespace-nowrap",
                  active ? "border-a-border bg-a-selected text-a-text after:absolute after:top-2 after:right-2 after:bottom-2 after:w-0.5 after:rounded-full after:bg-a-accent-strong" : "border-transparent text-a-text-nav hover:bg-a-hover hover:text-a-text"
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      ))}
    </nav>
  )
}

/** One settings page: heading, one plain sentence, then panels. */
