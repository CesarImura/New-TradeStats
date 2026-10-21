import { Suspense } from "react"
import { WidgetWall } from "@/components/lab/widget-wall"

export const metadata = { title: "Widget wall · Prototype" }

/** Prototype only: every widget, every look, three widths, with automatic quality checks. */
export default function WidgetWallPage() {
  // Widgets read the URL (preview tier, data mode), so the page needs a Suspense boundary to prerender.
  return (
    <Suspense>
      <WidgetWall />
    </Suspense>
  )
}
