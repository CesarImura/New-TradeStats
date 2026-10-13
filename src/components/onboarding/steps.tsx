"use client"

import { useEffect, useRef, useState } from "react"
import { BookOpen, Bot, CalendarDays, Check, CircleAlert, ImagePlus, Landmark, Loader2, MessagesSquare, NotebookPen, Trash2, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { COACHES, type ModuleId } from "@/lib/data/coaches"
import { customCommunities, slugify } from "@/lib/data/communities"
import { useAccount } from "@/lib/data/use-communities"
import { isDark, themeToCss } from "@/lib/theme/css"
import { colorsFromLogo } from "@/lib/theme/logo-colors"
import { resolveTheme } from "@/lib/theme/resolve"
import { TEMPLATES } from "@/lib/theme/templates"
import type { TemplateId } from "@/lib/theme/types"
import { cn } from "@/lib/utils"
import { Choice, mono } from "./frame"
import { suggestedTemplate } from "./suggest"
import type { StepProps } from "./wizard"

const onColor = (hex: string) => (isDark(hex) ? "#ffffff" : "#0a0a0a")

function Row({ label, hint, htmlFor, children }: { label: string; hint?: React.ReactNode; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={htmlFor} className="text-[0.8rem] font-normal text-muted-foreground">
          {label}
        </Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

// ---------- ONB-08 · Template

export function TemplateStep({ community, update }: StepProps) {
  const acc = useAccount()
  const suggested = suggestedTemplate(acc?.answers)
  return (
    <div className="grid gap-3" role="radiogroup" aria-label="Template">
      {(Object.keys(TEMPLATES) as TemplateId[]).map((id) => {
        const on = community.template === id
        const theme = resolveTheme({ ...community, template: id, overrides: {} })
        return (
          <button
            key={id}
            role="radio"
            aria-checked={on}
            onClick={() => update({ template: id, overrides: {} })}
            className={cn(
              "grid grid-cols-[132px_1fr] items-center gap-4 rounded-[var(--radius)] border bg-card p-2.5 pr-4 text-left transition-colors hover:border-white/25",
              on && "border-[var(--ts-orange)] hover:border-[var(--ts-orange)]",
            )}
          >
            <style dangerouslySetInnerHTML={{ __html: themeToCss(theme, `.onb-tpl-${id}`) }} />
            <span
              className={`onb-tpl-${id} grid aspect-[4/3] grid-cols-[18px_1fr] gap-1.5 overflow-hidden rounded-[min(var(--radius),6px)] bg-background p-1.5`}
              style={{ fontFamily: "var(--coach-font-heading)" }}
              aria-hidden
            >
              <span className={cn("rounded-[min(var(--radius),4px)] bg-sidebar", theme.nav.layout === "top" && "hidden")} />
              <span className={cn("grid content-start gap-1.5", theme.nav.layout === "top" && "col-span-2")}>
                <span className="text-[0.55rem] leading-none text-foreground">Welcome back</span>
                <span className="grid gap-1 rounded-[min(var(--radius),5px)] bg-card p-1.5" style={{ boxShadow: "var(--card-shadow)" }}>
                  <span className="h-1 w-3/4 rounded-full bg-foreground/35" />
                  <span className="h-1 overflow-hidden rounded-full bg-muted">
                    <span className="block h-full w-3/5 bg-primary" />
                  </span>
                  <span className="h-2.5 w-9 rounded-[var(--button-radius)] bg-primary" />
                </span>
                <span className="grid grid-cols-2 gap-1">
                  <span className="h-5 rounded-[min(var(--radius),4px)] bg-card" style={{ boxShadow: "var(--card-shadow)" }} />
                  <span className="h-5 rounded-[min(var(--radius),4px)] bg-card" style={{ boxShadow: "var(--card-shadow)" }} />
                </span>
              </span>
            </span>
            <span className="grid gap-1">
              <span className="flex items-center gap-2">
                <span className="text-base">{TEMPLATES[id].name}</span>
                {id === suggested && (
                  <Badge variant="outline" className={cn(mono, "h-5 border-[var(--ts-orange)]/50 text-[0.58rem] text-[var(--ts-orange)]")}>
                    Fits you
                  </Badge>
                )}
              </span>
              <span className="text-xs text-muted-foreground">{TEMPLATES[id].blurb}</span>
            </span>
          </button>
        )
      })}
      <p className="text-xs text-muted-foreground">Click one to see it full size on the right. You can switch template any time from Design.</p>
    </div>
  )
}

// ---------- ONB-09 · Name & address

const RESERVED = ["admin", "app", "www", "help", "api", "login", "signup", "setup", "tradestats"]

export function AddressStep({ community, update, setReady }: StepProps) {
  const [touched, setTouched] = useState(!!community.address)
  const address = community.address ?? slugify(community.name)
  const taken =
    RESERVED.includes(address) ||
    COACHES.some((c) => c.slug === address) ||
    customCommunities().some((c) => c.slug === address && c.slug !== community.slug)
  const valid = /^[a-z0-9][a-z0-9-]{1,39}$/.test(address) && !address.startsWith("new-")
  const ok = valid && !taken && community.name.trim().length > 1

  useEffect(() => setReady(ok), [ok, setReady])

  return (
    <div className="grid gap-6">
      <Row label="Platform name" htmlFor="pname" hint={`${community.name.length}/40`}>
        <Input
          id="pname"
          value={community.name}
          maxLength={40}
          autoFocus
          className="h-11 text-base"
          onChange={(e) => {
            const name = e.target.value
            const initials = name
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((w) => w[0]?.toUpperCase())
              .join("")
            update({ name, org: name || community.org, mark: initials || community.mark, ...(touched ? {} : { address: slugify(name) }) })
          }}
        />
      </Row>

      <Row label="Web address" htmlFor="paddr" hint="Free · your own domain later in Settings">
        <div className="flex h-11 items-center rounded-[var(--radius)] border border-input bg-card focus-within:border-[var(--ts-orange)] focus-within:ring-2 focus-within:ring-[var(--ts-orange)]/25">
          <span className="pl-3 text-sm text-muted-foreground">https://</span>
          <input
            id="paddr"
            value={address}
            onChange={(e) => {
              setTouched(true)
              update({ address: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40) })
            }}
            className="h-full min-w-0 flex-1 bg-transparent px-0.5 text-sm outline-none"
            spellCheck={false}
          />
          <span className="pr-3 text-sm text-muted-foreground">.tradestats.app</span>
        </div>
        <span className={cn("flex items-center gap-1.5 text-xs", ok ? "text-[var(--ts-yellow)]" : "text-[var(--ts-orange)]")}>
          {ok ? <Check className="size-3.5" /> : <CircleAlert className="size-3.5" />}
          {!community.name.trim()
            ? "Give your platform a name first."
            : taken
              ? "That address is taken. Try adding your name or a word like ‘academy’."
              : !valid
                ? "Use 2–40 letters, numbers or dashes."
                : "Available"}
        </span>
      </Row>

      <Row label="What do students call you?" htmlFor="cname" hint="Used in messages like “Marco replied”">
        <Input id="cname" value={community.coachName} onChange={(e) => update({ coachName: e.target.value })} className="h-11" />
      </Row>
    </div>
  )
}

// ---------- ONB-10 · Logo & colours

const BRAND = ["#ff5500", "#e11d48", "#7c3aed", "#3d5afe", "#0ea5e9", "#16a34a", "#1f5a45", "#ca8a04", "#0a0a0a"]

export function BrandStep({ community, update }: StepProps) {
  const theme = resolveTheme(community)
  const [suggested, setSuggested] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const setColor = (c: string) => update({ overrides: { ...community.overrides, primary: c, primaryForeground: onColor(c) } })

  const onFile = async (file: File) => {
    setBusy(true)
    const url = await new Promise<string>((res) => {
      const r = new FileReader()
      r.onload = () => res(r.result as string)
      r.readAsDataURL(file)
    })
    const small = await shrink(url, 256)
    const colors = await colorsFromLogo(small)
    update({ logo: small, ...(colors[0] ? { overrides: { ...community.overrides, primary: colors[0], primaryForeground: onColor(colors[0]) } } : {}) })
    setSuggested(colors)
    setBusy(false)
  }

  return (
    <div className="grid gap-7">
      <Row label="Logo" hint="PNG or SVG · square works best">
        <div
          className="flex items-center gap-4 rounded-[var(--radius)] border border-dashed border-white/20 p-4"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const f = e.dataTransfer.files[0]
            if (f?.type.startsWith("image/")) onFile(f)
          }}
        >
          {community.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={community.logo} alt="Your logo" className="size-14 rounded-[var(--radius)] bg-white object-contain p-1.5" />
          ) : (
            <span className="grid size-14 place-items-center rounded-[var(--radius)] text-lg font-semibold" style={{ background: theme.primary, color: theme.primaryForeground }}>
              {community.mark}
            </span>
          )}
          <div className="grid gap-1.5">
            <div className="flex gap-2">
              <button onClick={() => input.current?.click()} className="flex items-center gap-1.5 text-sm underline underline-offset-4">
                {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />} {community.logo ? "Replace logo" : "Upload logo"}
              </button>
              {community.logo && (
                <button
                  onClick={() => {
                    update({ logo: undefined })
                    setSuggested([])
                  }}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Remove logo"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
            <span className="text-xs text-muted-foreground">or drop it here. No logo? We use your initials.</span>
          </div>
          <input
            ref={input}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onFile(f)
              e.target.value = ""
            }}
          />
        </div>
      </Row>

      <Row label="Brand colour" hint={suggested.length ? "First one picked from your logo" : undefined}>
        {suggested.length > 0 && (
          <div className="flex items-center gap-2">
            <span className={cn(mono, "text-[0.6rem] text-muted-foreground")}>From your logo</span>
            {suggested.map((c) => (
              <ColorDot key={c} color={c} on={theme.primary.toLowerCase() === c.toLowerCase()} onClick={() => setColor(c)} />
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {BRAND.map((c) => (
            <ColorDot key={c} color={c} on={theme.primary.toLowerCase() === c} onClick={() => setColor(c)} />
          ))}
          <label className="relative grid size-8 cursor-pointer place-items-center rounded-full bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)]" title="Any colour">
            <input type="color" value={theme.primary} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Pick any colour" />
          </label>
        </div>
      </Row>

      <Row label="Background">
        <div className="grid grid-cols-2 gap-2" role="radiogroup">
          {(["light", "dark"] as const).map((m) => (
            <Choice
              key={m}
              checked={theme.mode === m}
              onClick={() => update({ overrides: { ...community.overrides, mode: m } })}
              title={m === "light" ? "Light" : "Dark"}
              text={m === "light" ? "Bright and open" : "Like a trading terminal"}
            />
          ))}
        </div>
      </Row>
      <p className="text-xs text-muted-foreground">Fonts, corners, menu layout and more are in Design once you&apos;re set up.</p>
    </div>
  )
}

function ColorDot({ color, on, onClick }: { color: string; on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={color}
      aria-pressed={on}
      className={cn("grid size-8 place-items-center rounded-full ring-1 ring-white/15", on && "ring-2 ring-white ring-offset-2 ring-offset-background")}
      style={{ background: color }}
    >
      {on && <Check className="size-4" style={{ color: onColor(color) }} />}
    </button>
  )
}

async function shrink(dataUrl: string, max: number) {
  if (dataUrl.startsWith("data:image/svg")) return dataUrl
  const img = new Image()
  img.src = dataUrl
  await img.decode()
  const s = Math.min(1, max / Math.max(img.width, img.height))
  const c = document.createElement("canvas")
  c.width = Math.round(img.width * s)
  c.height = Math.round(img.height * s)
  c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height)
  return c.toDataURL("image/png")
}

// ---------- ONB-11 · Modules

const MODULES: { id: ModuleId; name: string; text: string; icon: React.ComponentType<{ className?: string }>; later?: boolean }[] = [
  { id: "courses", name: "Courses", text: "Video lessons in modules, with progress", icon: BookOpen },
  { id: "calendar", name: "Calendar", text: "Live sessions, replays and 1:1 bookings", icon: CalendarDays },
  { id: "journal", name: "Journal", text: "Students log trades and ask you for reviews", icon: NotebookPen },
  { id: "community", name: "Community", text: "Posts and chat, or a link to your Discord", icon: MessagesSquare },
  { id: "ai", name: "AI assistant", text: "Answers questions from your own lessons", icon: Bot },
  { id: "ranking", name: "Ranking", text: "Leaderboard by consistency and progress", icon: Trophy, later: true },
]

export function ModulesStep({ community, update }: StepProps) {
  const acc = useAccount()
  return (
    <div className="grid gap-4">
      {acc?.answers && <p className={cn(mono, "text-[0.62rem] text-[var(--ts-yellow)]")}>Switched on from your answers</p>}
      <div className="grid divide-y rounded-[var(--radius)] border bg-card">
        {MODULES.map((m) => {
          const on = community.modules[m.id]
          return (
            <label key={m.id} className="flex cursor-pointer items-center gap-3.5 px-4 py-3.5">
              <m.icon className={cn("size-5 shrink-0", on ? "text-[var(--ts-orange)]" : "text-muted-foreground")} />
              <span className="grid min-w-0 flex-1 gap-0.5">
                <span className="flex items-center gap-2 text-sm">
                  {m.name}
                  {m.later && (
                    <Badge variant="outline" className="h-4.5 px-1.5 text-[0.6rem] text-muted-foreground">
                      Coming soon
                    </Badge>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">{m.text}</span>
              </span>
              <Switch checked={on} disabled={m.later} onCheckedChange={(v) => update({ modules: { ...community.modules, [m.id]: v } })} />
            </label>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground">Rename any section (e.g. Courses → Playbook) in Design → Menu and words.</p>
    </div>
  )
}

// ---------- ONB-12 · First tier

const CADENCES = [
  { id: "month", label: "Monthly" },
  { id: "quarter", label: "Every 3 months" },
  { id: "year", label: "Yearly" },
  { id: "once", label: "One payment" },
]

export function TierStep({ community, update, setReady }: StepProps) {
  const tier = community.tiers[0] ?? { id: "core", name: "", price: "€49", cadence: "month", members: 0 }
  const free = tier.price === "Free"
  const amount = free ? "" : tier.price.replace(/[^\d.,]/g, "")
  const set = (patch: Partial<typeof tier>) => update({ tiers: [{ ...tier, ...patch }, ...community.tiers.slice(1)] })
  const ok = tier.name.trim().length > 0 && (free || Number(amount.replace(",", ".")) > 0)

  useEffect(() => setReady(ok), [ok, setReady])
  // Save the starting values so the tier exists even if nothing is typed.
  useEffect(() => {
    if (!community.tiers.length) set({ name: "Core" })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Free or paid">
        <Choice checked={!free} onClick={() => set({ price: "€49" })} title="Paid" text="Students pay to join" />
        <Choice checked={free} onClick={() => set({ price: "Free", cadence: "month" })} title="Free" text="To grow an audience first" />
      </div>

      <Row label="Tier name" htmlFor="tname" hint="e.g. Core, Academy, Inner Circle">
        <Input id="tname" value={tier.name} onChange={(e) => set({ name: e.target.value })} className="h-11" />
      </Row>

      {!free && (
        <>
          <Row label="Price" htmlFor="tprice" hint="Euro · tax added at checkout where needed">
            <div className="flex h-11 items-center rounded-[var(--radius)] border border-input bg-card focus-within:border-[var(--ts-orange)] focus-within:ring-2 focus-within:ring-[var(--ts-orange)]/25">
              <span className="pl-3 text-muted-foreground">€</span>
              <input
                id="tprice"
                inputMode="decimal"
                value={amount}
                onChange={(e) => set({ price: `€${e.target.value.replace(/[^\d.,]/g, "")}` })}
                className="h-full min-w-0 flex-1 bg-transparent px-2 tabular-nums outline-none"
              />
            </div>
          </Row>
          <Row label="Billing">
            <div className="grid grid-cols-2 gap-2" role="radiogroup">
              {CADENCES.map((c) => (
                <Choice key={c.id} checked={tier.cadence === c.id} onClick={() => set({ cadence: c.id })} title={c.label} />
              ))}
            </div>
          </Row>
        </>
      )}

      <div className="flex items-baseline justify-between border-t pt-4 text-sm">
        <span className="text-muted-foreground">Students will see</span>
        <span>
          <span className="text-foreground">{tier.name || "Your tier"}</span>
          <span className="text-muted-foreground">
            {" · "}
            {free ? "Free" : `${tier.price}${tier.cadence === "once" ? " once" : ` / ${tier.cadence}`}`}
          </span>
        </span>
      </div>
      <p className="text-xs text-muted-foreground">Trials, discounts, extra tiers and who sees what are in Tiers &amp; access.</p>
    </div>
  )
}

// ---------- ONB-14 · Get paid

export function PayoutsStep({ community, update }: StepProps) {
  const [busy, setBusy] = useState(false)
  const connected = community.setup?.payouts === "connected"
  const paid = community.tiers.some((t) => t.price !== "Free")

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 rounded-[var(--radius)] border bg-card p-5">
        <div className="flex items-start gap-3.5">
          <span className={cn("grid size-10 shrink-0 place-items-center bg-white/5", connected && "bg-[var(--ts-yellow)] text-[#040404]")}>
            {connected ? <Check className="size-5" strokeWidth={2.5} /> : <Landmark className="size-5" />}
          </span>
          <div className="grid gap-1">
            <span className="text-base">{connected ? "Payouts connected" : "Connect your payouts"}</span>
            <span className="text-sm text-muted-foreground">
              {connected
                ? "Money from your students arrives in your bank account every week."
                : "A short form with our payment partner: who you are and where the money goes. About 5 minutes."}
            </span>
          </div>
        </div>
        {!connected && (
          <button
            disabled={busy}
            onClick={() => {
              setBusy(true)
              setTimeout(() => update({ setup: { ...community.setup, payouts: "connected" } }), 1200)
            }}
            className="flex h-11 items-center justify-center gap-2 bg-[var(--ts-yellow)] text-sm text-[#040404] disabled:opacity-70"
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Opening secure form…
              </>
            ) : (
              "Start payout setup"
            )}
          </button>
        )}
      </div>
      <ul className="grid gap-2 text-sm text-muted-foreground">
        <li>· Card, Apple Pay, Google Pay and SEPA for your students</li>
        <li>· VAT and invoices handled for you</li>
        <li>· Weekly payouts, no minimum</li>
      </ul>
      {!connected && paid && (
        <p className="text-xs text-[var(--ts-orange)]">
          Your tier is paid, so students can&apos;t join until payouts are connected. You can still publish and invite them.
        </p>
      )}
      <p className="rounded-[var(--radius)] border border-dashed border-white/15 px-3 py-2 text-xs text-muted-foreground">
        <span className={cn(mono, "mr-1.5 text-[var(--ts-yellow)]")}>Prototype</span>
        The real form is the payment provider&apos;s own (open question: Whop or Stripe Connect). Here it just simulates a success.
      </p>
    </div>
  )
}
