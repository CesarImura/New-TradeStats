"use client"

import { useState, type RefObject } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Bell } from "@/components/icons"
import { AdminButton, AdminTabs, Tag } from "@/components/admin/ui"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { cn } from "@/lib/utils"

type Filter = "all" | "payments" | "journal" | "students"
type Notice = { id: string; title: string; detail: string; time: string; dot: string; filters: Filter[]; href: string }

/** Sample items from Figma "Overview · 03 Notifications" (524:11637). The first four start unread. */
const NOTICES: Notice[] = [
  { id: "n1", title: "Payment failed · Alex Moreau", detail: "Inner Circle €49 · retrying in 2 days", time: "2 h", dot: "bg-a-danger-fill", filters: ["payments", "students"], href: "sales" },
  { id: "n2", title: "New journal request · Mia Sørensen", detail: "“Was my stop on NQ too tight?”", time: "3 h", dot: "bg-a-accent-strong", filters: ["journal", "students"], href: "journal" },
  { id: "n3", title: "New sale · Lena Ito", detail: "1:1 VIP · €390", time: "5 h", dot: "bg-a-success-fill", filters: ["payments", "students"], href: "sales" },
  { id: "n4", title: "Upload finished", detail: "Price action · Lesson 4 is ready to publish", time: "6 h", dot: "bg-a-text-3", filters: [], href: "content" },
  { id: "n5", title: "Livestream starts in 1 hour", detail: "London open breakdown · 09:00", time: "1 d", dot: "bg-a-text-3", filters: [], href: "livestreams" },
  { id: "n6", title: "Payout delayed", detail: "Stripe needs a document from you", time: "2 d", dot: "bg-a-warning-fill", filters: ["payments"], href: "sales" },
]
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
  const [read, setRead] = useState<Set<string>>(() => new Set(["n5", "n6"]))
  const unread = NOTICES.filter((n) => !read.has(n.id)).length
  const shown = NOTICES.filter((n) => filter === "all" || n.filters.includes(filter))
  const markRead = (...ids: string[]) => setRead((r) => new Set([...r, ...ids]))

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger render={<AdminButton hierarchy="secondary" iconOnly aria-label={unread ? `Notifications, ${unread} new` : "Notifications"} className="relative" />}>
        <Bell />
        {unread > 0 && <span aria-hidden className="absolute top-1.5 right-1.5 size-2 rounded-full bg-a-accent-strong" />}
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner anchor={anchorRef} side="bottom" align="end" sideOffset={8} alignOffset={24} collisionPadding={8} className="isolate z-50">
          <PopoverPrimitive.Popup
            data-slot="notifications-panel"
            className="flex max-h-[calc(100svh-5rem)] w-[calc(100vw-1rem)] origin-(--transform-origin) flex-col overflow-hidden rounded-a-lg border border-a-border-strong bg-a-raised text-a-text shadow-[0_20px_50px_rgb(0_0_0/0.55)] outline-none transition-[opacity,transform] duration-200 ease-out data-[starting-style]:-translate-y-1 data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0 data-[ending-style]:-translate-y-0.5 data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[ending-style]:duration-150 motion-reduce:transition-none sm:w-[420px]"
          >
        <header className="flex shrink-0 items-center gap-2 px-4 py-3.5">
          <PopoverPrimitive.Title className="t-heading-s text-a-text">Notifications</PopoverPrimitive.Title>
          <PopoverPrimitive.Description className="sr-only">Payments, journal requests and live reminders</PopoverPrimitive.Description>
          {unread > 0 && <Tag tone="accent" dot>{unread} new</Tag>}
          <AdminButton hierarchy="ghost" size="md" className="ml-auto" disabled={unread === 0} onClick={() => markRead(...NOTICES.map((n) => n.id))}>
            Mark all read
          </AdminButton>
        </header>
        <div className="shrink-0 px-4 pb-2.5">
          <AdminTabs label="Notification filter" tabs={FILTERS} value={filter} onChange={setFilter} />
        </div>
        <ul className="flex min-h-0 flex-1 flex-col overflow-y-auto border-y border-a-selected">
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
                  className={cn("flex items-start gap-3 px-4 py-3 outline-none transition-colors duration-300 hover:bg-a-hover focus-visible:ring-2 focus-visible:ring-a-border-focus focus-visible:ring-inset", isNew && "bg-a-subtle")}
                >
                  <span aria-hidden className={cn("size-2 shrink-0 rounded-full", n.dot)} />
                  <span className={cn("flex min-w-0 flex-1 flex-col gap-1", !isNew && "text-a-text-2")}>
                    <span className={cn("t-body-m", isNew && "text-a-text")}>{n.title}</span>
                    <span className="t-caption truncate text-a-text-2">{n.detail}</span>
                  </span>
                  <span className="t-micro shrink-0 text-a-text-3">{n.time}</span>
                </Link>
              </li>
            )
          })}
          {shown.length === 0 && <li className="px-4 py-8 text-center t-body-m text-a-text-2">Nothing here right now.</li>}
        </ul>
        <footer className="flex shrink-0 items-center gap-2 px-4 py-2.5">
          <AdminButton hierarchy="ghost" size="md" nativeButton={false} render={<Link href={`${base}/settings`} onClick={() => setOpen(false)} />}>
            Notification settings
          </AdminButton>
          <AdminButton hierarchy="secondary" size="md" className="ml-auto" onClick={() => toast("All notifications are shown here", { description: "A full history page is not part of the prototype yet." })}>
            See all
          </AdminButton>
        </footer>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
