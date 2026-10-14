import { Suspense } from "react"
import { PageBuilder } from "@/components/admin/design/page-builder"

export default function Page() {
  return (
    <Suspense>
      <PageBuilder />
    </Suspense>
  )
}
