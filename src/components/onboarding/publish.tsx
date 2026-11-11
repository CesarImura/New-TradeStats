"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { setAccount } from "@/lib/data/communities"
import { OnbFrame } from "./frame"

/** Publishing is the last step of the setup wizard now (Review and publish); old links land there. */
export function PublishStep() {
  const router = useRouter()
  useEffect(() => {
    setAccount({ step: 2 })
    router.replace("/setup")
  }, [router])
  return <OnbFrame>{null}</OnbFrame>
}
