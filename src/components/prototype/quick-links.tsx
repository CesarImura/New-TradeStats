"use client"

import Link from "next/link"
import { useState } from "react"
import { COACHES } from "@/lib/data/coaches"
import { cn } from "@/lib/utils"
import { PROTO_AREAS, PROTO_DEFAULT_SLUG } from "./flows"

/** Start page: quick links to every flow, Admin and Editor first, so each one can be opened and checked in one click. Same map as the Prototype controller. */
export function QuickLinks() {
  const [slug, setSlug] = useState(PROTO_DEFAULT_SLUG)
  return (
    <section aria-labelledby="quick-links" className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-0.5">
          <h2 id="quick-links" className="t-heading-m text-a-text">Check every flow</h2>
          <p className="t-body-m text-a-text-2">Open any screen of the Admin and the Editor. The Prototype button inside the app has the same list.</p>
        </div>
        <div role="radiogroup" aria-label="Community" className="flex flex-wrap gap-0.5 rounded-a-md border border-a-border-subtle bg-a-subtle p-0.5">
          {COACHES.map((c) => (
            <button key={c.slug} role="radio" aria-checked={c.slug === slug} onClick={() => setSlug(c.slug)} className={cn("h-7 rounded-a-sm px-2.5 t-caption-medium text-a-text-2 outline-none transition-colors duration-300 ease-out hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus", c.slug === slug && "bg-a-raised text-a-text shadow-[inset_0_0_0_1px_var(--admin-color-border-default)]")}>
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {PROTO_AREAS.map((a) => (
          <div key={a.id} className={cn("grid content-start gap-3 rounded-a-lg border border-a-border bg-a-panel p-4", a.id === "admin" && "lg:row-span-2")}>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="t-heading-s text-a-text">{a.label}</h3>
              <span className="t-caption text-a-text-3">{a.hint}</span>
            </div>
            <div className="grid gap-2.5">
              {a.flows.map((f) => (
                <div key={f.id} className="grid gap-1.5 sm:grid-cols-[120px_1fr] sm:items-start">
                  <span className="t-caption pt-1 text-a-text-3">{f.label}</span>
                  <div className="flex flex-wrap gap-1">
                    {f.screens.map((s) => (
                      <Link key={s.label + s.href(slug)} href={s.href(slug)} className="inline-flex h-7 items-center rounded-a-sm bg-a-muted px-2.5 t-caption-medium text-a-text-2 outline-none transition-colors duration-300 ease-out hover:bg-a-selected hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus">
                        {s.label}
                        {s.soon && <span className="ml-1.5 t-micro text-a-text-3">Soon</span>}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
