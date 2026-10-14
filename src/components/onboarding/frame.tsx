"use client"

import { useLayoutEffect } from "react"
import Link from "next/link"
import { TS_SYSTEM_CSS } from "@/lib/theme/ts-system"
import { cn } from "@/lib/utils"

/**
 * Sign-up and setup are our own product, not the coach's, so they use our own
 * UI (src/lib/theme/ts-system.ts): the Webflow-Designer-like tool look, IBM
 * Plex, near-black page with bordered panels, yellow main action, orange focus.
 */
export const mono = "font-[family-name:var(--ff-plex-mono)] text-[0.68rem] uppercase tracking-[0.06em]"

export function TsLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)} aria-label="TradeStats">
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
        <path fill="#ff5500" d="M2 3h20v6h-7v12H9V9H2z" />
      </svg>
      <span className="text-[0.8125rem] font-semibold tracking-tight">TradeStats</span>
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
    <div className={cn("ts-ui ts-onb flex flex-col", wide ? "h-svh overflow-hidden" : "min-h-svh", " bg-background font-sans text-foreground")}>
      <style dangerouslySetInnerHTML={{ __html: TS_SYSTEM_CSS }} />
      <header className="flex h-11 shrink-0 items-center justify-between gap-4 border-b bg-[var(--sidebar)] px-4">
        <TsLogo />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">{right}</div>
      </header>
      {wide ? (
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      ) : (
        <main className="flex flex-1 items-start justify-center px-4 py-10 md:items-center md:py-14">
          <div className="w-full max-w-[420px] rounded-[6px] bg-card p-5 shadow-[0_0_0_1px_#2a2a2f,0_16px_40px_rgb(0_0_0/0.5)] md:p-6">{children}</div>
        </main>
      )}
    </div>
  )
}

/** Small mono label above a title, like the TradeStats site. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn(mono, "text-[var(--ts-interactive)]", className)}>{children}</span>
}

export function OnbTitle({ eyebrow, title, text }: { eyebrow?: string; title: React.ReactNode; text?: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h1 className="text-[1.375rem] leading-7 font-medium tracking-[-0.01em] text-balance">{title}</h1>
      {text && <p className="text-sm text-pretty text-muted-foreground">{text}</p>}
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
        "flex items-start gap-2.5 rounded-[6px] border border-[#2a2a2f] bg-[var(--ts-layer-2)] p-2.5 text-left shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] transition-colors outline-none hover:border-[#3a3a40] hover:bg-[var(--ts-layer-3)] focus-visible:border-[var(--ts-interactive)] focus-visible:shadow-[0_0_0_3px_rgb(255_85_0/0.18)]",
        checked && "border-[var(--ts-interactive)] bg-[color-mix(in_oklab,var(--ts-interactive)_10%,var(--ts-layer-2))] hover:border-[var(--ts-interactive)] hover:bg-[color-mix(in_oklab,var(--ts-interactive)_14%,var(--ts-layer-2))]",
        className,
      )}
    >
      {icon && <span className={cn("mt-0.5 text-muted-foreground", checked && "text-[var(--ts-interactive)]")}>{icon}</span>}
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="text-sm font-medium">{title}</span>
        {text && <span className="text-xs text-muted-foreground">{text}</span>}
      </span>
      <span
        aria-hidden
        className={cn(
          "mt-0.5 grid size-3.5 shrink-0 place-items-center border border-[#4a4a52] bg-[#0e0e10]",
          multi ? "rounded-[3px]" : "rounded-full",
          checked && "border-[var(--ts-interactive)] bg-[var(--ts-interactive)]",
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
    <p className="rounded-[4px] border border-dashed border-[#2a2a2f] px-2.5 py-1.5 text-xs text-muted-foreground">
      <span className={cn(mono, "mr-1.5 text-[var(--ts-cta)]")}>Prototype</span>
      {children}
    </p>
  )
}
