import { cn } from "@/lib/utils"

/** Admin / Lesson card (Figma 'Admin · Cards & lists'): a 16:9 picture with the length in mono on the corner, the title and an optional mark beneath. */
export function LessonCard({ picture, time, title, mark, markClassName, className, ...props }: Omit<React.ComponentProps<"button">, "title"> & { picture: React.ReactNode; time?: string; title: React.ReactNode; mark?: React.ReactNode; markClassName?: string }) {
  return (
    <button type="button" className={cn("group/lesson grid w-full grid-cols-[minmax(0,1fr)] gap-2 rounded-a-md text-left outline-none focus-visible:ring-2 focus-visible:ring-a-border-focus", className)} {...props}>
      <span className="relative block overflow-hidden rounded-a-md border border-a-border transition-colors duration-300 group-hover/lesson:border-a-border-strong">
        {picture}
        {time && <span className="absolute right-2 bottom-2 rounded-a-xs bg-a-scrim px-1.5 py-0.5 t-mono-data text-a-text-2">{time}</span>}
      </span>
      <span className="flex min-w-0 items-baseline gap-2">
        <span className="min-w-0 flex-1 truncate t-body-m text-a-text">{title}</span>
        {mark && <span className={cn("shrink-0 t-caption", markClassName)}>{mark}</span>}
      </span>
    </button>
  )
}
