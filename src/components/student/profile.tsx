"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Check, CreditCard, Download, Link2 } from "@/components/icons"
import { toast } from "sonner"
import { DiscordMark } from "@/components/admin/community/community-admin"
import { useCommunityData } from "@/components/admin/kit"
import { useCoach } from "@/components/coach/coach-provider"
import { useStudentTier } from "@/components/courses/shared"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useViewerGroup } from "@/lib/data/access"
import { DEMO_STUDENT } from "@/lib/data/sample"
import { MyGroup } from "./my-group"
import { ACCOUNTS } from "@/lib/data/trades"
import { cn } from "@/lib/utils"

function Row({ label, text, children }: { label: string; text?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3.5">
      <div className="grid min-w-0 flex-1 basis-56 gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        {text && <span className="text-xs text-muted-foreground">{text}</span>}
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  )
}

/** STU-20 profile and settings, STU-21 subscription and billing. */
export function StudentProfile() {
  const { coach } = useCoach()
  const tierId = useStudentTier()
  const group = useViewerGroup(coach)
  const params = useSearchParams()
  const [nick, setNick] = useCommunityData(coach.slug, "nickname", "alexm")
  const [notif, setNotif] = useCommunityData(coach.slug, "notifications", { feedback: true, lessons: true, events: true, community: false, email: true })
  const [linked, setLinked] = useCommunityData(coach.slug, "discord-linked", false)
  const [hidden, setHidden] = useCommunityData(coach.slug, "rank-hidden", false)
  const [change, setChange] = useState<string | null>(null)
  const [cancel, setCancel] = useState(false)
  const tier = coach.tiers.find((t) => t.id === tierId) ?? coach.tiers[0]
  const price = (p: string) => Number(p.replace(/[^\d.]/g, "")) || 0

  return (
    <div className="flex flex-col page-gap">
      <div className="flex items-center gap-4">
        <Avatar className="size-14">
          <AvatarFallback className="text-lg">{DEMO_STUDENT.initials}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <span className="eyebrow">
            {tier?.name} · member since March
          </span>
          <h1 className="text-3xl leading-tight">
            {DEMO_STUDENT.first} {DEMO_STUDENT.last}
          </h1>
        </div>
      </div>

      <Tabs defaultValue={params.get("tab") ?? "profile"} className="gap-5">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="billing">Subscription</TabsTrigger>
          {group && <TabsTrigger value="group">My group</TabsTrigger>}
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="gap-0 divide-y px-5 py-1">
            <Row label="Nickname" text="Shown in the ranking and community instead of your name">
              <Input value={nick} onChange={(e) => setNick(e.target.value)} className="w-48" />
            </Row>
            <Row label="Picture">
              <Button variant="outline" size="sm" onClick={() => toast("Upload a picture")}>
                Change
              </Button>
            </Row>
            <Row label="E-mail" text="You log in with a code sent here">
              <span className="text-sm text-muted-foreground">alex.moreau@mail.com</span>
            </Row>
            {coach.modules.ranking && (
              <Row label="Show me in the ranking" text="Only scores and percentages, never amounts">
                <Switch checked={!hidden} onCheckedChange={(v) => setHidden(!v)} />
              </Row>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="grid gap-4">
          <Card className="gap-3 px-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="grid gap-0.5">
                <span className="eyebrow">Your plan</span>
                <span className="text-2xl">{tier?.name}</span>
              </div>
              <span className="text-lg tabular-nums">
                {tier?.price}
                <span className="text-sm text-muted-foreground"> / {tier?.cadence === "once" ? "once" : tier?.cadence}</span>
              </span>
            </div>
            <span className="text-sm text-muted-foreground">Next payment on 1 Nov 2026 · Visa ·· 4242</span>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => toast("Update your card", { description: "Opens the secure payment form." })}>
                <CreditCard /> Update card
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setCancel(true)}>
                Cancel membership
              </Button>
            </div>
          </Card>
          <div className="grid gap-3 md:grid-cols-3">
            {coach.tiers.map((t) => {
              const current = t.id === tier?.id
              const up = price(t.price) > price(tier?.price ?? "0")
              return (
                <Card key={t.id} size="sm" className={cn("gap-2 px-4", current && "ring-2 ring-primary")}>
                  <span className="flex items-center justify-between">
                    <span className="font-medium">{t.name}</span>
                    {current && <Badge>Current</Badge>}
                  </span>
                  <span className="text-xl tabular-nums">
                    {t.price}
                    <span className="text-sm text-muted-foreground"> / {t.cadence === "once" ? "once" : t.cadence}</span>
                  </span>
                  {!current && (
                    <Button size="sm" variant={up ? "default" : "outline"} onClick={() => setChange(t.id)}>
                      {up ? "Upgrade" : "Switch"}
                    </Button>
                  )}
                </Card>
              )
            })}
          </div>
          <Card className="gap-0 px-5 py-2">
            <span className="eyebrow py-2">Invoices</span>
            {["1 Oct 2026", "1 Sep 2026", "1 Aug 2026"].map((d) => (
              <div key={d} className="flex items-center justify-between border-t py-2.5 text-sm">
                <span>{d}</span>
                <span className="flex items-center gap-3 tabular-nums">
                  {tier?.price}
                  <Button variant="ghost" size="icon-sm" aria-label={`Download invoice ${d}`} onClick={() => toast("Invoice downloaded")}>
                    <Download />
                  </Button>
                </span>
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="group">
          <MyGroup />
        </TabsContent>

        <TabsContent value="connections">
          <Card className="gap-0 divide-y px-5 py-1">
            <Row label="Discord" text={linked ? `Linked · ${tier?.name} role` : "Get your role and the private channels"}>
              <span className="grid size-7 place-items-center rounded-(--r-inner) bg-[#5865F2] text-white">
                <DiscordMark className="size-4" />
              </span>
              <Button variant="outline" size="sm" onClick={() => setLinked(!linked)}>
                {linked ? "Unlink" : "Link"}
              </Button>
            </Row>
            {coach.modules.journal &&
              ACCOUNTS.map((a) => (
                <Row key={a.id} label={a.name} text={`${a.broker} · synced ${a.synced} · read-only`}>
                  <Check className="size-4 text-profit" />
                  <Button variant="ghost" size="sm" onClick={() => toast(`${a.name} disconnected`)}>
                    Disconnect
                  </Button>
                </Row>
              ))}
            {coach.modules.journal && (
              <Row label="Add a broker account">
                <Button variant="outline" size="sm" onClick={() => toast("Opens the broker list")}>
                  <Link2 /> Connect
                </Button>
              </Row>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="gap-0 divide-y px-5 py-1">
            {(
              [
                ["feedback", `${coach.coachName} answers your trade`],
                ["lessons", `New ${coach.wording.lesson.toLowerCase()}s`],
                ["events", "Live sessions and calls, 1 hour before"],
                ["community", "Announcements"],
                ["email", "Also by e-mail"],
              ] as const
            ).map(([id, label]) => (
              <Row key={id} label={label}>
                <Switch checked={notif[id]} onCheckedChange={(v) => setNotif((n) => ({ ...n, [id]: v }))} />
              </Row>
            ))}
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!change} onOpenChange={(o) => !o && setChange(null)}>
        <DialogContent>
          {(() => {
            const t = coach.tiers.find((x) => x.id === change)
            if (!t || !tier) return null
            const diff = price(t.price) - price(tier.price)
            return (
              <>
                <DialogHeader>
                  <DialogTitle>
                    {diff > 0 ? "Upgrade" : "Switch"} to {t.name}
                  </DialogTitle>
                  <DialogDescription>
                    {diff > 0
                      ? `Starts now. You pay the difference for the rest of this month: about €${Math.round(diff * 0.6)}. Then ${t.price} / ${t.cadence}.`
                      : `Starts on 1 Nov, when your current period ends. You keep ${tier.name} until then.`}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setChange(null)}>
                    Not now
                  </Button>
                  <Button
                    onClick={() => {
                      setChange(null)
                      toast(diff > 0 ? `Welcome to ${t.name}` : `You switch to ${t.name} on 1 Nov`)
                    }}
                  >
                    {diff > 0 ? `Pay and upgrade` : "Confirm"}
                  </Button>
                </DialogFooter>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>

      <Dialog open={cancel} onOpenChange={setCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel your membership?</DialogTitle>
            <DialogDescription>You keep everything until 1 Nov. Your account, journal and notes stay; you can come back any time.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label className="text-[0.8rem]">Why are you leaving? (optional)</Label>
            <Input placeholder="Too expensive, no time, found what I needed…" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCancel(false)}>
              Keep my membership
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setCancel(false)
                toast("Membership cancelled", { description: "Access until 1 Nov 2026." })
              }}
            >
              Cancel membership
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
