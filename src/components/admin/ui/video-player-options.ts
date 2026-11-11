/**
 * Player options. Everything here is a stand-in for what the V1 player gets from its video provider:
 * `SPEEDS` and `QUALITIES` map to the player's playbackRate and rendition list, `CAPTION_LANGUAGES` to the text tracks of the video,
 * and `cueAt` to the active cue of the chosen track. The UI only talks to `PlayerPrefs`, so swapping the stand-ins for real data changes this file, not the menus.
 */

export type PlayerPrefs = { speed: number; quality: string; captions: string; volume: number; muted: boolean }

export const DEFAULT_PREFS: PlayerPrefs = { speed: 1, quality: "auto", captions: "off", volume: 1, muted: false }
export const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const
export const QUALITIES = [{ id: "auto", label: "Auto" }, { id: "1080p", label: "1080p" }, { id: "720p", label: "720p" }, { id: "480p", label: "480p" }, { id: "360p", label: "360p" }] as const
/** What Auto settles on after a moment, as a real player would report it. */
export const AUTO_QUALITY = "720p"
export const CAPTION_LANGUAGES = [{ id: "en", label: "English" }, { id: "pt", label: "Português" }, { id: "es", label: "Español" }, { id: "de", label: "Deutsch" }, { id: "fr", label: "Français" }] as const

/** What a volume key press moves by, and the least a drag moves (fractions of full). */
export const VOLUME_STEP = 0.05
export const VOLUME_LEVELS = [0.25, 0.5, 0.75, 1] as const
export const volumeValue = (p: { volume: number; muted: boolean }) => (p.muted || p.volume === 0 ? "Muted" : `${Math.round(p.volume * 100)}%`)
export const volumeLabel = (p: { volume: number; muted: boolean }) => (p.muted || p.volume === 0 ? "Muted" : `Volume ${Math.round(p.volume * 100)}%`)

/** 0:00 under an hour is always two digits for minutes, as the lesson clock reads. */
export const formatTime = (s: number) => {
  const t = Math.max(0, Math.floor(s))
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const sec = t % 60
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
}

export const speedLabel = (s: number) => (s === 1 ? "Normal" : `${s}×`)
export const qualityLabel = (id: string) => (id === "auto" ? `Auto (${AUTO_QUALITY})` : id)
export const captionLabel = (id: string) => CAPTION_LANGUAGES.find((l) => l.id === id)?.label ?? "Off"

const LINES: Record<string, string[]> = {
  en: ["A trend is a series of higher highs and higher lows.", "Look at the higher timeframe before you look at the entry.", "A range is price moving between two levels.", "Your stop goes where the idea is proven wrong.", "Wait for the close, not the wick.", "Write it down, then take the trade."],
  pt: ["Uma tendência é uma sequência de topos e fundos mais altos.", "Olhe o tempo gráfico maior antes de olhar a entrada.", "Um lateral é o preço entre dois níveis.", "O stop vai onde a ideia se prova errada.", "Espere o fechamento, não o pavio.", "Anote e só depois faça a operação."],
  es: ["Una tendencia es una serie de máximos y mínimos más altos.", "Mira el marco temporal mayor antes de la entrada.", "Un rango es el precio entre dos niveles.", "Tu stop va donde la idea queda desmentida.", "Espera el cierre, no la mecha.", "Anótalo y luego haz la operación."],
  de: ["Ein Trend ist eine Folge höherer Hochs und höherer Tiefs.", "Schau zuerst auf den höheren Zeitrahmen, dann auf den Einstieg.", "Eine Range ist Preis zwischen zwei Niveaus.", "Dein Stop gehört dorthin, wo die Idee widerlegt ist.", "Warte auf den Schlusskurs, nicht auf den Docht.", "Notiere es, dann nimm den Trade."],
  fr: ["Une tendance est une suite de sommets et de creux plus hauts.", "Regarde l'unité de temps supérieure avant l'entrée.", "Un range, c'est le prix entre deux niveaux.", "Ton stop va là où l'idée est invalidée.", "Attends la clôture, pas la mèche.", "Note-le, puis prends le trade."],
}
const WINDOW = 6
const SHOWN = 4.5

/** The caption showing at `seconds` in the given language, or "" between cues and when captions are off. */
export function cueAt(lang: string, seconds: number): string {
  const lines = LINES[lang]
  if (!lines) return ""
  const i = Math.floor(seconds / WINDOW)
  return seconds - i * WINDOW < SHOWN ? lines[i % lines.length] : ""
}

const KEY = "proto:player-prefs"
/** The viewer's choices stay between lessons and visits. Storage can be blocked, so every access is guarded. */
export function loadPrefs(): PlayerPrefs {
  try {
    const raw = typeof window === "undefined" ? null : window.localStorage.getItem(KEY)
    const v = raw ? (JSON.parse(raw) as Partial<PlayerPrefs>) : {}
    return {
      speed: (SPEEDS as readonly number[]).includes(v.speed as number) ? (v.speed as number) : DEFAULT_PREFS.speed,
      quality: QUALITIES.some((q) => q.id === v.quality) ? (v.quality as string) : DEFAULT_PREFS.quality,
      volume: typeof v.volume === "number" && v.volume >= 0 && v.volume <= 1 ? v.volume : DEFAULT_PREFS.volume,
      muted: v.muted === true,
      captions: v.captions === "off" || CAPTION_LANGUAGES.some((l) => l.id === v.captions) ? (v.captions as string) : DEFAULT_PREFS.captions,
    }
  } catch {
    return DEFAULT_PREFS
  }
}
export function savePrefs(p: PlayerPrefs) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    // Private mode or blocked storage: the choice just lasts for this visit.
  }
}

/** The keys the player answers to, for the "Keyboard shortcuts" panel. */
export const SHORTCUTS: readonly (readonly [string, string])[] = [
  ["Play or pause", "Space · K"],
  ["Back or forward 5 s", "← → · J L"],
  ["Skip 10 s", "Double-click a side"],
  ["Volume", "↑ ↓"],
  ["Mute", "M"],
  ["Subtitles", "C"],
  ["Speed", "< >"],
  ["Full screen", "F · double-click"],
  ["Mini player", "I"],
  ["Start or end", "Home · End"],
  ["This list", "?"],
]

const RESUME = "proto:video-resume"
const readResume = (): Record<string, number> => {
  try {
    const raw = typeof window === "undefined" ? null : window.localStorage.getItem(RESUME)
    const v = raw ? (JSON.parse(raw) as unknown) : {}
    return v && typeof v === "object" ? (v as Record<string, number>) : {}
  } catch {
    return {}
  }
}
/** Where the viewer stopped in this video, or null. Kept per `resumeKey`; V1 swaps this for the viewer's saved progress. */
export function loadResume(key?: string): number | null {
  if (!key) return null
  const s = readResume()[key]
  return typeof s === "number" && s > 0 ? s : null
}
/** Remember a position; a position near the start or the end (or null) forgets it. */
export function saveResume(key: string | undefined, seconds: number | null) {
  if (!key) return
  try {
    const all = readResume()
    if (seconds === null) delete all[key]
    else all[key] = Math.round(seconds)
    window.localStorage.setItem(RESUME, JSON.stringify(all))
  } catch {
    // Blocked storage: resume just does not work in this visit.
  }
}
export const RESUME_MIN = 5
export const RESUME_END_GAP = 8
export const SKIP = 10
export const NEXT_SECONDS = 5

/** A livestream has no seek, skip, speed or start and end, so those leave the list. */
const SEEK_ONLY = new Set(["Back or forward 5 s", "Skip 10 s", "Speed", "Start or end"])
export const shortcutsFor = (live: boolean) => (live ? SHORTCUTS.filter(([what]) => !SEEK_ONLY.has(what)) : SHORTCUTS)
/** The clock a live player runs on (only captions use it): longer than any stream. */
export const LIVE_SECONDS = 12 * 3600
