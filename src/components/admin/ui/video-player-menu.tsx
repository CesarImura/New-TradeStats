"use client"

import { useEffect, useRef, useState } from "react"
import { Check, ChevronLeft, ChevronRight, X } from "@/components/icons"
import { cn } from "@/lib/utils"
import { CAPTION_LANGUAGES, QUALITIES, SPEEDS, shortcutsFor, VOLUME_LEVELS, qualityLabel, speedLabel, volumeValue, type PlayerPrefs } from "./video-player-options"

type Panel = "root" | "speed" | "quality" | "volume" | "keys"
type Row = { id: string; label: string; value?: string; checked?: boolean; onSelect: () => void; chevron?: boolean }

/**
 * The menu above the player's bar: settings (speed, quality) or subtitles (off and each language), like a streaming player.
 * It lives inside the player frame, not in a portal, so it also shows in full screen. Arrow keys move, Enter picks, Left or Backspace goes back, Esc closes.
 */
export function VideoPlayerMenu({ kind, compact = false, live = false, start = "root", prefs, onChange, onClose }: { kind: "settings" | "captions"; compact?: boolean; live?: boolean; start?: "root" | "keys"; prefs: PlayerPrefs; onChange: (patch: Partial<PlayerPrefs>) => void; onClose: () => void }) {
  const [panel, setPanel] = useState<Panel>(start)
  const [dir, setDir] = useState<"in" | "out">("in")
  const list = useRef<HTMLDivElement>(null)
  const go = (p: Panel, d: "in" | "out") => (setDir(d), setPanel(p))

  const rows: Row[] =
    kind === "captions"
      ? [{ id: "off", label: "Off", checked: prefs.captions === "off", onSelect: () => (onChange({ captions: "off" }), onClose()) }, ...CAPTION_LANGUAGES.map((l) => ({ id: l.id, label: l.label, checked: prefs.captions === l.id, onSelect: () => (onChange({ captions: l.id }), onClose()) }))]
      : panel === "speed"
        ? SPEEDS.map((s) => ({ id: String(s), label: speedLabel(s), checked: prefs.speed === s, onSelect: () => (onChange({ speed: s }), go("root", "out")) }))
        : panel === "volume"
          ? [{ id: "muted", label: "Muted", checked: prefs.muted || prefs.volume === 0, onSelect: () => (onChange({ muted: true }), go("root", "out")) }, ...VOLUME_LEVELS.map((v) => ({ id: String(v), label: `${Math.round(v * 100)}%`, checked: !prefs.muted && Math.abs(prefs.volume - v) < 0.025, onSelect: () => (onChange({ volume: v, muted: false }), go("root", "out")) }))]
        : panel === "quality"
          ? QUALITIES.map((q) => ({ id: q.id, label: qualityLabel(q.id), checked: prefs.quality === q.id, onSelect: () => (onChange({ quality: q.id }), go("root", "out")) }))
          : [
              ...(live ? [] : [{ id: "speed", label: "Playback speed", value: speedLabel(prefs.speed), chevron: true, onSelect: () => go("speed", "in") }]),
              { id: "quality", label: "Quality", value: qualityLabel(prefs.quality), chevron: true, onSelect: () => go("quality", "in") },
              { id: "volume", label: "Volume", value: volumeValue(prefs), chevron: true, onSelect: () => go("volume", "in") },
              { id: "keys", label: "Keyboard shortcuts", chevron: true, onSelect: () => go("keys", "in") },
            ]
  const title = kind === "captions" ? "Subtitles" : panel === "speed" ? "Playback speed" : panel === "quality" ? "Quality" : panel === "volume" ? "Volume" : panel === "keys" ? "Keyboard shortcuts" : compact ? "Settings" : null
  const sub = kind === "settings" && panel !== "root"

  // Focus the chosen row (or the first) when a panel opens, so the keyboard works at once.
  useEffect(() => {
    const items = list.current?.querySelectorAll<HTMLElement>("[role^=menuitem]")
    ;(list.current?.querySelector<HTMLElement>("[aria-checked=true]") ?? items?.[0] ?? list.current?.parentElement?.querySelector<HTMLElement>("[data-back]"))?.focus({ preventScroll: true })
  }, [panel])

  const onKey = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    const items = [...(list.current?.querySelectorAll<HTMLElement>("[role^=menuitem]") ?? [])]
    const i = items.indexOf(document.activeElement as HTMLElement)
    const active = document.activeElement as HTMLElement | null
    const step = (n: number) => items[(i + n + items.length) % items.length]?.focus()
    const actions: Record<string, (() => void) | undefined> = {
      ArrowDown: () => step(1),
      ArrowUp: () => step(-1),
      Home: () => items[0]?.focus(),
      End: () => items[items.length - 1]?.focus(),
      Escape: onClose,
      ArrowLeft: sub ? () => go("root", "out") : undefined,
      Backspace: sub ? () => go("root", "out") : undefined,
      ArrowRight: kind === "settings" && panel === "root" ? () => active?.click() : undefined,
    }
    const run = actions[e.key]
    if (!run) return
    e.preventDefault()
    run()
  }

  return (
    <div
      role="menu"
      aria-label={kind === "captions" ? "Subtitles" : "Player settings"}
      onKeyDown={onKey}
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      className={cn("absolute z-20 flex flex-col overflow-hidden rounded-a-lg border border-a-border-strong bg-a-raised text-a-text shadow-[0_16px_40px_rgb(0_0_0/0.55)] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-150 motion-safe:ease-out", compact ? "inset-2 origin-center" : "right-3.5 bottom-12 max-h-[calc(100%-4rem)] w-[220px] max-w-[calc(100%-1.75rem)] origin-bottom-right")}
    >
      {title && (
        <div className="flex h-9 shrink-0 items-center gap-1 border-b border-a-selected px-1.5">
          {sub ? (
            <button type="button" data-back onClick={() => go("root", "out")} className="flex h-7 min-w-0 flex-1 items-center gap-1 rounded-a-sm px-1.5 text-left t-body-m-medium outline-none transition-colors duration-150 hover:bg-a-hover focus-visible:ring-2 focus-visible:ring-a-border-focus">
              <ChevronLeft aria-hidden className="size-3.5 text-a-text-2" />
              <span className="truncate">{title}</span>
            </button>
          ) : (
            <span className="min-w-0 flex-1 truncate px-2 t-body-m-medium">{title}</span>
          )}
          {compact && (
            <button type="button" aria-label="Close menu" onClick={onClose} className="grid size-7 shrink-0 place-items-center rounded-a-sm text-a-text-2 outline-none transition-colors duration-150 hover:bg-a-hover hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus">
              <X aria-hidden className="size-3.5" />
            </button>
          )}
        </div>
      )}
      <div
        key={`${kind}-${panel}`}
        ref={list}
        className={cn("min-h-0 flex-1 overflow-y-auto p-1 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-150", dir === "in" ? "motion-safe:slide-in-from-right-2" : "motion-safe:slide-in-from-left-2")}
      >
        {panel === "keys" && kind === "settings" ? (
          <dl className="grid gap-px p-1">
            {shortcutsFor(live).map(([what, keys]) => (
              <div key={what} className="flex items-center gap-3 rounded-a-sm px-2 py-1.5 t-caption">
                <dt className="min-w-0 flex-1 text-a-text">{what}</dt>
                <dd className="shrink-0 text-a-text-2">{keys}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {panel === "keys" && kind === "settings" ? null : rows.map((r) => (
          <button
            key={r.id}
            type="button"
            role={r.chevron ? "menuitem" : "menuitemradio"}
            aria-checked={r.chevron ? undefined : !!r.checked}
            tabIndex={-1}
            onClick={r.onSelect}
            className="flex h-9 w-full items-center gap-2 rounded-a-sm px-2 text-left t-body-m outline-none transition-colors duration-150 hover:bg-a-hover focus-visible:bg-a-hover focus-visible:ring-2 focus-visible:ring-a-border-focus focus-visible:ring-inset"
          >
            {!r.chevron && <span className="grid size-4 shrink-0 place-items-center text-a-accent-strong">{r.checked && <Check aria-hidden className="size-3.5" />}</span>}
            <span className="min-w-0 flex-1 truncate">{r.label}</span>
            {r.value && <span className="shrink-0 t-caption text-a-text-2">{r.value}</span>}
            {r.chevron && <ChevronRight aria-hidden className="size-3.5 shrink-0 text-a-text-3" />}
          </button>
        ))}
      </div>
    </div>
  )
}

