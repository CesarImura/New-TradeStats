import { LauncherCards } from "@/components/onboarding/launcher-cards"
import { LauncherOnboarding } from "@/components/onboarding/launcher-section"

const mono = "font-[family-name:var(--ff-geist-mono)] text-[0.7rem] uppercase tracking-[0.06em]"

/** Prototype launcher, in our own TradeStats look. */
export default function Launcher() {
  return (
    <div className="ts-ui min-h-svh bg-[#0a0a0b] font-[family-name:var(--ff-geist)] text-[0.8125rem] text-white">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-6 px-4 py-8 md:px-6 md:py-10">
        <header className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
              <path fill="#ff5500" d="M2 3h20v6h-7v12H9V9H2z" />
            </svg>
            <span className={mono}>TradeStats · Coach platform · Prototype</span>
          </div>
          <h1 className="text-2xl leading-8 font-medium tracking-[-0.01em]">
            One platform, every coach&apos;s own.
          </h1>
          <p className="max-w-[72ch] text-[#a8a8b1]">
            Four demo communities from three coaches, on three starting templates. Same pages and components underneath; the coach&apos;s
            settings decide everything you see. Open a student platform or its admin area, then use the Prototype
            button to switch template, navigation and mode.
          </p>
        </header>

        <LauncherOnboarding />

        <LauncherCards />

        <section className="grid gap-3 rounded-[6px] bg-[#161618] p-4 shadow-[0_0_0_1px_#2a2a2f] md:grid-cols-[1fr_2fr]">
          <span className={`${mono} text-white/50`}>Built so far</span>
          <ul className="grid gap-1.5 text-[0.8125rem] text-[#a8a8b1] sm:grid-cols-2">
            <li>Theme engine: coach settings → shadcn variables</li>
            <li>3 starting templates: Terminal, Atelier, Pulse</li>
            <li>Student layouts: side, top, mobile bar</li>
            <li>Admin layout with help panel</li>
            <li>STU-01 Home, built from the coach&apos;s widgets</li>
            <li>ADM-01 Overview with getting-started list</li>
            <li>ONB-01 to ONB-16 Coach sign-up and setup wizard</li>
            <li>Tiers, groups, access overview and Preview as</li>
            <li>PUB-01 to PUB-12 Sales page, checkout, login (visual only)</li>
            <li>STO-01 to STO-04 Student onboarding and tour</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
