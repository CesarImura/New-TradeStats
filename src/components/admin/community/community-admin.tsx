"use client"

import { useState } from "react"
import { Plus } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { DEFAULT_RULES, DEFAULT_SPACES, type Space } from "@/lib/data/community"
import { ANNOUNCEMENTS } from "@/lib/data/people"
import { PageHeader, useCommunityData } from "../kit"
import { SetupTip, useWizardCommunity } from "../setup-checklist"
import { AdminButton, AdminTabs } from "../ui"
import { Announcement, DEFAULT_DISCORD, NO_DISCORD, NO_ANNOUNCEMENTS } from "./community-parts"
import { AnnouncementsTab, AnnouncementDrawer } from "./community-announcements"
import { SpacesTab, SpaceDialog } from "./community-spaces"
import { DiscordTab, DiscordMark } from "./community-discord"
import { ModerationTab } from "./community-moderation"
import { TabPanel } from "@/components/admin/ui"

export { DiscordMark }
export type { Announcement }

const TABS = [
  { id: "announcements", label: "Announcements" },
  { id: "spaces", label: "Spaces & rules" },
  { id: "discord", label: "Discord" },
  { id: "moderation", label: "Moderation" },
] as const
type Tab = (typeof TABS)[number]["id"]

/** Community (Figma 534:7152, 01 to 05): announcements, spaces and rules, and the Discord connection. */
export function CommunityAdmin() {
  const { coach } = useCoach()
  const [list, setList] = useCommunityData<Announcement[]>(coach.slug, "announcements", ANNOUNCEMENTS, NO_ANNOUNCEMENTS)
  const [spaces, setSpaces] = useCommunityData<Space[]>(coach.slug, "spaces", DEFAULT_SPACES)
  const [rules, setRules] = useCommunityData<string[]>(coach.slug, "rules", DEFAULT_RULES)
  const [d, setD] = useCommunityData(coach.slug, "discord", useWizardCommunity(coach.slug) ? NO_DISCORD : DEFAULT_DISCORD)
  const [tab, setTab] = useState<Tab>("announcements")
  const [composing, setComposing] = useState(false)
  const [editing, setEditing] = useState<Space | "new" | null>(null)

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4">
      <PageHeader
        title="Community"
        text="Announcements, spaces, Discord and moderation"
        actions={
          tab === "spaces" ? (
            <AdminButton onClick={() => setEditing("new")}><Plus /> New space</AdminButton>
          ) : tab === "moderation" ? null : (
            <AdminButton hierarchy={tab === "discord" && !d.connected ? "secondary" : "primary"} onClick={() => setComposing(true)}><Plus /> New announcement</AdminButton>
          )
        }
      />
      <SetupTip task="discord" />
      <AdminTabs label="Community" tabs={TABS} value={tab} onChange={setTab} className="self-start" />

      <TabPanel value={tab} order={TABS.map((t) => t.id)}>
      {tab === "announcements" && <AnnouncementsTab list={list} setList={setList} d={d} setD={setD} />}
      {tab === "spaces" && <SpacesTab spaces={spaces} setSpaces={setSpaces} rules={rules} setRules={setRules} onEdit={setEditing} />}
      {tab === "discord" && <DiscordTab d={d} setD={setD} />}
      {tab === "moderation" && <ModerationTab slug={coach.slug} />}
      </TabPanel>

      <AnnouncementDrawer open={composing} onOpenChange={setComposing} onPost={(a) => setList((l) => [{ ...a, space: spaces[0]?.id }, ...l])} />
      <SpaceDialog space={editing} onClose={() => setEditing(null)} onSave={(s) => setSpaces((l) => (l.some((x) => x.id === s.id) ? l.map((x) => (x.id === s.id ? s : x)) : [...l, s]))} />
    </div>
  )
}

