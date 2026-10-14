"use client"

import { ArrowUpRight, Heart, Megaphone, MessageCircle, MessageSquareText, Pin } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { ANNOUNCEMENT, DISCORD, DISCORD_ACTIVITY } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { Avatar, Bars, Big, Caps, Head, Row, TYPE, W, useMore } from "./kit"
import { AvatarStack, WidgetEmpty, useEmpty, type WidgetProps } from "./shared"

/** Accent text: the one coloured thing in a widget, when it is a link rather than a button. */
/** Brand-coloured text, in the readable version of the brand colour (see kit.tsx ACCENT_TEXT). */
const ACCENT_TEXT = "text-[color:var(--w-accent-text,var(--brand-text,var(--primary)))]"

const initials = (name: string) => name.slice(0, 2).toUpperCase()

// ---------- Announcement

/** Announcement: plain (a headline in the heading font), post (a feed post with its author and reactions), line (one line). */
export function Announcement({ variant = "plain" }: WidgetProps) {
  const { coach } = useCoach()
  const empty = useEmpty()
  const more = useMore("standard")
  const detailed = useMore("detailed")
  if (empty) return <WidgetEmpty icon={Megaphone} title="No announcements yet" text={`News from ${coach.coachName} will show here.`} />

  const read = (
    <a href="#" className={cn("shrink-0 text-xs font-medium hover:underline", ACCENT_TEXT)}>
      Read
    </a>
  )

  if (variant === "line") {
    return (
      <W row className="flex-row items-center gap-2.5">
        <Megaphone className="size-3.5 shrink-0 text-muted-foreground" />
        <span className={cn(TYPE.body, "min-w-0 flex-1 truncate")}>
          <span className="font-medium">{ANNOUNCEMENT.title}</span>
          {more && <span className="hidden text-muted-foreground @2xl:inline"> · {ANNOUNCEMENT.body}</span>}
        </span>
        {detailed && <Caps className="hidden shrink-0 @lg:inline">{ANNOUNCEMENT.when}</Caps>}
        {read}
      </W>
    )
  }

  if (variant === "post") {
    return (
      <W>
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar initials={initials(coach.coachName)} size={28} />
          <div className="grid min-w-0">
            <span className={cn(TYPE.title, "truncate")}>{coach.coachName}</span>
            <span className={TYPE.small}>{ANNOUNCEMENT.when}</span>
          </div>
          {ANNOUNCEMENT.pinned && <Pin className="ml-auto size-3.5 shrink-0 text-muted-foreground" />}
        </div>
        <div className="grid min-w-0 gap-0.5">
          <span className={cn(TYPE.title, "line-clamp-2")}>{ANNOUNCEMENT.title}</span>
          <p className={cn(TYPE.body, "text-muted-foreground", detailed ? "line-clamp-4" : more ? "line-clamp-2 @[18rem]:line-clamp-3" : "line-clamp-1")}>{ANNOUNCEMENT.body}</p>
        </div>
        <div className="mt-auto flex items-center gap-4 text-xs text-muted-foreground tabular-nums">
          {more && (
            <>
              <span className="flex items-center gap-1">
                <Heart className="size-3.5" /> {ANNOUNCEMENT.reactions}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="size-3.5" /> {ANNOUNCEMENT.comments}
                {detailed && " comments"}
              </span>
            </>
          )}
          <span className="ml-auto">{read}</span>
        </div>
      </W>
    )
  }

  return (
    <W>
      <div className="flex min-w-0 items-center gap-1.5 leading-none">
        <Megaphone className="size-3.5 shrink-0 text-muted-foreground" />
        <Caps className="truncate">From {coach.coachName}</Caps>
        <Caps className="ml-auto hidden shrink-0 @[15rem]:inline">{ANNOUNCEMENT.when}</Caps>
      </div>
      <h3 className={cn(TYPE.value, "line-clamp-2 text-balance")}>{ANNOUNCEMENT.title}</h3>
      {more && <p className={cn(TYPE.body, "text-muted-foreground", detailed ? "line-clamp-4" : "line-clamp-2 @[18rem]:line-clamp-3")}>{ANNOUNCEMENT.body}</p>}
      {detailed && <div className="mt-auto">{read}</div>}
    </W>
  )
}

// ---------- Discord

/** New messages per channel since the student's last visit (sample). */
const UNREAD = [12, 4, 7]

/** Discord: online (who's around and activity today), card (channels with what's new), banner (one row with a Join button). */
export function Discord({ variant = "online", props }: WidgetProps) {
  const empty = useEmpty()
  const more = useMore("standard")
  const detailed = useMore("detailed")
  const text = String(props.text || "Live chat, trade ideas and Q&A with the group.")
  const members = `${DISCORD.members.toLocaleString("en")} members`

  if (variant === "banner") {
    return (
      <W className="flex-row items-center gap-3">
        <MessageSquareText className="size-4 shrink-0 text-muted-foreground" />
        <div className="grid min-w-0 flex-1 gap-0.5">
          <span className={cn(TYPE.title, "truncate")}>{empty ? "Be the first one in" : `${DISCORD.online} people online now`}</span>
          {more && <span className={cn(TYPE.small, "truncate")}>{detailed && !empty ? `${members} · ${text}` : text}</span>}
        </div>
        {!empty && <AvatarStack initials={DISCORD.avatars.slice(0, 4)} className="hidden shrink-0 @lg:flex" />}
        <Button size="sm" className="shrink-0">
          Join
        </Button>
      </W>
    )
  }

  if (variant === "card") {
    return (
      <W>
        <Head icon={MessageSquareText} label="Discord" right={empty ? undefined : members} />
        {detailed && <p className={cn(TYPE.body, "line-clamp-2 text-muted-foreground")}>{text}</p>}
        <div className="grid min-h-0">
          {DISCORD.channels.slice(0, more ? 3 : 2).map((c, i) => (
            <Row key={c} title={c} value={<span className={TYPE.small}>{empty ? "Quiet" : `${UNREAD[i]} new`}</span>} />
          ))}
        </div>
        <Button size="sm" className="mt-auto w-fit">
          Open Discord <ArrowUpRight />
        </Button>
      </W>
    )
  }

  return (
    <W>
      <Head
        icon={MessageSquareText}
        label="Discord"
        right={
          <span className="flex items-center gap-1.5">
            <i className="r-dot size-1.5 bg-profit" />
            <Caps>Live</Caps>
          </span>
        }
      />
      <div className="flex items-end justify-between gap-3">
        <Big value={empty ? 0 : DISCORD.online} unit="online" sub={detailed ? members : undefined} />
        {!empty && <AvatarStack initials={DISCORD.avatars.slice(0, 4)} className="hidden @[15rem]:flex" />}
      </div>
      {more ? (
        <Bars
          values={empty ? DISCORD_ACTIVITY.map(() => 0) : DISCORD_ACTIVITY}
          active={DISCORD_ACTIVITY.length - 1}
          format={(v) => `${v} msgs`}
          tips={DISCORD_ACTIVITY.map((_, i) => (i === DISCORD_ACTIVITY.length - 1 ? "Last hour" : `${DISCORD_ACTIVITY.length - 1 - i}h ago`))}
        />
      ) : (
        <Button size="sm" className="mt-auto w-fit">
          Join
        </Button>
      )}
    </W>
  )
}
