"use client"

import { Heart, Megaphone, MessageCircle, MessageSquareText, Pin } from "lucide-react"
import { useCoach } from "@/components/coach/coach-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ANNOUNCEMENT, DISCORD } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { AvatarStack, WidgetEmpty, useEmpty, type WidgetProps } from "./shared"

/** Announcement: highlight (colour card), plain, pinned (looks like a post). */
export function Announcement({ variant = "highlight" }: WidgetProps) {
  const { coach } = useCoach()
  const empty = useEmpty()
  if (empty) return <WidgetEmpty icon={Megaphone} title="No announcements yet" text={`News from ${coach.coachName} will show here.`} />

  if (variant === "pinned") {
    return (
      <Card>
        <CardContent className="grid gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary text-xs text-primary-foreground">{coach.coachName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 leading-tight">
              <span className="text-sm font-medium">{coach.coachName}</span>
              <span className="text-xs text-muted-foreground">{ANNOUNCEMENT.when}</span>
            </div>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Pin className="size-3.5" /> Pinned
            </span>
          </div>
          <div className="grid gap-1">
            <span className="font-heading text-lg leading-tight">{ANNOUNCEMENT.title}</span>
            <p className="text-sm text-muted-foreground">{ANNOUNCEMENT.body}</p>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Heart className="size-3.5" /> {ANNOUNCEMENT.reactions}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="size-3.5" /> {ANNOUNCEMENT.comments} comments
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const hl = variant === "highlight"
  return (
    <Card className={cn(hl && "bg-highlight text-highlight-foreground")}>
      <CardHeader>
        <CardDescription className={cn("eyebrow flex items-center gap-1.5", hl && "text-highlight-foreground/70")}>
          <Megaphone className="size-3.5" /> From {coach.coachName}
        </CardDescription>
        <CardTitle className="text-lg">{ANNOUNCEMENT.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <p className={cn(!hl && "text-muted-foreground")}>{ANNOUNCEMENT.body}</p>
        <span className="text-xs opacity-70">{ANNOUNCEMENT.when}</span>
      </CardContent>
    </Card>
  )
}

/** Discord: card, banner (wide call to action), members (who's online and channels). */
export function Discord({ variant = "card", props }: WidgetProps) {
  const empty = useEmpty()
  const text = String(props.text || "Live chat, trade ideas and Q&A with the rest of the group.")

  if (variant === "banner") {
    return (
      <div className="@container flex flex-col gap-4 rounded-(--radius) bg-[#5865f2] p-5 text-white @lg:flex-row @lg:items-center" style={{ boxShadow: "var(--card-shadow)" }}>
        <MessageSquareText className="size-8 shrink-0" />
        <div className="grid flex-1 gap-0.5">
          <span className="font-heading text-xl leading-tight">The conversation happens on Discord</span>
          <span className="text-sm text-white/80">{text}</span>
        </div>
        <Button variant="secondary" className="shrink-0">Join the server</Button>
      </div>
    )
  }

  if (variant === "members") {
    return (
      <Card>
        <CardHeader>
          <CardDescription className="eyebrow">Discord</CardDescription>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="size-2 rounded-full bg-emerald-500" />
            {empty ? "Be the first one in" : `${DISCORD.online} online now`}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {!empty && (
            <div className="flex items-center gap-3">
              <AvatarStack initials={DISCORD.avatars} />
              <span className="text-xs text-muted-foreground">{DISCORD.members.toLocaleString("en")} members</span>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {DISCORD.channels.map((c) => (
              <span key={c} className="rounded-md bg-muted px-2 py-0.5 text-xs">
                {c}
              </span>
            ))}
          </div>
          <div>
            <Button variant="secondary" size="sm">Open Discord</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardDescription className="eyebrow">Community</CardDescription>
        <CardTitle className="text-lg">Join us on Discord</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
        <p>{text}</p>
        <div>
          <Button variant="secondary">
            <MessageSquareText /> Open Discord
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
