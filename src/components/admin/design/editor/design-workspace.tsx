"use client"

import { createContext, Fragment, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Check,
  ExternalLink,
  Eye,
  FileDown,
  History,
  LayoutGrid,
  Palette,
  PlayCircle,
  RotateCcw,
  Trash2,
} from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { studentNav } from "@/components/coach/nav"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AdminButton, AdminFilterButton, AdminMenu, AdminMenuContent, AdminMenuGroup, AdminMenuItem, AdminMenuLabel, AdminMenuSeparator, AdminMenuTrigger, AdminModal, Callout } from "@/components/admin/ui"
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
import { WidgetLibrary, type AddOptions } from "../panels/builder-panels"
import { WidgetInspector } from "../panels/widget-inspector"
import { ThumbStyles } from "../thumbs/widget-thumb"
import { RevealContext, Row, Segmented } from "../fields/controls"
import { designTabs, DeviceSwitch, Readability, SettingsPanel, THEME_GROUPS, usePanelSearching, without } from "../panels/settings-panel"
import { AllWidgetsInspector } from "../panels/all-widgets-inspector"
import { DesignProvider } from "../fields/design-fields"
import { GuideDialog, VersionsSheet, useDraftEditor } from "./editor-shell"
import { ArrangeCanvas, useArrange, type Device } from "./page-builder"
import { CAN_SAVE_TEMPLATE, SaveTemplateDialog } from "./save-template"
import { LayoutTab, MenuStep, ThemeTab } from "./design-steps"
import { LOOKS } from "../looks"
import { LAYOUTS, THEMES } from "../presets"
import { JOIN_SCREENS, type JoinScreenId } from "@/lib/data/join"
import { studentCourses, useCatalog } from "@/lib/data/learning"
import { BackToPlaybook, CourseInspector, CoursePageLink, CourseSections } from "../panels/course-panels"
import type { CourseSectionId } from "@/lib/data/course-page"
import { JoinInspector } from "../panels/join-panels"
import { PreviewFrame } from "./preview-frame"
import { EditorTopBar } from "./top-bar"
import { canvasDots } from "./canvas-bg"

/** Design's sections, in the order a coach goes through them; the theme ones are the library's theme editor's. */
type Step = "brand" | "look" | "layout" | "type" | "shape" | "widgets" | "page" | "menu" | "pages" | "course" | "join"
const STEP_IDS: Step[] = ["brand", "look", "layout", "type", "shape", "widgets", "page", "menu", "pages", "course", "join"]

/** Where a part clicked in the preview is set. */
const STEP_OF: Record<string, Step> = {
  logo: "brand",
  highlight: "brand",
  nav: "layout",
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
/** Who the canvas and the preview show the platform to (the Preview popover). */
const PREVIEW_AS: { value: DataMode; label: string; hint: string }[] = [
  { value: "sample", label: "Sample", hint: "Sample data" },
  { value: "empty", label: "New", hint: "A new student: their first week" },
  { value: "inactive", label: "Inactive", hint: "An inactive student" },
  { value: "finished", label: "Finished", hint: "A student who finished a course" },
]

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
  const askedRaw = params.get("step")
  // "theme" is the Theme tab's name in the rail; its id stays "look".
  const asked = (askedRaw === "theme" ? "look" : askedRaw) ?? (params.get("mode") === "arrange" || params.get("panel") === "pages" ? "pages" : params.get("panel") === "menu" ? "menu" : "brand")
  // Widgets' style lives in Pages, as All widgets: old links to Widgets open it there.
  const [step, setStep] = useState<Step>(IN_PAGES(asked) ? "pages" : STEP_IDS.includes(asked as Step) ? (asked as Step) : "brand")
  // The section of the course page selected on the left, edited on the right.
  const [courseSel, setCourseSel] = useState<CourseSectionId | null>(null)
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
  // A publish that did not go through (the store says why): shown until the draft changes again. Compared by reference, so no effect clears it.
  const [failedFor, setFailedFor] = useState<unknown>(null)
  const failed = failedFor !== null && failedFor === working

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
      // A menu item clicked on the canvas: its row in the Menu panel, and its page on the canvas.
      if (target.startsWith("menu:")) {
        const page = target.slice(5)
        if (pages.some((x) => x.id === page)) {
          setPage(page)
          select(null)
        }
      }
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
  // What the page menu names: the platform page, the course page, or a Join screen.
  const here = step === "join" ? joinInfo.label : step === "course" ? "Playbook · Course page" : pageInfo.label
  // The course the Course step shows: the first one students can open.
  const catalog = useCatalog(coach)
  const previewCourse = studentCourses(catalog).find((c) => c.modules.length > 0) ?? catalog.courses[0]
  const src = step === "join" ? `/site/${slug}/${joinInfo.route}?preview=draft` : step === "course" ? `/c/${slug}/courses/${previewCourse?.id ?? ""}?preview=draft` : `${pageInfo.href}?preview=draft${tier !== "default" ? `&tier=${tier}` : ""}${data !== "sample" ? `&data=${data}` : ""}`
  const checks = auditTheme(theme)
  const tierLabel = tier === "default" ? "Everyone" : (arrange.tierName ?? tier)
  const sel = arrange.selWidget
  const doPublish = () => {
    // Publishing changes this community only; in the prototype say so in the same toast, since templates are designed here too.
    const ok = editor.publish(CAN_SAVE_TEMPLATE ? { description: `${coach.name} only. The ${TEMPLATES[theme.template].name} template didn't change.`, action: { label: "Save as template", onClick: () => setMenu("template") } } : undefined)
    setFailedFor(ok ? null : working)
  }
  const resetTheme = (keys: (keyof typeof working.theme)[]) => commit({ ...working, theme: without(working.theme, keys) }, "reset")
  const own = arrange.layout.items.filter((x) => x.style && Object.values(x.style).some((v) => v !== undefined)).length
  const count = { total: arrange.layout.items.length, own }
  const selDef = sel && getWidget(sel.type)
  // The right panel (the inspector of Webflow, Framer and Figma): the selected widget, every widget's style, or the page.
  const inspector =
    step === "join" ? (
      <JoinInspector screen={joinScreen} />
    ) : step === "course" ? (
      <CourseInspector selected={courseSel} onSelect={setCourseSel} />
    ) : scope === "all" ? (
      // A place of its own (not a switch on the widget's panel): the style every widget shares, with the way back.
      <AllWidgetsInspector draft={working.theme} onReset={resetTheme} onBack={() => setScope("one")} back={selDef ? selDef.name : pageInfo.label} own={own} onClearOwn={arrange.clearOwnStyles} />
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
    ) : null
  const pagesContent = (
    <>
    {/* The way to every widget's style (corner radius, cards, buttons, charts): the first thing in Pages, big enough to find.
        `data-tour="editor-widgets"`: step 2 of the design editor tour (Getting started → Tour the design editor). */}
    <SearchHides><div className="px-4 pb-3" data-tour="editor-widgets">
      {/* Admin / Editor Design all card: a bordered panel, an icon tile, the name and what it holds; the active edge while it is open. */}
      <button
        type="button"
        aria-pressed={scope === "all"}
        onClick={() => setScope(scope === "all" ? "one" : "all")}
        className="flex w-full items-center gap-3 rounded-a-lg border border-a-border bg-a-panel px-3 py-2.5 text-left outline-none transition-colors duration-300 hover:border-a-border-strong hover:bg-a-hover focus-visible:ring-2 focus-visible:ring-a-border-focus aria-pressed:border-a-border-active"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-a-md bg-a-muted text-a-icon">
          <Palette className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block t-body-m-medium text-a-text">Design all widgets</span>
          <span className="block t-caption text-a-text-3">Corners, cards, buttons, charts</span>
        </span>
      </button>
    </div>
    </SearchHides>
    <WidgetLibrary
      key={page}
      page={page}
      pageLabel={pageInfo.label}
      coach={coach}
     
      onPage={readingOrder(arrange.layout.items)}
      onAdd={(type, o) => {
        // Added with what was chosen in its details, at the bottom, and selected: the rest is in its panel.
        const def = getWidget(type)!
        const w: WidgetInstance = { id: uid(), type, x: 0, y: 0, w: o.w, h: heightFor(def, o.variant, o.detail, o.w), variant: o.variant, detail: o.detail === "standard" ? undefined : o.detail, props: Object.keys(o.props).length ? o.props : undefined }
        arrange.append(w)
        select(w.id)
        toast(`${def.name} added at the bottom of ${pageInfo.label}.`, { description: "Drag it where you want it. ⌘Z undoes it." })
      }}
      onSelect={select}
      onDragType={(type, opts) => setIncoming(type ? { type, opts } : null)}
    />
    </>
  )
  const tabs = designTabs({
    // Light or dark moved to Theme (Figma Editor · 2 Style): Brand is who you are, Theme is how it looks.
    brand: { groups: [{ title: "Your platform", fields: ["logo", "name", "import-site"], keys: [], words: "logo name platform import website url colours fonts brand" }, ...THEME_GROUPS.colour] },
    look: {
      content: <ThemeTab />,
      finds: [
        { title: "Light or dark mode", words: "mode dark light night day" },
        ...THEMES.map((t) => ({ title: `${t.name} theme`, words: `${t.summary} theme template` })),
        ...LOOKS.map((l) => ({ title: `${l.name} variation`, words: `${l.blurb} look variation` })),
        { title: "Reset to the theme", words: "reset custom own mix theme" },
      ],
    },
    layout: {
      content: <LayoutTab />,
      finds: [
        ...LAYOUTS.map((l) => ({ title: l.name, words: `${l.text} layout menu` })),
        { title: "Menu position", words: "menu side top left header" },
        { title: "Page frame", words: "frame classic floating" },
        { title: "Widgets cards or blended", words: "widgets cards blended open" },
        { title: "Spacing", words: "spacing density compact comfortable airy" },
      ],
    },
    menu: { content: <MenuStep /> },
        // No line under the title: the gallery speaks for itself.
    pages: {
      content:
        step === "join" ? (
          <p className="border-t border-a-border-subtle px-5 pt-6 t-caption text-muted-foreground">The Join screens have no widgets. Their words, layout and look are on the right.</p>
        ) : step === "course" ? (
          <>
            <BackToPlaybook onBack={() => (setPage("courses"), select(null), go("pages"))} />
            <CourseSections selected={courseSel} onSelect={setCourseSel} />
          </>
        ) : page === "courses" ? (
          <>
            {pagesContent}
            <CoursePageLink onOpen={() => (select(null), go("course"))} />
          </>
        ) : (
          pagesContent
        ),
      blurb: undefined,
    },
    // Every widget's style is in Pages (All widgets); off the rail, still found by search.
  }).map((t) => (t.id === "widgets" ? { ...t, hidden: true, label: "All widgets" } : t.id === "join" || t.id === "course" ? { ...t, hidden: true } : t.id === "pages" && (step === "join" || step === "course") ? { ...t, heading: step === "join" ? "Join screens" : "Course page" } : t))

  // The room between the floating cards (Figma 16/11): 12 px beside each 336 px card, which sit 12 px in from the canvas edge.
  const freeLeft = leftOpen ? 360 : 0
  const freeRight = inspector ? 360 : 0
  // Toasts stay out of the inspector: they sit in the room left of it while it is open (wide screens only; the card is absolute there).
  const hasInspector = !!inspector
  useEffect(() => {
    if (!hasInspector) return
    const root = document.documentElement.style
    root.setProperty("--admin-toast-right", "380px")
    return () => void root.removeProperty("--admin-toast-right")
  }, [hasInspector])
  const freeCentre = `calc(${freeLeft}px + (100% - ${freeLeft + freeRight}px) / 2)`
  return (
    <DesignProvider value={{ coach, theme, working, change, commit, keepVersion: (label) => keepVersion(slug, label, working), undo: editor.undo, openPage: (id) => (setPage(id), select(null), go("pages")) }}>
      <StepCtx.Provider value={{ go }}>
        <ThumbStyles />
        {/* A screen of its own, over the admin (Figma 14/11): the Admin's page colour, a top bar with no fill, and the sections, the
            canvas and the inspector as three floating cards 8 px apart. The panel's controls select in the Admin's orange
            (--ts-interactive); the marks on the canvas (selected outline, corners, drop zones) are the same orange; the vars below keep the frame's colours out of the canvas (.hb-canvas never reads them). */}
        <div role="dialog" aria-modal aria-label="Design" data-design-ws className="fixed inset-0 z-50 grid grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-a-page font-[family-name:var(--admin-font-family-primary)] [--background:var(--admin-color-bg-page)] [--border:var(--admin-color-border-default)] [--ring:var(--admin-color-border-focus)] [--ts-interactive:var(--admin-color-border-active)] lg:overflow-hidden">
          <EditorTopBar
            back={fromSetup ? { href: "/setup", label: "Back to setup" } : { href: `/admin/${slug}`, label: "Admin" }}
            // The same in every section: the canvas shows this page in all of them, so its name is always in sight.
            center={
              <>
                <AdminMenu>
                  <AdminMenuTrigger render={<AdminFilterButton label="Page" value={here} title="The page you are editing. Click to change page" />} />
                  <AdminMenuContent align="center" className="w-[220px]">
                    {/* The platform's pages; the page inside a course sits under Playbook, which it belongs to. */}
                    <AdminMenuGroup>
                      <AdminMenuLabel>Pages</AdminMenuLabel>
                      {pages.map((p) => {
                        const on = step !== "join" && step !== "course" && p.id === page
                        return (
                          <Fragment key={p.id}>
                            <AdminMenuItem
                              active={on}
                              onClick={() => {
                                setPage(p.id)
                                select(null)
                                if (step === "join" || step === "course") go("pages")
                              }}
                            >
                              <span className="flex-1 truncate">{p.label}</span>
                            </AdminMenuItem>
                            {p.id === "courses" && (
                              <AdminMenuItem active={step === "course"} onClick={() => (select(null), go("course"))}>
                                <span className="flex-1 truncate">Course page</span>
                              </AdminMenuItem>
                            )}
                          </Fragment>
                        )
                      })}
                    </AdminMenuGroup>
                    <AdminMenuSeparator />
                    {/* The screens people pass through to join aren't pages of the platform: apart from them. */}
                    <AdminMenuGroup>
                      <AdminMenuLabel>Join</AdminMenuLabel>
                      {JOIN_SCREENS.map((j) => {
                        const on = step === "join" && j.id === joinScreen
                        return (
                          <AdminMenuItem
                            key={j.id}
                            active={on}
                            onClick={() => {
                              setJoinScreen(j.id)
                              select(null)
                              go("join")
                            }}
                          >
                            <span className="flex-1 truncate">{j.label}</span>
                          </AdminMenuItem>
                        )
                      })}
                    </AdminMenuGroup>
                  </AdminMenuContent>
                </AdminMenu>
                <span aria-hidden className="h-5 w-px bg-a-border" />
                <DeviceSwitch value={device} onChange={setDevice} />
              </>
            }
            // Only when something is hard to read: a check that passes needs no room in the bar.
            extra={checks.some((c) => !c.pass) ? <Readability fails={checks.filter((c) => !c.pass)} total={checks.length} /> : null}
            status={failed ? { kind: "failed" } : editor.dirty ? { kind: "unpublished", changes: editor.changes } : { kind: "published" }}
            history={{ undo: editor.undo, redo: editor.redo, canUndo: editor.canUndo, canRedo: editor.canRedo }}
            moreItems={
              <>
                <AdminMenuItem onClick={() => setMenu("versions")}>
                  <History /> Earlier versions
                </AdminMenuItem>
                <AdminMenuItem onClick={() => setMenu("guide")}>
                  <PlayCircle /> 1-minute guide
                </AdminMenuItem>
                <AdminMenuItem render={<Link href={`/admin/${slug}/design/pages/all${fromSetup ? "?from=setup" : ""}`} />}>
                  <LayoutGrid /> All pages side by side
                </AdminMenuItem>
                {CAN_SAVE_TEMPLATE && (
                  <AdminMenuItem onClick={() => setMenu("template")}>
                    <FileDown /> Save as template
                  </AdminMenuItem>
                )}
                <AdminMenuSeparator />
                <AdminMenuItem onClick={() => setMenu("reset")}>
                  <RotateCcw /> Reset to the original design
                </AdminMenuItem>
                <AdminMenuItem tone="danger" disabled={!editor.dirty} onClick={editor.discard}>
                  <Trash2 /> Discard changes
                </AdminMenuItem>
              </>
            }
            preview={
              <Popover>
                <PopoverTrigger render={<AdminButton hierarchy="secondary" title="Choose who to preview as, and open your platform" />}>
                  <Eye /> <span className="max-sm:sr-only">Preview</span>
                </PopoverTrigger>
                <PopoverContent align="end" className="ts-ui ts-admin w-80">
                  <Row label="Preview as" hint={PREVIEW_AS.find((o) => o.value === data)?.hint} stack>
                    <Segmented label="Preview data" value={data} onChange={setData} options={PREVIEW_AS} />
                  </Row>
                  <AdminButton hierarchy="secondary" className="w-full" nativeButton={false} render={<a href={src} target="_blank" rel="noreferrer" />}>
                    <ExternalLink /> Open in a new tab
                  </AdminButton>
                </PopoverContent>
              </Popover>
            }
            onPublish={doPublish}
            publishDisabled={!editor.dirty}
          />
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
            text="Your brand and a theme first; then layout, type and background to fine-tune; then your menu and pages. In Widgets, select a widget to move, size, fill and style it, for that widget or all of them. Click anything in your platform on the right to jump to what changes it. Nothing changes for students until you publish."
            open={menu === "guide"}
            onOpenChange={(o) => setMenu(o ? "guide" : null)}
          />

          {/* Below 1280px the left sidebar keeps only its icons, so the page has room; an icon opens it again. */}
          {/* Figma 16/11: the rail is the only fixed column; the section panel and the inspector are cards floating over the canvas, which
              fills the rest. The preview and the "Layout for" menu centre in the room the two cards leave (`free`). */}
          <div className="relative grid min-h-0 grid-cols-[64px_minmax(0,1fr)] gap-2 p-2">
            {/* The section rail (a column) and its panel (a floating card): the same editor as the library's themes, with Design's own
                sections (brand, look, menu, pages) around the theme's. `editor-panel` is the tour's spotlight over both. */}
            <div aria-hidden data-tour="editor-panel" className="pointer-events-none absolute top-2 bottom-2 left-2" style={{ width: leftOpen ? 422 : 64 }} />
            <div className="contents">
              <RevealContext.Provider value={pick.reveal}>
                <SettingsPanel
                  tabs={tabs}
                  tab={step === "join" || step === "course" ? "pages" : step}
                  onTab={(id) => go(id as Step)}
                  draft={working.theme}
                  onReset={resetTheme}
                  bodyRef={panel}
                  bodyProps={{ onPointerOver: pick.onPanelHover, onPointerLeave: pick.onPanelLeave }}
                  // Brand, Look, Type and Background are one place, Theme, with its parts as pills.
                  merge={{ id: "theme", label: "Style", icon: <Palette />, of: ["brand", "look", "layout", "type", "page"] }}
                  caption={`${coach.name} · saved as you type`}
                  collapsed={!leftOpen}
                  floating
                  // On a narrow screen the open section's icon folds the panel away again; any other icon opens it.
                  onRail={(_, wasOpen) => setLeftOpen(narrow && wasOpen && leftOpen ? false : true)}
                />
              </RevealContext.Provider>
            </div>

            {/* The platform on its dotted field. On Pages it's the widget grid; elsewhere, click a part to change it. */}
            <section data-tour="editor-canvas" className="relative grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)] overflow-hidden rounded-a-xl border border-a-border" style={canvasDots()}>
              <div className="relative min-h-0 min-w-0 overflow-hidden" style={{ paddingLeft: freeLeft, paddingRight: freeRight }}>
                {step !== "join" && step !== "course" && (
                  <>
                    {/* In the canvas's corner: whose layout of this page is on the canvas. Each tier can have its own; until then it uses Everyone's. */}
                    <div className="absolute top-4 z-30 -translate-x-1/2" style={{ left: freeCentre }}>
                      <AdminMenu>
                        <AdminMenuTrigger
                          render={
                            <AdminFilterButton
                              label="Layout for"
                              value={
                                <>
                                  {tierLabel}
                                  {tier !== "default" && <span className="text-a-text-3"> · {arrange.inherits ? "uses Everyone" : "own layout"}</span>}
                                </>
                              }
                              title={arrange.inherits ? `${tierLabel} uses the Everyone layout. Changing the page gives ${tierLabel} its own.` : "Each tier can have its own layout of this page"}
                              className="bg-a-page"
                            />
                          }
                        />
                        <AdminMenuContent align="start" className="w-64">
                          {[{ id: "default", name: "Everyone" }, ...coach.tiers].map((t) => (
                            <AdminMenuItem
                              key={t.id}
                              active={t.id === tier}
                              onClick={() => {
                                setTier(t.id)
                                select(null)
                              }}
                            >
                              <span className="flex-1">
                                {t.name}
                                {t.id !== "default" && (coach.pages?.[page] ?? {})[t.id] ? <span className="text-a-text-3"> · own layout</span> : null}
                              </span>
                              {t.id === tier && <Check className="size-3.5" />}
                            </AdminMenuItem>
                          ))}
                          {tier !== "default" && !arrange.inherits && (
                            <>
                              <AdminMenuSeparator />
                              <AdminMenuItem onClick={arrange.useDefault}>Use the Everyone layout for {tierLabel}</AdminMenuItem>
                            </>
                          )}
                        </AdminMenuContent>
                      </AdminMenu>
                    </div>
                  </>
                )}
                {/* Publishing failed: the draft is safe. A callout over the canvas, blurred so the page shows through it. */}
                {failed && (
                  <Callout tone="danger" className="absolute top-4 z-40 w-[min(42rem,calc(100%-2rem))] -translate-x-1/2 backdrop-blur-a-overlay" style={{ left: freeCentre }} action={<AdminButton hierarchy="secondary" size="md" onClick={doPublish}>Try again</AdminButton>}>
                    We couldn&apos;t publish {editor.changes > 0 ? `your ${editor.changes} ${editor.changes === 1 ? "change" : "changes"}` : "your changes"}. They are still saved, so you can try again.
                  </Callout>
                )}
                {step === "join" || step === "course" ? <PreviewFrame src={src} device={device} desktopWidth={1100} name={coach.name} /> : (
                  <ArrangeCanvas arrange={arrange} coach={coach} theme={theme} device={device} data={data} incoming={incoming} onDropped={() => setIncoming(null)} allWidgets={scope === "all"} shell onPick={pick.pick} />
                )}
              </div>
            </section>
            {/* The inspector: a card of its own, as in Framer; the canvas between the cards gives way. Only open when there is something
                to edit: a selected widget, every widget's style, or a Join or course screen. */}
            {inspector && (
              <aside aria-label="Inspector" data-tour="editor-inspector" className="absolute top-5 right-5 bottom-5 z-20 w-[336px] overflow-y-auto rounded-a-lg border border-a-border bg-a-page shadow-[0_8px_24px_-4px_rgb(0_0_0/0.6)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <RevealContext.Provider value={pick.reveal}>{inspector}</RevealContext.Provider>
              </aside>
            )}
          </div>
        </div>
      </StepCtx.Provider>
    </DesignProvider>
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
              { outline: "2px solid var(--admin-color-border-active)", outlineOffset: "6px", borderRadius: "4px" },
              { outline: "2px solid transparent", outlineOffset: "6px", borderRadius: "4px" },
            ],
            { duration: 1600, easing: "ease-in" },
          )
        if (reveal.fields[0]?.startsWith("menu-")) els[0]?.querySelector<HTMLInputElement>("input:not(:disabled)")?.select()
      })
    })
    return () => cancelAnimationFrame(id)
  }, [panel, reveal])
}

/** Hidden while the panel search is open: the search and its results are all the panel shows then. */
function SearchHides({ children }: { children: React.ReactNode }) {
  return usePanelSearching() ? null : <>{children}</>
}

/** Back to the original design, from the ⋯ menu: asks first, says what goes back, and can put the pages back too. Undoable. */
function ResetDialog({ open, onOpenChange, name, onReset }: { open: boolean; onOpenChange: (o: boolean) => void; name: string; onReset: (pagesToo: boolean) => void }) {
  const [pagesToo, setPagesToo] = useState(false)
  return (
    <AdminModal overlay="plain"
      open={open}
      onOpenChange={(o) => (onOpenChange(o), setPagesToo(false))}
      title="Back to the original design?"
      subtitle={`Colours, type, shapes, widgets and background go back to how ${name} started. Your name, logo and menu stay. You can undo it (⌘Z).`}
      className="sm:max-w-[560px]"
      footer={
        <>
          <AdminButton hierarchy="secondary" onClick={() => onOpenChange(false)}>
            Keep
          </AdminButton>
          <AdminButton
            hierarchy="danger"
            onClick={() => {
              onReset(pagesToo)
              onOpenChange(false)
            }}
          >
            Reset
          </AdminButton>
        </>
      }
    >
      <label className="flex cursor-pointer items-center gap-2 t-body-m">
        <Checkbox checked={pagesToo} onCheckedChange={(v) => setPagesToo(!!v)} />
        Also put every page&apos;s layout back
      </label>
    </AdminModal>
  )
}
