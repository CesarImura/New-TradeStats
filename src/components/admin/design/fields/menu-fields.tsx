"use client"
import { MODULE_NAMES, move, useDesign } from "./design-context"
import { useRef } from "react"
import { ArrowDown, ArrowUp, ImagePlus, Pencil, X } from "@/components/icons"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { isPageId, type ModuleId } from "@/lib/data/coaches"
import { themeVars } from "@/lib/theme/css"
import { pictureFrom } from "@/lib/images"
import { BACKDROPS, NAV_MIN_DIM } from "@/lib/theme/backdrops"
import { widgetSetOf, type CoachTheme, type NavFill, type NavMarker } from "@/lib/theme/types"
import { brandMenuReads, navFillOf } from "@/lib/theme/nav-fill"
import { cn } from "@/lib/utils"
import { Field, Segmented, SliderField } from "./controls"
import { FixedFirst, HIDDEN_INPUT, menuRow, SWITCH_OFF, SortableMenu, SortHandle, SortHint, useSort } from "./menu-sort"
import { AddPageButton, PageRow } from "./pages-field"
import { card } from "../states"

/* ---------- Menu ---------- */

export function NavLayoutField() {
  const { theme, change } = useDesign()
  return (
    <Field id="nav-layout" label="Menu">
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
  )
}

export function NavStyleField() {
  const { theme, change } = useDesign()
  return (
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
  )
}

export function NavFrameField() {
  const { theme, change } = useDesign()
  return (
    <Field id="nav-frame" label="Page frame" hint={theme.nav.frame === "floating" ? "Pages float on the menu's colour" : "Menu and page are one surface"}>
      <Segmented
        label="Menu frame"
        value={theme.nav.frame ?? "classic"}
        onChange={(frame) => change({ theme: { nav: { frame } } }, "nav-frame")}
        options={[
          { value: "classic", label: "Classic" },
          { value: "floating", label: "Floating" },
        ]}
      />
    </Field>
  )
}

/** How widgets sit on the page: one card each, or open on the page (Blended). Part of Layout; the card surface (raised, grey, outline) is Widgets. */
export function LayoutWidgetsField() {
  const { theme, change } = useDesign()
  return (
    <Field id="layout-widgets" label="Widgets">
      <Segmented
        label="Widgets"
        value={widgetSetOf(theme) === "open" ? "open" : "cards"}
        onChange={(widgetSet) => change({ theme: { widgetSet } }, "widget-set")}
        options={[
          { value: "cards", label: "Cards" },
          { value: "open", label: "Blended" },
        ]}
      />
    </Field>
  )
}

/** The menu's background: the page colour (as it is), a wash of the brand, the brand colour, or nothing. Brand only when its text reads on it. */
export function NavFillField() {
  const { theme, change } = useDesign()
  const now = navFillOf(theme)
  const options: { value: NavFill; label: string; hint: string }[] = [
    { value: "page", label: "Page", hint: "The same colour as the page" },
    { value: "tint", label: "Tinted", hint: "A light wash of your brand colour" },
    ...(brandMenuReads(theme) ? [{ value: "brand" as const, label: "Brand", hint: "Your brand colour, with text that reads on it" }] : []),
    { value: "clear", label: "Clear", hint: "No fill and no line: the page background shows through" },
  ]
  return (
    <Field id="nav-fill" label="Menu background">
      <Segmented label="Menu background" value={now} onChange={(fill) => change({ theme: { nav: { fill } } }, "nav-fill")} options={options} />
    </Field>
  )
}

/** The open page's marker in the menu, drawn on a small menu: Soft, Pill, Brand, Rail or Editorial. */
const MARKERS: { value: NavMarker; label: string }[] = [
  { value: "soft", label: "Soft" },
  { value: "pill", label: "Pill" },
  { value: "brand", label: "Brand" },
  { value: "rail", label: "Rail" },
  { value: "editorial", label: "Editorial" },
]
const markerLine: Record<NavMarker, string> = {
  soft: "rounded-[3px] bg-[color-mix(in_oklab,var(--a-ink)_15%,transparent)]",
  pill: "rounded-full bg-[color-mix(in_oklab,var(--a-accent)_25%,transparent)]",
  brand: "rounded-[3px] bg-[var(--a-accent)]",
  rail: "rounded-r-[3px] border-l-2 border-[var(--a-accent)] bg-transparent",
  editorial: "rounded-none border-b border-[color-mix(in_oklab,var(--a-ink)_50%,transparent)] bg-transparent",
}
export function NavMarkerField() {
  const { theme, change } = useDesign()
  const now = theme.nav.marker ?? "soft"
  // The little menus are drawn in the draft's own colours (light or dark), not the editor's.
  const v = themeVars(theme) as Record<string, string>
  const well = { "--a-ink": v["--foreground"], "--a-accent": v["--brand-mark"] ?? v["--primary"], backgroundColor: v["--background"] } as React.CSSProperties
  return (
    <div data-field="nav-marker" className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Menu style">
      {MARKERS.map((m) => (
        <button key={m.value} type="button" role="radio" aria-checked={now === m.value} onClick={() => change({ theme: { nav: { marker: m.value } } }, "nav-marker")} className={cn("grid gap-1.5 p-1.5 text-left", card(now === m.value))}>
          <span style={well} className="grid aspect-[16/10] content-center gap-1.5 rounded-[4px] px-3 ring-1 ring-black/10">
            <span className="h-1.5 w-3/4 rounded-full bg-[color-mix(in_oklab,var(--a-ink)_20%,transparent)]" />
            <span className={cn("h-2.5 w-full", markerLine[m.value])} />
            <span className="h-1.5 w-2/3 rounded-full bg-[color-mix(in_oklab,var(--a-ink)_20%,transparent)]" />
          </span>
          <span className="px-0.5 t-caption-medium">{m.label}</span>
        </button>
      ))}
    </div>
  )
}

export function NavSearchField() {
  const { theme, change } = useDesign()
  return (
    <Field id="nav-search" label="Search in the menu">
      <Segmented
        label="Search in the menu"
        value={theme.nav.search === false ? "no" : "yes"}
        onChange={(v) => change({ theme: { nav: { search: v === "yes" } } }, "nav-search")}
        options={[
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ]}
      />
    </Field>
  )
}

export function NavSignOutField() {
  const { theme, change } = useDesign()
  return (
    <Field id="nav-signout" label="Log out" hint={theme.nav.signOut === "menu" ? "A row at the foot of the side menu, and in the account menu" : "In the account menu, under the avatar"}>
      <Segmented
        label="Log out"
        value={theme.nav.signOut ?? "account"}
        onChange={(signOut) => change({ theme: { nav: { signOut } } }, "nav-signout")}
        options={[
          { value: "account", label: "Account menu" },
          { value: "menu", label: "In the menu" },
        ]}
      />
    </Field>
  )
}

/** A picture on the menu: the library's, or the coach's own, with how much of the menu colour covers it. */
export function NavImageField() {
  const { theme, change } = useDesign()
  const file = useRef<HTMLInputElement>(null)
  const image = theme.nav.image
  const uploaded = image && !image.startsWith("preset:") ? image : undefined
  const set = (patch: Partial<CoachTheme["nav"]>, key: string) => change({ theme: { nav: patch } }, key)
  return (
    <Field id="nav-image" label="Menu image">
      <div className="grid gap-3">
        <div className="grid grid-cols-3 gap-2">
          {BACKDROPS.map((b) => (
            <button key={b.id} type="button" onClick={() => set({ image: `preset:${b.id}` }, "nav-image")} aria-pressed={image === `preset:${b.id}`} className={cn("grid gap-1 p-1 text-left t-caption", card(image === `preset:${b.id}`))}>
              {/* Exception: #0b0c10 is the student page ground under the background thumbnail, not an Admin colour. */}
              <span className="aspect-[4/3] rounded-[4px] bg-[#0b0c10] ring-1 ring-white/10" style={{ backgroundImage: b.css, backgroundSize: "cover", backgroundPosition: "center" }} />
              <span className="truncate px-0.5 text-muted-foreground">{b.name}</span>
            </button>
          ))}
          <button type="button" onClick={() => file.current?.click()} aria-pressed={!!uploaded} className={cn("grid gap-1 p-1 text-left t-caption", card(!!uploaded))}>
            <span className="grid aspect-[4/3] place-items-center rounded-[4px] border border-dashed bg-cover bg-center" style={uploaded ? { backgroundImage: `url("${uploaded}")` } : undefined}>
              {!uploaded && <ImagePlus className="size-4 text-muted-foreground" />}
            </span>
            <span className="truncate px-0.5 text-muted-foreground">{uploaded ? "Yours" : "Upload"}</span>
          </button>
        </div>
        <input
          ref={file}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ""
            if (!f) return
            try {
              set({ image: await pictureFrom(f, { max: 800, side: "width", quality: 0.8, keep: [] }) }, "nav-image")
            } catch (err) {
              toast.error((err as Error).message)
            }
          }}
        />
        {image && (
          <>
            <SliderField label="Image covered by" value={Math.max(NAV_MIN_DIM, theme.nav.imageDim ?? 80)} min={NAV_MIN_DIM} max={95} unit="%" onChange={(imageDim) => set({ imageDim }, "nav-image-dim")} />
            <button type="button" onClick={() => set({ image: undefined, imageDim: undefined }, "nav-image")} className="flex h-7 w-fit items-center gap-1.5 t-caption text-muted-foreground hover:text-foreground">
              <X className="size-3.5" /> No image
            </button>
          </>
        )}
      </div>
    </Field>
  )
}

export function NavLogoField() {
  const { theme, change } = useDesign()
  if (theme.nav.layout !== "top") return null
  return (
    <Field id="nav-logo" label="Logo position">
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
  )
}

/**
 * One menu item: rename it, move it, switch it off. `home` can only be renamed. In Design's sortable list a row
 * moves by its handle (menu-sort.tsx); elsewhere (no handle) by its arrows.
 */
export function MenuRow({ id }: { id: string }) {
  const { coach, change, openPage } = useDesign()
  const sort = useSort()
  /** The way to the page itself: a pencil that opens it on the canvas, to arrange and edit its widgets. */
  const edit = (page: string, name: string) =>
    openPage && (
      <Button variant="ghost" size="icon" style={{ width: 36, height: 36 }} className="size-9 shrink-0 bg-a-muted hover:bg-a-selected" aria-label={`Edit the ${name} page`} title={`Edit the ${name} page`} onClick={() => openPage(page)}>
        <Pencil className="size-[1.125rem]" />
      </Button>
    )
  if (id === "home")
    return (
      <div data-field="menu-home" className={cn(menuRow(), "gap-2.5 py-1.5 pr-1.5")}>
        <FixedFirst />
        <Input className="h-9 min-w-0 flex-1" value={coach.wording.home} onChange={(e) => change({ content: { wording: { home: e.target.value } } }, "w-home")} aria-label="Name for Home" />
        {edit("home", "Home")}
      </div>
    )
  if (isPageId(id)) return <PageRow id={id} />
  const m = id as ModuleId
  const i = coach.menu.indexOf(m)
  if (i < 0) return null
  return (
    <div data-field={`menu-${m}`} className={cn(menuRow(!coach.modules[m]), "gap-2.5 py-1.5 pr-1.5", !sort && "pl-2.5")}>
      <SortHandle />
      <Input
        className={cn("h-9 min-w-0 flex-1", HIDDEN_INPUT)}
        value={coach.wording[m]}
        disabled={!coach.modules[m]}
        onChange={(e) => change({ content: { wording: { [m]: e.target.value } } }, `w-${m}`)}
        aria-label={`Name for ${MODULE_NAMES[m]}`}
        // A renamed page keeps its own name in the tooltip, so "Desk" still reads as Charts.
        title={MODULE_NAMES[m]}
        placeholder={MODULE_NAMES[m]}
      />
      <div className="flex shrink-0 items-center gap-2">
        {coach.modules[m] && edit(m, MODULE_NAMES[m])}
        {!sort && (
          <>
            <Button variant="ghost" size="icon-xs" disabled={i === 0} aria-label={`Move ${MODULE_NAMES[m]} up`} onClick={() => change({ content: { menu: move(coach.menu, i, -1) } }, `menu-${Date.now()}`)}>
              <ArrowUp />
            </Button>
            <Button variant="ghost" size="icon-xs" disabled={i === coach.menu.length - 1} aria-label={`Move ${MODULE_NAMES[m]} down`} onClick={() => change({ content: { menu: move(coach.menu, i, 1) } }, `menu-${Date.now()}`)}>
              <ArrowDown />
            </Button>
          </>
        )}
        <Switch size="sm" className={cn("ml-1.5", SWITCH_OFF)} checked={coach.modules[m]} aria-label={`Show ${MODULE_NAMES[m]}`} onCheckedChange={(on) => change({ content: { modules: { [m]: on } } }, `mod-${m}`)} />
      </div>
    </div>
  )
}

export function MenuItemsField() {
  const { coach } = useDesign()
  return (
    <div className="grid gap-1.5">
      <SortHint />
      <MenuRow id="home" />
      <SortableMenu
        items={coach.menu}
        nameOf={(m) => (isPageId(m) ? (coach.customPages?.find((p) => `page:${p.id}` === m)?.name ?? "Page") : coach.wording[m as ModuleId])}
        row={(m) => <MenuRow id={m} />}
      />
      <AddPageButton />
    </div>
  )
}

export function WordingField() {
  const { coach, change } = useDesign()
  return (
    <div data-field="wording" className="grid gap-4">
      <Field label="Your students are called">
        <div className="grid grid-cols-2 gap-2">
          <Input value={coach.wording.student} onChange={(e) => change({ content: { wording: { student: e.target.value } } }, "w-student")} aria-label="Singular" />
          <Input value={coach.wording.students} onChange={(e) => change({ content: { wording: { students: e.target.value } } }, "w-students")} aria-label="Plural" />
        </div>
      </Field>
      <Field label="A lesson is called">
        <Input value={coach.wording.lesson} onChange={(e) => change({ content: { wording: { lesson: e.target.value } } }, "w-lesson")} />
      </Field>
    </div>
  )
}
