"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"

/**
 * The Design workspace needs room for its panel, canvas and preview side by side.
 * Below 900px it says so, over the workspace, and offers the preview instead;
 * the coach can still go on (the workspace scrolls), but not by accident.
 */
export function NarrowScreenNotice() {
  const { coach } = useParams<{ coach: string }>()
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  return (
    <div role="dialog" aria-modal aria-labelledby="narrow-design-title" className="fixed inset-0 z-[60] grid place-items-center bg-background p-6 min-[900px]:hidden">
      <div className="grid max-w-sm gap-4">
        <h1 id="narrow-design-title" className="text-xl font-medium">
          Design works best on a larger screen
        </h1>
        <p className="text-sm text-muted-foreground">
          The editor shows its controls, your pages and a live preview side by side, which needs a screen at least 900px wide. On this screen you can preview your platform as students
          see it.
        </p>
        <div className="grid gap-2">
          <Button nativeButton={false} render={<Link href={`/c/${coach}?preview=draft`} />}>Preview my platform</Button>
          <Button variant="outline" nativeButton={false} render={<Link href={`/admin/${coach}`} />}>
            Back to the admin
          </Button>
          <Button variant="ghost" onClick={() => setDismissed(true)}>
            Open the editor anyway
          </Button>
        </div>
      </div>
    </div>
  )
}
