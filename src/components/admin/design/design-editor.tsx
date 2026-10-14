"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Eye,
  ImagePlus,
  Monitor,
  MousePointerClick,
  Smartphone,
  Trash2,
  Wand2,
} from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { getCoach, type ModuleId } from "@/lib/data/coaches"
import { describe, targetsForField, type PickMessage, type PickTarget } from "@/lib/design-pick"
import { FONT_LIBRARY, type FontId } from "@/lib/fonts"
import { themeToCss } from "@/lib/theme/css"
import { onColor } from "@/lib/theme/derive"
import { colorsFromLogo } from "@/lib/theme/logo-colors"
import { resolveCoach, resolveTheme } from "@/lib/theme/resolve"
import { TEMPLATES, TEMPLATE_IDS } from "@/lib/theme/templates"
import type { TemplateId } from "@/lib/theme/types"
import { cn } from "@/lib/utils"
import { BackgroundControl } from "./background-control"
import { BRAND_COLORS, FONT_PAIRS, HIGHLIGHT_COLORS } from "./options"
import { Field, More, RevealContext, Segmented, Swatches, useReveal } from "./controls"
import { EditorBar, useDraftEditor } from "./editor-shell"
import { PreviewFrame } from "./preview-frame"

const MODULE_NAMES: Record<ModuleId, string> = {
  courses: "Courses",
  calendar: "Calendar",
  charts: "Charts",
  community: "Community",
  journal: "Journal",
  ranking: "Ranking",
  ai: "AI assistant",
}


/** ADM-38 to ADM-44: design, navigation, menu and words, with a live preview and publishing. */
export function DesignEditor() {
  const { coach: published } = useCoach()
  const slug = published.slug
  const original = getCoach(slug)!
  const editor = useDraftEditor(slug)
  const { working, dirty, commit, change } = editor

  const coach = useMemo(() => resolveCoach(original, working.content), [original, working.content])
  const theme = useMemo(() => resolveTheme(coach, working.theme), [coach, working.theme])

  const [device, setDevice] = useState<"desktop" | "phone">("desktop")
  const [page, setPage] = useState("")
  const pages = [{ value: "", label: coach.wording.home }, ...coach.menu.filter((m) => coach.modules[m]).map((m) => ({ value: m, label: coach.wording[m] }))]
  const src = `/c/${slug}${page ? `/${page}` : ""}?preview=draft`
  const { frameRef, panelRef, ...pick } = usePreviewPick()

  return (
    <div className="-m-4 grid min-h-[calc(100svh-3.5rem)] grid-rows-[auto_1fr] md:-m-6 lg:-m-8 lg:h-[calc(100svh-3.5rem)]">
      <EditorBar
        slug={slug}
        active="look"
        editor={editor}
        previewHref={src}
        guide={{ title: "Designing your platform", text: "Pick a template, add your logo, then fine-tune. Nothing changes for students until you publish." }}
      />

      <div className="grid min-h-0 lg:grid-cols-[380px_1fr]">
        {/* Settings */}
        <RevealContext.Provider value={pick.reveal}>
        <div ref={panelRef} className="min-h-0 overflow-y-auto border-r bg-background" onPointerOver={pick.onPanelHover} onPointerLeave={pick.onPanelLeave}>
          <Section title="Template" defaultOpen>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATE_IDS.map((id) => (
                <TemplateCard
                  key={id}
                  id={id}
                  selected={theme.template === id}
                  primary={theme.primary}
                  onSelect={() =>
                    commit(
                      {
                        content: working.content,
                        theme: { template: id, primary: theme.primary, primaryForeground: theme.primaryForeground, highlight: working.theme.highlight },
                      },
                      "template",
                    )
                  }
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Switching template keeps your name, logo, colours and menu. Style and layout start from the new template.
            </p>
          </Section>

          <Section title="Brand" defaultOpen>
            <Field id="name" label="Platform name">
              <Input value={coach.name} onChange={(e) => change({ content: { name: e.target.value } }, "name")} />
            </Field>
            <LogoField
              logo={coach.logo}
              mark={coach.mark}
              onLogo={(logo) => change({ content: { logo } }, "logo")}
              onColor={(c) => change({ theme: { primary: c, primaryForeground: onColor(c) } }, "primary")}
              primary={theme.primary}
            />
            <Field id="primary" label="Brand colour" hint="Buttons, links, active menu">
              <Swatches
                label="Brand colour"
                value={theme.primary}
                colors={BRAND_COLORS}
                onChange={(c) => change({ theme: { primary: c, primaryForeground: onColor(c) } }, "primary")}
              />
            </Field>
            <Field id="mode" label="Look">
              <Segmented
                label="Light or dark"
                value={theme.mode}
                onChange={(mode) => change({ theme: { mode } }, "mode")}
                options={[
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                ]}
              />
            </Field>
            <More label="More colours">
              <Field id="highlight" label="Highlight colour" hint="Announcements, badges">
                <Swatches
                  label="Highlight colour"
                  value={theme.highlight ?? theme.palettes[theme.mode].highlight}
                  colors={HIGHLIGHT_COLORS}
                  onChange={(c) => change({ theme: { highlight: c } }, "highlight")}
                />
              </Field>
            </More>
          </Section>

          <Section title="Fonts">
            <div data-field="fonts" className="grid grid-cols-2 gap-2">
              {FONT_PAIRS.map((p) => {
                const on = theme.fonts.heading === p.heading && theme.fonts.body === p.body
                return (
                  <button
                    key={p.name}
                    onClick={() => change({ theme: { fonts: { heading: p.heading, body: p.body, label: p.label } } }, "fonts")}
                    aria-pressed={on}
                    className={cn("grid gap-1 rounded-lg border p-3 text-left hover:bg-muted", on && "border-foreground ring-1 ring-foreground")}
                  >
                    <span className="text-2xl leading-none" style={{ fontFamily: FONT_LIBRARY[p.heading].css }}>Aa</span>
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: FONT_LIBRARY[p.body].css }}>
                      {p.name} · {FONT_LIBRARY[p.heading].label}
                    </span>
                  </button>
                )
              })}
            </div>
            <More label="Choose fonts one by one">
              {(["heading", "body", "label"] as const).map((role) => (
                <Field key={role} label={role === "heading" ? "Headings" : role === "body" ? "Text" : "Small labels"}>
                  <select
                    value={theme.fonts[role]}
                    onChange={(e) => change({ theme: { fonts: { [role]: e.target.value as FontId } } }, `font-${role}`)}
                    className="h-8 rounded-lg border bg-background px-2 text-sm"
                  >
                    {Object.entries(FONT_LIBRARY).map(([id, f]) => (
                      <option key={id} value={id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </Field>
              ))}
              <p className="text-xs text-muted-foreground">Uploading your own font file comes later.</p>
            </More>
          </Section>

          <Section title="Style">
            <Field id="effects" label="Brand depth" hint="A slight tonal shift in your brand colour">
              <Segmented
                label="Brand depth"
                value={theme.effects ?? "soft"}
                onChange={(effects) => change({ theme: { effects } }, "effects")}
                options={[
                  { value: "flat", label: "Flat" },
                  { value: "soft", label: "Subtle" },
                  { value: "vivid", label: "Rich" },
                ]}
              />
            </Field>
            <Field id="corners" label="Corners" hint={theme.radius <= 3 ? "Sharp" : theme.radius >= 16 ? "Very round" : "Round"}>
              <Slider
                value={[theme.radius]}
                min={0}
                max={24}
                step={1}
                onValueChange={(v) => change({ theme: { radius: Array.isArray(v) ? v[0] : v } }, "radius")}
                aria-label="Corner roundness"
              />
            </Field>
            <Field id="density" label="Spacing">
              <Segmented
                label="Spacing"
                value={theme.density}
                onChange={(density) => change({ theme: { density } }, "density")}
                options={[
                  { value: "compact", label: "Compact" },
                  { value: "comfortable", label: "Comfortable" },
                  { value: "airy", label: "Airy" },
                ]}
              />
            </Field>
            <Field id="buttons" label="Buttons">
              <Segmented
                label="Button shape"
                value={theme.buttonShape}
                onChange={(buttonShape) => change({ theme: { buttonShape } }, "buttons")}
                options={[
                  { value: "square", label: <span className="h-4 w-8 rounded-[2px] bg-current opacity-70" /> },
                  { value: "rounded", label: <span className="h-4 w-8 rounded-[5px] bg-current opacity-70" /> },
                  { value: "pill", label: <span className="h-4 w-8 rounded-full bg-current opacity-70" /> },
                ]}
              />
            </Field>
            <Field id="shadows" label="Shadows">
              <Segmented
                label="Shadows"
                value={theme.shadow}
                onChange={(shadow) => change({ theme: { shadow } }, "shadow")}
                options={[
                  { value: "none", label: "None" },
                  { value: "soft", label: "Soft" },
                  { value: "strong", label: "Strong" },
                ]}
              />
            </Field>
            <div data-field="background">
              <BackgroundControl theme={theme} onChange={(patch, key) => change({ theme: patch }, key)} />
            </div>
            <More label="More style options">
              <Field id="labels" label="Small labels">
                <Segmented
                  label="Small labels"
                  value={theme.labelStyle}
                  onChange={(labelStyle) => change({ theme: { labelStyle } }, "labels")}
                  options={[
                    { value: "plain", label: "Normal" },
                    { value: "caps", label: "UPPERCASE" },
                  ]}
                />
              </Field>
              <Field id="heading-weight" label="Heading weight">
                <Segmented
                  label="Heading weight"
                  value={theme.headingWeight}
                  onChange={(headingWeight) => change({ theme: { headingWeight } }, "weight")}
                  options={[
                    { value: 400, label: "Light" },
                    { value: 500, label: "Medium" },
                    { value: 700, label: "Bold" },
                  ]}
                />
              </Field>
              <label data-field="borders" className="flex items-center justify-between gap-3 text-[0.8rem] font-medium">
                Outline on cards
                <Switch checked={theme.borders} onCheckedChange={(borders) => change({ theme: { borders } }, "borders")} />
              </label>
            </More>
          </Section>

          <Section title="Navigation">
            <Field id="nav-layout" label="Menu position">
              <Segmented
                label="Menu position"
                value={theme.nav.layout}
                onChange={(layout) => change({ theme: { nav: { layout } } }, "nav-layout")}
                options={[
                  { value: "side", label: "Side" },
                  { value: "top", label: "Top" },
                ]}
              />
            </Field>
            <Field id="nav-style" label="Menu items">
              <Segmented
                label="Menu items"
                value={theme.nav.style}
                onChange={(style) => change({ theme: { nav: { style } } }, "nav-style")}
                options={[
                  { value: "labels", label: "Icons and names" },
                  { value: "icons", label: "Icons only" },
                ]}
              />
            </Field>
            {theme.nav.layout === "top" && (
              <Field id="nav-logo" label="Logo">
                <Segmented
                  label="Logo position"
                  value={theme.nav.logo}
                  onChange={(logo) => change({ theme: { nav: { logo } } }, "nav-logo")}
                  options={[
                    { value: "left", label: "Left" },
                    { value: "center", label: "Centre" },
                  ]}
                />
              </Field>
            )}
          </Section>

          <Section title="Menu and words">
            <p className="text-xs text-muted-foreground">Rename, reorder or hide what students see. Hidden items disappear from the menu and Home.</p>
            <div className="grid gap-1.5">
              <div data-field="menu-home" className="flex items-center gap-2 rounded-lg border p-1.5 pl-3">
                <span className="w-24 shrink-0 text-xs text-muted-foreground">Home</span>
                <Input
                  className="h-7"
                  value={coach.wording.home}
                  onChange={(e) => change({ content: { wording: { home: e.target.value } } }, "w-home")}
                  aria-label="Name for Home"
                />
                <span className="w-[4.75rem] shrink-0" />
              </div>
              {coach.menu.map((m, i) => (
                <div key={m} data-field={`menu-${m}`} className={cn("flex items-center gap-2 rounded-lg border p-1.5 pl-3", !coach.modules[m] && "bg-muted/50")}>
                  <span className={cn("w-24 shrink-0 text-xs text-muted-foreground", !coach.modules[m] && "line-through")}>{MODULE_NAMES[m]}</span>
                  <Input
                    className="h-7"
                    value={coach.wording[m]}
                    disabled={!coach.modules[m]}
                    onChange={(e) => change({ content: { wording: { [m]: e.target.value } } }, `w-${m}`)}
                    aria-label={`Name for ${MODULE_NAMES[m]}`}
                  />
                  <div className="flex shrink-0 items-center">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      disabled={i === 0}
                      aria-label={`Move ${MODULE_NAMES[m]} up`}
                      onClick={() => change({ content: { menu: move(coach.menu, i, -1) } }, `menu-${Date.now()}`)}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      disabled={i === coach.menu.length - 1}
                      aria-label={`Move ${MODULE_NAMES[m]} down`}
                      onClick={() => change({ content: { menu: move(coach.menu, i, 1) } }, `menu-${Date.now()}`)}
                    >
                      <ArrowDown />
                    </Button>
                    <Switch
                      size="sm"
                      className="ml-1"
                      checked={coach.modules[m]}
                      aria-label={`Show ${MODULE_NAMES[m]}`}
                      onCheckedChange={(on) => change({ content: { modules: { [m]: on } } }, `mod-${m}`)}
                    />
                  </div>
                </div>
              ))}
            </div>
            <More label="What you call things">
              <Field label="Your students are called">
                <div className="grid grid-cols-2 gap-2">
                  <Input value={coach.wording.student} onChange={(e) => change({ content: { wording: { student: e.target.value } } }, "w-student")} aria-label="Singular" />
                  <Input value={coach.wording.students} onChange={(e) => change({ content: { wording: { students: e.target.value } } }, "w-students")} aria-label="Plural" />
                </div>
              </Field>
              <Field label="A lesson is called">
                <Input value={coach.wording.lesson} onChange={(e) => change({ content: { wording: { lesson: e.target.value } } }, "w-lesson")} />
              </Field>
            </More>
          </Section>

          <div className="m-4 rounded-xl bg-muted/60 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Wand2 className="size-4" /> Want it to look exactly like your brand?
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Our designers can build your own design on top of these settings.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => toast("Design packages open from Settings → Our subscription.")}>
              See design packages
            </Button>
          </div>
        </div>
        </RevealContext.Provider>

        {/* Live preview */}
        <div className="grid min-h-[70svh] grid-rows-[auto_1fr] bg-muted/50 lg:min-h-0">
          <div className="flex flex-wrap items-center gap-2 border-b bg-background/70 px-4 py-2">
            <Segmented
              label="Preview size"
              value={device}
              onChange={setDevice}
              options={[
                { value: "desktop", label: <><Monitor className="size-3.5" /> Desktop</> },
                { value: "phone", label: <><Smartphone className="size-3.5" /> Phone</> },
              ]}
            />
            <select
              value={page}
              onChange={(e) => setPage(e.target.value)}
              className="h-8 rounded-lg border bg-background px-2 text-sm"
              aria-label="Page to preview"
            >
              {pages.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <Segmented
              label="Clicking in the preview"
              value={pick.mode}
              onChange={pick.setMode}
              options={[
                { value: "select", label: <><MousePointerClick className="size-3.5" /> Click to edit</> },
                { value: "browse", label: <><Eye className="size-3.5" /> Browse</> },
              ]}
            />
            <span className="ml-auto hidden text-xs text-muted-foreground xl:inline">
              {pick.mode === "select" ? "Click any part of your platform to change it" : `What students will see${dirty ? " after you publish" : ""}`}
            </span>
          </div>
          <PreviewFrame src={src} device={device} frameRef={frameRef} />
        </div>
      </div>
    </div>
  )
}

/**
 * Click-to-edit between the panel and the preview frame: a click in the
 * preview opens, scrolls to and flashes the matching settings; hovering a
 * setting in the panel outlines what it changes in the preview.
 */
function usePreviewPick() {
  const frame = useRef<HTMLIFrameElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<"select" | "browse">("select")
  const [reveal, setReveal] = useState<{ fields: string[]; n: number }>({ fields: [], n: 0 })
  const shown = useRef("")

  useEffect(() => {
    const send = (m: PickMessage) => frame.current?.contentWindow?.postMessage(m, window.location.origin)
    send({ type: "design-pick-mode", on: mode === "select" })
    const onMessage = (e: MessageEvent<PickMessage>) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return
      const m = e.data
      if (m?.type === "design-pick-ready") send({ type: "design-pick-mode", on: mode === "select" })
      if (m?.type === "design-pick") setReveal((r) => ({ fields: describe(m.target).fields, n: r.n + 1 }))
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [mode])

  // After the folded parts have opened: scroll to the first setting and flash them all.
  useEffect(() => {
    if (!reveal.n) return
    const id = requestAnimationFrame(() => {
      const els = reveal.fields.flatMap((f) => [...(panel.current?.querySelectorAll<HTMLElement>(`[data-field="${f}"]`) ?? [])])
      els[0]?.scrollIntoView({ behavior: "smooth", block: "center" })
      for (const el of els) {
        el.animate(
          [
            { outline: "2px solid #ff5500", outlineOffset: "6px", borderRadius: "4px" },
            { outline: "2px solid #ff550000", outlineOffset: "6px", borderRadius: "4px" },
          ],
          { duration: 1600, easing: "ease-in" },
        )
      }
      if (reveal.fields[0]?.startsWith("menu-")) els[0]?.querySelector<HTMLInputElement>("input:not(:disabled)")?.select()
    })
    return () => cancelAnimationFrame(id)
  }, [reveal])

  const show = (targets: PickTarget[]) => {
    const key = targets.join()
    if (key === shown.current) return
    shown.current = key
    frame.current?.contentWindow?.postMessage({ type: "design-show", targets } satisfies PickMessage, window.location.origin)
  }

  return {
    frameRef: frame,
    panelRef: panel,
    mode,
    setMode,
    reveal,
    onPanelHover: (e: React.PointerEvent) => {
      if (mode !== "select") return
      const field = (e.target as Element).closest("[data-field]")?.getAttribute("data-field")
      show(field ? targetsForField(field) : [])
    },
    onPanelLeave: () => show([]),
  }
}

function move<T>(list: T[], i: number, by: number) {
  const next = [...list]
  const [item] = next.splice(i, 1)
  next.splice(i + by, 0, item)
  return next
}

function Section({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(!!defaultOpen)
  const ref = useRef<HTMLElement>(null)
  useReveal(ref, () => setOpen(true))
  return (
    <section ref={ref} className="border-b">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between px-4 py-3.5 text-sm font-semibold hover:bg-muted/50">
        {title}
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      <div hidden={!open} className="grid gap-5 px-4 pt-1 pb-5">
        {children}
      </div>
    </section>
  )
}

/** Mini preview of a template, drawn with that template's real theme. */
function TemplateCard({ id, selected, primary, onSelect }: { id: TemplateId; selected: boolean; primary: string; onSelect: () => void }) {
  const t = { ...TEMPLATES[id].theme, primary, primaryForeground: onColor(primary) }
  const scope = `.tpl-${id}`
  return (
    <button onClick={onSelect} aria-pressed={selected} className={cn("grid gap-1.5 rounded-lg p-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring", selected && "ring-2 ring-foreground")}>
      <style dangerouslySetInnerHTML={{ __html: themeToCss(t, scope) }} />
      <span className={`tpl-${id} ${t.mode === "light" ? "light" : ""} grid aspect-[4/3] content-start gap-1.5 overflow-hidden rounded-[min(var(--radius),8px)] bg-background p-2 ring-1 ring-black/10`}>
        <span className="h-1.5 w-8 rounded-full bg-foreground/70" />
        <span className="grid gap-1 rounded-[min(var(--radius),6px)] bg-card p-1.5" style={{ boxShadow: "var(--card-shadow)" }}>
          <span className="h-1 w-10 rounded-full bg-foreground/40" />
          <span className="h-2 w-7 rounded-[var(--button-radius)] bg-primary" />
        </span>
      </span>
      <span className="px-0.5 text-xs font-medium">{TEMPLATES[id].name}</span>
    </button>
  )
}

function LogoField({
  logo,
  mark,
  primary,
  onLogo,
  onColor: pickColor,
}: {
  logo?: string
  mark: string
  primary: string
  onLogo: (logo: string | undefined) => void
  onColor: (c: string) => void
}) {
  const [suggested, setSuggested] = useState<string[]>([])
  const input = useRef<HTMLInputElement>(null)

  const onFile = async (file: File) => {
    const url = await new Promise<string>((res) => {
      const r = new FileReader()
      r.onload = () => res(r.result as string)
      r.readAsDataURL(file)
    })
    const small = await shrink(url, 256)
    onLogo(small)
    setSuggested(await colorsFromLogo(small))
  }

  return (
    <Field id="logo" label="Logo" hint="PNG or SVG, square works best">
      <div className="flex items-center gap-3">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="Your logo" className="size-12 rounded-lg border object-contain p-1" />
        ) : (
          <span className="grid size-12 place-items-center rounded-lg text-sm font-semibold" style={{ background: primary, color: onColor(primary) }}>
            {mark}
          </span>
        )}
        <div className="flex flex-wrap gap-1.5">
          <Button variant="outline" size="sm" onClick={() => input.current?.click()}>
            <ImagePlus /> {logo ? "Replace" : "Upload logo"}
          </Button>
          {logo && (
            <Button variant="ghost" size="sm" onClick={() => { onLogo(undefined); setSuggested([]) }} aria-label="Remove logo">
              <Trash2 />
            </Button>
          )}
        </div>
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onFile(f)
            e.target.value = ""
          }}
        />
      </div>
      {suggested.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-muted/60 p-2 text-xs">
          <span className="text-muted-foreground">Colours from your logo</span>
          {suggested.map((c) => (
            <button key={c} onClick={() => pickColor(c)} className="size-6 rounded-full ring-1 ring-black/10" style={{ background: c }} aria-label={`Use ${c}`} />
          ))}
        </div>
      )}
    </Field>
  )
}

async function shrink(dataUrl: string, max: number) {
  if (dataUrl.startsWith("data:image/svg")) return dataUrl
  const img = new Image()
  img.src = dataUrl
  await img.decode()
  const s = Math.min(1, max / Math.max(img.width, img.height))
  const c = document.createElement("canvas")
  c.width = Math.round(img.width * s)
  c.height = Math.round(img.height * s)
  c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height)
  return c.toDataURL("image/png")
}
