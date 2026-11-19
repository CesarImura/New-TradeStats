import { cn } from "@/lib/utils"

type Kind = "pdf" | "doc" | "sheet" | "media" | "other"

const KIND: Record<string, { label: string; kind: Kind }> = {
  pdf: { label: "PDF", kind: "pdf" },
  doc: { label: "DOC", kind: "doc" },
  docx: { label: "DOC", kind: "doc" },
  xls: { label: "XLS", kind: "sheet" },
  xlsx: { label: "XLS", kind: "sheet" },
  csv: { label: "CSV", kind: "sheet" },
  png: { label: "IMG", kind: "media" },
  jpg: { label: "IMG", kind: "media" },
  jpeg: { label: "IMG", kind: "media" },
  mp4: { label: "VID", kind: "media" },
  mov: { label: "VID", kind: "media" },
  webm: { label: "VID", kind: "media" },
}

/** The page and its folded corner use the file-icon tokens: PDF red, Doc blue, Sheet green, Media orange, anything else dark grey. */
const PAGE: Record<Kind, string> = {
  pdf: "fill-[var(--admin-component-file-icon-solid-pdf)]",
  doc: "fill-[var(--admin-component-file-icon-solid-doc)]",
  sheet: "fill-[var(--admin-component-file-icon-solid-sheet)]",
  media: "fill-[var(--admin-component-file-icon-solid-media)]",
  other: "fill-[var(--admin-component-file-icon-solid-other)]",
}
const LABEL: Record<Kind, string> = {
  pdf: "text-[var(--admin-component-file-icon-solid-label)]",
  doc: "text-[var(--admin-component-file-icon-solid-label)]",
  sheet: "text-[var(--admin-component-file-icon-solid-label)]",
  media: "text-[var(--admin-component-file-icon-solid-label-media)]",
  other: "text-[var(--admin-component-file-icon-solid-label)]",
}

/**
 * Admin / File icon (Figma 767:38975, 36x36 in tables): a solid sheet with a folded top-right corner and the file type on it.
 * The type comes from the file name; the letters carry it, not just the colour. The sheet keeps the 29:36 shape at any box size.
 */
export function FileIcon({ name, className }: { name: string; className?: string }) {
  const ext = name.split(".").pop()?.toLowerCase() ?? ""
  const k = KIND[ext] ?? { label: ext.slice(0, 3).toUpperCase() || "FILE", kind: "other" as const }
  return (
    <span aria-hidden className={cn("relative grid size-9 shrink-0 place-items-center", className)}>
      <svg viewBox="0 0 29 36" preserveAspectRatio="none" className="absolute inset-y-0 left-1/2 h-full -translate-x-1/2" style={{ aspectRatio: "29 / 36" }}>
        <path className={PAGE[k.kind]} d="M3.625 0H18L29 11V32.375C29 34.3688 27.3687 36 25.375 36H3.625C1.63125 36 0 34.3688 0 32.375V3.625C0 1.63125 1.63125 0 3.625 0Z" />
        <path className="fill-[var(--admin-component-file-icon-solid-fold)]" d="M18 0L29 11H18V0Z" />
      </svg>
      <span className={cn("relative pt-2 t-micro", LABEL[k.kind])}>{k.label}</span>
    </span>
  )
}
