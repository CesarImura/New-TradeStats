"use client"

import { useCoach } from "@/components/coach/coach-provider"
import { ACCESS_FEATURES, courseTiers, isFreeTier, saveAccess, useAccess, useTiers } from "@/lib/data/access"
import { saveCatalog, useCatalog } from "@/lib/data/learning"
import { cn } from "@/lib/utils"
import { AdminFilter, AdminTable, AdminTableHead, AdminTd, AdminTh, AdminTr, Tag } from "../ui"

/** A dot per tier: filled green when the tier gets it, an empty ring when not. A checkbox for the keyboard and screen readers. */
function Dot({ on, label, onChange }: { on: boolean; label: string; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="checkbox" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className="grid size-6 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-a-border-focus pointer-coarse:size-10">
      <span aria-hidden className={cn("size-3.5 rounded-full border-[1.5px] transition-colors duration-300", on ? "border-a-success-fill bg-a-success-fill shadow-[0_0_0_3px_var(--admin-color-success-soft,transparent)]" : "border-a-border-strong hover:border-a-text-2")} />
    </button>
  )
}

/** Sales · 05 Access (Figma 535:8199): what each tier unlocks, in one grid, with the rule for locked content. */
export function AccessOverview() {
  const { coach } = useCoach()
  const catalog = useCatalog(coach)
  const allTiers = useTiers(coach)
  const tiers = allTiers.filter((t) => !isFreeTier(t))
  const access = useAccess(coach.slug)
  const all = allTiers.map((t) => t.id)
  const courses = catalog.courses.filter((c) => c.status !== "archived")

  const setCourse = (id: string, tier: string, on: boolean) =>
    saveCatalog(coach, (c) => ({
      ...c,
      courses: c.courses.map((co) => {
        if (co.id !== id) return co
        const current = courseTiers(co, all)
        const next = on ? [...new Set([...current, tier])] : current.filter((t) => t !== tier)
        return { ...co, tiers: next.length === all.length ? [] : next }
      }),
    }))
  // The free tier isn't listed, but a feature without a saved choice starts with every paid tier from `from` on.
  const featureTiers = (id: string, from: number) => access.features?.[id] ?? tiers.slice(from).map((t) => t.id)
  const setFeature = (id: string, from: number, tier: string, on: boolean) =>
    saveAccess(coach.slug, (a) => {
      const current = a.features?.[id] ?? tiers.slice(from).map((t) => t.id)
      return { ...a, features: { ...a.features, [id]: on ? [...new Set([...current, tier])] : current.filter((t) => t !== tier) } }
    })

  const rows = [
    ...courses.map((c) => ({ id: c.id, name: c.title, kind: "Course", note: c.status !== "published" ? c.status : "", has: (t: string) => courseTiers(c, all).includes(t), set: (t: string, on: boolean) => setCourse(c.id, t, on) })),
    ...ACCESS_FEATURES.map((f) => ({ id: f.id, name: f.name, kind: "Feature", note: "", has: (t: string) => featureTiers(f.id, f.from).includes(t), set: (t: string, on: boolean) => setFeature(f.id, f.from, t, on) })),
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="t-body-m text-a-text-2">What each tier unlocks. Click a dot to change it.</p>
        <AdminFilter
          label="Locked content"
          ariaLabel="Locked content"
          className="max-w-full max-sm:w-full max-sm:justify-between"
          value={access.locked}
          onValueChange={(v) => saveAccess(coach.slug, (a) => ({ ...a, locked: v as "show" | "hide" }))}
          options={[{ value: "show", label: "Show locked, with upgrade" }, { value: "hide", label: "Hide locked" }]}
        />
      </div>
      <AdminTable minWidth={460 + tiers.length * 140}>
        <AdminTableHead>
          <AdminTh>Content</AdminTh>
          <AdminTh width={140}>Kind</AdminTh>
          {tiers.map((t) => (
            <AdminTh key={t.id} width={156} align="end">{t.name}</AdminTh>
          ))}
        </AdminTableHead>
        <tbody>
          {rows.map((r) => (
            <AdminTr key={`${r.kind}-${r.id}`}>
              <AdminTd className="text-a-text">
                {r.name}
                {r.note && <span className="t-caption text-a-text-3"> · {r.note}</span>}
              </AdminTd>
              <AdminTd><Tag>{r.kind}</Tag></AdminTd>
              {tiers.map((t) => (
                <AdminTd key={t.id} align="end">
                  <span className="inline-flex">
                    <Dot on={r.has(t.id)} label={`${r.name} for ${t.name}`} onChange={(v) => r.set(t.id, v)} />
                  </span>
                </AdminTd>
              ))}
            </AdminTr>
          ))}
        </tbody>
      </AdminTable>
    </div>
  )
}
