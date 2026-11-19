"use client"

import { useState, useSyncExternalStore } from "react"
import { ArrowLeft } from "@/components/icons"
import { SelectField } from "@/components/kit/select-field"
import { createCommunity } from "@/components/onboarding/setup-community"
import { SignupFrame, SignupTitle, useNeedsAccount, useSignupGo } from "@/components/onboarding/signup-frame"
import { AdminButton, AdminField, adminControl } from "@/components/admin/ui"
import { Checkbox } from "@/components/ui/checkbox"
import { account, setAccount } from "@/lib/data/communities"
import { useAccount } from "@/lib/data/use-communities"
import { cn } from "@/lib/utils"

const MAX = 40
const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
]

/**
 * Sign up · 05 Name and language (Figma 950:8284). The platform name (the web address is suggested from it and only
 * confirmed at Go live), what students call the coach, the language, and the TraderHub terms. Continue makes the
 * platform as a draft and opens Getting started.
 */
const noop = () => () => {}
/** What was typed here before going Back, as one stable string. */
const drafted = () => JSON.stringify(account()?.nameDraft ?? null)

export default function NamePlatform() {
  useNeedsAccount()
  const go = useSignupGo()
  const acc = useAccount()
  const first = acc?.name.trim().split(/\s+/)[0] ?? ""
  const [name, setName] = useState("")
  const [call, setCall] = useState<string>()
  const [language, setLanguage] = useState("en")
  const [terms, setTerms] = useState(false)
  // Rule (19/11): Continue stays disabled until the name, what students call you and the terms are all in; the short-name error shows only after the field was left with something typed.
  const [left, setLeft] = useState(false)
  // Coming back to this screen: what was typed comes back, read once on the client.
  const saved = useSyncExternalStore(noop, drafted, () => "null")
  const [seeded, setSeeded] = useState(false)
  if (saved !== "null" && !seeded) {
    setSeeded(true)
    const d = JSON.parse(saved) as { name: string; call?: string; language: string }
    setName(d.name)
    setCall(d.call)
    setLanguage(d.language)
  }
  const back = () => {
    setAccount({ nameDraft: { name, call, language } })
    go("/signup/about", -1)
  }
  const callAs = call ?? first
  const errors = { name: name.trim().length < 2 ? "Use at least 2 characters." : undefined, call: !callAs.trim() ? "Tell students what to call you." : undefined }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (errors.name || errors.call || !terms) return
    const slug = createCommunity({ name: name.trim(), coachName: callAs.trim(), language, account: account() })
    setAccount({ nameDraft: undefined })
    go(`/admin/${slug}/getting-started`)
  }

  return (
    <SignupFrame>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <AdminButton type="button" hierarchy="text" className="w-fit pl-0 [&_svg]:transition-transform [&_svg]:duration-200 hover:[&_svg]:-translate-x-0.5" onClick={back}>
          <ArrowLeft /> Back
        </AdminButton>
        <SignupTitle title="Name your platform" text="Students see this name. You can change it later." />
        <div className="flex flex-col gap-4">
          <AdminField label="Platform name" error={left && name.trim() ? errors.name : undefined}>
            {(f) => (
              <span className="relative block">
                <input {...f} autoFocus maxLength={MAX} value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setLeft(true)} placeholder="e.g. Lio Trading Floor" className={cn(adminControl, "h-11 pr-16")} />
                <span aria-hidden className="pointer-events-none absolute inset-y-0 right-3 flex items-center t-body-m text-a-text-3 tabular-nums">
                  {name.length}/{MAX}
                </span>
              </span>
            )}
          </AdminField>
          <AdminField label="What students call you" hint={<>Students see: “{callAs.trim() || "Your name"} posted a new lesson.”</>} >
            {(f) => <input {...f} value={callAs} onChange={(e) => setCall(e.target.value)} placeholder="First name or nickname" className={cn(adminControl, "h-11")} />}
          </AdminField>
          <AdminField label="Language" hint="Used in your admin and on your students’ platform.">
            {(f) => <SelectField id={f.id} value={language} onValueChange={setLanguage} options={LANGUAGES} className={cn(adminControl, "h-11! w-full justify-between rounded-a-md! border-a-border-subtle! bg-a-field! text-[14px]! shadow-none! hover:border-a-border-strong!")} />}
          </AdminField>
        </div>
        <label className="flex items-center gap-2.5 t-body-m text-a-text-2">
          <Checkbox checked={terms} onCheckedChange={(v) => setTerms(!!v)} className="rounded-a-xs! border-a-border-strong! bg-a-field! data-checked:border-[var(--admin-color-control-on)]! data-checked:bg-[var(--admin-color-control-on)]! data-checked:text-white" />
          <span>
            I accept the TraderHub{" "}
            <a href="#" onClick={(e) => e.preventDefault()} className="rounded-a-xs text-a-text-accent outline-none hover:underline focus-visible:ring-2 focus-visible:ring-a-border-focus">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" onClick={(e) => e.preventDefault()} className="rounded-a-xs text-a-text-accent outline-none hover:underline focus-visible:ring-2 focus-visible:ring-a-border-focus">
              Privacy Policy
            </a>
            .
          </span>
        </label>
        {/* Figma 950:8284: Continue on the right, 8 px more above it. */}
        <div className="flex justify-end pt-2">
          <AdminButton type="submit" size="xl" disabled={!!errors.name || !!errors.call || !terms}>
            Continue
          </AdminButton>
        </div>
      </form>
    </SignupFrame>
  )
}
