"use client"

import { useLayoutEffect } from "react"
import Link from "next/link"
import { Check } from "@/components/icons"
import { TS_SYSTEM_CSS } from "@/lib/theme/ts-system"
import { cn } from "@/lib/utils"

/**
 * Sign-up and setup are our own product (Figma 521:7152: the same look as the Admin): near-black page, a 69px bar
 * with the logo and the step on the right, a bordered card in the middle, Admin fields and buttons.
 * The wizard still shows the Design editor's own controls inside, so it keeps the `ts-ui` scope.
 */
export const mono = "font-[family-name:var(--ff-geist-mono)] text-[0.6875rem] uppercase tracking-[0.06em]"

export function TsLogo({ className, name = "Traderhub", suffix }: { className?: string; name?: string; suffix?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)} aria-label={name}>
      <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
        <path fill="#ff5500" d="M2 3h20v6h-7v12H9V9H2z" />
      </svg>
      <span className="t-body-l-medium text-a-text">{name}</span>
      {suffix && <span className="t-caption text-a-text-3">{suffix}</span>}
    </Link>
  )
}

/** Page frame for sign-up and setup. `wide` drops the centred column (the wizard lays out its own). */
export function OnbFrame({
  children,
  right,
  wide,
  suffix,
  size = "md",
}: {
  children: React.ReactNode
  /** Top-right of the bar, e.g. step count or "Exit". */
  right?: React.ReactNode
  wide?: boolean
  /** Next to the logo, e.g. "Setup". */
  suffix?: string
  /** Card width: md 480, lg 600, xl 960. */
  size?: "md" | "lg" | "xl" | "xl"
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
    <div className={cn("ts-ui ts-onb flex flex-col bg-a-page text-a-text", wide ? "h-svh overflow-hidden" : "min-h-svh")}>
      <style dangerouslySetInnerHTML={{ __html: TS_SYSTEM_CSS }} />
      <header className="flex h-[69px] shrink-0 items-center justify-between gap-4 border-b border-a-border px-4 sm:px-8 max-sm:h-14">
        <TsLogo suffix={suffix} />
        <div className="flex items-center gap-3 t-body-m text-a-text-2">{right}</div>
      </header>
      {wide ? (
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      ) : (
        <main className="flex flex-1 items-start justify-center px-4 py-10 md:items-center md:py-14">
          <div className={cn("w-full rounded-a-xl border border-a-border bg-a-panel p-6 md:p-8", size === "xl" ? "max-w-[960px]" : size === "lg" ? "max-w-[600px]" : "max-w-[480px]")}>{children}</div>
        </main>
      )}
    </div>
  )
}

/** Small mono label above a title. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("t-mono-label-s text-a-text-accent", className)}>{children}</span>
}

export function OnbTitle({ eyebrow, title, text, tone = "accent" }: { eyebrow?: string; title: React.ReactNode; text?: React.ReactNode; tone?: "accent" | "success" }) {
  return (
    <div className="grid gap-2">
      {eyebrow && <Eyebrow className={tone === "success" ? "text-a-success" : undefined}>{eyebrow}</Eyebrow>}
      <h1 className="t-title leading-[1.15]! text-a-text text-balance">{title}</h1>
      {text && <p className="t-body-m text-a-text-2 text-pretty">{text}</p>}
    </div>
  )
}

/** A choice tile: radio or checkbox, chosen with a click (Admin / Option card, with a 16px mark on the left). */
export function Choice({
  checked,
  onClick,
  title,
  text,
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
        "flex items-center gap-3 rounded-a-10 border px-4 py-3.5 text-left outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-a-border-focus pointer-coarse:min-h-12",
        checked ? "border-a-border-active bg-a-raised" : "border-a-border hover:border-a-border-strong",
        className,
      )}
    >
      <span aria-hidden className={cn("grid size-4 shrink-0 place-items-center border-[1.5px] transition-colors duration-300", multi ? "rounded-a-xs" : "rounded-full", checked ? "border-a-accent bg-a-accent text-[var(--admin-component-button-primary-content)]" : "border-a-border-strong")}>
        {checked && (multi ? <Check className="size-3" strokeWidth={3} /> : <span className="size-1.5 rounded-full bg-[var(--admin-component-button-primary-content)]" />)}
      </span>
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="t-body-m text-a-text">{title}</span>
        {text && <span className="t-caption text-a-text-2">{text}</span>}
      </span>
    </button>
  )
}

/** Small note that marks something as prototype-only behaviour. It sits under the card, out of the way. */
export function ProtoNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="t-caption text-a-text-3">
      <span className="mr-1.5 t-mono-label-s text-a-text-2">Prototype</span>
      {children}
    </p>
  )
}
