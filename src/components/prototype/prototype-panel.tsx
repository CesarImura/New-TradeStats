"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import { ChevronDown, RotateCcw, Search } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { COACHES } from "@/lib/data/coaches"
import { patchPublishedTheme } from "@/lib/prototype-store"
import { resetAsNewStudent } from "@/lib/data/student-start"
import { TEMPLATES, TEMPLATE_IDS } from "@/lib/theme/templates"
import { cn } from "@/lib/utils"
import { createCommunity } from "@/components/onboarding/setup-community"
import { customCommunities, deleteCommunity } from "@/lib/data/communities"
import { PROTO_AREAS, PROTO_DEFAULT_SLUG } from "./flows"

/** A community made on this browser with nothing in it: shows every screen as a platform that has just been created (Figma "New platform" variants). */
const EMPTY_SLUG = "new-platform"

/** Small segmented control in the Admin look (dark, neutral selection): the old one drew white pills on a dark panel. */
function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="grid gap-1.5">
      <span className="t-caption text-a-text-3">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex gap-0.5 rounded-a-md border border-a-border-subtle bg-a-subtle p-0.5">
        {options.map((o) => (
          <button
            key={o.value}
            role="radio"
            aria-checked={o.value === value}
            onClick={() => onChange(o.value)}
            className={cn(
              "h-7 flex-1 rounded-a-sm px-2 t-caption-medium text-a-text-2 transition-colors duration-300 ease-out outline-none hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus",
              o.value === value && "bg-a-raised text-a-text shadow-[inset_0_0_0_1px_var(--admin-color-border-default)]",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

const chip = "inline-flex h-7 items-center rounded-a-sm px-2.5 t-caption-medium outline-none transition-colors duration-300 ease-out focus-visible:ring-2 focus-visible:ring-a-border-focus"

/** The Prototype controller's panel: Go to (every screen of every flow, searchable) and Settings (community, template, navigation, mode). */
export function PrototypePanel({ area, compact, onCompact }: { area: "student" | "admin" | "site"; compact: boolean; onCompact: (v: boolean) => void }) {
  const { coach, theme } = useCoach()
  const path = usePathname()
  const search = useSearchParams().toString()
  const [tab, setTab] = useState<"go" | "settings">("go")
  const [q, setQ] = useState("")
  const router = useRouter()
  const set = (patch: Parameters<typeof patchPublishedTheme>[1]) => patchPublishedTheme(coach.slug, patch)
  const prefix = area === "admin" ? "admin" : area === "site" ? "site" : "c"
  const isEmpty = coach.slug === EMPTY_SLUG
  const open = (slug: string) => router.push(`/${prefix}/${slug}${rest ? `/${rest}` : ""}`)
  const goEmpty = (fresh?: boolean) => {
    if (fresh) deleteCommunity(EMPTY_SLUG)
    if (!customCommunities().some((c) => c.slug === EMPTY_SLUG)) createCommunity({ name: "New platform", coachName: "Kairo", language: "en", account: null })
    open(EMPTY_SLUG)
  }
  const here = search ? `${path}?${search}` : path
  const rest = path.split("/").slice(3).join("/")

  const query = q.trim().toLowerCase()
  const areas = useMemo(
    () =>
      PROTO_AREAS.map((a) => ({
        ...a,
        flows: a.flows
          .map((f) => ({ ...f, screens: f.screens.filter((s) => !query || `${a.label} ${f.label} ${s.label}`.toLowerCase().includes(query)) }))
          .filter((f) => f.screens.length > 0),
      })).filter((a) => a.flows.length > 0),
    [query],
  )
  // Open: the area the person is in, or everything while searching.
  const current = area === "admin" ? (path.includes("/design") ? "editor" : "admin") : area === "site" ? "public" : "public"

  return (
    <div className="flex max-h-[min(640px,calc(100svh-6rem))] flex-col gap-3 font-[family-name:var(--admin-font-family-primary)] text-a-text">
      <div className="flex items-center justify-between gap-2">
        <div role="tablist" aria-label="Prototype controller" className="flex gap-0.5 rounded-a-md border border-a-border-subtle bg-a-subtle p-0.5">
          {([["go", "Go to"], ["settings", "Settings"]] as const).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn("h-7 rounded-a-sm px-3 t-caption-medium text-a-text-2 outline-none transition-colors duration-300 ease-out hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus", tab === id && "bg-a-raised text-a-text shadow-[inset_0_0_0_1px_var(--admin-color-border-default)]")}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="truncate t-caption text-a-text-3">{coach.name}</span>
      </div>

      {tab === "go" ? (
        <>
          <label className="flex h-8 items-center gap-2 rounded-a-md border border-a-border bg-a-field px-2.5 focus-within:border-a-border-active">
            <Search className="size-4 shrink-0 text-a-text-3" aria-hidden />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a screen or flow" aria-label="Find a screen or flow" className="min-w-0 flex-1 bg-transparent t-body-m text-a-text outline-none placeholder:text-a-text-3" />
          </label>
          <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-1">
            {areas.length === 0 && <p className="py-6 text-center t-body-m text-a-text-3">Nothing matches “{q}”.</p>}
            {areas.map((a) => (
              <details key={a.id} open={!!query || a.id === current} className="group rounded-a-md">
                <summary className="flex h-9 cursor-pointer list-none items-center justify-between rounded-a-md px-2 outline-none hover:bg-a-hover focus-visible:ring-2 focus-visible:ring-a-border-focus [&::-webkit-details-marker]:hidden">
                  <span className="flex items-baseline gap-2">
                    <span className="t-body-l-medium">{a.label}</span>
                    <span className="t-caption text-a-text-3">{a.hint}</span>
                  </span>
                  <ChevronDown className="size-4 text-a-text-3 transition-transform duration-200 ease-out group-open:rotate-180" aria-hidden />
                </summary>
                <div className="grid gap-2.5 px-2 pt-1 pb-3">
                  {a.flows.map((f) => (
                    <div key={f.id} className="grid gap-1.5">
                      <span className="t-caption text-a-text-3">{f.label}</span>
                      <div className="flex flex-wrap gap-1">
                        {f.screens.map((s) => {
                          const href = s.href(coach.slug)
                          const active = href === here || (!href.includes("?") && href === path)
                          return (
                            <Link key={s.label + href} href={href} aria-current={active ? "page" : undefined} title={s.figma ? `Figma: ${s.figma}` : undefined} className={cn(chip, active ? "bg-a-accent text-a-on-highlight" : "bg-a-muted text-a-text-2 hover:bg-a-selected hover:text-a-text")}>
                              {s.label}
                              {s.soon && <span className="ml-1.5 t-micro text-a-text-3">Soon</span>}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                  {a.id === "public" && (
                    <Link href={`/site/${coach.slug}/start`} onClick={() => resetAsNewStudent(coach.slug)} className={cn(chip, "w-fit bg-a-muted text-a-text-2 hover:bg-a-selected hover:text-a-text")}>
                      Be a new student
                    </Link>
                  )}
                </div>
              </details>
            ))}
          </div>
        </>
      ) : (
        <div className="-mx-1 grid min-h-0 gap-4 overflow-y-auto px-1 pb-1">
          <div className="grid gap-1.5">
            <span className="t-caption text-a-text-3">Community</span>
            <div className="grid gap-0.5">
              {COACHES.map((c) => (
                <Link
                  key={c.slug}
                  href={`/${area === "admin" ? "admin" : area === "site" ? "site" : "c"}/${c.slug}${rest ? `/${rest}` : ""}`}
                  aria-current={c.slug === coach.slug ? "true" : undefined}
                  className={cn("flex h-8 items-center justify-between rounded-a-md px-2.5 t-body-m outline-none hover:bg-a-hover focus-visible:ring-2 focus-visible:ring-a-border-focus", c.slug === coach.slug && "bg-a-selected")}
                >
                  <span className={c.slug === coach.slug ? "text-a-text" : "text-a-text-2"}>{c.name}</span>
                  <span className="t-caption text-a-text-3">{TEMPLATES[c.template].name}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="grid gap-1.5">
            <span className="t-caption text-a-text-3">State</span>
            <div role="radiogroup" aria-label="State" className="flex gap-0.5 rounded-a-md border border-a-border-subtle bg-a-subtle p-0.5">
              {([["With data", false], ["New platform", true]] as const).map(([label, empty]) => (
                <button key={label} role="radio" aria-checked={isEmpty === empty} onClick={() => (empty ? goEmpty() : open(PROTO_DEFAULT_SLUG))} className={cn("h-7 flex-1 rounded-a-sm px-2 t-caption-medium text-a-text-2 transition-colors duration-300 ease-out outline-none hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus", isEmpty === empty && "bg-a-raised text-a-text shadow-[inset_0_0_0_1px_var(--admin-color-border-default)]")}>{label}</button>
              ))}
            </div>
            <span className="t-caption text-a-text-3">{isEmpty ? "Every screen as a platform just created: no students, sales or files." : "The demo community with its sample students, sales and files."}</span>
            {isEmpty && <button onClick={() => goEmpty(true)} className="w-fit t-caption text-a-text-2 underline underline-offset-2 outline-none hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus">Start the new platform over</button>}
          </div>
          <Seg label="Template" value={theme.template} options={TEMPLATE_IDS.map((id) => ({ value: id, label: TEMPLATES[id].name }))} onChange={(v) => { set(null); set({ template: v }) }} />
          <Seg label="Navigation" value={theme.nav.layout} options={[{ value: "side", label: "Side" }, { value: "top", label: "Top" }]} onChange={(v) => set({ nav: { layout: v } })} />
          <Seg label="Menu" value={theme.nav.style} options={[{ value: "labels", label: "Icons + labels" }, { value: "icons", label: "Icons only" }]} onChange={(v) => set({ nav: { style: v } })} />
          <Seg label="Mode" value={theme.mode} options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }]} onChange={(v) => set({ mode: v })} />
          <label className="flex items-center justify-between gap-3 t-body-m text-a-text">
            <span className="grid"><span>Keep the bar small</span><span className="t-caption text-a-text-3">Only the flask stays in the corner, so it covers nothing.</span></span>
            <input type="checkbox" checked={compact} onChange={(e) => onCompact(e.target.checked)} className="size-4 accent-[var(--admin-color-control-on)]" />
          </label>
          <button onClick={() => set(null)} className="inline-flex h-8 items-center justify-center gap-1.5 rounded-a-md t-body-m-medium text-a-text shadow-[inset_0_0_0_1px_var(--admin-component-button-secondary-border)] outline-none transition-colors duration-300 ease-out hover:bg-a-hover focus-visible:ring-2 focus-visible:ring-a-border-focus">
            <RotateCcw className="size-4" aria-hidden /> Reset {coach.name}
          </button>
        </div>
      )}
    </div>
  )
}
