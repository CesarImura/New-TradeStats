"use client"
import { useDesign } from "./design-context"
import { useRef, useState } from "react"
import { Callout } from "@/components/admin/ui"
import { ImagePlus, Palette, Trash2 } from "@/components/icons"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { themeToCss } from "@/lib/theme/css"
import { onColor } from "@/lib/theme/derive"
import { pictureFrom } from "@/lib/images"
import { colorsFromLogo } from "@/lib/theme/logo-colors"
import { TEMPLATES, TEMPLATE_IDS } from "@/lib/theme/templates"
import { type TemplateId } from "@/lib/theme/types"
import { cn } from "@/lib/utils"
import { Field, More, Segmented, Swatches } from "./controls"
import { Swatch } from "./swatch"
import { BRAND_COLORS, FONT_PAIRS, HIGHLIGHT_COLORS } from "../options"
import { card } from "../states"
import { useConfirmSwitch } from "../editor/switch-look"

/* ---------- Brand ---------- */

export function TemplateField() {
  const { theme, working, commit } = useDesign()
  const [ask, dialog] = useConfirmSwitch()
  return (
    <Field id="template" label="Template" hint={TEMPLATES[theme.template].name}>
      <div className="grid grid-cols-3 gap-2">
        {TEMPLATE_IDS.map((id) => (
          <TemplateCard
            key={id}
            id={id}
            selected={theme.template === id}
            primary={theme.primary}
            onSelect={() =>
              theme.template !== id &&
              ask(TEMPLATES[id].name, () =>
                commit(
                  {
                    content: working.content,
                    theme: { template: id, primary: theme.primary, primaryForeground: theme.primaryForeground, highlight: working.theme.highlight },
                  },
                  "template",
                ),
              )
            }
          />
        ))}
      </div>
      <p className="t-caption text-muted-foreground">Switching keeps your name, logo, colours and menu. Style and layout start from the new template.</p>
      {dialog}
    </Field>
  )
}

/**
 * Import from your website (Figma Style · 13): the address, what to bring (colours, fonts, logo), then a result the coach reviews.
 * In the prototype the site is not read: the choices come from a sample worked out from the address, and the line says so.
 */
export function ImportSiteField() {
  const { change } = useDesign()
  const [url, setUrl] = useState("")
  const [what, setWhat] = useState({ colours: true, fonts: true })
  const [state, setState] = useState<"idle" | "loading" | "done">("idle")
  const host = url.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "")
  const run = () => {
    if (!host.includes(".")) return
    setState("loading")
    window.setTimeout(() => {
      const h = [...host].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
      if (what.colours) {
        const primary = BRAND_COLORS[h % BRAND_COLORS.length]
        change({ theme: { primary, primaryForeground: onColor(primary), highlight: HIGHLIGHT_COLORS[h % HIGHLIGHT_COLORS.length] } }, "import")
      }
      if (what.fonts) {
        const p = FONT_PAIRS[h % FONT_PAIRS.length]
        change({ theme: { fonts: { heading: p.heading, body: p.body, label: p.label } } }, "import")
      }
      setState("done")
    }, 700)
  }
  return (
    <More label="Import from your website">
    <div data-field="import-site" className="grid gap-3">
      <Field id="import-site" label="Website" hint="Colours and fonts">
        <div className="flex items-center gap-2">
          <Input aria-label="Website" placeholder="yourcoaching.com" value={url} onChange={(e) => (setUrl(e.target.value), setState("idle"))} onKeyDown={(e) => e.key === "Enter" && run()} className="min-w-0 flex-1" />
          <Button variant="outline" onClick={run} disabled={!host.includes(".") || state === "loading"}>
            {state === "loading" ? "Reading…" : "Import"}
          </Button>
        </div>
      </Field>
      <div role="group" aria-label="What to import" className="flex flex-wrap gap-2">
        {(["colours", "fonts"] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={what[k]}
            onClick={() => (setWhat({ ...what, [k]: !what[k] }), setState("idle"))}
            className={cn("h-9 rounded-full border px-4 t-body-m capitalize outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-a-border-focus", what[k] ? "border-a-border-active bg-a-raised text-a-text" : "border-a-border text-a-text-2 hover:border-a-border-strong")}
          >
            {k}
          </button>
        ))}
      </div>
      {state === "done" && (
        <Callout tone="success" aria-live="polite">
          Imported {what.colours && "a brand and highlight colour"}
          {what.colours && what.fonts && " and "}
          {what.fonts && "a font pair"} from {host}. Review them below. (Sample import in the prototype.)
        </Callout>
      )}
      {state === "idle" && !host && <span className="t-caption text-a-text-3">Your site&apos;s colours and fonts are a good start. You review them before they apply.</span>}
    </div>
    </More>
  )
}

export function NameField() {
  const { coach, change } = useDesign()
  return (
    <Field id="name" label="Platform name">
      <Input aria-label="Platform name" value={coach.name} onChange={(e) => change({ content: { name: e.target.value } }, "name")} />
    </Field>
  )
}

export function LogoField() {
  const { coach, theme, change } = useDesign()
  const [suggested, setSuggested] = useState<string[]>([])
  const input = useRef<HTMLInputElement>(null)
  const onLogo = (logo: string | undefined) => change({ content: { logo } }, "logo")
  const pickColor = (c: string) => change({ theme: { primary: c, primaryForeground: onColor(c) } }, "primary")

  const [logoError, setLogoError] = useState<string | null>(null)
  const onFile = async (file: File) => {
    // Figma Style · 14: a file over 2 MB is refused with the limit (the picture is kept small anyway).
    if (file.size > 2 * 1024 * 1024) return setLogoError(`That file is ${(file.size / 1048576).toFixed(1)} MB. Use a PNG or SVG under 2 MB.`)
    setLogoError(null)
    let small: string
    try {
      small = await pictureFrom(file, { max: 256, type: "image/png", keep: ["svg"] })
    } catch (err) {
      toast.error((err as Error).message)
      return
    }
    onLogo(small)
    setSuggested(await colorsFromLogo(small))
  }

  return (
    <Field id="logo" label="Logo" hint="Square PNG or SVG">
      <div className="flex items-center gap-3">
        {coach.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coach.logo} alt="Your logo" className="size-10 rounded-[6px] border object-contain p-1" />
        ) : (
          <span className="grid size-10 place-items-center rounded-[6px] t-body-l-medium" style={{ background: theme.primary, color: onColor(theme.primary) }}>
            {coach.mark}
          </span>
        )}
        <div className="flex flex-wrap gap-1.5">
          <Button variant="outline" size="sm" onClick={() => input.current?.click()}>
            <ImagePlus /> {coach.logo ? "Replace" : "Upload logo"}
          </Button>
          {/* Its colours again, for a logo uploaded before (they show by themselves after an upload). */}
          {coach.logo && !suggested.length && (
            <Button variant="ghost" size="sm" onClick={async () => setSuggested(await colorsFromLogo(coach.logo!))} title="Use a colour from your logo">
              <Palette /> Colours
            </Button>
          )}
          {coach.logo && (
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
      {logoError && <Callout tone="danger" role="alert">{logoError}</Callout>}
      {suggested.length > 0 && (
        <div className="flex items-center gap-2 rounded-[4px] bg-muted p-2 t-caption">
          <span className="text-muted-foreground">From your logo</span>
          {suggested.map((c) => (
            <Swatch key={c} onClick={() => pickColor(c)} color={c} aria-label={`Use ${c}`} />
          ))}
        </div>
      )}
    </Field>
  )
}

export function PrimaryField() {
  const { theme, change } = useDesign()
  return (
    <Field id="primary" label="Brand colour">
      <Swatches label="Brand colour" value={theme.primary} colors={BRAND_COLORS} onChange={(c) => change({ theme: { primary: c, primaryForeground: onColor(c) } }, "primary")} />
    </Field>
  )
}

export function HighlightField() {
  const { theme, change } = useDesign()
  return (
    <Field id="highlight" label="Highlight colour">
      <Swatches
        label="Highlight colour"
        value={theme.highlight ?? theme.palettes[theme.mode].highlight}
        colors={HIGHLIGHT_COLORS}
        onChange={(c) => change({ theme: { highlight: c } }, "highlight")}
      />
    </Field>
  )
}

export function ModeField() {
  const { theme, change } = useDesign()
  return (
    <Field id="mode" label="Light or dark">
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
  )
}

/** Mini preview of a template, drawn with that template's real theme. */
export function TemplateCard({ id, selected, primary, onSelect }: { id: TemplateId; selected: boolean; primary: string; onSelect: () => void }) {
  const t = { ...TEMPLATES[id].theme, primary, primaryForeground: onColor(primary) }
  const scope = `.tpl-${id}`
  return (
    <button
      onClick={onSelect}
      aria-pressed={selected}
      className={cn("grid gap-1.5 p-1 text-left", card(selected))}
    >
      <style dangerouslySetInnerHTML={{ __html: themeToCss(t, scope) }} />
      <span className={`tpl-${id} ${t.mode === "light" ? "light" : ""} grid aspect-[4/3] content-start gap-1.5 overflow-hidden rounded-[min(var(--radius),6px)] bg-background p-2 ring-1 ring-black/10`}>
        <span className="h-1.5 w-8 rounded-full bg-foreground/70" />
        <span className="grid gap-1 rounded-[min(var(--radius),6px)] bg-card p-1.5" style={{ boxShadow: "var(--card-shadow)" }}>
          <span className="h-1 w-10 rounded-full bg-foreground/40" />
          <span className="h-2 w-7 rounded-[var(--button-radius)] bg-primary" />
        </span>
      </span>
      <span className="px-0.5 t-caption-medium">{TEMPLATES[id].name}</span>
    </button>
  )
}
