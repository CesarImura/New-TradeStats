import type { Detail, Emphasis } from "@/lib/widgets/layout"
import type { HeaderForm, WidgetHeader } from "@/lib/theme/types"
import { styleParts } from "@/components/widgets/registry"

/*
 * What the inspector offers a widget: only the choices that change it. Every option was clicked on every layout of
 * every widget and the card compared before and after (Terminal, Atelier and Pulse, light and dark); a choice a layout
 * ignores is listed in OFF (and NO_NOTE), by widget ("faq") or by layout ("faq:row"). A new widget offers everything until it is
 * checked the same way. The header's icon and description also depend on the title style and on Shows (WCard), so
 * those two follow headerParts below.
 */

type Off = "less" | "more" | "quiet" | "star" | "title-style" | "header" | "title" | "chart" | "figure" | "note" | "value"

const OFF: Record<string, Off[]> = {
  "ai-ask:chat": ["chart"],
  "ai-ask:search": ["quiet"],
  "announcement:media": ["chart", "header", "quiet"],
  "announcement:plain": ["chart"],
  "announcement:post": ["chart", "quiet"],
  "banner:headline": ["value"],
  "banner:picture": ["value"],
  "banner:slim": ["header", "quiet"],
  "book-call:allowance": ["less"],
  "book-call:split": ["chart", "header"],
  "button:filled": ["less", "more", "quiet", "title", "value"],
  "button:outline": ["less", "more", "quiet", "title", "value"],
  "button:row": ["header", "more", "quiet"],
  "check-in:mood": ["value"],
  "check-in:notes": ["less", "value"],
  "coach-feedback:stats": ["less"],
  "coach-feedback:thread": ["chart"],
  "coach-profile:hero": ["value"],
  "coach-profile:media": ["quiet", "title", "value"],
  "community-feed:line": ["title", "title-style"],
  "continue-lesson:card": ["header"],
  "continue-lesson:media": ["title", "value"],
  "countdown:big": ["less", "quiet", "value"],
  "countdown:card": ["value"],
  "countdown:line": ["header", "more", "quiet"],
  "discord:banner": ["chart", "figure", "quiet", "title", "title-style"],
  "discord:join": ["chart"],
  "embed:page": ["less", "more", "quiet", "title", "value"],
  "embed:row": ["header", "more", "quiet"],
  "embed:video": ["header", "less", "more", "quiet"],
  "faq:list": ["less", "quiet", "value"],
  "faq:row": ["less", "more", "quiet", "title", "title-style"],
  "faq:two": ["less", "value"],
  "hero:split": ["title", "value"],
  "image:caption": ["header", "less", "more", "quiet"],
  "image:cover": ["header", "less", "more", "quiet"],
  "image:side": ["more", "title", "value"],
  "latest-downloads:list": ["quiet", "value"],
  "latest-downloads:row": ["header", "more", "quiet"],
  "latest-downloads:tiles": ["value"],
  "links:list": ["less", "quiet"],
  "links:row": ["more", "quiet", "title"],
  "my-rank:leaderboard": ["more"],
  "partner-links:chips": ["title"],
  "partner-links:list": ["quiet"],
  "partner-links:tiles": ["quiet"],
  "pnl-by-instrument:table": ["quiet"],
  "pnl-by-weekday:heatmap": ["quiet", "value"],
  "r-distribution:summary": ["value"],
  "recent-trades:list": ["quiet"],
  "rules-followed:compare": ["chart"],
  "rules-followed:grid": ["chart"],
  "rules-followed:hero": ["chart", "title-style"],
  "shelf:grid": ["value"],
  "shelf:row": ["value"],
  "text:plain": ["quiet", "value"],
  "text:quote": ["less", "value"],
  "text:steps": ["value"],
  "trading-streak:streak": ["value"],
  "upgrade:banner": ["chart", "figure", "header", "quiet"],
  "watchlist:list": ["value"],
  "welcome-video:minimal": ["chart"],
  "welcome-video:side": ["chart"],
  "win-rate-trend:compare": ["value"],
  "win-rate-trend:trend": ["value"],
}

/** Layouts that draw no room for the coach's own text, button and picture (no Note in their card). */
const NO_NOTE = ["announcement:media", "book-call:split", "button", "coach-profile:compact", "coach-profile:media", "continue-lesson:media", "drawdown:hero", "embed", "hero", "image", "journal-pnl:hero", "my-rank", "next-live:split", "rules-followed:hero", "upgrade:split"]

export type WidgetCaps = {
  /** The levels of Shows that look different; fewer than two and the row is left out. */
  shows: Detail[]
  /** The Stand out choices that look different. */
  standOut: Emphasis[]
  /** It has a header the coach can change at all (one-row cards keep a fixed one). */
  header: boolean
  titleStyle: boolean
  chart: boolean
  figure: boolean
  /** The coach's own text, button and picture show on it. */
  note: boolean
  /** The header's title can be turned off (a one-row card keeps it: there it is the content). */
  title: boolean
  /** It has a value chip in the header. */
  value: boolean
}

export function capsOf(type: string, variant: string): WidgetCaps {
  const off = new Set([...(OFF[type] ?? []), ...(OFF[`${type}:${variant}`] ?? [])])
  const parts = styleParts(type)
  return {
    shows: (["compact", "standard", "detailed"] as const).filter((d) => !(d === "compact" && off.has("less")) && !(d === "detailed" && off.has("more"))),
    standOut: (["quiet", "accent", "star"] as const).filter((e) => !off.has(e as Off)),
    header: !off.has("header"),
    titleStyle: !off.has("header") && !off.has("title-style"),
    chart: parts.chart && !off.has("chart"),
    figure: parts.figure && !off.has("figure"),
    note: !off.has("note") && !NO_NOTE.includes(type) && !NO_NOTE.includes(`${type}:${variant}`),
    title: !off.has("title"),
    value: !off.has("value"),
  }
}

/**
 * The header parts that can show on this widget right now: the icon only under a Top or Tag title (Label, Caption and
 * Path carry none), the grey description only when it shows More (WCard keeps it as the title's tooltip otherwise).
 */
export function headerParts(caps: WidgetCaps, form: HeaderForm, detail: Detail): (keyof WidgetHeader)[] {
  return [
    ...(form === "top" || form === "tag" ? (["icon"] as const) : []),
    ...(caps.title ? (["title"] as const) : []),
    ...(detail === "detailed" ? (["description"] as const) : []),
    ...(caps.value ? (["value"] as const) : []),
  ]
}
