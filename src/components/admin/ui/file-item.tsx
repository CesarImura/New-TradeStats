import { cn } from "@/lib/utils"
import { FileIcon } from "./file-icon"
import { AdminProgress } from "./progress-line"

const META = { ready: "text-a-text-3", uploading: "text-a-text-2", done: "text-a-success", error: "text-a-danger" } as const

/** Admin / File item (Figma 'Admin · Files'): radius 10, padding 12, gap 12, a file icon, name and meta, a trailing slot; Uploading shows a bar, Error says what failed. */
export function FileItem({ name, meta, status = "ready", progress, trailing, className }: { name: string; meta?: React.ReactNode; status?: keyof typeof META; progress?: number; trailing?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-a-10 border border-a-border-subtle p-3", className)}>
      <FileIcon name={name} className="h-10 w-8" />
      <div className="grid min-w-0 flex-1 gap-1.5">
        <span className="truncate t-body-m text-a-text">{name}</span>
        {status === "uploading" && progress !== undefined && <AdminProgress label={`${name} upload`} tone="accent" value={progress} />}
        {meta && <span className={cn("truncate t-caption", META[status])}>{meta}</span>}
      </div>
      {trailing && <div className="flex shrink-0 items-center gap-2">{trailing}</div>}
    </div>
  )
}
