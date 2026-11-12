import { Suspense } from "react"
import { GettingStarted } from "@/components/admin/getting-started/getting-started"

export default function Page() {
  return (
    <Suspense>
      <GettingStarted />
    </Suspense>
  )
}
