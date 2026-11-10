"use client"

import { useRef } from "react"
import { ImagePlus, Trash2 } from "@/components/icons"
import { toast } from "sonner"
import { pictureFrom } from "@/lib/images"
import { cn } from "@/lib/utils"
import { AdminButton } from "@/components/admin/ui"

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
 * Choose, change or remove a picture (a course cover, a lesson thumbnail). The picture is made smaller on the way in, so the
 * draft stays light; with none, `empty` says what students see instead.
 */
export function PictureField({ value, color, onChange, label, empty, className }: { value?: string; color: number; onChange: (v: string | undefined) => void; label: string; empty: string; className?: string }) {
  const input = useRef<HTMLInputElement>(null)
  const pick = async (file: File | undefined) => {
    if (!file) return
    try {
      onChange(await pictureFrom(file, { max: 960, quality: 0.8, keep: [] }))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "That picture couldn't be used.")
    }
  }
  return (
    <div className="flex items-center gap-4 rounded-xl border p-3 bg-card">
      <Tile src={value} color={color} className={cn("aspect-video w-36 shrink-0 rounded-lg", className)} />
      <div className="grid min-w-0 flex-1 gap-2">
        <span className="text-xs text-muted-foreground">{value ? `Your ${label.toLowerCase()} picture.` : empty}</span>
        <div className="flex flex-wrap gap-2">
          <AdminButton onClick={() => input.current?.click()} hierarchy="secondary" size="md">
            <ImagePlus /> {value ? "Change" : "Add a picture"}
          </AdminButton>
          {value && (
            <AdminButton onClick={() => onChange(undefined)} hierarchy="ghost" size="md">
              <Trash2 /> Remove
            </AdminButton>
          )}
        </div>
      </div>
      <input ref={input} type="file" accept="image/*" aria-label={label} className="sr-only" onChange={(e) => (void pick(e.target.files?.[0]), (e.target.value = ""))} />
    </div>
  )
}
