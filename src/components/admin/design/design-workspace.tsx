"use client"

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  FileDown,
  History,
  LayoutGrid,
  MoreHorizontal,
  PlayCircle,
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
import { useCustomCommunities } from "@/lib/data/use-communities"
import { describe, targetsForField, type PickMessage, type PickTarget } from "@/lib/design-pick"
import { auditTheme } from "@/lib/theme/contrast"
import { resolveCoach, resolveTheme } from "@/lib/theme/resolve"
import { TEMPLATES } from "@/lib/theme/templates"
import type { PageId } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { WidgetLibrary, WidgetSettings } from "./builder-panels"
import { More, RevealContext, Segmented } from "./controls"
import { designTabs, DeviceSwitch, Readability, ResetButton, SettingsPanel, THEME_GROUPS, without } from "./settings-panel"
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
  buttons: "shape",
  headings: "type",
  labels: "type",
  cards: "widgets",
  "brand-surface": "shape",
  background: "page",
}
/** The settings to flash after a click. */
const FLASH: Partial<Record<PickTarget, string[]>> = {
  buttons: ["corners", "buttons"],
  headings: ["fonts", "heading-weight"],
  labels: ["labels"],
  cards: ["widget-style", "widget-set"],
  "brand-surface": ["effects"],
  background: ["background"],
  highlight: ["highlight"],
  logo: ["logo", "name"],
  nav: ["nav-layout"],
}

const StepCtx = createContext<{ go: (s: Step) => void }>({ go: () => {} })

/**
 * ADM-37 to ADM-44: Design, in the same editor as the library's themes: an
 * icon rail of sections (Brand, Look, Type, Shape, Widgets, Page, Menu,
 * Pages), each in small groups that reset on their own, and one search.
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
  const [step, setStep] = useState<Step>(STEP_IDS.includes(asked as Step) ? (asked as Step) : "brand")
  const pages = studentNav(coach, `/c/${slug}`)
  const [pageAsked, setPage] = useState(params.get("page") ?? "home")
  const page = (pages.some((p) => p.id === pageAsked) ? pageAsked : "home") as PageId
  const [tier, setTier] = useState(params.get("tier") ?? "default")
  const [data, setData] = useState<DataMode>("sample")
  const [device, setDevice] = useState<Device>("desktop")
  const [widget, setWidget] = useState<string | null>(null)
  const [incoming, setIncoming] = useState<string | null>(null)
  const [menu, setMenu] = useState<"versions" | "guide" | "template" | null>(null)

  const arrange = useArrange({ coach, theme, editor, page, tier, selected: widget, setSelected: setWidget })
  const panel = useRef<HTMLDivElement>(null)
  const go = (s: Step) => {
    setStep(s)
    setWidget(null)
    panel.current?.scrollTo({ top: 0 })
  }
  const pick = usePreviewPick(step !== "pages", (target) => {
    const to = target.startsWith("menu:") ? "menu" : (STEP_OF[target] ?? "brand")
    setStep(to)
    return target.startsWith("menu:") ? describe(target).fields : (FLASH[target] ?? describe(target).fields)
  })
  useFlash(panel, pick.reveal)


  const fromSetup = params.get("from") === "setup"
  const pageInfo = arrange.pageInfo
  const src = `${step === "pages" ? pageInfo.href : `/c/${slug}`}?preview=draft${step === "pages" && tier !== "default" ? `&tier=${tier}` : ""}${step === "pages" && data !== "sample" ? `&data=${data}` : ""}`
  const canvasClass = cn("hb-canvas", theme.mode === "dark" ? "dark" : "light")
  const checks = auditTheme(theme, { fixes: true })
  const pagesContent = arrange.selWidget ? (
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
  )
  const tabs = designTabs({
    brand: { groups: [{ title: "Your platform", fields: ["logo", "name", "mode"], keys: ["mode"], words: "logo name platform light dark mode" }, ...THEME_GROUPS.colour] },
    look: { content: <LookTab /> },
    menu: { content: <MenuStep /> },
    pages: { blurb: "What's on each page. Drag widgets on the right.", content: pagesContent },
  })

  return (
    <DesignProvider value={{ coach, theme, working, change, commit }}>
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
                  editor.publish()
                  // Publishing changes this community only; say so, since templates are designed here too.
                  if (CAN_SAVE_TEMPLATE)
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
              text="Your brand and a look first; then type, shape, widgets and background to fine-tune; then your menu and pages. Click anything in your platform on the right to jump to what changes it. Nothing changes for students until you publish."
              open={menu === "guide"}
              onOpenChange={(o) => setMenu(o ? "guide" : null)}
            />
          </div>

          <div className="grid min-h-0 grid-cols-1 lg:grid-cols-[400px_minmax(0,1fr)]">
            {/* The one panel: the same editor as the library's themes, with Design's own sections (brand, look, menu, pages) around the theme's. */}
            <aside className="flex min-h-[70svh] flex-col border-b lg:min-h-0 lg:border-r lg:border-b-0">
              <RevealContext.Provider value={pick.reveal}>
                <SettingsPanel
                  tabs={tabs}
                  tab={step}
                  onTab={(id) => go(id as Step)}
                  draft={working.theme}
                  onReset={(keys) => commit({ ...working, theme: without(working.theme, keys) }, "reset")}
                  bodyRef={panel}
                  bodyProps={{ onPointerOver: pick.onPanelHover, onPointerLeave: pick.onPanelLeave }}
                />
              </RevealContext.Provider>
            </aside>

            {/* The platform. On Pages it's the widget grid; elsewhere, click a part to change it. */}
            <section className="grid min-h-[70svh] min-w-0 grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-[color:color-mix(in_oklab,var(--background)_70%,black)] lg:min-h-0">
              <p className="truncate px-4 py-2 text-xs text-muted-foreground">
                {step === "pages"
                  ? arrange.inherits
                    ? `${arrange.tierName} uses the everyone layout. Changing it gives ${arrange.tierName} its own.`
                    : `${pageInfo.label}: drag to reorder, right-click for more`
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

/** The ready-made looks, then the way to a design of their own. */
function LookTab() {
  return (
    <>
      <LookCards />
      <DesignHelp />
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
      <div className="border-b px-4 pt-3 text-[0.6875rem] font-medium tracking-[0.06em] text-muted-foreground uppercase">Add a widget</div>
      {library}
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
