"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Loader2 } from "@/components/icons"
import { SignupFrame, SignupTitle } from "@/components/onboarding/signup-frame"
import { AdminButton } from "@/components/admin/ui"
import { account, customCommunities, setAccount } from "@/lib/data/communities"
import { useAccount } from "@/lib/data/use-communities"

/**
 * Sign up · 03 Verify code (Figma 939:58478). Six boxes (Admin / Code box: 56 × 64, radius 10); paste works in any box
 * and the last digit verifies. Any six digits pass in the prototype. A coach logging back in goes to their platform;
 * everyone else goes on to About you.
 */
export default function Verify() {
  const router = useRouter()
  const acc = useAccount()
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""))
  const [checking, setChecking] = useState(false)
  const [wait, setWait] = useState(30)
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const full = digits.every(Boolean)
  const back = acc?.mode === "create" ? "/signup/create" : "/signup"

  useEffect(() => {
    if (wait <= 0) return
    const t = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])

  const verify = (next = digits) => {
    if (next.some((d) => !d) || checking) return
    setChecking(true)
    setTimeout(() => {
      setAccount({ verified: true })
      const a = account()
      const mine = a?.setupSlug ? customCommunities().find((c) => c.slug === a.setupSlug) : undefined
      if (a?.mode === "login" && mine) router.push(mine.status === "live" ? `/admin/${mine.slug}` : `/admin/${mine.slug}/getting-started`)
      else router.push("/signup/about")
    }, 600)
  }

  const set = (i: number, value: string) => {
    const clean = value.replace(/\D/g, "")
    if (!clean) return setDigits((d) => d.map((x, j) => (j === i ? "" : x)))
    // One digit typed, or the whole code pasted into any box.
    const next = [...digits]
    clean
      .split("")
      .slice(0, 6 - i)
      .forEach((d, k) => (next[i + k] = d))
    setDigits(next)
    refs.current[Math.min(5, i + clean.length)]?.focus()
    if (next.every(Boolean)) verify(next)
  }

  return (
    <SignupFrame>
      <div className="flex flex-col gap-5">
        <AdminButton hierarchy="ghost" className="-ml-2 w-fit" onClick={() => router.push(back)}>
          <ArrowLeft /> Back
        </AdminButton>
        <SignupTitle title="Enter the 6-digit code" text={<>We sent it to {acc?.email || "your e-mail"}.</>} />
        <div className="flex gap-3 max-sm:gap-2" role="group" aria-label="Verification code">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el
              }}
              value={d}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              autoFocus={i === 0}
              aria-label={`Digit ${i + 1}`}
              disabled={checking}
              onChange={(e) => set(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !d && i > 0) refs.current[i - 1]?.focus()
                if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus()
                if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus()
                if (e.key === "Enter") verify()
              }}
              onFocus={(e) => e.target.select()}
              className="h-16 w-14 min-w-0 rounded-a-10 border border-a-border-strong bg-a-subtle text-center t-heading-xl text-a-text outline-none transition-[background-color,border-color] duration-300 ease-out hover:bg-a-hover focus:border-a-border-active focus:bg-a-raised disabled:opacity-40 max-sm:w-auto max-sm:flex-1"
            />
          ))}
        </div>
        <AdminButton className="w-full" disabled={!full || checking} onClick={() => verify()}>
          {checking ? (
            <>
              <Loader2 className="animate-spin" /> Checking…
            </>
          ) : (
            "Verify"
          )}
        </AdminButton>
        <div className="flex flex-wrap items-center gap-1.5 t-body-m text-a-text-2">
          <span>Didn&apos;t get it?</span>
          {wait > 0 ? (
            <span className="tabular-nums text-a-text-3">Send a new code in 0:{String(wait).padStart(2, "0")}</span>
          ) : (
            <button className="rounded-a-xs text-a-text-accent outline-none hover:underline focus-visible:ring-2 focus-visible:ring-a-border-focus" onClick={() => (setWait(30), toast("New code sent."))}>
              Send a new code
            </button>
          )}
          <button className="ml-auto rounded-a-xs outline-none hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus" onClick={() => router.push(back)}>
            Change e-mail
          </button>
        </div>
      </div>
    </SignupFrame>
  )
}
