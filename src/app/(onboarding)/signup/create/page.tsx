"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "@/components/icons"
import { SignupFrame, SignupTitle } from "@/components/onboarding/signup-frame"
import { AdminButton, AdminField, adminControl } from "@/components/admin/ui"
import { setAccount } from "@/lib/data/communities"
import { cn } from "@/lib/utils"

/** Sign up · 02 Create account (Figma 939:57971). Name and e-mail; the code on the next screen proves the address. */
export default function CreateAccount() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [tried, setTried] = useState(false)
  const errors = {
    name: !name.trim() ? "Tell us your name." : undefined,
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? "That e-mail doesn't look right." : undefined,
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (errors.name || errors.email) return
    // A new account starts clean: no answers and no platform yet.
    setAccount(null)
    setAccount({ name: name.trim(), email: email.trim(), approved: false, verified: false, mode: "create" })
    router.push("/signup/verify")
  }

  return (
    <SignupFrame>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <AdminButton type="button" hierarchy="ghost" className="-ml-2 w-fit" onClick={() => router.push("/signup")}>
          <ArrowLeft /> Back
        </AdminButton>
        <SignupTitle title="Create your account" text="We e-mail you a 6-digit code. No password." />
        <AdminField label="Your name" error={tried ? errors.name : undefined}>
          {(f) => <input {...f} autoComplete="name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={cn(adminControl, "h-11")} />}
        </AdminField>
        <AdminField label="E-mail" error={tried ? errors.email : undefined}>
          {(f) => <input {...f} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={cn(adminControl, "h-11")} />}
        </AdminField>
        <AdminButton type="submit" className="w-full">Continue</AdminButton>
      </form>
    </SignupFrame>
  )
}
