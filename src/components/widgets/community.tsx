"use client"

import { Heart, Megaphone, MessageCircle, MessageSquareText, Pin } from "lucide-react"
import { useCoach } from "@/components/coach/coach-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ANNOUNCEMENT, DISCORD, DISCORD_ACTIVITY } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { Bars, Big, Caps, Head, W } from "./kit"
import { AvatarStack, WidgetEmpty, useEmpty, type WidgetProps } from "./shared"

/** Announcement: highlight (colour card), plain, post (with reactions). */
export function Announcement({ variant = "highlight" }: WidgetProps) {
  const { coach } = useCoach()
  const empty = useEmpty()
  if (empty) return <WidgetEmpty icon={Megaphone} title="No announcements yet" text={`News from ${coach.coachName} will show here.`} />

  if (variant === "post") {
    return (
      <W>
        <div className="flex items-center gap-2.5">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary text-[0.65rem] text-primary-foreground">{coach.coachName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="grid leading-tight">
            <span className="text-sm font-semibold">{coach.coachName}</span>
            <Caps>{ANNOUNCEMENT.when}</Caps>
          </div>
          <Pin className="ml-auto size-4 text-primary" />
        </div>
        <div className="grid gap-1">
          <span className="font-heading text-lg leading-tight font-semibold">{ANNOUNCEMENT.title}</span>
          <p className="line-clamp-3 text-sm text-muted-foreground">{ANNOUNCEMENT.body}</p>
        </div>
        <div className="mt-auto flex gap-4">
          <span className="flex items-center gap-1 text-xs font-semibold tabular-nums">
            <Heart className="size-3.5 text-loss" /> {ANNOUNCEMENT.reactions}
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold tabular-nums">
            <MessageCircle className="size-3.5 text-muted-foreground" /> {ANNOUNCEMENT.comments}
          </span>
        </div>
      </W>
    )
  }

  const hl = variant === "highlight"
  return (
    <W className={cn(hl && "bg-highlight text-highlight-foreground")}>
      <div className={cn("flex items-center gap-2 text-[0.65rem] font-semibold tracking-wider uppercase", hl ? "text-highlight-foreground/70" : "text-muted-foreground")}>
        <Megaphone className={cn("size-4", !hl && "text-primary")} /> From {coach.coachName}
        <span className="ml-auto">{ANNOUNCEMENT.when}</span>
      </div>
      <span className="font-heading text-xl leading-tight font-semibold">{ANNOUNCEMENT.title}</span>
      <p className={cn("line-clamp-3 text-sm", hl ? "opacity-80" : "text-muted-foreground")}>{ANNOUNCEMENT.body}</p>
    </W>
  )
}

/** Discord: online (who's around + activity today), card, banner. */
export function Discord({ variant = "online", props }: WidgetProps) {
  const empty = useEmpty()
  const text = String(props.text || "Live chat, trade ideas and Q&A with the group.")

  if (variant === "banner") {
    return (
      <div className="@container flex h-full flex-col justify-center gap-3 rounded-(--radius) bg-[#5865f2] p-[calc(1rem*var(--density,1))] text-white @lg:flex-row @lg:items-center" style={{ boxShadow: "var(--card-shadow)" }}>
        <MessageSquareText className="size-7 shrink-0" />
        <div className="grid flex-1 gap-0.5">
          <span className="font-heading text-xl leading-tight font-semibold">{empty ? "Be the first one in" : `${DISCORD.online} people online now`}</span>
          <span className="text-sm text-white/80">{text}</span>
        </div>
        <Button variant="secondary" className="shrink-0">Join</Button>
      </div>
    )
  }

  if (variant === "card") {
    return (
      <W>
        <Head icon={MessageSquareText} label="Discord" right={empty ? undefined : `${DISCORD.members.toLocaleString("en")} members`} />
        <p className="text-sm text-muted-foreground">{text}</p>
        <div className="mt-auto flex flex-wrap gap-1.5">
          {DISCORD.channels.map((c) => (
            <span key={c} className="rounded-md bg-muted px-2 py-0.5 text-xs">
              {c}
            </span>
          ))}
        </div>
        <Button variant="secondary" size="sm" className="w-fit">Open Discord</Button>
      </W>
    )
  }

  return (
    <W>
      <Head icon={MessageSquareText} label="Discord" right={<span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-emerald-500" /><Caps>Live</Caps></span>} />
      <div className="flex items-end justify-between gap-3">
        <Big fx value={empty ? 0 : DISCORD.online} unit="online" />
        {!empty && <AvatarStack initials={DISCORD.avatars.slice(0, 4)} />}
      </div>
      <Bars values={empty ? DISCORD_ACTIVITY.map(() => 0) : DISCORD_ACTIVITY} active={DISCORD_ACTIVITY.length - 1} />
      <div className="flex justify-between">
        <Caps>12 h ago</Caps>
        <Caps className="text-foreground">Now</Caps>
      </div>
    </W>
  )
}
