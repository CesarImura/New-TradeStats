import Link from "next/link"
import { ArrowRight, ArrowUpRight } from "lucide-react"
import { LauncherOnboarding } from "@/components/onboarding/launcher-section"
import { COACHES } from "@/lib/data/coaches"
import { themeToCss } from "@/lib/theme/css"
import { resolveTheme } from "@/lib/theme/resolve"
import { TEMPLATES } from "@/lib/theme/templates"

const mono = "font-[family-name:var(--ff-space-mono)] text-[0.7rem] uppercase tracking-[0.06em]"

/** Prototype launcher, in our own TradeStats look. */
export default function Launcher() {
  return (
    <div className="min-h-svh bg-[#040404] font-[family-name:var(--ff-archivo)] text-white [background-image:linear-gradient(to_right,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:96px_100%]">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-14 px-5 py-14 md:py-20">
        <header className="flex flex-col gap-6">
          <div className="flex items-center gap-2.5">
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
              <path fill="#ff5500" d="M2 3h20v6h-7v12H9V9H2z" />
            </svg>
            <span className={mono}>TradeStats · Coach platform · Prototype</span>
          </div>
          <h1 className="max-w-[14ch] text-5xl leading-[1.02] font-normal tracking-tight md:text-7xl">
            One platform, every coach&apos;s own.
          </h1>
          <p className="max-w-[60ch] text-white/60">
            Four demo communities from three coaches, on three starting templates. Same pages and components underneath; the coach&apos;s
            settings decide everything you see. Open a student platform or its admin area, then use the Prototype
            button to switch template, navigation and mode.
          </p>
          <Link href="/lab" className={`${mono} flex w-fit items-center gap-1.5 text-white/60 hover:text-white`}>
            Theme lab: every theme side by side, with a readability check <ArrowRight className="size-3.5" />
          </Link>
        </header>

        <LauncherOnboarding />

        <section className="grid gap-px border border-white/10 bg-white/10 md:grid-cols-2 xl:grid-cols-4">
          {COACHES.map((c) => {
            const theme = resolveTheme(c)
            const scope = `.pv-${c.slug}`
            return (
              <article key={c.slug} className="flex flex-col gap-5 bg-[#040404] p-5">
                <style dangerouslySetInnerHTML={{ __html: themeToCss(theme, scope) }} />
                <div className="flex items-center justify-between">
                  <span className={`${mono} text-white/50`}>Template · {TEMPLATES[c.template].name}</span>
                  <span className={`${mono} text-white/50`}>{theme.nav.layout} nav</span>
                </div>

                {/* Live mini preview rendered with the coach's real theme */}
                <div className={`pv-${c.slug} overflow-hidden rounded-[var(--radius)] bg-background p-4 text-foreground`} style={{ fontFamily: "var(--coach-font-body)" }}>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="grid size-7 place-items-center rounded-[min(var(--radius),8px)] bg-primary text-xs text-primary-foreground" style={{ fontFamily: "var(--coach-font-heading)" }}>
                      {c.mark}
                    </span>
                    <span className="text-sm" style={{ fontFamily: "var(--coach-font-heading)" }}>{c.name}</span>
                  </div>
                  <div className="flex flex-col gap-3 rounded-[var(--radius)] bg-card p-4" style={{ boxShadow: "var(--card-shadow)" }}>
                    <span className="eyebrow">Start here</span>
                    <span className="text-xl leading-tight" style={{ fontFamily: "var(--coach-font-heading)", fontWeight: "var(--coach-heading-weight)" as never }}>
                      Pick up where you left off
                    </span>
                    <div className="h-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full w-3/5 bg-primary" />
                    </div>
                    <div className="flex gap-2">
                      <span className="rounded-[var(--button-radius)] bg-primary px-3 py-1.5 text-xs text-primary-foreground">Continue</span>
                      <span className="rounded-[var(--button-radius)] bg-highlight px-3 py-1.5 text-xs text-highlight-foreground">{c.wording.courses}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-normal">{c.name}</h2>
                  <p className="text-sm text-white/55">{c.tagline}</p>
                </div>
                <div className="mt-auto flex flex-wrap gap-2">
                  <Link href={`/c/${c.slug}`} className={`${mono} inline-flex items-center gap-2 rounded-[2px] bg-[#f8ff9e] px-3.5 py-2.5 text-[#040404]`}>
                    Student side <ArrowRight className="size-3.5" />
                  </Link>
                  <Link href={`/admin/${c.slug}`} className={`${mono} inline-flex items-center gap-2 rounded-[2px] border border-white/20 px-3.5 py-2.5 hover:bg-white/5`}>
                    Admin area <ArrowUpRight className="size-3.5" />
                  </Link>
                </div>
              </article>
            )
          })}
        </section>

        <section className="grid gap-4 md:grid-cols-[1fr_2fr]">
          <span className={`${mono} text-white/50`}>Built so far</span>
          <ul className="grid gap-2 text-sm text-white/70 sm:grid-cols-2">
            <li>Theme engine: coach settings → shadcn variables</li>
            <li>3 starting templates: Terminal, Atelier, Pulse</li>
            <li>Student layouts: side, top, mobile bar</li>
            <li>Admin layout with help panel</li>
            <li>STU-01 Home, built from the coach&apos;s widgets</li>
            <li>ADM-01 Overview with getting-started list</li>
            <li>ONB-01 to ONB-16 Coach sign-up and setup wizard</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
