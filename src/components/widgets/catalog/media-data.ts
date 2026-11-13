"use client"

import { useCoach } from "@/components/coach/coach-provider"
import { useViewerTier } from "@/lib/data/access"
import { canAccess, courseStats, openLessons, resumeLesson, studentCourses, useCatalog, useProgress } from "@/lib/data/learning"
import { categoryLabel, isRecent, useDownloads } from "@/lib/data/downloads"
import { webUrl } from "./brand"
import { inWords, useEmpty, type WidgetProps } from "../parts/shared"

// Media widgets (Shelf, Featured): their data. What a card shows, what the coach saved for it, where the cards come
// from, and the Featured slides. Kept apart from the drawing (poster.tsx, shelf.tsx, featured.tsx) so the Design
// editor reads it without the carousels.

export type Shape = "portrait" | "landscape" | "photo" | "classic" | "square"

/** Parts of a card the coach can switch off. */
export type Part = "kicker" | "title" | "tags" | "text" | "progress" | "button" | "facts"

/** One poster: what it is, where it goes and what the student has done with it. */
export type MediaItem = {
  id: string
  title: string
  /** A short line under the title (a tagline, a duration). */
  sub?: string
  tags: string[]
  /** Series colour index for the sample artwork. */
  tone: number
  href: string
  /** 0 to 100, or undefined when progress means nothing (a download). */
  pct?: number
  /** What the line under the poster says: "0% complete", "12 min left". */
  status?: string
  locked?: string
  fresh?: boolean
  /** A small line above the title ("No. 01"). */
  kicker?: string
  picture?: string
  /** The button's words, when the coach wrote one. */
  button?: string
  /** Short facts ("12 lessons", "1 h 54 min"). */
  facts?: string[]
  off?: Part[]
}

/** What the coach saved for one card or slide. Empty fields fall back to the course, lesson or file it points at. */
export type MediaEntry = {
  id: string
  /** The course, lesson or file this card shows; none for the coach's own card. */
  ref?: string
  hidden?: boolean
  kicker?: string
  title?: string
  text?: string
  /** Comma separated. */
  tags?: string
  /** "" or 0 to 100. */
  pct?: string
  status?: string
  badge?: "" | "new" | "none"
  button?: string
  /** A page id, or "url" with `url`. */
  target?: string
  url?: string
  button2?: string
  target2?: string
  url2?: string
  /** Comma separated. */
  facts?: string
  off?: Part[]
}

/** The prop that holds an entry's picture. */
export const imgKey = (id: string) => `img-${id}`

/** The saved list, or null when the coach never edited it (the widget then shows its source as it is). */
export function parseEntries(raw: unknown): MediaEntry[] | null {
  if (typeof raw !== "string" || !raw.startsWith("[")) return null
  try {
    const list = JSON.parse(raw) as MediaEntry[]
    return Array.isArray(list) ? list.filter((e) => e && typeof e.id === "string") : null
  } catch {
    return null
  }
}

const words = (s?: string) =>
  (s ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)

/** Where a card or button goes: one of the coach's pages, or a web address. */
export const hrefOf = (base: string, target?: string, url?: string) => (target === "url" ? (webUrl(url)?.href ?? "#") : `${base}/${target || "courses"}`)

/**
 * The cards in the coach's order: each saved entry over the item it points at, the coach's own cards as they are,
 * then (on a Shelf) anything published since that the list doesn't mention yet. Hidden entries stay out.
 */
export function applyEntries(base: MediaItem[], entries: MediaEntry[] | null, props: WidgetProps["props"], root: string, appendNew = true): MediaItem[] {
  if (!entries) return base.map((b) => ({ ...b, picture: str(props[imgKey(b.id)]) || b.picture }))
  const byId = new Map(base.map((b) => [b.id, b]))
  const seen = new Set(entries.map((e) => e.ref).filter(Boolean))
  const out: MediaItem[] = []
  entries.forEach((e, i) => {
    const b = e.ref ? byId.get(e.ref) : undefined
    if (e.ref && !b) return
    if (e.hidden) return
    const pct = e.pct !== undefined && e.pct !== "" && !Number.isNaN(Number(e.pct)) ? Math.max(0, Math.min(100, Math.round(Number(e.pct)))) : b?.pct
    out.push({
      id: e.id,
      title: e.title || b?.title || "",
      sub: e.text || b?.sub,
      tags: e.tags !== undefined && e.tags !== "" ? words(e.tags) : (b?.tags ?? []),
      tone: b?.tone ?? i,
      href: e.target ? hrefOf(root, e.target, e.url) : (b?.href ?? hrefOf(root)),
      pct,
      status: e.status || (pct !== undefined && pct !== b?.pct ? `${pct}% complete` : b?.status),
      locked: b?.locked,
      fresh: e.badge === "new" ? true : e.badge === "none" ? false : b?.fresh,
      kicker: e.kicker || b?.kicker,
      picture: str(props[imgKey(e.id)]) || b?.picture,
      button: e.button || b?.button,
      facts: e.facts !== undefined && e.facts !== "" ? words(e.facts) : b?.facts,
      off: e.off,
    })
  })
  if (appendNew) for (const b of base) if (!seen.has(b.id) && !entries.some((e) => e.id === b.id)) out.push({ ...b, picture: str(props[imgKey(b.id)]) || b.picture })
  return out
}

const str = (v: unknown) => (typeof v === "string" && v ? v : undefined)
/** Whether a card shows a part the coach can switch off. */
export const shows = (it: { off?: Part[] }, part: Part) => !it.off?.includes(part)

export type Source = "courses" | "lessons" | "downloads" | "own"

/** The default poster shape for each source: courses as posters, lessons as frames, files as squares. */
export const SHAPE_OF: Record<Source, Shape> = { courses: "portrait", lessons: "landscape", downloads: "square", own: "portrait" }

/** The posters a source gives, from the coach's catalogue, the student's progress or the coach's files. */
export function useMediaItems(source: Source): { items: MediaItem[]; title: string; href: string } {
  const { coach, base, preview } = useCoach()
  const catalog = useCatalog(coach, preview)
  const progress = useProgress(coach.slug)
  const tier = useViewerTier(coach)
  const files = useDownloads(coach)
  const empty = useEmpty()
  const courses = studentCourses(catalog)
  const needs = (tiers: string[]) => coach.tiers.find((t) => t.id === tiers[0])?.name ?? "Locked"

  if (source === "own") return { items: [], title: "Featured", href: `${base}/courses` }

  if (source === "downloads") {
    const items = [...files]
      .sort((a, b) => b.updated.localeCompare(a.updated))
      .map((d, i): MediaItem => ({
        id: d.id,
        title: d.title,
        kicker: categoryLabel(d.category),
        sub: d.description,
        tags: [categoryLabel(d.category), d.file.type],
        tone: d.cover ?? i,
        href: `${base}/downloads`,
        status: `${d.file.type} · ${d.file.size}`,
        locked: d.tiers.length && !(tier && d.tiers.includes(tier)) ? needs(d.tiers) : undefined,
        fresh: isRecent(d.updated),
        facts: [d.file.type, d.file.size],
      }))
    return { items: empty ? [] : items, title: coach.wording.downloads, href: `${base}/downloads` }
  }

  if (source === "lessons") {
    // Continue watching: the next lesson of each open course, then the rest of the current one.
    const p = empty ? { ...progress, done: [] } : progress
    const items = courses
      .filter((c) => canAccess(c, tier))
      .flatMap((c) => {
        const next = resumeLesson(c, p)
        const open = openLessons(c)
        const at = next ? open.findIndex((l) => l.id === next.lesson.id) : -1
        return open.slice(Math.max(at, 0), Math.max(at, 0) + 3).map((l, n): MediaItem => {
          // The lesson in progress shows how far in the student is; the next ones are fresh.
          const pct = n === 0 && at > 0 ? 35 : 0
          return {
            id: `${c.id}-${l.id}`,
            kicker: c.title,
            title: l.title,
            sub: l.summary ?? c.title,
            tags: [c.title],
            tone: c.color,
            href: `${base}/courses/${c.id}/${l.id}`,
            pct,
            status: pct ? `${Math.round((l.minutes * (100 - pct)) / 100)} min left` : `${l.minutes} min`,
            facts: [`${l.minutes} min`],
          }
        })
      })
    return { items, title: "Continue watching", href: `${base}/courses` }
  }

  const items = courses.map((c, i): MediaItem => {
    const st = courseStats(c, empty ? { ...progress, done: [] } : progress)
    const locked = canAccess(c, tier) ? undefined : needs(c.tiers)
    return {
      id: c.id,
      kicker: `No. ${String(i + 1).padStart(2, "0")}`,
      title: c.title,
      sub: c.tagline,
      tags: [c.area, `${st.lessons} lessons`],
      tone: c.color,
      href: `${base}/courses/${c.id}`,
      pct: locked ? undefined : st.pct,
      locked,
      status: locked ? `${st.lessons} lessons · ${inWords(st.minutes)}` : `${st.pct}% complete`,
      facts: [`${st.lessons} lessons`, inWords(st.minutes)],
    }
  })
  return { items, title: coach.wording.courses, href: `${base}/courses` }
}

const asSource = (v: unknown): Source => (["courses", "lessons", "downloads", "own"].includes(String(v)) ? (v as Source) : "courses")

/** The Shelf's cards as the student sees them: its source, in the coach's order, with the coach's changes and own cards. */
export function useShelfCards(props: WidgetProps["props"]) {
  const { base } = useCoach()
  const source = asSource(props.source)
  const { items, title, href } = useMediaItems(source)
  const entries = parseEntries(props.cards)
  return { source, base: items, cards: applyEntries(items, entries, props, base), entries, title, href }
}

/** Seconds between steps when a Shelf or Featured plays on its own. */
export const everyOf = (props: WidgetProps["props"], fallback: number) => Math.min(20, Math.max(3, Number(props.every) || fallback))
/** Automatic or by the buttons (older pages saved a switch). */
export const autoOf = (props: WidgetProps["props"], fallback: boolean) => (props.play === "auto" ? true : props.play === "manual" ? false : props.autoplay === true || fallback)

export type Slide = {
  id: string
  picture?: string
  tone: number
  eyebrow?: string
  tags: string[]
  title?: string
  text?: string
  facts: string[]
  pct?: number
  button?: { label: string; href: string }
  button2?: { label: string; href: string }
}

/** At most this many slides in a Featured hero (pictures live in the coach's browser storage). */
export const MAX_SLIDES = 6
/** At most this many cards on a Shelf. */
export const MAX_CARDS = 12

/** The slides a Featured hero starts with: the coach's older headline, then their courses. */
export function useDefaultSlides(props: WidgetProps["props"]) {
  const { base, coach } = useCoach()
  const { items } = useMediaItems("courses")
  const legacy: MediaItem[] =
    props.title || props.image
      ? [{ id: "own", title: String(props.title || "Trade with a plan"), kicker: String(props.eyebrow || ""), sub: String(props.text || ""), tags: [], tone: 0, picture: str(props.image), href: hrefOf(base, String(props.target || "courses"), str(props.url)), button: String(props.button || "Start here") }]
      : []
  const courses = items.slice(0, legacy.length ? 3 : 4).map((c) => ({ ...c, kicker: c.locked ? `Needs ${c.locked}` : c.fresh ? "New" : coach.wording.courses, tags: c.tags.slice(0, 1), button: c.locked ? "See what it includes" : c.pct ? "Continue" : "Start" }))
  return [...legacy, ...courses]
}

/** The Featured slides as the student sees them: the defaults, or the coach's own list. */
export function useSlides(props: WidgetProps["props"]): Slide[] {
  const { base } = useCoach()
  const defaults = useDefaultSlides(props)
  const entries = parseEntries(props.cards)
  const byEntry = new Map(entries?.map((e) => [e.id, e]))
  // Once the coach has a list, it is the whole list: new courses don't slip into the hero.
  return applyEntries(defaults, entries, props, base, false)
    .slice(0, MAX_SLIDES)
    .map((it) => {
      const e = byEntry.get(it.id)
      const on = (p: Part) => shows(it, p)
      const label = on("button") ? it.button : undefined
      return {
        id: it.id,
        picture: it.picture,
        tone: it.tone,
        eyebrow: on("kicker") ? it.kicker || undefined : undefined,
        tags: on("tags") ? it.tags : [],
        title: on("title") ? it.title || undefined : undefined,
        text: on("text") ? it.sub || undefined : undefined,
        facts: on("facts") ? (it.facts ?? []) : [],
        pct: on("progress") ? it.pct : undefined,
        button: label ? { label, href: it.href } : undefined,
        button2: e?.button2 && on("button") ? { label: e.button2, href: hrefOf(base, e.target2, e.url2) } : undefined,
      }
    })
}

export type Transition = "fade" | "slide-left" | "slide-right" | "blur" | "zoom"
