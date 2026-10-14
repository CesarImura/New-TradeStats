import { Suspense } from "react"
import { DesignWorkspace } from "@/components/admin/design/design-workspace"

export default function Page() {
  return (
    <Suspense>
      <DesignWorkspace />
    </Suspense>
  )
}
