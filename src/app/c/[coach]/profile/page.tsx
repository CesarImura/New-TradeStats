import { Suspense } from "react"
import { StudentProfile } from "@/components/student/profile"

export default function Page() {
  return (
    <Suspense>
      <StudentProfile />
    </Suspense>
  )
}
