import { Suspense } from "react"
import { StudentAi } from "@/components/student/ai-chat"

export default function Page() {
  return (
    <Suspense>
      <StudentAi />
    </Suspense>
  )
}
