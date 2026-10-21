import { Suspense } from "react"
import { ThemeLab } from "@/components/lab/theme-lab"

export const metadata = { title: "Theme lab · Prototype" }

/** Prototype only: every theme side by side with a readability check. */
export default function LabPage() {
  // Widgets read the URL (preview tier, data mode), so the page needs a Suspense boundary to prerender.
  return (
    <Suspense>
      <ThemeLab />
    </Suspense>
  )
}
