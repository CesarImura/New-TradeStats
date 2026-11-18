"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Eye, FlaskConical, Shield } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { ModuleId } from "@/lib/data/coaches"
import { PrototypePanel } from "./prototype-panel"
import { cn } from "@/lib/utils"

// Where the same thing lives on the other side.
const TO_ADMIN: Record<string, string> = {
  courses: "content",
  calendar: "calendar",
  charts: "charts",
  community: "community",
  journal: "journal",
  ranking: "ranking",
  ai: "ai",
  downloads: "downloads",
  partners: "partners",
}
const TO_STUDENT: Record<string, ModuleId> = {
  content: "courses",
  calendar: "calendar",
  charts: "charts",
  journal: "journal",
  community: "community",
  ranking: "ranking",
  ai: "ai",
  downloads: "downloads",
  partners: "partners",
}

/**
 * Prototype-only control. Not part of the product: lets us flip between
 * coaches, templates and layouts while demoing.
 */
export function PrototypeBar({ area }: { area: "student" | "admin" | "site" }) {
  const { coach, preview } = useCoach()
  const path = usePathname()

  const section = area === "site" ? undefined : path.split("/")[3]
  const adminHref = area === "site" ? `/admin/${coach.slug}/sales?tab=page` : `/admin/${coach.slug}${section && TO_ADMIN[section] ? `/${TO_ADMIN[section]}` : ""}`
  const studentTarget = section ? TO_STUDENT[section] : undefined
  const studentHref = `/c/${coach.slug}${studentTarget && coach.modules[studentTarget] ? `/${studentTarget}` : ""}`
  if (preview) return null
  // In the Design editor the bottom right is the canvas (its cards' resize handles and quick actions), so on wide screens
  // the bar stands upright at the foot of the editor's section rail instead, the one place with nothing under it.
  const inEditor = area === "admin" && section === "design"
  const tab = cn(
    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors max-lg:min-h-10 pointer-coarse:min-h-10",
    inEditor && "lg:flex-col lg:gap-1 lg:rounded-xl lg:px-1 lg:py-2 lg:text-[0.6875rem] lg:leading-3.5",
  )

  return (
    <Popover>
      <div
        data-proto-bar
        role="complementary"
        aria-label="Prototype: switch between admin and student"
        className={cn(
          "fixed right-4 bottom-20 z-50 flex items-center gap-1 rounded-full bg-neutral-950 p-1 font-[family-name:var(--ff-geist)] text-white shadow-lg ring-1 ring-white/15 md:bottom-4",
          inEditor && "lg:right-auto lg:bottom-3 lg:left-2 lg:w-14 lg:flex-col lg:items-stretch lg:rounded-2xl",
        )}
      >
        <Link href={adminHref} aria-current={area === "admin"} className={cn(tab, area === "admin" ? "bg-white text-neutral-950" : "text-white/70 hover:text-white")}>
          <Shield className="size-3.5" /> Admin
        </Link>
        <Link href={studentHref} aria-current={area === "student"} className={cn(tab, area === "student" ? "bg-white text-neutral-950" : "text-white/70 hover:text-white")}>
          <Eye className="size-3.5" /> Student
        </Link>
        <PopoverTrigger
          render={<button className={cn("grid size-7 max-lg:size-10 pointer-coarse:size-10 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white", inEditor && "lg:w-full")} aria-label="Prototype settings" />}
        >
          <FlaskConical className="size-3.5" />
        </PopoverTrigger>
      </div>
      <PopoverContent
        side="top"
        align={inEditor ? "start" : "end"}
        className="w-[380px] max-w-[calc(100vw-2rem)] gap-0 rounded-a-lg border-0 bg-a-panel p-3 text-a-text shadow-[0_30px_60px_rgb(0_0_0/0.6),inset_0_0_0_1px_var(--admin-color-border-strong)] ring-0"
      >
        <PrototypePanel area={area} />
      </PopoverContent>
    </Popover>
  )
}
