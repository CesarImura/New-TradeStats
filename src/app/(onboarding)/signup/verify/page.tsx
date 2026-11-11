"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "@/components/icons"
import { toast } from "sonner"
import { OnbFrame, OnbTitle, ProtoNote, mono } from "@/components/onboarding/frame"
import { AdminButton } from "@/components/admin/ui"
import { setAccount } from "@/lib/data/communities"
import { useAccount } from "@/lib/data/use-communities"
import { cn } from "@/lib/utils"

/** Onboarding · 02 Verify e-mail (Figma 521:7198). Six digits; Verify lights up with all of them. */
export default function Verify() {
  const router = useRouter()
  const acc = useAccount()
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""))
  const [checking, setChecking] = useState(false)
  const [wait, setWait] = useState(30)
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const full = digits.every(Boolean)

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
      router.push(acc?.approved ? "/signup/welcome" : "/signup/about")
    }, 700)
  }

  const set = (i: number, value: string) => {
    const clean = value.replace(/\D/g, "")
    if (!clean) return setDigits((d) => d.map((x, j) => (j === i ? "" : x)))
    // Typing one digit, or pasting the whole code into any box.
    const next = [...digits]
    clean.split("").slice(0, 6 - i).forEach((d, k) => (next[i + k] = d))
    setDigits(next)
    refs.current[Math.min(5, i + clean.length)]?.focus()
    if (next.every(Boolean)) verify(next)
  }

  return (
    <OnbFrame
      right={
        <>
          <span className={cn(mono, "hidden text-a-text-3 sm:inline")}>Step 2 of 4</span>
          <Link href="/signup" className="rounded-a-xs outline-none hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus">← Back</Link>
        </>
      }>
      <div className="grid gap-5">
        <OnbTitle eyebrow="Check your inbox" title="Enter the 6-digit code" text={<>We sent it to {acc?.email || "your e-mail"}.</>} />
        <div className="grid grid-cols-6 gap-2.5" role="group" aria-label="Verification code">
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
              className="h-14 min-w-0 rounded-a-md border border-a-border-subtle bg-a-field text-center t-title text-a-text outline-none transition-colors duration-300 hover:border-a-border-strong focus:border-a-border-focus disabled:opacity-60"
            />
          ))}
        </div>
        <AdminButton className="h-11 w-full" disabled={!full || checking} onClick={() => verify()}>
          {checking ? <><Loader2 className="animate-spin" /> Checking…</> : "Verify"}
        </AdminButton>
        <div className="flex flex-wrap items-center justify-between gap-3 t-body-m text-a-text-2">
          <span>
            Didn&apos;t get it?{" "}
            {wait > 0 ? (
              <span className="tabular-nums">Resend in 0:{String(wait).padStart(2, "0")}</span>
            ) : (
              <button className="rounded-a-xs text-a-text-accent outline-none hover:underline focus-visible:ring-2 focus-visible:ring-a-border-focus" onClick={() => (setWait(30), toast("New code sent."))}>
                Send a new code
              </button>
            )}
          </span>
          <Link href="/signup" className="rounded-a-xs outline-none hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus">Change e-mail</Link>
        </div>
      </div>
      <div className="mt-5 border-t border-a-border pt-4">
        <ProtoNote>Any six digits work. Paste works too.</ProtoNote>
      </div>
    </OnbFrame>
  )
}
