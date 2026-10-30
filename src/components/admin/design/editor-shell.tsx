"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, History, Play, PlayCircle, Redo2, Undo2 } from "@/components/icons"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  EMPTY,
  mergeOverrides,
  publish,
  setDraft,
  useDraft,
  useHistory,
  usePublished,
  type Overrides,
} from "@/lib/prototype-store"

/**
 * Draft editing shared by the design editor and the page builder: the
 * working copy, undo and redo (one step per change; rapid changes to the same
 * setting count as one), discard and publish.
 *
 * Undo and redo hold whole snapshots of the draft, so a step always brings
 * back a state that existed. A new change (a reset and a discard included)
 * clears redo, and is itself undoable. Publishing clears both: what came
 * before is now in Earlier versions, not a step away. Both are per community.
 */
export function useDraftEditor(slug: string) {
  const pub = usePublished(slug)
  const draft = useDraft(slug)
  const working = draft ?? pub
  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(pub)

  const [steps, setSteps] = useState<{ slug: string; undo: Overrides[]; redo: Overrides[] }>({ slug, undo: [], redo: [] })
  // Another community starts with no steps (adjusting state while rendering, as React recommends).
  if (steps.slug !== slug) setSteps({ slug, undo: [], redo: [] })
  const { undo, redo } = steps
  const last = useRef({ key: "", at: 0 })
  // What this editor last wrote. A draft that differs came from elsewhere (Earlier versions, another tab): redo is dropped,
  // so it can't bring back a state from before that change.
  const wrote = useRef<string | null>(null)
  const write = useCallback(
    (next: Overrides | null) => {
      wrote.current = JSON.stringify(next)
      setDraft(slug, next)
    },
    [slug],
  )
  useEffect(() => {
    if (wrote.current !== null && JSON.stringify(draft) !== wrote.current) {
      wrote.current = null
      setSteps((s) => (s.redo.length ? { ...s, redo: [] } : s))
    }
  }, [draft])

  const commit = useCallback(
    (next: Overrides, key: string) => {
      const now = Date.now()
      const step = last.current.key !== key || now - last.current.at > 800
      setSteps((s) => ({ ...s, undo: step ? [...s.undo.slice(-49), working] : s.undo, redo: [] }))
      last.current = { key, at: now }
      write(next)
    },
    [write, working],
  )
  const change = (patch: Partial<Overrides>, key: string) => commit(mergeOverrides(working, patch), key)

  const doUndo = useCallback(() => {
    if (!undo.length) return
    write(undo[undo.length - 1])
    last.current = { key: "", at: 0 }
    setSteps((s) => ({ ...s, undo: s.undo.slice(0, -1), redo: [...s.redo, working] }))
  }, [write, undo, working])

  const doRedo = useCallback(() => {
    if (!redo.length) return
    write(redo[redo.length - 1])
    last.current = { key: "", at: 0 }
    setSteps((s) => ({ ...s, undo: [...s.undo, working], redo: s.redo.slice(0, -1) }))
  }, [write, redo, working])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
      if (!(e.metaKey || e.ctrlKey) || typing) return
      const k = e.key.toLowerCase()
      // ⌘Z undoes; ⇧⌘Z (and Ctrl+Y on Windows) redoes.
      if (k === "z" && !e.shiftKey) {
        e.preventDefault()
        doUndo()
      } else if ((k === "z" && e.shiftKey) || (k === "y" && e.ctrlKey && !e.metaKey)) {
        e.preventDefault()
        doRedo()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [doUndo, doRedo])

  return {
    working,
    dirty,
    commit,
    change,
    undo: doUndo,
    canUndo: undo.length > 0,
    redo: doRedo,
    canRedo: redo.length > 0,
    discard: () => {
      setSteps((s) => ({ ...s, undo: [...s.undo, working], redo: [] }))
      last.current = { key: "", at: 0 }
      write(null)
      toast("Changes discarded. Your platform is back to the live version.")
    },
    publish: () => {
      // A failed publish keeps the draft; the store has already said why.
      if (!publish(slug, `Published ${new Date().toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`)) return false
      setSteps((s) => ({ ...s, undo: [], redo: [] }))
      toast.success("Published. Students see the changes now.")
      return true
    },
  }
}

/**
 * Top bar of the Design workspace: the way back (to setup, or from the all-pages
 * overview to the workspace), what you're looking at (`children`: page and
 * tier), status, and the draft actions.
 */
export function EditorBar({
  slug,
  title = "Design",
  back,
  editor,
  guide,
  previewHref,
  children,
}: {
  slug: string
  title?: string
  /** A link back to where this screen was opened from. */
  back?: { href: string; label: string }
  editor: ReturnType<typeof useDraftEditor>
  guide: { title: string; text: string }
  /** The student page to open in a new tab, showing the draft. */
  previewHref: string
  children?: React.ReactNode
}) {
  // Opened from the setup wizard: keep the way back, everywhere in Design.
  const fromSetup = useSearchParams().get("from") === "setup"
  const way = fromSetup ? { href: "/setup", label: "Back to setup" } : back
  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-[var(--sidebar)] px-3 py-1.5" data-design-slug={slug}>
      {way && (
        <Button size="sm" variant={fromSetup ? "default" : "ghost"} nativeButton={false} render={<Link href={way.href} />}>
          <ArrowLeft /> {way.label}
        </Button>
      )}
      <span className="px-1 text-[0.8125rem] font-semibold">{title}</span>
      {children}
      <div className="mr-auto">
        {editor.dirty ? (
          <Badge variant="secondary" className="gap-1.5">
            <span className="size-1.5 rounded-full bg-amber-500" /> Unpublished changes
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1.5 text-muted-foreground">
            <span className="size-1.5 rounded-full bg-emerald-500" /> Live
          </Badge>
        )}
      </div>
      <GuideButton {...guide} />
      <Button variant="ghost" size="sm" onClick={editor.undo} disabled={!editor.canUndo} title="Undo (⌘Z)">
        <Undo2 /> Undo
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={editor.redo} disabled={!editor.canRedo} aria-label="Redo" title="Redo (⇧⌘Z)">
        <Redo2 />
      </Button>
      <Versions slug={slug} />
      {editor.dirty && (
        <Button variant="ghost" size="sm" onClick={editor.discard}>
          Discard
        </Button>
      )}
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Preview in a new tab"
        title={editor.dirty ? "Preview your draft in a new tab" : "Preview in a new tab"}
        nativeButton={false}
        render={<a href={previewHref} target="_blank" rel="noreferrer" />}
      >
        <Play />
      </Button>
      <Button size="sm" disabled={!editor.dirty} onClick={editor.publish}>
        Publish
      </Button>
    </div>
  )
}

function GuideButton({ title, text }: { title: string; text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <PlayCircle /> 2-min guide
      </Button>
      <GuideDialog title={title} text={text} open={open} onOpenChange={setOpen} />
    </>
  )
}

/** The short video guide for a Design screen, with the offer to set it up for the coach. */
export function GuideDialog({ title, text, open, onOpenChange }: { title: string; text: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{text}</DialogDescription>
        </DialogHeader>
        <div className="grid aspect-video place-items-center rounded-lg bg-muted">
          <PlayCircle className="size-12 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Rather not do it yourself?{" "}
          <button className="font-medium text-foreground underline underline-offset-4" onClick={() => toast("We'll be in touch to book your setup call.")}>
            Let us set it up for you
          </button>
          .
        </p>
      </DialogContent>
    </Dialog>
  )
}

function Versions({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <History /> Versions
      </Button>
      <VersionsSheet slug={slug} open={open} onOpenChange={setOpen} />
    </>
  )
}

/** Earlier published versions; restoring one opens it as a draft. */
export function VersionsSheet({ slug, open, onOpenChange }: { slug: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const history = useHistory(slug)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Earlier versions</SheetTitle>
          <SheetDescription>Restoring a version opens it as a draft. Publish to make it live again.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-2 px-4">
          {history.length === 0 && <p className="text-sm text-muted-foreground">Nothing yet. Each time you publish, or switch to another look, the version before it is kept here.</p>}
          {history.map((v, i) => (
            <div key={v.at + i} className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div className="grid">
                <span className="text-sm">
                  {JSON.stringify(v.snapshot) === JSON.stringify(EMPTY) ? "Original design" : v.label.startsWith("Before ") ? v.label : `Before: ${v.label.replace("Published ", "")}`}
                </span>
                <span className="text-xs text-muted-foreground">
                  {v.label.startsWith("Before ") && JSON.stringify(v.snapshot) === JSON.stringify(EMPTY) && `${v.label} · `}
                  {new Date(v.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDraft(slug, v.snapshot)
                  toast("Version restored as a draft. Publish to make it live.")
                }}
              >
                Restore
              </Button>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
