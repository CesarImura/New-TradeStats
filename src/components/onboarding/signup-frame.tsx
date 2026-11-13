"use client"

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { TS_SYSTEM_CSS } from "@/lib/theme/ts-system"
import { cn } from "@/lib/utils"

/**
 * Sign up · phase 1 (Figma 939:59751, screens 01 to 05): the form column on the left (742 px: the logo bar, then a
 * 600 px card centred in what is left) and the product illustration on the right. The illustration is decorative
 * and only shows from 1024 px; below that the form takes the whole width.
 */
/** Inside the sign-up layout the frame is drawn once (SignupShell); each page only brings its card. */
const InShell = createContext<{ go: (href: string, dir?: 1 | -1) => void } | null>(null)

/**
 * Moving between sign-up pages (and out to Getting started): the card leaves toward the side it isn't heading to, then the
 * next one comes in from the other (Midday). Outside the sign-up layout it is a plain navigation.
 */
export function useSignupGo() {
  const router = useRouter()
  const shell = useContext(InShell)
  return shell?.go ?? ((href: string) => router.push(href))
}

/** The motion shared by the sign-up pages and the Design steps. Reduced motion keeps short fades only. */
export const ONB_BASE_CSS = `
@keyframes onb-in{from{opacity:0;transform:translate3d(var(--dx,0px),var(--dy,0px),0)}}
@keyframes onb-fade{from{opacity:0}}
@keyframes onb-pop{0%{transform:scale(0.94)}100%{transform:scale(1)}}
@keyframes onb-hero{from{opacity:0;transform:scale(0.985)}}
.onb-page>*>*{animation:onb-in 480ms cubic-bezier(0.23,1,0.32,1) both;animation-delay:calc((min(sibling-index(), 7) - 1) * 45ms)}
.onb-ghost,.onb-ghost *{animation:none!important;transition:none!important}
.onb-page .text-a-danger{animation:onb-fade 200ms ease-out both}
.onb-hero{animation:onb-hero 700ms cubic-bezier(0.23,1,0.32,1) 120ms both}
@media (prefers-reduced-motion:reduce){
  .onb-page>*>*{animation:onb-fade 200ms ease-out both!important;animation-delay:0ms!important}
  .onb-hero{animation:onb-fade 200ms ease-out both}
}
`

/**
 * The card that is leaving, as a still copy laid over the page: it fades a few pixels away while the next card is
 * already coming in underneath, so there is never an empty column between two screens.
 */
export function ghostOut(el: HTMLElement, dir: 1 | -1) {
  const r = el.getBoundingClientRect()
  const ghost = el.cloneNode(true) as HTMLElement
  ghost.classList.add("onb-ghost")
  ghost.setAttribute("aria-hidden", "true")
  ghost.inert = true
  ghost.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"))
  Object.assign(ghost.style, { position: "fixed", left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, margin: "0", zIndex: "5", pointerEvents: "none" })
  ;(el.closest(".ts-onb") ?? document.body).appendChild(ghost)
  el.style.opacity = "0"
  ghost.animate([{ opacity: 1, transform: "translateX(0)" }, { opacity: 0, transform: `translateX(${dir * -10}px)` }], { duration: 320, easing: "cubic-bezier(0.65, 0, 0.35, 1)", fill: "forwards" }).onfinish = () => ghost.remove()
}

/** html.dark while the onboarding is open (the admin colours are dark only). */
function useDark() {
  useLayoutEffect(() => {
    const html = document.documentElement
    const had = html.classList.contains("dark")
    html.classList.add("dark")
    return () => {
      if (!had) html.classList.remove("dark")
    }
  }, [])
}

/** The left column: logo bar, then the 600 px card centred in what is left. */
function Column({ action, children }: { action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col lg:max-w-[max(742px,38.65vw)]">
      <header className="flex items-center justify-between gap-6 px-4 py-5 sm:px-8">
        <SignupLogo />
        {action}
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-8 sm:px-8">{children}</main>
    </div>
  )
}

function Hero() {
  return (
    <aside aria-hidden className="hidden min-w-0 flex-1 p-8 lg:flex">
      <div className="onb-hero relative min-h-0 flex-1 overflow-hidden rounded-a-xl bg-a-panel">
        {/* eslint-disable-next-line @next/next/no-img-element -- static decorative art (vector, sharp at any size), sized by its box */}
        <img src="/onboarding/signup-hero.svg" alt="" className="absolute inset-0 size-full object-cover object-left" />
      </div>
    </aside>
  )
}

/**
 * Sign up · phase 1 (Figma 939:59751, screens 01 to 05): the form column on the left (742 px: the logo bar, then a
 * 600 px card centred in what is left) and the product illustration on the right. The illustration is decorative
 * and only shows from 1024 px; below that the form takes the whole width. Under the sign-up layout only the card is
 * drawn here (the shell keeps the rest still between pages).
 */
export function SignupFrame({ children, action, aside }: { children: React.ReactNode; /** On the right of the logo bar (Design: Save and exit). */ action?: React.ReactNode; /** Replaces the illustration (Design: the live canvas, full height from 1280 px). */ aside?: React.ReactNode }) {
  const shell = useContext(InShell)
  useDark()
  if (shell) return <>{children}</>
  return (
    <div className="ts-ui ts-onb flex min-h-svh bg-a-page text-a-text">
      <style dangerouslySetInnerHTML={{ __html: TS_SYSTEM_CSS + ONB_BASE_CSS }} />
      <Column action={action}>
        <div className="flex w-full max-w-[600px] flex-col gap-5 py-6 sm:p-10">{children}</div>
      </Column>
      {aside ? <aside className="sticky top-0 hidden h-svh min-w-0 flex-1 pl-8 xl:flex">{aside}</aside> : <Hero />}
    </div>
  )
}

/**
 * The sign-up layout: logo bar and illustration stay put while the pages change; the card in the middle leaves and
 * enters (staggered, a few pixels from the side, no blur).
 */
export function SignupShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const page = useRef<HTMLDivElement>(null)
  const [dir, setDir] = useState<1 | -1>(1)
  const leaving = useRef(false)
  useDark()
  const go = useCallback(
    (href: string, to: 1 | -1 = 1) => {
      const el = page.current
      if (leaving.current) return
      setDir(to)
      if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return router.push(href)
      leaving.current = true
      ghostOut(el, to)
      router.push(href)
    },
    [router],
  )
  // A new page is in: the next exit can run.
  useEffect(() => {
    leaving.current = false
  }, [pathname])
  // The sign-up pages are few and light: load them up front so a screen change never waits on the network.
  useEffect(() => {
    for (const href of ["/signup", "/signup/create", "/signup/verify", "/signup/about", "/signup/name"]) router.prefetch(href)
  }, [router])
  return (
    <InShell.Provider value={{ go }}>
      <div className="ts-ui ts-onb flex min-h-svh bg-a-page text-a-text">
        <style dangerouslySetInnerHTML={{ __html: TS_SYSTEM_CSS + ONB_BASE_CSS }} />
        <Column>
          <div ref={page} key={pathname} className="onb-page flex w-full max-w-[600px] flex-col gap-5 py-6 sm:p-10" style={{ "--dx": `${dir * 12}px` } as React.CSSProperties}>
            {children}
          </div>
        </Column>
        <Hero />
      </div>
    </InShell.Provider>
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
