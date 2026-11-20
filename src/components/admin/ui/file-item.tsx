import { Check, CircleAlert } from "@/components/icons"
import { cn } from "@/lib/utils"
import { FileIcon } from "./file-icon"
import { AdminProgress } from "./progress-line"

type Status = "ready" | "uploading" | "done" | "error"
const STATUS_TEXT = { done: "Completed", error: "Upload failed" } as const

/**
 * Admin / File item (Figma 'Admin · Files'): radius 10, padding 12, gap 12, a file icon, the name, a meta line and a trailing action.
 * Ready and Uploading write their meta in grey; Done adds a green check and "Completed", Error a warning icon and the reason, both in grey: the icon carries the colour, never the words.
 * With a progress value (Uploading, or Error with the bar) the action sits at the top and the bar with its percentage runs under the whole row.
 * Error without a progress value keeps the size in the meta line before the reason.
 */
export function FileItem({ name, meta, status = "ready", progress, statusText, trailing, className }: { name: string; meta?: React.ReactNode; status?: Status; progress?: number; statusText?: string; trailing?: React.ReactNode; className?: string }) {
  const bar = progress !== undefined && (status === "uploading" || status === "error")
  const mark = status === "done" || status === "error"
  const showMeta = !!meta && !(status === "error" && bar)
  return (
    <div className={cn("flex items-center gap-3 rounded-a-10 border border-a-border-subtle p-3", className)}>
      <FileIcon name={name} size="md" />
      <div className="grid min-w-0 flex-1 gap-1">
        <div className={cn("flex gap-1.5", bar ? "items-start" : "items-center")}>
          <div className="grid min-w-0 flex-1 gap-1.5">
            <span className="truncate t-body-m text-a-text">{name}</span>
            {(showMeta || mark) && (
              <span className="flex min-w-0 items-center gap-1.5 t-caption">
                {showMeta && <span className="truncate text-a-text-3">{meta}</span>}
                {mark && (
                  <span className="flex min-w-0 items-center gap-1 text-a-text-2">
                    {status === "done" ? (
                      <span aria-hidden className="grid size-3 shrink-0 place-items-center rounded-full bg-a-success-fill text-a-on-accent"><Check className="size-[9px]" /></span>
                    ) : (
                      <CircleAlert aria-hidden className="size-[14px] shrink-0 text-a-danger-fill" />
                    )}
                    <span className="truncate">{statusText ?? STATUS_TEXT[status]}</span>
                  </span>
                )}
              </span>
            )}
          </div>
          {trailing && <div className="flex shrink-0 items-center gap-2">{trailing}</div>}
        </div>
        {bar && (
          <div className="flex items-center gap-2">
            <AdminProgress label={`${name} upload`} tone={status === "error" ? "danger" : "accent"} value={progress} className="min-w-0 flex-1" />
            <span className="w-[26px] shrink-0 text-right t-caption tabular-nums text-a-text-2">{Math.round(progress)}%</span>
          </div>
        )}
      </div>
    </div>
  )
}
