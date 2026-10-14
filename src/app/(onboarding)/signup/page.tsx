"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Eye, EyeOff } from "@/components/icons"
import { toast } from "sonner"
import { Eyebrow, OnbFrame, OnbTitle, ProtoNote } from "@/components/onboarding/frame"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { isPreApproved, setAccount } from "@/lib/data/communities"

/** ONB-01 · Coach sign-up. Name, e-mail, and a password or an e-mail code. Nothing else. */
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
    name: !name.trim() && "Tell us your name.",
    email: !emailOk && "That e-mail doesn't look right.",
    password: !withCode && password.length < 8 && "At least 8 characters.",
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
          Have an account?
          <button className="text-foreground underline underline-offset-4" onClick={() => toast("Log in comes with the student and coach login screens (PUB-08).")}>
            Log in
          </button>
        </>
      }
    >
      <form onSubmit={submit} className="grid gap-5" noValidate>
        <OnbTitle
          eyebrow="Start free · 14 days"
          title="Your trading community, on your own platform."
          text="Courses, live calls, journal and payments under your brand. Most coaches are live within the hour."
        />

        <div className="grid gap-4">
          <FieldRow id="name" label="Your name" error={tried && errors.name}>
            <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Marco Rossi" autoFocus />
          </FieldRow>
          <FieldRow id="email" label="E-mail" error={tried && errors.email}>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourbrand.com" />
          </FieldRow>

          {!withCode && (
            <FieldRow id="password" label="Password" error={tried && errors.password}>
              <div className="relative">
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </FieldRow>
          )}

          <button type="button" onClick={() => setWithCode((w) => !w)} className="w-fit text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
            {withCode ? "Use a password instead" : "No password — e-mail me a code each time"}
          </button>
        </div>

        <div className="grid gap-3">
          <Button type="submit" className="w-full justify-between">
            Create my account <ArrowRight />
          </Button>
          <p className="text-xs text-muted-foreground">
            By continuing you agree to the <a className="underline underline-offset-2">terms</a> and{" "}
            <a className="underline underline-offset-2">privacy policy</a>. No card needed.
          </p>
        </div>

        <ProtoNote>
          Use an address ending in <span className="text-foreground">@approved.com</span> to see the pre-approved route. Any other address
          gets the three questions. Nothing is sent anywhere.
        </ProtoNote>
      </form>
    </OnbFrame>
  )
}

function FieldRow({ id, label, error, children }: { id: string; label: string; error?: string | false; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-[0.8rem] font-normal text-muted-foreground">
        {label}
      </Label>
      {children}
      {error && <Eyebrow className="normal-case tracking-normal">{error}</Eyebrow>}
    </div>
  )
}
