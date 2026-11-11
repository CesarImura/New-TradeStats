"use client"

import { useEffect, useRef, useState } from "react"
import { MoreHorizontal, Plus } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { GROUP_RULES, fmtDate, isFreeTier, saveAccess, saveGroups, setPreviewAs, useAccess, useGroups, useTiers, type Group, type GroupRule } from "@/lib/data/access"
import { useCatalog } from "@/lib/data/learning"
import { cn } from "@/lib/utils"
import { AdminButton, AdminDrawer, AdminField, AdminFilter, AdminTable, AdminTableHead, AdminTd, AdminTh, AdminTr, EmptyState, Tag, adminControl } from "../ui"

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
/** "2026-12-01" → "Mon 1 Dec" */
const startLabel = (iso: string) => {
  const d = new Date(`${iso}T12:00:00Z`)
  return Number.isNaN(d.getTime()) ? iso : `${DAYS[d.getUTCDay()]} ${fmtDate(iso, false)}`
}

export function NewGroupButton({ onClick }: { onClick: () => void }) {
  return (
    <AdminButton onClick={onClick}>
      <Plus /> New group
    </AdminButton>
  )
}

/** Sales · 04 Groups (Figma 535:7989): cohorts in a table; each opens in a drawer. */
export function Groups({ newSignal }: { newSignal: number }) {
  const { coach } = useCoach()
  const groups = useGroups(coach)
  const tiers = useTiers(coach)
  const [open, setOpen] = useState<Group | null>(null)
  const tierNames = (g: Group) => g.tiers.map((id) => tiers.find((t) => t.id === id && !isFreeTier(t))?.name).filter(Boolean).join(", ") || "—"

  // "New group" lives in the page header.
  const seen = useRef(newSignal)
  useEffect(() => {
    if (newSignal === seen.current) return
    seen.current = newSignal
    setOpen({ id: `g${Date.now()}`, name: "December cohort", start: "2026-12-01", end: "2027-02-18", seats: 30, members: 0, waiting: 0, tiers: tiers.filter((t) => !isFreeTier(t)).slice(0, 2).map((t) => t.id), waitlist: true, channel: true, ranking: coach.modules.ranking })
  }, [newSignal, tiers, coach.modules.ranking])

  return (
    <div className="flex flex-col gap-4">
      {groups.length === 0 ? (
        <EmptyState title="No groups yet" description="A group is a cohort that starts together, with its own seats." />
      ) : (
        <AdminTable minWidth={900}>
          <AdminTableHead>
            <AdminTh>Group</AdminTh>
            <AdminTh width={170}>Tier</AdminTh>
            <AdminTh width={92} align="end">Members</AdminTh>
            <AdminTh width={92} align="end">Seats</AdminTh>
            <AdminTh width={128}>Starts</AdminTh>
            <AdminTh width={240}>Extras</AdminTh>
            <AdminTh width={64} />
          </AdminTableHead>
          <tbody>
            {groups.map((g) => (
              <AdminTr key={g.id} onClick={() => setOpen(g)}>
                <AdminTd>
                  <div className="grid min-w-0 gap-0.5">
                    <button type="button" onClick={(e) => (e.stopPropagation(), setOpen(g))} className="w-fit max-w-full truncate rounded-a-xs text-left t-body-m-medium text-a-text outline-none focus-visible:ring-2 focus-visible:ring-a-border-focus">{g.name}</button>
                    <span className="truncate t-caption text-a-text-2">{g.waiting > 0 ? `${g.waiting} on the waiting list` : g.description ?? `${fmtDate(g.start)} – ${fmtDate(g.end)}`}</span>
                  </div>
                </AdminTd>
                <AdminTd className="truncate">{tierNames(g)}</AdminTd>
                <AdminTd align="end">{g.members}</AdminTd>
                <AdminTd align="end">{g.seats > 0 ? g.seats : "No limit"}</AdminTd>
                <AdminTd>{startLabel(g.start)}</AdminTd>
                <AdminTd>
                  <div className="flex flex-wrap gap-1.5">
                    {g.channel && <Tag>Own channel</Tag>}
                    {g.ranking && <Tag>Own ranking</Tag>}
                    {!g.channel && !g.ranking && "—"}
                  </div>
                </AdminTd>
                <AdminTd align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<AdminButton aria-label={`Actions for ${g.name}`} hierarchy="ghost" size="md" iconOnly />}>
                      <MoreHorizontal />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setOpen(g)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => (setPreviewAs(coach.slug, { kind: "group", id: g.id, label: g.name }), window.open(`/c/${coach.slug}/courses`, "_blank"))}>Preview as this group</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </AdminTd>
              </AdminTr>
            ))}
          </tbody>
        </AdminTable>
      )}
      <GroupEditor group={open} isNew={!!open && !groups.some((g) => g.id === open.id)} onClose={() => setOpen(null)} />
    </div>
  )
}

function GroupEditor({ group, isNew, onClose }: { group: Group | null; isNew: boolean; onClose: () => void }) {
  const { coach } = useCoach()
  const tiers = useTiers(coach).filter((t) => !isFreeTier(t))
  const [g, setG] = useState<Group | null>(group)
  const [key, setKey] = useState(group?.id)
  if (group?.id !== key) {
    setKey(group?.id)
    setG(group)
  }
  const set = (p: Partial<Group>) => setG((v) => (v ? { ...v, ...p } : v))

  return (
    <AdminDrawer
      open={!!group}
      onOpenChange={(o) => !o && onClose()}
      title={g?.name || "Group"}
      subtitle={isNew ? "A new cohort. Students join it at checkout or you add them." : `${g?.members ?? 0} members.`}
      bodyClassName="gap-5"
      footer={
        <>
          <AdminButton hierarchy="ghost" onClick={onClose}>Cancel</AdminButton>
          <AdminButton
            disabled={!g?.name?.trim() || !g.tiers.length}
            onClick={() => {
              if (!g) return
              saveGroups(coach, (list) => (isNew ? [...list, g] : list.map((x) => (x.id === g.id ? g : x))))
              toast(isNew ? `${g.name} created` : `${g.name} saved`)
              onClose()
            }}>
            {isNew ? "Create group" : "Save group"}
          </AdminButton>
        </>
      }>
      {g && (
        <>
          <AdminField label="Name"><input value={g.name} onChange={(e) => set({ name: e.target.value })} className={cn(adminControl, "h-11")} /></AdminField>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Starts"><input type="date" value={g.start} onChange={(e) => set({ start: e.target.value })} className={cn(adminControl, "h-11")} /></AdminField>
            <AdminField label="Ends"><input type="date" value={g.end} onChange={(e) => set({ end: e.target.value })} className={cn(adminControl, "h-11")} /></AdminField>
          </div>
          <AdminField label="Seats" hint={g.members ? `${g.members} taken · 0 means no limit` : "0 means no limit"}>
            <input type="number" min={0} value={g.seats} onChange={(e) => set({ seats: Math.max(0, Number(e.target.value) || 0) })} className={cn(adminControl, "h-11 w-32 tabular-nums")} />
          </AdminField>
          <div className="grid gap-2">
            <span className="t-caption text-a-text">Who can join</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {tiers.map((t) => (
                <label key={t.id} className={cn("flex items-center gap-2.5 rounded-a-md border p-2.5 t-body-m", g.tiers.includes(t.id) ? "border-a-border-active bg-a-raised" : "border-a-border")}>
                  <Checkbox checked={g.tiers.includes(t.id)} onCheckedChange={(v) => set({ tiers: v ? [...g.tiers, t.id] : g.tiers.filter((x) => x !== t.id) })} />
                  {t.name}
                </label>
              ))}
            </div>
          </div>
          <span className="h-px bg-a-border" aria-hidden />
          <div className="flex flex-col gap-3.5">
            {([
              ["Waiting list when full", "People leave their e-mail and hear first when a seat opens", g.waitlist, (v: boolean) => set({ waitlist: v })],
              ["Own channel", "A Discord channel only for this group", g.channel, (v: boolean) => set({ channel: v })],
              ["Own ranking", "Members compete within the group", g.ranking, (v: boolean) => set({ ranking: v })],
            ] as const).map(([label, text, on, fn]) => (
              <label key={label} className="flex items-center justify-between gap-4">
                <span className="grid"><span className="t-body-m text-a-text">{label}</span><span className="t-caption text-a-text-2">{text}</span></span>
                <Switch checked={on} onCheckedChange={fn} />
              </label>
            ))}
          </div>
          {!isNew && <CourseRules group={g} />}
        </>
      )}
    </AdminDrawer>
  )
}

/** When each course opens for the members of this group: with their tier, on the start date, or some days after. Saved straight away. */
function CourseRules({ group }: { group: Group }) {
  const { coach } = useCoach()
  const courses = useCatalog(coach).courses.filter((c) => c.status !== "archived")
  const access = useAccess(coach.slug)
  if (courses.length === 0) return null
  return (
    <div className="grid gap-2">
      <span className="t-caption text-a-text">When courses open</span>
      <ul className="grid gap-2">
        {courses.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3">
            <span className="min-w-0 flex-1 truncate t-body-m text-a-text">{c.title}</span>
            <AdminFilter ariaLabel={`${c.title} opens`} value={access.groups[`${c.id}/${group.id}`] ?? "tier"} onValueChange={(v) => saveAccess(coach.slug, (a) => ({ ...a, groups: { ...a.groups, [`${c.id}/${group.id}`]: v as GroupRule } }))} options={GROUP_RULES.map((r) => ({ value: r.value, label: r.label }))} className="w-52 justify-between" />
          </li>
        ))}
      </ul>
      <p className="t-caption text-a-text-3">Saved straight away. “Same as their tier” follows the Access tab.</p>
    </div>
  )
}
