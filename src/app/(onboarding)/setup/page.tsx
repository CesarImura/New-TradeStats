import { Suspense } from "react"
import { DesignSetup } from "@/components/onboarding/design-setup"

/** Getting started · Design your platform (Brand, Look, Layout). The old setup wizard (wizard.tsx) is retired. */
export default function Setup() {
  return (
    <Suspense>
      <DesignSetup />
    </Suspense>
  )
}
