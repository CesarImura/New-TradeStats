"use client"

import { useState, type RefObject } from "react"
import Link from "next/link"
import { toast } from "@/lib/toast"
import { AlertTriangle, ArrowUpToLine, Bell, CircleAlert, CreditCard, Eye, Video } from "@/components/icons"
import { AdminButton, AdminTabs, EmptyState, Tag } from "@/components/admin/ui"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { cn } from "@/lib/utils"
import { useCoach } from "@/components/coach/coach-provider"
import { DEFAULT_NOTICE_PREFS, NOTICE_PREFS_KEY, NOTICE_READ_KEY, normalizePrefs, panelOn, type NoticeKind, type NoticePrefs } from "@/lib/data/admin-notifications"
import { LINKS, money, NOW_ISO, NO_LINKS, NO_OFFERS, OFFERS, planEach, type Offer, type OfferLink } from "@/lib/data/offers"
import { useCommunityData } from "./kit"
import { useNewPlatform } from "./use-new-platform"

type Filter = "all" | "payments" | "journal" | "students"
type Notice = { id: string; kind?: NoticeKind; title: string; detail: string; time: string; icon: React.ComponentType<{ className?: string }>; tone: string; filters: Filter[]; href: string }

/** Sample items from Figma "Overview · 03 Notifications" (524:11637) and 02c (offers: a failed instalment, a link opened, an offer paid). The first four start unread. */
const NOTICES: Notice[] = [
  { id: "n1", kind: "failed", title: "Instalment failed · Sofia Laurent", detail: "Coaching Silver €600 · retrying in 2 days", time: "2 h", icon: CircleAlert, tone: "text-a-danger", filters: ["payments", "students"], href: "sales?tab=transactions" },
  { id: "n2", title: "Offer link opened · Daniel Okoye", detail: "Coaching Platinum · opened 3 min ago", time: "3 min", icon: Eye, tone: "text-a-text-2", filters: ["students"], href: "sales?tab=offers" },
  { id: "n3", kind: "sale", title: "Offer paid · Marco Bellini", detail: "Coaching Gold · instalment 1 of 4 · €1,500", time: "5 h", icon: CreditCard, tone: "text-a-success", filters: ["payments", "students"], href: "sales?tab=offers" },
  { id: "n4", kind: "upload", title: "Upload finished", detail: "Price action · Lesson 4 is ready to publish", time: "6 h", icon: ArrowUpToLine, tone: "text-a-text-2", filters: [], href: "content" },
  { id: "n5", kind: "live", title: "Livestream starts in 1 hour", detail: "London open breakdown · 09:00", time: "1 d", icon: Video, tone: "text-a-text-2", filters: [], href: "livestreams" },
  { id: "n6", title: "Payout delayed", detail: "Stripe needs a document from you", time: "2 d", icon: AlertTriangle, tone: "text-a-text-2", filters: ["payments"], href: "sales" },
]
const NO_NOTICES: Notice[] = []
const INITIALLY_READ = ["n5", "n6"]
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "payments", label: "Payments" },
  { id: "journal", label: "Journal" },
  { id: "students", label: "Students" },
]

/**
 * The bell in the topbar and the panel it opens (Figma 524:11637): a card under the topbar that floats over the page.
 * A popover, not a dialog: no scrim, no scroll lock, so nothing behind it flashes or shifts. Esc or a click outside closes it.
 * Lives in the admin shell, so it is the same on every screen and keeps what was read while you move around.
 */
export function NotificationsMenu({ base, anchorRef, paused = false }: { base: string; anchorRef: RefObject<HTMLElement | null>; /** True while something else (the search) takes the screen: the panel closes. */ paused?: boolean }) {
  const [open, setOpen] = useState(false)
  if (paused && open) setOpen(false)
  const [filter, setFilter] = useState<Filter>("all")
  // A platform made in setup has nothing yet: no sample payments or requests.
  const fresh = useNewPlatform()
  // What Settings › Notifications switched off for the bell is hidden here.
  const { coach } = useCoach()
  const [stored] = useCommunityData<NoticePrefs>(coach.slug, NOTICE_PREFS_KEY, DEFAULT_NOTICE_PREFS)
  const prefs = normalizePrefs(stored)
  // What was read is remembered, like the switches. The two oldest start read; a new platform has nothing to read.
  const [readList, setReadList] = useCommunityData<string[]>(coach.slug, NOTICE_READ_KEY, INITIALLY_READ, [])
  const read = new Set(Array.isArray(readList) ? readList : [])
  // What happens in this session with offer links: opened (when the offer asks to be told) and paid. Sample links never make a notice.
  const [offers] = useCommunityData<Offer[]>(coach.slug, "offers", OFFERS, NO_OFFERS)
  const [links] = useCommunityData<OfferLink[]>(coach.slug, "offerLinks", LINKS, NO_LINKS)
  const live: Notice[] = (Array.isArray(links) ? links : []).flatMap((l) => {
    const o = offers.find((x) => x.id === l.offerId)
    const who = l.name || l.email || "a client"
    const out: Notice[] = []
    if (o && l.paidAt === NOW_ISO) out.push({ id: `offer-paid-${l.id}`, kind: "sale", title: `Offer paid · ${who}`, detail: `${o.name} · ${l.plan === 1 ? "paid in full" : `instalment 1 of ${l.plan}`} · ${money(planEach(l.price, l.plan))}`, time: "now", icon: CreditCard, tone: "text-a-success", filters: ["payments", "students"], href: "sales?tab=offers" })
    else if (o?.notifyOpen && l.openedAt === NOW_ISO && !l.paidAt) out.push({ id: `offer-open-${l.id}`, title: `Offer link opened · ${who}`, detail: `${o.name} · opened just now`, time: "now", icon: Eye, tone: "text-a-text-2", filters: ["students"], href: "sales?tab=offers" })
    return out
  })
  const notices = fresh ? NO_NOTICES : [...live, ...NOTICES].filter((n) => !n.kind || panelOn(prefs, n.kind))
  const empty = notices.length === 0
  const unread = notices.filter((n) => !read.has(n.id)).length
  const shown = notices.filter((n) => filter === "all" || n.filters.includes(filter))
  // The tag counts what the list under the tabs holds, so it never says 4 above one row; the bell counts everything.
  const unreadShown = shown.filter((n) => !read.has(n.id)).length
  const markRead = (...ids: string[]) => setReadList((l) => [...new Set([...(Array.isArray(l) ? l : []), ...ids])])

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger render={<AdminButton hierarchy="secondary" iconOnly aria-label={unread ? `Notifications, ${unread} new` : "Notifications"} className="relative w-[38px]" />}>
        <Bell />
        <span aria-hidden className={cn("absolute top-0 left-0 size-2 rounded-full bg-a-accent-strong ring-2 ring-a-page transition-[opacity,scale] duration-200 ease-out motion-reduce:transition-none", unread > 0 ? "scale-100 opacity-100" : "scale-50 opacity-0")} />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner anchor={anchorRef} side="bottom" align="end" sideOffset={8} alignOffset={24} collisionPadding={8} className="isolate z-50">
          <PopoverPrimitive.Popup
            data-slot="notifications-panel"
            className="flex max-h-[calc(100svh-5rem)] w-[calc(100vw-1rem)] origin-(--transform-origin) flex-col overflow-hidden rounded-a-lg border border-a-border-strong bg-a-raised text-a-text shadow-[0_20px_50px_rgb(0_0_0/0.55)] outline-none transition-[opacity,transform] duration-200 ease-out data-[starting-style]:-translate-y-1 data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0 data-[ending-style]:-translate-y-0.5 data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[ending-style]:duration-150 motion-reduce:transition-none sm:w-[420px]"
          >
        <div className="flex shrink-0 items-center gap-2 px-4 py-3.5">
          <PopoverPrimitive.Title className="t-heading-s text-a-text">Notifications</PopoverPrimitive.Title>
          <PopoverPrimitive.Description className="sr-only">Payments, journal requests and live reminders</PopoverPrimitive.Description>
          {unreadShown > 0 && <Tag>{unreadShown > 99 ? "99+" : unreadShown} new</Tag>}
          <AdminButton hierarchy="ghost" size="md" className="ml-auto" disabled={unread === 0} onClick={() => markRead(...notices.map((n) => n.id))}>
            Mark all read
          </AdminButton>
        </div>
        {empty ? (
          // Nothing at all yet (a new platform, or everything cleared): one calm block instead of tabs and an empty list. Figma Overview 02b.
          <div className="border-t border-a-selected p-4">
            <EmptyState
              icon={Bell}
              title="You're all caught up"
              description="Payments, requests and live reminders show up here."
              actions={
                <AdminButton hierarchy="secondary" nativeButton={false} render={<Link href={`${base}/settings?tab=notifications`} onClick={() => setOpen(false)} />}>
                  Notification settings
                </AdminButton>
              }
            />
          </div>
        ) : (
          <>
        <div className="shrink-0 px-4 pb-2.5">
          <AdminTabs label="Notification filter" tabs={FILTERS} value={filter} onChange={setFilter} />
        </div>
        <ul key={filter} className="flex min-h-0 flex-1 flex-col overflow-y-auto border-y border-a-selected motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200">
          {shown.map((n) => {
            const isNew = !read.has(n.id)
            return (
              <li key={n.id}>
                <Link
                  href={`${base}/${n.href}`}
                  onClick={() => {
                    markRead(n.id)
                    setOpen(false)
                  }}
                  className={cn("flex items-start gap-3 px-4 py-3 outline-none transition-colors duration-300 ease-out hover:bg-a-hover focus-visible:ring-2 focus-visible:ring-a-border-focus focus-visible:ring-inset motion-reduce:transition-none", isNew && "bg-a-subtle")}
                >
                  <n.icon aria-hidden className={cn("mt-px size-4 shrink-0 transition-colors duration-300 ease-out motion-reduce:transition-none", isNew ? n.tone : "text-a-text-3")} />
                  <span className={cn("flex min-w-0 flex-1 flex-col gap-1 transition-colors duration-300 ease-out motion-reduce:transition-none", !isNew && "text-a-text-2")}>
                    <span className={cn("t-body-m transition-colors duration-300 ease-out motion-reduce:transition-none", isNew && "text-a-text")}>{n.title}</span>
                    <span className="t-caption truncate text-a-text-2">{n.detail}</span>
                  </span>
                  <span className="t-micro shrink-0 text-a-text-3">{n.time}</span>
                </Link>
              </li>
            )
          })}
          {shown.length === 0 && <li className="px-4 py-8 text-center t-body-m text-a-text-2">Nothing in {FILTERS.find((f) => f.id === filter)?.label} right now.</li>}
        </ul>
        <footer className="flex shrink-0 items-center gap-2 px-4 py-2.5">
          <AdminButton hierarchy="ghost" size="md" nativeButton={false} render={<Link href={`${base}/settings?tab=notifications`} onClick={() => setOpen(false)} />}>
            Notification settings
          </AdminButton>
          <AdminButton hierarchy="secondary" size="md" className="ml-auto" onClick={() => toast("All notifications are shown here", { description: "A full history page is not part of the prototype yet." })}>
            See all
          </AdminButton>
        </footer>
          </>
        )}
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
