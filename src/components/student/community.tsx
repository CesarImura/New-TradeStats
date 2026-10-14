"use client"

import { useState } from "react"
import { Check, ExternalLink, Hash, Heart, MessageCircle, Pin } from "lucide-react"
import { toast } from "sonner"
import { DiscordMark, type Announcement } from "@/components/admin/community/community-admin"
import { useCommunityData } from "@/components/admin/kit"
import { useCoach } from "@/components/coach/coach-provider"
import { useStudentTier } from "@/components/courses/shared"
import { AvatarStack } from "@/components/widgets/shared"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ANNOUNCEMENTS } from "@/lib/data/people"
import { DISCORD } from "@/lib/data/sample"
import { useStored } from "@/lib/prototype-store"
import { cn } from "@/lib/utils"

const NO_LIKES: string[] = []

/** STU-11 Discord card and status, STU-30 the coach's announcements. */
export function StudentCommunity() {
  const { coach } = useCoach()
  const tier = useStudentTier()
  const list = useStored<Announcement[]>(`${coach.slug}:announcements`, ANNOUNCEMENTS)
  const [linked, setLinked] = useCommunityData(coach.slug, "discord-linked", false)
  const [liked, setLiked] = useCommunityData(coach.slug, "liked", NO_LIKES)
  const [busy, setBusy] = useState(false)
  const shown = list.filter((a) => !a.scheduled && (!a.tiers?.length || a.tiers.includes(tier))).sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned))
  const role = coach.tiers.find((t) => t.id === tier)?.name ?? coach.tiers[0]?.name

  return (
    <div className="flex flex-col page-gap">
      <div className="flex flex-col gap-1">
        <span className="eyebrow">{DISCORD.members.toLocaleString("en")} members · {coach.name}</span>
        <h1 className="text-3xl leading-tight md:text-4xl">{coach.wording.community}</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="flex flex-col gap-3 max-lg:order-2">
          <h2 className="text-xl">From {coach.coachName}</h2>
          {shown.length === 0 && <p className="rounded-(--radius) border border-dashed p-6 text-center text-sm text-muted-foreground">No announcements yet.</p>}
          {shown.map((a) => {
            const on = liked.includes(a.id)
            return (
              <Card key={a.id} className="gap-2 px-5">
                <div className="flex items-center gap-2">
                  {a.pinned && (
                    <span className="flex items-center gap-1 rounded-(--r-chip) bg-highlight px-2 py-0.5 text-xs text-highlight-foreground">
                      <Pin className="size-3" /> Pinned
                    </span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">{a.when}</span>
                </div>
                <h3 className="text-lg leading-snug">{a.title}</h3>
                <p className="text-sm text-muted-foreground">{a.body}</p>
                <div className="flex items-center gap-1 pt-1">
                  <Button variant="ghost" size="sm" onClick={() => setLiked((l) => (on ? l.filter((x) => x !== a.id) : [...l, a.id]))} className={cn(on && "text-primary")}>
                    <Heart className={cn(on && "fill-current")} /> {42 + (on ? 1 : 0)}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toast("Comments are in Discord for now", { description: "Our own feed with comments comes later." })}>
                    <MessageCircle /> 9
                  </Button>
                </div>
              </Card>
            )
          })}
        </section>

        <aside className="flex flex-col gap-4">
          <Card className="gap-4 px-5">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-(--r-inner) bg-[#5865F2] text-white">
                <DiscordMark />
              </span>
              <div className="grid">
                <span className="font-medium">{coach.org} on Discord</span>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <span className="size-2 rounded-full bg-[var(--profit)]" /> {DISCORD.online} online now
                </span>
              </div>
            </div>
            <AvatarStack initials={DISCORD.avatars} />
            <div className="grid gap-1 text-sm">
              {DISCORD.channels.map((c) => (
                <span key={c} className="flex items-center gap-1.5 text-muted-foreground">
                  <Hash className="size-3.5" /> {c.slice(1)}
                </span>
              ))}
            </div>
            {linked ? (
              <div className="grid gap-2">
                <span className="flex items-center gap-2 text-sm">
                  <Check className="size-4 text-[var(--profit)]" /> Linked. You have the {role} role.
                </span>
                <Button variant="outline" onClick={() => toast("Opens Discord")}>
                  <ExternalLink /> Open Discord
                </Button>
              </div>
            ) : (
              <Button
                disabled={busy}
                onClick={() => {
                  setBusy(true)
                  setTimeout(() => {
                    setLinked(true)
                    setBusy(false)
                    toast("Discord linked", { description: `You got the ${role} role and the private channels.` })
                  }, 900)
                }}
              >
                {busy ? "Opening Discord…" : "Join with Discord"}
              </Button>
            )}
            <p className="text-xs text-muted-foreground">Real-time chat stays on Discord. Your role follows your membership automatically.</p>
          </Card>
        </aside>
      </div>
    </div>
  )
}
