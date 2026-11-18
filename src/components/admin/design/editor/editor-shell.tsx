"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ExternalLink, History, PlayCircle, Trash2 } from "@/components/icons"
import { toast } from "sonner"
import { AdminButton, AdminDrawer, AdminMenuItem, AdminMenuSeparator, AdminModal } from "@/components/admin/ui"
import { EditorTopBar, type PublishStatus } from "./top-bar"
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

  // The discard toast's Undo runs the latest undo (the one that holds the discarded draft).
  const doUndoRef = useRef(() => {})
  const doUndo = useCallback(() => {
    if (!undo.length) return
    write(undo[undo.length - 1])
    last.current = { key: "", at: 0 }
    setSteps((s) => ({ ...s, undo: s.undo.slice(0, -1), redo: [...s.redo, working] }))
  }, [write, undo, working])
  useEffect(() => {
    doUndoRef.current = doUndo
  })

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
    /** Steps made in this session (0 after a reload, when the draft is still there): the status says "N changes" only when it knows. */
    changes: undo.length,
    redo: doRedo,
    canRedo: redo.length > 0,
    discard: () => {
      setSteps((s) => ({ ...s, undo: [...s.undo, working], redo: [] }))
      last.current = { key: "", at: 0 }
      write(null)
      toast("Changes discarded. Your platform is back to the live version.", { action: { label: "Undo", onClick: () => doUndoRef.current() } })
    },
    /** `note`: what the success toast adds (one toast, never two). */
    publish: (note?: { description: string; action?: { label: string; onClick: () => void } }) => {
      // A failed publish keeps the draft; the store has already said why.
      if (!publish(slug, `Published ${new Date().toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`)) return false
      setSteps((s) => ({ ...s, undo: [], redo: [] }))
      toast.success("Published. Students see the changes now.", note)
      return true
    },
  }
}

/**
 * Top bar of the all-pages overview: the same `EditorTopBar` as the Design workspace, with the screen's name in the middle's place.
 * `failed`: the last publish did not go through (the draft is kept).
 */
export function EditorBar({
  slug,
  title,
  back,
  editor,
  guide,
  previewHref,
  failed,
  onPublish,
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
  failed?: boolean
  onPublish?: () => void
  children?: React.ReactNode
}) {
  // Opened from the setup wizard: keep the way back, everywhere in Design.
  const fromSetup = useSearchParams().get("from") === "setup"
  const way = fromSetup ? { href: "/setup", label: "Back to setup" } : back
  const [menu, setMenu] = useState<"versions" | "guide" | null>(null)
  const status: PublishStatus = failed ? { kind: "failed" } : editor.dirty ? { kind: "unpublished", changes: editor.changes } : { kind: "published" }
  return (
    <>
      <EditorTopBar
        slug={slug}
        title={title}
        back={way}
        center={children}
        status={status}
        history={{ undo: editor.undo, redo: editor.redo, canUndo: editor.canUndo, canRedo: editor.canRedo }}
        moreItems={
          <>
            <AdminMenuItem onClick={() => setMenu("versions")}>
              <History /> Earlier versions
            </AdminMenuItem>
            <AdminMenuItem onClick={() => setMenu("guide")}>
              <PlayCircle /> 1-minute guide
            </AdminMenuItem>
            <AdminMenuSeparator />
            <AdminMenuItem tone="danger" disabled={!editor.dirty} onClick={editor.discard}>
              <Trash2 /> Discard changes
            </AdminMenuItem>
          </>
        }
        preview={
          <AdminButton hierarchy="secondary" nativeButton={false} render={<a href={previewHref} target="_blank" rel="noreferrer" />} title={editor.dirty ? "Preview your draft in a new tab" : "Preview in a new tab"}>
            <ExternalLink /> <span className="max-sm:sr-only">Preview</span>
          </AdminButton>
        }
        onPublish={onPublish ?? (() => editor.publish())}
        publishDisabled={!editor.dirty}
      />
      <VersionsSheet slug={slug} open={menu === "versions"} onOpenChange={(o) => setMenu(o ? "versions" : null)} />
      <GuideDialog title={guide.title} text={guide.text} open={menu === "guide"} onOpenChange={(o) => setMenu(o ? "guide" : null)} />
    </>
  )
}

/** The short video guide for a Design screen, with the offer to set it up for the coach. */
export function GuideDialog({ title, text, open, onOpenChange }: { title: string; text: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <AdminModal overlay="plain" open={open} onOpenChange={onOpenChange} title={title} subtitle={text} className="sm:max-w-xl">
      <div className="grid aspect-video place-items-center rounded-a-lg bg-a-subtle">
        <PlayCircle className="size-12 text-a-text-3" />
      </div>
      <p className="t-body-m text-a-text-2">
        Rather not do it yourself?{" "}
        <button className="t-body-m-medium text-a-text underline underline-offset-4" onClick={() => toast("We'll be in touch to book your setup call.")}>
          Let us set it up for you
        </button>
        .
      </p>
    </AdminModal>
  )
}

/** Earlier published versions; restoring one opens it as a draft. */
export function VersionsSheet({ slug, open, onOpenChange }: { slug: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const history = useHistory(slug)
  return (
    <AdminDrawer overlay="plain" width={420} open={open} onOpenChange={onOpenChange} title="Earlier versions">
      <div className="grid gap-2">
        <p className="t-body-m text-a-text-2">Restoring a version opens it as a draft. Publish to make it live again.</p>
        {history.length === 0 && <p className="t-body-m text-a-text-2">Nothing yet. Each time you publish, or switch to another look, the version before it is kept here.</p>}
        {history.map((v, i) => (
          <div key={v.at + i} className="flex items-center justify-between gap-3 rounded-a-lg border border-a-border p-3">
            <div className="grid">
              <span className="t-body-m text-a-text">
                {JSON.stringify(v.snapshot) === JSON.stringify(EMPTY) ? "Original design" : v.label.startsWith("Before ") ? v.label : `Before: ${v.label.replace("Published ", "")}`}
              </span>
              <span className="t-caption text-a-text-2">
                {v.label.startsWith("Before ") && JSON.stringify(v.snapshot) === JSON.stringify(EMPTY) && `${v.label} · `}
                {new Date(v.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <AdminButton
              hierarchy="secondary"
              size="md"
              onClick={() => {
                setDraft(slug, v.snapshot)
                toast("Version restored as a draft. Publish to make it live.")
              }}
            >
              Restore
            </AdminButton>
          </div>
        ))}
      </div>
    </AdminDrawer>
  )
}
