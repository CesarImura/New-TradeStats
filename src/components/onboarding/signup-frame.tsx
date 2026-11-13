"use client"

import { useLayoutEffect } from "react"
import Link from "next/link"
import { TS_SYSTEM_CSS } from "@/lib/theme/ts-system"
import { cn } from "@/lib/utils"

/**
 * Sign up · phase 1 (Figma 939:59751, screens 01 to 05): the form column on the left (742 px: the logo bar, then a
 * 600 px card centred in what is left) and the product illustration on the right. The illustration is decorative
 * and only shows from 1024 px; below that the form takes the whole width.
 */
export function SignupFrame({ children, action, aside }: { children: React.ReactNode; /** On the right of the logo bar (Design: Save and exit). */ action?: React.ReactNode; /** Replaces the illustration (Design: the live canvas, full height from 1280 px). */ aside?: React.ReactNode }) {
  useLayoutEffect(() => {
    const html = document.documentElement
    const had = html.classList.contains("dark")
    html.classList.add("dark")
    return () => {
      if (!had) html.classList.remove("dark")
    }
  }, [])

  return (
    <div className="ts-ui ts-onb flex min-h-svh bg-a-page text-a-text">
      <style dangerouslySetInnerHTML={{ __html: TS_SYSTEM_CSS }} />
      <div className="flex min-w-0 flex-1 flex-col lg:max-w-[max(742px,38.65vw)]">
        <header className="flex items-center justify-between gap-6 px-4 py-5 sm:px-8">
          <SignupLogo />
          {action}
        </header>
        <main className="flex flex-1 flex-col items-center justify-center px-4 pb-8 sm:px-8">
          <div className="flex w-full max-w-[600px] flex-col gap-5 py-6 sm:p-10">{children}</div>
        </main>
      </div>
      {aside ? (
        <aside className="sticky top-0 hidden h-svh min-w-0 flex-1 pl-8 xl:flex">{aside}</aside>
      ) : (
      <aside aria-hidden className="hidden min-w-0 flex-1 p-8 lg:flex">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-a-xl bg-a-panel">
          {/* eslint-disable-next-line @next/next/no-img-element -- static decorative art (vector, sharp at any size), sized by its box */}
          <img src="/onboarding/signup-hero.svg" alt="" className="absolute inset-0 size-full object-cover object-left" />
        </div>
      </aside>
      )}
    </div>
  )
}

/** Admin / Logo on its own page (the shell's gradient defs are not here, so it carries its own). */
function SignupLogo() {
  return (
    <Link href="/" aria-label="Traderhub" className="flex items-center gap-2.5 rounded-a-xs outline-none focus-visible:ring-2 focus-visible:ring-a-border-focus">
      <svg width="23" height="25" viewBox="0 0 23 25" fill="none" aria-hidden className="shrink-0">
        <defs>
          <linearGradient id="onb-logo-grad" gradientUnits="userSpaceOnUse" x1="11.5" y1="0" x2="11.5" y2="24.5333">
            <stop style={{ stopColor: "var(--admin-color-brand-gradient-start)" }} />
            <stop offset="1" style={{ stopColor: "var(--admin-color-brand-gradient-end)" }} />
          </linearGradient>
        </defs>
        <path d="M15.264 0V8.02976L7.63283 0H0V8.25179H15.0558L7.5279 16.6155V24.5333H15.264V8.25179H23V0H15.264Z" fill="url(#onb-logo-grad)" />
      </svg>
      <span className="t-heading-m text-a-text">Traderhub</span>
    </Link>
  )
}

/** Title (Title L) and the line under it (Body L, secondary), 10 px apart. */
export function SignupTitle({ title, text }: { title: React.ReactNode; text?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <h1 className="t-title-l text-a-text text-balance">{title}</h1>
      {text && <p className="t-body-l text-a-text-2 text-pretty">{text}</p>}
    </div>
  )
}

/** Admin / Choice chip (Figma 945:2318): a pill that is picked or not. 36 px tall with the touch floor. */
export function ChoiceChip({ checked, onClick, children, multi }: { checked: boolean; onClick: () => void; children: React.ReactNode; multi?: boolean }) {
  return (
    <button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={checked}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center rounded-full border px-3.5 t-body-m text-a-text outline-none transition-[background-color,border-color,scale] duration-300 ease-out focus-visible:ring-2 focus-visible:ring-a-border-focus active:scale-[0.97] pointer-coarse:min-h-10",
        checked ? "border-a-border-active bg-a-accent-soft" : "border-a-border bg-a-field hover:border-a-border-focus",
      )}
    >
      {children}
    </button>
  )
}
