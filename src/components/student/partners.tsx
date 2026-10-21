"use client"

import { useState } from "react"
import { Copy, ExternalLink, Handshake, Link2, Lock } from "@/components/icons"
import { toast } from "sonner"
import { useCommunityData } from "@/components/admin/kit"
import { useCoach } from "@/components/coach/coach-provider"
import { OwnTitle } from "@/components/student/own-title"
import { UnlockDialog } from "@/components/student/unlock-dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Chip } from "@/components/widgets/instrument"
import { Mark } from "@/components/widgets/brand"
import { useAccess, useViewerTier } from "@/lib/data/access"
import { KIND_LABEL, PARTNER_KINDS, useAffiliate, useOffers, type PartnerOffer } from "@/lib/data/partners"
import { cn } from "@/lib/utils"

export function copyText(text: string, what: string) {
  navigator.clipboard?.writeText(text).catch(() => {})
  toast(`${what} copied`)
}

/** The Partners page's core widget: offers from partners the coach works with, labelled, and the student's own affiliate link. */
export function StudentPartners({ props = {} }: { props?: Record<string, string | boolean> } = {}) {
  const { coach } = useCoach()
  const offers = useOffers(coach).filter((o) => o.on)
  const program = useAffiliate(coach)
  const tier = useViewerTier(coach)
  const access = useAccess(coach.slug)
  const [nick] = useCommunityData(coach.slug, "nickname", "alexm")
  const [kind, setKind] = useState("all")
  const [locked, setLocked] = useState<PartnerOffer | null>(null)

  const open = (o: PartnerOffer) => o.tiers.length === 0 || (!!tier && o.tiers.includes(tier))
  const visible = offers.filter((o) => access.locked === "show" || open(o))
  const kinds = PARTNER_KINDS.filter((k) => visible.some((o) => o.kind === k))
  const shown = visible.filter((o) => kind === "all" || o.kind === kind)
  const link = `https://${coach.slug}.tradestats.app/?ref=${nick}`

  return (
    <div className="flex flex-col page-gap">
      <OwnTitle>
        <div className="flex flex-col gap-1">
          <span className="eyebrow">
            {visible.length} {visible.length === 1 ? "offer" : "offers"} · {coach.name}
          </span>
          <h1 className="text-3xl leading-tight md:text-4xl">{coach.wording.partners}</h1>
        </div>
      </OwnTitle>

      <p className="max-w-2xl text-sm text-muted-foreground">Offers from partners {coach.coachName} works with. Some are affiliate links.</p>

      {visible.length === 0 ? (
        <Card className="items-center gap-3 rounded-(--radius) px-6 py-12 text-center">
          <Handshake className="size-8 text-muted-foreground" />
          <p className="font-medium">No offers yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">When {coach.coachName} adds a broker, prop firm or tool offer, it shows here.</p>
        </Card>
      ) : (
        <>
          {kinds.length > 1 && (
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Kind">
              {[{ id: "all", label: "Everything" }, ...kinds.map((k) => ({ id: k, label: KIND_LABEL[k] }))].map((k) => (
                <button
                  key={k.id}
                  role="radio"
                  aria-checked={kind === k.id}
                  onClick={() => setKind(k.id)}
                  className={cn(
                    "r-chip border px-3 py-1.5 text-sm transition-colors",
                    kind === k.id ? "border-foreground bg-foreground text-background" : "bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {k.label}
                </button>
              ))}
            </div>
          )}
          <div className="grid gap-[var(--page-gap)] sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((o) => {
              const ok = open(o)
              const need = coach.tiers.find((t) => o.tiers.includes(t.id))
              return (
                <Card key={o.id} className="gap-4 rounded-(--radius) p-4">
                  <div className="flex items-center gap-3">
                    <Mark name={o.name} size={40} />
                    <div className="grid min-w-0 flex-1">
                      <h3 className="truncate text-base leading-snug">{o.name}</h3>
                      <span className="eyebrow">{KIND_LABEL[o.kind]}</span>
                    </div>
                    <Chip tone="neutral">{o.source === "own" ? "Affiliate link" : "Partner"}</Chip>
                  </div>
                  <p className="text-sm">{o.offer}</p>
                  {ok && o.code && (
                    <button
                      onClick={() => copyText(o.code!, "Code")}
                      className="r-chip flex w-fit items-center gap-2 border bg-background px-2.5 py-1 font-mono text-sm hover:bg-muted"
                      aria-label={`Copy code ${o.code}`}
                    >
                      {o.code} <Copy className="size-3.5 text-muted-foreground" />
                    </button>
                  )}
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{o.signups > 0 ? `Students got this ${o.signups} times` : ""}</span>
                    {ok ? (
                      <Button size="sm" nativeButton={false} render={<a href={o.url} target="_blank" rel="noreferrer" />}>
                        Open <ExternalLink />
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setLocked(o)}>
                        <Lock /> Unlock with {need?.name ?? "a higher tier"}
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {program.on && props.affiliate !== false && (
        <Card className="gap-4 rounded-(--radius) px-5">
          <div className="grid gap-1">
            <span className="eyebrow">Earn {program.commission}% when a friend joins</span>
            <h2 className="text-lg">Your affiliate link</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Share it with someone who would like to learn with {coach.coachName}. You get {program.commission}% of what they pay{program.cookieDays ? `, if they join within ${program.cookieDays} days of clicking` : ""}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <code className="r-chip min-w-0 flex-1 basis-64 truncate border bg-background px-3 py-1.5 font-mono text-sm">{link}</code>
            <Button variant="outline" onClick={() => copyText(link, "Link")}>
              <Copy /> Copy
            </Button>
            <Button
              onClick={() => {
                if (navigator.share) navigator.share({ title: coach.name, url: link }).catch(() => {})
                else copyText(link, "Link")
              }}
            >
              <Link2 /> Share
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            Your code
            <button onClick={() => copyText(nick.toUpperCase(), "Code")} className="r-chip flex items-center gap-2 border bg-background px-2.5 py-1 font-mono text-foreground hover:bg-muted">
              {nick.toUpperCase()} <Copy className="size-3.5 text-muted-foreground" />
            </button>
          </div>
        </Card>
      )}
      <UnlockDialog title={locked?.name} tiers={locked?.tiers ?? []} open={!!locked} onOpenChange={(o) => !o && setLocked(null)} />
    </div>
  )
}
