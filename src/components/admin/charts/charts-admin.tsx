"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Archive, ArrowDown, ExternalLink, ArrowUp, ChartCandlestick, Pin, PinOff, Plus, X } from "@/components/icons"
import { toast } from "sonner"
import { TradingViewChart, TradingViewMini } from "@/components/charts/tradingview"
import { useCoach } from "@/components/coach/coach-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { COACH_CHARTS, chartDefaults, INDICATORS, INTERVALS, MARKETS, fmtPrice, type ChartSettings, type Market, type CoachChart } from "@/lib/data/trades"
import { cn } from "@/lib/utils"
import { Empty, Field, NativeSelect, Page, PageHeader, SettingRow, useCommunityData } from "../kit"

export const LEVEL_COLOR = { support: "var(--profit)", resistance: "var(--loss)", target: "var(--highlight, #f8ff9e)" } as const

/** ADM-57 chart settings and ADM-58 the coach's marked-up charts. */
export function ChartsAdmin() {
  const { coach, base } = useCoach()
  const picked = (coach as { setup?: { markets?: Market[] } }).setup?.markets?.join() ?? ""
  const defaults = useMemo(() => chartDefaults(picked ? (picked.split(",") as Market[]) : undefined), [picked])
  const [s, setS] = useCommunityData<ChartSettings>(coach.slug, "charts", defaults)
  const [charts, setCharts] = useCommunityData<CoachChart[]>(coach.slug, "coach-charts", COACH_CHARTS)
  const [creating, setCreating] = useState(false)
  const [preview, setPreview] = useState(s.watchlist[0]?.tv ?? "CAPITALCOM:US100")
  const on = coach.modules.charts

  const set = (patch: Partial<ChartSettings>) => setS((x) => ({ ...x, ...patch }))
  const available = MARKETS.filter((m) => s.markets.includes(m.id)).flatMap((m) => m.symbols)
  const move = (i: number, by: number) => {
    const w = [...s.watchlist]
    const [x] = w.splice(i, 1)
    w.splice(i + by, 0, x)
    set({ watchlist: w })
  }

  return (
    <Page wide>
      <PageHeader
        title="Charts"
        text={`Full TradingView charts for your ${coach.wording.students.toLowerCase()}, with your watchlist first and the charts you marked up. Students see it as “${coach.wording.charts}”.`}
        guide="Setting up charts · 2 min"
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus /> Mark up a chart
          </Button>
        }
      />

      {!on && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--ts-interactive)]/40 bg-[var(--ts-interactive)]/8 px-4 py-3 text-sm">
          <ChartCandlestick className="size-4 text-[var(--ts-interactive)]" />
          <span className="flex-1">Charts is switched off, so students don&apos;t see it in the menu yet.</span>
          <Button size="sm" variant="outline" nativeButton={false} render={<Link href={`${base}/design`} />}>
            Switch on in Design
          </Button>
        </div>
      )}

      <Tabs defaultValue="charts" className="gap-5">
        <TabsList>
          <TabsTrigger value="charts">
            Your charts <span className="text-muted-foreground tabular-nums">{charts.filter((c) => !c.archived).length}</span>
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="charts">
          {charts.filter((c) => !c.archived).length === 0 ? (
            <Empty icon={ChartCandlestick} title="No marked-up charts yet" text="Draw your levels for the week and share them. Students open them with your lines on top." action={<Button onClick={() => setCreating(true)}>Mark up a chart</Button>} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[...charts.filter((c) => !c.archived)]
                .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned))
                .map((c) => (
                  <ChartCard
                    key={c.id}
                    chart={c}
                    actions={
                      <>
                        <Button variant="ghost" size="icon-sm" aria-label={c.pinned ? "Unpin" : "Pin"} onClick={() => setCharts((l) => l.map((x) => (x.id === c.id ? { ...x, pinned: !x.pinned } : x)))}>
                          {c.pinned ? <PinOff /> : <Pin />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Archive"
                          onClick={() => {
                            setCharts((l) => l.map((x) => (x.id === c.id ? { ...x, archived: true } : x)))
                            toast("Chart archived", { description: "Students don't see it any more." })
                          }}
                        >
                          <Archive />
                        </Button>
                      </>
                    }
                  />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div className="grid content-start gap-6">
              <section className="grid gap-2">
                <h2 className="font-medium">Markets you trade</h2>
                <div className="flex flex-wrap gap-2">
                  {MARKETS.map((m) => {
                    const checked = s.markets.includes(m.id)
                    return (
                      <label key={m.id} className={cn("flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm", checked && "border-[var(--ts-interactive)]")}>
                        <Checkbox checked={checked} onCheckedChange={(v) => set({ markets: v ? [...s.markets, m.id] : s.markets.filter((x) => x !== m.id) })} />
                        {m.label}
                      </label>
                    )
                  })}
                </div>
              </section>

              <section className="grid gap-2">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-medium">Default watchlist</h2>
                  <span className="text-xs text-muted-foreground">Students see these first, then add their own</span>
                </div>
                <div className="divide-y rounded-lg border bg-card">
                  {s.watchlist.map((w, i) => (
                    <div key={w.tv} className="flex items-center gap-2 px-3 py-1.5">
                      <button onClick={() => setPreview(w.tv)} className={cn("flex-1 text-left text-sm", preview === w.tv && "text-[var(--ts-cta)]")}>
                        {w.name} <span className="text-xs text-muted-foreground">{w.tv}</span>
                      </button>
                      <Button variant="ghost" size="icon-xs" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${w.name} up`}>
                        <ArrowUp />
                      </Button>
                      <Button variant="ghost" size="icon-xs" disabled={i === s.watchlist.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${w.name} down`}>
                        <ArrowDown />
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => set({ watchlist: s.watchlist.filter((x) => x.tv !== w.tv) })} aria-label={`Remove ${w.name}`}>
                        <X />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {available
                    .filter((a) => !s.watchlist.some((w) => w.tv === a.tv))
                    .map((a) => (
                      <button key={a.tv} onClick={() => set({ watchlist: [...s.watchlist, a] })} className="rounded-md border border-dashed px-2 py-1 text-xs text-muted-foreground hover:border-solid hover:text-foreground">
                        + {a.name}
                      </button>
                    ))}
                </div>
              </section>

              <section className="grid gap-1">
                <h2 className="font-medium">How the chart opens</h2>
                <div className="divide-y rounded-lg border bg-card px-3">
                  <SettingRow label="Timeframe">
                    <NativeSelect value={s.interval} onChange={(e) => set({ interval: e.target.value })}>
                      {INTERVALS.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.label}
                        </option>
                      ))}
                    </NativeSelect>
                  </SettingRow>
                  <SettingRow label="Chart type">
                    <NativeSelect value={s.style} onChange={(e) => set({ style: e.target.value as ChartSettings["style"] })}>
                      <option value="candles">Candles</option>
                      <option value="bars">Bars</option>
                      <option value="line">Line</option>
                    </NativeSelect>
                  </SettingRow>
                  <div className="grid gap-2 py-3.5">
                    <span className="text-sm font-medium">Indicators to start with</span>
                    <div className="flex flex-wrap gap-2">
                      {INDICATORS.map((ind) => {
                        const checked = s.indicators.includes(ind.id)
                        return (
                          <label key={ind.id} className="flex items-center gap-1.5 text-sm">
                            <Checkbox checked={checked} onCheckedChange={(v) => set({ indicators: v ? [...s.indicators, ind.id] : s.indicators.filter((x) => x !== ind.id) })} />
                            {ind.label}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid gap-1">
                <h2 className="font-medium">Who can open {coach.wording.charts}</h2>
                <div className="divide-y rounded-lg border bg-card px-3">
                  {coach.tiers.map((t) => {
                    const allowed = s.tiers.length === 0 || s.tiers.includes(t.id)
                    return (
                      <SettingRow key={t.id} label={t.name} text={allowed ? "Charts, watchlist and your charts" : "Sees an upgrade prompt"}>
                        <Switch
                          checked={allowed}
                          onCheckedChange={(v) => {
                            const cur = s.tiers.length ? s.tiers : coach.tiers.map((x) => x.id)
                            const next = v ? [...cur, t.id] : cur.filter((x) => x !== t.id)
                            set({ tiers: next.length === coach.tiers.length ? [] : next })
                          }}
                        />
                      </SettingRow>
                    )
                  })}
                </div>
              </section>
            </div>

            <div className="grid content-start gap-2 xl:sticky xl:top-20">
              <span className="text-xs text-muted-foreground">Preview · what students see when they open {coach.wording.charts}</span>
              <div className="h-[520px] overflow-hidden rounded-lg border">
                <TradingViewChart
                  symbol={preview}
                  interval={s.interval}
                  style={s.style}
                  studies={s.indicators}
                  watchlist={s.watchlist.map((w) => w.tv)}
                  dark
                  background="#0a0a0a"
                  className="size-full"
                />
              </div>
              <p className="text-xs text-muted-foreground">Students see it in your platform&apos;s light or dark look. Their drawings and layouts are saved per student.</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <NewChart open={creating} onOpenChange={setCreating} onSave={(c) => setCharts((l) => [c, ...l])} symbols={available.length ? available : MARKETS[0].symbols} />
    </Page>
  )
}

/** A shared chart: TradingView's chart of the symbol, the coach's levels and note, and their TradingView layout link. */
export function ChartCard({ chart: c, actions, onOpen, tierNames, dark = true }: { chart: CoachChart; actions?: React.ReactNode; onOpen?: () => void; tierNames?: string; dark?: boolean }) {
  const { coach } = useCoach()
  const who = c.tiers.length ? c.tiers.map((id) => coach.tiers.find((t) => t.id === id)?.name ?? id).join(", ") : "Everyone"
  return (
    <article className="grid content-start gap-3 overflow-hidden rounded-lg border bg-card">
      <div className="relative h-44 bg-background">
        <TradingViewMini symbol={c.symbol.tv} dark={dark} className="size-full" />
        {onOpen && <button onClick={onOpen} className="absolute inset-0" aria-label={`Open ${c.title}`} />}
      </div>
      <div className="grid gap-1.5 px-4 pb-4">
        <div className="flex items-start gap-2">
          <div className="grid min-w-0 flex-1 gap-0.5">
            <span className="flex items-center gap-2">
              {c.pinned && <Pin className="size-3.5 shrink-0 text-[var(--ts-interactive,var(--primary))]" />}
              <span className="truncate font-medium">{c.title}</span>
            </span>
            <span className="text-xs text-muted-foreground">
              {c.symbol.name} · {c.when}
              {(tierNames ?? who) ? ` · ${tierNames ?? who}` : ""}
            </span>
          </div>
          {actions && <div className="flex shrink-0">{actions}</div>}
        </div>
        <p className="text-sm text-muted-foreground">{c.note}</p>
        {c.link && (
          <a href={c.link} target="_blank" rel="noreferrer" className="flex w-fit items-center gap-1.5 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
            <ExternalLink className="size-3.5" /> {coach.coachName}&apos;s layout on TradingView
          </a>
        )}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {c.levels.map((l) => (
            <Badge key={l.label} variant="outline" className="gap-1.5 font-normal">
              <span className="size-1.5 rounded-full" style={{ background: LEVEL_COLOR[l.kind] }} />
              {l.label} {fmtPrice(l.at)}
            </Badge>
          ))}
        </div>
      </div>
    </article>
  )
}

function NewChart({ open, onOpenChange, onSave, symbols }: { open: boolean; onOpenChange: (o: boolean) => void; onSave: (c: CoachChart) => void; symbols: { tv: string; name: string }[] }) {
  const { coach } = useCoach()
  const [title, setTitle] = useState("")
  const [symbol, setSymbol] = useState(symbols[0])
  const [note, setNote] = useState("")
  const [levels, setLevels] = useState<CoachChart["levels"]>([{ label: "Resistance", at: 0, kind: "resistance" }, { label: "Support", at: 0, kind: "support" }])
  const [tiers, setTiers] = useState<string[]>([])
  const [notify, setNotify] = useState(true)
  const sym = symbol ?? symbols[0]
  const [link, setLink] = useState("")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Mark up a chart</DialogTitle>
          <DialogDescription>Your levels on top of the chart. Students open it and can copy it into their own layout.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
            <Field label="Title">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Levels for this week" />
            </Field>
            <Field label="Symbol">
              <NativeSelect value={sym.tv} onChange={(e) => setSymbol(symbols.find((x) => x.tv === e.target.value)!)}>
                {symbols.map((x) => (
                  <option key={x.tv} value={x.tv}>
                    {x.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <div className="grid gap-1.5">
            <span className="text-[0.8rem] font-medium">Levels</span>
            {levels.map((l, i) => (
              <div key={i} className="grid grid-cols-[1fr_110px_120px_auto] gap-2">
                <Input className="h-8" value={l.label} onChange={(e) => setLevels((x) => x.map((y, j) => (j === i ? { ...y, label: e.target.value } : y)))} aria-label="Level name" />
                <Input
                  className="h-8 tabular-nums"
                  inputMode="decimal"
                  placeholder="Price"
                  value={l.at || ""}
                  onChange={(e) => setLevels((x) => x.map((y, j) => (j === i ? { ...y, at: Number(e.target.value.replace(",", "")) || 0 } : y)))}
                  aria-label="Price"
                />
                <NativeSelect className="h-8" value={l.kind} onChange={(e) => setLevels((x) => x.map((y, j) => (j === i ? { ...y, kind: e.target.value as typeof l.kind } : y)))}>
                  <option value="resistance">Resistance</option>
                  <option value="support">Support</option>
                  <option value="target">Target</option>
                </NativeSelect>
                <Button variant="ghost" size="icon-sm" aria-label="Remove level" onClick={() => setLevels((x) => x.filter((_, j) => j !== i))}>
                  <X />
                </Button>
              </div>
            ))}
            <button onClick={() => setLevels((x) => [...x, { label: "Level", at: 0, kind: "target" }])} className="justify-self-start text-xs text-muted-foreground hover:text-foreground">
              + Add a level
            </button>
          </div>
          <Field label="Your TradingView link" hint="Optional · a layout, idea or snapshot">
            <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://www.tradingview.com/chart/…" />
          </Field>
          <Field label="Note">
            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Above this level I'm only looking for longs…" />
          </Field>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-[0.8rem] font-medium">Who sees it</span>
            {coach.tiers.map((t) => (
              <label key={t.id} className="flex items-center gap-1.5">
                <Checkbox checked={tiers.length === 0 || tiers.includes(t.id)} onCheckedChange={(v) => setTiers((x) => (v ? [...(x.length ? x : []), t.id] : (x.length ? x : coach.tiers.map((y) => y.id)).filter((y) => y !== t.id)))} />
                {t.name}
              </label>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={notify} onCheckedChange={(v) => setNotify(!!v)} /> Post a notice in the community
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!title.trim()}
            onClick={() => {
              onSave({
                id: `c${Date.now()}`,
                title: title.trim(),
                symbol: sym,
                note: note.trim(),
                when: "just now",
                tiers: tiers.length === coach.tiers.length ? [] : tiers,
                levels: levels.filter((l) => l.at > 0),
                link: link.trim() || undefined,
              })
              toast("Chart shared", { description: notify ? "A notice is posted in the community." : undefined })
              onOpenChange(false)
              setTitle("")
              setNote("")
              setLink("")
            }}
          >
            Share chart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
