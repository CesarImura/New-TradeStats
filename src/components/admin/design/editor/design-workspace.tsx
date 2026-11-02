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
  Palette,
  PlayCircle,
  Redo2,
  RotateCcw,
  Trash2,
  Undo2,
  Users,
  Wand2,
} from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { studentNav } from "@/components/coach/nav"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { DataMode } from "@/components/widgets/parts/shared"
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
import { WidgetLibrary, type AddOptions } from "../panels/builder-panels"
import { InspectorTop, WidgetInspector } from "../panels/widget-inspector"
import { ThumbStyles } from "../thumbs/widget-thumb"
import { RevealContext, Row, Segmented } from "../fields/controls"
import { designTabs, DeviceSwitch, Readability, SettingsPanel, THEME_GROUPS, without } from "../panels/settings-panel"
import { AllWidgetsInspector } from "../panels/all-widgets-inspector"
import { DesignProvider } from "../fields/design-fields"
import { GuideDialog, VersionsSheet, useDraftEditor } from "./editor-shell"
import { ArrangeCanvas, useArrange, type Device } from "./page-builder"
import { CAN_SAVE_TEMPLATE, SaveTemplateDialog } from "./save-template"
import { LookCards, MenuStep } from "./design-steps"
import { JOIN_SCREENS, type JoinScreenId } from "@/lib/data/join"
import { studentCourses, useCatalog } from "@/lib/data/learning"
import { CourseInspector, CourseSections } from "../panels/course-panels"
import { JoinInspector, JoinScreens } from "../panels/join-panels"
import { PreviewFrame } from "./preview-frame"

/** Design's sections, in the order a coach goes through them; the theme ones are the library's theme editor's. */
type Step = "brand" | "look" | "type" | "shape" | "widgets" | "page" | "menu" | "pages" | "course" | "join"
const STEP_IDS: Step[] = ["brand", "look", "type", "shape", "widgets", "page", "menu", "pages", "course", "join"]

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
  // Join: which of the screens people pass through is on the canvas.
  const [joinAsked, setJoinScreen] = useState(params.get("screen") ?? "login")
  const joinScreen = (JOIN_SCREENS.some((x) => x.id === joinAsked) ? joinAsked : "login") as JoinScreenId
  const [device, setDevice] = useState<Device>("desktop")
  const [widget, setWidget] = useState<string | null>(params.get("w"))
  // The widget being dragged in from the gallery, with what was chosen in its details (if it came from there).
  const [incoming, setIncoming] = useState<{ type: string; opts?: AddOptions } | null>(null)
  const [menu, setMenu] = useState<"versions" | "guide" | "template" | "reset" | null>(null)

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
    for (const [k, v] of [["page", page !== "home" ? page : null], ["tier", tier !== "default" ? tier : null], ["w", widget], ["scope", step === "pages" && scope === "all" ? "all" : null], ["screen", step === "join" && joinScreen !== "login" ? joinScreen : null]] as const) {
      if (v) u.searchParams.set(k, v)
      else u.searchParams.delete(k)
    }
    u.searchParams.delete("mode")
    u.searchParams.delete("panel")
    if (u.href !== window.location.href) window.history.replaceState(window.history.state, "", u)
  }, [step, page, tier, widget, scope, joinScreen])
  const panel = useRef<HTMLDivElement>(null)
  // Below 1280px the left sidebar starts as icons only (the page needs the room); wider, it is always open.
  const [narrow, setNarrow] = useState(false)
  const [leftOpen, setLeftOpen] = useState(true)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1279px)")
    const apply = () => {
      setNarrow(mq.matches)
      setLeftOpen(!mq.matches)
    }
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [])
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
  // Preview opens what the canvas shows, in every section: this page, for this tier, with this data.
  const joinInfo = JOIN_SCREENS.find((x) => x.id === joinScreen)!
  // The course the Course step shows: the first one students can open.
  const catalog = useCatalog(coach)
  const previewCourse = studentCourses(catalog).find((c) => c.modules.length > 0) ?? catalog.courses[0]
  const src = step === "join" ? `/site/${slug}/${joinInfo.route}?preview=draft` : step === "course" ? `/c/${slug}/courses/${previewCourse?.id ?? ""}?preview=draft` : `${pageInfo.href}?preview=draft${tier !== "default" ? `&tier=${tier}` : ""}${data !== "sample" ? `&data=${data}` : ""}`
  const checks = auditTheme(theme)
  const tierLabel = tier === "default" ? "Everyone" : (arrange.tierName ?? tier)
  const sel = arrange.selWidget
  const resetTheme = (keys: (keyof typeof working.theme)[]) => commit({ ...working, theme: without(working.theme, keys) }, "reset")
  const own = arrange.layout.items.filter((x) => x.style && Object.values(x.style).some((v) => v !== undefined)).length
  const count = { total: arrange.layout.items.length, own }
  const selDef = sel && getWidget(sel.type)
  // The right panel (the inspector of Webflow, Framer and Figma): the selected widget, every widget's style, or the page.
  const inspector =
    step === "join" ? (
      <JoinInspector screen={joinScreen} />
    ) : step === "course" ? (
      <CourseInspector />
    ) : scope === "all" ? (
      // A place of its own (not a switch on the widget's panel): the style every widget shares, with the way back.
      <AllWidgetsInspector draft={working.theme} onReset={resetTheme} onBack={() => setScope("one")} back={selDef ? selDef.name : pageInfo.label} own={own} />
    ) : sel ? (
      <WidgetInspector
        key={sel.id}
        w={sel}
        pinned={arrange.pinned(sel.id)}
       
        count={count}
        onScope={setScope}
        onChange={(patch, key) => arrange.updateItem(sel.id, patch, key)}
        onDuplicate={() => arrange.duplicateWidget(sel.id)}
        onRemove={() => arrange.removeWidget(sel.id)}
        onMove={(to) => arrange.moveTo(sel.id, to)}
        phone={{ index: arrange.phoneList.indexOf(sel.id), total: arrange.phoneList.length, custom: !!arrange.layout.phoneOrder, onMove: (step) => arrange.movePhone(sel.id, step), onReset: arrange.resetPhoneOrder }}
        onClose={() => select(null)}
        onDrag={(o) => setIncoming(o ? { type: sel.type, opts: o } : null)}
        // The widget as the page starts (the template's page, before any edit): what its settings are compared with and Reset goes back to.
        start={pageLayout({ ...coach, pages: undefined }, page, theme.template, undefined, heightOf).items.find((x) => x.id === sel.id)}
      />
    ) : (
      <PagePanel name={pageInfo.label} data={data} onData={setData} onAllWidgets={() => setScope("all")} />
    )
  const pagesContent = (
    <WidgetLibrary
      key={page}
      page={page}
      pageLabel={pageInfo.label}
      coach={coach}
     
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
  )
  const tabs = designTabs({
    brand: { groups: [{ title: "Your platform", fields: ["logo", "name", "mode"], keys: ["mode"], words: "logo name platform light dark mode" }, ...THEME_GROUPS.colour] },
    look: { content: <LookTab /> },
    menu: { content: <MenuStep /> },
    course: { content: <CourseSections /> },
    join: { content: <JoinScreens screen={joinScreen} onScreen={setJoinScreen} /> },
    // No line under the title: the gallery speaks for itself.
    pages: { content: pagesContent, blurb: undefined },
    // Every widget's style is in Pages (All widgets); off the rail, still found by search.
  }).map((t) => (t.id === "widgets" ? { ...t, hidden: true, label: "All widgets" } : t))

  return (
    <DesignProvider value={{ coach, theme, working, change, commit, keepVersion: (label) => keepVersion(slug, label, working), undo: editor.undo }}>
      <StepCtx.Provider value={{ go }}>
        <ThumbStyles />
        {/* A screen of its own, over the admin: one menu (the editor's sections) instead of two side by side. */}
        {/* The editor's selection colour is white here (--ts-interactive), not the admin's orange: orange is a brand colour many
            coaches use, and a selection must never look like content. */}
        <div role="dialog" aria-modal aria-label="Design" data-design-ws className="fixed inset-0 z-50 grid grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-background [--background:#0b0b0c] [--border:rgb(255_255_255/0.08)] [--ring:rgb(244_244_245/0.6)] [--ts-interactive:#f4f4f5] lg:overflow-hidden">
          {/* Top bar, three groups (Framer, Webflow): where you are on the left; the page, its layout and the device in the middle;
              undo, more, preview and publish on the right. */}
          <div className="grid h-14 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-white/[0.06] px-4 max-lg:grid-cols-[auto_minmax(0,1fr)_auto] max-lg:gap-2 max-sm:h-auto max-sm:grid-cols-[auto_minmax(0,1fr)] max-sm:py-2 [&_[data-slot=button]]:h-9 [&_[data-slot=button][data-size^=icon]]:w-9 [&_[data-slot=button]]:text-[0.8125rem] [&_[data-slot=button]_svg]:size-4">
            <div className="flex min-w-0 items-center gap-2">
            {fromSetup ? (
              <Button size="sm" nativeButton={false} render={<Link href="/setup" />}>
                <ArrowLeft /> Back to setup
              </Button>
            ) : (
              <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/admin/${slug}`} />} title="Back to the admin">
                <ArrowLeft /> Admin
              </Button>
            )}
            <span className="px-1 text-[0.8125rem] font-semibold max-lg:hidden">Design</span>
            </div>
            {/* The same in every section: the canvas shows this page in all of them, so its name is always in sight. */}
            <div className="flex min-w-0 items-center justify-center gap-2 max-sm:col-span-2 max-sm:row-start-2">
              {step === "course" ? (
                <span className="truncate px-2.5 text-[0.9375rem] font-semibold" title="The page inside a course, the same for every course">
                  Course page{previewCourse ? ` · ${previewCourse.title}` : ""}
                </span>
              ) : step === "join" ? (
                // Join's screens aren't pages of the platform: they are chosen on the left, so here only a name, no list to open.
                <span className="truncate px-2.5 text-[0.9375rem] font-semibold" title="Chosen on the left">
                  Join · {joinInfo.label}
                </span>
              ) : (
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" className="min-w-0 gap-1.5 px-2.5 text-[0.9375rem] font-semibold" aria-label={`Page: ${pageInfo.label}. Change page`} title="The page you are editing" />}>
                  <span className="truncate">{pageInfo.label}</span>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56">
                  {pages.map((p) => (
                    <DropdownMenuItem
                      key={p.id}
                      onClick={() => {
                        setPage(p.id)
                        select(null)
                      }}
                    >
                      <span className="flex-1">{p.label}</span>
                      {p.id === page && <Check className="size-3.5" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              )}
              <span aria-hidden className="h-5 w-px bg-white/10" />
              <DeviceSwitch value={device} onChange={setDevice} />
            </div>
            <div className="flex flex-wrap items-center justify-end gap-1 max-sm:flex-nowrap max-sm:gap-0">
              {/* Next to Publish, which it is about: whether students already see these changes. */}
              <span className={cn("mr-1 inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs whitespace-nowrap", editor.dirty ? "bg-white/[0.06] text-foreground" : "text-muted-foreground")} title={editor.dirty ? "Students still see the last published design" : "Students see this design"}>
                <span className={cn("size-1.5 rounded-full", editor.dirty ? "bg-amber-500" : "bg-emerald-500")} />
                <span className="max-lg:sr-only">{editor.dirty ? "Not published yet" : "Live"}</span>
              </span>
              {/* Only when something is hard to read: a check that passes needs no room in the bar. */}
              {checks.some((c) => !c.pass) && <Readability fails={checks.filter((c) => !c.pass)} total={checks.length} />}
              <Button variant="ghost" size="icon-sm" onClick={editor.undo} disabled={!editor.canUndo} aria-label="Undo" title="Undo (⌘Z)">
                <Undo2 />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={editor.redo} disabled={!editor.canRedo} aria-label="Redo" title="Redo (⇧⌘Z)">
                <Redo2 />
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
                  {CAN_SAVE_TEMPLATE && (
                    <DropdownMenuItem onClick={() => setMenu("template")}>
                      <FileDown /> Save as template…
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setMenu("reset")}>
                    <RotateCcw /> Reset to the original design…
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" disabled={!editor.dirty} onClick={editor.discard}>
                    <Trash2 /> Discard changes
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm" nativeButton={false} render={<a href={src} target="_blank" rel="noreferrer" />} title="Open your platform as students see it, with your changes">
                <ExternalLink /> <span className="max-sm:sr-only">Preview</span>
              </Button>
              <Button
                size="sm"
                disabled={!editor.dirty}
                onClick={() => {
                  // Publishing changes this community only; in the prototype say so in the same toast, since templates are designed here too.
                  editor.publish(CAN_SAVE_TEMPLATE ? { description: `${coach.name} only. The ${TEMPLATES[theme.template].name} template didn't change.`, action: { label: "Save as template", onClick: () => setMenu("template") } } : undefined)
                }}
              >
                Publish
              </Button>
            </div>
            <ResetDialog
              open={menu === "reset"}
              onOpenChange={(o) => setMenu(o ? "reset" : null)}
              name={coach.name}
              onReset={(pagesToo) => {
                const content = { ...working.content }
                if (pagesToo) delete content.pages
                commit({ theme: {}, content }, "reset-original")
                toast("Back to the original design", { description: pagesToo ? "Pages too." : "Pages kept.", action: { label: "Undo", onClick: editor.undo } })
              }}
            />
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

          {/* Below 1280px the left sidebar keeps only its icons, so the page has room; an icon opens it again. */}
          <div className={cn("grid min-h-0", leftOpen ? "grid-cols-[344px_minmax(0,1fr)]" : "grid-cols-[64px_minmax(0,1fr)]")}>
            {/* The one panel: the same editor as the library's themes, with Design's own sections (brand, look, menu, pages) around the theme's. */}
            <aside className="flex min-h-0 flex-col">
              <RevealContext.Provider value={pick.reveal}>
                <SettingsPanel
                  tabs={tabs}
                  tab={step}
                  onTab={(id) => go(id as Step)}
                  draft={working.theme}
                  onReset={resetTheme}
                  bodyRef={panel}
                  bodyProps={{ onPointerOver: pick.onPanelHover, onPointerLeave: pick.onPanelLeave }}
                  // Brand, Look, Type and Background are one place, Theme, with its parts as pills.
                  merge={{ id: "theme", label: "Theme", icon: <Palette />, of: ["brand", "look", "type", "page"] }}
                  collapsed={!leftOpen}
                  // On a narrow screen the open section's icon folds the panel away again; any other icon opens it.
                  onRail={(_, wasOpen) => setLeftOpen(narrow && wasOpen && leftOpen ? false : true)}
                />
              </RevealContext.Provider>
            </aside>

            {/* The platform. On Pages it's the widget grid; elsewhere, click a part to change it. */}
            <section className={cn("relative grid min-h-0 min-w-0 grid-cols-[minmax(0,1fr)_336px] grid-rows-[minmax(0,1fr)] overflow-hidden bg-[#2b2b2e]")}>
              <div className="relative min-h-0 min-w-0 overflow-hidden">
                {step !== "join" && step !== "course" && (<>
                {/* In the canvas's corner: whose layout of this page is on the canvas. Each tier can have its own; until then it uses Everyone's. */}
                <div className="absolute top-3 left-3 z-30 flex h-10 items-center rounded-xl border border-white/10 bg-[#141416] p-1 text-white shadow-[0_12px_32px_-12px_rgb(0_0_0/0.8)]">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <button
                          type="button"
                          aria-label={`Layout for ${tierLabel}. Change tier`}
                          title={arrange.inherits ? `${tierLabel} uses the Everyone layout. Changing the page gives ${tierLabel} its own.` : "Each tier can have its own layout of this page"}
                          className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs text-white/70 outline-none transition-[background-color,color,scale] duration-150 ease-out hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 active:scale-[0.96] data-[popup-open]:bg-white/10"
                        />
                      }
                    >
                      <Users className="size-3.5" />
                      <span>Layout for</span>
                      <span className="font-medium text-white">{tierLabel}</span>
                      {tier !== "default" && <span className="text-white/50">· {arrange.inherits ? "uses Everyone" : "own layout"}</span>}
                      <ChevronDown className="size-3.5 text-white/50" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64">
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
                </>)}
                {step === "join" || step === "course" ? <PreviewFrame src={src} device={device} desktopWidth={1100} /> : (
                <ArrangeCanvas arrange={arrange} coach={coach} theme={theme} device={device} data={data} incoming={incoming} onDropped={() => setIncoming(null)} allWidgets={scope === "all"} shell onPick={pick.pick} />
                )}
              </div>
              {/* The inspector: always a column of its own, as in Framer; the page between the sidebars gives way. */}
              {/* Always there, in every section: the selected widget, every widget's style, or the page. */}
              {(
                <aside
                  aria-label="Inspector"
                  className="col-start-2 row-start-1 min-h-0 overflow-y-auto bg-background [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  <RevealContext.Provider value={pick.reveal}>{inspector}</RevealContext.Provider>
                </aside>
              )}
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

/** The right panel with no widget selected: the page, the way to every widget's style, and how the page is shown. */
function PagePanel({
  name,
  data,
  onData,
  onAllWidgets,
}: {
  name: string
  data: DataMode
  onData: (d: DataMode) => void
  onAllWidgets: () => void
}) {
  return (
    <div>
      <InspectorTop>
        <span className="truncate text-[0.9375rem] font-semibold">{name}</span>
      </InspectorTop>
      <div className="grid gap-3 px-5 pb-4">
        <p className="text-xs leading-4 text-muted-foreground">Select a widget to edit it.</p>
        <Button variant="outline" size="sm" className="w-full" onClick={onAllWidgets}>
          <Pencil /> Edit all widgets
        </Button>
      </div>
      <div className="grid gap-2 px-5 py-4">
        <Row label="Preview as" hint={{ sample: "Sample data", empty: "A new student: their first week", inactive: "An inactive student", finished: "A student who finished a course" }[data]} stack>
          <Segmented
            label="Preview data"
            value={data}
            onChange={onData}
            options={[
              { value: "sample", label: "Sample", hint: "Sample data" },
              { value: "empty", label: "New", hint: "A new student: their first week" },
              { value: "inactive", label: "Inactive", hint: "An inactive student" },
              { value: "finished", label: "Finished", hint: "A student who finished a course" },
            ]}
          />
        </Row>
      </div>
    </div>
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
    /** A click on the canvas (the one screen) does what a click in the preview frame did. */
    pick: (target: PickTarget) => setReveal((r) => ({ fields: pickRef.current(target), n: r.n + 1 })),
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
              { outline: "2px solid rgb(255 255 255 / 0.9)", outlineOffset: "6px", borderRadius: "4px" },
              { outline: "2px solid rgb(255 255 255 / 0)", outlineOffset: "6px", borderRadius: "4px" },
            ],
            { duration: 1600, easing: "ease-in" },
          )
        if (reveal.fields[0]?.startsWith("menu-")) els[0]?.querySelector<HTMLInputElement>("input:not(:disabled)")?.select()
      })
    })
    return () => cancelAnimationFrame(id)
  }, [panel, reveal])
}

/** Back to the original design, from the ⋯ menu: asks first, says what goes back, and can put the pages back too. Undoable. */
function ResetDialog({ open, onOpenChange, name, onReset }: { open: boolean; onOpenChange: (o: boolean) => void; name: string; onReset: (pagesToo: boolean) => void }) {
  const [pagesToo, setPagesToo] = useState(false)
  return (
    <Dialog open={open} onOpenChange={(o) => (onOpenChange(o), setPagesToo(false))}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Back to the original design?</DialogTitle>
          <DialogDescription>Colours, type, shape, widgets and background go back to how {name} started. Your name, logo and menu stay. You can undo it (⌘Z).</DialogDescription>
        </DialogHeader>
        <label className="flex cursor-pointer items-center gap-2 text-[0.8125rem]">
          <Checkbox checked={pagesToo} onCheckedChange={(v) => setPagesToo(!!v)} />
          Also put every page&apos;s layout back
        </label>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onReset(pagesToo)
              onOpenChange(false)
            }}
          >
            Reset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
