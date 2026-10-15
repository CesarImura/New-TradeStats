"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Eye, FlaskConical, RotateCcw, Shield } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { COACHES, type ModuleId } from "@/lib/data/coaches"
import { patchPublishedTheme } from "@/lib/prototype-store"
import { resetAsNewStudent } from "@/lib/data/student-start"
import { TEMPLATES, TEMPLATE_IDS } from "@/lib/theme/templates"
import { cn } from "@/lib/utils"

// Where the same thing lives on the other side.
const TO_ADMIN: Record<string, string> = {
  courses: "content",
  calendar: "calendar",
  charts: "charts",
  community: "community",
  // Discord's settings live on the admin Community page for now.
  discord: "community",
  journal: "journal",
  ranking: "ranking",
  ai: "ai",
}
const TO_STUDENT: Record<string, ModuleId> = {
  content: "courses",
  calendar: "calendar",
  charts: "charts",
  journal: "journal",
  community: "community",
  ranking: "ranking",
  ai: "ai",
}

function Segment<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="grid gap-1.5">
      <span className="text-[0.7rem] font-medium tracking-wide text-neutral-500 uppercase">{label}</span>
      <div className="flex rounded-md bg-neutral-100 p-0.5">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex-1 rounded-[5px] px-2 py-1.5 text-xs text-neutral-600",
              o.value === value && "bg-white font-medium text-neutral-950 shadow-sm",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Prototype-only control. Not part of the product: lets us flip between
 * coaches, templates and layouts while demoing.
 */
export function PrototypeBar({ area }: { area: "student" | "admin" | "site" }) {
  const { coach, theme, preview } = useCoach()
  const path = usePathname()
  const rest = path.split("/").slice(3).join("/")
  const set = (patch: Parameters<typeof patchPublishedTheme>[1]) => patchPublishedTheme(coach.slug, patch)

  const section = area === "site" ? undefined : path.split("/")[3]
  const adminHref = area === "site" ? `/admin/${coach.slug}/sales?tab=page` : `/admin/${coach.slug}${section && TO_ADMIN[section] ? `/${TO_ADMIN[section]}` : ""}`
  const studentTarget = section ? TO_STUDENT[section] : undefined
  const studentHref = `/c/${coach.slug}${studentTarget && coach.modules[studentTarget] ? `/${studentTarget}` : ""}`
  if (preview) return null
  const tab = "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"

  return (
    <Popover>
      <div className="fixed right-4 bottom-20 z-50 flex items-center gap-1 rounded-full bg-neutral-950 p-1 font-[family-name:var(--ff-geist)] text-white shadow-lg ring-1 ring-white/15 md:bottom-4">
        <Link href={adminHref} aria-current={area === "admin"} className={cn(tab, area === "admin" ? "bg-white text-neutral-950" : "text-white/70 hover:text-white")}>
          <Shield className="size-3.5" /> Admin
        </Link>
        <Link href={studentHref} aria-current={area === "student"} className={cn(tab, area === "student" ? "bg-white text-neutral-950" : "text-white/70 hover:text-white")}>
          <Eye className="size-3.5" /> Student
        </Link>
        <PopoverTrigger
          render={<button className="grid size-7 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white" aria-label="Prototype settings" />}
        >
          <FlaskConical className="size-3.5" />
        </PopoverTrigger>
      </div>
      <PopoverContent
        side="top"
        align="end"
        className="w-80 gap-4 border-neutral-200 bg-white p-4 font-[family-name:var(--ff-geist)] text-neutral-950 shadow-xl [&_[data-slot=button]]:rounded-md!"
      >
        <div className="grid gap-1.5">
          <span className="text-[0.7rem] font-medium tracking-wide text-neutral-500 uppercase">Community</span>
          <div className="grid gap-1">
            {COACHES.map((c) => (
              <Link
                key={c.slug}
                href={`/${area === "admin" ? "admin" : area === "site" ? "site" : "c"}/${c.slug}${rest ? `/${rest}` : ""}`}
                className={cn(
                  "flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-neutral-100",
                  c.slug === coach.slug && "bg-neutral-100 font-medium",
                )}
              >
                {c.name}
                <span className="text-xs text-neutral-500">{TEMPLATES[c.template].name}</span>
              </Link>
            ))}
          </div>
        </div>


        <div className="grid gap-1.5">
          <span className="text-[0.7rem] font-medium tracking-wide text-neutral-500 uppercase">Before joining</span>
          <div className="flex flex-wrap gap-1">
            {(
              [
                ["Sales page", ""],
                ["Checkout", "/checkout"],
                ["Log in", "/login"],
                ["Free join", "/join"],
                ["Invite", "/invite"],
              ] as const
            ).map(([label, p]) => (
              <Link key={label} href={`/site/${coach.slug}${p}`} className="rounded-md bg-neutral-100 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-200">
                {label}
              </Link>
            ))}
            <Link
              href={`/site/${coach.slug}/start`}
              onClick={() => resetAsNewStudent(coach.slug)}
              className="rounded-md bg-neutral-950 px-2 py-1 text-xs text-white hover:bg-neutral-800"
            >
              Be a new student
            </Link>
          </div>
        </div>

        <Segment
          label="Template"
          value={theme.template}
          options={TEMPLATE_IDS.map((id) => ({ value: id, label: TEMPLATES[id].name }))}
          onChange={(v) => {
            set(null)
            set({ template: v })
          }}
        />
        <Segment
          label="Navigation"
          value={theme.nav.layout}
          options={[
            { value: "side", label: "Side" },
            { value: "top", label: "Top" },
          ]}
          onChange={(v) => set({ nav: { layout: v } })}
        />
        <Segment
          label="Menu"
          value={theme.nav.style}
          options={[
            { value: "labels", label: "Icons + labels" },
            { value: "icons", label: "Icons only" },
          ]}
          onChange={(v) => set({ nav: { style: v } })}
        />
        <Segment
          label="Mode"
          value={theme.mode}
          options={[
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ]}
          onChange={(v) => set({ mode: v })}
        />
        <Button
          variant="outline"
          size="sm"
          className="border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100"
          onClick={() => set(null)}
        >
          <RotateCcw /> Reset {coach.name}
        </Button>
      </PopoverContent>
    </Popover>
  )
}
