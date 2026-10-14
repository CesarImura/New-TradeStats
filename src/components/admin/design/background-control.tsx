"use client"

import { useRef } from "react"
import { ImagePlus } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { BACKDROPS, MIN_DIM } from "@/lib/theme/backdrops"
import type { BackgroundStyle, CoachTheme } from "@/lib/theme/types"
import { cn } from "@/lib/utils"
import { Field, Segmented } from "./controls"

type Patch = Partial<Pick<CoachTheme, "background" | "bgImage" | "bgDim" | "bgBlur" | "bgWhere" | "bgAngle">>
const KIND = (b: BackgroundStyle) => (b === "grid" || b === "glow" || b === "dots" ? "texture" : b)

/**
 * The platform background, shared by the Design editor and the setup wizard
 * so both offer exactly the same choices. Plain stays the default.
 */
export function BackgroundControl({ theme, onChange }: { theme: CoachTheme; onChange: (p: Patch, key: string) => void }) {
  const file = useRef<HTMLInputElement>(null)
  const kind = KIND(theme.background)
  const uploaded = theme.bgImage && !theme.bgImage.startsWith("preset:") ? theme.bgImage : undefined
  const num = (v: number | readonly number[]) => (Array.isArray(v) ? v[0] : (v as number))

  return (
    <div className="grid gap-4">
      <Field label="Background">
        <Segmented
          label="Background"
          value={kind}
          onChange={(k) =>
            onChange(
              k === "texture" ? { background: "grid" } : k === "image" ? { background: "image", bgImage: theme.bgImage ?? "preset:candles" } : { background: k as BackgroundStyle },
              "bg-kind",
            )
          }
          options={[
            { value: "plain", label: "Plain" },
            { value: "texture", label: "Texture" },
            { value: "gradient", label: "Gradient" },
            { value: "image", label: "Image" },
          ]}
        />
      </Field>

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
        <Field label="Direction" hint="From your brand and highlight colours">
          <Slider value={[theme.bgAngle ?? 160]} min={0} max={360} step={5} onValueChange={(v) => onChange({ bgAngle: num(v) }, "bg-angle")} aria-label="Gradient direction" />
        </Field>
      )}

      {kind === "image" && (
        <>
          <div className="grid grid-cols-3 gap-1.5">
            {BACKDROPS.map((b) => (
              <button
                key={b.id}
                onClick={() => onChange({ bgImage: `preset:${b.id}` }, "bg-image")}
                aria-pressed={theme.bgImage === `preset:${b.id}`}
                className={cn("grid gap-1 rounded-md p-0.5 text-left text-[0.7rem]", theme.bgImage === `preset:${b.id}` && "ring-2 ring-foreground")}
              >
                <span className="aspect-[4/3] rounded-[4px] bg-[#0b0c10] ring-1 ring-white/10" style={{ backgroundImage: b.css, backgroundSize: "cover", backgroundPosition: "center" }} />
                <span className="truncate px-0.5 text-muted-foreground">{b.name}</span>
              </button>
            ))}
            <button
              onClick={() => file.current?.click()}
              aria-pressed={!!uploaded}
              className={cn("grid gap-1 rounded-md p-0.5 text-left text-[0.7rem]", uploaded && "ring-2 ring-foreground")}
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
              if (f) onChange({ bgImage: await compress(f) }, "bg-image")
            }}
          />
          <Field label="Readability" hint={`${Math.max(MIN_DIM, theme.bgDim ?? 70)}% page colour on top`}>
            <Slider value={[Math.max(MIN_DIM, theme.bgDim ?? 70)]} min={MIN_DIM} max={95} onValueChange={(v) => onChange({ bgDim: num(v) }, "bg-dim")} aria-label="Readability" />
          </Field>
          <Field label="Blur">
            <Slider value={[theme.bgBlur ?? 0]} min={0} max={24} onValueChange={(v) => onChange({ bgBlur: num(v) }, "bg-blur")} aria-label="Blur" />
          </Field>
        </>
      )}

      {(kind === "image" || kind === "gradient") && (
        <Field label="Where it shows">
          <Segmented
            label="Where the background shows"
            value={theme.bgWhere ?? "all"}
            onChange={(bgWhere) => onChange({ bgWhere }, "bg-where")}
            options={[
              { value: "all", label: "Everywhere" },
              { value: "home", label: "Home only" },
              { value: "login", label: "Login page" },
            ]}
          />
        </Field>
      )}
      {kind === "image" && <p className="text-xs text-muted-foreground">Cards and menus stay solid, so text and charts are always readable. Large images are made smaller for fast loading.</p>}
    </div>
  )
}

/** Shrinks an uploaded image to at most 1600px wide, as a JPEG, so pages load fast. */
async function compress(file: File) {
  const url = await new Promise<string>((res) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.readAsDataURL(file)
  })
  const img = new Image()
  img.src = url
  await img.decode()
  const s = Math.min(1, 1600 / img.width)
  const c = document.createElement("canvas")
  c.width = Math.round(img.width * s)
  c.height = Math.round(img.height * s)
  c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height)
  return c.toDataURL("image/jpeg", 0.8)
}
