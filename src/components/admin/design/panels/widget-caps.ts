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

type Off = "less" | "more" | "quiet" | "star" | "title-style" | "header" | "title" | "icon" | "description" | "chart" | "figure" | "note" | "value"

const OFF: Record<string, Off[]> = {
  "ai-ask:chat": ["chart"],
  "ai-ask:insight": ["chart"],
  "ai-ask:search": ["quiet"],
  "announcement:line": ["chart", "note", "title", "title-style"],
  "announcement:media": ["chart", "header", "quiet"],
  "announcement:plain": ["chart"],
  "announcement:post": ["chart", "quiet"],
  "banner:headline": ["description", "icon", "more", "value"],
  "banner:picture": ["description", "icon", "value"],
  "banner:slim": ["header", "note", "quiet"],
  "book-call:allowance": ["less"],
  "book-call:split": ["chart", "header"],
  "button:filled": ["icon", "less", "more", "quiet", "title", "title-style", "value"],
  "button:outline": ["icon", "less", "more", "quiet", "title", "title-style", "value"],
  "button:row": ["header", "less", "more", "quiet"],
  "check-in:mood": ["value"],
  "check-in:notes": ["less", "value"],
  "coach-feedback:stats": ["less"],
  "coach-feedback:thread": ["chart"],
  "coach-profile:compact": ["figure", "header"],
  "coach-profile:hero": ["value"],
  "coach-profile:media": ["description", "icon", "quiet", "title", "title-style", "value"],
  "community-feed:line": ["note", "title", "title-style"],
  "continue-lesson:card": ["header", "note"],
  "continue-lesson:media": ["chart", "description", "icon", "title", "title-style", "value"],
  "countdown:big": ["less", "quiet", "value"],
  "countdown:card": ["value"],
  "countdown:line": ["header", "more", "note", "quiet"],
  "course-progress:rings": ["chart", "description"],
  "course-progress:unlocks": ["description", "icon", "less"],
  "discord:banner": ["chart", "figure", "note", "quiet", "title", "title-style"],
  "discord:heatmap": ["chart"],
  "discord:join": ["chart"],
  "discord:online": ["chart"],
  "drawdown:bars": ["description", "icon"],
  "drawdown:curve": ["chart"],
  "drawdown:hero": ["chart", "description", "icon", "title-style"],
  "econ-news:timeline": ["chart"],
  "econ-news:week": ["chart"],
  "embed:page": ["icon", "less", "more", "quiet", "title", "title-style", "value"],
  "embed:row": ["header", "more", "quiet"],
  "embed:video": ["header", "less", "more", "quiet"],
  "faq:list": ["less", "quiet", "value"],
  "faq:row": ["less", "more", "note", "quiet", "title", "title-style"],
  "faq:two": ["less", "value"],
  "first-week:path": ["chart"],
  "first-week:ring": ["chart", "note", "title", "title-style", "value"],
  "hero:featured": ["header"],
  "hero:image": ["header", "more"],
  "hero:split": ["description", "icon", "more", "title", "title-style", "value"],
  "hero:video": ["header", "more"],
  "image:caption": ["header", "less", "more", "quiet"],
  "image:cover": ["header", "less", "more", "quiet"],
  "image:side": ["icon", "more", "title", "title-style", "value"],
  "journal-pnl:curve": ["value"],
  "journal-pnl:hero": ["description", "icon", "title-style"],
  "latest-downloads:list": ["quiet", "value"],
  "latest-downloads:row": ["header", "more", "note", "quiet"],
  "latest-downloads:tiles": ["value"],
  "links:list": ["less", "quiet"],
  "links:row": ["less", "more", "note", "quiet", "title", "title-style"],
  "my-rank:hero": ["description", "icon", "title-style"],
  "my-rank:leaderboard": ["less"],
  "next-live:split": ["chart", "description", "icon"],
  "next-live:week": ["chart"],
  "partner-links:chips": ["note", "title", "title-style"],
  "partner-links:list": ["quiet"],
  "partner-links:tiles": ["quiet"],
  "pnl-by-instrument:table": ["quiet"],
  "pnl-by-weekday:heatmap": ["quiet", "value"],
  "r-distribution:summary": ["value"],
  "recent-trades:list": ["quiet"],
  "rules-followed:compare": ["chart"],
  "rules-followed:grid": ["chart"],
  "rules-followed:hero": ["chart", "description", "title-style"],
  "rules-followed:streak": ["chart"],
  "shelf:carousel": ["description", "value"],
  "shelf:grid": ["value"],
  "shelf:row": ["value"],
  "text:plain": ["quiet", "value"],
  "text:quote": ["less", "value"],
  "text:steps": ["value"],
  "trading-streak:streak": ["value"],
  "upgrade:banner": ["chart", "figure", "header", "note", "quiet"],
  "upgrade:compare": ["chart"],
  "upgrade:split": ["chart", "figure", "header"],
  "watchlist:list": ["value"],
  "welcome-video:minimal": ["chart"],
  "welcome-video:side": ["chart"],
  "win-rate-trend:compare": ["value"],
  "win-rate-trend:trend": ["less", "value"],
}

/** Layouts that draw no room for the coach's own text, button and picture (no Note in their card). */
const NO_NOTE = ["announcement:media", "book-call:split", "button", "coach-profile:compact", "coach-profile:media", "continue-lesson:media", "drawdown:hero", "embed", "hero", "image", "journal-pnl:hero", "my-rank:hero", "next-live:split", "rules-followed:hero", "upgrade:split"]

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
  /** The header's icon (under a Top or Tag title) and its description (with More) show on this layout at all. */
  icon: boolean
  description: boolean
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
    icon: !off.has("icon"),
    description: !off.has("description"),
  }
}

/**
 * The header parts that can show on this widget right now: the icon only under a Top or Tag title (Label, Caption and
 * Path carry none), the grey description only when it shows More (WCard keeps it as the title's tooltip otherwise).
 */
export function headerParts(caps: WidgetCaps, form: HeaderForm, detail: Detail): (keyof WidgetHeader)[] {
  return [
    ...((form === "top" || form === "tag") && caps.icon ? (["icon"] as const) : []),
    ...(caps.title ? (["title"] as const) : []),
    ...(detail === "detailed" && caps.description ? (["description"] as const) : []),
    ...(caps.value ? (["value"] as const) : []),
  ]
}
