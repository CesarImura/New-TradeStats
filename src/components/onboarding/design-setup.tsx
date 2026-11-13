"use client"

import { Children, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { ArrowDown, ArrowLeft, ArrowUp, ChevronsUpDown, PanelLeftIcon as PanelLeft, Plus, Trash2 } from "@/components/icons"
import { AdminButton, AdminField, adminControl } from "@/components/admin/ui"
import { useDraftEditor } from "@/components/admin/design/editor/editor-shell"
import { ColorPicker } from "@/components/admin/design/fields/controls"
import { LOOKS } from "@/components/admin/design/looks"
import { updateCommunity, type CustomCommunity } from "@/lib/data/communities"
import { useAccount, useCustomCommunities } from "@/lib/data/use-communities"
import { pictureFrom } from "@/lib/images"
import { mergeOverrides, type Overrides } from "@/lib/prototype-store"
import { onColor } from "@/lib/theme/derive"
import { resolveCoach, resolveTheme } from "@/lib/theme/resolve"
import { TEMPLATES } from "@/lib/theme/templates"
import type { BackgroundStyle, CoachTheme, Mode } from "@/lib/theme/types"
import { cn } from "@/lib/utils"
import { ChoiceChip, SignupFrame, SignupTitle, ghostOut } from "./signup-frame"

/**
 * Getting started · Design your platform (Figma 959:63835 Brand, 977:7158 Look, 987:7523 Layout). Three short steps on
 * the same draft as the Design editor, so whatever is picked here is there in Design, and Go live publishes it. On the
 * right, the coach's real platform in a frame: a skeleton while they pick the brand, then the live page, smaller at
 * each step (the Figma "product screen" goes 1834 → 1467 → 917 px wide on an 1103 px canvas).
 */
const STEPS = ["brand", "look", "layout"] as const
type Step = (typeof STEPS)[number]

/** Brand colours offered first (content colours, the coach's own choice). */
const BRAND = ["#ff5500", "#22c55e", "#3b82f6", "#a855f7", "#f4f4f5", "#e5484d", "#14b8a6", "#ec4899"]
const MAX = 40
const noop = () => () => {}

export function DesignSetup() {
  const router = useRouter()
  const params = useSearchParams()
  const acc = useAccount()
  const communities = useCustomCommunities()
  const community = communities.find((c) => c.slug === acc?.setupSlug)
  // The account lives in the browser: before it is read, show the frame only (no "No platform" flash).
  const mounted = useSyncExternalStore(noop, () => true, () => false)
  const step: Step = (STEPS as readonly string[]).includes(params.get("step") ?? "") ? (params.get("step") as Step) : "brand"

  // "?new=1" (the community switcher) starts another platform: that is the sign-up's Name step now.
  useEffect(() => {
    if (params.has("new")) router.replace("/signup/name")
  }, [params, router])

  if (!mounted) return <SignupFrame>{null}</SignupFrame>
  if (!community) {
    return (
      <SignupFrame>
        <SignupTitle title="No platform to design yet" text="Create your platform first, then come back to design it." />
        <AdminButton nativeButton={false} render={<Link href="/signup" />} size="xl" className="self-start">
          Get started
        </AdminButton>
      </SignupFrame>
    )
  }
  return <Flow key={community.slug} community={community} step={step} />
}

function Flow({ community, step }: { community: CustomCommunity; step: Step }) {
  const router = useRouter()
  const pathname = usePathname()
  const editor = useDraftEditor(community.slug)
  const { working, change } = editor
  const coach = useMemo(() => resolveCoach(community, working.content), [community, working.content])
  const theme = useMemo(() => resolveTheme(coach, working.theme), [coach, working.theme])
  // A pick in Look or Layout shows in the form at once, while the preview hides the old page, swaps it and brings the new
  // one in (Canvas.swap). Picks made during the swap pile up and land together.
  const [pending, setPending] = useState<Partial<Overrides> | null>(null)
  const formTheme = useMemo(() => (pending ? resolveTheme(coach, mergeOverrides(working, pending).theme) : theme), [pending, coach, working, theme])
  const changeRef = useRef(change)
  useEffect(() => {
    changeRef.current = change
  })
  const swapRef = useRef<(apply: () => void | Promise<void>, kind?: SwapKind) => void>((apply) => void apply())
  const pendingRef = useRef<Partial<Overrides> | null>(null)
  const smooth: Change = (patch, key) => {
    pendingRef.current = pendingRef.current ? mergeOverrides({ theme: {}, content: {}, ...pendingRef.current } as Overrides, patch) : patch
    setPending(pendingRef.current)
    swapRef.current(
      () => {
        const all = pendingRef.current
        pendingRef.current = null
        if (all) changeRef.current(all, key)
        setPending(null)
      },
      key === "layout" ? "move" : "recolor",
    )
  }
  // Leaving a step: the card fades out toward the side the coach is not heading to, then the next step comes in.
  const card = useRef<HTMLDivElement>(null)
  // Between steps the old card fades out over the new one (no empty gap); leaving the flow it fades out first.
  const leave = (dir: 1 | -1, then: () => void, overlap = true) => {
    const el = card.current
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return then()
    if (overlap) {
      ghostOut(el, dir)
      return then()
    }
    el.animate([{ opacity: 1, transform: "translateX(0)" }, { opacity: 0, transform: `translateX(${dir * -8}px)` }], { duration: 220, easing: EASE_OUT, fill: "forwards" }).onfinish = then
  }
  const index = STEPS.indexOf(step)
  const exit = `/admin/${community.slug}/getting-started`
  // Which way the coach moved, so the new step comes in from that side (adjusting state while rendering).
  const [seen, setSeen] = useState({ index, dir: 1 })
  if (seen.index !== index) setSeen({ index, dir: index > seen.index ? 1 : -1 })
  // While the name is being typed, the preview shows a caret after it (Love the onboarding).
  const [typing, setTyping] = useState(false)

  const go = (to: Step) => leave(STEPS.indexOf(to) > index ? 1 : -1, () => router.push(`${pathname}?step=${to}`))
  const finish = () =>
    leave(1, () => {
      updateCommunity(community.slug, { setup: { ...community.setup, design: true } })
      router.push(exit)
    }, false)

  return (
    <SignupFrame
      action={
        <AdminButton hierarchy="ghost" size="xl" nativeButton={false} render={<Link href={exit} />}>
          Save and exit
        </AdminButton>
      }
      aside={<Canvas slug={community.slug} step={index} coach={coach} theme={theme} typing={typing} swapRef={swapRef} />}
    >
      <style dangerouslySetInnerHTML={{ __html: MOTION_CSS }} />
      <div ref={card} key={step} className="flex flex-col" style={{ "--dx": `${seen.dir * 12}px` } as React.CSSProperties}>
        {step === "brand" && <BrandStep community={community} coach={coach} theme={theme} change={change} onNext={() => go("look")} onTyping={setTyping} />}
        {step === "look" && <LookStep theme={formTheme} change={smooth} onBack={() => go("brand")} onNext={() => go("layout")} />}
        {step === "layout" && <LayoutStep theme={formTheme} change={smooth} live={change} onBack={() => go("look")} onNext={finish} />}
      </div>
    </SignupFrame>
  )
}

type Change = ReturnType<typeof useDraftEditor>["change"]
type Coach = ReturnType<typeof resolveCoach>

/** The card's three parts, 24 px apart (Figma Card: padding 40, gap 24): title, fields, buttons. */
function StepCard({ title, text, children, onBack, next, nextLabel = "Continue", disabled }: { title: string; text: string; children: React.ReactNode; onBack?: () => void; next: () => void; nextLabel?: string; disabled?: boolean }) {
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        if (!disabled) next()
      }}
      className="flex flex-col gap-6"
    >
      <div className="onb-in" style={{ "--i": 0 } as React.CSSProperties}>
        <SignupTitle title={title} text={text} />
      </div>
      <div className="flex flex-col gap-6">
        {Children.toArray(children).map((c, i) => (
          <div key={i} className="onb-in" style={{ "--i": i + 1 } as React.CSSProperties}>
            {c}
          </div>
        ))}
      </div>
      <div className="onb-in flex items-center gap-4 pt-2" style={{ "--i": Children.count(children) + 1 } as React.CSSProperties}>
        {onBack && (
          <AdminButton type="button" hierarchy="ghost" size="xl" onClick={onBack} className="pl-0">
            <ArrowLeft /> Back
          </AdminButton>
        )}
        <AdminButton type="submit" size="xl" disabled={disabled} className="ml-auto">
          {nextLabel}
        </AdminButton>
      </div>
    </form>
  )
}

// ---------- 01 Brand

function BrandStep({ community, coach, theme, change, onNext, onTyping }: { community: CustomCommunity; coach: Coach; theme: CoachTheme; change: Change; onNext: () => void; onTyping: (on: boolean) => void }) {
  const file = useRef<HTMLInputElement>(null)
  const name = coach.name
  const initial = (name.trim()[0] ?? "T").toUpperCase()
  const setName = (v: string) => {
    const mark = (v.trim()[0] ?? community.mark).toUpperCase()
    // The platform's own name (the admin shows it) and the draft's (what students see until Go live publishes it).
    updateCommunity(community.slug, { name: v, mark })
    change({ content: { name: v, mark } }, "name")
  }
  const setColor = (c: string) => change({ theme: { primary: c, primaryForeground: onColor(c) } }, "primary")
  const onFile = async (f: File) => {
    try {
      change({ content: { logo: await pictureFrom(f, { max: 256, type: "image/png", keep: ["svg", "gif"] }) } }, "logo")
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  return (
    <StepCard title="Your brand" text="Add your logo and pick a colour. You’ll see it on your platform as you go." next={onNext} disabled={name.trim().length < 2}>
      <AdminField label="Platform name" error={name.trim().length < 2 ? "Give your platform a name." : undefined}>
        {(f) => (
          <span className="relative block">
            <input {...f} maxLength={MAX} value={name} onChange={(e) => setName(e.target.value)} onFocus={() => onTyping(true)} onBlur={() => onTyping(false)} className={cn(adminControl, "h-11 pr-16")} />
            <span aria-hidden className="pointer-events-none absolute inset-y-0 right-3 flex items-center t-caption text-a-text-3 tabular-nums">
              {name.length}/{MAX}
            </span>
          </span>
        )}
      </AdminField>

      <div className="flex flex-col gap-2">
        <span className="t-caption text-a-text">
          Logo <span className="text-a-text-3">· Optional</span>
        </span>
        <div className="flex items-center gap-3">
          <span aria-hidden className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full t-heading-s" style={{ background: coach.logo ? undefined : theme.primary, color: onColor(theme.primary) }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- the coach's upload, a data URL */}
            {coach.logo ? <img src={coach.logo} alt="" className="size-full object-cover" /> : initial}
          </span>
          <div className="flex min-w-0 flex-col items-start gap-1.5">
            <div className="flex items-center gap-1">
              <AdminButton type="button" hierarchy="secondary" size="sm" onClick={() => file.current?.click()}>
                <Plus /> {coach.logo ? "Replace logo" : "Upload logo"}
              </AdminButton>
              {coach.logo && (
                <AdminButton type="button" hierarchy="ghost" size="sm" iconOnly aria-label="Remove logo" onClick={() => change({ content: { logo: undefined } }, "logo")}>
                  <Trash2 />
                </AdminButton>
              )}
            </div>
            <span className="t-caption text-a-text-2">PNG, JPG, GIF or WebP. Square works best.</span>
          </div>
          <input
            ref={file}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void onFile(f)
              e.target.value = ""
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span id="brand-colour" className="t-caption text-a-text">
          Brand colour
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <div role="radiogroup" aria-labelledby="brand-colour" className="flex flex-wrap items-center gap-2.5 py-0.5 pl-0.5">
            {BRAND.map((c) => (
              <Swatch key={c} color={c} checked={c.toLowerCase() === theme.primary.toLowerCase()} onClick={() => setColor(c)} label={c.toUpperCase()} />
            ))}
          </div>
          <ColorInput value={theme.primary} onChange={setColor} label="Brand colour" className="min-w-40 flex-1" />
        </div>
      </div>
    </StepCard>
  )
}

/** A 24 px colour to pick; the picked one gets the strong ring (Figma "Dot", stroke icon/strong 2). */
function Swatch({ color, checked, onClick, label }: { color?: string; checked: boolean; onClick: () => void; label: string; children?: React.ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "relative size-6 shrink-0 rounded-full outline-none transition-[box-shadow,scale] duration-300 ease-out after:absolute after:-inset-2 after:content-[''] hover:scale-110 focus-visible:ring-2 focus-visible:ring-a-border-focus active:scale-[0.97]",
        checked && "ring-2 ring-a-icon-strong",
      )}
      style={{ background: color }}
    />
  )
}

/** Admin / Color field (Figma _Base Color field): a 22 px swatch that opens the picker, then the hex code. */
function ColorInput({ value, onChange, label, className }: { value: string; onChange: (c: string) => void; label: string; className?: string }) {
  const [draft, setDraft] = useState<string | null>(null)
  const HEX = /^#?[0-9a-f]{6}$/i
  const commit = (v: string) => {
    if (HEX.test(v.trim())) onChange(`#${v.trim().replace("#", "").toLowerCase()}`)
    setDraft(null)
  }
  return (
    <div className={cn("flex h-9 items-center gap-2.5 rounded-a-md border border-a-border bg-a-field py-1.5 pr-3 pl-2 transition-colors duration-300 focus-within:border-a-border-focus hover:border-a-border-strong", className)}>
      <ColorPicker value={value} onChange={onChange} label={label}>
        <button type="button" className="size-[22px] shrink-0 rounded-a-sm outline-none focus-visible:ring-2 focus-visible:ring-a-border-focus" style={{ background: value }} />
      </ColorPicker>
      <input
        aria-label={`${label} hex code`}
        value={draft ?? value.toUpperCase()}
        spellCheck={false}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          setDraft(e.target.value)
          if (HEX.test(e.target.value.trim())) onChange(`#${e.target.value.trim().replace("#", "").toLowerCase()}`)
        }}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            commit(e.currentTarget.value)
          }
          if (e.key === "Escape") setDraft(null)
        }}
        className="min-w-0 flex-1 bg-transparent t-mono-data text-a-text uppercase outline-none"
      />
    </div>
  )
}

// ---------- 02 Look

const THEMES = [
  { id: "terminal", name: "Terminal", text: "Dense, data first, dark", img: "/onboarding/look-terminal.webp" },
  { id: "atelier", name: "Atelier", text: "Editorial, calm, light", img: "/onboarding/look-atelier.webp" },
  { id: "pulse", name: "Pulse", text: "Bold, community first", img: "/onboarding/look-pulse.webp" },
] as const

const BACKGROUNDS: { id: BackgroundStyle; label: string }[] = [
  { id: "plain", label: "Plain" },
  { id: "grid", label: "Grid" },
  { id: "dots", label: "Dots" },
  { id: "glow", label: "Glow" },
  { id: "gradient", label: "Gradient" },
  { id: "image", label: "Image" },
]

function LookStep({ theme, change, onBack, onNext }: { theme: CoachTheme; change: Change; onBack: () => void; onNext: () => void }) {
  return (
    <StepCard title="Your look" text="Pick a theme, light or dark, and a background." onBack={onBack} next={onNext}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <span id="theme-label" className="t-caption text-a-text">
            Theme
          </span>
          <PillSegmented<Mode>
            label="Light or dark"
            value={theme.mode}
            onChange={(mode) => change({ theme: { mode } }, "mode")}
            options={[
              { value: "dark", label: "Dark" },
              { value: "light", label: "Light" },
            ]}
          />
        </div>
        <div role="radiogroup" aria-labelledby="theme-label" className="grid gap-3 sm:grid-cols-3">
          {THEMES.map((t) => {
            const look = LOOKS.find((l) => l.id === t.id)!
            return (
              <SelectionCard
                key={t.id}
                checked={theme.template === look.template}
                onSelect={() => theme.template !== look.template && change({ theme: { template: look.template, ...look.set } }, "look")}
                title={t.name}
                description={t.text}
                img={t.img}
                radius="rounded-a-sm"
              />
            )
          })}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span id="bg-label" className="t-caption text-a-text">
          Background
        </span>
        <div role="radiogroup" aria-labelledby="bg-label" className="flex flex-wrap gap-2">
          {BACKGROUNDS.map((b) => (
            <ChoiceChip
              key={b.id}
              checked={theme.background === b.id}
              onClick={() => change({ theme: b.id === "image" ? { background: "image", bgImage: theme.bgImage ?? "preset:candles" } : { background: b.id } }, "background")}
            >
              {b.label}
            </ChoiceChip>
          ))}
        </div>
      </div>
    </StepCard>
  )
}

/** Admin / Segmented (Figma: 36 px, padding 2, items 30 px; the active one on the panel fill). Radio semantics, arrows move. */
function PillSegmented<T extends string>({ value, onChange, options, label, className, style }: { value: T; onChange: (v: T) => void; options: readonly { value: T; label: string }[]; label: string; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      style={style}
      className={cn("inline-flex h-9 shrink-0 items-center gap-0.5 rounded-a-md border border-a-border p-0.5", className)}
      onKeyDown={(e) => {
        if (!["ArrowRight", "ArrowLeft"].includes(e.key)) return
        e.preventDefault()
        const i = options.findIndex((o) => o.value === value)
        const next = options[(i + (e.key === "ArrowRight" ? 1 : options.length - 1)) % options.length]
        onChange(next.value)
        ;(e.currentTarget.querySelector(`[data-value="${next.value}"]`) as HTMLElement | null)?.focus()
      }}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          data-value={o.value}
          aria-checked={o.value === value}
          tabIndex={o.value === value ? 0 : -1}
          onClick={() => onChange(o.value)}
          className={cn("h-[30px] rounded-a-sm px-3 t-body-m outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-a-border-focus pointer-coarse:h-10", o.value === value ? "bg-a-panel text-a-text" : "text-a-text-2 hover:text-a-text")}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Admin / Selection card (Figma _Base Selection card): the picture, the title with its radio, a line. Active = accent edge on the raised fill. */
function SelectionCard({ checked, onSelect, title, description, img, radius }: { checked: boolean; onSelect: () => void; title: string; description: string; img: string; radius: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-a-lg border p-2 text-left outline-none transition-[background-color,border-color,scale] duration-300 ease-out focus-visible:ring-2 focus-visible:ring-a-border-focus active:scale-[0.99]",
        checked ? "border-a-border-active bg-a-raised" : "border-a-border hover:border-a-border-strong",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static thumbnail exported from Figma */}
      <img src={img} alt="" className={cn("h-[100px] w-full border border-a-border-subtle object-cover object-left-top", radius)} />
      <span className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate t-body-m-medium text-a-text">{title}</span>
        <span aria-hidden className={cn("grid size-4 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors duration-300", checked ? "border-a-border-active" : "border-a-border-strong")}>
          <span className={cn("size-2 rounded-full bg-a-accent transition-transform duration-200 ease-out motion-reduce:transition-none", checked ? "scale-100" : "scale-0")} />
        </span>
      </span>
      <span className="t-body-m text-a-text-2">{description}</span>
    </button>
  )
}

// ---------- 03 Layout

type Layout = { id: string; name: string; text: string; img: string; nav: "side" | "top"; floating: boolean; set: "cards" | "open"; density?: CoachTheme["density"] }
const LAYOUTS: Layout[] = [
  { id: "side", name: "Side menu · Cards", text: "Menu on the left, widgets in cards", img: "/onboarding/layout-side.webp", nav: "side", floating: false, set: "cards" },
  { id: "top", name: "Top menu · Cards", text: "Menu in the header, widgets in cards", img: "/onboarding/layout-top.webp", nav: "top", floating: false, set: "cards" },
  { id: "floating", name: "Floating · Compact", text: "Page floats on the menu, dense widgets", img: "/onboarding/layout-floating.webp", nav: "side", floating: true, set: "cards", density: "compact" },
  { id: "blended", name: "Top menu · Blended", text: "Header menu, open widgets, airy", img: "/onboarding/layout-blended.webp", nav: "top", floating: false, set: "open", density: "airy" },
]

/** The layout the theme matches: the menu, whether the page floats, and how widgets sit. */
const layoutOf = (t: CoachTheme) => LAYOUTS.find((l) => l.nav === t.nav.layout && l.floating === (t.nav.frame === "floating") && l.set === (t.widgetSet === "open" ? "open" : "cards"))?.id

/** Ready-made profit and loss pairs (Figma Presets). */
const PAIRS = [
  { name: "Green and red", profit: "#22c55e", loss: "#ef4444" },
  { name: "Teal and rose", profit: "#14b8a6", loss: "#f43f5e" },
  { name: "Blue and orange (colour-blind safe)", profit: "#3b82f6", loss: "#f97316" },
]

function LayoutStep({ theme, change, live, onBack, onNext }: { theme: CoachTheme; change: Change; live: Change; onBack: () => void; onNext: () => void }) {
  const active = layoutOf(theme)
  const set = !!(theme.trading?.profit && theme.trading.loss)
  const profit = set ? theme.trading!.profit : theme.palettes[theme.mode].profit
  const loss = set ? theme.trading!.loss : theme.palettes[theme.mode].loss
  // A ready-made pair swaps the page like the other picks; a colour being picked or typed shows live.
  const write = (p: string, l: string) => change({ theme: { trading: { profit: p, loss: l } } }, "trading")
  const writeLive = (p: string, l: string) => live({ theme: { trading: { profit: p, loss: l } } }, "trading")
  const pick = (l: Layout) => {
    // Cards layouts go back to the look's own spacing; the other two set theirs.
    const density = l.density ?? LOOKS.find((x) => x.template === theme.template)?.set.density ?? theme.density
    // A header menu always names its pages (Pulse's icon-only rail reads as icons with no names up there); a side menu
    // goes back to the look's own style.
    const style = l.nav === "top" ? "labels" : (TEMPLATES[theme.template]?.theme.nav.style ?? theme.nav.style)
    change({ theme: { nav: { layout: l.nav, style, frame: l.floating ? "floating" : "classic" }, widgetSet: l.set, density } }, "layout")
  }

  return (
    <StepCard title="Your layout" text="How your platform is laid out. You can change it later in Design." onBack={onBack} next={onNext} nextLabel="Finish">
      <div role="radiogroup" aria-label="Layout" className="grid gap-3 sm:grid-cols-2">
        {LAYOUTS.map((l) => (
          <SelectionCard key={l.id} checked={active === l.id} onSelect={() => active !== l.id && pick(l)} title={l.name} description={l.text} img={l.img} radius="rounded-a-md" />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            <span className="flex items-center gap-1 t-body-m text-a-text-2">
              <ArrowUp aria-hidden className="size-4 text-a-success" /> Profit
            </span>
            <ColorInput value={profit} onChange={(c) => writeLive(c, loss)} label="Profit colour" />
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <span className="flex items-center gap-1 t-body-m text-a-text-2">
              <ArrowDown aria-hidden className="size-4 text-a-danger" /> Loss
            </span>
            <ColorInput value={loss} onChange={(c) => writeLive(profit, c)} label="Loss colour" />
          </div>
        </div>
        <div role="radiogroup" aria-label="Ready-made pairs" className="flex items-center gap-2.5">
          {PAIRS.map((p) => {
            const on = p.profit === profit.toLowerCase() && p.loss === loss.toLowerCase()
            return (
              <button
                key={p.name}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={`${p.name}: ${p.profit.toUpperCase()} up, ${p.loss.toUpperCase()} down`}
                title={p.name}
                onClick={() => write(p.profit, p.loss)}
                className={cn(
                  "relative flex size-6 shrink-0 overflow-hidden rounded-full outline-none transition-[box-shadow,scale] duration-300 ease-out hover:scale-110 focus-visible:ring-2 focus-visible:ring-a-border-focus active:scale-[0.97]",
                  on && "ring-2 ring-a-icon-strong",
                )}
              >
                <span className="h-full flex-1" style={{ background: p.profit }} />
                <span className="h-full flex-1" style={{ background: p.loss }} />
              </button>
            )
          })}
        </div>
        <span className="t-caption text-a-text-3">Used on charts, trades and results across your platform.</span>
      </div>
    </StepCard>
  )
}

// ---------- The canvas on the right

/** Figma: the canvas is 1103 px wide; the product screen sits at (96, 150) and is 917 px wide on the last step. */
const FIG = { w: 1103, left: 96, top: 150, screen: 917, screenH: 959 }
const BASE = 1440 // the platform is drawn at a desktop width, then scaled
const ZOOM = [2, 1.6, 1] // Brand, Look, Layout
/** The camera's move between steps. Any inline transition on the screen must keep it, or the zoom stops animating. */
const CAM = "transform 820ms cubic-bezier(0.65,0,0.35,1)"

/**
 * What a pick does to the preview. "recolor" (theme, light or dark, background, colours) changes how the page looks
 * but not where things are: one even fade of the live page, the same for all of them. "move" (layout, Home/Courses)
 * rearranges it: a View Transition lets what stays glide to its new place.
 */
type SwapKind = "recolor" | "move"
const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)"
/** Every swap in the preview moves on this curve. */
const SWAP_EASE = "cubic-bezier(0.65, 0, 0.35, 1)"
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Resolves once the page in the frame has re-rendered and gone quiet for a moment (or after 600 ms at most). */
function settled(frame: HTMLIFrameElement) {
  const doc = frame.contentDocument
  if (!doc?.documentElement) return wait(220)
  return new Promise<void>((done) => {
    let quiet: ReturnType<typeof setTimeout>
    const end = () => {
      mo.disconnect()
      clearTimeout(quiet)
      clearTimeout(cap)
      done()
    }
    const mo = new MutationObserver(() => {
      clearTimeout(quiet)
      quiet = setTimeout(end, 90)
    })
    // Structure, theme and classes only: the widgets' live counters and clock keep changing text and inline styles.
    mo.observe(doc.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "data-coach", "data-bg", "data-theme", "data-nav-fill", "data-nav-marker"] })
    quiet = setTimeout(end, 140)
    const cap = setTimeout(end, 600)
  })
}

/** Resolves once the frame's fonts and images are ready, so nothing pops in after the page fades back (500 ms cap). */
function painted(frame: HTMLIFrameElement) {
  const doc = frame.contentDocument
  if (!doc) return Promise.resolve()
  // Only pictures on screen: lazy ones further down never load while the preview shows the top of the page.
  const h = doc.defaultView?.innerHeight ?? 0
  const images = [...doc.images].filter((i) => !i.complete && i.getBoundingClientRect().top < h).map((i) => i.decode().catch(() => {}))
  return Promise.race([Promise.all([doc.fonts?.ready, ...images]).then(() => {}), wait(400)])
}

/** The page's own background, so the screen keeps its colour while the page in it fades out and in. */
const pageBg = (frame: HTMLIFrameElement) => {
  const doc = frame.contentDocument
  if (!doc?.body) return ""
  const b = getComputedStyle(doc.body).backgroundColor
  return b && b !== "rgba(0, 0, 0, 0)" ? b : getComputedStyle(doc.documentElement).backgroundColor
}

/**
 * Injected into the preview. No scrollbars: it is a picture of the platform, not a page to scroll. And the View Transition
 * used for swaps (onboarding-2, Natural connect): the menu, header, title and every widget that is still there after the
 * change glides to its new place and size; the rest crossfades. No blur: a slow, even crossfade reads as calmer.
 */
const PREVIEW_CSS = `html,body,*{scrollbar-width:none!important}::-webkit-scrollbar{display:none!important;width:0!important;height:0!important}
[data-slot=widget],header,nav,h1{view-transition-name:match-element}
@keyframes onbvt-in{from{opacity:0}}
@keyframes onbvt-out{to{opacity:0}}
::view-transition-group(*){overflow:clip;animation-duration:640ms;animation-timing-function:cubic-bezier(0.65,0,0.35,1)}
::view-transition-old(*){animation:onbvt-out 420ms cubic-bezier(0.65,0,0.35,1) both}
::view-transition-new(*){animation:onbvt-in 520ms cubic-bezier(0.65,0,0.35,1) 60ms both}
::view-transition-old(*),::view-transition-new(*){height:100%;object-fit:none;object-position:left top}
::view-transition-old(root){animation:onbvt-out 420ms cubic-bezier(0.65,0,0.35,1) both}
::view-transition-new(root){animation:onbvt-in 520ms cubic-bezier(0.65,0,0.35,1) both}
html[data-onb-swap] *,html[data-onb-swap] *::before,html[data-onb-swap] *::after{transition:none!important}`

function Canvas({ slug, step, coach, theme, typing, swapRef }: { slug: string; step: number; coach: Coach; theme: CoachTheme; typing: boolean; swapRef: React.RefObject<(apply: () => void | Promise<void>, kind?: SwapKind) => void> }) {
  const box = useRef<HTMLDivElement>(null)
  const screen = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [page, setPage] = useState<"home" | "courses">("home")
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /**
   * Swapping what the preview shows (a theme, light or dark, a background, a layout, the page): the page fades out to
   * its own background, the change lands while it can't be seen, and once the frame has re-rendered the new page comes
   * back into focus (Midday). A second pick during a swap joins it instead of starting another.
   */
  const busy = useRef(false)
  const queued = useRef<(() => void | Promise<void>) | null>(null)
  // Whether anything in the queue moves things (then the round is a View Transition, otherwise a fade).
  const moving = useRef(false)
  const swap = useCallback(
    (apply: () => void | Promise<void>, kind: SwapKind = "recolor") => {
      const el = frame.current
      const shell = screen.current
      if (!el || !shell || step === 0 || reduced()) return void apply()
      moving.current = (busy.current && queued.current ? moving.current : false) || kind === "move"
      queued.current = apply
      if (busy.current) return
      busy.current = true
      const drain = async () => {
        while (queued.current) {
          const run = queued.current
          queued.current = null
          await run()
          await settled(el)
        }
        await painted(el)
      }
      void (async () => {
        while (queued.current) {
          const doc = el.contentDocument as (Document & { startViewTransition?: (cb: () => Promise<void>) => { finished: Promise<void> } }) | null
          const move = moving.current && !!doc?.startViewTransition
          moving.current = false
          if (doc?.documentElement) doc.documentElement.dataset.onbSwap = ""
          if (move) {
            // Layout and page: what stays glides to its new place and size, the rest crossfades.
            const vt = doc!.startViewTransition!(async () => {
              await drain()
              shell.style.transition = `${CAM}, background-color 460ms ${SWAP_EASE}`
              shell.style.backgroundColor = pageBg(el)
            })
            await vt.finished.catch(() => {})
          } else {
            // Theme, light or dark, background, colours: the live page fades to its own background, the change lands
            // unseen, and the new look fades in. No snapshots, so it stays sharp at any zoom, and all of them match.
            shell.style.transition = CAM
            shell.style.backgroundColor = pageBg(el)
            const out = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: SWAP_EASE, fill: "forwards" })
            await out.finished.catch(() => {})
            await drain()
            shell.style.transition = `${CAM}, background-color 420ms ${SWAP_EASE}`
            shell.style.backgroundColor = pageBg(el)
            const back = el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: SWAP_EASE })
            out.cancel()
            await back.finished.catch(() => {})
          }
          const now = el.contentDocument?.documentElement
          if (now) delete now.dataset.onbSwap
        }
        busy.current = false
      })()
    },
    [step],
  )
  useEffect(() => {
    swapRef.current = swap
  }, [swap, swapRef])

  // Home and Courses: the link inside the preview is followed, so the platform changes page without reloading.
  const at = useRef<"home" | "courses">("home")
  const goTo = useCallback(
    (to: "home" | "courses") => {
      at.current = to
      const doc = frame.current?.contentDocument
      const href = to === "courses" ? `/c/${slug}/courses` : `/c/${slug}`
      const link = doc?.querySelector<HTMLAnchorElement>(`a[href="${href}"]`)
      if (link) link.click()
      else if (frame.current) frame.current.src = `${href}?preview=draft`
      // Done once the frame is on the new page (client navigation takes a moment), or after 1.5 s at most.
      return new Promise<void>((done) => {
        const t0 = performance.now()
        const check = () => (frame.current?.contentWindow?.location.pathname === href || performance.now() - t0 > 1500 ? done() : setTimeout(check, 40))
        check()
      })
    },
    [slug],
  )
  // Back from Layout: the preview returns to Home (the toggle at once, the frame right after).
  if (step !== 2 && page !== "home") setPage("home")
  useEffect(() => {
    if (step !== 2 && at.current !== "home") goTo("home")
  }, [step, goTo])

  // Figma's geometry, scaled with the canvas (1:1 at 1103 px, larger on big screens so the screen still fills it).
  const k = size.w / FIG.w
  const base = (FIG.screen * k) / BASE // scale on the last step
  const scale = base * ZOOM[step]
  // The screen keeps Figma's proportions (917 × 959 on the last step): a 1440 px wide platform, 1506 px tall. On big
  // canvases it grows with them, so it always runs off the bottom instead of leaving an empty strip under the page.
  // On canvases taller than Figma's it reaches past the bottom edge too; the page's own background fills what the page
  // doesn't (the screen takes it from the page).
  const height = Math.round(Math.max((FIG.screenH / FIG.screen) * BASE, base ? (size.h - FIG.top * k) / base + 24 : 0))

  return (
    // The Editor's canvas (the same grey as the Design workspace) with its dot grid.
    <div ref={box} className="relative size-full overflow-hidden bg-[#2b2b2e] before:absolute before:inset-y-0 before:left-0 before:z-10 before:w-px before:bg-a-border" style={{ backgroundImage: "radial-gradient(circle, var(--admin-color-border-default) 1px, transparent 1.4px)", backgroundSize: "16px 16px" }}>
      {size.w > 0 && (
        <>
          <div
            ref={screen}
            aria-hidden
            className="onb-cam absolute overflow-hidden bg-a-page"
            style={{ left: FIG.left * k, top: FIG.top * k, width: BASE, height, transform: `scale(${scale})`, transformOrigin: "0 0", borderRadius: (16 * k) / base }}
          >
            {/* Under the skeleton the real platform waits, hidden; leaving Brand it fades in as the skeleton dissolves. */}
            <iframe
              ref={frame}
              onLoad={(e) => {
                const doc = e.currentTarget.contentDocument
                if (doc?.head) {
                  const css = doc.getElementById("onb-preview-css") ?? doc.head.appendChild(Object.assign(doc.createElement("style"), { id: "onb-preview-css" }))
                  css.textContent = PREVIEW_CSS
                }
                if (screen.current) screen.current.style.backgroundColor = pageBg(e.currentTarget)
              }}
              src={`/c/${slug}?preview=draft`}
              title="Preview of your platform"
              tabIndex={-1}
              scrolling="no"
              className={cn("onb-frame pointer-events-none size-full border-0", step === 0 && "onb-frame-off")}
            />
            <Skeleton coach={coach} theme={theme} typing={typing} gone={step !== 0} />
          </div>
          {/* Figma: 60 px above the screen, on its left edge. It comes in once the camera has settled on Layout and fades out
              when the coach goes back; meanwhile it can't be reached. */}
          <div inert={step !== 2} aria-hidden={step !== 2 || undefined} className={cn("onb-pill absolute", step === 2 && "onb-pill-on")} style={{ left: FIG.left * k, top: FIG.top * k - 60 }}>
            <PillSegmented
              label="Preview page"
              value={page}
              onChange={(to) => (setPage(to), swap(() => goTo(to), "move"))}
              options={[
                { value: "home", label: coach.wording.home },
                { value: "courses", label: coach.wording.courses },
              ]}
              className="bg-a-page"
            />
          </div>
          <Ring step={step} />
        </>
      )}
    </div>
  )
}

/** "Design progress · n of 3": a 24 px ring, top right. */
function Ring({ step }: { step: number }) {
  const r = 10
  const c = 2 * Math.PI * r
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" role="img" aria-label={`Step ${step + 1} of 3`} className="absolute top-10 right-10 -rotate-90">
      <circle cx="12" cy="12" r={r} fill="none" strokeWidth="2.5" style={{ stroke: "var(--admin-color-border-default)" }} />
      <circle cx="12" cy="12" r={r} fill="none" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - (step + 1) / 3)} className="transition-[stroke-dashoffset] duration-500 ease-out motion-reduce:transition-none" style={{ stroke: "var(--admin-color-accent-default)" }} />
    </svg>
  )
}

/**
 * Brand step: the platform as a skeleton; only the name and the logo (or its initial) in the brand colour are real, and
 * they follow the form as it is filled (the name letter by letter, with a caret while typing). It assembles block by block
 * when it appears and dissolves the same way, top left first, when the coach moves on (Dashboard skeleton loading).
 */
function Skeleton({ coach, theme, typing, gone }: { coach: Coach; theme: CoachTheme; typing: boolean; gone: boolean }) {
  const bar = "onb-shimmer rounded-full bg-a-muted"
  const name = coach.name || "Your platform"
  const block = (i: number) => ({ "data-skel": "", style: { "--i": i } as React.CSSProperties })
  return (
    <div className={cn("onb-skel absolute inset-0 flex", gone && "onb-skel-gone pointer-events-none")}>
      <aside className="flex w-[230px] shrink-0 flex-col border-r border-a-border-subtle bg-a-page" {...block(0)}>
        <div className="flex h-[70px] items-center gap-3 px-4">
          <span className="onb-mark grid size-[26px] shrink-0 place-items-center overflow-hidden rounded-a-sm t-caption" style={{ background: coach.logo ? undefined : theme.primary, color: onColor(theme.primary) }}>
            {coach.logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- the coach's upload, a data URL
              <img key={coach.logo.slice(-24)} src={coach.logo} alt="" className="onb-char size-full object-cover" />
            ) : (
              <span key={(coach.name.trim()[0] ?? "T").toUpperCase()} className="onb-char">
                {(coach.name.trim()[0] ?? "T").toUpperCase()}
              </span>
            )}
          </span>
          <span className="flex min-w-0 flex-1 items-center truncate t-body-m-medium text-a-text">
            {[...name].map((c, i) => (
              <span key={`${i}${c}`} className="onb-char whitespace-pre">
                {c}
              </span>
            ))}
            {typing && <span aria-hidden className="onb-caret ml-px inline-block h-4 w-px bg-a-text" />}
          </span>
          <ChevronsUpDown className="size-3.5 text-a-icon" />
        </div>
        <div className="flex flex-col gap-3.5 px-4 pt-3">
          {[60, 44, 48, 38, 47, 62, 43, 54, 50].map((w, i) => (
            <span key={i} className="flex items-center gap-3" {...block(i + 1)}>
              <span className="size-3 rounded-full bg-a-muted" />
              <span className={cn("h-2.5", bar)} style={{ width: `${w}%` }} />
            </span>
          ))}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col bg-a-sunk" {...block(1)}>
        <div className="flex h-[70px] items-center border-b border-a-border-subtle px-5">
          <PanelLeft className="size-4 text-a-icon" />
        </div>
        <div className="flex flex-col gap-3 px-8 pt-6">
          <span className={cn("h-2 w-24", bar)} {...block(2)} />
          <span className={cn("h-4 w-[45%]", bar)} {...block(3)} />
          <div className="mt-2 grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              // Diagonal order: each card one beat after the one above or to its left.
              <div key={i} className="flex h-[180px] flex-col gap-3 rounded-a-sm bg-a-panel p-3" {...block(4 + (i % 3) + Math.floor(i / 3))}>
                <span className={cn("h-1.5 w-1/3", bar)} />
                <span className={cn("h-4 w-1/3", bar)} />
                <span className={cn("h-1.5 w-3/4", bar)} />
                <span className={cn("h-1.5 w-1/2", bar)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * The Design flow's motion (references: Love the onboarding, Midday, Dashboard skeleton loading, Damn Good UI cards).
 * Text and blocks fade in a few pixels from the side the coach is heading to (no blur, Gustavo 13/11); the camera moves
 * on a gentle ease-in-out; the skeleton dissolves into the real platform. Reduced motion keeps only short fades.
 */
const MOTION_CSS = `
@keyframes onb-in{from{opacity:0;transform:translate3d(var(--dx,0px),var(--dy,0px),0)}}
@keyframes onb-char{from{opacity:0;transform:translateY(2px)}}
@keyframes onb-blink{50%{opacity:0}}
@keyframes onb-shimmer{from{background-position:150% 0}to{background-position:-50% 0}}
@keyframes onb-fade{from{opacity:0}}
.onb-in{animation:onb-in 480ms cubic-bezier(0.23,1,0.32,1) both;animation-delay:calc(min(var(--i,0), 6) * 45ms + var(--d,0ms))}
.onb-char{display:inline-block;animation:onb-char 240ms cubic-bezier(0.23,1,0.32,1) both}
.onb-caret{animation:onb-blink 1s steps(1) infinite}
.onb-mark{transition:background-color 300ms ease}
.onb-shimmer{background-image:linear-gradient(90deg,transparent 0%,rgb(255 255 255/0.05) 50%,transparent 100%);background-size:200% 100%;background-repeat:no-repeat;animation:onb-shimmer 1.8s linear infinite}
.onb-cam{transition:${CAM}}
.onb-pill{opacity:0;transform:translateY(-4px);transition:opacity 260ms cubic-bezier(0.23,1,0.32,1),transform 260ms cubic-bezier(0.23,1,0.32,1)}
.onb-pill-on{opacity:1;transform:none;transition-duration:420ms;transition-delay:480ms}
.onb-frame{transition:opacity 640ms cubic-bezier(0.65,0,0.35,1) 160ms}
.onb-frame-off{opacity:0;transition-delay:0ms}
.onb-skel [data-skel]{animation:onb-in 420ms cubic-bezier(0.23,1,0.32,1) backwards;animation-delay:calc(var(--i,0) * 40ms);transition:opacity 480ms cubic-bezier(0.65,0,0.35,1);transition-delay:calc(var(--i,0) * 30ms)}
.onb-skel-gone [data-skel]{opacity:0}
@media (prefers-reduced-motion:reduce){
  .onb-in{animation:onb-fade 200ms ease-out both!important;animation-delay:0ms!important}
  .onb-skel [data-skel]{animation:onb-fade 200ms ease-out backwards!important;animation-delay:0ms!important}
  .onb-char{animation:none}
  .onb-caret,.onb-shimmer{animation:none}
  .onb-cam{transition:none}
  .onb-pill{transform:none!important;transition:opacity 200ms ease-out!important}
  .onb-frame,.onb-skel [data-skel]{transition:opacity 200ms ease-out!important;transition-delay:0ms!important;transform:none!important}
}
`
