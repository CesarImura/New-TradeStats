"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SelectField } from "@/components/kit/select-field"
import { createCommunity } from "@/components/onboarding/setup-community"
import { SignupFrame, SignupTitle } from "@/components/onboarding/signup-frame"
import { AdminButton, AdminField, adminControl } from "@/components/admin/ui"
import { Checkbox } from "@/components/ui/checkbox"
import { account } from "@/lib/data/communities"
import { useAccount } from "@/lib/data/use-communities"
import { cn } from "@/lib/utils"

const MAX = 40
const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
  { value: "es", label: "Español" },
  { value: "pt", label: "Português" },
  { value: "fr", label: "Français" },
  { value: "it", label: "Italiano" },
]

/**
 * Sign up · 05 Name and language (Figma 950:8284). The platform name (the web address is suggested from it and only
 * confirmed at Go live), what students call the coach, the language, and the TraderHub terms. Continue makes the
 * platform as a draft and opens Getting started.
 */
export default function NamePlatform() {
  const router = useRouter()
  const acc = useAccount()
  const first = acc?.name.trim().split(/\s+/)[0] ?? ""
  const [name, setName] = useState("")
  const [call, setCall] = useState<string>()
  const [language, setLanguage] = useState("en")
  const [terms, setTerms] = useState(false)
  const [tried, setTried] = useState(false)
  const callAs = call ?? first
  const errors = { name: name.trim().length < 2 ? "Give your platform a name." : undefined, call: !callAs.trim() ? "Tell students what to call you." : undefined }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (errors.name || errors.call || !terms) return
    const slug = createCommunity({ name: name.trim(), coachName: callAs.trim(), language, account: account() })
    router.push(`/admin/${slug}/getting-started`)
  }

  return (
    <SignupFrame>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <SignupTitle title="Name your platform" text="Students see this name. You can change it later." />
        <div className="flex flex-col gap-4">
          <AdminField label="Platform name" hint="We suggest your web address from this name. You confirm it when you go live." error={tried ? errors.name : undefined}>
            {(f) => (
              <span className="relative block">
                <input {...f} autoFocus maxLength={MAX} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lio Trading Floor" className={cn(adminControl, "h-11 pr-16")} />
                <span aria-hidden className="pointer-events-none absolute inset-y-0 right-3 flex items-center t-body-m text-a-text-3 tabular-nums">
                  {name.length}/{MAX}
                </span>
              </span>
            )}
          </AdminField>
          <AdminField label="What students call you" hint={<>Students see: “{callAs.trim() || "Your name"} posted a new lesson.”</>} error={tried ? errors.call : undefined}>
            {(f) => <input {...f} value={callAs} onChange={(e) => setCall(e.target.value)} placeholder="First name or nickname" className={cn(adminControl, "h-11")} />}
          </AdminField>
          <AdminField label="Language" hint="Used in your admin and on your students’ platform.">
            {(f) => <SelectField id={f.id} value={language} onValueChange={setLanguage} options={LANGUAGES} className={cn(adminControl, "h-11 w-full justify-between")} />}
          </AdminField>
        </div>
        <label className="flex items-center gap-2.5 t-body-m text-a-text-2">
          <Checkbox checked={terms} onCheckedChange={(v) => setTerms(!!v)} aria-invalid={tried && !terms ? true : undefined} className="border-a-border-strong data-checked:border-a-accent data-checked:bg-a-accent data-checked:text-[var(--admin-component-button-primary-content)]" />
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
        {tried && !terms && <p className="-mt-3 t-caption text-a-danger">Accept the terms to continue.</p>}
        <div>
          <AdminButton type="submit">Continue</AdminButton>
        </div>
      </form>
    </SignupFrame>
  )
}
