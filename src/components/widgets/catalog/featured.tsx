"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion, type Variants } from "motion/react"
import { useShouldReduceMotion } from "@animate-ui/react/utils/motion"
import { Play } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useFrame, useMore } from "../parts/frame"
import { ACCENT, CTA, MOTION, TYPE, series } from "../parts/tokens"
import { W } from "../parts/card"
import { WidgetEmpty, type WidgetProps } from "../parts/shared"
import { autoOf, everyOf, useSlides, type Transition } from "./media-data"
import { Art, CANDLES, FADE_TO, FADE_UP, Meter, Tag, hash } from "./poster"
import { Arrow } from "./shelf"

/** How a slide comes in and goes, by the coach's choice; `d` is the direction of travel (1 forward, -1 back). */
const SLIDE_VARIANTS: Record<Transition, Variants> = {
  fade: { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } },
  blur: { enter: { opacity: 0, filter: "blur(18px)", transform: "scale(1.04)" }, center: { opacity: 1, filter: "blur(0px)", transform: "scale(1)" }, exit: { opacity: 0, filter: "blur(18px)" } },
  zoom: { enter: { opacity: 0, transform: "scale(1.14)" }, center: { opacity: 1, transform: "scale(1)" }, exit: { opacity: 0, transform: "scale(0.94)" } },
  // Slides travel one way: from the right (the next comes in from the right) or from the left; going back reverses it.
  "slide-left": { enter: (d: number) => ({ transform: `translateX(${d * 100}%)` }), center: { transform: "translateX(0%)" }, exit: (d: number) => ({ transform: `translateX(${-d * 100}%)` }) },
  "slide-right": { enter: (d: number) => ({ transform: `translateX(${-d * 100}%)` }), center: { transform: "translateX(0%)" }, exit: (d: number) => ({ transform: `translateX(${d * 100}%)` }) },
}
const DURATION: Record<Transition, number> = { fade: 0.7, blur: 0.8, zoom: 0.9, "slide-left": 0.75, "slide-right": 0.75 }

/** The Featured backdrop without a picture: the tinted surface and one long, thin candle chart across it. */
function Stage({ tone, seed }: { tone: number; seed: string }) {
  const base = CANDLES[Math.abs(hash(seed)) % CANDLES.length]
  const candles = Array.from({ length: 36 }, (_, i) => base[i % base.length] * 0.55 + i * 1.1 + (i % 4) * 2)
  return (
    <div className="absolute inset-0 overflow-hidden text-card-foreground" style={{ background: `color-mix(in oklab, ${series(tone)} 26%, var(--muted))` }}>
      <svg viewBox="0 0 360 100" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 size-full" aria-hidden>
        {candles.map((h, i) => {
          const x = 4 + i * 10
          const y = 96 - h
          const last = i === candles.length - 1
          return (
            <g key={i} stroke={last ? ACCENT : "currentColor"} fill={last ? ACCENT : i % 3 === 1 ? "none" : "currentColor"} opacity={last ? 0.85 : 0.1}>
              <line x1={x + 2} x2={x + 2} y1={y - 5} y2={y + 15} strokeWidth="0.5" />
              <rect x={x} y={y} width="4" height={i % 3 === 1 ? 7 : 10} strokeWidth="0.5" />
            </g>
          )
        })}
      </svg>
    </div>
  )
}

const WORDS: Variants = { enter: {}, center: { transition: { staggerChildren: 0.06, delayChildren: 0.12 } }, exit: { opacity: 0, transition: { duration: 0.16 } } }
const WORD: Variants = { enter: { opacity: 0, transform: "translateY(10px)" }, center: { opacity: 1, transform: "translateY(0px)", transition: { duration: 0.42, ease: MOTION.ease } }, exit: {} }

/**
 * Featured: a full-width stage of up to six slides, each with its own picture and parts (label, tags, title, text,
 * facts, progress, one or two buttons — any of them can be off, down to a picture alone). Slides change on their own
 * (thin bars fill to show the time left; hover, focus and a hidden tab pause it) or only by the arrows and bars, with the
 * coach's transition. One slide stands still. Narrow, the picture sits on top and the words under it.
 */
export function Featured({ props }: WidgetProps) {
  const slides = useSlides(props)
  const still = useShouldReduceMotion()
  const { emphasis } = useFrame()
  const more = useMore("standard")
  const [state, setState] = useState({ at: 0, dir: 1 })
  const n = slides.length
  const at = n ? state.at % n : 0
  const s = slides[at]
  const auto = n > 1 && autoOf(props, true)
  const every = everyOf(props, 7)
  const transition: Transition = (["fade", "slide-left", "slide-right", "blur", "zoom"].includes(String(props.transition)) ? props.transition : "fade") as Transition
  const kind: Transition = still ? "fade" : transition
  const go = (k: number, dir = k > at ? 1 : -1) => setState({ at: (k + n) % n, dir })
  const [hold, setHold] = useState(false)
  const [hidden, setHidden] = useState(false)
  const running = auto && !still && !hold && !hidden

  useEffect(() => {
    const on = () => setHidden(document.hidden)
    document.addEventListener("visibilitychange", on)
    return () => document.removeEventListener("visibilitychange", on)
  }, [])

  if (!s) return <WidgetEmpty icon={Play} title="Nothing to feature yet" text="Add a slide in Design → Content." />

  const hasWords = !!(s.eyebrow || s.tags.length || s.title || s.text || s.facts.length || s.pct !== undefined || s.button || s.button2)
  const fadeX = "linear-gradient(to right, var(--fade-to) 0%, color-mix(in oklab, var(--fade-to) 86%, transparent) 26%, color-mix(in oklab, var(--fade-to) 40%, transparent) 50%, transparent 72%)"
  const controls = n > 1 && (
    <div className={cn("flex items-center gap-2", !hasWords && "rounded-full bg-[color-mix(in_oklab,var(--card)_72%,transparent)] px-1.5 py-1 backdrop-blur-sm")}>
      <Arrow dir="prev" onClick={() => go(at - 1, -1)} className="size-7" />
      <div className="flex items-center gap-1" role="tablist" aria-label="Featured">
        {slides.map((x, k) => (
          <button key={x.id} type="button" role="tab" aria-selected={k === at} aria-label={`Show slide ${k + 1}${x.title ? `: ${x.title}` : ""}`} onClick={() => go(k)} className="group/bar grid h-6 w-6 place-items-center outline-none @[40rem]:w-8">
            <span className="relative block h-[3px] w-full overflow-hidden rounded-(--r-bar) bg-[color-mix(in_oklab,var(--card-foreground)_22%,transparent)] transition-colors group-hover/bar:bg-[color-mix(in_oklab,var(--card-foreground)_40%,transparent)] group-focus-visible/bar:ring-2 group-focus-visible/bar:ring-ring">
              {k === at && (
                <motion.span
                  key={`${x.id}-${running}`}
                  className="absolute inset-0 origin-left bg-card-foreground"
                  initial={{ transform: running ? "scaleX(0)" : "scaleX(1)" }}
                  animate={{ transform: "scaleX(1)" }}
                  transition={{ duration: running ? every : 0, ease: "linear" }}
                  onAnimationComplete={() => running && go(at + 1, 1)}
                />
              )}
            </span>
          </button>
        ))}
      </div>
      <Arrow dir="next" onClick={() => go(at + 1, 1)} className="size-7" />
    </div>
  )

  return (
    <W className="gap-0 p-0">
      <div
        className={cn(FADE_TO, "relative isolate flex min-h-0 flex-1 flex-col")}
        onMouseEnter={() => setHold(true)}
        onMouseLeave={() => setHold(false)}
        onFocusCapture={() => setHold(true)}
        onBlurCapture={() => setHold(false)}
        onKeyDownCapture={(e) => {
          if (n < 2 || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return
          e.preventDefault()
          go(e.key === "ArrowLeft" ? at - 1 : at + 1, e.key === "ArrowLeft" ? -1 : 1)
        }}
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured"
      >
        <div className={cn("relative w-full shrink-0 overflow-hidden", hasWords ? "aspect-video @[40rem]:absolute @[40rem]:inset-0 @[40rem]:aspect-auto" : "aspect-video @[40rem]:aspect-auto @[40rem]:min-h-[22rem] @[60rem]:min-h-[26rem]")}>
          <AnimatePresence initial={false} custom={state.dir}>
            <motion.div key={s.id} className="absolute inset-0" custom={state.dir} variants={SLIDE_VARIANTS[kind]} initial="enter" animate="center" exit="exit" transition={{ duration: still ? 0.15 : DURATION[kind], ease: MOTION.ease }}>
              <motion.div className="absolute inset-0 origin-[70%_40%]" initial={{ transform: "scale(1)" }} animate={{ transform: running ? "scale(1.05)" : "scale(1)" }} transition={{ duration: running ? every + 1 : 0.6, ease: running ? "linear" : MOTION.ease }}>
                {s.picture ? <Art item={{ id: s.id, title: s.title ?? "", tags: [], tone: s.tone, href: "#", picture: s.picture }} /> : <Stage tone={s.tone} seed={s.id} />}
              </motion.div>
              {/* No picture: a poster of the slide stands on the stage, on the right. */}
              {!s.picture && s.title && (
                <div
                  aria-hidden
                  className="@container/tile absolute top-[12%] right-[6%] bottom-[12%] aspect-[2/3] overflow-hidden rounded-[min(var(--radius),10px)] shadow-[0_24px_48px_-16px_rgb(0_0_0/0.45)] ring-1 ring-[color-mix(in_oklab,var(--card-foreground)_14%,transparent)] @[40rem]:top-[12%] @[40rem]:right-[7%] @[40rem]:bottom-[22%]"
                >
                  <Art item={{ id: s.id, kicker: s.eyebrow, title: s.title, tags: [], tone: s.tone, href: "#" }} typeset />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          {hasWords && (
            <>
              <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: FADE_UP }} />
              <div aria-hidden className="pointer-events-none absolute inset-0 hidden @[40rem]:block" style={{ background: fadeX }} />
            </>
          )}
          {!hasWords && controls && <div className="absolute right-3 bottom-3 @[40rem]:right-6 @[40rem]:bottom-6">{controls}</div>}
        </div>

        {hasWords && (
          <div className="relative flex min-h-0 flex-1 flex-col justify-end gap-4 p-[calc(1rem*var(--density,1))] @[40rem]:min-h-[22rem] @[40rem]:p-[calc(2rem*var(--density,1))] @[60rem]:min-h-[26rem] @[60rem]:p-[calc(2.5rem*var(--density,1))]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={s.id} className="grid max-w-[34rem] gap-3 @[40rem]:max-w-[52%]" variants={WORDS} initial="enter" animate="center" exit="exit">
                {(s.eyebrow || s.tags.length > 0) && (
                  <motion.div variants={WORD} className="flex flex-wrap items-center gap-1.5">
                    {s.eyebrow && <Tag strong>{s.eyebrow}</Tag>}
                    {s.tags.map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </motion.div>
                )}
                {s.title && (
                  <motion.h3 variants={WORD} className={cn(emphasis === "star" ? TYPE.star : TYPE.valueLg, "line-clamp-2 text-balance")}>
                    {s.title}
                  </motion.h3>
                )}
                {more && s.text && (
                  <motion.p variants={WORD} className={cn(TYPE.body, "line-clamp-3 max-w-prose text-muted-foreground")}>
                    {s.text}
                  </motion.p>
                )}
                {(s.pct !== undefined || s.facts.length > 0) && (
                  <motion.div variants={WORD} className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    {s.pct !== undefined && (
                      <span className="flex items-center gap-2">
                        <Meter pct={s.pct} className="w-20" />
                        <span className={cn(TYPE.small, "tabular-nums")}>{s.pct}% complete</span>
                      </span>
                    )}
                    {s.facts.map((f, i) => (
                      <span key={f} className={cn(TYPE.small, "flex items-center gap-4 tabular-nums")}>
                        {i > 0 || s.pct !== undefined ? <span aria-hidden className="h-3 w-px bg-border" /> : null}
                        {f}
                      </span>
                    ))}
                  </motion.div>
                )}
                {(s.button || s.button2) && (
                  <motion.div variants={WORD} className="flex flex-wrap items-center gap-2 pt-1">
                    {s.button && (
                      <Button size="sm" className={cn("w-fit", CTA)} render={<Link href={s.button.href} />} nativeButton={false}>
                        <Play /> <span className="truncate">{s.button.label}</span>
                      </Button>
                    )}
                    {s.button2 && (
                      <Button size="sm" variant="outline" className={cn("w-fit bg-[color-mix(in_oklab,var(--card)_60%,transparent)]", CTA)} render={<Link href={s.button2.href} />} nativeButton={false}>
                        <span className="truncate">{s.button2.label}</span>
                      </Button>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
            {controls && <div className="@[40rem]:absolute @[40rem]:right-[calc(2rem*var(--density,1))] @[40rem]:bottom-[calc(2rem*var(--density,1))]">{controls}</div>}
          </div>
        )}
      </div>
    </W>
  )
}
