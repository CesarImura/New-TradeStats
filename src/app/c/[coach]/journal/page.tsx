import { Suspense } from "react"
import { StudentJournal } from "@/components/student/journal"

export default function Page() {
  return (
    <Suspense>
      <StudentJournal />
    </Suspense>
  )
}
