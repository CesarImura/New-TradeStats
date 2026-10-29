"use client"

import { Check, Info, Link2, MousePointerClick, RotateCcw, X } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { useEffect, useRef, useState } from "react"
import type { CoachTheme, Mode } from "@/lib/theme/types"
import type { Detail, Emphasis } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { LabButton, LabDivider, LabIconButton, LabSeg } from "../lab-controls"
import { FOCUS, hair, t2, t3 } from "../widget-base"
import { HIT_CSS, StepButton } from "../widget-modal"
import { COMPONENT_ABOUT } from "./component-about"
import type { KitDef } from "./components"
import { KitPane } from "./preview"

/**
 * One component up close (prototype only), in the same modal pattern as the
 * widgets: the chosen variant large and live, a carousel of every variant,
 * Emphasis and Detail for this modal only, and an About panel (closed by
 * default) with when to use it, when not to, and the widgets that use it.
 */
export function ComponentModal({ def, index, onIndex, onClose, mode, theme, emphasis: pageEmphasis, detail: pageDetail }: { def: KitDef; index: number; onIndex: (i: number) => void; onClose: () => void; mode: Mode; theme: CoachTheme; emphasis: Emphasis; detail: Detail }) {
  const n = def.variants.length
  const i = Math.min(Math.max(0, index), n - 1)
  const v = def.variants[i]
  const still = useReducedMotion()
  const dialog = useRef<HTMLDivElement>(null)
  const close = useRef<HTMLButtonElement>(null)
  const downOnBackdrop = useRef(false)
  const [emphasis, setEmphasis] = useState(pageEmphasis)
  const [detail, setDetail] = useState(pageDetail)
  const [run, setRun] = useState(0)
  const [hits, setHits] = useState(false)
  const [copied, setCopied] = useState(false)
  const [about, setAboutState] = useState(() => {
    try {
      return sessionStorage.getItem("wb-about") === "open"
    } catch {
      return false
    }
  })
  const setAbout = (open: boolean) => {
    setAboutState(open)
    try {
      sessionStorage.setItem("wb-about", open ? "open" : "closed")
    } catch {}
  }
  const step = (d: number) => onIndex((i + d + n) % n)

  useEffect(() => {
    const back = document.activeElement as HTMLElement | null
    close.current?.focus({ focusVisible: false } as FocusOptions)
    const html = document.documentElement
    const was = html.style.overflow
    html.style.overflow = "hidden"
    return () => {
      html.style.overflow = was
      back?.focus({ focusVisible: false } as FocusOptions)
    }
  }, [])

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      // Overlays inside the stage (menus, dialogs) handle their own Escape first.
      if (e.defaultPrevented) return
      const t = e.target as HTMLElement | null
      if (e.key === "Escape") {
        if (t?.closest("[data-about]")) return setAbout(false)
        // An open menu, list or popup from the component closes first (only ones actually shown).
        const popup = [...document.querySelectorAll<HTMLElement>("[role=menu], [role=listbox], [data-slot=popover-content], [data-slot=dialog-content], [data-slot=sheet-content]")].some((el) => el.offsetParent !== null && !el.closest("[data-stage]"))
        if (popup) return
        return onClose()
      }
      if (t?.closest("input, textarea, select, [data-stage]")) return
      if (e.key === "ArrowRight") step(1)
      if (e.key === "ArrowLeft") step(-1)
    }
    document.addEventListener("keydown", key)
    return () => document.removeEventListener("keydown", key)
  })

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }
  const a = COMPONENT_ABOUT[def.id]

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={`${def.name} · ${v.label}`}>
      <motion.div
        className="absolute inset-0 bg-black/55"
        onPointerDown={(e) => (downOnBackdrop.current = e.target === e.currentTarget)}
        onClick={(e) => downOnBackdrop.current && e.target === e.currentTarget && onClose()}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: still ? 0 : 0.18, ease: "easeOut" }}
      />
      <motion.div
        ref={dialog}
        className="relative flex h-[min(88vh,960px)] w-[min(94vw,1120px)] flex-col overflow-hidden rounded-2xl border shadow-[0_24px_64px_-16px_rgb(0_0_0/0.5)]"
        style={{ ...hair, background: "var(--c-bar)" }}
        initial={still ? false : { opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        <div className="grid gap-4 border-b px-6 pt-5 pb-6" style={hair}>
          <div className="flex items-center justify-between gap-4">
            <span className={cn("text-[0.8125rem]", t2)}>
              Components · {def.group} · {n} {n === 1 ? "variant" : "variants"}
            </span>
            <div className="flex items-center gap-2">
              <LabIconButton onClick={copy} label={copied ? "Link copied" : "Copy link"}>
                {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
              </LabIconButton>
              <LabIconButton ref={close} onClick={onClose} label="Close (Esc)">
                <X className="size-4" />
              </LabIconButton>
            </div>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div className="grid min-w-0 gap-1.5">
              <h2 className="text-2xl leading-8 font-medium tracking-[-0.015em]">
                {def.name} <span className={cn("font-normal", t2)}>· {v.label}</span>
              </h2>
              <p className={cn("max-w-2xl text-sm", t2)}>{def.description}</p>
            </div>
            <LabSeg label="Emphasis" value={emphasis} onChange={setEmphasis} options={[["quiet", "Quiet"], ["accent", "Accent"], ["star", "Star"]]} />
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1 bg-(--c-page)">
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-wrap items-center gap-3 px-6 pt-4">
              <LabButton onClick={() => setRun((r) => r + 1)} label="Replay" hint="Mount it again so its entry animations play">
                <RotateCcw className="size-4" />
              </LabButton>
              <LabButton onClick={() => setHits(!hits)} label="Hit areas" hint="Outline everything that can be clicked or focused" pressed={hits}>
                <MousePointerClick className="size-4" />
              </LabButton>
              <LabDivider />
              <LabSeg inline label="Detail" value={detail} onChange={setDetail} options={[["compact", "Compact"], ["standard", "Standard"], ["detailed", "Detailed"]]} />
              <span className="flex-1" />
              <LabButton onClick={() => setAbout(!about)} label="About" hint="What it is, when to use it and where it's used" expanded={about}>
                <Info className="size-4" />
              </LabButton>
            </div>
            <div className="relative min-h-0 flex-1">
              <div data-stage data-hits={hits || undefined} className="absolute inset-0 overflow-auto">
                <style>{HIT_CSS}</style>
                <div className="grid min-h-full place-items-center px-16 py-8">
                  <div key={`${i}-${run}`} className="grid justify-items-center gap-3">
                    <KitPane mode={mode} theme={theme} emphasis={emphasis} detail={detail} scale={1.25} width={v.width} bare={v.bare}>
                      {v.render()}
                    </KitPane>
                    <span className={cn("text-xs", t3)}>{v.label} · shown at 1.25×</span>
                  </div>
                </div>
              </div>
              {n > 1 && (
                <>
                  <StepButton side="left" onClick={() => step(-1)} label={`Previous variant: ${def.variants[(i - 1 + n) % n].label}`} />
                  <StepButton side="right" onClick={() => step(1)} label={`Next variant: ${def.variants[(i + 1) % n].label}`} />
                </>
              )}
            </div>
          </div>
          {about && (
            <motion.aside
              data-about
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute inset-y-0 right-0 z-20 w-72 shrink-0 overflow-y-auto border-l p-5 shadow-[-12px_0_32px_-16px_rgb(0_0_0/0.35)] lg:static lg:shadow-none"
              style={{ ...hair, background: "var(--c-bar)" }}
              aria-label={`About ${def.name}`}
            >
              <dl className="grid gap-4">
                {(
                  [
                    ["What it is", def.description],
                    ["When to use it", a?.use],
                    ["When not to", a?.avoid],
                  ] as [string, string | undefined][]
                )
                  .filter(([, x]) => x)
                  .map(([k, x]) => (
                    <div key={k} className="grid gap-1">
                      <dt className={cn("text-xs", t3)}>{k}</dt>
                      <dd className="text-[0.8125rem] leading-5">{x}</dd>
                    </div>
                  ))}
                <div className="grid gap-1.5">
                  <dt className={cn("text-xs", t3)}>Used in</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {def.usedIn.map((u) => (
                      <span key={u} className="rounded-full border px-2 text-xs leading-5" style={hair}>
                        {u}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>
              {def.tries.length > 0 && (
                <details className="mt-5 border-t pt-4" style={hair}>
                  <summary className={cn("cursor-pointer text-xs font-medium select-none", t2)}>Interactions · {def.tries.length}</summary>
                  <ul className="mt-3 grid gap-2">
                    {def.tries.map((x) => (
                      <li key={x} className={cn("flex gap-2 text-xs leading-4", t2)}>
                        <span className="mt-1.5 size-1 shrink-0 rounded-full" style={{ background: "var(--brand-mark)" }} aria-hidden />
                        {x}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </motion.aside>
          )}
        </div>

        {/* Every variant as a card. */}
        <div className="grid gap-3 border-t px-6 pt-4 pb-5" style={hair}>
          <p className="text-sm">
            <span className="font-medium">Variants</span>
            <span className={cn("ml-2 tabular-nums", t3)}>
              {i + 1} / {n}
            </span>
          </p>
          <div role="radiogroup" aria-label="Variants" className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pt-1 pb-2">
            {def.variants.map((x, k) => {
              const on = k === i
              return (
                <div
                  key={x.label}
                  role="radio"
                  tabIndex={on ? 0 : -1}
                  aria-checked={on}
                  aria-label={`Show variant ${x.label}`}
                  onClick={() => onIndex(k)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      onIndex(k)
                    }
                  }}
                  className={cn("group grid w-[200px] shrink-0 cursor-pointer snap-start gap-2 rounded-xl", FOCUS)}
                >
                  <span
                    inert
                    aria-hidden
                    className={cn("grid h-[112px] place-items-center overflow-hidden rounded-xl border bg-(--c-cell) transition-colors duration-150", !on && "group-hover:bg-(--c-cell-on)")}
                    style={{ borderColor: on ? "var(--brand-mark)" : "var(--c-hair)", boxShadow: on ? "0 0 0 1px var(--brand-mark)" : undefined }}
                  >
                    <KitPane mode={mode} theme={theme} emphasis={emphasis} detail={detail} scale={Math.min(0.55, 176 / ((x.width ?? 320) + 34))} width={x.width} bare={x.bare}>
                      {x.render()}
                    </KitPane>
                  </span>
                  <span className={cn("truncate px-1 text-xs", on ? "font-medium text-(--c-t1)" : t2)}>{x.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
