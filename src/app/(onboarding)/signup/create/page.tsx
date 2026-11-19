"use client"

import { useState, useSyncExternalStore } from "react"
import { ArrowLeft } from "@/components/icons"
import { SignupFrame, SignupTitle, useSignupGo } from "@/components/onboarding/signup-frame"
import { AdminButton, AdminField, adminControl } from "@/components/admin/ui"
import { account, setAccount } from "@/lib/data/communities"
import { cn } from "@/lib/utils"

const noop = () => () => {}
/** The name and e-mail of an account that hasn't confirmed its code yet, as one stable string. */
const unfinished = () => {
  const a = account()
  // Also after the code, when the coach came Back from About you (Flavio, 14/11).
  return a && a.mode === "create" && !a.setupSlug ? `${a.name}\n${a.email}` : ""
}

/** Sign up · 02 Create account (Figma 939:57971). Name and e-mail; the code on the next screen proves the address. */
export default function CreateAccount() {
  const go = useSignupGo()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  // Rule (19/11): the button stays disabled until both fields are valid; the e-mail format error shows only after the field was left with something typed.
  const [left, setLeft] = useState(false)
  // Back from the code (or Change e-mail): what was typed comes back, read once on the client.
  const saved = useSyncExternalStore(noop, unfinished, () => "")
  const [seeded, setSeeded] = useState(false)
  if (saved && !seeded) {
    setSeeded(true)
    const [n, m] = saved.split("\n")
    setName(n)
    setEmail(m)
  }
  const errors = {
    name: !name.trim() ? "Tell us your name." : undefined,
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? "That e-mail doesn't look right." : undefined,
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (errors.name || errors.email) return
    // A new account starts clean: no answers and no platform yet. Back from About you with the same e-mail keeps
    // what was already answered.
    const before = account()
    const keep = before && !before.setupSlug && before.email === email.trim() ? { answers: before.answers, nameDraft: before.nameDraft } : {}
    setAccount(null)
    setAccount({ name: name.trim(), email: email.trim(), approved: false, verified: false, mode: "create", ...keep })
    go("/signup/verify")
  }

  return (
    <SignupFrame>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <AdminButton type="button" hierarchy="text" className="w-fit pl-0 [&_svg]:transition-transform [&_svg]:duration-200 hover:[&_svg]:-translate-x-0.5" onClick={() => go("/signup", -1)}>
          <ArrowLeft /> Back
        </AdminButton>
        <SignupTitle title="Create your account" text="We e-mail you a 6-digit code. No password." />
        <AdminField label="Your name">
          {(f) => <input {...f} autoComplete="name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={cn(adminControl, "h-11")} />}
        </AdminField>
        <AdminField label="E-mail" error={left && email.trim() ? errors.email : undefined}>
          {(f) => <input {...f} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setLeft(true)} placeholder="you@example.com" className={cn(adminControl, "h-11")} />}
        </AdminField>
        <AdminButton type="submit" className="w-full" disabled={!!errors.name || !!errors.email}>Continue</AdminButton>
      </form>
    </SignupFrame>
  )
}
