import { Suspense } from "react"
import { WidgetBase } from "@/components/lab/widget-base"

export const metadata = { title: "Library · Prototype" }

/** Prototype only: the library. Widgets, components, the themes' readability check and links to the other benches. */
export default function LabPage() {
  // Widgets read the URL (preview tier, data mode), so the page needs a Suspense boundary to prerender.
  return (
    <Suspense>
      <WidgetBase />
    </Suspense>
  )
}
