"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCoach } from "@/components/coach/coach-provider"
import { CoachLogo } from "@/components/coach/coach-logo"
import { Button } from "@/components/ui/button"
import { LEGAL } from "@/lib/data/people"
import { cn } from "@/lib/utils"

/** The coach's public pages: their logo, a log-in link and the legal footer. Nothing of ours shows. */
export function PublicShell({ children }: { children: React.ReactNode }) {
  const { coach, base } = useCoach()
  const path = usePathname()
  // Checkout, account and onboarding keep people on task: no menu, just the logo.
  const focused = path !== base && !path.startsWith(`${base}/legal`)
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
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
      <main className="flex flex-1 flex-col">{children}</main>
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
