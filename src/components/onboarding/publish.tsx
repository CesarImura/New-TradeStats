"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Loader2, Monitor, Smartphone } from "@/components/icons"
import { PreviewFrame } from "@/components/admin/design/preview-frame"
import { Button } from "@/components/ui/button"
import { renameSlug, setAccount, slugify, updateCommunity } from "@/lib/data/communities"
import { useAccount, useCustomCommunities } from "@/lib/data/use-communities"
import { TEMPLATES } from "@/lib/theme/templates"
import { cn } from "@/lib/utils"
import { OnbFrame, mono } from "./frame"
import { DoneRow } from "./wizard"

/**
 * ONB-15 · Preview & publish. The real platform as a student sees it, on
 * desktop or phone, with what's done and what can wait.
 */
export function PublishStep() {
  const router = useRouter()
  const acc = useAccount()
  const communities = useCustomCommunities()
  const [device, setDevice] = useState<"desktop" | "phone">("desktop")
  const [busy, setBusy] = useState(false)
  const c = communities.find((x) => x.slug === acc?.setupSlug)

  if (!c) {
    return (
      <OnbFrame>
        <div className="grid gap-4">
          <h1 className="text-2xl">Nothing to publish yet</h1>
          <Link href="/setup" className="underline underline-offset-4">
            Go to setup
          </Link>
        </div>
      </OnbFrame>
    )
  }

  const address = c.address || slugify(c.name)
  const tier = c.tiers[0]
  const lessons = c.setup?.courses?.reduce((n, m) => n + m.lessons.length, 0) ?? 0
  const sections = Object.entries(c.modules).filter(([, on]) => on).length

  const publish = () => {
    setBusy(true)
    setTimeout(() => {
      updateCommunity(c.slug, { status: "live" })
      renameSlug(c.slug, address)
      setAccount({ setupSlug: address, step: undefined })
      router.push("/setup/invite")
    }, 900)
  }

  return (
    <OnbFrame
      wide
      right={
        <Link href="/setup" className="flex items-center gap-1.5 text-foreground underline underline-offset-4">
          <ArrowLeft className="size-3.5" /> Back to setup
        </Link>
      }
    >
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(340px,400px)_1fr]">
        <div className="flex flex-col gap-8 border-r px-5 py-8 md:px-8">
          <div className="grid gap-2.5">
            <span className={cn(mono, "text-[var(--ts-interactive)]")}>Last step</span>
            <h1 className="text-[1.75rem] leading-[1.1] font-normal tracking-tight">Ready when you are</h1>
            <p className="text-sm text-muted-foreground">This is your platform exactly as students will see it. Publishing makes it reachable at your address.</p>
          </div>

          <div className="grid gap-1 rounded-[var(--radius)] border bg-card px-4 py-3">
            <span className={cn(mono, "text-[0.6rem] text-muted-foreground")}>Your address</span>
            <span className="truncate text-sm">
              {address}
              <span className="text-muted-foreground">.tradestats.app</span>
            </span>
          </div>

          <ul className="grid gap-3">
            <DoneRow done>{TEMPLATES[c.template].name} template</DoneRow>
            <DoneRow done={!!c.name}>{c.name || "Name"}</DoneRow>
            <DoneRow done={!!c.logo}>{c.logo ? "Logo and colour" : "Colour set · no logo yet"}</DoneRow>
            <DoneRow done>{sections} sections switched on</DoneRow>
            <DoneRow done={!!tier}>{tier ? `${tier.name} · ${tier.price === "Free" ? "Free" : `${tier.price} / ${tier.cadence}`}` : "No tier yet"}</DoneRow>
            <DoneRow done={lessons > 0}>{lessons > 0 ? `${lessons} lessons uploaded` : "Videos · later"}</DoneRow>
            <DoneRow done={c.setup?.payouts === "connected"}>{c.setup?.payouts === "connected" ? "Payouts connected" : "Payouts · later"}</DoneRow>
          </ul>

          <div className="mt-auto grid gap-3">
            <Button size="lg" className="h-12 justify-between px-4 text-[0.95rem]" onClick={publish} disabled={busy}>
              {busy ? (
                <>
                  Publishing… <Loader2 className="animate-spin" />
                </>
              ) : (
                <>
                  Publish my platform <ArrowRight />
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">You can keep changing everything after publishing. Students see changes only when you publish them.</p>
          </div>
        </div>

        <div className="flex min-h-[70vh] flex-col bg-[#0b0b0b]">
          <div className="flex items-center justify-center border-b py-2.5">
            <div className="flex rounded-[var(--radius)] border p-0.5" role="radiogroup" aria-label="Preview size">
              {(
                [
                  ["desktop", Monitor, "Desktop"],
                  ["phone", Smartphone, "Phone"],
                ] as const
              ).map(([d, Icon, label]) => (
                <button
                  key={d}
                  role="radio"
                  aria-checked={device === d}
                  onClick={() => setDevice(d)}
                  className={cn("flex items-center gap-1.5 rounded-[2px] px-3 py-1 text-sm text-muted-foreground", device === d && "bg-white/10 text-foreground")}
                >
                  <Icon className="size-4" /> {label}
                </button>
              ))}
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <PreviewFrame src={`/c/${c.slug}?preview=draft`} device={device} />
          </div>
        </div>
      </div>
    </OnbFrame>
  )
}
