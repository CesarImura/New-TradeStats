"use client"

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  History,
  LayoutGrid,
  Monitor,
  MoreHorizontal,
  PlayCircle,
  Smartphone,
  Tablet,
  Trash2,
  Undo2,
  Wand2,
} from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { studentNav } from "@/components/coach/nav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useSidebar } from "@/components/ui/sidebar"
import type { DataMode } from "@/components/widgets/shared"
import { getDemoCoach } from "@/lib/data/coaches"
import { useCustomCommunities } from "@/lib/data/use-communities"
import { describe, targetsForField, type PickMessage, type PickTarget } from "@/lib/design-pick"
import { themeToCss } from "@/lib/theme/css"
import { onColor } from "@/lib/theme/derive"
import { resolveCoach, resolveTheme } from "@/lib/theme/resolve"
import { TEMPLATES } from "@/lib/theme/templates"
import type { CoachTheme } from "@/lib/theme/types"
import type { PageId } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { WidgetLibrary, WidgetSettings } from "./builder-panels"
import { More, RevealContext, Segmented, SliderField } from "./controls"
import { DesignField, DesignProvider, useDesign } from "./design-fields"
import { GuideDialog, VersionsSheet, useDraftEditor } from "./editor-shell"
import { DEPTH_NAMES, LOOKS, SPACING_NAMES, currentLook, depthOf, fromDepth, fromRoundness, fromSpacing, roundnessOf, spacingOf, type Look } from "./looks"
import { ArrangeCanvas, useArrange, type Device } from "./page-builder"
import { PreviewFrame } from "./preview-frame"

type Step = "brand" | "look" | "pages" | "menu"
const STEPS: { id: Step; label: string; text: string }[] = [
  { id: "brand", label: "Brand", text: "Your name, logo and colour." },
  { id: "look", label: "Look", text: "Pick a look. Fine-tune it if you like." },
  { id: "pages", label: "Pages", text: "What's on each page. Drag widgets on the right." },
  { id: "menu", label: "Menu", text: "What the menu shows and what you call things." },
]

/** Where a part clicked in the preview is set. Buttons and cards land on Fine-tune, not on the brand colour. */
const STEP_OF: Record<string, Step> = {
  logo: "brand",
  highlight: "brand",
  nav: "menu",
  buttons: "look",
  headings: "look",
  labels: "look",
  cards: "look",
  "brand-surface": "look",
  background: "look",
}
/** The settings to flash after a click (Fine-tune's sliders stand for the detailed ones). */
const FLASH: Partial<Record<PickTarget, string[]>> = {
  buttons: ["corners"],
  headings: ["fonts"],
  labels: ["labels"],
  cards: ["widget-style", "corners", "shadows", "density"],
  "brand-surface": ["shadows"],
  background: ["background"],
  highlight: ["highlight"],
  logo: ["logo", "name"],
  nav: ["nav-layout"],
}

const StepCtx = createContext<{ go: (s: Step) => void }>({ go: () => {} })

/**
 * ADM-37 to ADM-44: Design in four short steps (Brand, Look, Pages, Menu). One
 * panel on the left, the coach's real platform on the right. Clicking a part
 * of the platform opens the step and setting that changes it. On Pages the
 * platform becomes the widget grid. Simple first: a ready-made look, three
 * Fine-tune sliders, everything else under Advanced. Changes stay a draft
 * until Publish.
 */
export function DesignWorkspace() {
  const { coach: published } = useCoach()
  const slug = published.slug
  // The server and the first browser render can't see wizard-made communities
  // (the provider shows a hidden stand-in then); use the published coach meanwhile.
  const custom = useCustomCommunities()
  const original = getDemoCoach(slug) ?? custom.find((c) => c.slug === slug) ?? published
  const editor = useDraftEditor(slug)
  const { working, commit, change } = editor
  const coach = useMemo(() => resolveCoach(original, working.content), [original, working.content])
  const theme = useMemo(() => resolveTheme(coach, working.theme), [coach, working.theme])

  // Where to start, from the link that opened Design (setup, all pages, old Pages links).
  const params = useSearchParams()
  const asked = params.get("step") ?? (params.get("mode") === "arrange" || params.get("panel") === "pages" ? "pages" : params.get("panel") === "menu" ? "menu" : "brand")
  const [step, setStep] = useState<Step>(STEPS.some((s) => s.id === asked) ? (asked as Step) : "brand")
  const pages = studentNav(coach, `/c/${slug}`)
  const [pageAsked, setPage] = useState(params.get("page") ?? "home")
  const page = (pages.some((p) => p.id === pageAsked) ? pageAsked : "home") as PageId
  const [tier, setTier] = useState(params.get("tier") ?? "default")
  const [data, setData] = useState<DataMode>("sample")
  const [device, setDevice] = useState<Device>("desktop")
  const [widget, setWidget] = useState<string | null>(null)
  const [incoming, setIncoming] = useState<string | null>(null)
  const [menu, setMenu] = useState<"versions" | "guide" | null>(null)

  const arrange = useArrange({ coach, theme, editor, page, tier, selected: widget, setSelected: setWidget })
  const panel = useRef<HTMLDivElement>(null)
  const go = (s: Step) => {
    setStep(s)
    setWidget(null)
    panel.current?.scrollTo({ top: 0 })
  }
  const pick = usePreviewPick(step !== "pages", (target) => {
    const to = target.startsWith("menu:") ? "menu" : (STEP_OF[target] ?? "look")
    setStep(to)
    return target.startsWith("menu:") ? describe(target).fields : (FLASH[target] ?? describe(target).fields)
  })
  useFlash(panel, pick.reveal)

  // Give the canvas room: fold the admin menu to icons while designing, and restore it on leaving.
  const { open: menuOpen, setOpen: setMenuOpen } = useSidebar()
  const menuWasOpen = useRef(menuOpen)
  useEffect(() => {
    const restore = menuWasOpen.current
    setMenuOpen(false)
    return () => setMenuOpen(restore)
  }, [setMenuOpen])

  const fromSetup = params.get("from") === "setup"
  const pageInfo = arrange.pageInfo
  const src = `${step === "pages" ? pageInfo.href : `/c/${slug}`}?preview=draft${step === "pages" && tier !== "default" ? `&tier=${tier}` : ""}${step === "pages" && data === "empty" ? "&data=empty" : ""}`
  const canvasClass = cn("hb-canvas", theme.mode === "dark" ? "dark" : "light")
  const i = STEPS.findIndex((s) => s.id === step)
  const next = STEPS[i + 1]

  return (
    <DesignProvider value={{ coach, theme, working, change, commit }}>
      <StepCtx.Provider value={{ go }}>
        <div className="-mx-4 -my-5 grid min-h-[calc(100svh-2.75rem)] grid-rows-[auto_1fr] md:-m-6 lg:h-[calc(100svh-2.75rem)]">
          {/* Top bar: the way back, status, and the three things you do: undo, preview, publish. */}
          <div className="flex items-center gap-2 border-b bg-[var(--sidebar)] px-3 py-1.5">
            {fromSetup && (
              <Button size="sm" nativeButton={false} render={<Link href="/setup" />}>
                <ArrowLeft /> Back to setup
              </Button>
            )}
            <span className="px-1 text-[0.8125rem] font-semibold">Design</span>
            {editor.dirty ? (
              <Badge variant="secondary" className="gap-1.5">
                <span className="size-1.5 rounded-full bg-amber-500" /> Not published yet
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1.5 text-muted-foreground">
                <span className="size-1.5 rounded-full bg-emerald-500" /> Live
              </Badge>
            )}
            <div className="ml-auto flex items-center gap-1">
              <div className="mr-1 w-[6.5rem]">
                <Segmented
                  label="Screen size"
                  value={device}
                  onChange={setDevice}
                  options={[
                    { value: "desktop", label: <Monitor className="size-3.5" aria-label="Desktop" /> },
                    { value: "tablet", label: <Tablet className="size-3.5" aria-label="Tablet" /> },
                    { value: "phone", label: <Smartphone className="size-3.5" aria-label="Phone" /> },
                  ]}
                />
              </div>
              <Button variant="ghost" size="icon-sm" onClick={editor.undo} disabled={!editor.canUndo} aria-label="Undo" title="Undo (⌘Z)">
                <Undo2 />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More" />}>
                  <MoreHorizontal />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => setMenu("versions")}>
                    <History /> Earlier versions
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setMenu("guide")}>
                    <PlayCircle /> 2-minute guide
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href={`/admin/${slug}/design/pages/all${fromSetup ? "?from=setup" : ""}`} />}>
                    <LayoutGrid /> All pages side by side
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" disabled={!editor.dirty} onClick={editor.discard}>
                    <Trash2 /> Discard changes
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm" nativeButton={false} render={<a href={src} target="_blank" rel="noreferrer" />} title="Open your platform as students see it, with your changes">
                <ExternalLink /> Preview
              </Button>
              <Button size="sm" disabled={!editor.dirty} onClick={editor.publish}>
                Publish
              </Button>
            </div>
            <VersionsSheet slug={slug} open={menu === "versions"} onOpenChange={(o) => setMenu(o ? "versions" : null)} />
            <GuideDialog
              title="Designing your platform"
              text="Four short steps: your brand, a look, your pages, your menu. Click anything in your platform on the right to jump to what changes it. Nothing changes for students until you publish."
              open={menu === "guide"}
              onOpenChange={(o) => setMenu(o ? "guide" : null)}
            />
          </div>

          <div className="grid min-h-0 grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)]">
            {/* The one panel: steps across the top, the step's settings, then Next. */}
            <aside className="flex min-h-0 flex-col border-b bg-card lg:border-r lg:border-b-0">
              <nav aria-label="Design steps" className="grid grid-cols-4 gap-1 border-b p-2">
                {STEPS.map((s, n) => (
                  <button
                    key={s.id}
                    onClick={() => go(s.id)}
                    aria-current={s.id === step ? "step" : undefined}
                    className={cn(
                      "grid justify-items-center gap-1 rounded-[4px] py-1.5 text-xs text-muted-foreground hover:bg-[var(--ts-hover-1)] hover:text-foreground",
                      s.id === step && "bg-[var(--ts-layer-2)] text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-5 place-items-center rounded-full border text-[0.6875rem] tabular-nums",
                        s.id === step && "border-[var(--ts-interactive)] bg-[var(--ts-interactive)] text-black",
                      )}
                    >
                      {n + 1}
                    </span>
                    {s.label}
                  </button>
                ))}
              </nav>
              <div className="border-b px-4 py-2.5 text-xs text-muted-foreground">{STEPS[i].text}</div>

              <RevealContext.Provider value={pick.reveal}>
                <div ref={panel} className="min-h-0 flex-1 overflow-y-auto" onPointerOver={pick.onPanelHover} onPointerLeave={pick.onPanelLeave}>
                  {step === "brand" && <BrandStep />}
                  {step === "look" && <LookStep theme={theme} />}
                  {step === "menu" && <MenuStep />}
                  {step === "pages" &&
                    (arrange.selWidget ? (
                      <div>
                        <div className="border-b px-3 py-1.5">
                          <Button variant="ghost" size="sm" onClick={() => setWidget(null)}>
                            <ArrowLeft /> All widgets
                          </Button>
                        </div>
                        <WidgetSettings
                          key={arrange.selWidget.id}
                          w={arrange.selWidget}
                          pinned={arrange.pinned(arrange.selWidget.id)}
                          canvasClass={canvasClass}
                          onChange={(patch, key) => arrange.updateItem(arrange.selWidget!.id, patch, key)}
                          onDuplicate={() => arrange.duplicateWidget(arrange.selWidget!.id)}
                          onRemove={() => arrange.removeWidget(arrange.selWidget!.id)}
                        />
                      </div>
                    ) : (
                      <PagesStep
                        pages={pages}
                        page={page}
                        onPage={(id) => {
                          setPage(id)
                          setWidget(null)
                        }}
                        tier={tier}
                        onTier={(t) => {
                          setTier(t)
                          setWidget(null)
                        }}
                        data={data}
                        onData={setData}
                        arrange={arrange}
                        library={<WidgetLibrary key={page} page={page} coach={coach} canvasClass={canvasClass} onAdd={arrange.addWidget} onDragType={setIncoming} />}
                      />
                    ))}
                </div>
              </RevealContext.Provider>

              <div className="flex items-center justify-between gap-2 border-t px-3 py-2">
                <Button variant="ghost" size="sm" disabled={i === 0} onClick={() => go(STEPS[i - 1].id)}>
                  <ArrowLeft /> Back
                </Button>
                {next ? (
                  <Button variant="outline" size="sm" onClick={() => go(next.id)}>
                    Next: {next.label} <ArrowRight />
                  </Button>
                ) : (
                  <Button size="sm" disabled={!editor.dirty} onClick={editor.publish}>
                    <Check /> Publish
                  </Button>
                )}
              </div>
            </aside>

            {/* The platform. On Pages it's the widget grid; elsewhere, click a part to change it. */}
            <section className="grid min-h-[70svh] min-w-0 grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-[color:color-mix(in_oklab,var(--background)_70%,black)] lg:min-h-0">
              <p className="truncate border-b bg-[var(--sidebar)] px-4 py-1.5 text-xs text-muted-foreground">
                {step === "pages"
                  ? arrange.inherits
                    ? `${arrange.tierName} uses the everyone layout. Changing it gives ${arrange.tierName} its own.`
                    : `${pageInfo.label}: drag to move, drag edges to resize, right-click for more`
                  : "Click any part of your platform to change it"}
              </p>
              <div className="min-h-0 min-w-0 overflow-hidden">
                {step === "pages" ? (
                  <ArrangeCanvas arrange={arrange} coach={coach} theme={theme} device={device} data={data} incoming={incoming} onDropped={() => setIncoming(null)} />
                ) : (
                  <PreviewFrame src={src} device={device} frameRef={pick.frameRef} />
                )}
              </div>
            </section>
          </div>
        </div>
      </StepCtx.Provider>
    </DesignProvider>
  )
}

/* ---------- Steps ---------- */

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-b px-4 pt-3.5 pb-5 last:border-b-0">
      {title && <h3 className="text-[0.6875rem] font-medium tracking-[0.06em] text-muted-foreground uppercase">{title}</h3>}
      {children}
    </section>
  )
}

function BrandStep() {
  return (
    <>
      <Section>
        <DesignField id="logo" />
        <DesignField id="name" />
        <DesignField id="primary" />
        <DesignField id="mode" />
        <More label="Second colour">
          <DesignField id="highlight" />
        </More>
      </Section>
      <DesignHelp />
    </>
  )
}

function LookStep({ theme }: { theme: CoachTheme }) {
  const { coach, change } = useDesign()
  const active = currentLook(theme)
  return (
    <>
      <Section>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Look">
          {LOOKS.map((l) => (
            <LookCard
              key={l.id}
              look={l}
              theme={theme}
              selected={active?.id === l.id}
              onSelect={() => {
                change({ theme: { template: l.template, ...l.set } }, "look")
                toast(`${l.name} look applied. Your colours and logo stay.`)
              }}
            />
          ))}
        </div>
        {!active && <p className="text-xs text-muted-foreground">Your own mix. Pick a look to start again from it.</p>}
      </Section>
      <Section title="Fine-tune">
        <SliderField
          id="corners"
          label="Roundness"
          value={roundnessOf(theme)}
          min={0}
          max={24}
          format={(r) => (r <= 3 ? "Sharp" : r >= 16 ? "Very round" : "Round")}
          onChange={(r) => change({ theme: fromRoundness(r) }, "roundness")}
        />
        <SliderField id="shadows" label="Depth" value={depthOf(theme)} min={0} max={2} format={(d) => DEPTH_NAMES[d]} onChange={(d) => change({ theme: fromDepth(d) }, "depth")} />
        <SliderField id="density" label="Spacing" value={spacingOf(theme)} min={0} max={2} format={(s) => SPACING_NAMES[s]} onChange={(s) => change({ theme: fromSpacing(s) }, "spacing")} />
        <DesignField id="widget-style" />
      </Section>
      <Section>
        <More label="Advanced">
          <DesignField id="fonts" />
          <DesignField id="heading-weight" />
          <DesignField id="labels" />
          <DesignField id="buttons" />
          <DesignField id="effects" />
          <DesignField id="borders" />
          <DesignField id="background" />
          <p className="text-xs text-muted-foreground">
            Looks are built on three templates ({Object.values(TEMPLATES).map((t) => t.name).join(", ")}). {coach.name} is on {TEMPLATES[theme.template].name}.
          </p>
        </More>
      </Section>
    </>
  )
}

function PagesStep({
  pages,
  page,
  onPage,
  tier,
  onTier,
  data,
  onData,
  arrange,
  library,
}: {
  pages: ReturnType<typeof studentNav>
  page: PageId
  onPage: (id: string) => void
  tier: string
  onTier: (t: string) => void
  data: DataMode
  onData: (d: DataMode) => void
  arrange: ReturnType<typeof useArrange>
  library: React.ReactNode
}) {
  const { coach } = useDesign()
  return (
    <>
      <Section>
        <label className="grid gap-1.5 text-xs font-medium text-[color:color-mix(in_oklab,var(--foreground)_60%,transparent)]">
          Page
          <select value={page} onChange={(e) => onPage(e.target.value)} className="h-7 rounded-[4px] border bg-background px-2 text-xs text-foreground">
            {pages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <More label="Per tier and preview data">
          <label className="grid gap-1.5 text-xs font-medium text-[color:color-mix(in_oklab,var(--foreground)_60%,transparent)]">
            Layout for
            <select value={tier} onChange={(e) => onTier(e.target.value)} className="h-7 rounded-[4px] border bg-background px-2 text-xs text-foreground">
              <option value="default">Everyone</option>
              {coach.tiers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {(coach.pages?.[page] ?? {})[t.id] ? " · own layout" : ""}
                </option>
              ))}
            </select>
          </label>
          {tier !== "default" && !arrange.inherits && (
            <Button variant="ghost" size="sm" className="w-fit" onClick={arrange.useDefault}>
              Use the everyone layout instead
            </Button>
          )}
          <div className="grid gap-1.5">
            <span className="text-xs font-medium text-[color:color-mix(in_oklab,var(--foreground)_60%,transparent)]">Show it with</span>
            <Segmented
              label="Preview data"
              value={data}
              onChange={onData}
              options={[
                { value: "sample", label: "Sample data" },
                { value: "empty", label: "A new student" },
              ]}
            />
          </div>
        </More>
      </Section>
      <div className="border-b px-4 pt-3 text-[0.6875rem] font-medium tracking-[0.06em] text-muted-foreground uppercase">Add a widget</div>
      {library}
    </>
  )
}

function MenuStep() {
  return (
    <>
      <Section>
        <DesignField id="menu-items" />
      </Section>
      <Section>
        <More label="Menu layout">
          <DesignField id="nav-layout" />
          <DesignField id="nav-style" />
          <DesignField id="nav-logo" />
        </More>
        <More label="What you call things">
          <DesignField id="wording" />
        </More>
      </Section>
    </>
  )
}

function DesignHelp() {
  const { go } = useContext(StepCtx)
  return (
    <div className="m-4 grid gap-2 rounded-[6px] border p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Wand2 className="size-4" /> Want it to look exactly like your brand?
      </div>
      <p className="text-xs text-muted-foreground">Our designers can build your own design on top of these settings.</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => toast("Design packages open from Settings → Our subscription.")}>
          See design packages
        </Button>
        <Button variant="ghost" size="sm" onClick={() => go("look")}>
          Or pick a look <ArrowRight />
        </Button>
      </div>
    </div>
  )
}

/** A look as a small card drawn in that look, with the coach's own colour. */
function LookCard({ look, theme, selected, onSelect }: { look: Look; theme: CoachTheme; selected: boolean; onSelect: () => void }) {
  const t: CoachTheme = {
    ...TEMPLATES[look.template].theme,
    ...look.set,
    mode: theme.mode,
    primary: theme.primary,
    primaryForeground: onColor(theme.primary),
  }
  const cls = `tpl-look-${look.id}`
  return (
    <button
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "grid gap-1.5 rounded-[6px] border p-1.5 text-left outline-none hover:border-[#3a3a40] focus-visible:border-[var(--ts-interactive)]",
        selected && "border-[var(--ts-interactive)] hover:border-[var(--ts-interactive)]",
      )}
    >
      <style dangerouslySetInnerHTML={{ __html: themeToCss(t, `.${cls}`) }} />
      <span className={cn(cls, t.mode === "light" && "light", "grid aspect-[16/10] content-start gap-1.5 overflow-hidden rounded-[4px] bg-background p-2 text-foreground")}>
        <span className="text-base leading-none" style={{ fontFamily: "var(--coach-font-heading)", fontWeight: look.set.headingWeight }}>
          Aa
        </span>
        <span className="grid gap-1 rounded-[min(var(--radius),12px)] bg-card p-1.5" style={{ boxShadow: "var(--card-shadow)", border: look.set.borders ? "1px solid var(--border)" : undefined }}>
          <span className="h-1 w-10 rounded-full bg-foreground/40" />
          <span className="h-2.5 w-9 rounded-[var(--button-radius)] bg-primary" />
        </span>
      </span>
      <span className="grid px-0.5">
        <span className="flex items-center gap-1 text-xs font-medium">
          {look.name}
          {selected && <Check className="size-3 text-[var(--ts-interactive)]" />}
        </span>
        <span className="truncate text-[0.6875rem] text-muted-foreground">{look.blurb}</span>
      </span>
    </button>
  )
}

/* ---------- Click-to-edit ---------- */

/**
 * A click in the preview tells the workspace which part was clicked; `onPick`
 * opens the step and returns the settings to show. Hovering a setting outlines
 * what it changes in the preview.
 */
function usePreviewPick(on: boolean, onPick: (target: PickTarget) => string[]) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [reveal, setReveal] = useState<{ fields: string[]; n: number }>({ fields: [], n: 0 })
  const shown = useRef("")
  const pickRef = useRef(onPick)
  useEffect(() => {
    pickRef.current = onPick
  })

  useEffect(() => {
    const send = (m: PickMessage) => frame.current?.contentWindow?.postMessage(m, window.location.origin)
    send({ type: "design-pick-mode", on })
    const onMessage = (e: MessageEvent<PickMessage>) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return
      const m = e.data
      if (m?.type === "design-pick-ready") send({ type: "design-pick-mode", on })
      if (m?.type === "design-pick") {
        const fields = pickRef.current(m.target)
        setReveal((r) => ({ fields, n: r.n + 1 }))
      }
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [on])

  const show = (targets: PickTarget[]) => {
    const key = targets.join()
    if (key === shown.current) return
    shown.current = key
    frame.current?.contentWindow?.postMessage({ type: "design-show", targets } satisfies PickMessage, window.location.origin)
  }

  return {
    frameRef: frame,
    reveal,
    onPanelHover: (e: React.PointerEvent) => {
      if (!on) return
      const field = (e.target as Element).closest("[data-field]")?.getAttribute("data-field")
      show(field ? targetsForField(field) : [])
    },
    onPanelLeave: () => show([]),
  }
}

/** After a pick (and the step and folds have opened): scroll to the first setting and flash them all. */
function useFlash(panel: React.RefObject<HTMLDivElement | null>, reveal: { fields: string[]; n: number }) {
  useEffect(() => {
    if (!reveal.n) return
    let id = requestAnimationFrame(() => {
      id = requestAnimationFrame(() => {
        const els = reveal.fields.flatMap((f) => [...(panel.current?.querySelectorAll<HTMLElement>(`[data-field="${f}"]`) ?? [])])
        els[0]?.scrollIntoView({ behavior: "smooth", block: "center" })
        for (const el of els)
          el.animate(
            [
              { outline: "2px solid #ff5500", outlineOffset: "6px", borderRadius: "4px" },
              { outline: "2px solid #ff550000", outlineOffset: "6px", borderRadius: "4px" },
            ],
            { duration: 1600, easing: "ease-in" },
          )
        if (reveal.fields[0]?.startsWith("menu-")) els[0]?.querySelector<HTMLInputElement>("input:not(:disabled)")?.select()
      })
    })
    return () => cancelAnimationFrame(id)
  }, [panel, reveal])
}
