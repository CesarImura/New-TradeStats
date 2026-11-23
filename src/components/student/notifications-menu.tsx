"use client"

import { useState } from "react"
import Link from "next/link"
import { Bell, Check } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useCoach } from "@/components/coach/coach-provider"
import { useCommunityData } from "@/components/admin/kit"
import { useNewPlatform } from "@/components/admin/use-new-platform"
import { DEFAULT_STUDENT_PREFS, STUDENT_PREFS_KEY, STUDENT_READ_KEY, studentNotices, visibleStudentNotices, type StudentNoticePrefs } from "@/lib/data/student-notifications"
import { cn } from "@/lib/utils"

/** Whatever is stored (an older shape, another type) becomes valid preferences; missing keys take the defaults. */
const normalize = (v: unknown): StudentNoticePrefs => {
  const o = (v && typeof v === "object" ? v : {}) as Partial<Record<keyof StudentNoticePrefs, unknown>>
  const pick = (k: Exclude<keyof StudentNoticePrefs, "emailSince">) => (typeof o[k] === "boolean" ? (o[k] as boolean) : DEFAULT_STUDENT_PREFS[k])
  return { feedback: pick("feedback"), lessons: pick("lessons"), events: pick("events"), community: pick("community"), email: pick("email"), emailSince: typeof o.emailSince === "string" ? o.emailSince : undefined }
}

/**
 * The student's bell (Overview decision 21/11: it was a button with a dot that never went away, while the Admin promises
 * "students get a notification"). Same rules as the Admin bell: it lists what happened, only the kinds the student switched on in
 * Profile › Notifications; the dot shows only while something is unread; a click reads it and opens it; "Mark all read"; an empty state.
 */
export function StudentNotifications() {
  const { coach, base } = useCoach()
  const fresh = useNewPlatform()
  const [open, setOpen] = useState(false)
  const [stored] = useCommunityData<unknown>(coach.slug, STUDENT_PREFS_KEY, DEFAULT_STUDENT_PREFS)
  const prefs = normalize(stored)
  const [readIds, setReadIds] = useCommunityData<string[]>(coach.slug, STUDENT_READ_KEY, ["s3", "s4"], [])
  const read = new Set(Array.isArray(readIds) ? readIds.filter((x) => typeof x === "string") : [])
  const list = fresh ? [] : visibleStudentNotices(studentNotices(coach), prefs)
  const unread = list.filter((n) => !read.has(n.id)).length
  const markRead = (ids: string[]) => setReadIds([...new Set([...read, ...ids])])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="ghost" size="icon" aria-label={unread ? `Notifications, ${unread} new` : "Notifications"} className="relative" />}>
        <Bell />
        <span aria-hidden className={cn("absolute top-1.5 right-1.5 size-2 rounded-full bg-primary transition-opacity duration-300 ease-out motion-reduce:transition-none", unread ? "opacity-100" : "opacity-0")} />
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[min(22rem,calc(100vw-1rem))] gap-0 p-0" data-slot="student-notifications-panel">
        <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
          <h2 className="text-sm font-medium">Notifications</h2>
          <Button variant="ghost" size="sm" disabled={unread === 0} onClick={() => markRead(list.map((n) => n.id))}>
            <Check /> Mark all read
          </Button>
        </div>
        {list.length === 0 ? (
          <div className="flex flex-col items-center gap-1 border-t px-4 py-8 text-center">
            <Bell className="mb-1 size-5 text-muted-foreground" />
            <p className="text-sm font-medium">You&apos;re all caught up</p>
            <p className="text-sm text-muted-foreground">{fresh ? "Feedback, new lessons and live sessions show up here." : "Nothing new. Choose what shows up in your notification settings."}</p>
          </div>
        ) : (
          <ul className="max-h-[min(24rem,60svh)] overflow-y-auto border-t">
            {list.map((n) => {
              const isNew = !read.has(n.id)
              return (
                <li key={n.id} className="border-b last:border-b-0">
                  <Link
                    href={`${base}/${n.href}`}
                    onClick={() => {
                      markRead([n.id])
                      setOpen(false)
                    }}
                    className="flex items-start gap-3 px-4 py-3 outline-none transition-colors duration-300 ease-out hover:bg-muted focus-visible:bg-muted motion-reduce:transition-none"
                  >
                    <span aria-hidden className={cn("mt-1.5 size-2 shrink-0 rounded-full bg-primary transition-opacity duration-300 motion-reduce:transition-none", isNew ? "opacity-100" : "opacity-0")} />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className={cn("text-sm", isNew ? "font-medium" : "text-muted-foreground")}>{n.title}</span>
                      <span className="truncate text-xs text-muted-foreground">{n.detail}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{n.time}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
        <div className="border-t px-2 py-1.5">
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`${base}/profile?tab=notifications`} onClick={() => setOpen(false)} />}>
            Notification settings
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
