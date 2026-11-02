"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCoach } from "@/components/coach/coach-provider"
import { CoachLogo } from "@/components/coach/coach-logo"
import { Button } from "@/components/ui/button"
import { isJoinPath, joinTheme } from "@/lib/data/join"
import { LEGAL } from "@/lib/data/people"
import { backdropStyle, dimOf, pictureOf } from "@/lib/theme/backdrops"
import { themeToCss } from "@/lib/theme/css"
import { cn } from "@/lib/utils"

const TEXTURE: Record<string, string> = { grid: "coach-bg-grid", glow: "coach-bg-glow", dots: "coach-bg-dots" }
/** The screen a path is (Join's names), to pick its words and layout. */
const SCREEN_OF: Record<string, "login" | "signup" | "subscribe"> = { login: "login", join: "signup", checkout: "subscribe" }

/** The coach's public pages: their logo, a log-in link and the legal footer. Nothing of ours shows. */
export function PublicShell({ children }: { children: React.ReactNode }) {
  const { coach, base, theme } = useCoach()
  const path = usePathname()
  // Checkout, account and onboarding keep people on task: no menu, just the logo.
  const focused = path !== base && !path.startsWith(`${base}/legal`)
  // The Join screens (log in, sign up, subscribe) can have a look of their own: it is set on this wrapper only, so the platform never changes.
  const look = coach.join?.look && isJoinPath(path, base) ? joinTheme(theme, coach.join.look) : null
  const backdrop = look ? backdropStyle(look) : null
  const copy = coach.join?.screens?.[SCREEN_OF[path.slice(base.length + 1).split("/")[0]]]
  const split = copy?.layout === "split"
  return (
    <div className={cn("relative isolate flex min-h-svh flex-col text-foreground", look && "join-look", backdrop ? "bg-transparent" : "bg-background", look && TEXTURE[look.background])}>
      {look && <style dangerouslySetInnerHTML={{ __html: themeToCss(look, ".join-look") }} />}
      {backdrop && look && (
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0" style={backdrop} />
          {look.background === "image" && <div className="absolute inset-0 bg-background" style={{ opacity: dimOf(look) / 100 }} />}
        </div>
      )}
      <header className={cn("z-20 border-b bg-background/85 backdrop-blur", !focused && "sticky top-0")}>
        <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-4 px-4 sm:px-6">
          <Link href={base} className="min-w-0">
            <CoachLogo coach={coach} />
          </Link>
          {!focused && (
            <nav className="ml-auto flex items-center gap-1">
              <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`${base}/login`} />}>
                Log in
              </Button>
              <Button size="sm" nativeButton={false} render={<Link href={`${base}#tiers`} />}>
                Join
              </Button>
            </nav>
          )}
        </div>
      </header>
      <main className={cn("flex flex-1 flex-col", split && "lg:flex-row")}>
        {split && (
          <div aria-hidden className="hidden bg-muted bg-cover bg-center lg:block lg:w-1/2" style={copy?.sideImage ? pictureOf(copy.sideImage) : undefined} />
        )}
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </main>
      <footer className="border-t">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-6 text-xs text-muted-foreground sm:px-6">
          <span>
            © 2026 {coach.org}
          </span>
          {LEGAL.map((l) => (
            <Link key={l.id} href={`${base}/legal/${l.id}`} className="hover:text-foreground">
              {l.name}
            </Link>
          ))}
          <span className="basis-full sm:ml-auto sm:basis-auto">Education only. No investment advice.</span>
        </div>
      </footer>
    </div>
  )
}

/** A centred card for the one-task pages: account, login, waiting list, thank you. */
export function FocusCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="flex flex-1 items-start justify-center px-4 py-10 sm:py-16">
      <div className={cn("w-full max-w-md rounded-(--radius) bg-card p-6 text-card-foreground sm:p-8", className)} style={{ boxShadow: "var(--card-shadow)" }}>
        {children}
      </div>
    </div>
  )
}
