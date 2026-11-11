"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "@/components/icons"
import { toast } from "sonner"
import { OnbFrame, OnbTitle, ProtoNote, mono } from "@/components/onboarding/frame"
import { AdminButton, AdminField, adminControl } from "@/components/admin/ui"
import { isPreApproved, setAccount } from "@/lib/data/communities"
import { cn } from "@/lib/utils"

/** Onboarding · 01 Sign up (Figma 521:7153). Name, e-mail, and a password or an e-mail code. Nothing else. */
export default function SignUp() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [withCode, setWithCode] = useState(false)
  const [show, setShow] = useState(false)
  const [tried, setTried] = useState(false)

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const errors = {
    name: !name.trim() ? "Tell us your name." : "",
    email: !emailOk ? "That e-mail doesn't look right." : "",
    password: !withCode && password.length < 8 ? "At least 8 characters." : "",
  }
  const valid = !errors.name && !errors.email && !errors.password

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (!valid) return
    setAccount(null)
    setAccount({ name: name.trim(), email: email.trim(), approved: isPreApproved(email), verified: false })
    router.push("/signup/verify")
  }

  return (
    <OnbFrame
      right={
        <>
          <span className={cn(mono, "hidden text-a-text-3 sm:inline")}>Step 1 of 4</span>
          <span className="hidden sm:inline">Have an account?</span>
          <button className="rounded-a-xs text-a-text outline-none hover:underline focus-visible:ring-2 focus-visible:ring-a-border-focus" onClick={() => toast("Log in comes with the student and coach login screens (PUB-08).")}>
            Log in
          </button>
        </>
      }>
      <form onSubmit={submit} className="grid gap-5" noValidate>
        <OnbTitle eyebrow="Start free · 14 days" title="Your trading community, on your own platform." text="Courses, live calls, journal and payments under your brand. Most coaches are live within the hour." />
        <div className="grid gap-4">
          <AdminField label="Your name" error={tried ? errors.name : undefined}>
            <input autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Marco Rossi" autoFocus aria-invalid={tried && !!errors.name} className={cn(adminControl, "h-11")} />
          </AdminField>
          <AdminField label="E-mail" error={tried ? errors.email : undefined}>
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourbrand.com" aria-invalid={tried && !!errors.email} className={cn(adminControl, "h-11")} />
          </AdminField>
          {!withCode && (
            <AdminField label="Password" hint={tried && errors.password ? undefined : "At least 8 characters."} error={tried ? errors.password : undefined}>
              {(f) => (
                <span className="relative block">
                  <input {...f} type={show ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={cn(adminControl, "h-11 pr-11")} />
                  <button type="button" onClick={() => setShow((s) => !s)} className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-a-md text-a-icon outline-none hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus" aria-label={show ? "Hide password" : "Show password"}>
                    {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </span>
              )}
            </AdminField>
          )}
        </div>
        <AdminButton type="submit" className="h-11 w-full">Create my platform</AdminButton>
        <button type="button" onClick={() => setWithCode((w) => !w)} className="w-fit rounded-a-xs t-body-m text-a-text-2 outline-none hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus">
          {withCode ? "Use a password instead" : "No password? E-mail me a code each time"}
        </button>
        <p className="t-caption text-a-text-3">
          By continuing you agree to the terms and privacy policy. No card needed.
        </p>
      </form>
      <div className="mt-5 border-t border-a-border pt-4">
        <ProtoNote>
          Use an address ending in <span className="text-a-text-2">@approved.com</span> to see the pre-approved route. Any other address gets the three questions. Nothing is sent anywhere.
        </ProtoNote>
      </div>
    </OnbFrame>
  )
}
