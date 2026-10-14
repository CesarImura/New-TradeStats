"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, History, Play, PlayCircle, Undo2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
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
import { cn } from "@/lib/utils"

/**
 * Draft editing shared by the design editor and the page builder: the
 * working copy, undo (one step per change; rapid changes to the same setting
 * count as one), discard and publish.
 */
export function useDraftEditor(slug: string) {
  const pub = usePublished(slug)
  const draft = useDraft(slug)
  const working = draft ?? pub
  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(pub)

  const [undo, setUndo] = useState<Overrides[]>([])
  const last = useRef({ key: "", at: 0 })

  const commit = useCallback(
    (next: Overrides, key: string) => {
      const now = Date.now()
      if (last.current.key !== key || now - last.current.at > 800) setUndo((u) => [...u.slice(-49), working])
      last.current = { key, at: now }
      setDraft(slug, next)
    },
    [slug, working],
  )
  const change = (patch: Partial<Overrides>, key: string) => commit(mergeOverrides(working, patch), key)

  const doUndo = useCallback(() => {
    if (!undo.length) return
    setDraft(slug, undo[undo.length - 1])
    last.current = { key: "", at: 0 }
    setUndo(undo.slice(0, -1))
  }, [slug, undo])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey && !typing) {
        e.preventDefault()
        doUndo()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [doUndo])

  return {
    working,
    dirty,
    commit,
    change,
    undo: doUndo,
    canUndo: undo.length > 0,
    discard: () => {
      setUndo((u) => [...u, working])
      setDraft(slug, null)
      toast("Changes discarded. Your platform is back to the live version.")
    },
    publish: () => {
      publish(slug, `Published ${new Date().toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`)
      setUndo([])
      toast.success("Published. Students see the changes now.")
    },
  }
}

/** Top bar of the Design area: tabs between editors, status, and the draft actions. */
export function EditorBar({
  slug,
  active,
  editor,
  guide,
  previewHref,
}: {
  slug: string
  active: "look" | "pages"
  editor: ReturnType<typeof useDraftEditor>
  guide: { title: string; text: string }
  /** The student page to open in a new tab, showing the draft. */
  previewHref: string
}) {
  // Opened from the setup wizard: keep the way back, on every Design tab.
  const fromSetup = useSearchParams().get("from") === "setup"
  const q = fromSetup ? "?from=setup" : ""
  const tabs = [
    { id: "look", label: "Look and feel", href: `/admin/${slug}/design${q}` },
    { id: "pages", label: "Pages", href: `/admin/${slug}/design/pages${q}` },
  ]
  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-background px-4 py-2">
      {fromSetup && (
        <Button size="sm" nativeButton={false} render={<Link href="/setup" />} className="mr-1">
          <ArrowLeft /> Back to setup
        </Button>
      )}
      <nav className="mr-2 flex items-center gap-1" aria-label="Design areas">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={t.href}
            aria-current={active === t.id ? "page" : undefined}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground",
              active === t.id && "bg-muted font-medium text-foreground",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>
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
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        <PlayCircle /> 2-min guide
      </DialogTrigger>
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
  const history = useHistory(slug)
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="ghost" size="sm" />}>
        <History /> Versions
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Earlier versions</SheetTitle>
          <SheetDescription>Restoring a version opens it as a draft. Publish to make it live again.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-2 px-4">
          {history.length === 0 && <p className="text-sm text-muted-foreground">Nothing yet. Each time you publish, the version before it is kept here.</p>}
          {history.map((v, i) => (
            <div key={v.at + i} className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div className="grid">
                <span className="text-sm">
                  {JSON.stringify(v.snapshot) === JSON.stringify(EMPTY) ? "Original design" : `Before: ${v.label.replace("Published ", "")}`}
                </span>
                <span className="text-xs text-muted-foreground">
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
