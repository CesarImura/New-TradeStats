"use client"

import { useRef } from "react"
import { ImagePlus, Trash2 } from "@/components/icons"
import { toast } from "sonner"
import { pictureFrom } from "@/lib/images"
import { cn } from "@/lib/utils"
import { AdminButton, Dropzone } from "@/components/admin/ui"

/** The admin keeps its own neutral look, so a course without a cover shows its colour in these tints. */
export const COVER_TINTS = ["#f97316", "#0ea5e9", "#8b5cf6", "#10b981", "#e11d48"]
export const tintOf = (color: number) => COVER_TINTS[color % COVER_TINTS.length]

/** A cover or thumbnail: the picture if there is one, else a tint. Children sit on top (a badge, a label). */
export function Tile({ src, color, className, children }: { src?: string; color: number; className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn("relative overflow-hidden", className)} style={src ? undefined : { background: `linear-gradient(135deg, ${tintOf(color)}, color-mix(in oklab, ${tintOf(color)} 70%, black))` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img src={src} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />}
      {children}
    </div>
  )
}

/**
 * Choose, change or remove a picture (a lesson thumbnail; Figma Content 07 and 07b). With none, a dropzone; with one, the
 * picture and Change image / Remove. The picture is made smaller on the way in, so the draft stays light.
 */
export function PictureField({ value, color, onChange, label, className }: { value?: string; color: number; onChange: (v: string | undefined) => void; label: string; className?: string }) {
  const input = useRef<HTMLInputElement>(null)
  const pick = async (file: File | undefined) => {
    if (!file) return
    try {
      onChange(await pictureFrom(file, { max: 960, quality: 0.8, keep: [] }))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "That picture couldn't be used.")
    }
  }
  const hint = "PNG, JPG or WebP. 16:9 works best."
  if (!value) {
    return (
      <Dropzone title="Drop an image here, or click to choose" hint={hint} accept="image/*" label={label} onFiles={(files) => void pick(files[0])} className="max-w-[520px]" />
    )
  }
  return (
    <div className="flex flex-wrap items-start gap-3">
      <Tile src={value} color={color} className={cn("aspect-video w-40 shrink-0 rounded-a-md border border-a-border", className)} />
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <AdminButton onClick={() => input.current?.click()} hierarchy="secondary" size="md">
            <ImagePlus /> Change image
          </AdminButton>
          <AdminButton onClick={() => onChange(undefined)} hierarchy="ghost" size="md">
            <Trash2 /> Remove
          </AdminButton>
        </div>
        <span className="t-body-m text-a-text-2">{hint}</span>
      </div>
      <input ref={input} type="file" accept="image/*" aria-label={label} className="sr-only" onChange={(e) => (void pick(e.target.files?.[0]), (e.target.value = ""))} />
    </div>
  )
}
