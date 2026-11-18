import { Logo } from "@/components/brand/logo"
import { LauncherCards } from "@/components/onboarding/launcher-cards"
import { LauncherOnboarding } from "@/components/onboarding/launcher-section"
import { QuickLinks } from "@/components/prototype/quick-links"

const mono = "t-caption"

/** Prototype launcher, in our own look (Traderhub logo, components/brand/logo.tsx). */
export default function Launcher() {
  return (
    <div className="ts-ui min-h-svh bg-a-page text-a-text t-body-m">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-6 px-4 py-8 md:px-6 md:py-10">
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Logo />
            <span className={`${mono} text-a-text-2`}>Coach platform · Prototype</span>
          </div>
          <h1 className="t-title-l">
            One platform, every coach&apos;s own.
          </h1>
          <p className="max-w-[72ch] text-a-text-2">
            Four demo communities from three coaches, on three starting templates. Same pages and components underneath; the coach&apos;s
            settings decide everything you see. Open a student platform or its admin area, then use the Prototype
            button to switch template, navigation and mode.
          </p>
        </header>

        <LauncherOnboarding />

        <LauncherCards />

        <QuickLinks />
      </div>
    </div>
  )
}
