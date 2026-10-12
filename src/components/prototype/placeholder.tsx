"use client"

import { Construction } from "lucide-react"
import { useCoach } from "@/components/coach/coach-provider"
import { adminNav, studentNav } from "@/components/coach/nav"

/** Stands in for screens that are mapped but not built yet. */
export function Placeholder({ area, section }: { area: "student" | "admin"; section: string }) {
  const { coach, base } = useCoach()
  const items = area === "student" ? studentNav(coach, base) : adminNav(coach, base).flatMap((g) => g.items)
  const item = items.find((i) => i.id === section)
  const title = item?.label ?? (section === "profile" ? "Profile & settings" : section)
  const screens = item?.screens ?? (section === "profile" ? "STU-20, STU-21" : "")

  return (
    <div className="flex flex-col page-gap gap-6">
      <div className="flex flex-col gap-1">
        <span className="eyebrow">{area === "student" ? coach.name : "Admin area"}</span>
        <h1 className="text-3xl capitalize">{title}</h1>
      </div>
      <div className="grid min-h-72 place-items-center rounded-(--radius) border border-dashed p-8 text-center">
        <div className="flex max-w-sm flex-col items-center gap-3">
          <Construction className="size-8 text-muted-foreground" />
          <p className="font-medium">Not built in the prototype yet</p>
          {screens && <p className="text-sm text-muted-foreground">Screens from the platform map: {screens}</p>}
        </div>
      </div>
    </div>
  )
}
