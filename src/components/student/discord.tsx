"use client"

import { useState } from "react"
import { Check, ExternalLink, Hash } from "@/components/icons"
import { toast } from "sonner"
import { DiscordMark } from "@/components/admin/community/community-admin"
import { useCommunityData } from "@/components/admin/kit"
import { useCoach } from "@/components/coach/coach-provider"
import { useStudentTier } from "@/components/courses/shared"
import { OwnTitle } from "@/components/student/own-title"
import { AvatarStack } from "@/components/widgets/shared"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DISCORD } from "@/lib/data/sample"

/** New messages per channel since the student's last visit (sample). */
const UNREAD: Record<string, number> = { "#trade-ideas": 12, "#daily-recap": 7, "#questions": 4 }

/**
 * STU-11 Discord: the coach's server as its own page (it used to share the
 * Community page with the feed). Join with one click; the role follows the
 * student's tier. Real-time chat stays on Discord.
 */
export function StudentDiscord() {
  const { coach } = useCoach()
  const tier = useStudentTier()
  const [linked, setLinked] = useCommunityData(coach.slug, "discord-linked", false)
  const [busy, setBusy] = useState(false)
  const role = coach.tiers.find((t) => t.id === tier)?.name ?? coach.tiers[0]?.name

  return (
    <div className="flex flex-col page-gap">
      <OwnTitle>
        <div className="flex flex-col gap-1">
          <span className="eyebrow">
            {DISCORD.members.toLocaleString("en")} members · {DISCORD.online} online
          </span>
          <h1 className="text-3xl leading-tight md:text-4xl">{coach.wording.discord}</h1>
        </div>
      </OwnTitle>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
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
          {linked ? (
            <div className="grid gap-2">
              <span className="flex items-center gap-2 text-sm">
                <Check className="size-4 text-[var(--profit)]" /> Linked. You have the {role} role.
              </span>
              <Button variant="outline" className="w-fit" onClick={() => toast("Opens Discord")}>
                <ExternalLink /> Open Discord
              </Button>
            </div>
          ) : (
            <Button
              className="w-fit"
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

        <Card className="gap-3 px-5">
          <h2 className="text-base font-medium">Channels</h2>
          <div className="grid gap-1.5 text-sm">
            {DISCORD.channels.map((c) => (
              <span key={c} className="flex items-center gap-1.5">
                <Hash className="size-3.5 text-muted-foreground" />
                <span className="flex-1">{c.slice(1)}</span>
                {linked && UNREAD[c] ? <span className="text-xs text-muted-foreground tabular-nums">{UNREAD[c]} new</span> : null}
              </span>
            ))}
          </div>
          {!linked && <p className="text-xs text-muted-foreground">Join to see what&rsquo;s new in each channel.</p>}
        </Card>
      </div>
    </div>
  )
}
