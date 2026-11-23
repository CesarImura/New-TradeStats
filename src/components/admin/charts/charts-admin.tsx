"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Plus, X } from "@/components/icons"
import { toast } from "@/lib/toast"
import { useCoach } from "@/components/coach/coach-provider"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { COACH_CHARTS, chartDefaults, INDICATORS, INTERVALS, MARKETS, type ChartSettings, type CoachChart, type Market } from "@/lib/data/trades"
import { cn } from "@/lib/utils"
import { PageHeader, useCommunityData } from "../kit"
import { ChartWorkspace } from "./chart-workspace"
import { useNewPlatform } from "../use-new-platform"
import { AdminSelect, AdminButton, AdminField, AdminModal, AdminSegmented, AdminTabs, Callout, Panel, Tag, adminControl } from "../ui"
import { TabPanel } from "@/components/admin/ui"

const TABS = [
  { id: "charts", label: "Chart" },
  { id: "settings", label: "Settings" },
] as const
type Tab = (typeof TABS)[number]["id"]

/** Charts (Figma 533:8375, 01 Your charts, 02 Mark up a chart, 03 Settings, 04 No charts yet): the coach's marked-up charts and what the Charts section opens with. */
const NO_CHARTS: CoachChart[] = []

export function ChartsAdmin() {
  const { coach, base } = useCoach()
  const fresh = useNewPlatform()
  const picked = (coach as { setup?: { markets?: Market[] } }).setup?.markets?.join() ?? ""
  const defaults = useMemo(() => chartDefaults(picked ? (picked.split(",") as Market[]) : undefined), [picked])
  const [s, setS] = useCommunityData<ChartSettings>(coach.slug, "charts", defaults)
  const [charts, setCharts] = useCommunityData<CoachChart[]>(coach.slug, "coach-charts", fresh ? NO_CHARTS : COACH_CHARTS)
  const [tab, setTab] = useState<Tab>("charts")
  const q = ""
  const [creating, setCreating] = useState(false)
  const live = charts.filter((c) => !c.archived)
  const shown = live.filter((c) => c.title.toLowerCase().includes(q.toLowerCase())).sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned))
  const available = MARKETS.filter((m) => s.markets.includes(m.id)).flatMap((m) => m.symbols)
  const symbols = available.length ? available : MARKETS[0].symbols
  const upload = <AdminButton onClick={() => setCreating(true)}><Plus /> Mark up a chart</AdminButton>

  return (
    <div className="flex w-full flex-col gap-4">
      <PageHeader title="Charts" text="Charts, watchlist and your charts" actions={upload} />
      {!coach.modules.charts && (
        <Callout tone="warning" action={<AdminButton nativeButton={false} render={<Link href={`${base}/design`} />} hierarchy="secondary" size="md">Review</AdminButton>}>
          Charts is switched off, so students don&apos;t see it yet.
        </Callout>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <AdminTabs label="Charts" tabs={TABS} value={tab} onChange={setTab} />
      </div>

      <TabPanel value={tab} order={TABS.map((t) => t.id)}>
      {tab === "charts" && (
        <ChartWorkspace
          charts={shown}
          onNew={() => setCreating(true)}
          onPin={(id) => setCharts((l) => l.map((x) => (x.id === id ? { ...x, pinned: !x.pinned } : x)))}
          onArchive={(id) => {
            setCharts((l) => l.map((x) => (x.id === id ? { ...x, archived: true } : x)))
            toast("Chart archived", { description: "Students don't see it any more.", action: { label: "Undo", onClick: () => setCharts((l) => l.map((x) => (x.id === id ? { ...x, archived: false } : x))) } })
          }}
        />
      )}
      {tab === "settings" && <Settings s={s} setS={setS} />}
      </TabPanel>

      <NewChart open={creating} onOpenChange={setCreating} onSave={(c) => setCharts((l) => [c, ...l])} symbols={symbols} />
    </div>
  )
}

/* ---------- 03 Settings ---------- */

function RemovableTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Tag className="gap-1 pr-1">
      {label}
      <button type="button" aria-label={`Remove ${label}`} onClick={onRemove} className="grid size-4 place-items-center rounded-a-xs text-a-text-3 outline-none hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus pointer-coarse:size-6">
        <X className="size-3" />
      </button>
    </Tag>
  )
}

function Settings({ s, setS }: { s: ChartSettings; setS: (n: ChartSettings | ((c: ChartSettings) => ChartSettings)) => void }) {
  const { coach } = useCoach()
  const set = (patch: Partial<ChartSettings>) => setS((x) => ({ ...x, ...patch }))
  const available = MARKETS.filter((m) => s.markets.includes(m.id)).flatMap((m) => m.symbols)
  const paid = coach.tiers.filter((t) => t.price !== "€0").map((t) => t.id)
  const open = s.tiers.length === 0 || s.tiers.length === coach.tiers.length ? "all" : s.tiers.length === paid.length && paid.every((id) => s.tiers.includes(id)) ? "paid" : "custom"
  const addable = available.filter((a) => !s.watchlist.some((w) => w.tv === a.tv))
  const indicators = INDICATORS.filter((i) => !s.indicators.includes(i.id))
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-2">
      <Panel className="gap-4">
        <div className="grid gap-1">
          <h2 className="t-heading-s text-a-text">Default watchlist</h2>
          <p className="t-caption text-a-text-2">Students see these first, then add their own</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {s.watchlist.map((w) => (
            <RemovableTag key={w.tv} label={w.name} onRemove={() => set({ watchlist: s.watchlist.filter((x) => x.tv !== w.tv) })} />
          ))}
          {addable.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<AdminButton hierarchy="ghost" size="md" aria-label="Add a symbol to the watchlist" />}><Plus /> Add</DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
                {addable.map((a) => <DropdownMenuItem key={a.tv} onClick={() => set({ watchlist: [...s.watchlist, a] })}>{a.name}</DropdownMenuItem>)}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="grid gap-1.5">
          <span className="t-caption text-a-text">Markets you trade</span>
          <div role="group" aria-label="Markets you trade" className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {MARKETS.map((m) => {
              const on = s.markets.includes(m.id)
              return (
                <button key={m.id} type="button" aria-pressed={on} onClick={() => set({ markets: on ? s.markets.filter((x) => x !== m.id) : [...s.markets, m.id] })}
                  className={cn("h-9 rounded-a-md border t-body-m outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-a-border-focus pointer-coarse:h-10", on ? "border-[var(--admin-color-control-on)] bg-a-raised text-a-text" : "border-a-border text-a-text-2 hover:border-a-border-strong hover:text-a-text")}>
                  {m.label}
                </button>
              )
            })}
          </div>
        </div>
      </Panel>

      <Panel className="gap-4">
        <h2 className="t-heading-s text-a-text">How the chart opens</h2>
        <div className="grid gap-1.5">
          <span className="t-caption text-a-text">Chart type</span>
          <AdminSegmented label="Chart type" value={s.style} onChange={(v) => set({ style: v })} options={[{ value: "candles", label: "Candles" }, { value: "bars", label: "Bars" }, { value: "line", label: "Line" }]} className="gap-1.5" />
        </div>
        <div className="grid gap-1.5">
          <span className="t-caption text-a-text">Timeframe</span>
          <AdminSelect ariaLabel="Timeframe" value={s.interval} onValueChange={(v) => set({ interval: v })} options={INTERVALS.map((i) => ({ value: i.id, label: i.label }))} />
        </div>
        <div className="grid gap-1.5">
          <span className="t-caption text-a-text">Indicators to start with</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {s.indicators.map((id) => (
              <RemovableTag key={id} label={INDICATORS.find((i) => i.id === id)?.label ?? id} onRemove={() => set({ indicators: s.indicators.filter((x) => x !== id) })} />
            ))}
            {indicators.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger render={<AdminButton hierarchy="ghost" size="md" aria-label="Add an indicator" />}><Plus /> Add</DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {indicators.map((i) => <DropdownMenuItem key={i.id} onClick={() => set({ indicators: [...s.indicators, i.id] })}>{i.label}</DropdownMenuItem>)}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        <div className="grid gap-1.5">
          <span className="t-caption text-a-text">Who sees it</span>
          <AdminSegmented label="Who sees it" value={open} onChange={(v) => set({ tiers: v === "all" ? [] : paid })} options={[{ value: "all", label: "Everyone" }, { value: "paid", label: "Paid tiers" }]} className="gap-1.5" />
          <p className="t-caption text-a-text-2">{open === "custom" ? `Only ${coach.tiers.filter((t) => s.tiers.includes(t.id)).map((t) => t.name).join(", ")}. Others see an upgrade prompt.` : open === "all" ? "Every tier opens it." : "Others see an upgrade prompt."}</p>
        </div>
      </Panel>
    </div>
  )
}

/* ---------- 02 Mark up a chart ---------- */

const KINDS = [
  { value: "support", label: "Support" },
  { value: "resistance", label: "Resistance" },
  { value: "target", label: "Target" },
] as const
const FIRST: CoachChart["levels"] = [{ label: "Resistance", at: 0, kind: "resistance" }, { label: "Support", at: 0, kind: "support" }]

function NewChart({ open, onOpenChange, onSave, symbols }: { open: boolean; onOpenChange: (o: boolean) => void; onSave: (c: CoachChart) => void; symbols: { tv: string; name: string }[] }) {
  const { coach } = useCoach()
  const [title, setTitle] = useState("")
  const [symbol, setSymbol] = useState(symbols[0].tv)
  const [interval, setInterval] = useState("240")
  const [note, setNote] = useState("")
  const [levels, setLevels] = useState<CoachChart["levels"]>(FIRST)
  const [pick, setPick] = useState(false)
  const [tiers, setTiers] = useState<string[]>([])
  const [link, setLink] = useState("")
  const sym = symbols.find((x) => x.tv === symbol) ?? symbols[0]
  const reset = () => {
    setTitle("")
    setNote("")
    setLink("")
    setPick(false)
    setTiers([])
    setLevels(FIRST)
  }
  const missing = !title.trim() || (pick && tiers.length === 0)
  const share = () => {
    if (missing) return
    onSave({ id: `c${Date.now()}`, title: title.trim(), symbol: sym, note: note.trim(), when: "just now", tiers: pick && tiers.length !== coach.tiers.length ? tiers : [], levels: levels.filter((l) => l.at > 0), link: link.trim() ? `https://${link.trim().replace(/^https?:\/\//, "")}` : undefined, interval: INTERVALS.find((i) => i.id === interval)?.label })
    toast("Chart shared", { description: "A notice is posted in the community." })
    onOpenChange(false)
    reset()
  }
  const setLevel = (i: number, patch: Partial<CoachChart["levels"][number]>) => setLevels((x) => x.map((y, j) => (j === i ? { ...y, ...patch } : y)))

  return (
    <AdminModal
      open={open}
      onOpenChange={onOpenChange}
      title="Mark up a chart"
      subtitle="A notice is posted in the community."
      className="sm:max-w-[640px]"
      bodyClassName="gap-5"
      footer={
        <div className="flex w-full items-center gap-2">
          <AdminButton hierarchy="ghost" onClick={() => onOpenChange(false)}>Cancel</AdminButton>
          <span aria-hidden className="h-px min-w-px flex-1" />
          <AdminButton disabled={missing} onClick={share}>Share chart</AdminButton>
        </div>
      }>
      <div className="flex flex-col gap-4">
        <AdminField label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Levels for this week" className={cn(adminControl, "h-11")} />
        </AdminField>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <span className="t-caption text-a-text">Symbol</span>
            <AdminSelect ariaLabel="Symbol" value={symbol} onValueChange={setSymbol} options={symbols.map((x) => ({ value: x.tv, label: x.name }))} />
          </div>
          <div className="grid gap-1.5">
            <span className="t-caption text-a-text">Timeframe</span>
            <AdminSelect ariaLabel="Timeframe" value={interval} onValueChange={setInterval} options={INTERVALS.map((i) => ({ value: i.id, label: i.label }))} />
          </div>
        </div>
        <fieldset className="grid gap-2">
          <legend className="mb-1 t-caption text-a-text">Levels</legend>
          {levels.map((l, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <AdminSegmented label={`Level ${i + 1} type`} value={l.kind} onChange={(v) => setLevel(i, { kind: v })} options={KINDS} className="w-[247px] gap-1.5" />
              <input aria-label={`Level ${i + 1} name`} value={l.label} onChange={(e) => setLevel(i, { label: e.target.value })} placeholder="Weekly high" className={cn(adminControl, "h-8 min-w-0 flex-1 basis-32")} />
              <input aria-label={`Level ${i + 1} price`} inputMode="decimal" placeholder="Price" value={l.at || ""} onChange={(e) => setLevel(i, { at: Number(e.target.value.replace(",", "")) || 0 })} className={cn(adminControl, "h-8 w-24 tabular-nums")} />
              <AdminButton aria-label={`Remove level ${i + 1}`} hierarchy="ghost" size="md" iconOnly onClick={() => setLevels((x) => x.filter((_, j) => j !== i))}><X /></AdminButton>
            </div>
          ))}
          <AdminButton hierarchy="ghost" size="md" className="w-fit" onClick={() => setLevels((x) => [...x, { label: "", at: 0, kind: "target" }])}><Plus /> Add level</AdminButton>
        </fieldset>
      </div>
      <hr className="m-0 h-px shrink-0 border-0 bg-a-border-subtle" />
      <div className="flex flex-col gap-4">
        <AdminField label="Note" optional>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Above this level I'm only looking for longs…" className={cn(adminControl, "h-11")} />
        </AdminField>
        <div className="grid gap-1.5">
          <span className="t-caption text-a-text">Who sees it</span>
          <AdminSegmented label="Who sees it" value={pick ? "tiers" : "all"} onChange={(v) => (setPick(v === "tiers"), v === "tiers" && !tiers.length && setTiers(coach.tiers.slice(1).map((t) => t.id)))} options={[{ value: "all", label: "Everyone" }, { value: "tiers", label: "Pick tiers" }]} />
          {pick && (
            <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
              {coach.tiers.map((t) => (
                <label key={t.id} className="flex items-center gap-2 t-body-m text-a-text">
                  <Checkbox checked={tiers.includes(t.id)} onCheckedChange={(v) => setTiers((x) => (v ? [...x, t.id] : x.filter((y) => y !== t.id)))} />
                  {t.name}
                </label>
              ))}
            </div>
          )}
        </div>
        <AdminField label="Your TradingView link" optional>
          <span className="flex h-11 overflow-hidden rounded-a-md border border-a-border-subtle bg-a-field focus-within:border-a-border-focus">
            <span className="grid place-items-center border-r border-a-border px-3 t-body-m text-a-text-2">https://</span>
            <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Optional · a layout, idea or snapshot" className="min-w-0 flex-1 bg-transparent px-3 t-body-m text-a-text outline-none placeholder:text-a-text-3" />
          </span>
        </AdminField>
      </div>
    </AdminModal>
  )
}
