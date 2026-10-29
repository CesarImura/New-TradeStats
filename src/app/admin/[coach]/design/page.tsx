import { Suspense } from "react"
import { DesignWorkspace } from "@/components/admin/design/design-workspace"
import { NarrowScreenNotice } from "@/components/admin/design/narrow-screen-notice"

export default function Page() {
  return (
    <Suspense>
      <DesignWorkspace />
      <NarrowScreenNotice />
    </Suspense>
  )
}
