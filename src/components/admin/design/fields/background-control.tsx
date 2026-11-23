"use client"

import { useRef, useState } from "react"
import { toast } from "@/lib/toast"
import { ImagePlus } from "@/components/icons"
import { pictureFrom } from "@/lib/images"
import { BACKDROPS, minDimOf } from "@/lib/theme/backdrops"
import type { BackgroundStyle, CoachTheme } from "@/lib/theme/types"
import { cn } from "@/lib/utils"
import { Callout } from "@/components/admin/ui"
import { Field, Segmented, SliderField } from "./controls"
import { SelectionCard } from "./choice-cards"
import { card } from "../states"

type Patch = Partial<Pick<CoachTheme, "background" | "bgImage" | "bgDim" | "bgBlur" | "bgWhere" | "bgAngle">>
const KIND = (b: BackgroundStyle) => (b === "grid" || b === "glow" || b === "dots" ? "texture" : b)

/**
 * The platform background, shared by the Design editor and the setup wizard
 * so both offer exactly the same choices. Plain stays the default.
 */
export function BackgroundControl({ theme, onChange, where = true }: { theme: CoachTheme; onChange: (p: Patch, key: string) => void; /** Offer "Where it shows" (the platform); the Join screens are one place, so they leave it out. */ where?: boolean }) {
  const file = useRef<HTMLInputElement>(null)
  const kind = KIND(theme.background)
  const [error, setError] = useState<string | null>(null)
  const uploaded = theme.bgImage && !theme.bgImage.startsWith("preset:") ? theme.bgImage : undefined

  return (
    <div className="grid gap-4">
      {/* Figma Style · 05 Background: four cards that show what each background does, the page's colour, a texture, the brand's gradient or a picture. */}
      <div role="radiogroup" aria-label="Background style" data-field="background" className="grid grid-cols-2 gap-2">
        {(
          [
            { k: "plain", name: "Plain", text: "Just your page colour" },
            { k: "texture", name: "Texture", text: "Grid, dots or glow" },
            { k: "gradient", name: "Gradient", text: "From your brand colours" },
            { k: "image", name: "Image", text: "Your picture or ours" },
          ] as const
        ).map((c) => (
          <SelectionCard
            key={c.k}
            checked={kind === c.k}
            title={c.name}
            description={c.text}
            media={<BackgroundArt kind={c.k} />}
            onSelect={() =>
              kind !== c.k &&
              onChange(c.k === "texture" ? { background: "grid" } : c.k === "image" ? { background: "image", bgImage: theme.bgImage ?? "preset:candles" } : { background: c.k as BackgroundStyle }, "bg-kind")
            }
          />
        ))}
      </div>

      {kind === "texture" && (
        <Segmented
          label="Texture"
          value={theme.background}
          onChange={(background) => onChange({ background }, "bg-texture")}
          options={[
            { value: "grid", label: "Grid lines" },
            { value: "dots", label: "Dots" },
            { value: "glow", label: "Glow" },
          ]}
        />
      )}

      {kind === "gradient" && (
        <SliderField label="Direction" value={theme.bgAngle ?? 160} min={0} max={360} step={5} unit="°" onChange={(bgAngle) => onChange({ bgAngle }, "bg-angle")} />
      )}

      {kind === "image" && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {BACKDROPS.map((b) => (
              <button
                key={b.id}
                onClick={() => onChange({ bgImage: `preset:${b.id}` }, "bg-image")}
                aria-pressed={theme.bgImage === `preset:${b.id}`}
                className={cn("grid gap-1 p-1 text-left t-caption", card(theme.bgImage === `preset:${b.id}`))}
              >
                {/* Exception: #0b0c10 is the student page ground under the background thumbnail, not an Admin colour. */}
                <span className="aspect-[4/3] rounded-[4px] bg-[#0b0c10] ring-1 ring-white/10" style={{ backgroundImage: b.css, backgroundSize: "cover", backgroundPosition: "center" }} />
                <span className="truncate px-0.5 text-muted-foreground">{b.name}</span>
              </button>
            ))}
            <button
              onClick={() => file.current?.click()}
              aria-pressed={!!uploaded}
              className={cn("grid gap-1 p-1 text-left t-caption", card(!!uploaded))}
            >
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
                // Figma Style · 05b Background · Image too small: too small stays soft on a big screen, so it is refused with the minimum (1600 px wide).
                const size = await imageSize(f)
                if (size && size.w < 1600) return setError(`This image is ${size.w} × ${size.h} px. Use one at least 1600 px wide so it stays sharp.`)
                setError(null)
                // At most 1600px wide, as a JPEG, so pages load fast.
                onChange({ bgImage: await pictureFrom(f, { max: 1600, side: "width", quality: 0.8, keep: [] }) }, "bg-image")
              } catch (err) {
                toast.error((err as Error).message)
              }
            }}
          />
          {error && <Callout tone="danger" role="alert">{error}</Callout>}
          <SliderField
            label="Readability"
            value={Math.max(minDimOf(theme), theme.bgDim ?? 70)}
            min={minDimOf(theme)}
            max={95}
            unit="%"
            format={(v) => `${v}% page colour on top`}
            onChange={(bgDim) => onChange({ bgDim }, "bg-dim")}
          />
          <SliderField label="Blur" value={theme.bgBlur ?? 0} min={0} max={24} unit="px" onChange={(bgBlur) => onChange({ bgBlur }, "bg-blur")} />
        </>
      )}

      {where && kind !== "plain" && (
        <Field label="Where it shows">
          <Segmented
            label="Where the background shows"
            value={theme.bgWhere ?? "all"}
            onChange={(bgWhere) => onChange({ bgWhere }, "bg-where")}
            options={[
              { value: "all", label: "Every page" },
              { value: "home", label: "Home" },
              { value: "login", label: "Login" },
            ]}
          />
        </Field>
      )}
      {(kind === "texture" || kind === "gradient") && <p className="t-caption text-muted-foreground">Text stays readable on this background.</p>}
      {kind === "image" && <p className="t-caption text-muted-foreground">Cards and menus stay solid, so text and charts are always readable. Large images are made smaller for fast loading.</p>}
    </div>
  )
}

/** The little scene on a background card: a page card over plain, dots, the brand gradient or a dusk picture (Figma Admin / Editor Background art). */
function BackgroundArt({ kind }: { kind: "plain" | "texture" | "gradient" | "image" }) {
  return (
    <span aria-hidden className="relative block h-[69px] overflow-hidden rounded-a-md border border-a-border-subtle bg-a-page">
      {kind === "plain" && <span className="absolute inset-0 bg-a-raised" />}
      {kind === "texture" && <span className="absolute inset-0 opacity-70" style={{ backgroundImage: "radial-gradient(circle, var(--admin-color-text-tertiary) 1px, transparent 1.5px)", backgroundSize: "9px 9px" }} />}
      {kind === "gradient" && <span className="absolute inset-0 opacity-90" style={{ backgroundImage: "linear-gradient(135deg, var(--admin-color-brand-gradient-start), var(--admin-color-brand-gradient-end))" }} />}
      {kind === "image" && (
        <>
          <span className="absolute inset-0" style={{ backgroundImage: "linear-gradient(180deg, var(--admin-color-bg-page) 5%, var(--admin-color-brand-gradient-start) 80%, var(--admin-color-brand-gradient-end))" }} />
          <span className="absolute top-2 right-4 size-4 rounded-full bg-a-accent-strong" />
          <span className="absolute -bottom-6 -left-4 h-16 w-24 rounded-full bg-a-text-3 opacity-80" />
          <span className="absolute -right-4 -bottom-7 h-16 w-24 rounded-full bg-a-raised" />
        </>
      )}
      <span className="absolute bottom-2.5 left-1/2 grid h-[22px] w-10 -translate-x-1/2 content-center gap-1 rounded-a-sm bg-a-panel px-1.5">
        <span className="h-[3px] w-5 rounded-full bg-a-text-3" />
        <span className="h-1 w-3 rounded-full bg-a-accent-strong" />
      </span>
    </span>
  )
}

/** A picture's size in pixels, read before it is kept. */
function imageSize(file: File): Promise<{ w: number; h: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => (URL.revokeObjectURL(url), resolve({ w: img.naturalWidth, h: img.naturalHeight }))
    img.onerror = () => (URL.revokeObjectURL(url), resolve(null))
    img.src = url
  })
}
