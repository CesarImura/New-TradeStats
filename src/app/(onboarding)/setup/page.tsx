import { Suspense } from "react"
import { DesignSetup } from "@/components/onboarding/design-setup"

/** Getting started · Design your platform (Brand, Look, Layout). */
export default function Setup() {
  return (
    <Suspense>
      <DesignSetup />
    </Suspense>
  )
}
