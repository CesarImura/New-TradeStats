import { Suspense } from "react"
import { WidgetPage } from "@/components/student/widget-page"

export default function Page() {
  return (
    <Suspense>
      <WidgetPage page="courses" />
    </Suspense>
  )
}
