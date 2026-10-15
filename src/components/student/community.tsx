"use client"

import { Heart, MessageCircle, Pin } from "@/components/icons"
import { toast } from "sonner"
import type { Announcement } from "@/components/admin/community/community-admin"
import { useCommunityData } from "@/components/admin/kit"
import { useCoach } from "@/components/coach/coach-provider"
import { useStudentTier } from "@/components/courses/shared"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ANNOUNCEMENTS } from "@/lib/data/people"
import { useStored } from "@/lib/prototype-store"
import { cn } from "@/lib/utils"
import { OwnTitle } from "@/components/student/own-title"

const NO_LIKES: string[] = []

/** STU-30 the community feed: the coach's posts and announcements. Discord has its own page (StudentDiscord). */
export function StudentCommunity() {
  const { coach } = useCoach()
  const tier = useStudentTier()
  const list = useStored<Announcement[]>(`${coach.slug}:announcements`, ANNOUNCEMENTS)
  const [liked, setLiked] = useCommunityData(coach.slug, "liked", NO_LIKES)
  const shown = list.filter((a) => !a.scheduled && (!a.tiers?.length || a.tiers.includes(tier))).sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned))

  return (
    <div className="flex flex-col page-gap">
      <OwnTitle>
        <div className="flex flex-col gap-1">
        <span className="eyebrow">{shown.length} posts · {coach.name}</span>
        <h1 className="text-3xl leading-tight md:text-4xl">{coach.wording.community}</h1>
      </div>
      </OwnTitle>

      <div className="grid max-w-3xl gap-4">
        <section className="flex flex-col gap-3">
          <h2 className="text-xl">From {coach.coachName}</h2>
          {shown.length === 0 && <p className="rounded-(--radius) border border-dashed p-6 text-center text-sm text-muted-foreground">No announcements yet.</p>}
          {shown.map((a) => {
            const on = liked.includes(a.id)
            return (
              <Card key={a.id} className="gap-2 px-5">
                <div className="flex items-center gap-2">
                  {a.pinned && (
                    <span className="flex items-center gap-1 rounded-(--r-chip) bg-highlight px-2 py-0.5 text-xs text-highlight-foreground">
                      <Pin className="size-3" /> Pinned
                    </span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">{a.when}</span>
                </div>
                <h3 className="text-lg leading-snug">{a.title}</h3>
                <p className="text-sm text-muted-foreground">{a.body}</p>
                <div className="flex items-center gap-1 pt-1">
                  <Button variant="ghost" size="sm" onClick={() => setLiked((l) => (on ? l.filter((x) => x !== a.id) : [...l, a.id]))} className={cn(on && "text-primary")}>
                    <Heart className={cn(on && "fill-current")} /> {42 + (on ? 1 : 0)}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toast("Comments come with the full feed", { description: "For now you can react to posts." })}>
                    <MessageCircle /> 9
                  </Button>
                </div>
              </Card>
            )
          })}
        </section>

      </div>
    </div>
  )
}
