"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FlaskConical, RotateCcw } from "lucide-react"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { COACHES } from "@/lib/data/coaches"
import { updateThemeDraft } from "@/lib/prototype-store"
import { TEMPLATES, TEMPLATE_IDS } from "@/lib/theme/templates"
import { cn } from "@/lib/utils"

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
export function PrototypeBar({ area }: { area: "student" | "admin" }) {
  const { coach, theme } = useCoach()
  const path = usePathname()
  const rest = path.split("/").slice(3).join("/")
  const set = (patch: Parameters<typeof updateThemeDraft>[1]) => updateThemeDraft(coach.slug, patch)

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button className="fixed right-4 bottom-20 z-50 flex items-center gap-2 rounded-full bg-neutral-950 px-3.5 py-2 text-xs font-medium text-white shadow-lg ring-1 ring-white/15 md:bottom-4" />
        }
      >
        <FlaskConical className="size-3.5" /> Prototype
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        className="w-80 gap-4 border-neutral-200 bg-white p-4 font-[family-name:var(--ff-geist)] text-neutral-950 shadow-xl [&_[data-slot=button]]:rounded-md!"
      >
        <div className="grid gap-1.5">
          <span className="text-[0.7rem] font-medium tracking-wide text-neutral-500 uppercase">Coach</span>
          <div className="grid gap-1">
            {COACHES.map((c) => (
              <Link
                key={c.slug}
                href={`/${area === "admin" ? "admin" : "c"}/${c.slug}${rest ? `/${rest}` : ""}`}
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

        <Segment
          label="Area"
          value={area}
          options={[
            { value: "student", label: "Student side" },
            { value: "admin", label: "Admin area" },
          ]}
          onChange={(v) => {
            if (v !== area) window.location.href = `/${v === "admin" ? "admin" : "c"}/${coach.slug}`
          }}
        />

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
