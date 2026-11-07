import { Suspense } from "react"
import { DesignWorkspace } from "@/components/admin/design/editor/design-workspace"
import { NarrowScreenNotice } from "@/components/admin/design/editor/narrow-screen-notice"

export default function Page() {
  return (
    <Suspense>
      <DesignWorkspace />
      <NarrowScreenNotice />
    </Suspense>
  )
}
