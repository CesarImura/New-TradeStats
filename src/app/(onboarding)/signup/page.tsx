"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SignupFrame, SignupTitle } from "@/components/onboarding/signup-frame"
import { AdminButton, AdminField, adminControl } from "@/components/admin/ui"
import { account, setAccount } from "@/lib/data/communities"
import { cn } from "@/lib/utils"

/** Sign up · 01 Log in (Figma 939:56957). One e-mail field, a code instead of a password, and the way to a new account. */
export default function LogIn() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [tried, setTried] = useState(false)
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (!ok) return
    const cur = account()
    // Same e-mail as the coach on this browser: keep their account (and the platform they set up).
    if (cur && cur.email.toLowerCase() === email.trim().toLowerCase()) setAccount({ mode: "login", verified: false })
    else setAccount({ name: "", email: email.trim(), approved: false, verified: false, mode: "login", setupSlug: undefined, answers: undefined })
    router.push("/signup/verify")
  }

  return (
    <SignupFrame>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <SignupTitle title="Log in" text="We e-mail you a 6-digit code. No password." />
        <AdminField label="E-mail" error={tried && !ok ? "That e-mail doesn't look right." : undefined}>
          {(f) => <input {...f} type="email" autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={cn(adminControl, "h-11")} />}
        </AdminField>
        <AdminButton type="submit" className="w-full">Send code</AdminButton>
        <AdminButton type="button" hierarchy="secondary" className="w-full" onClick={() => router.push("/signup/create")}>
          Create account
        </AdminButton>
      </form>
    </SignupFrame>
  )
}
