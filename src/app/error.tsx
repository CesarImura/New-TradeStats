"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { patchPublishedTheme, setDraft } from "@/lib/prototype-store"

/**
 * When a page breaks, most often because of a design saved in this browser by an
 * older version of the prototype: try again, drop the unpublished draft, or as a
 * last resort reset the community to its original design.
 */
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => console.error(error), [error])
  const slug = usePathname().match(/^\/(?:c|admin|site)\/([^/]+)/)?.[1]
  const [confirm, setConfirm] = useState(false)
  return (
    <div className="grid min-h-svh place-items-center bg-background p-6 text-foreground">
      <div className="grid max-w-sm gap-4">
        <h1 className="text-xl font-medium">This page couldn&apos;t be shown</h1>
        <p className="text-sm text-muted-foreground">
          Something went wrong while showing it. Try again first.
          {slug && " If it keeps happening, a design saved in this browser may be out of date: discard the unpublished changes, or reset the community."}
        </p>
        <div className="grid gap-2">
          <Button onClick={() => retry()}>Try again</Button>
          {slug && (
            <Button
              variant="outline"
              onClick={() => {
                setDraft(slug, null)
                retry()
              }}
            >
              Discard unpublished changes
            </Button>
          )}
          {slug &&
            (confirm ? (
              <Button
                variant="destructive"
                onClick={() => {
                  patchPublishedTheme(slug, null)
                  retry()
                }}
              >
                Reset: the published design and its history are removed
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setConfirm(true)}>
                Reset to the original design…
              </Button>
            ))}
          <Link href="/" className="text-center text-sm text-muted-foreground underline underline-offset-4">
            Prototype start page
          </Link>
        </div>
      </div>
    </div>
  )
}
