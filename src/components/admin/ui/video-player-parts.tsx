"use client"

import { useEffect, useRef, useState, type RefObject } from "react"
import { Play, Replay, VolumeDown, VolumeMute, VolumeUp } from "@/components/icons"
import { cn } from "@/lib/utils"
import { AdminButton } from "./button"
import { NEXT_SECONDS, VOLUME_STEP } from "./video-player-options"

/** The ripple of a double-click skip: a soft shape on the side that was hit, with the seconds. */
export function SkipRipple({ side, text }: { side: "left" | "right"; text: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-y-0 z-[5] grid w-[34%] place-items-center bg-a-text/10 text-a-text motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-150",
        side === "left" ? "left-0 rounded-r-[100%]" : "right-0 rounded-l-[100%]",
      )}
    >
      <span className="flex flex-col items-center gap-0.5 t-body-m">
        <Play className={cn("size-4", side === "left" && "rotate-180")} />
        {text}
      </span>
    </span>
  )
}

/** After the last second: "Up next" with a countdown that plays the next video, or Replay. Mounted only while it applies, so the countdown always starts at the full count. */
export function NextUp({ title, onPlay, onCancel, onReplay }: { title: string; onPlay: () => void; onCancel: () => void; onReplay: () => void }) {
  const [left, setLeft] = useState(NEXT_SECONDS)
  useEffect(() => {
    const id = setInterval(() => setLeft((n) => n - 1), 1000)
    return () => clearInterval(id)
  }, [])
  useEffect(() => {
    if (left <= 0) onPlay()
  }, [left, onPlay])
  const R = 18
  const C = 2 * Math.PI * R
  return (
    <div role="group" aria-label="Up next" className="absolute inset-0 z-10 grid place-items-center bg-a-page/75 p-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200">
      <div className="flex w-full max-w-[320px] flex-col items-center gap-3 text-center">
        <span className="t-mono-label text-a-text-3">Up next</span>
        <div className="flex max-w-full items-center gap-3">
          <span className="relative grid size-11 shrink-0 place-items-center">
            <svg viewBox="0 0 44 44" className="absolute inset-0 size-full -rotate-90" aria-hidden>
              <circle cx="22" cy="22" r={R} fill="none" strokeWidth="3" className="stroke-a-track" />
              <circle cx="22" cy="22" r={R} fill="none" strokeWidth="3" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - Math.max(0, left - 1) / NEXT_SECONDS)} className="stroke-a-accent-strong transition-[stroke-dashoffset] duration-1000 ease-linear motion-reduce:transition-none" />
            </svg>
            <span className="t-body-m-medium tabular-nums text-a-text">{Math.max(0, left)}</span>
          </span>
          <span className="min-w-0 text-left t-body-l-medium text-a-text">
            <span className="line-clamp-2">{title}</span>
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <AdminButton size="md" onClick={onPlay}>Play now</AdminButton>
          <AdminButton hierarchy="secondary" size="md" onClick={onReplay}><Replay /> Replay</AdminButton>
          <AdminButton hierarchy="ghost" size="md" onClick={onCancel}>Cancel</AdminButton>
        </div>
      </div>
    </div>
  )
}

/** The class of the small icon buttons on the player bar. */
export const TOOL = "grid size-5 pointer-coarse:size-7 shrink-0 place-items-center rounded-a-xs outline-none transition-[color,transform] duration-150 ease-out hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus active:scale-90 motion-reduce:transition-none"

/** Mute button, and a slider that opens beside it on hover or focus (not on touch screens, where the volume is the device's). */
export function VolumeControl({ muted, volume, label, onToggle, onSet }: { muted: boolean; volume: number; label: string; onToggle: () => void; onSet: (v: number) => void }) {
  const bar = useRef<HTMLDivElement>(null)
  const level = muted ? 0 : volume
  const fromPointer = (e: React.PointerEvent) => {
    const r = bar.current?.getBoundingClientRect()
    if (r) onSet((e.clientX - r.left) / r.width)
  }
  const onKey = (e: React.KeyboardEvent) => {
    const to: Record<string, number | undefined> = { ArrowRight: level + VOLUME_STEP, ArrowUp: level + VOLUME_STEP, ArrowLeft: level - VOLUME_STEP, ArrowDown: level - VOLUME_STEP, Home: 0, End: 1 }
    const v = to[e.key]
    if (v === undefined) return
    e.preventDefault()
    e.stopPropagation()
    onSet(v)
  }
  return (
    <div className="group/vol flex shrink-0 items-center pointer-coarse:max-[360px]:hidden" data-player-volume>
      <button type="button" aria-label={muted ? "Unmute" : "Mute"} aria-pressed={muted} onClick={onToggle} className={cn(TOOL, "text-a-text-2 group-hover/vol:text-a-text")}>
        {muted || volume === 0 ? <VolumeMute aria-hidden className="size-4" /> : volume < 0.5 ? <VolumeDown aria-hidden className="size-4" /> : <VolumeUp aria-hidden className="size-4" />}
      </button>
      <div className="w-0 overflow-hidden transition-[width] duration-200 ease-out group-focus-within/vol:w-[60px] group-hover/vol:w-[60px] pointer-coarse:hidden motion-reduce:transition-none">
        <div
          ref={bar}
          role="slider"
          tabIndex={0}
          aria-label="Volume"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(level * 100)}
          aria-valuetext={label}
          onPointerDown={(e) => (e.currentTarget.setPointerCapture(e.pointerId), fromPointer(e))}
          onPointerMove={(e) => e.buttons === 1 && fromPointer(e)}
          onKeyDown={onKey}
          className="group/vb relative mx-1 flex h-5 w-[52px] cursor-pointer touch-none items-center outline-none"
        >
          <span aria-hidden className="relative block h-1 w-full overflow-hidden rounded-full bg-a-track transition-transform duration-150 ease-out group-hover/vb:scale-y-150 group-focus-visible/vb:scale-y-150 motion-reduce:transition-none">
            <span className="absolute inset-0 origin-left rounded-full bg-a-text transition-transform duration-100 ease-out motion-reduce:transition-none" style={{ transform: `scaleX(${level})` }} />
          </span>
        </div>
      </div>
    </div>
  )
}

/** The LIVE marker in place of the seek bar: red while playing, "Back to live" after a pause. aria-disabled (not disabled) so focus stays on it. */
export function LiveMarker({ playing, label, onBack }: { playing: boolean; label?: React.ReactNode; onBack: () => void }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2.5">
      <button
        type="button"
        aria-disabled={playing}
        aria-label={playing ? "Live" : "Back to live"}
        onClick={() => !playing && onBack()}
        className={cn("flex h-5 shrink-0 items-center gap-1.5 rounded-a-xs px-1.5 t-mono-label-s outline-none transition-colors duration-200 ease-out focus-visible:ring-2 focus-visible:ring-a-border-focus motion-reduce:transition-none", playing ? "cursor-default bg-a-danger-soft text-a-danger" : "bg-a-selected text-a-text-2 hover:bg-a-hover hover:text-a-text")}
      >
        <span aria-hidden className={cn("size-1.5 rounded-full transition-colors duration-200", playing ? "bg-a-danger-fill motion-safe:animate-pulse" : "bg-a-text-3")} />
        {playing ? "LIVE" : "BACK TO LIVE"}
      </button>
      {label && <span className="min-w-0 truncate tabular-nums text-a-text-2">{label}</span>}
      <span className="min-w-0 flex-1" />
    </div>
  )
}

/**
 * The seek bar: track, buffered stretch, fill, chapter marks, knob, and the hover preview. The player paints it through the refs (transform and text), so playing never re-renders it.
 */
export function SeekBar({ barRef, fillRef, bufRef, knobRef, tipRef, tipPicRef, tipTimeRef, tipChapRef, total, start, chapters, poster, background, onPointer, onMove }: {
  barRef: RefObject<HTMLDivElement | null>; fillRef: RefObject<HTMLSpanElement | null>; bufRef: RefObject<HTMLSpanElement | null>; knobRef: RefObject<HTMLSpanElement | null>
  tipRef: RefObject<HTMLDivElement | null>; tipPicRef: RefObject<HTMLDivElement | null>; tipTimeRef: RefObject<HTMLSpanElement | null>; tipChapRef: RefObject<HTMLSpanElement | null>
  total: number; start: number; chapters?: readonly { at: number; title: string }[]; poster?: string; background?: string
  onPointer: (e: React.PointerEvent) => void; onMove: (e: React.PointerEvent) => void
}) {
  return (
    <div
      ref={barRef}
      role="slider"
      tabIndex={0}
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={Math.round(Math.min(total, start))}
      onPointerDown={(e) => (e.currentTarget.setPointerCapture(e.pointerId), onPointer(e))}
      onPointerMove={(e) => (onMove(e), e.buttons === 1 && onPointer(e))}
      className="group/bar relative flex h-5 min-w-0 flex-1 cursor-pointer touch-none items-center outline-none pointer-coarse:h-8"
    >
      <div ref={tipRef} aria-hidden className="pointer-events-none absolute bottom-full left-0 z-10 mb-1.5 flex w-[120px] flex-col items-center gap-1 opacity-0 transition-opacity duration-150 group-hover/bar:opacity-100 group-active/bar:opacity-100 pointer-coarse:hidden motion-reduce:transition-none max-sm:hidden">
        <div
          ref={tipPicRef}
          className="h-[68px] w-full overflow-hidden rounded-a-sm border border-a-border-strong bg-cover shadow-[0_8px_20px_rgb(0_0_0/0.5)]"
          style={poster ? { backgroundImage: `url(${poster})`, backgroundSize: "200% 100%" } : { background: background ?? "var(--admin-color-bg-raised)" }}
        />
        <span className="flex max-w-[220px] flex-col items-center rounded-a-xs bg-a-scrim px-1.5 py-0.5 text-center t-micro text-a-text">
          <span ref={tipTimeRef} className="tabular-nums" />
          <span ref={tipChapRef} className="max-w-full truncate text-a-text-2" />
        </span>
      </div>
      <span aria-hidden className="relative block h-1 w-full origin-center overflow-hidden rounded-full bg-a-track transition-transform duration-150 ease-out group-hover/bar:scale-y-150 group-focus-visible/bar:scale-y-150 group-active/bar:scale-y-150 motion-reduce:transition-none">
        <span ref={bufRef} className="absolute inset-0 origin-left rounded-full bg-a-text/15 transition-transform duration-500 ease-out motion-reduce:transition-none" style={{ transform: "scaleX(0)" }} />
        <span ref={fillRef} className="absolute inset-0 origin-left rounded-full bg-a-accent-strong will-change-transform" style={{ transform: "scaleX(0)" }} />
        {chapters?.map((c) => (c.at > 0 && c.at < total ? <span key={`${c.at}-${c.title}`} className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-a-page/90" style={{ left: `${(c.at / total) * 100}%` }} /> : null))}
      </span>
      <span ref={knobRef} aria-hidden className="pointer-events-none absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-a-text shadow-[0_0_0_3px_rgb(0_0_0/0.35)] transition-transform duration-150 ease-out group-hover/bar:scale-100 group-focus-visible/bar:scale-100 group-active/bar:scale-100 motion-reduce:transition-none" style={{ left: "0%" }} />
    </div>
  )
}
