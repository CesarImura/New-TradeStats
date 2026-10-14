import { Suspense } from "react"
import { StudentCommunity } from "@/components/student/community"

export default function Page() {
  return (
    <Suspense>
      <StudentCommunity />
    </Suspense>
  )
}
