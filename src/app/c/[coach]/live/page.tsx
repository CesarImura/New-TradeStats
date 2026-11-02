import { Suspense } from "react"
import { LiveList } from "@/components/student/live-watch"

export default function Page() {
  return (
    <Suspense>
      <LiveList />
    </Suspense>
  )
}
