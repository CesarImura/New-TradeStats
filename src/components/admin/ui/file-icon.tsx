import { cn } from "@/lib/utils"

const KIND: Record<string, { label: string; cls: string }> = {
  pdf: { label: "PDF", cls: "bg-a-danger-soft text-a-danger" },
  doc: { label: "DOC", cls: "bg-a-info-soft text-a-info" },
  docx: { label: "DOC", cls: "bg-a-info-soft text-a-info" },
  xls: { label: "XLS", cls: "bg-a-success-soft text-a-success" },
  xlsx: { label: "XLS", cls: "bg-a-success-soft text-a-success" },
  csv: { label: "CSV", cls: "bg-a-success-soft text-a-success" },
  png: { label: "IMG", cls: "bg-a-warning-soft text-a-warning" },
  jpg: { label: "IMG", cls: "bg-a-warning-soft text-a-warning" },
  mp4: { label: "VID", cls: "bg-a-warning-soft text-a-warning" },
}

/** Admin / File icon (Type PDF, Doc, Sheet, Media, Other). The type comes from the file name; the letters carry it, not just the colour. */
export function FileIcon({ name, className }: { name: string; className?: string }) {
  const ext = name.split(".").pop()?.toLowerCase() ?? ""
  const k = KIND[ext] ?? { label: ext.slice(0, 3).toUpperCase() || "FILE", cls: "bg-a-selected text-a-text-2" }
  return (
    <span aria-hidden className={cn("grid size-9 shrink-0 place-items-center rounded-a-sm t-mono-label-s", k.cls, className)}>
      {k.label}
    </span>
  )
}
