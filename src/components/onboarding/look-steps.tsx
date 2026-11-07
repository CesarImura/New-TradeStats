"use client"

import Link from "next/link"
import { ExternalLink } from "@/components/icons"

/**
 * A link to the full Design editor, with a way back to setup. `query` picks the
 * step it opens on (e.g. "step=look"); `href` replaces the whole link.
 */
export function FullEditorLink({ slug, query, href, label = "Open the full Design editor" }: { slug: string; query?: string; href?: string; label?: string }) {
  return (
    <Link href={href ?? `/admin/${slug}/design?${query ? `${query}&` : ""}from=setup`} className="flex w-fit items-center gap-1.5 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
      <ExternalLink className="size-3.5" /> {label}
    </Link>
  )
}
