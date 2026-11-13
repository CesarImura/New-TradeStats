"use client"

import { useRef, useState } from "react"
import { X } from "@/components/icons"
import { cn } from "@/lib/utils"

export type Chip = { id: string; email: string }

const valid = (s: string) => /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]{2,}$/.test(s)
let n = 0
const nextId = () => `e${++n}`

/** Splits what was typed or pasted (commas, semicolons, spaces, new lines) into new chips, without duplicates. */
function split(text: string, have: Chip[]): Chip[] {
  const seen = new Set(have.map((c) => c.email.toLowerCase()))
  const out: Chip[] = []
  for (const raw of text.split(/[\s,;]+/)) {
    const email = raw.trim().replace(/^<|>$/g, "")
    if (!email || seen.has(email.toLowerCase())) continue
    seen.add(email.toLowerCase())
    out.push({ id: nextId(), email })
  }
  return out
}

export const validChips = (chips: Chip[]) => chips.filter((c) => valid(c.email))

/**
 * The invite field of You're live (Figma 1053:2 and 1056:148): one box of Admin / E-mail chips (Figma 1059:2497). Paste a
 * list or type and press Enter; each address becomes a chip. Click a chip's text to edit it, the × (or Backspace on
 * the empty input) to remove it. A chip that doesn't look like an e-mail turns red and is not sent.
 */
export function EmailChips({ chips, onChange, labelId, hintId }: { chips: Chip[]; onChange: (c: Chip[]) => void; labelId: string; hintId: string }) {
  const [text, setText] = useState("")
  const [editing, setEditing] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)

  const commit = (value = text) => {
    if (!value.trim()) return
    onChange([...chips, ...split(value, chips)])
    setText("")
  }
  const remove = (id: string) => {
    onChange(chips.filter((c) => c.id !== id))
    input.current?.focus()
  }
  const saveEdit = (id: string, email: string) => {
    const v = email.trim()
    onChange(v ? chips.map((c) => (c.id === id ? { ...c, email: v } : c)) : chips.filter((c) => c.id !== id))
    setEditing(null)
  }

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && input.current?.focus()}
      className="flex min-h-11 cursor-text flex-wrap items-center gap-1.5 rounded-a-md border border-a-border bg-a-field p-2 transition-colors duration-150 focus-within:border-a-border-focus hover:border-a-border-strong"
    >
      {chips.map((c) => {
        const bad = !valid(c.email)
        return editing === c.id ? (
          <input
            key={c.id}
            autoFocus
            defaultValue={c.email}
            aria-label="Edit e-mail"
            onBlur={(e) => saveEdit(c.id, e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                saveEdit(c.id, e.currentTarget.value)
              }
              if (e.key === "Escape") {
                e.stopPropagation()
                setEditing(null)
              }
            }}
            className="h-7 min-w-40 rounded-a-sm border border-a-border-focus bg-a-panel px-2 t-body-m text-a-text outline-none"
          />
        ) : (
          <span key={c.id} className={cn("group inline-flex h-7 items-center gap-1 rounded-a-sm border pr-1 pl-2 transition-colors duration-150", bad ? "border-a-danger bg-a-panel" : "border-a-border-subtle bg-a-panel hover:border-a-border hover:bg-a-field")}>
            <button type="button" onClick={() => setEditing(c.id)} title="Edit" aria-label={`${c.email}${bad ? ", doesn't look like an e-mail" : ""}. Edit`} className={cn("max-w-56 truncate rounded-a-xs t-body-m outline-none focus-visible:ring-2 focus-visible:ring-a-border-focus", bad ? "text-a-danger" : "text-a-text")}>
              {c.email}
            </button>
            <button type="button" onClick={() => remove(c.id)} aria-label={`Remove ${c.email}`} className="grid size-5 place-items-center rounded-a-xs text-a-text-3 outline-none transition-colors duration-150 hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus pointer-coarse:size-8">
              <X className="size-4" />
            </button>
          </span>
        )
      })}
      <input
        ref={input}
        value={text}
        aria-labelledby={labelId}
        aria-describedby={hintId}
        placeholder={chips.length ? "Add more…" : "Paste or type e-mails"}
        onChange={(e) => {
          const v = e.target.value
          // A separator typed at the end closes the address into a chip.
          if (/[,;\s]$/.test(v)) commit(v)
          else setText(v)
        }}
        onPaste={(e) => {
          const t = e.clipboardData.getData("text")
          if (/[\s,;]/.test(t.trim())) {
            e.preventDefault()
            commit(text + t)
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            commit()
          }
          if (e.key === "Backspace" && !text && chips.length) remove(chips[chips.length - 1].id)
        }}
        onBlur={() => commit()}
        className="h-7 min-w-32 flex-1 bg-transparent px-1 t-body-m text-a-text outline-none placeholder:text-a-text-3"
      />
    </div>
  )
}
