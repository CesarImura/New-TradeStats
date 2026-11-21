"use client"

import { Trash2, Upload as UploadIcon } from "@/components/icons"
import { type Lesson } from "@/lib/data/learning"
import { AdminButton, EmptyState, FileItem } from "../ui"

export function FilesTab({ lesson, onChange }: { lesson: Lesson; onChange: (p: Partial<Lesson>) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <AdminButton hierarchy="secondary" onClick={() => onChange({ downloads: [...lesson.downloads, { name: `Worksheet ${lesson.downloads.length + 1}.pdf`, size: "96 KB" }] })}>
          <UploadIcon /> Add a file
        </AdminButton>
        <span className="t-caption text-a-text-3">Students download these under the video</span>
      </div>
      <ul className="grid gap-2">
        {lesson.downloads.map((d) => (
          <li key={d.name}>
            <FileItem name={d.name} meta={d.size} trailing={<AdminButton hierarchy="ghost" size="md" iconOnly aria-label={`Remove ${d.name}`} onClick={() => onChange({ downloads: lesson.downloads.filter((x) => x.name !== d.name) })}><Trash2 /></AdminButton>} />
          </li>
        ))}
        {lesson.downloads.length === 0 && <li><EmptyState compact title="No files on this lesson yet." /></li>}
      </ul>
    </div>
  )
}
