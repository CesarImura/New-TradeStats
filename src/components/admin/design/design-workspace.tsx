"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Eye, LayoutGrid, Monitor, MousePointerClick, Newspaper, Palette, Plus, Smartphone, Tablet, Type } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { studentNav } from "@/components/coach/nav"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { DataMode } from "@/components/widgets/shared"
import { getCoach } from "@/lib/data/coaches"
import { describe, targetsForField, type PickMessage, type PickTarget } from "@/lib/design-pick"
import { resolveCoach, resolveTheme } from "@/lib/theme/resolve"
import type { PageId } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { NothingSelected, WidgetLibrary, WidgetSettings } from "./builder-panels"
import { Segmented } from "./controls"
import { BrandKitPanel, DesignField, DesignProvider, MenuPanel, StylePanel } from "./design-fields"
import { EditorBar, useDraftEditor } from "./editor-shell"
import { ArrangeCanvas, useArrange, type Device } from "./page-builder"
import { PreviewFrame } from "./preview-frame"

type Mode = "edit" | "arrange" | "browse"
type Panel = "brand" | "pages" | "widgets" | "menu"

const PANELS: { id: Panel; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "brand", label: "Brand kit", icon: Palette },
  { id: "pages", label: "Pages", icon: Newspaper },
  { id: "widgets", label: "Add widget", icon: Plus },
  { id: "menu", label: "Menu and words", icon: Type },
]

/**
 * ADM-37 to ADM-44: one Design workspace. The coach's real platform sits in
 * the middle. The left panel holds who you are (Brand kit), which page
 * (Pages), what goes on it (Add widget) and the menu (Menu and words). The
 * inspector on the right shows the style of the whole platform, or, once you
 * click a part of the platform, only the settings for that part; in Arrange,
 * the selected widget's settings. Changes stay a draft until Publish.
 */
export function DesignWorkspace() {
  const { coach: published } = useCoach()
  const slug = published.slug
  const original = getCoach(slug)!
  const editor = useDraftEditor(slug)
  const { working, commit, change } = editor
  const coach = useMemo(() => resolveCoach(original, working.content), [original, working.content])
  const theme = useMemo(() => resolveTheme(coach, working.theme), [coach, working.theme])

  // Where we are, from the link that opened Design (setup, all pages, old Pages links).
  const params = useSearchParams()
  const [mode, setModeState] = useState<Mode>(() => (["edit", "arrange", "browse"].includes(params.get("mode") ?? "") ? (params.get("mode") as Mode) : "edit"))
  const [panel, setPanelState] = useState<Panel>(() => (PANELS.some((p) => p.id === params.get("panel")) ? (params.get("panel") as Panel) : "brand"))
  const pages = studentNav(coach, `/c/${slug}`)
  const [pageAsked, setPage] = useState(params.get("page") ?? "home")
  const page = (pages.some((p) => p.id === pageAsked) ? pageAsked : "home") as PageId
  const [tier, setTier] = useState(params.get("tier") ?? "default")
  const [device, setDevice] = useState<Device>("desktop")
  const [data, setData] = useState<DataMode>("sample")
  const [widget, setWidget] = useState<string | null>(null)
  const [incoming, setIncoming] = useState<string | null>(null)

  const arrange = useArrange({ coach, theme, editor, page, tier, selected: widget, setSelected: setWidget })
  const pick = usePreviewPick(mode === "edit")

  const setMode = (m: Mode) => {
    setModeState(m)
    setWidget(null)
    pick.clear()
    // The widget library only works on the grid; leaving Arrange shows the brand kit instead.
    if (m !== "arrange" && panel === "widgets") setPanelState("brand")
  }
  const setPanel = (p: Panel) => {
    setPanelState(p)
    // Widgets are placed on the grid, so adding one opens Arrange.
    if (p === "widgets" && mode !== "arrange") setMode("arrange")
  }
  const goToPage = (id: string) => {
    setPage(id)
    setWidget(null)
    pick.clear()
  }

  // Give the canvas room: fold the admin menu to icons while designing, and restore it on leaving.
  const { open: menuOpen, setOpen: setMenuOpen } = useSidebar()
  const menuWasOpen = useRef(menuOpen)
  useEffect(() => {
    const restore = menuWasOpen.current
    setMenuOpen(false)
    return () => setMenuOpen(restore)
  }, [setMenuOpen])

  const pageInfo = arrange.pageInfo
  const query = `preview=draft${tier !== "default" ? `&tier=${tier}` : ""}${data === "empty" ? "&data=empty" : ""}`
  const src = `${pageInfo.href}?${query}`
  const canvasClass = cn("hb-canvas", theme.mode === "dark" ? "dark" : "light")
  const layouts = coach.pages?.[page] ?? {}

  return (
    <DesignProvider value={{ coach, theme, working, change, commit }}>
      <div className="-mx-4 -my-5 grid min-h-[calc(100svh-2.75rem)] grid-rows-[auto_1fr] md:-m-6 lg:h-[calc(100svh-2.75rem)]">
        <EditorBar
          slug={slug}
          editor={editor}
          previewHref={src}
          guide={{
            title: "Designing your platform",
            text: "Your platform is in the middle. Click any part of it to change just that part; with nothing selected, the right side shows your whole style. Brand kit, pages, widgets and the menu are on the left. Nothing changes for students until you publish.",
          }}
        >
          <select value={page} onChange={(e) => goToPage(e.target.value)} aria-label="Page" className="h-7 rounded-[4px] border bg-background px-2 text-xs">
            {pages.map((p) => (
              <option key={p.id} value={p.id}>
                Page: {p.label}
              </option>
            ))}
          </select>
          <select
            value={tier}
            onChange={(e) => {
              setTier(e.target.value)
              setWidget(null)
            }}
            aria-label="Preview as"
            className="h-7 rounded-[4px] border bg-background px-2 text-xs"
          >
            <option value="default">Preview as: everyone</option>
            {coach.tiers.map((t) => (
              <option key={t.id} value={t.id}>
                Preview as: {t.name}
                {layouts[t.id] ? " · own layout" : ""}
              </option>
            ))}
          </select>
        </EditorBar>

        <div className="grid min-h-0 grid-cols-1 lg:grid-cols-[44px_272px_minmax(0,1fr)_300px]">
          {/* Rail */}
          <nav aria-label="Design panels" className="flex gap-1 border-b bg-[var(--sidebar)] p-1.5 lg:flex-col lg:border-r lg:border-b-0">
            {PANELS.map((p) => (
              <Tooltip key={p.id}>
                <TooltipTrigger
                  render={
                    <button
                      onClick={() => setPanel(p.id)}
                      aria-pressed={panel === p.id}
                      aria-label={p.label}
                      className={cn(
                        "grid size-8 place-items-center rounded-[4px] text-muted-foreground hover:bg-[var(--ts-hover-1)] hover:text-foreground",
                        panel === p.id && "bg-[var(--ts-layer-2)] text-foreground shadow-[inset_2px_0_0_var(--ts-interactive)]",
                      )}
                    />
                  }
                >
                  <p.icon className="size-4" />
                </TooltipTrigger>
                <TooltipContent side="right">{p.label}</TooltipContent>
              </Tooltip>
            ))}
          </nav>

          {/* Left panel */}
          <aside className="min-h-0 overflow-y-auto border-b bg-card lg:border-r lg:border-b-0" onPointerOver={pick.onPanelHover} onPointerLeave={pick.onPanelLeave}>
            <PanelHead title={PANELS.find((p) => p.id === panel)!.label} />
            {panel === "brand" && <BrandKitPanel />}
            {panel === "menu" && <MenuPanel />}
            {panel === "widgets" && (
              <WidgetLibrary
                key={page}
                page={page}
                coach={coach}
                canvasClass={canvasClass}
                onAdd={(type) => {
                  if (mode !== "arrange") setMode("arrange")
                  arrange.addWidget(type)
                }}
                onDragType={setIncoming}
              />
            )}
            {panel === "pages" && (
              <div className="grid gap-1 p-2">
                {pages.map((p) => {
                  const perTier = Object.keys(coach.pages?.[p.id as PageId] ?? {}).length > 1
                  return (
                    <button
                      key={p.id}
                      onClick={() => goToPage(p.id)}
                      aria-current={p.id === page ? "page" : undefined}
                      className={cn(
                        "flex h-8 items-center gap-2 rounded-[4px] px-2 text-left text-[0.8125rem] text-muted-foreground hover:bg-[var(--ts-hover-1)] hover:text-foreground",
                        p.id === page && "bg-[var(--ts-layer-2)] text-foreground shadow-[inset_2px_0_0_var(--ts-interactive)]",
                      )}
                    >
                      <p.icon className="size-4" />
                      <span className="flex-1 truncate">{p.label}</span>
                      {perTier && <span className="text-[0.6875rem] text-muted-foreground">per tier</span>}
                    </button>
                  )
                })}
                <div className="mt-2 grid gap-2 border-t px-1 pt-3">
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setMode("arrange")} disabled={mode === "arrange"}>
                    <LayoutGrid /> Arrange {pageInfo.label}
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full" nativeButton={false} render={<Link href={`/admin/${slug}/design/pages/all${params.get("from") === "setup" ? "?from=setup" : ""}`} />}>
                    See all pages side by side
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Every page is a grid of widgets around its main part. Pick a tier in <span className="text-foreground">Preview as</span> to give that tier its own layout.
                  </p>
                </div>
              </div>
            )}
          </aside>

          {/* Canvas */}
          <section className="grid min-h-[70svh] min-w-0 grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-background lg:min-h-0">
            <div className="flex flex-wrap items-center gap-2 border-b bg-[var(--sidebar)] px-3 py-1.5">
              <div className="w-[17rem]">
                <Segmented
                  label="What clicking does"
                  value={mode}
                  onChange={setMode}
                  options={[
                    { value: "edit", label: <><MousePointerClick className="size-3.5" /> Edit style</> },
                    { value: "arrange", label: <><LayoutGrid className="size-3.5" /> Arrange</> },
                    { value: "browse", label: <><Eye className="size-3.5" /> Browse</> },
                  ]}
                />
              </div>
              <div className="w-[6.5rem]">
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
              <div className="w-[11.5rem]">
                <Segmented
                  label="Preview data"
                  value={data}
                  onChange={setData}
                  options={[
                    { value: "sample", label: "Sample data" },
                    { value: "empty", label: "New student" },
                  ]}
                />
              </div>
              <span className="ml-auto truncate text-xs text-muted-foreground">
                {mode === "edit" && "Click any part of your platform to change it"}
                {mode === "browse" && `What students will see${editor.dirty ? " after you publish" : ""}`}
                {mode === "arrange" &&
                  (arrange.inherits ? (
                    <>{arrange.tierName} uses the default {pageInfo.label} page. Changing it here gives {arrange.tierName} its own.</>
                  ) : tier !== "default" ? (
                    <>
                      {arrange.tierName} has its own {pageInfo.label} page ·{" "}
                      <button className="text-foreground underline underline-offset-2" onClick={arrange.useDefault}>
                        Use the default instead
                      </button>
                    </>
                  ) : (
                    "Drag to move, drag edges to resize, right-click for more"
                  ))}
              </span>
            </div>
            <div className="min-h-0 min-w-0 overflow-hidden bg-[color:color-mix(in_oklab,var(--background)_70%,black)]">
              {mode === "arrange" ? (
                <ArrangeCanvas arrange={arrange} coach={coach} theme={theme} device={device} data={data} incoming={incoming} onDropped={() => setIncoming(null)} />
              ) : (
                <PreviewFrame src={src} device={device} frameRef={pick.frameRef} />
              )}
            </div>
          </section>

          {/* Inspector */}
          <aside className="min-h-0 overflow-y-auto border-t bg-card lg:border-t-0 lg:border-l" onPointerOver={pick.onPanelHover} onPointerLeave={pick.onPanelLeave}>
            {mode === "arrange" ? (
              arrange.selWidget ? (
                <WidgetSettings
                  key={arrange.selWidget.id}
                  w={arrange.selWidget}
                  pinned={arrange.pinned(arrange.selWidget.id)}
                  canvasClass={canvasClass}
                  onChange={(patch, key) => arrange.updateItem(arrange.selWidget!.id, patch, key)}
                  onDuplicate={() => arrange.duplicateWidget(arrange.selWidget!.id)}
                  onRemove={() => arrange.removeWidget(arrange.selWidget!.id)}
                />
              ) : (
                <>
                  <PanelHead title={`Arranging ${pageInfo.label}`} />
                  <NothingSelected />
                  <div className="border-t">
                    <PanelHead title="Style" />
                    <StylePanel />
                  </div>
                </>
              )
            ) : pick.picked ? (
              <PickedInspector picked={pick.picked} flash={pick.flash} onBack={pick.clear} onArrange={() => setMode("arrange")} />
            ) : (
              <>
                <PanelHead title="Style" text={mode === "edit" ? "Your whole platform. Click a part of it to see only its settings." : "Your whole platform."} />
                <StylePanel />
              </>
            )}
          </aside>
        </div>
      </div>
    </DesignProvider>
  )
}

function PanelHead({ title, text, children }: { title: string; text?: string; children?: React.ReactNode }) {
  return (
    <div className="grid gap-0.5 border-b px-4 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[0.8125rem] font-semibold">{title}</h2>
        {children}
      </div>
      {text && <p className="text-xs text-muted-foreground">{text}</p>}
    </div>
  )
}

/** The inspector after a click in the platform: only that part's settings, and how far they reach. */
function PickedInspector({ picked, flash, onBack, onArrange }: { picked: { target: PickTarget; count: number }; flash: number; onBack: () => void; onArrange: () => void }) {
  const { label, fields } = describe(picked.target)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.animate([{ backgroundColor: "rgb(255 85 0 / 0.12)" }, { backgroundColor: "transparent" }], { duration: 900, easing: "ease-out" })
  }, [flash])
  const reach = picked.target.startsWith("menu:")
    ? "This menu item, on every page"
    : ["logo", "nav", "background"].includes(picked.target)
      ? "On every page of your platform"
      : picked.count > 1
        ? `Changes all ${picked.count} on this page, and the same everywhere else`
        : "Changes this everywhere on your platform"
  return (
    <div ref={ref}>
      <PanelHead title={label} text={reach}>
        <Button variant="ghost" size="xs" onClick={onBack}>
          <ArrowLeft /> All style
        </Button>
      </PanelHead>
      <div className="grid gap-4 px-4 pt-3 pb-5">
        {fields.map((f) => (
          <DesignField key={f} id={f} />
        ))}
        {picked.target === "cards" && (
          <div className="grid gap-2 rounded-[6px] border p-3 text-xs text-muted-foreground">
            To move, resize or change what&apos;s in this box, arrange the page&apos;s widgets.
            <Button variant="outline" size="sm" className="w-fit" onClick={onArrange}>
              <LayoutGrid /> Arrange widgets
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Click-to-edit between the workspace and the preview frame: a click in the
 * preview selects that part (the inspector shows its settings); hovering a
 * setting anywhere in the panels outlines what it changes in the preview.
 */
function usePreviewPick(on: boolean) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [picked, setPicked] = useState<{ target: PickTarget; count: number } | null>(null)
  const [flash, setFlash] = useState(0)
  const shown = useRef("")

  useEffect(() => {
    const send = (m: PickMessage) => frame.current?.contentWindow?.postMessage(m, window.location.origin)
    send({ type: "design-pick-mode", on })
    const onMessage = (e: MessageEvent<PickMessage>) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return
      const m = e.data
      if (m?.type === "design-pick-ready") send({ type: "design-pick-mode", on })
      if (m?.type === "design-pick") {
        setPicked({ target: m.target, count: m.count })
        setFlash((n) => n + 1)
      }
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [on])

  // Escape goes back to the whole style.
  useEffect(() => {
    if (!picked) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPicked(null)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [picked])

  const show = (targets: PickTarget[]) => {
    const key = targets.join()
    if (key === shown.current) return
    shown.current = key
    frame.current?.contentWindow?.postMessage({ type: "design-show", targets } satisfies PickMessage, window.location.origin)
  }

  return {
    frameRef: frame,
    picked,
    flash,
    clear: () => setPicked(null),
    onPanelHover: (e: React.PointerEvent) => {
      if (!on) return
      const field = (e.target as Element).closest("[data-field]")?.getAttribute("data-field")
      show(field ? targetsForField(field) : [])
    },
    onPanelLeave: () => show([]),
  }
}
