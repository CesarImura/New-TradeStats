"use client"

import { Heart, Megaphone, MessageCircle, MessageSquareText, Pin } from "lucide-react"
import { useCoach } from "@/components/coach/coach-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ANNOUNCEMENT, DISCORD, DISCORD_ACTIVITY } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { Bars, Big, Caps, Head, W } from "./kit"
import { AvatarStack, WidgetEmpty, useEmpty, type WidgetProps } from "./shared"

/** Announcement: highlight (colour card), plain, post (with reactions), brand (on the coach's colour). */
export function Announcement({ variant = "highlight" }: WidgetProps) {
  const { coach } = useCoach()
  const empty = useEmpty()
  if (empty) return <WidgetEmpty icon={Megaphone} title="No announcements yet" text={`News from ${coach.coachName} will show here.`} />

  if (variant === "post") {
    return (
      <W>
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary text-[0.65rem] text-primary-foreground">{coach.coachName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="grid min-w-0 leading-tight">
            <span className="truncate text-sm font-semibold">{coach.coachName}</span>
            <Caps>{ANNOUNCEMENT.when}</Caps>
          </div>
          <Pin className="ml-auto size-4 shrink-0 text-primary" />
        </div>
        <div className="grid min-w-0 gap-1">
          <span className="font-heading text-lg leading-tight font-semibold">{ANNOUNCEMENT.title}</span>
          <p className="line-clamp-2 text-sm text-muted-foreground @[18rem]:line-clamp-3">{ANNOUNCEMENT.body}</p>
        </div>
        <div className="mt-auto flex gap-4">
          <span className="flex items-center gap-1 text-xs font-medium tabular-nums">
            <Heart className="size-3.5 text-loss" /> {ANNOUNCEMENT.reactions}
          </span>
          <span className="flex items-center gap-1 text-xs font-medium tabular-nums">
            <MessageCircle className="size-3.5 text-muted-foreground" /> {ANNOUNCEMENT.comments}
          </span>
        </div>
      </W>
    )
  }

  const hl = variant === "highlight"
  return (
    <W brand={variant === "brand"} className={cn(hl && "bg-highlight text-highlight-foreground")}>
      <div className={cn("flex min-w-0 items-center gap-2 text-[0.65rem] font-medium tracking-wide uppercase", hl ? "text-highlight-foreground/70" : "text-muted-foreground")}>
        <Megaphone className={cn("size-4 shrink-0", !hl && "text-primary")} />
        <span className="truncate">From {coach.coachName}</span>
        <span className="ml-auto hidden shrink-0 @[15rem]:inline">{ANNOUNCEMENT.when}</span>
      </div>
      <span className="font-heading text-xl leading-tight font-semibold">{ANNOUNCEMENT.title}</span>
      <p className={cn("line-clamp-2 text-sm @[18rem]:line-clamp-3", hl ? "opacity-80" : "text-muted-foreground")}>{ANNOUNCEMENT.body}</p>
    </W>
  )
}

/** Discord: online (who's around + activity today), card, banner, brand (online, on the coach's colour). */
export function Discord({ variant = "online", props }: WidgetProps) {
  const empty = useEmpty()
  const text = String(props.text || "Live chat, trade ideas and Q&A with the group.")

  if (variant === "banner") {
    return (
      <div className="@container flex h-full flex-col justify-center gap-3 overflow-hidden rounded-(--radius) bg-[#5865f2] p-[calc(1rem*var(--density,1))] text-white @lg:flex-row @lg:items-center" style={{ boxShadow: "var(--card-shadow)" }}>
        <MessageSquareText className="size-6 shrink-0" />
        <div className="grid min-w-0 flex-1 gap-0.5">
          <span className="truncate font-heading text-lg leading-tight font-semibold">{empty ? "Be the first one in" : `${DISCORD.online} people online now`}</span>
          <span className="truncate text-sm text-white/80">{text}</span>
        </div>
        <Button variant="secondary" className="shrink-0 self-start @lg:self-auto">
          Join
        </Button>
      </div>
    )
  }

  if (variant === "card") {
    return (
      <W>
        <Head icon={MessageSquareText} label="Discord" right={empty ? undefined : `${DISCORD.members.toLocaleString("en")} members`} />
        <p className="line-clamp-2 text-sm text-muted-foreground">{text}</p>
        <div className="mt-auto hidden flex-wrap gap-1.5 @[14rem]:flex">
          {DISCORD.channels.map((c) => (
            <span key={c} className="r-chip bg-muted px-2 py-0.5 text-xs">
              {c}
            </span>
          ))}
        </div>
        <Button variant="secondary" size="sm" className="w-fit">
          Open Discord
        </Button>
      </W>
    )
  }

  return (
    <W brand={variant === "brand"}>
      <Head
        icon={MessageSquareText}
        label="Discord"
        right={
          <span className="flex items-center gap-1.5">
            <i className="r-dot size-2 bg-profit" />
            <Caps>Live</Caps>
          </span>
        }
      />
      <div className="flex items-end justify-between gap-3">
        <Big value={empty ? 0 : DISCORD.online} unit="online" />
        {!empty && <AvatarStack initials={DISCORD.avatars.slice(0, 4)} className="hidden @[15rem]:flex" />}
      </div>
      <Bars
        values={empty ? DISCORD_ACTIVITY.map(() => 0) : DISCORD_ACTIVITY}
        active={DISCORD_ACTIVITY.length - 1}
        format={(v) => `${v} msgs`}
        tips={DISCORD_ACTIVITY.map((_, i) => (i === DISCORD_ACTIVITY.length - 1 ? "Last hour" : `${DISCORD_ACTIVITY.length - 1 - i}h ago`))}
      />
    </W>
  )
}
