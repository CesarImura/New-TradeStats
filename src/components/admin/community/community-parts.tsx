"use client"

import { Switch } from "@/components/ui/switch"
import { ANNOUNCEMENTS, DISCORD_ROLES } from "@/lib/data/people"

export type Announcement = (typeof ANNOUNCEMENTS)[number] & { tiers?: string[]; scheduled?: string; space?: string }
export type DiscordSetup = { connected: boolean; roles: Record<string, string>; posts: Record<string, boolean>; removeOnCancel: boolean }
export const DEFAULT_DISCORD: DiscordSetup = {
  connected: true,
  roles: Object.fromEntries(DISCORD_ROLES.map((r) => [r.tier, r.role])),
  posts: { lesson: true, live: true, announcement: true, chart: false },
  removeOnCancel: true,
}
/** A community made in setup starts without Discord (the demo ones have it connected). */
export const NO_DISCORD: DiscordSetup = { ...DEFAULT_DISCORD, connected: false }
export const NO_ANNOUNCEMENTS: Announcement[] = []
export const SERVER_ROLES = ["@inner-circle", "@core", "@desk", "@vip", "@members", "@funded", "No role"]
export const CHANNELS = [
  { id: "platform", label: "Platform", post: "On the platform" },
  { id: "email", label: "E-mail", post: "By e-mail" },
  { id: "discord", label: "Discord", post: "In Discord" },
] as const
export const BOT_POSTS = [
  ["lesson", "New lesson published", "#announcements", "Posts to the platform when a new lesson goes live."],
  ["live", "A live session starts", "#live", "Heads-up 15 minutes before a livestream starts."],
  ["chart", "A new marked-up chart", "#charts", "Posts the chart as a notice with its levels."],
] as const

export type Report = { id: string; title: string; where: string; reason: string; reports: number; when: string }
export const REPORTS: Report[] = [
  { id: "r1", title: "Signal for NQ at 21 480", where: "#trade-ideas · Dani P.", reason: "Signals or copy-trading", reports: 2, when: "10 min ago" },
  { id: "r2", title: "Join my paid group", where: "#general · New member", reason: "Promotion of other groups", reports: 3, when: "1 h ago" },
  { id: "r3", title: "That call was garbage", where: "#wins-and-lessons · Sam K.", reason: "Unkind to a member", reports: 1, when: "Yesterday" },
  { id: "r4", title: "Screenshot of my P&L", where: "#trade-ideas · Lea M.", reason: "Off topic", reports: 1, when: "Mon 10 Nov" },
]
export const NO_REPORTS: Report[] = []
export const MOD_RULES = [
  ["first", "Hold a member's first post", "New members' first post waits for a moderator.", true],
  ["hide", "Hide after 3 reports", "Posts reported three times are hidden until reviewed.", true],
  ["mail", "Notify me of new reports", "Get an e-mail when a post is reported.", false],
] as const

/** A rule with its switch, on a bordered card (Figma 'Switch row'). */
export function SwitchCard({ label, text, checked, onChange }: { label: string; text: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-2 rounded-a-md border border-a-border-subtle px-4 py-3">
      <span className="grid gap-0.5">
        <span className="t-body-m text-a-text">{label}</span>
        <span className="t-caption text-a-text-2">{text}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  )
}
