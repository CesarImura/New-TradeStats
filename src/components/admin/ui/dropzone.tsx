"use client"

import { useRef, useState } from "react"
import { Upload } from "@/components/icons"
import { cn } from "@/lib/utils"

/**
 * Admin / Dropzone (Figma 'Admin · Files'): radius 10, dashed strong hairline, padding 28/16, an icon, a title and a hint.
 * Click to browse or drop files. States: default, hover and drag-over (accent edge), disabled. `size="tile"` fills its box (a lesson slot).
 */
export function Dropzone({ title = "Drop a file here, or click", hint, icon, accept, multiple, directory, disabled, size = "md", onFiles, className, children, label }: {
  title?: string; hint?: React.ReactNode; icon?: React.ReactNode; accept?: string; multiple?: boolean; directory?: boolean; disabled?: boolean; size?: "md" | "tile"; onFiles: (files: File[]) => void; className?: string; children?: React.ReactNode; label?: string
}) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  return (
    <>
      <button type="button" disabled={disabled} aria-label={label ?? title} onClick={() => input.current?.click()}
        onDragOver={(e) => (e.preventDefault(), !over && setOver(true))} onDragLeave={() => setOver(false)} onDrop={(e) => (e.preventDefault(), setOver(false), e.dataTransfer.files.length && onFiles([...e.dataTransfer.files]))}
        className={cn("relative grid place-items-center content-center gap-1.5 overflow-hidden rounded-a-10 border border-dashed border-a-border-strong text-center outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-a-border-focus disabled:pointer-events-none disabled:opacity-40",
          size === "md" ? "px-4 py-7" : "h-full min-h-24 w-full px-3", over ? "border-a-border-active bg-a-accent-soft" : "border-a-border-strong hover:border-a-border-active hover:bg-a-hover", className)}>
        {children ?? (
          <>
            <span aria-hidden className="text-a-text-2">{icon ?? <Upload className="size-[22px]" />}</span>
            <span className="t-body-m text-a-text">{title}</span>
            {hint && <span className="t-caption text-a-text-3">{hint}</span>}
          </>
        )}
      </button>
      <input ref={(el) => { input.current = el; if (el && directory) el.setAttribute("webkitdirectory", "") }} type="file" accept={accept} multiple={multiple || directory} aria-label={label ?? title} className="sr-only" tabIndex={-1}
        onChange={(e) => (e.target.files?.length && onFiles([...e.target.files]), (e.target.value = ""))} />
    </>
  )
}
