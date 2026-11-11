"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ClosedCaption, Maximize, Minimize, Miniplayer, Pause, Play, Settings, X } from "@/components/icons"
import { cn } from "@/lib/utils"
import { AdminButton } from "./button"
import { VideoPlayerMenu } from "./video-player-menu"
import { LiveMarker, NextUp, SeekBar, SkipRipple, TOOL, VolumeControl } from "./video-player-parts"
import { LIVE_SECONDS, RESUME_END_GAP, RESUME_MIN, SKIP, SPEEDS, VOLUME_STEP, cueAt, formatTime, loadPrefs, loadResume, saveResume, savePrefs, speedLabel, volumeLabel, type PlayerPrefs } from "./video-player-options"

const SPEED_STEPS = SPEEDS as readonly number[]
const TIP_W = 120

export type VideoChapter = { at: number; title: string }
export type AdminVideoPlayerProps = {
  /** Length of the video, in seconds. */
  seconds: number
  /** Where it opens when nothing was saved for `resumeKey`. */
  startAt?: number
  /** Changes when another video takes the frame: playback stops and the position starts over. */
  resetKey?: string
  /** Where the viewer stopped is kept under this key, and the player opens there ("Resumed at 03:12 · Start over"). Leave out to never resume. */
  resumeKey?: string
  poster?: string
  background?: string
  /** False shows the frame only, so `children` can draw on it (chapter markers). */
  controls?: boolean
  /** Marks on the bar, with the title in the hover preview and beside the time. */
  chapters?: readonly VideoChapter[]
  /** What plays after this one: the "Up next" card counts down and calls `onPlay`. */
  next?: { title: string; onPlay: () => void }
  /** A livestream: no seek bar, time, skip or speed; a LIVE marker ("Back to live" after a pause). Subtitles, volume, quality, full screen and mini player stay. */
  live?: boolean
  /** Beside the LIVE marker, e.g. how long the stream has run. */
  liveLabel?: React.ReactNode
  /** Pause, scrub and end report the second the viewer is at. */
  onProgress?: (seconds: number) => void
  className?: string
  children?: React.ReactNode
}

/**
 * Admin / Video player (Figma 529:7475): the one video player of the Admin. A dark frame and, when `controls` is on, a simulated player: no real video plays, time runs on a clock.
 * Click the picture or the play button (or Space, K) to play and pause; drag or arrow keys on the bar scrub it, with a preview and the chapter on hover; double-click the left or right
 * third of the picture to skip 10 s, the middle for full screen (F too; the real Fullscreen API, or a fixed overlay when the browser refuses). The bar has volume, subtitles, and settings
 * (speed, quality, volume, shortcuts), all remembered between videos (see video-player-options.ts); a mini player (I) floats the video over the page. The first play and a long jump show a short "loading".
 * `resumeKey`, `chapters`, `next` and `onProgress` are the hooks for V1. Keys the player uses do not reach the shell's one-key shortcuts.
 */
export function AdminVideoPlayer({ seconds, startAt = 0, resetKey = "", resumeKey, poster, background, controls = true, chapters, next, live = false, liveLabel, onProgress, className, children }: AdminVideoPlayerProps) {
  const total = live ? LIVE_SECONDS : Math.max(1, seconds)
  const frame = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const fill = useRef<HTMLSpanElement>(null)
  const knob = useRef<HTMLSpanElement>(null)
  const label = useRef<HTMLSpanElement>(null)
  const chapLabel = useRef<HTMLSpanElement>(null)
  const buf = useRef<HTMLSpanElement>(null)
  const tip = useRef<HTMLDivElement>(null)
  const tipPic = useRef<HTMLDivElement>(null)
  const tipTime = useRef<HTMLSpanElement>(null)
  const tipChap = useRef<HTMLSpanElement>(null)
  const cap = useRef<HTMLSpanElement>(null)
  const ccBtn = useRef<HTMLButtonElement>(null)
  const setBtn = useRef<HTMLButtonElement>(null)
  const buffered = useRef(0)
  const loaded = useRef(false)
  const lang = useRef("off")
  const speed = useRef(1)
  const lastLang = useRef("en")
  const progress = useRef(onProgress)
  const chaps = useRef(chapters)
  const loadTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hudTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rippleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shown = useRef(-1)

  // Where it opens: what was saved for this video, else `startAt`.
  const [saved, setSaved] = useState(() => (live ? null : loadResume(resumeKey)))
  const [start, setStart] = useState(() => (live ? 0 : (loadResume(resumeKey) ?? startAt)))
  const at = useRef(Math.min(total, start))
  const [playing, setPlaying] = useState(live)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(live)
  const [prefs, setPrefs] = useState<PlayerPrefs>(loadPrefs)
  const [menu, setMenu] = useState<null | "settings" | "captions">(null)
  const [menuStart, setMenuStart] = useState<"root" | "keys">("root")
  const [compact, setCompact] = useState(false)
  const [hud, setHud] = useState<{ text: string; n: number } | null>(null)
  const [ripple, setRipple] = useState<{ side: "left" | "right"; n: number } | null>(null)
  const [full, setFull] = useState<false | "native" | "sim">(false)
  const [mini, setMini] = useState(false)
  const [idle, setIdle] = useState(false)
  const [stamp, setStamp] = useState(0)
  const [nextOff, setNextOff] = useState(false)
  const ended = done && !playing

  /** The chapter that holds second `s`, if the video has chapters. */
  const chapterAt = (s: number) => {
    const list = chaps.current
    if (!list?.length) return null
    return [...list].sort((a, b) => a.at - b.at).reduce<VideoChapter | null>((hit, c) => (c.at <= s ? c : hit), null)
  }

  /** Writes the time to the bar and the clock without re-rendering: the fill is a transform, the clock a text node. */
  const paint = useCallback((s: number) => {
    at.current = Math.max(0, Math.min(total, s))
    const p = at.current / total
    if (fill.current) fill.current.style.transform = `scaleX(${p})`
    if (knob.current) knob.current.style.left = `${p * 100}%`
    if (buf.current && p + 0.12 > buffered.current) {
      buffered.current = Math.min(1, p + 0.12)
      buf.current.style.transform = `scaleX(${buffered.current})`
    }
    const sec = Math.floor(at.current)
    if (sec !== shown.current) {
      shown.current = sec
      bar.current?.setAttribute("aria-valuenow", String(sec))
      if (label.current) label.current.textContent = formatTime(sec)
      if (chapLabel.current) {
        const c = chapterAt(sec)
        chapLabel.current.textContent = c ? `· ${c.title}` : ""
      }
      if (cap.current) {
        const line = lang.current === "off" ? "" : cueAt(lang.current, sec)
        cap.current.textContent = line
        cap.current.dataset.on = line ? "1" : "0"
      }
    }
  }, [total])

  /** Preferences and chapters reach the clock and the caption line through refs, so the frame loop never re-renders for them. */
  useEffect(() => {
    speed.current = prefs.speed
    lang.current = prefs.captions
    if (prefs.captions !== "off") lastLang.current = prefs.captions
    chaps.current = chapters
    progress.current = onProgress
    shown.current = -1
    paint(at.current)
  }, [prefs, chapters, onProgress, paint])
  useEffect(() => {
    buffered.current = 0
    loaded.current = false
    if (buf.current) buf.current.style.transform = "scaleX(0)"
    shown.current = -1
    paint(Math.min(total, start))
  }, [paint, start, total, resetKey])

  // A live player opens already playing, after a moment of "connecting".
  useEffect(() => {
    if (!live) return
    const timer = setTimeout(() => setLoading(false), 900)
    return () => clearTimeout(timer)
  }, [live])

  /** Remembers where the viewer stopped; near the start or the end it forgets, so a finished video opens at the start. */
  const remember = () => {
    if (!resumeKey || live) return
    const s = at.current
    saveResume(resumeKey, s < RESUME_MIN || s > total - RESUME_END_GAP ? null : s)
  }
  const rememberRef = useRef(remember)
  useEffect(() => {
    rememberRef.current = remember
  })
  useEffect(() => () => rememberRef.current(), [resumeKey])
  useEffect(() => {
    if (saved === null) return
    const timer = setTimeout(() => setSaved(null), 6500)
    return () => clearTimeout(timer)
  }, [saved])

  // Another video took the frame: stop, and start over (or where that one was left).
  const [keyOf, setKeyOf] = useState(resetKey)
  if (keyOf !== resetKey) {
    const was = loadResume(resumeKey)
    setKeyOf(resetKey)
    setPlaying(false)
    setLoading(false)
    setDone(false)
    setMini(false)
    setNextOff(false)
    setSaved(was)
    setStart(was ?? startAt)
  }

  /** A brief line over the picture that says what a key just did, as streaming players do. */
  const flash = (text: string) => {
    if (hudTimer.current) clearTimeout(hudTimer.current)
    setHud((h) => ({ text, n: (h?.n ?? 0) + 1 }))
    hudTimer.current = setTimeout(() => setHud(null), 900)
  }
  useEffect(() => () => {
    if (hudTimer.current) clearTimeout(hudTimer.current)
    if (rippleTimer.current) clearTimeout(rippleTimer.current)
    if (loadTimer.current) clearTimeout(loadTimer.current)
  }, [])
  const startLoading = (ms: number) => {
    if (loadTimer.current) clearTimeout(loadTimer.current)
    setLoading(true)
    loadTimer.current = setTimeout(() => setLoading(false), ms)
  }

  const change = (patch: Partial<PlayerPrefs>) => {
    const next = { ...prefs, ...patch }
    savePrefs(next)
    setPrefs(next)
    if (patch.quality && playing && patch.quality !== prefs.quality) startLoading(500)
  }
  const setVolume = (v: number, say = false) => {
    const volume = Math.round(Math.max(0, Math.min(1, v)) * 100) / 100
    const next = { volume, muted: volume === 0 }
    change(next)
    if (say) flash(volumeLabel(next))
  }
  const toggleMute = (say = false) => {
    const next = prefs.muted || prefs.volume === 0 ? { muted: false, volume: prefs.volume || 0.5 } : { muted: true, volume: prefs.volume }
    change(next)
    if (say) flash(volumeLabel(next))
  }

  /** A small player (a phone) has no room above its bar, so the menu then covers the picture instead. */
  const openMenu = (kind: "settings" | "captions", from: "root" | "keys" = "root", toggle = true) => {
    setCompact((frame.current?.clientHeight ?? 999) < 280)
    setMenuStart(from)
    setMenu((m) => (toggle && m === kind && from === "root" ? null : kind))
  }
  const closeMenu = (refocus = true) => {
    const was = menu
    setMenu(null)
    if (refocus) (was === "captions" ? ccBtn : setBtn).current?.focus()
  }
  useEffect(() => {
    if (!menu) return
    const down = (e: PointerEvent) => {
      const el = e.target as HTMLElement
      if (el.closest("[role=menu]") || el.closest("[data-player-menu-trigger]")) return
      setMenu(null)
    }
    document.addEventListener("pointerdown", down)
    return () => document.removeEventListener("pointerdown", down)
  }, [menu])

  useEffect(() => {
    if (!playing || loading) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const nextAt = at.current + ((now - last) / 1000) * speed.current
      last = now
      if (nextAt >= total) {
        paint(total)
        progress.current?.(total)
        rememberRef.current()
        setDone(true)
        setPlaying(false)
        return
      }
      paint(nextAt)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, loading, paint, total])

  const toggle = () => {
    if (ended) paint(0)
    setDone(false)
    setNextOff(false)
    setSaved(null)
    if (!playing && !loaded.current) {
      loaded.current = true
      startLoading(1100)
    }
    if (playing) {
      progress.current?.(Math.round(at.current))
      remember()
    }
    setPlaying((p) => !p)
    wake()
  }
  const seek = (s: number) => {
    const jump = Math.abs(s - at.current)
    paint(s)
    if (playing && jump > 10 && s < total) startLoading(450)
    progress.current?.(Math.round(at.current))
    remember()
    const over = at.current >= total
    setDone(over)
    if (over) setPlaying(false)
  }
  const fromPointer = (e: React.PointerEvent) => {
    const r = bar.current?.getBoundingClientRect()
    if (r) seek(((e.clientX - r.left) / r.width) * total)
  }
  /** Double-click on a side of the picture: a skip with a ripple. */
  const skipBy = (by: number) => {
    seek(at.current + by)
    if (rippleTimer.current) clearTimeout(rippleTimer.current)
    setRipple((r) => ({ side: by < 0 ? "left" : "right", n: (r?.n ?? 0) + 1 }))
    rippleTimer.current = setTimeout(() => setRipple(null), 520)
  }

  /** The hover preview above the bar: a frame stand-in, the time and the chapter, moved by ref while the pointer moves. */
  const moveTip = (e: React.PointerEvent) => {
    const r = bar.current?.getBoundingClientRect()
    if (!r || !tip.current) return
    const x = Math.max(0, Math.min(r.width, e.clientX - r.left))
    const s = (x / r.width) * total
    tip.current.style.transform = `translateX(${Math.max(0, Math.min(x - TIP_W / 2, r.width - TIP_W))}px)`
    if (tipTime.current) tipTime.current.textContent = formatTime(s)
    if (tipChap.current) tipChap.current.textContent = chapterAt(s)?.title ?? ""
    if (tipPic.current) {
      tipPic.current.style.filter = `hue-rotate(${Math.round((x / r.width) * 50 - 25)}deg) brightness(${(0.85 + (x / r.width) * 0.3).toFixed(2)})`
      if (poster) tipPic.current.style.backgroundPosition = `${(x / r.width) * 100}% 50%`
    }
  }

  const enter = () => {
    const el = frame.current
    if (!el) return
    wake()
    setMini(false)
    if (el.requestFullscreen) el.requestFullscreen().then(() => setFull("native"), () => setFull("sim"))
    else setFull("sim")
  }
  const leave = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    setFull(false)
  }
  const toggleFull = () => (full ? leave() : enter())
  const toggleMini = () => {
    if (full) leave()
    setMini((m) => !m)
  }
  useEffect(() => {
    const onChange = () => !document.fullscreenElement && setFull((f) => (f === "native" ? false : f))
    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [])
  useEffect(() => {
    if (!full && !mini) return
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      if (document.fullscreenElement) void document.exitFullscreen()
      setFull(false)
      setMini(false)
    }
    document.addEventListener("keydown", esc)
    const was = document.body.style.overflow
    if (full === "sim") document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", esc)
      document.body.style.overflow = was
    }
  }, [full, mini])

  /** In full screen the bar hides after a moment of stillness while playing, and comes back with the pointer or a key. */
  const wake = () => {
    setIdle(false)
    setStamp((n) => n + 1)
  }
  useEffect(() => {
    if (!full || !playing) return
    const timer = setTimeout(() => setIdle(true), 2400)
    return () => clearTimeout(timer)
  }, [full, playing, stamp])
  const hidden = !!full && playing && idle && !menu

  /** Keys the player owns when it, or its seek bar, has focus, and its letter shortcuts from any control. Buttons and the volume slider keep space, enter and arrows. */
  const onKey = (e: React.KeyboardEvent) => {
    const target = e.target as HTMLElement
    const onFrame = target === e.currentTarget
    const onSeek = target.getAttribute?.("aria-label") === "Seek"
    // Letter keys work from any control inside the player; space, enter and arrows stay with the focused button or slider.
    const letter = /^[a-z?<>]$/i.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey
    if (!controls || (!onFrame && !onSeek && !(letter && !target.closest("input, textarea")))) return
    wake()
    const k = e.key.toLowerCase()
    const nudge = (by: number) => () => {
      seek(at.current + by)
      flash(`${by > 0 ? "+" : "−"}${Math.abs(by)} s`)
    }
    const speedBy = (by: number) => () => {
      const nextSpeed = SPEED_STEPS[Math.max(0, Math.min(SPEED_STEPS.length - 1, SPEED_STEPS.indexOf(prefs.speed) + by))]
      change({ speed: nextSpeed })
      flash(speedLabel(nextSpeed))
    }
    const captionsKey = () => {
      const nextLang = prefs.captions === "off" ? lastLang.current : "off"
      change({ captions: nextLang })
      flash(nextLang === "off" ? "Subtitles off" : "Subtitles on")
    }
    const keys: Record<string, (() => void) | undefined> = {
      " ": toggle,
      k: toggle,
      arrowright: nudge(5),
      l: nudge(5),
      arrowleft: nudge(-5),
      j: nudge(-5),
      home: () => seek(0),
      end: () => seek(total),
      f: toggleFull,
      i: toggleMini,
      c: captionsKey,
      m: () => toggleMute(true),
      ">": speedBy(1),
      "<": speedBy(-1),
      "?": () => openMenu("settings", "keys", false),
      arrowup: onFrame ? () => setVolume((prefs.muted ? 0 : prefs.volume) + VOLUME_STEP, true) : undefined,
      arrowdown: onFrame ? () => setVolume((prefs.muted ? 0 : prefs.volume) - VOLUME_STEP, true) : undefined,
    }
    if (live) for (const gone of ["arrowright", "l", "arrowleft", "j", "home", "end", ">", "<"]) delete keys[gone]
    const act = keys[k]
    if (!act) return
    e.preventDefault()
    // The shell has one-key shortcuts (C opens New course); a key the player uses is the player's.
    e.stopPropagation()
    act()
  }

  const muted = prefs.muted || prefs.volume === 0
  const upNext = !live && ended && !!next && !nextOff && !mini

  return (
    <div className={cn("relative aspect-[1.78]", className)}>
      {mini && (
        <div className="absolute inset-0 grid place-content-center justify-items-center gap-2 rounded-a-10 border border-dashed border-a-border-strong p-3 text-center">
          <span className="t-body-m text-a-text-2">Playing in the mini player</span>
          <AdminButton hierarchy="secondary" size="md" onClick={() => setMini(false)}>Bring it back</AdminButton>
        </div>
      )}
      <div
        ref={frame}
        role={controls ? "group" : undefined}
        aria-label={controls ? "Video player" : undefined}
        tabIndex={controls ? 0 : undefined}
        onKeyDown={controls ? onKey : undefined}
        onPointerMove={controls && full ? wake : undefined}
        className={cn(
          "absolute inset-0 overflow-hidden rounded-a-10 border border-a-border outline-none focus-visible:ring-2 focus-visible:ring-a-border-focus",
          "[&:fullscreen]:rounded-none [&:fullscreen]:border-0",
          full === "sim" && "fixed! inset-0! z-[80] rounded-none! border-0!",
          mini && "fixed! inset-auto! right-4! bottom-16! z-[70] h-auto! w-[320px]! max-w-[calc(100vw-2rem)] aspect-video! border-a-border-strong shadow-[0_16px_40px_rgb(0_0_0/0.55)] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-200",
          hidden && "cursor-none",
        )}
        style={poster || !background ? undefined : { background }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {poster && <img src={poster} alt="" className="absolute inset-0 size-full object-cover" />}
        <span aria-hidden className="absolute inset-0 bg-gradient-to-b from-a-page/40 to-a-page/70" />
        {controls && (
          <>
            <button
              type="button"
              tabIndex={-1}
              aria-hidden
              onClick={toggle}
              onDoubleClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect()
                const x = (e.clientX - r.left) / r.width
                if (mini) setMini(false)
                else if (!live && x < 0.34) skipBy(-SKIP)
                else if (!live && x > 0.66) skipBy(SKIP)
                else toggleFull()
              }}
              className="absolute inset-0 cursor-pointer touch-manipulation outline-none"
            />
            {ripple && <SkipRipple key={ripple.n} side={ripple.side} text={`${SKIP} s`} />}
            <span role="status" className={cn("pointer-events-none absolute top-1/2 left-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-a-scrim transition-opacity duration-200 ease-out motion-reduce:transition-none", playing && loading ? "opacity-100" : "opacity-0")}>
              <span aria-hidden className="size-6 rounded-full border-2 border-a-text/25 border-t-a-text motion-safe:animate-spin" />
              <span className="sr-only">{playing && loading ? "Loading video" : ""}</span>
            </span>
            <span aria-hidden className={cn("pointer-events-none absolute top-1/2 left-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-a-scrim text-a-text transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none", playing || upNext ? "scale-90 opacity-0" : "scale-100 opacity-100", mini && "size-10")}>
              <Play className="ml-0.5 size-5" />
            </span>
            <div role="status" aria-live="polite" className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
              {hud && <span key={hud.n} className="rounded-a-md bg-a-scrim px-3 py-1.5 t-body-m text-a-text motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-150">{hud.text}</span>}
            </div>
            <div aria-hidden className={cn("pointer-events-none absolute inset-x-0 flex justify-center px-4 transition-[bottom] duration-200 ease-out motion-reduce:transition-none", full ? "bottom-20" : "bottom-12")}>
              <span ref={cap} data-on="0" className={cn("max-w-[90%] rounded-a-sm bg-a-scrim px-2.5 py-1 text-center text-a-text transition-opacity duration-150 ease-out data-[on=0]:opacity-0 motion-reduce:transition-none", full ? "t-body-l sm:text-lg" : mini ? "t-caption" : "t-body-m")} />
            </div>
            {!live && saved !== null && !playing && !mini && (
              <div className="absolute bottom-12 left-3.5 z-[6] flex max-w-[calc(100%-1.75rem)] items-center gap-2 rounded-a-md bg-a-scrim py-1 pr-1 pl-2.5 t-caption text-a-text motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200">
                <span className="min-w-0 truncate">Resumed at {formatTime(saved)}</span>
                <AdminButton hierarchy="ghost" size="sm" onClick={() => (seek(0), setSaved(null))}>Start over</AdminButton>
              </div>
            )}
            {upNext && next && <NextUp title={next.title} onPlay={next.onPlay} onCancel={() => setNextOff(true)} onReplay={toggle} />}
            {menu && !mini && <VideoPlayerMenu key={`${menu}-${menuStart}`} compact={compact} live={live} kind={menu} start={menuStart} prefs={prefs} onChange={change} onClose={() => closeMenu()} />}
            <div className={cn("absolute inset-x-3.5 bottom-3.5 flex items-center gap-2 sm:gap-3 t-caption text-a-text-2 transition-opacity duration-300 ease-out motion-reduce:transition-none", hidden && "pointer-events-none opacity-0", mini && "inset-x-2.5 bottom-2.5")}>
              <button type="button" aria-label={playing ? "Pause" : ended ? "Replay" : "Play"} aria-pressed={playing} onClick={toggle} className="relative grid size-5 shrink-0 place-items-center rounded-a-xs pointer-coarse:size-8 text-a-text outline-none transition-transform duration-150 ease-out hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus active:scale-90 motion-reduce:transition-none">
                <Play aria-hidden className={cn("absolute size-3 transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none", playing ? "scale-50 opacity-0" : "scale-100 opacity-100")} />
                <Pause aria-hidden className={cn("absolute size-3.5 transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none", playing ? "scale-100 opacity-100" : "scale-50 opacity-0")} />
              </button>
              {!mini && <VolumeControl muted={muted} volume={prefs.volume} label={volumeLabel(prefs)} onToggle={() => toggleMute()} onSet={(v) => setVolume(v)} />}
              {!mini && !live && (
                <span className="flex min-w-0 shrink items-center gap-1.5 tabular-nums max-sm:text-[11px]">
                  <span className="shrink-0">
                    <span ref={label} />
                    <span className="max-[420px]:hidden"> / {formatTime(total)}</span>
                  </span>
                  <span ref={chapLabel} className="hidden min-w-0 max-w-[160px] truncate text-a-text-3 md:inline" />
                </span>
              )}
              {!mini && !live && prefs.speed !== 1 && <span className="shrink-0 rounded-a-xs bg-a-selected px-1.5 t-micro text-a-text">{prefs.speed}×</span>}
              {live ? (
                <LiveMarker playing={playing} label={liveLabel} onBack={toggle} />
              ) : (
                <SeekBar
                  barRef={bar} fillRef={fill} bufRef={buf} knobRef={knob} tipRef={tip} tipPicRef={tipPic} tipTimeRef={tipTime} tipChapRef={tipChap}
                  total={total} start={start} chapters={chapters} poster={poster} background={background}
                  onPointer={fromPointer} onMove={moveTip}
                />
              )}
              {mini ? (
                <>
                  <button type="button" aria-label="Expand player" onClick={() => setMini(false)} className={cn(TOOL, "text-a-text-2")}>
                    <Maximize aria-hidden className="size-3.5" />
                  </button>
                  <button type="button" aria-label="Close mini player" onClick={() => (setMini(false), setPlaying(false), remember())} className={cn(TOOL, "text-a-text-2")}>
                    <X aria-hidden className="size-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <button ref={ccBtn} type="button" data-player-menu-trigger aria-label="Subtitles" aria-haspopup="menu" aria-expanded={menu === "captions"} aria-pressed={prefs.captions !== "off"} onClick={() => openMenu("captions")} className={cn(TOOL, "relative", prefs.captions !== "off" ? "text-a-text" : "text-a-text-2")}>
                    <ClosedCaption aria-hidden className="size-4" />
                    <span aria-hidden className={cn("absolute inset-x-1 -bottom-px h-0.5 origin-center rounded-full bg-a-accent-strong transition-transform duration-200 ease-out motion-reduce:transition-none", prefs.captions !== "off" ? "scale-x-100" : "scale-x-0")} />
                  </button>
                  <button ref={setBtn} type="button" data-player-menu-trigger aria-label="Settings" aria-haspopup="menu" aria-expanded={menu === "settings"} onClick={() => openMenu("settings")} className={cn(TOOL, "text-a-text-2", menu === "settings" && "text-a-text")}>
                    <Settings aria-hidden className={cn("size-4 transition-transform duration-300 ease-out motion-reduce:transition-none", menu === "settings" && "rotate-45")} />
                  </button>
                  <button type="button" aria-label="Mini player" onClick={toggleMini} className={cn(TOOL, "text-a-text-2 max-sm:hidden")}>
                    <Miniplayer aria-hidden className="size-3.5" />
                  </button>
                  <button type="button" aria-label={full ? "Exit full screen" : "Full screen"} aria-pressed={!!full} onClick={toggleFull} className={cn(TOOL, "text-a-text-2")}>
                    {full ? <Minimize aria-hidden className="size-3.5" /> : <Maximize aria-hidden className="size-3.5" />}
                  </button>
                </>
              )}
            </div>
          </>
        )}
        {!full && !mini && children}
      </div>
    </div>
  )
}
