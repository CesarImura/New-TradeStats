import type { Detail, Emphasis } from "@/lib/widgets/layout"
import { starStyleOf, type CoachTheme, type HeaderForm, type TemplateId, type WidgetHeader } from "@/lib/theme/types"
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

/**
 * Layouts where Stand out → Star draws nothing different under a Spotlight Star (the default of Terminal and Pulse: a plain
 * card with the figure at Star size), by template: they have no figure to make bigger, or its Star size does not show. Brand and
 * Inverted Star fill the card, so they change every layout. Measured as pictures, one card at a time, in Terminal (the demo
 * coach's own, Soft style), Pulse and Atelier (dark, Comfortable): scripts/widget-bench/custom/star-pixels.mjs.
 */
const SPOTLIGHT_NO_STAR: Partial<Record<TemplateId, string[]>> = {
  terminal: ["banner:headline", "banner:picture", "banner:slim", "button:filled", "button:outline", "button:row", "check-in:mood", "check-in:notes", "coach-profile:compact", "coach-profile:hero", "countdown:big", "countdown:card", "embed:page", "embed:row", "embed:video", "faq:list", "faq:two", "hero:image", "hero:split", "hero:video", "image:caption", "image:cover", "image:side", "pnl-by-weekday:heatmap", "shelf:carousel", "shelf:grid", "shelf:row", "text:plain", "text:quote", "text:steps", "upgrade:split", "watchlist:list", "win-rate-trend:compare"],
  pulse: ["banner:slim", "button:filled", "button:outline", "button:row", "coach-profile:compact", "embed:page", "embed:row", "embed:video", "hero:image", "hero:split", "hero:video", "image:caption", "image:cover", "image:side", "upgrade:split"],
}

/** `theme`: the Star of the theme the widget is in (Spotlight draws it only where there is a figure). Without it Star is offered wherever the layout allows it. */
export function capsOf(type: string, variant: string, theme?: Pick<CoachTheme, "template" | "widgetStyle" | "starStyle">): WidgetCaps {
  const off = new Set([...(OFF[type] ?? []), ...(OFF[`${type}:${variant}`] ?? [])])
  if (theme && starStyleOf(theme) === "spotlight" && SPOTLIGHT_NO_STAR[theme.template]?.includes(`${type}:${variant}`)) off.add("star")
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
