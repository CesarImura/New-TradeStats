import { Suspense } from "react"
import { InviteStep } from "@/components/onboarding/invite"

export default function Invite() {
  return (
    <Suspense>
      <InviteStep />
    </Suspense>
  )
}
