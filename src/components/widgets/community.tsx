"use client"

import { Suspense, useState } from "react"
import { toast } from "sonner"
import { useCommunityData } from "@/components/admin/kit"
import { useStudentTier } from "@/components/courses/shared"
import { ArrowUpRight, Check, Eye, Heart, Megaphone, MessageCircle, MessageSquareText, MessagesSquare, Pin } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { ANNOUNCEMENT, DISCORD } from "@/lib/data/sample"
import { ANNOUNCEMENTS } from "@/lib/data/people"
import { cn } from "@/lib/utils"
import { Axis, Chip, GREY, HatchBar, Label, Legend, Num, Rule, TickBar, WCard, useFigureFont } from "./instrument"
import { ACCENT, ACCENT_TEXT, Avatar, Drop, FitText, FX, GROW_ROWS, SPLIT, Tip, TYPE, useMore } from "./kit"
import { AvatarStack, WidgetEmpty, useEmpty, type WidgetProps } from "./shared"
import { Artwork, HeatGrid, MEDIA_FG, MEDIA_FG2, MediaCard, heatShade } from "./layouts"

const initials = (name: string) => name.slice(0, 2).toUpperCase()

/** Everyone in the community: the coach's tiers added up. */
const useAudience = () => {
  const { coach } = useCoach()
  return coach.tiers.reduce((a, t) => a + t.members, 0)
}

// ---------- Announcement

/** Who has read the latest announcement so far (sample). */
const READ = 34
const READERS = ["JP", "SK", "MS", "TB"]
const WHEN = "2 h ago"

/** Reactions as small mono figures: hearts, replies, reads. */
function Reactions({ read = true, className }: { read?: boolean; className?: string }) {
  const font = useFigureFont()
  const items = [
    { icon: Heart, n: ANNOUNCEMENT.reactions, label: "" },
    { icon: MessageCircle, n: ANNOUNCEMENT.comments, label: "replies" },
    ...(read ? [{ icon: Eye, n: READ, label: "read" }] : []),
  ]
  return (
    <div className={cn("flex min-w-0 items-center gap-3.5 text-[0.6875rem] leading-4 tabular-nums", className)} style={{ fontFamily: font }}>
      {items.map(({ icon: Icon, n, label }, i) => (
        <span key={i} className="flex shrink-0 items-center gap-1">
          <Icon className="size-3.5 text-muted-foreground" />
          <span>{n}</span>
          {label && <span className="hidden text-muted-foreground @[16rem]:inline">{label}</span>}
        </span>
      ))}
    </div>
  )
}

// A 24px target or more from an invisible ::after around the word: the word and the layout stay as they were.
const ReadLink = () => (
  <a href="#" className={cn("relative shrink-0 text-[0.8125rem] font-medium after:absolute after:-inset-x-1.5 after:-inset-y-1 after:content-['']", FX.text, FX.focus)} style={{ color: ACCENT_TEXT }}>
    Read
  </a>
)

/**
 * Announcement: plain (the headline in the heading font, how many have read it),
 * post (a feed post with its author, reactions and readers), line (one row).
 */
export function Announcement({ variant = "plain" }: WidgetProps) {
  const { coach } = useCoach()
  const audience = useAudience()
  const empty = useEmpty()
  const more = useMore("standard")
  const detailed = useMore("detailed")
  const font = useFigureFont()
  if (empty) return <WidgetEmpty icon={Megaphone} title="No announcements yet" text={`News from ${coach.coachName} will show here.`} />

  const meta = `${coach.coachName} · ${WHEN} · ${READ} read`
  const chip = ANNOUNCEMENT.pinned ? <Chip tone="neutral">Pinned</Chip> : <Chip>New</Chip>

  if (variant === "line") {
    return (
      <WCard row icon={Megaphone} title={ANNOUNCEMENT.title} meta={detailed ? `${meta} · ${ANNOUNCEMENT.body}` : more ? meta : undefined} chip={<Chip>New</Chip>}>
        <ReadLink />
      </WCard>
    )
  }

  if (variant === "media") {
    return (
      <MediaCard
        image={<Artwork />}
        kicker={`${ANNOUNCEMENT.pinned ? "Pinned · " : ""}${coach.coachName} · ${WHEN}`}
        title={ANNOUNCEMENT.title}
        sub={more ? ANNOUNCEMENT.body : undefined}
        footer={
          <>
            {more && (
              <span className="flex min-w-0 items-center gap-3 text-[0.6875rem] leading-4 tabular-nums" style={{ color: MEDIA_FG2, fontFamily: font }}>
                <span className="flex items-center gap-1">
                  <Heart className="size-3.5" /> {ANNOUNCEMENT.reactions}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="size-3.5" /> {ANNOUNCEMENT.comments}
                </span>
                {detailed && (
                  <span className="flex items-center gap-1">
                    <Eye className="size-3.5" /> {READ} of {audience}
                  </span>
                )}
              </span>
            )}
            <a href="#" className={cn("ml-auto shrink-0 text-[0.8125rem] font-medium", FX.text, FX.focus)} style={{ color: MEDIA_FG }}>
              Read post
            </a>
          </>
        }
      />
    )
  }

  if (variant === "post") {
    return (
      <WCard icon={Megaphone} title="Latest announcement" meta={`${coach.name} · #announcements`} chip={chip}>
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar initials={initials(coach.coachName)} size={28} />
          <div className="grid min-w-0 flex-1">
            <span className={cn(TYPE.title, "truncate")}>{coach.coachName}</span>
            <span className={cn(TYPE.small, "truncate")}>Coach · {WHEN}</span>
          </div>
          {ANNOUNCEMENT.pinned && <Pin className="size-3.5 shrink-0 text-muted-foreground" />}
        </div>
        <div className="grid min-w-0 gap-0.5">
          <span className={cn(TYPE.title, "line-clamp-2")}>{ANNOUNCEMENT.title}</span>
          <Drop level={2}>
            {more && <FitText lines={detailed ? 4 : 2} className={cn(TYPE.body, "text-muted-foreground")}>{ANNOUNCEMENT.body}</FitText>}
          </Drop>
        </div>
        <div className="mt-auto flex min-w-0 items-center gap-3">
          <Reactions read={false} />
          <Drop level={3}>
            {more && (
              <span className="ml-auto hidden min-w-0 items-center gap-1.5 @[18rem]:flex">
                <AvatarStack initials={READERS.slice(0, 3)} />
                <span className={cn(TYPE.small, "truncate")}>+{READ - 3} read</span>
              </span>
            )}
          </Drop>
          {!more && (
            <span className="ml-auto">
              <ReadLink />
            </span>
          )}
        </div>
      </WCard>
    )
  }

  return (
    <WCard icon={Megaphone} title="Latest announcement" meta={meta} chip={chip}>
      <h3 className={cn(TYPE.value, "line-clamp-2 text-balance")}>{ANNOUNCEMENT.title}</h3>
      {more && <FitText lines={detailed ? 3 : 2} className={cn(TYPE.body, "text-muted-foreground")}>{ANNOUNCEMENT.body}</FitText>}
      {detailed && (
        <div className="grid gap-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <Label>
              Read by {READ} of {audience} {coach.wording.students.toLowerCase()}
            </Label>
            <Label>{Math.round((READ / audience) * 100)}%</Label>
          </div>
          <TickBar value={READ} max={audience} segments={40} height={8} />
        </div>
      )}
      {more && (
        <div className="mt-auto flex items-center justify-between gap-3">
          <Reactions read={!detailed} />
          <ReadLink />
        </div>
      )}
    </WCard>
  )
}

// ---------- Community feed

/** Likes and replies per post (sample). */
const POST_STATS: Record<string, { likes: number; replies: number }> = { n1: { likes: 42, replies: 9 }, n2: { likes: 18, replies: 3 }, n3: { likes: 27, replies: 6 } }

/**
 * Community feed: the coach's own feed (posts and announcements), separate
 * from Discord. list (the newest posts, pinned first), line (one row with
 * what's new). Shown when the Community module is on.
 */
export function CommunityFeed({ variant = "list" }: WidgetProps) {
  const { coach } = useCoach()
  const empty = useEmpty()
  const more = useMore("standard")
  const detailed = useMore("detailed")
  const font = useFigureFont()
  if (empty) return <WidgetEmpty icon={MessagesSquare} title="No posts yet" text={`${coach.coachName}'s posts and announcements will show here.`} />
  const posts = [...ANNOUNCEMENTS].sort((a, b) => Number(b.pinned) - Number(a.pinned))
  const fresh = 2
  const chip = <Chip>{fresh} new</Chip>

  if (variant === "line") {
    return (
      <WCard row icon={MessagesSquare} title={posts[0].title} meta={more ? `${coach.wording.community} · ${posts[0].when}${detailed ? ` · ${fresh} new since your last visit` : ""}` : undefined} chip={chip}>
        <ReadLink />
      </WCard>
    )
  }

  return (
    <WCard icon={MessagesSquare} title={coach.wording.community} meta={`${coach.coachName}'s posts · ${posts.length} this week`} chip={chip}>
      <div className={cn("flex min-h-0 flex-1 flex-col flex-wrap content-start overflow-hidden *:w-full", GROW_ROWS)}>
        {posts.map((p, i) => {
          const st = POST_STATS[p.id] ?? { likes: 0, replies: 0 }
          return (
            <div key={p.id} className="grid min-w-0 gap-0.5 border-[color:color-mix(in_oklab,var(--foreground)_7%,transparent)] py-2 first:pt-0">
              <div className="flex min-w-0 items-center gap-1.5">
                {p.pinned && <Pin className="size-3 shrink-0" style={{ color: ACCENT_TEXT }} />}
                <span className={cn(TYPE.title, "min-w-0 flex-1 truncate", i >= fresh && "font-normal")}>{p.title}</span>
                <span className="shrink-0 text-[0.6875rem] leading-4 text-muted-foreground">{p.when}</span>
              </div>
              {more && i === 0 && <p className={cn(TYPE.body, "line-clamp-2 text-muted-foreground")}>{p.body}</p>}
              {detailed && (
                <span className="flex items-center gap-3 text-[0.6875rem] leading-4 text-muted-foreground tabular-nums" style={{ fontFamily: font }}>
                  <span className="flex items-center gap-1">
                    <Heart className="size-3" /> {st.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="size-3" /> {st.replies}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="size-3" /> {p.reads}
                  </span>
                </span>
              )}
            </div>
          )
        })}
      </div>
    </WCard>
  )
}

// ---------- Discord

/** Messages per hour over the last 24 hours, oldest first (sample). */
const HOURS = [3, 2, 1, 1, 0, 0, 1, 2, 4, 6, 9, 12, 14, 11, 9, 13, 18, 22, 26, 19, 24, 28, 31, 27]
/** New messages per channel since the student's last visit (sample). */
const CHANNELS = [
  { name: DISCORD.channels[0], unread: 12 },
  { name: DISCORD.channels[1], unread: 7 },
  { name: DISCORD.channels[2], unread: 4 },
  { name: "#wins", unread: 3 },
  { name: "#announcements", unread: 1 },
]
const UNREAD = CHANNELS.slice(0, 3).reduce((a, c) => a + c.unread, 0)
const TRACK = "color-mix(in oklab, var(--foreground) 12%, transparent)"

/** Messages by weekday and hour over the last week (sample): the 24-hour shape, busier on weekdays. */
const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const DAY_FACTOR = [1, 1.1, 0.95, 1.15, 0.9, 0.45, 0.35]
const WEEK_ACTIVITY = DAY_FACTOR.map((f, d) => HOURS.map((v, h) => Math.round(v * f * (1 + (((d * 7 + h * 3) % 5) - 2) * 0.08))))

/** Activity of the last 24 h: one thin bar per hour, height = messages, the latest hour in the accent. */
function HourTicks({ values, height = 28, className }: { values: number[]; height?: number; className?: string }) {
  const [hover, setHover] = useState<number>()
  const max = Math.max(...values, 1)
  const last = values.length - 1
  return (
    <div className={cn("relative flex items-end gap-[2px]", className)} style={{ height }} onPointerLeave={() => setHover(undefined)}>
      {values.map((v, i) => (
        <span key={i} className="flex h-full flex-1 items-end" onPointerEnter={() => setHover(i)}>
          <span
            className="w-full rounded-[1px]"
            style={{ height: `${Math.max(8, (v / max) * 100)}%`, background: v === 0 ? TRACK : i === last || i === hover ? ACCENT : GREY[2] }}
          />
        </span>
      ))}
      {hover !== undefined && <Tip x={((hover + 0.5) / values.length) * 100} y={100 - (values[hover] / max) * 100} label={hover === last ? "Last hour" : `${last - hover} h ago`} value={`${values[hover]} msgs`} />}
    </div>
  )
}

const channelLegend = (rows: typeof CHANNELS, empty: boolean) =>
  rows.map((c, i) => ({ color: i === 0 && !empty ? ACCENT : GREY[Math.min(i, 3)], label: c.name, value: empty ? "Quiet" : `${c.unread} new` }))

/**
 * Discord: online (who's around and the last 24 h), card (channels with what's
 * new), banner (one row with a Join button), join (link your Discord in one
 * click; the role follows your tier; the Community page's default).
 */
export function Discord({ variant = "online", props }: WidgetProps) {
  const { coach } = useCoach()
  const empty = useEmpty()
  const more = useMore("standard")
  const detailed = useMore("detailed")
  const text = String(props.text || "Live chat, trade ideas and Q&A with the group.")
  const members = `${DISCORD.members.toLocaleString("en")} members`
  const newChip = empty ? undefined : <Chip>{UNREAD} new</Chip>
  const join = (
    <Button size="sm" className="shrink-0">
      Join
    </Button>
  )

  if (variant === "banner") {
    return (
      <WCard
        row
        icon={MessageSquareText}
        title="Discord"
        meta={empty ? "Be the first one in" : detailed ? `${DISCORD.online} online · ${members} · ${text}` : more ? `${DISCORD.online} online · ${CHANNELS[0].unread} new in ${CHANNELS[0].name}` : `${DISCORD.online} online`}
        chip={newChip}
      >
        {!empty && <AvatarStack initials={DISCORD.avatars.slice(0, 4)} className="hidden shrink-0 @lg:flex" />}
        {join}
      </WCard>
    )
  }

  if (variant === "join") {
    // The student's tier comes from the URL (preview as a tier), which Next.js only reads inside Suspense.
    return (
      <Suspense fallback={<WidgetEmpty icon={MessageSquareText} title="Discord" text="Loading…" />}>
        <DiscordJoin />
      </Suspense>
    )
  }

  if (variant === "heatmap") {
    const max = Math.max(...WEEK_ACTIVITY.flat(), 1)
    const total = WEEK_ACTIVITY.flat().reduce((a, b) => a + b, 0)
    // The current hour: Monday, the last hour of the sample day.
    const now: [number, number] = [0, HOURS.length - 1]
    return (
      <WCard icon={MessageSquareText} title="Discord activity" meta={empty ? "Be the first one in" : `${coach.name} · last 7 days · your time zone`} chip={newChip} bodyClassName={SPLIT}>
        <Drop level={2}>
          {more && <Num size="md" value={empty ? 0 : total.toLocaleString("en")} unit="messages" delta={empty ? undefined : `${DISCORD.online} online now`} deltaTone="muted" />}
        </Drop>
        <div data-main className="flex min-h-min flex-1 flex-col">
          <HeatGrid
            rowLabels={WEEK_DAYS.map((d) => d.slice(0, 2))}
            colLabels={HOURS.map((_, h) => (h % 6 === 0 ? String(h).padStart(2, "0") : undefined))}
            rows={WEEK_ACTIVITY.map((r, d) =>
              r.map((v, h) => ({
                fill: empty ? undefined : d === now[0] && h === now[1] ? ACCENT : heatShade(v / max),
                title: `${WEEK_DAYS[d]} ${String(h).padStart(2, "0")}:00 · ${empty ? 0 : v} messages`,
              })),
            )}
          />
        </div>
        <Drop level={3}>
          {detailed && !empty && <Legend className="shrink-0" items={[{ color: GREY[0], label: "Busiest", value: "weekdays 17:00–23:00" }, { color: ACCENT, label: "Now", value: `${HOURS[HOURS.length - 1]} msgs this hour` }]} />}
        </Drop>
      </WCard>
    )
  }

  if (variant === "card") {
    const rows = CHANNELS.slice(0, detailed ? 5 : more ? 3 : 2)
    return (
      <WCard icon={MessageSquareText} title="Discord" meta={empty ? `${coach.name} · ${members}` : `${rows.length} channels · since your last visit`} chip={newChip}>
        <Num size="md" value={empty ? 0 : UNREAD} unit="new messages" delta={!empty && more ? `${DISCORD.online} online` : undefined} deltaTone="muted" />
        <HatchBar parts={empty ? [] : CHANNELS.slice(0, 3).map((c, i) => ({ value: c.unread, color: i === 0 ? ACCENT : GREY[i + 1] }))} total={empty ? 1 : UNREAD} height={8} />
        <Drop level={2}>
          {more && <Legend items={channelLegend(rows, empty)} />}
        </Drop>
        <Drop level={3}>
          {detailed && <p className={cn(TYPE.body, "line-clamp-2 text-muted-foreground")}>{text}</p>}
        </Drop>
        <Button size="sm" className="mt-auto w-fit">
          Open Discord <ArrowUpRight />
        </Button>
      </WCard>
    )
  }

  return (
    <WCard icon={MessageSquareText} title="Discord" meta={empty ? "Be the first one in" : `${coach.name} · ${members}`} chip={newChip} bodyClassName="gap-2">
      <div className="flex min-w-0 items-end justify-between gap-3">
        <Num value={empty ? 0 : DISCORD.online} unit="online" delta={empty ? undefined : "+18 vs yesterday"} deltaTone="muted" />
        {!empty && <AvatarStack initials={DISCORD.avatars.slice(0, 5)} className="hidden shrink-0 pb-1 @[17rem]:flex" />}
      </div>
      <div className="mt-auto grid gap-1">
        <HourTicks values={empty ? HOURS.map(() => 0) : HOURS} height={more ? 24 : 20} />
        <Drop level={2}>
          {more && <Axis labels={["24 h ago", "12 h", "now"]} />}
        </Drop>
      </div>
      <Drop level={3}>
        {detailed && (
          <>
            <Rule />
            <Legend items={channelLegend(CHANNELS.slice(0, 3), empty)} />
          </>
        )}
      </Drop>
    </WCard>
  )
}

/** Discord's Join card: link your Discord in one click; the role follows your tier. */
function DiscordJoin() {
  const { coach } = useCoach()
  const tier = useStudentTier()
  const [linked, setLinked] = useCommunityData(coach.slug, "discord-linked", false)
  const [busy, setBusy] = useState(false)
  const empty = useEmpty()
  const more = useMore("standard")
  const detailed = useMore("detailed")
  const members = `${DISCORD.members.toLocaleString("en")} members`
  const newChip = empty ? undefined : <Chip>{UNREAD} new</Chip>
  const role = coach.tiers.find((t) => t.id === tier)?.name ?? coach.tiers[0]?.name ?? "member"
  const join = () => {
    setBusy(true)
    setTimeout(() => {
      setLinked(true)
      setBusy(false)
      toast("Discord linked", { description: `You got the ${role} role and the private channels.` })
    }, 900)
  }
  return (
    <WCard icon={MessageSquareText} title={`${coach.org} on Discord`} meta={`${DISCORD.online} online · ${members}`} chip={linked ? <Chip>{role}</Chip> : newChip}>
      <Drop level={1}>
        <AvatarStack initials={DISCORD.avatars.slice(0, more ? 6 : 4)} />
      </Drop>
      {/* What's new per channel only once they're in; before that, just the channel names. */}
      <Drop level={2}>
        {more && <Legend items={channelLegend(CHANNELS.slice(0, detailed ? 5 : 3), empty).map((c) => (linked ? c : { ...c, value: undefined }))} />}
      </Drop>
      {linked ? (
        <div className="mt-auto grid gap-2">
          <span className="flex items-center gap-1.5 text-[0.6875rem] leading-4">
            <Check className="size-3.5" style={{ color: ACCENT_TEXT }} /> Linked. You have the {role} role.
          </span>
          <Button size="sm" variant="outline" className="w-fit">
            Open Discord <ArrowUpRight />
          </Button>
        </div>
      ) : (
        <div className="mt-auto grid gap-2">
          <Button size="sm" className="w-fit" disabled={busy} onClick={join}>
            {busy ? "Opening Discord…" : "Join with Discord"}
          </Button>
          <Drop level={3}>
            {detailed && <span className={TYPE.small}>Real-time chat stays on Discord. Your role follows your membership.</span>}
          </Drop>
        </div>
      )}
    </WCard>
  )
}
