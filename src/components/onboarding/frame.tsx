"use client"

import { useLayoutEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

/**
 * Sign-up and setup are our own product, not the coach's, so they wear the
 * TradeStats look: near-black, yellow buttons, orange focus, mono labels.
 * The tokens sit on :root while these pages are open so menus and dialogs
 * (rendered outside this tree) match.
 */
const TOKENS = `
:root:has(.ts-onb) {
  --background: #040404; --foreground: #f5f5f2;
  --card: #0d0d0d; --card-foreground: #f5f5f2;
  --popover: #111; --popover-foreground: #f5f5f2;
  --primary: #f8ff9e; --primary-foreground: #040404;
  --secondary: #1a1a1a; --secondary-foreground: #f5f5f2;
  --muted: #161616; --muted-foreground: rgb(245 245 242 / 0.55);
  --accent: #1c1c1c; --accent-foreground: #f5f5f2;
  --border: rgb(255 255 255 / 0.11); --input: rgb(255 255 255 / 0.16);
  --ring: #ff5500; --radius: 3px;
  --coach-font-body: var(--ff-archivo); --coach-font-heading: var(--ff-archivo); --coach-font-label: var(--ff-space-mono);
  --ts-orange: #ff5500; --ts-yellow: #f8ff9e;
  color-scheme: dark;
}
:root:has(.ts-onb) body { background: #040404; }
`

export const mono = "font-[family-name:var(--ff-space-mono)] text-[0.68rem] uppercase tracking-[0.07em]"

export function TsLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)} aria-label="TradeStats">
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
        <path fill="#ff5500" d="M2 3h20v6h-7v12H9V9H2z" />
      </svg>
      <span className="text-[0.95rem] font-medium tracking-tight">TradeStats</span>
    </Link>
  )
}

/** Page frame for sign-up and setup. `wide` drops the centred column (the wizard lays out its own). */
export function OnbFrame({
  children,
  right,
  wide,
}: {
  children: React.ReactNode
  /** Top-right of the bar, e.g. step count or "Save and exit". */
  right?: React.ReactNode
  wide?: boolean
}) {
  useLayoutEffect(() => {
    const html = document.documentElement
    const had = html.classList.contains("dark")
    html.classList.add("dark")
    return () => {
      if (!had) html.classList.remove("dark")
    }
  }, [])

  return (
    <div className={cn("ts-onb flex flex-col", wide ? "h-svh overflow-hidden" : "min-h-svh", " bg-background font-sans text-foreground [background-image:linear-gradient(to_right,rgb(255_255_255/.045)_1px,transparent_1px)] [background-size:96px_100%]")}>
      <style dangerouslySetInnerHTML={{ __html: TOKENS }} />
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b px-5">
        <TsLogo />
        <div className="flex items-center gap-3 text-sm text-muted-foreground">{right}</div>
      </header>
      {wide ? (
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      ) : (
        <main className="flex flex-1 items-start justify-center px-5 py-12 md:items-center md:py-16">
          <div className="w-full max-w-[460px]">{children}</div>
        </main>
      )}
    </div>
  )
}

/** Small mono label above a title, like the TradeStats site. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn(mono, "text-[var(--ts-orange)]", className)}>{children}</span>
}

export function OnbTitle({ eyebrow, title, text }: { eyebrow?: string; title: React.ReactNode; text?: React.ReactNode }) {
  return (
    <div className="grid gap-3">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h1 className="text-[2rem] leading-[1.05] font-normal tracking-tight text-balance md:text-[2.4rem]">{title}</h1>
      {text && <p className="text-[0.95rem] text-pretty text-muted-foreground">{text}</p>}
    </div>
  )
}

/** A choice tile: radio or checkbox, chosen with a click. */
export function Choice({
  checked,
  onClick,
  title,
  text,
  icon,
  multi,
  className,
}: {
  checked: boolean
  onClick: () => void
  title: React.ReactNode
  text?: React.ReactNode
  icon?: React.ReactNode
  multi?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={checked}
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-[var(--radius)] border bg-card p-3.5 text-left transition-colors outline-none hover:border-white/25 focus-visible:ring-2 focus-visible:ring-ring",
        checked && "border-[var(--ts-orange)] bg-[color-mix(in_oklab,var(--ts-orange)_8%,var(--card))] hover:border-[var(--ts-orange)]",
        className,
      )}
    >
      {icon && <span className={cn("mt-0.5 text-muted-foreground", checked && "text-[var(--ts-orange)]")}>{icon}</span>}
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="text-sm font-medium">{title}</span>
        {text && <span className="text-xs text-muted-foreground">{text}</span>}
      </span>
      <span
        aria-hidden
        className={cn(
          "mt-0.5 grid size-4 shrink-0 place-items-center border border-white/30",
          multi ? "rounded-[2px]" : "rounded-full",
          checked && "border-[var(--ts-orange)] bg-[var(--ts-orange)]",
        )}
      >
        {checked && <span className={cn("size-1.5 bg-[#040404]", multi ? "rounded-[1px]" : "rounded-full")} />}
      </span>
    </button>
  )
}

/** Small note that marks something as prototype-only behaviour. */
export function ProtoNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-[var(--radius)] border border-dashed border-white/15 px-3 py-2 text-xs text-muted-foreground">
      <span className={cn(mono, "mr-1.5 text-[var(--ts-yellow)]")}>Prototype</span>
      {children}
    </p>
  )
}
