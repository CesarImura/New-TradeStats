"use client"

import { ArrowRight, Bell, CalendarDays, ChevronLeft, ChevronRight, Copy, Download, Loader2, Minus, MoreHorizontal, Plus, Search, Settings, Share2, Star } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { useEffect, useState } from "react"
import { Chip, DotStrip, HatchBar, Label, Legend, MiniStats, Num, Seg, StepChart, TickBar, TickGauge, Timeline } from "@/components/lab/reui-widgets/instrument"
import { Avatar as KitAvatar, Bars, Heat, Ring, Spark } from "@/components/lab/reui-widgets/kit"
import { Badge as ReBadge } from "@/components/lab/reui/badge"
import { Frame, FramePanel } from "@/components/lab/reui/frame"
import { IconTile } from "@/components/lab/reui/icon-tile"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

/**
 * The library's components (prototype only): the pieces the widgets are made
 * of, each with its variants and states, shown as widgets use them. Every
 * variant renders live, so hover, focus and keyboard can be tried.
 */
export type ComponentGroup = "Actions" | "Inputs" | "Navigation" | "Feedback" | "Data display" | "Charts" | "Overlays"
export const COMPONENT_GROUPS: ComponentGroup[] = ["Actions", "Inputs", "Navigation", "Feedback", "Data display", "Charts", "Overlays"]

export type KitVariant = { label: string; render: () => React.ReactNode; width?: number; bare?: boolean }
export type KitDef = {
  id: string
  name: string
  group: ComponentGroup
  description: string
  tags: string[]
  /** Widgets that use it, by name. */
  usedIn: string[]
  /** What to try in the modal. */
  tries: string[]
  variants: KitVariant[]
}

const row = "flex flex-wrap items-center gap-2"
const stack = "grid gap-3"
const DAYS = [120, -60, 80, 210, -40, 95, 30, -110, 160, 70, -20, 140]
const CURVE = [0, 120, 60, 140, 350, 310, 405, 435, 325, 485, 555, 535, 695]

/* ---------- small stateful demos ---------- */

function LoadingButton() {
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (!busy) return
    const id = setTimeout(() => setBusy(false), 1600)
    return () => clearTimeout(id)
  }, [busy])
  return (
    <Button onClick={() => setBusy(true)} disabled={busy}>
      {busy ? <Loader2 className="animate-spin" /> : <Download />}
      {busy ? "Saving…" : "Save journal"}
    </Button>
  )
}

function NumberField() {
  const [n, setN] = useState(2)
  return (
    <div className="flex h-9 w-36 items-center rounded-md border" style={{ borderColor: "var(--border)" }}>
      <button type="button" aria-label="Less" onClick={() => setN(Math.max(0, n - 1))} className="grid size-9 place-items-center hover:bg-muted">
        <Minus className="size-4" />
      </button>
      <input aria-label="Risk per trade" value={`${n}%`} readOnly className="min-w-0 flex-1 bg-transparent text-center tabular-nums outline-none" />
      <button type="button" aria-label="More" onClick={() => setN(Math.min(10, n + 1))} className="grid size-9 place-items-center hover:bg-muted">
        <Plus className="size-4" />
      </button>
    </div>
  )
}

function SegDemo() {
  const [v, setV] = useState<"1w" | "2w" | "4w">("4w")
  return <Seg label="Period" value={v} onChange={setV} options={[["1w", "1W"], ["2w", "2W"], ["4w", "4W"]]} />
}

function DateChips() {
  const [d, setD] = useState("Wed 14")
  return (
    <div className={row} role="radiogroup" aria-label="Day">
      {["Mon 12", "Tue 13", "Wed 14", "Thu 15"].map((x) => (
        <button
          key={x}
          type="button"
          role="radio"
          aria-checked={d === x}
          onClick={() => setD(x)}
          className={cn("flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors", d === x ? "border-transparent bg-primary text-primary-foreground" : "hover:bg-muted")}
          style={d === x ? undefined : { borderColor: "var(--border)" }}
        >
          <CalendarDays className="size-3.5" />
          {x}
        </button>
      ))}
    </div>
  )
}

function Stepper({ at = 1 }: { at?: number }) {
  const [step, setStep] = useState(at)
  const steps = ["Connect broker", "Set limits", "First trade"]
  return (
    <div className="grid gap-4">
      <ol className="flex items-center gap-2">
        {steps.map((s, i) => (
          <li key={s} className="flex min-w-0 flex-1 items-center gap-2">
            <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border text-xs tabular-nums", i < step ? "border-transparent bg-primary text-primary-foreground" : i === step ? "border-primary text-primary" : "text-muted-foreground")} style={i > step ? { borderColor: "var(--border)" } : undefined}>
              {i < step ? "✓" : i + 1}
            </span>
            <span className={cn("truncate text-xs", i === step ? "font-medium" : "text-muted-foreground")}>{s}</span>
          </li>
        ))}
      </ol>
      <div className="flex justify-between">
        <Button variant="outline" size="sm" disabled={step === 0} onClick={() => setStep(step - 1)}>
          Back
        </Button>
        <Button size="sm" onClick={() => setStep(Math.min(steps.length, step + 1))}>
          {step >= steps.length - 1 ? "Finish" : "Next"}
        </Button>
      </div>
    </div>
  )
}

function Pagination() {
  const [p, setP] = useState(2)
  const pages = 5
  return (
    <nav aria-label="Pages" className="flex items-center gap-1">
      <Button variant="ghost" size="icon-sm" aria-label="Previous page" disabled={p === 1} onClick={() => setP(p - 1)}>
        <ChevronLeft />
      </Button>
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <Button key={n} variant={n === p ? "outline" : "ghost"} size="icon-sm" aria-current={n === p ? "page" : undefined} onClick={() => setP(n)} className="tabular-nums">
          {n}
        </Button>
      ))}
      <Button variant="ghost" size="icon-sm" aria-label="Next page" disabled={p === pages} onClick={() => setP(p + 1)}>
        <ChevronRight />
      </Button>
      <span className="ml-2 text-xs text-muted-foreground tabular-nums">48 trades</span>
    </nav>
  )
}

function ToastDemo({ tone }: { tone: "neutral" | "profit" | "loss" }) {
  const [shown, setShown] = useState(true)
  return shown ? (
    <div role="status" className="flex items-start gap-3 rounded-lg border bg-card p-3 shadow-sm" style={{ borderColor: "var(--border)" }}>
      <span className="mt-1 size-2 shrink-0 rounded-full" style={{ background: tone === "neutral" ? "var(--primary)" : `var(--${tone})` }} />
      <div className="grid min-w-0 flex-1 gap-0.5">
        <span className="font-medium">{tone === "loss" ? "Daily limit reached" : tone === "profit" ? "Trade saved · +€210" : "Journal synced"}</span>
        <span className="text-xs text-muted-foreground">{tone === "loss" ? "New trades are blocked until tomorrow." : "Just now"}</span>
      </div>
      <button type="button" onClick={() => setShown(false)} className="text-xs text-muted-foreground hover:text-foreground">
        Dismiss
      </button>
    </div>
  ) : (
    <Button variant="outline" size="sm" onClick={() => setShown(true)}>
      Show again
    </Button>
  )
}

const TRADES = [
  { t: "09:42", s: "NQ", side: "Long", r: 1.8, pl: 360 },
  { t: "10:15", s: "ES", side: "Short", r: -0.6, pl: -120 },
  { t: "11:03", s: "NQ", side: "Long", r: 2.4, pl: 480 },
  { t: "14:31", s: "CL", side: "Short", r: -1, pl: -200 },
]
const signed = (n: number) => `${n >= 0 ? "+" : "−"}€${Math.abs(n)}`

function TableDemo({ dense }: { dense?: boolean }) {
  const [sort, setSort] = useState<"t" | "pl">("t")
  const rows = [...TRADES].sort((a, b) => (sort === "pl" ? b.pl - a.pl : a.t.localeCompare(b.t)))
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <button type="button" onClick={() => setSort("t")} className={cn("hover:text-foreground", sort === "t" && "text-foreground")}>
              Time {sort === "t" && "↓"}
            </button>
          </TableHead>
          <TableHead>Symbol</TableHead>
          {!dense && <TableHead>Side</TableHead>}
          <TableHead className="text-right">
            <button type="button" onClick={() => setSort("pl")} className={cn("hover:text-foreground", sort === "pl" && "text-foreground")}>
              P&amp;L {sort === "pl" && "↓"}
            </button>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.t}>
            <TableCell className="tabular-nums">{r.t}</TableCell>
            <TableCell className="font-medium">{r.s}</TableCell>
            {!dense && <TableCell className="text-muted-foreground">{r.side}</TableCell>}
            <TableCell className="text-right tabular-nums" style={{ color: r.pl >= 0 ? "var(--profit-text)" : "var(--loss-text)" }}>
              {signed(r.pl)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function Donut({ parts }: { parts: { v: number; c: string; label: string }[] }) {
  const total = parts.reduce((a, b) => a + b.v, 0)
  const r = 38
  const c = 2 * Math.PI * r
  const gap = 3
  // Where each slice starts along the ring, worked out up front.
  const starts = parts.map((_, i) => parts.slice(0, i).reduce((a, p) => a + (p.v / total) * c, 0))
  const [hover, setHover] = useState<number>()
  const still = useReducedMotion()
  const shown = hover !== undefined ? parts[hover] : parts[0]
  return (
    <div className="flex items-center gap-5" onPointerLeave={() => setHover(undefined)}>
      {/* The ring: slices with a small gap and round ends; the hovered one thickens. The middle names it and gives its share. */}
      <div className="relative size-28 shrink-0">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--muted)" strokeWidth="9" />
          {parts.map((p, i) => {
            const len = Math.max(0.5, (p.v / total) * c - gap)
            return (
              <motion.circle
                key={i}
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke={p.c}
                strokeLinecap="round"
                strokeWidth={hover === i ? 12 : 9}
                strokeDashoffset={-starts[i] - gap / 2}
                initial={still ? false : { strokeDasharray: `0 ${c}` }}
                animate={{ strokeDasharray: `${len} ${c - len}`, opacity: hover === undefined || hover === i ? 1 : 0.45 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: still ? 0 : i * 0.08 }}
                onPointerEnter={() => setHover(i)}
                className="cursor-pointer transition-[stroke-width] duration-150"
              />
            )
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <span className="text-lg leading-6 font-medium tabular-nums">{Math.round((shown.v / total) * 100)}%</span>
          <span className="text-[0.6875rem] leading-4 text-muted-foreground">{shown.label}</span>
        </div>
      </div>
      <Legend items={parts.map((p, i) => ({ color: p.c, label: p.label, value: `${Math.round((p.v / total) * 100)}%`, valueTone: hover === i ? "accent" : undefined }))} className="min-w-0 flex-1 gap-1.5" />
    </div>
  )
}

/* ---------- the catalogue ---------- */

export const COMPONENTS: KitDef[] = [
  // Actions
  {
    id: "button",
    name: "Button",
    group: "Actions",
    description: "The main action, a secondary one, or a quiet one",
    tags: ["interactive"],
    usedIn: ["Upgrade", "Book a 1:1", "Discord", "Banner"],
    tries: ["Hover and press each button", "Loading: click to see the busy state", "Tab to see the focus ring"],
    variants: [
      { label: "Variants", render: () => <div className={row}><Button>Book a call</Button><Button variant="outline">Details</Button><Button variant="secondary">Later</Button><Button variant="ghost">Skip</Button></div> },
      { label: "Sizes", render: () => <div className={row}><Button size="xs">Extra small</Button><Button size="sm">Small</Button><Button>Default</Button><Button size="lg">Large</Button></div> },
      { label: "With icon", render: () => <div className={row}><Button><Download /> Download</Button><Button variant="outline">Open journal <ArrowRight /></Button></div> },
      { label: "Loading", render: () => <LoadingButton /> },
      { label: "Disabled", render: () => <div className={row}><Button disabled>Book a call</Button><Button variant="outline" disabled>Details</Button></div> },
      { label: "Destructive", render: () => <Button variant="destructive">Remove trade</Button> },
    ],
  },
  {
    id: "icon-button",
    name: "Icon button",
    group: "Actions",
    description: "A square button with an icon and a tooltip label",
    tags: ["interactive"],
    usedIn: ["Continue lesson", "Welcome video", "Community feed"],
    tries: ["Hover to see the background; Tab for focus"],
    variants: [
      { label: "Sizes", render: () => <div className={row}>{(["icon-xs", "icon-sm", "icon", "icon-lg"] as const).map((s) => <Button key={s} size={s} variant="outline" aria-label="Share"><Share2 /></Button>)}</div> },
      { label: "Ghost", render: () => <div className={row}><Button size="icon" variant="ghost" aria-label="Copy"><Copy /></Button><Button size="icon" variant="ghost" aria-label="Settings"><Settings /></Button><Button size="icon" variant="ghost" aria-label="More"><MoreHorizontal /></Button></div> },
      { label: "Filled", render: () => <Button size="icon" aria-label="Play"><ArrowRight /></Button> },
    ],
  },
  {
    id: "link-button",
    name: "Link button",
    group: "Actions",
    description: "Where a widget leads: underlined text with a sliding arrow",
    tags: ["interactive"],
    usedIn: ["Performance", "Discipline", "Latest downloads", "Community feed"],
    tries: ["Hover: the underline appears and the arrow slides"],
    variants: [
      { label: "Footer link", render: () => <a href="#" onClick={(e) => e.preventDefault()} className="group inline-flex items-center gap-1 text-xs font-medium hover:underline">Open journal <span className="transition-transform duration-150 group-hover:translate-x-0.5">→</span></a> },
      { label: "Link variant", render: () => <Button variant="link">All 8 files</Button> },
    ],
  },
  {
    id: "button-group",
    name: "Button group",
    group: "Actions",
    description: "Related actions joined in one control",
    tags: ["interactive"],
    usedIn: ["Coach feedback"],
    tries: ["Click each part; the borders stay joined"],
    variants: [
      {
        label: "Joined",
        render: () => (
          <div className="inline-flex [&>button]:rounded-none [&>button:first-child]:rounded-l-md [&>button:last-child]:rounded-r-md [&>button+button]:-ml-px">
            <Button variant="outline" size="sm">Day</Button>
            <Button variant="outline" size="sm">Week</Button>
            <Button variant="outline" size="sm">Month</Button>
          </div>
        ),
      },
      { label: "Split", render: () => <div className="inline-flex"><Button size="sm" className="rounded-r-none">Export</Button><Button size="icon-sm" className="-ml-px rounded-l-none border-l border-primary-foreground/20" aria-label="More export options"><MoreHorizontal /></Button></div> },
    ],
  },

  // Inputs
  {
    id: "input",
    name: "Input",
    group: "Inputs",
    description: "A single line of text, with its label and states",
    tags: ["interactive", "form"],
    usedIn: ["Ask the AI"],
    tries: ["Click or Tab in: focus ring", "The error state explains what to fix"],
    variants: [
      { label: "Default", render: () => <label className={stack}><span className="text-xs font-medium">Trade note</span><Input placeholder="What did you see?" /></label> },
      { label: "Disabled", render: () => <Input placeholder="Locked until the course" disabled /> },
      { label: "Error", render: () => <label className={stack}><span className="text-xs font-medium">Risk per trade</span><Input defaultValue="12%" aria-invalid /><span className="text-xs" style={{ color: "var(--loss-text)" }}>Keep it at 2% or less.</span></label> },
    ],
  },
  {
    id: "search",
    name: "Search",
    group: "Inputs",
    description: "A search field with an icon and a keyboard hint",
    tags: ["interactive", "form"],
    usedIn: ["Ask the AI", "Latest downloads"],
    tries: ["Type to see the clear button"],
    variants: [
      { label: "With shortcut", render: () => <SearchDemo /> },
    ],
  },
  {
    id: "select",
    name: "Select",
    group: "Inputs",
    description: "Pick one option from a short list",
    tags: ["interactive", "form", "overlay"],
    usedIn: ["Performance (settings)"],
    tries: ["Open it with a click or Enter; arrows move, Enter picks"],
    variants: [
      {
        label: "Default",
        render: () => (
          <Select defaultValue="nq">
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nq">NQ · Nasdaq</SelectItem>
              <SelectItem value="es">ES · S&amp;P 500</SelectItem>
              <SelectItem value="cl">CL · Crude oil</SelectItem>
            </SelectContent>
          </Select>
        ),
      },
    ],
  },
  { id: "combobox", name: "Combobox", group: "Inputs", description: "Type to filter a list, then pick one", tags: ["interactive", "form", "overlay"], usedIn: ["Watchlist (settings)", "Recent trades (filter)"], tries: ["Type “n” to filter; ↑ ↓ and Enter to pick; Escape closes"], variants: [{ label: "Markets", width: 300, render: () => <Combobox /> }] },
  { id: "checkbox", name: "Checkbox", group: "Inputs", description: "Turn one item on or off, often in a list", tags: ["interactive", "form"], usedIn: ["First-week checklist", "Discipline"], tries: ["Click or Space to tick"], variants: [{ label: "List", render: () => <div className={stack}>{["Journal every trade", "No trades in news", "Stop at -2R"].map((x, i) => <label key={x} className="flex items-center gap-2"><Checkbox defaultChecked={i < 2} />{x}</label>)}</div> }, { label: "Disabled", render: () => <label className="flex items-center gap-2 text-muted-foreground"><Checkbox disabled /> Locked rule</label> }] },
  { id: "radio", name: "Radio group", group: "Inputs", description: "Pick exactly one of a few options", tags: ["interactive", "form"], usedIn: ["Book a 1:1"], tries: ["Arrows move between options"], variants: [{ label: "Default", render: () => <RadioGroup defaultValue="30" className={stack}>{["15", "30", "45"].map((x) => <label key={x} className="flex items-center gap-2"><RadioGroupItem value={x} />{x} minutes</label>)}</RadioGroup> }] },
  { id: "switch", name: "Switch", group: "Inputs", description: "A setting that takes effect at once", tags: ["interactive", "form"], usedIn: ["Up next (Remind me)"], tries: ["Click or Space: the knob slides"], variants: [{ label: "Default", render: () => <div className={stack}><label className="flex items-center justify-between gap-4">Remind me 15 min before <Switch defaultChecked /></label><label className="flex items-center justify-between gap-4">Weekly recap <Switch /></label></div> }, { label: "Disabled", render: () => <label className="flex items-center justify-between gap-4 text-muted-foreground">Coach-only setting <Switch disabled /></label> }] },
  { id: "toggle", name: "Toggle", group: "Inputs", description: "A button that stays pressed", tags: ["interactive"], usedIn: ["Announcement (like)"], tries: ["Click: pressed and released states"], variants: [{ label: "Default", render: () => <div className={row}><Toggle aria-label="Favourite"><Star /></Toggle><Toggle variant="outline" aria-label="Notifications"><Bell /></Toggle><Toggle variant="outline" defaultPressed>Pinned</Toggle></div> }] },
  { id: "segmented", name: "Segmented control", group: "Inputs", description: "Switch a widget's period or unit; the highlight slides", tags: ["interactive", "animated"], usedIn: ["Performance"], tries: ["Click an option: the highlight slides (Animate UI)", "Motion Slow ×4 to see it slide"], variants: [{ label: "Widget header", render: () => <SegDemo /> }, { label: "Toggle group", render: () => <ToggleGroup defaultValue={["week"]} variant="outline"><ToggleGroupItem value="day">Day</ToggleGroupItem><ToggleGroupItem value="week">Week</ToggleGroupItem><ToggleGroupItem value="month">Month</ToggleGroupItem></ToggleGroup> }] },
  { id: "slider", name: "Slider", group: "Inputs", description: "Pick a value on a range by dragging", tags: ["interactive", "form"], usedIn: ["Risk limits (settings)"], tries: ["Drag the thumb, or use the arrows"], variants: [{ label: "Default", render: () => <label className={stack}><span className="flex justify-between text-xs"><span className="font-medium">Daily loss limit</span><span className="text-muted-foreground">€500</span></span><Slider defaultValue={[50]} /></label> }, { label: "Range", render: () => <Slider defaultValue={[20, 70]} /> }] },
  { id: "number-field", name: "Number field", group: "Inputs", description: "A number with − and + steppers", tags: ["interactive", "form"], usedIn: ["Risk limits (settings)"], tries: ["Click − and +: the value stays within 0–10%"], variants: [{ label: "Stepper", render: () => <NumberField /> }] },
  { id: "date-chip", name: "Date chip", group: "Inputs", description: "Pick a day from a short row", tags: ["interactive"], usedIn: ["Book a 1:1", "Up next"], tries: ["Click a day: it fills with the accent"], variants: [{ label: "Days", render: () => <DateChips /> }] },

  // Navigation
  { id: "tabs", name: "Tabs", group: "Navigation", description: "Switch between views of the same thing", tags: ["interactive"], usedIn: ["Performance (layouts)", "Coach feedback"], tries: ["Click or use the arrows; content swaps"], variants: [{ label: "Default", width: 360, render: () => <Tabs defaultValue="pl"><TabsList><TabsTrigger value="pl">P&amp;L</TabsTrigger><TabsTrigger value="win">Win rate</TabsTrigger><TabsTrigger value="r">R</TabsTrigger></TabsList><TabsContent value="pl" className="pt-3"><Num value="+€1,220" delta="+€40" deltaTone="profit" /></TabsContent><TabsContent value="win" className="pt-3"><Num value="58%" /></TabsContent><TabsContent value="r" className="pt-3"><Num value="+0.42R" /></TabsContent></Tabs> }, { label: "Line", width: 360, render: () => <Tabs defaultValue="a"><TabsList variant="line"><TabsTrigger value="a">Today</TabsTrigger><TabsTrigger value="b">Week</TabsTrigger><TabsTrigger value="c">Month</TabsTrigger></TabsList></Tabs> }] },
  {
    id: "dropdown-menu",
    name: "Dropdown menu",
    group: "Navigation",
    description: "A short list of actions behind a button",
    tags: ["interactive", "overlay"],
    usedIn: ["Profile menu", "Builder actions"],
    tries: ["Open it; arrows move, Enter picks, Escape closes"],
    variants: [
      {
        label: "Actions",
        render: () => (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" />}>
              Actions <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Trade</DropdownMenuLabel>
                <DropdownMenuItem>Edit note</DropdownMenuItem>
                <DropdownMenuItem>Duplicate</DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
  },
  { id: "breadcrumb", name: "Breadcrumb", group: "Navigation", description: "Where you are, with the way back", tags: ["navigation"], usedIn: ["Courses (Next unlock)", "Library header"], tries: ["Hover the links"], variants: [{ label: "Default", render: () => <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href="#">Courses</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbLink href="#">Playbook</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>Module 4</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb> }] },
  { id: "stepper", name: "Stepper", group: "Navigation", description: "Steps of a short flow, done and to do", tags: ["interactive"], usedIn: ["First-week checklist"], tries: ["Next and Back move through the steps"], variants: [{ label: "Step 2 of 3", width: 380, render: () => <Stepper /> }, { label: "Start", width: 380, render: () => <Stepper at={0} /> }] },
  { id: "pagination", name: "Pagination", group: "Navigation", description: "Move through pages of a long list", tags: ["interactive"], usedIn: ["Recent trades"], tries: ["Click a page or the arrows"], variants: [{ label: "Default", width: 380, render: () => <Pagination /> }] },

  // Feedback
  { id: "tooltip", name: "Tooltip", group: "Feedback", description: "A short label on hover or focus", tags: ["interactive", "overlay"], usedIn: ["Icon buttons", "Chart points"], tries: ["Hover or Tab to the button"], variants: [{ label: "Default", render: () => <TooltipProvider><Tooltip><TooltipTrigger render={<Button variant="outline" size="icon" aria-label="Share" />}><Share2 /></TooltipTrigger><TooltipContent>Share this widget</TooltipContent></Tooltip></TooltipProvider> }] },
  { id: "badge", name: "Badge", group: "Feedback", description: "A short status or count; colour only when it means something", tags: ["status"], usedIn: ["Most widget headers"], tries: ["Compare the tones: neutral, accent, and the meaning colours"], variants: [{ label: "Widget chips", render: () => <div className={row}><Chip tone="neutral">8 files</Chip><Chip>33%</Chip><Chip tone="profit">Verified</Chip><Chip tone="loss">2 no-trade</Chip><Chip tone="warning">Limited places</Chip><Chip tone="info">New</Chip></div> }, { label: "ReUI badges", render: () => <div className={row}><ReBadge variant="outline">Outline</ReBadge><ReBadge variant="secondary">Secondary</ReBadge><ReBadge>Primary</ReBadge></div> }] },
  { id: "alert", name: "Alert", group: "Feedback", description: "A message that stays until it's dealt with", tags: ["status"], usedIn: ["Risk limits"], tries: ["Read: title, then what to do"], variants: [{ label: "Info", width: 380, render: () => <Alert><Bell /><AlertTitle>Cohort starts Monday</AlertTitle><AlertDescription>Watch module 1 before the first call.</AlertDescription></Alert> }, { label: "Destructive", width: 380, render: () => <Alert variant="destructive"><Bell /><AlertTitle>Daily limit reached</AlertTitle><AlertDescription>New trades are blocked until tomorrow.</AlertDescription></Alert> }] },
  { id: "toast", name: "Toast", group: "Feedback", description: "A short confirmation that goes away", tags: ["status", "interactive"], usedIn: ["Journal sync"], tries: ["Dismiss, then show again"], variants: [{ label: "Neutral", width: 360, bare: true, render: () => <ToastDemo tone="neutral" /> }, { label: "Profit", width: 360, bare: true, render: () => <ToastDemo tone="profit" /> }, { label: "Loss", width: 360, bare: true, render: () => <ToastDemo tone="loss" /> }] },
  { id: "progress", name: "Progress", group: "Feedback", description: "How far along something is", tags: ["chart"], usedIn: ["Continue lesson", "Courses", "Risk limits"], tries: ["Compare the plain bar and the tick bar"], variants: [{ label: "Bar", render: () => <div className={stack}><Label>Foundations · 4/8</Label><Progress value={50} /></div> }, { label: "Tick bar", render: () => <div className={stack}><Label>Daily limit used</Label><TickBar value={62} /></div> }] },
  { id: "skeleton", name: "Skeleton", group: "Feedback", description: "The shape of content while it loads", tags: ["status"], usedIn: ["Every widget while loading"], tries: ["The soft pulse; Motion Off stops it"], variants: [{ label: "Card", render: () => <div className={stack}><div className="flex items-center gap-3"><Skeleton className="size-8 rounded-md" /><div className="grid flex-1 gap-1.5"><Skeleton className="h-3 w-1/2" /><Skeleton className="h-3 w-1/3" /></div></div><Skeleton className="h-20 w-full" /></div> }] },
  { id: "empty", name: "Empty state", group: "Feedback", description: "What shows before there is data, and the next step", tags: ["status"], usedIn: ["Performance (no trades)", "Risk limits (no broker)"], tries: ["The button is the next step"], variants: [{ label: "Default", render: () => <div className="grid justify-items-center gap-2 py-4 text-center"><IconTile variant="frame"><Download /></IconTile><span className="font-medium">No trades yet</span><span className="text-xs text-muted-foreground">Connect your broker to fill your journal.</span><Button size="sm" className="mt-1">Connect broker</Button></div> }] },

  // Data display
  { id: "table", name: "Table", group: "Data display", description: "Rows to compare; click a header to sort", tags: ["table", "interactive"], usedIn: ["Recent trades", "Open positions", "Ranking"], tries: ["Click Time or P&L to sort", "Hover a row"], variants: [{ label: "Trades", width: 420, render: () => <TableDemo /> }, { label: "Dense", width: 300, render: () => <TableDemo dense /> }] },
  { id: "timeline", name: "Timeline", group: "Data display", description: "Events in time order", tags: ["list"], usedIn: ["Up next", "Market calendar"], tries: ["Read top to bottom: the accent marks the next one"], variants: [{ label: "Today", render: () => <Timeline items={[{ time: "15:30", title: "Live trading · NY open", value: "90m", color: "var(--primary)", strong: true }, { time: "18:00", title: "Trade review Q&A", value: "45m" }, { time: "20:30", title: "CPI · no trade", value: "30m", color: "var(--loss)" }]} /> }] },
  { id: "legend", name: "Legend", group: "Data display", description: "Label, colour key and value in rows", tags: ["list"], usedIn: ["Risk limits", "Daily P&L", "Discipline"], tries: ["Values on the right line up"], variants: [{ label: "Default", render: () => <Legend items={[{ color: "var(--primary)", label: "Down from peak", value: "€760" }, { color: "var(--muted-foreground)", label: "Room to floor", value: "€4,240" }, { label: "Today", value: "€281 / €500", valueTone: "loss" }]} /> }] },
  { id: "stat", name: "Stat", group: "Data display", description: "A headline figure, its change and small stats", tags: ["number", "animated"], usedIn: ["Performance", "Risk limits", "Ranking"], tries: ["Replay: the figure counts"], variants: [{ label: "Headline", render: () => <Num value="+€1,220" delta="+€40" deltaTone="profit" caption="vs Marco's model" /> }, { label: "Mini stats", width: 360, render: () => <MiniStats items={[{ label: "Win rate", value: "58%" }, { label: "Expectancy", value: "+0.42R", tone: "accent" }, { label: "Best day", value: "+€476", tone: "profit" }]} /> }] },
  { id: "avatar", name: "Avatar", group: "Data display", description: "A person, by picture or initials", tags: [], usedIn: ["Discord", "Coach profile", "Community feed"], tries: ["Initials when there is no picture"], variants: [{ label: "Sizes", render: () => <div className={row}><KitAvatar initials="JP" size={24} /><KitAvatar initials="SK" size={32} /><KitAvatar initials="MA" size={40} /></div> }, { label: "Stack", render: () => <div className="flex -space-x-2">{["JP", "SK", "MS", "TB", "ER"].map((x) => <KitAvatar key={x} initials={x} size={28} />)}</div> }] },
  { id: "chip", name: "Chip", group: "Data display", description: "A small value in a pill", tags: ["status"], usedIn: ["Widget headers"], tries: ["Compare neutral, accent and meaning tones"], variants: [{ label: "Tones", render: () => <div className={row}><Chip tone="neutral">1h 9min left</Chip><Chip>41 signed up</Chip><Chip tone="profit">+€40</Chip><Chip tone="loss">−€212</Chip></div> }] },
  { id: "kbd", name: "Kbd", group: "Data display", description: "A keyboard key in help text", tags: [], usedIn: ["Search", "Library"], tries: [], variants: [{ label: "Keys", render: () => <div className={row}>{["⌘", "K", "Esc", "←", "→"].map((k) => <kbd key={k} className="grid h-6 min-w-6 place-items-center rounded border px-1.5 font-[family-name:var(--ff-geist-mono)] text-[0.6875rem] text-muted-foreground" style={{ borderColor: "var(--border)" }}>{k}</kbd>)}</div> }] },
  { id: "frame", name: "Frame", group: "Data display", description: "The ReUI card shell every widget sits in", tags: ["surface"], usedIn: ["Every widget"], tries: ["Muted shell, raised inner panel"], variants: [{ label: "Default", bare: true, width: 320, render: () => <Frame><div className="px-3 py-2 text-xs font-medium">Header</div><FramePanel>Body content on the raised panel.</FramePanel></Frame> }] },

  // Charts
  { id: "trace", name: "Trace", group: "Charts", description: "A sparkline: the shape of a series, latest point marked", tags: ["chart", "interactive"], usedIn: ["Discord", "Win rate trend", "Watchlist"], tries: ["Hover a point: value tooltip"], variants: [{ label: "Accent", render: () => <Spark values={CURVE} className="h-16" /> }, { label: "Muted", render: () => <Spark values={CURVE} tone="muted" className="h-16" /> }] },
  { id: "step-chart", name: "Step chart", group: "Charts", description: "A running total that changes in steps, with a compare line", tags: ["chart", "interactive"], usedIn: ["Performance"], tries: ["Hover along the line"], variants: [{ label: "Two series", width: 380, render: () => <StepChart series={[{ values: CURVE, label: "You" }, { values: CURVE.map((v) => v * 0.85 + 40), label: "Model", color: "var(--muted-foreground)" }]} /> }] },
  { id: "bars", name: "Bars", group: "Charts", description: "Values per day or per item; positive up, negative down", tags: ["chart", "interactive"], usedIn: ["Daily P&L", "P&L by weekday"], tries: ["Hover a bar: value tooltip"], variants: [{ label: "Diverging", width: 360, render: () => <Bars values={DAYS} diverging className="h-24" format={signed} /> }, { label: "Plain", width: 360, render: () => <Bars values={[4, 7, 5, 9, 6]} labels={["M", "T", "W", "T", "F"]} tips={["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]} className="h-24" /> }] },
  { id: "histogram", name: "Histogram", group: "Charts", description: "How results spread across buckets", tags: ["chart", "interactive"], usedIn: ["R distribution"], tries: ["Hover a bucket"], variants: [{ label: "R multiples", width: 360, render: () => <Bars values={[1, 3, 6, 4, 8, 5, 3, 1]} labels={["-2", "-1.5", "-1", "-.5", ".5", "1", "2", "3+"]} active={4} className="h-24" format={(v) => `${v} trades`} /> }] },
  { id: "gauge", name: "Gauge", group: "Charts", description: "One value against its limit", tags: ["chart"], usedIn: ["Discipline", "Risk limits", "Courses"], tries: ["Compare the tick gauge and the ring"], variants: [{ label: "Tick gauge", render: () => <TickGauge value={84}><Num size="md" value="84%" /></TickGauge> }, { label: "Ring (roomy)", render: () => <TickGauge ring value={84} className="max-w-48"><Num size="md" value="84%" /></TickGauge> }, { label: "Ring", render: () => <div className={row}><Ring value={50}><span className="text-xs">50%</span></Ring><Ring value={80} size={72}><span className="text-sm">80%</span></Ring></div> }] },
  { id: "dot-strip", name: "Dot strip", group: "Charts", description: "Where you sit among everyone", tags: ["chart"], usedIn: ["Ranking"], tries: ["The accent dot is you"], variants: [{ label: "Rank", width: 360, render: () => <DotStrip values={[30, 42, 48, 51, 55, 58, 60, 62, 64, 66, 70, 71, 74, 78, 80, 85, 88, 92]} me={88} min={30} max={100} /> }] },
  { id: "hatch-bar", name: "Hatch bar", group: "Charts", description: "Parts of a total; what's left is hatched", tags: ["chart"], usedIn: ["Book a 1:1"], tries: [], variants: [{ label: "Used and left", render: () => <HatchBar parts={[{ value: 1, color: "var(--primary)" }]} total={2} /> }] },
  { id: "heatmap", name: "Heatmap", group: "Charts", description: "A grid of days or hours by intensity", tags: ["chart", "interactive"], usedIn: ["Performance (by hour)", "Discord"], tries: ["Hover a cell"], variants: [{ label: "Week × hour", width: 380, render: () => <Heat rows={[[1, 2, 0, -1, 3], [2, -2, 1, 0, 1], [0, 3, 2, -1, 2], [-1, 1, 0, 2, 3], [2, 0, -2, 1, 1]]} labels={["Mon", "Tue", "Wed", "Thu", "Fri"]} rowLabels={["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5"]} /> }] },
  { id: "donut", name: "Donut", group: "Charts", description: "A few shares of a whole; hover one", tags: ["chart", "interactive"], usedIn: ["P&L by instrument"], tries: ["Hover a slice: it thickens and its row highlights"], variants: [{ label: "Instruments", width: 360, render: () => <Donut parts={[{ v: 52, c: "var(--primary)", label: "NQ" }, { v: 28, c: "color-mix(in oklab, var(--primary) 60%, var(--card))", label: "ES" }, { v: 20, c: "color-mix(in oklab, var(--primary) 30%, var(--card))", label: "CL" }]} /> }] },

  // Overlays
  { id: "popover", name: "Popover", group: "Overlays", description: "More detail next to what you clicked", tags: ["interactive", "overlay"], usedIn: ["Market calendar", "Charts"], tries: ["Click to open; Escape or click outside to close"], variants: [{ label: "Default", render: () => <Popover><PopoverTrigger render={<Button variant="outline" />}>CPI details</PopoverTrigger><PopoverContent className="w-64"><PopoverHeader><PopoverTitle>US CPI · Wed 14:30</PopoverTitle><PopoverDescription>Forecast 3.1% · Prior 3.2%. No trading 15 min either side.</PopoverDescription></PopoverHeader></PopoverContent></Popover> }] },
  { id: "dialog", name: "Dialog", group: "Overlays", description: "A focused task that needs an answer", tags: ["interactive", "overlay"], usedIn: ["Book a 1:1", "Remove trade"], tries: ["Open: focus moves in, Escape closes"], variants: [{ label: "Confirm", render: () => <Dialog><DialogTrigger render={<Button variant="outline" />}>Remove trade</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Remove this trade?</DialogTitle><DialogDescription>It leaves your journal and your stats.</DialogDescription></DialogHeader><DialogFooter><DialogClose render={<Button variant="outline" />}>Cancel</DialogClose><DialogClose render={<Button variant="destructive" />}>Remove</DialogClose></DialogFooter></DialogContent></Dialog> }] },
  { id: "sheet", name: "Sheet", group: "Overlays", description: "A panel from the side for longer content", tags: ["interactive", "overlay"], usedIn: ["Trade details"], tries: ["Open: it slides in; Escape closes"], variants: [{ label: "Right", render: () => <Sheet><SheetTrigger render={<Button variant="outline" />}>Trade details</SheetTrigger><SheetContent><SheetHeader><SheetTitle>NQ long · 09:42</SheetTitle><SheetDescription>+1.8R · +€360 · held 14 min</SheetDescription></SheetHeader></SheetContent></Sheet> }] },
]

const SYMBOLS = ["NQ · Nasdaq 100", "ES · S&P 500", "YM · Dow", "RTY · Russell 2000", "CL · Crude oil", "GC · Gold", "EURUSD · Euro / Dollar"]

/** Type to filter a list; ↑ ↓ to move, Enter to pick, Escape to close. */
function Combobox() {
  const [q, setQ] = useState("")
  const [open, setOpen] = useState(false)
  const [at, setAt] = useState(0)
  const [value, setValue] = useState<string>()
  const list = SYMBOLS.filter((x) => x.toLowerCase().includes(q.toLowerCase()))
  const pick = (x: string) => {
    setValue(x)
    setQ(x)
    setOpen(false)
  }
  return (
    <div className="relative w-64">
      <input
        role="combobox"
        aria-expanded={open}
        aria-controls="kit-combo-list"
        aria-autocomplete="list"
        aria-activedescendant={open && list[at] ? `kit-combo-${at}` : undefined}
        aria-label="Market"
        value={q}
        placeholder="Pick a market"
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onChange={(e) => {
          setQ(e.target.value)
          setAt(0)
          setOpen(true)
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault()
            setOpen(true)
            setAt(Math.min(list.length - 1, at + 1))
          } else if (e.key === "ArrowUp") {
            e.preventDefault()
            setAt(Math.max(0, at - 1))
          } else if (e.key === "Enter" && open && list[at]) {
            e.preventDefault()
            pick(list[at])
          } else if (e.key === "Escape" && open) {
            e.preventDefault()
            e.stopPropagation()
            setOpen(false)
          }
        }}
        className="h-9 w-full rounded-md border bg-transparent px-2.5 text-[0.8125rem] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-(--brand-mark)"
        style={{ borderColor: "var(--border)" }}
      />
      {open && (
        <ul id="kit-combo-list" role="listbox" aria-label="Markets" className="absolute top-10 right-0 left-0 z-10 max-h-48 overflow-auto rounded-md border bg-card p-1 shadow-md" style={{ borderColor: "var(--border)" }}>
          {list.length === 0 && <li className="px-2 py-1.5 text-xs text-muted-foreground">No market matches</li>}
          {list.map((x, i) => (
            <li
              key={x}
              id={`kit-combo-${i}`}
              role="option"
              aria-selected={value === x}
              onPointerMove={() => setAt(i)}
              onMouseDown={(e) => {
                e.preventDefault()
                pick(x)
              }}
              className={cn("flex cursor-pointer items-center justify-between rounded px-2 py-1.5 text-[0.8125rem]", i === at && "bg-muted")}
            >
              {x}
              {value === x && <span className="text-xs" style={{ color: "var(--brand-text)" }}>✓</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SearchDemo() {
  const [q, setQ] = useState("")
  return (
    <label className="flex h-9 items-center gap-2 rounded-md border px-2.5" style={{ borderColor: "var(--border)" }}>
      <Search className="size-4 text-muted-foreground" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search lessons" aria-label="Search lessons" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground" />
      {q ? (
        <button type="button" onClick={() => setQ("")} className="text-xs text-muted-foreground hover:text-foreground">
          Clear
        </button>
      ) : (
        <kbd className="rounded border px-1 text-[0.6875rem] text-muted-foreground" style={{ borderColor: "var(--border)" }}>
          ⌘K
        </kbd>
      )}
    </label>
  )
}
