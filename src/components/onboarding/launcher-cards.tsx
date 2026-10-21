"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowRight, ArrowUpRight, Pencil, RotateCcw, Trash2 } from "@/components/icons"
import { COACHES, type Coach } from "@/lib/data/coaches"
import { patchPublished, patchPublishedTheme, setStored, usePublished, useStored } from "@/lib/prototype-store"
import { themeToCss } from "@/lib/theme/css"
import { resolveCoach, resolveTheme } from "@/lib/theme/resolve"
import { TEMPLATES, TEMPLATE_IDS } from "@/lib/theme/templates"
import type { NavLayout, TemplateId } from "@/lib/theme/types"
import { cn } from "@/lib/utils"

const mono = "font-[family-name:var(--ff-geist-mono)] text-[0.7rem] uppercase tracking-[0.06em]"
const btnPrimary =
  "inline-flex h-7 items-center gap-1.5 rounded-[4px] bg-[#f8ff9e] px-2.5 text-[0.78125rem] font-medium text-[#040404] shadow-[inset_0_1px_0_rgb(255_255_255/0.45),0_0_0_1px_rgb(0_0_0/0.5)] hover:bg-[#ecf38a]"
const btnSecondary =
  "inline-flex h-7 items-center gap-1.5 rounded-[4px] border border-[#2a2a2f] bg-[#222226] px-2.5 text-[0.78125rem] font-medium shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_1px_1px_rgb(0_0_0/0.4)] hover:bg-[#2e2e33]"
const iconBtn = "grid size-7 place-items-center rounded-[4px] text-white/40 hover:bg-white/10 hover:text-white"
const input = "h-7 w-full rounded-[4px] border border-[#2a2a2f] bg-[#0a0a0b] px-2 text-[0.8125rem] text-white outline-none focus:border-white/40"

const HIDDEN: string[] = []

/** Initials for the logo tile: "Kairo FX" → "KF". */
const markOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "?"

type Edit = { name: string; tagline: string; template: TemplateId; nav: NavLayout }

/** Start page: the demo communities, each editable, savable and removable in this browser. */
export function LauncherCards() {
  const hidden = useStored<string[]>("launcher:hidden", HIDDEN)
  const shown = COACHES.filter((c) => !hidden.includes(c.slug))

  return (
    <>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {shown.map((c) => (
          <CoachCard key={c.slug} base={c} />
        ))}
      </section>
      {hidden.length > 0 && (
        <button onClick={() => setStored("launcher:hidden", HIDDEN)} className={`${mono} flex w-fit items-center gap-1.5 text-white/50 hover:text-white`}>
          <RotateCcw className="size-3.5" /> Restore {hidden.length} deleted demo{hidden.length > 1 ? "s" : ""}
        </button>
      )}
    </>
  )
}

function CoachCard({ base }: { base: Coach }) {
  const pub = usePublished(base.slug)
  const saved = resolveCoach(base, pub.content)
  const savedTheme = resolveTheme(base, pub.theme)
  const [edit, setEdit] = useState<Edit | null>(null)
  const [confirming, setConfirming] = useState(false)

  // While editing, the preview follows the form.
  const coach = edit ? { ...saved, name: edit.name || saved.name, mark: edit.name ? markOf(edit.name) : saved.mark } : saved
  const theme = edit ? resolveTheme(base, { ...pub.theme, template: edit.template, nav: { ...pub.theme.nav, layout: edit.nav } }) : savedTheme
  const scope = `.pv-${base.slug}`

  const startEdit = () => {
    setConfirming(false)
    setEdit({ name: saved.name, tagline: saved.tagline, template: savedTheme.template, nav: savedTheme.nav.layout })
  }
  const save = () => {
    if (!edit) return
    const name = edit.name.trim() || saved.name
    patchPublished(base.slug, {
      content: { name, mark: name === saved.name ? pub.content.mark : markOf(name), tagline: edit.tagline.trim() || saved.tagline },
      theme: { template: edit.template, nav: { layout: edit.nav } },
    })
    setEdit(null)
  }
  const reset = () => {
    patchPublishedTheme(base.slug, null)
    setEdit(null)
  }
  const remove = () => setStored<string[]>("launcher:hidden", (h) => [...h, base.slug], HIDDEN)

  return (
    <article className="flex flex-col gap-3 rounded-[6px] bg-[#161618] p-3 shadow-[0_0_0_1px_#2a2a2f]">
      <style dangerouslySetInnerHTML={{ __html: themeToCss(theme, scope) }} />
      <div className="flex items-center justify-between">
        <span className={`${mono} text-white/50`}>Template · {TEMPLATES[theme.template].name}</span>
        <span className={`${mono} text-white/50`}>{theme.nav.layout} nav</span>
      </div>

      {/* Live mini preview rendered with the coach's real theme */}
      <div className={`pv-${base.slug} overflow-hidden rounded-[4px] bg-background p-4 text-foreground shadow-[0_0_0_1px_#2a2a2f]`} style={{ fontFamily: "var(--coach-font-body)" }}>
        <div className="mb-4 flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-[min(var(--radius),8px)] bg-primary text-xs text-primary-foreground" style={{ fontFamily: "var(--coach-font-heading)" }}>
            {coach.mark}
          </span>
          <span className="truncate text-sm" style={{ fontFamily: "var(--coach-font-heading)" }}>{coach.name}</span>
        </div>
        <div className="flex flex-col gap-3 rounded-[var(--radius)] bg-card p-4" style={{ boxShadow: "var(--card-shadow)" }}>
          <span className="eyebrow">Start here</span>
          <span className="text-xl leading-tight" style={{ fontFamily: "var(--coach-font-heading)", fontWeight: "var(--coach-heading-weight)" as never }}>
            Pick up where you left off
          </span>
          <div className="h-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-3/5 bg-primary" />
          </div>
          <div className="flex gap-2">
            <span className="rounded-[var(--button-radius)] bg-primary px-3 py-1.5 text-xs text-primary-foreground">Continue</span>
            <span className="rounded-[var(--button-radius)] bg-highlight px-3 py-1.5 text-xs text-highlight-foreground">{coach.wording.courses}</span>
          </div>
        </div>
      </div>

      {edit ? (
        <div className="flex flex-col gap-2.5">
          <label className="grid gap-1">
            <span className={`${mono} text-white/50`}>Name</span>
            <input className={input} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} autoFocus />
          </label>
          <label className="grid gap-1">
            <span className={`${mono} text-white/50`}>Tagline</span>
            <input className={input} value={edit.tagline} onChange={(e) => setEdit({ ...edit, tagline: e.target.value })} />
          </label>
          <Choice label="Template" value={edit.template} options={TEMPLATE_IDS.map((t) => ({ value: t, label: TEMPLATES[t].name }))} onChange={(template) => setEdit({ ...edit, template })} />
          <Choice
            label="Menu"
            value={edit.nav}
            options={[
              { value: "side", label: "Sidebar" },
              { value: "top", label: "Top navbar" },
            ]}
            onChange={(nav) => setEdit({ ...edit, nav })}
          />
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <button onClick={save} className={btnPrimary}>
              Save
            </button>
            <button onClick={() => setEdit(null)} className={btnSecondary}>
              Cancel
            </button>
            <button onClick={reset} className={`${mono} ml-auto text-white/40 hover:text-white`}>
              Reset to demo
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <h2 className="text-[0.875rem] font-semibold">{saved.name}</h2>
            <p className="text-xs text-[#a8a8b1]">{saved.tagline}</p>
          </div>
          {confirming ? (
            <div className="mt-auto flex flex-wrap items-center gap-2">
              <span className="text-xs text-white/70">Delete this community?</span>
              <button onClick={remove} className={cn(btnSecondary, "border-[#5a1f1f] bg-[#3a1414] hover:bg-[#4a1a1a]")}>
                Delete
              </button>
              <button onClick={() => setConfirming(false)} className={btnSecondary}>
                Keep
              </button>
            </div>
          ) : (
            <div className="mt-auto flex flex-wrap items-center gap-2">
              <Link href={`/c/${base.slug}`} className={btnPrimary}>
                Student side <ArrowRight className="size-3.5" />
              </Link>
              <Link href={`/admin/${base.slug}`} className={btnSecondary}>
                Admin area <ArrowUpRight className="size-3.5" />
              </Link>
              <span className="ml-auto flex">
                <button onClick={startEdit} aria-label={`Edit ${saved.name}`} title="Edit" className={iconBtn}>
                  <Pencil className="size-3.5" />
                </button>
                <button onClick={() => setConfirming(true)} aria-label={`Delete ${saved.name}`} title="Delete" className={iconBtn}>
                  <Trash2 className="size-3.5" />
                </button>
              </span>
            </div>
          )}
        </>
      )}
    </article>
  )
}

function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="grid gap-1">
      <span className={`${mono} text-white/50`}>{label}</span>
      <div className="flex rounded-[4px] bg-[#0a0a0b] p-0.5 shadow-[0_0_0_1px_#2a2a2f]">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn("flex-1 rounded-[3px] px-2 py-1 text-xs text-white/55 hover:text-white", o.value === value && "bg-[#2e2e33] font-medium text-white")}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
