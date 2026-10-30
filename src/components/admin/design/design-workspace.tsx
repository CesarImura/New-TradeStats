"use client"

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ExternalLink,
  FileDown,
  History,
  LayoutGrid,
  Pencil,
  MoreHorizontal,
  PlayCircle,
  Redo2,
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
import type { DataMode } from "@/components/widgets/shared"
import { getDemoCoach } from "@/lib/data/coaches"
import { keepVersion } from "@/lib/prototype-store"
import { useCustomCommunities } from "@/lib/data/use-communities"
import { describe, targetsForField, type PickMessage, type PickTarget } from "@/lib/design-pick"
import { auditTheme } from "@/lib/theme/contrast"
import { pageLayout, resolveCoach, resolveTheme } from "@/lib/theme/resolve"
import { getWidget, heightFor, heightOf } from "@/components/widgets/registry"
import { TEMPLATES } from "@/lib/theme/templates"
import { readingOrder, uid, type PageId, type WidgetInstance } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { WidgetLibrary, WidgetSettings, type AddOptions } from "./builder-panels"
import { More, RevealContext, Segmented } from "./controls"
import { designTabs, DeviceSwitch, Readability, ResetButton, SettingsPanel, THEME_GROUPS, WidgetStyleGroups, without } from "./settings-panel"
import { DesignProvider, useDesign } from "./design-fields"
import { GuideDialog, VersionsSheet, useDraftEditor } from "./editor-shell"
import { ArrangeCanvas, useArrange, type Device } from "./page-builder"
import { PreviewFrame } from "./preview-frame"
import { CAN_SAVE_TEMPLATE, SaveTemplateDialog } from "./save-template"
import { LookCards, MenuStep, Section } from "./design-steps"

/** Design's sections, in the order a coach goes through them; the theme ones are the library's theme editor's. */
type Step = "brand" | "look" | "type" | "shape" | "widgets" | "page" | "menu" | "pages"
const STEP_IDS: Step[] = ["brand", "look", "type", "shape", "widgets", "page", "menu", "pages"]

/** Where a part clicked in the preview is set. */
const STEP_OF: Record<string, Step> = {
  logo: "brand",
  highlight: "brand",
  nav: "menu",
  buttons: "widgets",
  headings: "type",
  labels: "type",
  cards: "widgets",
  "brand-surface": "brand",
  background: "page",
}
/** The settings to flash after a click. */
const FLASH: Partial<Record<PickTarget, string[]>> = {
  buttons: ["corners", "buttons"],
  headings: ["fonts", "heading-weight"],
  labels: ["labels"],
  cards: ["widget-set"],
  "brand-surface": ["primary"],
  background: ["background"],
  highlight: ["highlight"],
  logo: ["logo", "name"],
  nav: ["nav-layout"],
}

/** What the widget panel's style changes reach: the selected widget, or every widget. Place, size and content are always one widget's. */
type Scope = "one" | "all"

/** Sections that now live in Pages, as All widgets (every widget's style, Shape's settings included): old links and clicks open it there. */
const IN_PAGES = (s: string) => s === "widgets" || s === "shape"

const StepCtx = createContext<{ go: (s: Step) => void }>({ go: () => {} })

/**
 * ADM-37 to ADM-44: Design, in the same editor as the library's themes: an
 * icon rail of sections (Brand, Look, Type, Background, Menu, Pages),
 * each in small groups that reset on their own, and one search. Widgets are
 * edited in one place, Pages: select one to move, size, fill and style it,
 * with a switch for whether its style changes reach this widget or all of them.
 * Menu comes before Pages: a module switched off there hides its widgets, so
 * the coach decides that first. One panel on the left, the coach's real platform on the right. Clicking a part
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
  // Widgets' style lives in Pages, as All widgets: old links to Widgets open it there.
  const [step, setStep] = useState<Step>(IN_PAGES(asked) ? "pages" : STEP_IDS.includes(asked as Step) ? (asked as Step) : "brand")
  const [scope, setScope] = useState<Scope>(IN_PAGES(asked) || params.get("scope") === "all" ? "all" : "one")
  const pages = studentNav(coach, `/c/${slug}`)
  const [pageAsked, setPage] = useState(params.get("page") ?? "home")
  const page = (pages.some((p) => p.id === pageAsked) ? pageAsked : "home") as PageId
  const [tier, setTier] = useState(params.get("tier") ?? "default")
  const [data, setData] = useState<DataMode>("sample")
  const [device, setDevice] = useState<Device>("desktop")
  const [widget, setWidget] = useState<string | null>(params.get("w"))
  // The widget being dragged in from the gallery, with what was chosen in its details (if it came from there).
  const [incoming, setIncoming] = useState<{ type: string; opts?: AddOptions } | null>(null)
  const [menu, setMenu] = useState<"versions" | "guide" | "template" | null>(null)

  // Selecting another widget always starts on This widget: changing every widget is a choice made each time.
  const select = (id: string | null) => {
    if (id !== widget) {
      setScope("one")
      // Another widget's panel starts at its top: its name and This widget / All widgets.
      panel.current?.scrollTo({ top: 0 })
    }
    setWidget(id)
  }
  const arrange = useArrange({ coach, theme, editor, page, tier, selected: widget, setSelected: select })
  // Where the coach is (section, page, selected widget) stays in the address, so a reload or a shared link opens the same place.
  useEffect(() => {
    const u = new URL(window.location.href)
    u.searchParams.set("step", step)
    for (const [k, v] of [["page", page !== "home" ? page : null], ["w", widget], ["scope", step === "pages" && scope === "all" ? "all" : null]] as const) {
      if (v) u.searchParams.set(k, v)
      else u.searchParams.delete(k)
    }
    u.searchParams.delete("mode")
    u.searchParams.delete("panel")
    if (u.href !== window.location.href) window.history.replaceState(window.history.state, "", u)
  }, [step, page, widget, scope])
  const panel = useRef<HTMLDivElement>(null)
  // The selected widget stays selected across sections, so going to Widgets and back to Pages keeps it.
  const go = (s: Step) => {
    // Widgets (Type's link to the numbers, search): every widget's style, in Pages.
    if (IN_PAGES(s)) setScope("all")
    setStep(IN_PAGES(s) ? "pages" : s)
    panel.current?.scrollTo({ top: 0 })
  }
  const pick = usePreviewPick(
    step !== "pages",
    (target) => {
      const to = target.startsWith("menu:") ? "menu" : (STEP_OF[target] ?? "brand")
      if (IN_PAGES(to)) setScope("all")
      setStep(IN_PAGES(to) ? "pages" : to)
      return target.startsWith("menu:") ? describe(target).fields : (FLASH[target] ?? describe(target).fields)
    },
    // A widget clicked in the preview: Pages, on that page (everyone's layout, which the preview shows), with it selected.
    ({ id, path }) => {
      const p = pages.find((x) => x.href === path)
      setStep("pages")
      if (p) setPage(p.id)
      setTier("default")
      setWidget(id)
      setScope("one")
      panel.current?.scrollTo({ top: 0 })
    },
  )
  useFlash(panel, pick.reveal)


  const fromSetup = params.get("from") === "setup"
  const pageInfo = arrange.pageInfo
  // The style sections preview the Everyone layout, so a widget clicked there is the one "Edit only this widget" opens in Pages.
  const src = `${step === "pages" ? pageInfo.href : `/c/${slug}`}?preview=draft${step === "pages" ? "" : "&layout=everyone"}${step === "pages" && tier !== "default" ? `&tier=${tier}` : ""}${step === "pages" && data !== "sample" ? `&data=${data}` : ""}`
  const canvasClass = cn("hb-canvas", theme.mode === "dark" ? "dark" : "light")
  const checks = auditTheme(theme, { fixes: true })
  const tierLabel = tier === "default" ? "Everyone" : (arrange.tierName ?? tier)
  const sel = arrange.selWidget
  const resetTheme = (keys: (keyof typeof working.theme)[]) => commit({ ...working, theme: without(working.theme, keys) }, "reset")
  const head = sel && <WidgetHead w={sel} where={`${pageInfo.label} · ${tierLabel}`} scope={scope} onScope={setScope} />
  const back = (
    <div className="border-b px-4 py-2">
      <Button variant="ghost" size="sm" onClick={() => (sel ? select(null) : setScope("one"))}>
        <ArrowLeft /> {pageInfo.label}
      </Button>
    </div>
  )
  const pagesContent =
    sel && scope === "one" ? (
      <div>
        {back}
        <WidgetSettings
          key={sel.id}
          w={sel}
          head={head}
          pinned={arrange.pinned(sel.id)}
          expanded={arrange.expanded.includes(sel.id)}
          canvasClass={canvasClass}
          onChange={(patch, key) => arrange.updateItem(sel.id, patch, key)}
          onDuplicate={() => arrange.duplicateWidget(sel.id)}
          onRemove={() => arrange.removeWidget(sel.id)}
          onAllWidgets={() => setScope("all")}
          onDrag={(o) => setIncoming(o ? { type: sel.type, opts: o } : null)}
          // The widget as the page starts (the template's page, before any edit): what its settings are compared with and Reset goes back to.
          start={pageLayout({ ...coach, pages: undefined }, page, theme.template, undefined, heightOf).items.find((x) => x.id === sel.id)}
        />
      </div>
    ) : scope === "all" ? (
      // Every widget's style: the same groups as the library's and the wizard's Widgets section.
      <div>
        {back}
        <div className="grid gap-3 border-b px-5 py-5">
          {head ?? <h3 className="text-sm font-semibold">All widgets</h3>}
          {!head && <p className="text-xs text-muted-foreground">Style changes apply to every widget, on every page. Position, size and content are always set per widget: select one on the page.</p>}
        </div>
        <WidgetStyleGroups draft={working.theme} onReset={resetTheme} />
      </div>
    ) : (
      <PagesStep
        tier={tier}
        data={data}
        onData={setData}
        arrange={arrange}
        onAllWidgets={() => setScope("all")}
        gallery={
          <WidgetLibrary
            key={page}
            page={page}
            pageLabel={pageInfo.label}
            coach={coach}
            canvasClass={canvasClass}
            onPage={readingOrder(arrange.layout.items)}
            onAdd={(type, o) => {
              // Added with what was chosen in its details, at the bottom, and selected: the rest is in its panel.
              const def = getWidget(type)!
              const bottom = arrange.layout.items.reduce((m, x) => Math.max(m, x.y + x.h), 0)
              const w: WidgetInstance = { id: uid(), type, x: 0, y: bottom, w: o.w, h: heightFor(def, o.variant, o.detail), variant: o.variant, detail: o.detail === "standard" ? undefined : o.detail, props: Object.keys(o.props).length ? o.props : undefined }
              arrange.save({ ...arrange.layout, items: [...arrange.layout.items, w] }, `add-${w.id}`)
              select(w.id)
              toast(`${def.name} added at the bottom of ${pageInfo.label}.`, { description: "Drag it where you want it. ⌘Z undoes it." })
            }}
            onSelect={select}
            onDragType={(type, opts) => setIncoming(type ? { type, opts } : null)}
          />
        }
      />
    )
  const tabs = designTabs({
    brand: { groups: [{ title: "Your platform", fields: ["logo", "name", "mode"], keys: ["mode"], words: "logo name platform light dark mode" }, ...THEME_GROUPS.colour] },
    look: { content: <LookTab /> },
    menu: { content: <MenuStep /> },
    pages: { blurb: "Select a widget to move, size, fill and style it. Drag widgets on the right.", content: pagesContent },
    // Every widget's style is in Pages (All widgets); off the rail, still found by search.
  }).map((t) => (t.id === "widgets" ? { ...t, hidden: true, label: "All widgets" } : t))

  return (
    <DesignProvider value={{ coach, theme, working, change, commit, keepVersion: (label) => keepVersion(slug, label, working) }}>
      <StepCtx.Provider value={{ go }}>
        {/* A screen of its own, over the admin: one menu (the editor's sections) instead of two side by side. */}
        <div role="dialog" aria-modal aria-label="Design" className="fixed inset-0 z-50 grid grid-rows-[auto_minmax(0,1fr)] overflow-y-auto bg-background lg:overflow-hidden">
          {/* Top bar: the way back, status, and the three things you do: undo, preview, publish. */}
          <div className="flex items-center gap-2 border-b px-4 py-2">
            {fromSetup ? (
              <Button size="sm" nativeButton={false} render={<Link href="/setup" />}>
                <ArrowLeft /> Back to setup
              </Button>
            ) : (
              <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/admin/${slug}`} />} title="Back to the admin">
                <ArrowLeft /> Admin
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
              <div className="mr-1 flex items-center gap-2">
                <Readability fails={checks.filter((c) => !c.pass)} total={checks.length} />
                <DeviceSwitch value={device} onChange={setDevice} />
              </div>
              <Button variant="ghost" size="icon-sm" onClick={editor.undo} disabled={!editor.canUndo} aria-label="Undo" title="Undo (⌘Z)">
                <Undo2 />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={editor.redo} disabled={!editor.canRedo} aria-label="Redo" title="Redo (⇧⌘Z)">
                <Redo2 />
              </Button>
              <ResetButton
                title="Back to the original design?"
                text={`Every design change goes back to how ${coach.name} started: colours, type, shape, widgets and background. Your name, logo and menu stay. You can undo it (⌘Z).`}
                option="Also put every page's layout back"
                onReset={(pagesToo) => {
                  const content = { ...working.content }
                  if (pagesToo) delete content.pages
                  commit({ theme: {}, content }, "reset-original")
                  toast("Back to the original design", { description: pagesToo ? "Pages too." : "Pages kept.", action: { label: "Undo", onClick: editor.undo } })
                }}
              />
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
                  {CAN_SAVE_TEMPLATE && (
                    <DropdownMenuItem onClick={() => setMenu("template")}>
                      <FileDown /> Save as template…
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" disabled={!editor.dirty} onClick={editor.discard}>
                    <Trash2 /> Discard changes
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm" nativeButton={false} render={<a href={src} target="_blank" rel="noreferrer" />} title="Open your platform as students see it, with your changes">
                <ExternalLink /> Preview
              </Button>
              {CAN_SAVE_TEMPLATE && (
                <Button variant="outline" size="sm" onClick={() => setMenu("template")} title="Prototype: write this design into one of the starting templates">
                  <FileDown /> Save as template
                </Button>
              )}
              <Button
                size="sm"
                disabled={!editor.dirty}
                onClick={() => {
                  // Publishing changes this community only; say so, since templates are designed here too.
                  if (editor.publish() && CAN_SAVE_TEMPLATE)
                    toast(`Published to ${coach.name} only`, {
                      description: `The ${TEMPLATES[theme.template].name} template didn't change.`,
                      action: { label: "Save as template", onClick: () => setMenu("template") },
                    })
                }}
              >
                Publish
              </Button>
            </div>
            <VersionsSheet slug={slug} open={menu === "versions"} onOpenChange={(o) => setMenu(o ? "versions" : null)} />
            {/* Mounted only while open, so it starts from the design's current template each time. */}
            {menu === "template" && <SaveTemplateDialog coach={coach} theme={theme} open onOpenChange={(o) => setMenu(o ? "template" : null)} />}
            <GuideDialog
              title="Designing your platform"
              text="Your brand and a look first; then type and background to fine-tune; then your menu and pages. In Pages, select a widget to move, size, fill and style it, for that widget or all of them. Click anything in your platform on the right to jump to what changes it. Nothing changes for students until you publish."
              open={menu === "guide"}
              onOpenChange={(o) => setMenu(o ? "guide" : null)}
            />
          </div>

          <div className="grid min-h-0 grid-cols-1 lg:grid-cols-[440px_minmax(0,1fr)]">
            {/* The one panel: the same editor as the library's themes, with Design's own sections (brand, look, menu, pages) around the theme's. */}
            <aside className="flex min-h-[70svh] flex-col border-b lg:min-h-0 lg:border-r lg:border-b-0">
              <RevealContext.Provider value={pick.reveal}>
                <SettingsPanel
                  tabs={tabs}
                  tab={step}
                  onTab={(id) => go(id as Step)}
                  draft={working.theme}
                  onReset={resetTheme}
                  bodyRef={panel}
                  bodyProps={{ onPointerOver: pick.onPanelHover, onPointerLeave: pick.onPanelLeave }}
                />
              </RevealContext.Provider>
            </aside>

            {/* The platform. On Pages it's the widget grid; elsewhere, click a part to change it. */}
            <section className="grid min-h-[70svh] min-w-0 grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-[color:color-mix(in_oklab,var(--background)_70%,black)] lg:min-h-0">
              {/* The page being edited, always in view above it: on Pages a picker to switch, elsewhere how to use the preview. */}
              {step === "pages" ? (
                <div className="min-w-0 border-b">
                  <div className="flex min-w-0 items-end gap-3 px-3">
                    {/* Every page as a tab: the one being edited is always named, large, above it. */}
                    <nav aria-label="Pages" className="flex min-w-0 flex-1 items-end overflow-x-auto [scrollbar-width:none]">
                      {pages.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          aria-current={p.id === page ? "page" : undefined}
                          onClick={() => {
                            setPage(p.id)
                            select(null)
                          }}
                          className={cn(
                            "relative shrink-0 px-2.5 pt-3 pb-2.5 text-[0.9375rem] whitespace-nowrap transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            p.id === page ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {p.label}
                          {p.id === page && <span aria-hidden className="absolute inset-x-2.5 bottom-0 h-0.5 rounded-full bg-foreground" />}
                        </button>
                      ))}
                    </nav>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="mb-2 shrink-0 gap-1.5" aria-label={`Layout for ${tierLabel}. Change tier`} />}>
                        <span className="text-muted-foreground">Layout for</span>
                        <span className="font-medium">{tierLabel}</span>
                        {tier !== "default" && <span className="text-muted-foreground">· {arrange.inherits ? "uses Everyone" : "own layout"}</span>}
                        <ChevronDown className="size-3.5 text-muted-foreground" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-60">
                        {[{ id: "default", name: "Everyone" }, ...coach.tiers].map((t) => (
                          <DropdownMenuItem
                            key={t.id}
                            onClick={() => {
                              setTier(t.id)
                              select(null)
                            }}
                          >
                            <span className="flex-1">
                              {t.name}
                              {t.id !== "default" && (coach.pages?.[page] ?? {})[t.id] ? <span className="text-muted-foreground"> · own layout</span> : null}
                            </span>
                            {t.id === tier && <Check className="size-3.5" />}
                          </DropdownMenuItem>
                        ))}
                        {tier !== "default" && !arrange.inherits && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={arrange.useDefault}>Use the Everyone layout for {tierLabel}</DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {(scope === "all" || arrange.inherits) && (
                    <p className="truncate px-4 pb-2 text-xs text-muted-foreground">
                      {scope === "all"
                        ? "All widgets: style changes apply to every widget, on every page. Position, size and content stay per widget."
                        : `${tierLabel} uses the Everyone layout. Changing it gives ${tierLabel} its own.`}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex h-8 min-w-0 items-center gap-2 px-4">
                  <p className="min-w-0 truncate text-xs text-muted-foreground">Preview: Everyone · Click any part of your platform to change it. Click a widget to edit it in Pages.</p>
                </div>
              )}
              <div className="min-h-0 min-w-0 overflow-hidden">
                {step === "pages" ? (
                  <ArrangeCanvas arrange={arrange} coach={coach} theme={theme} device={device} data={data} incoming={incoming} onDropped={() => setIncoming(null)} allWidgets={scope === "all"} />
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

/** The ready-made looks, then the way to a design of their own. */
function LookTab() {
  return (
    <>
      <LookCards />
      <DesignHelp />
    </>
  )
}

/** The selected widget's name and where it is, and the switch for what its style changes reach: this widget, or every widget. */
function WidgetHead({ w, where, scope, onScope }: { w: WidgetInstance; where: string; scope: Scope; onScope: (s: Scope) => void }) {
  const def = getWidget(w.type)
  return (
    <div className="grid gap-3">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted">{def && <def.icon className="size-4" />}</span>
        <div className="grid min-w-0">
          <span className="text-xs text-muted-foreground">{where}</span>
          <span className="text-sm font-semibold">{def?.name ?? w.type}</span>
        </div>
      </div>
      <Segmented
        label="Changes apply to"
        value={scope}
        onChange={onScope}
        options={[
          { value: "one", label: "This widget" },
          { value: "all", label: "All widgets" },
        ]}
      />
      <p className="text-xs text-muted-foreground">
        {scope === "one" ? "Everything here changes this widget only." : "Style changes apply to every widget, on every page. Position, size and content are always set per widget."}
      </p>
    </div>
  )
}

/**
 * Pages with nothing selected: the page being edited, the way to every widget's style, and the widget gallery
 * (what is on the page, and what can be added, each with its options a click away).
 */
function PagesStep({
  tier,
  data,
  onData,
  arrange,
  onAllWidgets,
  gallery,
}: {
  tier: string
  data: DataMode
  onData: (d: DataMode) => void
  arrange: ReturnType<typeof useArrange>
  onAllWidgets: () => void
  gallery: React.ReactNode
}) {
  const { coach } = useDesign()
  const tierName = tier === "default" ? "Everyone" : (coach.tiers.find((t) => t.id === tier)?.name ?? tier)
  return (
    <>
      {/* The page and its layout are named above the page; here, the one way to the style every widget shares. */}
      <div className="border-b px-5 py-4">
        <Button className="w-full" onClick={onAllWidgets} title={`The style every widget shares, on every page. Layout for ${tierName}${tier !== "default" ? (arrange.inherits ? " uses Everyone" : ": own layout") : ""}.`}>
          <Pencil /> Edit all widgets
        </Button>
      </div>
      {gallery}
      <Section>
        <More label="Preview data">
          <div className="grid gap-1.5">
            <span className="text-xs font-medium text-[color:color-mix(in_oklab,var(--foreground)_60%,transparent)]">Show it with</span>
            <Segmented
              label="Preview data"
              value={data}
              onChange={onData}
              options={[
                { value: "sample", label: <span title="Sample data">Sample</span> },
                { value: "empty", label: <span title="A new student">New</span> },
                { value: "inactive", label: <span title="An inactive student">Inactive</span> },
                { value: "finished", label: <span title="A student who finished a course">Finished</span> },
              ]}
            />
            <p className="text-xs text-muted-foreground">
              {{ sample: "Sample data", empty: "A new student: their first week", inactive: "An inactive student", finished: "A student who finished a course" }[data]}
            </p>
          </div>
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
        <Button variant="ghost" size="sm" onClick={() => go("type")}>
          Or fine-tune it <ArrowRight />
        </Button>
      </div>
    </div>
  )
}

/* ---------- Click-to-edit ---------- */

/**
 * A click in the preview tells the workspace which part was clicked; `onPick`
 * opens the step and returns the settings to show. Hovering a setting outlines
 * what it changes in the preview.
 */
function usePreviewPick(on: boolean, onPick: (target: PickTarget) => string[], onEditWidget: (m: { id: string; path: string }) => void) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [reveal, setReveal] = useState<{ fields: string[]; n: number }>({ fields: [], n: 0 })
  const shown = useRef("")
  const pickRef = useRef(onPick)
  const editRef = useRef(onEditWidget)
  useEffect(() => {
    pickRef.current = onPick
    editRef.current = onEditWidget
  })

  useEffect(() => {
    const send = (m: PickMessage) => frame.current?.contentWindow?.postMessage(m, window.location.origin)
    send({ type: "design-pick-mode", on })
    const onMessage = (e: MessageEvent<PickMessage>) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return
      const m = e.data
      if (m?.type === "design-pick-ready") send({ type: "design-pick-mode", on })
      if (m?.type === "design-edit-widget") editRef.current({ id: m.id, path: m.path })
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
