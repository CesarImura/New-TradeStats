"use client"

import { useState } from "react"
import { CalendarRange, Eye, Plus, Users } from "lucide-react"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { fmtDate, isFull, saveGroups, setPreviewAs, useGroups, useTiers, type Group } from "@/lib/data/access"
import { cn } from "@/lib/utils"
import { Field, SettingRow } from "../kit"

/** ADM-31: cohorts with start, end, seats, waiting list and which tiers can join. */
export function Groups() {
  const { coach } = useCoach()
  const groups = useGroups(coach)
  const tiers = useTiers(coach)
  const [open, setOpen] = useState<Group | null>(null)

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Cohorts that start together. What a group unlocks can start on its start date, then week by week.</p>
        <Button
          variant="outline"
          onClick={() =>
            setOpen({
              id: `g${Date.now()}`,
              name: "December cohort",
              start: "2026-12-01",
              end: "2027-02-18",
              seats: 30,
              members: 0,
              waiting: 0,
              tiers: tiers.slice(0, 2).map((t) => t.id),
              waitlist: true,
              channel: true,
              ranking: coach.modules.ranking,
            })
          }
        >
          <Plus /> New group
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((g) => (
          <Card key={g.id} size="sm" className="cursor-pointer transition-colors hover:ring-foreground/20" onClick={() => setOpen(g)}>
            <CardHeader>
              <CardTitle>{g.name}</CardTitle>
              <CardDescription className="flex items-center gap-1.5">
                <CalendarRange className="size-3.5" /> {fmtDate(g.start)} – {fmtDate(g.end)}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="size-3.5" /> Seats
                </span>
                <span className="tabular-nums">
                  {g.members} of {g.seats}
                </span>
              </div>
              <Progress value={(g.members / Math.max(1, g.seats)) * 100} />
              {isFull(g) ? (
                <span className="text-xs text-amber-400">Full{g.waitlist ? ` · ${g.waiting} on the waiting list` : " · sign-ups closed"}</span>
              ) : (
                <span className="text-xs text-muted-foreground">{g.seats - g.members} seats left</span>
              )}
              <span className="text-xs text-muted-foreground">For {g.tiers.map((id) => tiers.find((t) => t.id === id)?.name).filter(Boolean).join(", ") || "no tier yet"}</span>
            </CardContent>
          </Card>
        ))}
      </div>
      <GroupEditor group={open} isNew={!!open && !groups.some((g) => g.id === open.id)} onClose={() => setOpen(null)} />
    </div>
  )
}

function GroupEditor({ group, isNew, onClose }: { group: Group | null; isNew: boolean; onClose: () => void }) {
  const { coach } = useCoach()
  const tiers = useTiers(coach)
  const [g, setG] = useState<Group | null>(group)
  const [key, setKey] = useState(group?.id)
  if (group?.id !== key) {
    setKey(group?.id)
    setG(group)
  }
  const set = (p: Partial<Group>) => setG((v) => (v ? { ...v, ...p } : v))

  return (
    <Sheet open={!!group} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{g?.name || "Group"}</SheetTitle>
          <SheetDescription>{isNew ? "A new cohort. Students join it at checkout or you add them." : `${g?.members ?? 0} members.`}</SheetDescription>
        </SheetHeader>
        {g && (
          <div className="grid gap-5 overflow-y-auto px-4">
            <Field label="Name">
              <Input value={g.name} onChange={(e) => set({ name: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Starts">
                <Input type="date" value={g.start} onChange={(e) => set({ start: e.target.value })} />
              </Field>
              <Field label="Ends">
                <Input type="date" value={g.end} onChange={(e) => set({ end: e.target.value })} />
              </Field>
            </div>
            <Field label="Seats" hint={g.members ? `${g.members} taken` : undefined}>
              <Input type="number" min={1} value={g.seats} onChange={(e) => set({ seats: Number(e.target.value) || 0 })} className="w-28 tabular-nums" />
            </Field>
            <div className="grid gap-2">
              <span className="text-[0.8rem] font-medium">Who can join</span>
              <div className="grid gap-2 sm:grid-cols-2">
                {tiers.map((t) => (
                  <label key={t.id} className={cn("flex items-center gap-2 rounded-lg border p-2.5 text-sm", g.tiers.includes(t.id) && "border-[var(--ts-yellow)]/50")}>
                    <Checkbox checked={g.tiers.includes(t.id)} onCheckedChange={(v) => set({ tiers: v ? [...g.tiers, t.id] : g.tiers.filter((x) => x !== t.id) })} />
                    {t.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="divide-y rounded-lg border px-3">
              <SettingRow label="Waiting list when full" text="People leave their e-mail and hear first when a seat opens">
                <Switch checked={g.waitlist} onCheckedChange={(v) => set({ waitlist: v })} />
              </SettingRow>
              <SettingRow label="Own channel" text="A Discord channel only for this group">
                <Switch checked={g.channel} onCheckedChange={(v) => set({ channel: v })} />
              </SettingRow>
              <SettingRow label="Own ranking" text="Members compete within the group">
                <Switch checked={g.ranking} onCheckedChange={(v) => set({ ranking: v })} />
              </SettingRow>
            </div>
            <p className="text-xs text-muted-foreground">Set when each course opens for this group in the Access tab, e.g. week 2 opens 7 days after the start.</p>
          </div>
        )}
        <SheetFooter className="flex-row">
          {!isNew && g && (
            <Button
              variant="outline"
              onClick={() => {
                setPreviewAs(coach.slug, { kind: "group", id: g.id, label: g.name })
                window.open(`/c/${coach.slug}/courses`, "_blank")
              }}
            >
              <Eye /> Preview as
            </Button>
          )}
          <Button
            className="flex-1"
            disabled={!g?.name || !g.tiers.length}
            onClick={() => {
              if (!g) return
              saveGroups(coach, (list) => (isNew ? [...list, g] : list.map((x) => (x.id === g.id ? g : x))))
              toast(isNew ? `${g.name} created` : `${g.name} saved`)
              onClose()
            }}
          >
            {isNew ? "Create group" : "Save group"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
