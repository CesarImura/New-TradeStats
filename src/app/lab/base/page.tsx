import { Suspense } from "react"
import { WidgetBase } from "@/components/lab/widget-base"

export const metadata = { title: "Library · Prototype" }

/** Prototype only: the library, same as /lab (kept so older links still work). */
export default function WidgetBasePage() {
  // Widgets read the URL (preview tier, data mode), so the page needs a Suspense boundary to prerender.
  return (
    <Suspense>
      <WidgetBase />
    </Suspense>
  )
}
