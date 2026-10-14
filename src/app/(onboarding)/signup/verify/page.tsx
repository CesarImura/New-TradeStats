"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "@/components/icons"
import { toast } from "sonner"
import { OnbFrame, OnbTitle, ProtoNote } from "@/components/onboarding/frame"
import { setAccount } from "@/lib/data/communities"
import { useAccount } from "@/lib/data/use-communities"
import { cn } from "@/lib/utils"

/** ONB-02 · Six-digit code that verifies the e-mail. */
export default function Verify() {
  const router = useRouter()
  const acc = useAccount()
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""))
  const [checking, setChecking] = useState(false)
  const [wait, setWait] = useState(30)
  const refs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (wait <= 0) return
    const t = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])

  const complete = (next: string[]) => {
    if (next.some((d) => !d)) return
    setChecking(true)
    setTimeout(() => {
      setAccount({ verified: true })
      router.push(acc?.approved ? "/signup/welcome" : "/signup/about")
    }, 700)
  }

  const set = (i: number, value: string) => {
    const clean = value.replace(/\D/g, "")
    if (!clean) {
      const next = digits.map((d, j) => (j === i ? "" : d))
      setDigits(next)
      return
    }
    // Typing one digit, or pasting the whole code into any box.
    const next = [...digits]
    clean.split("").slice(0, 6 - i).forEach((d, k) => (next[i + k] = d))
    setDigits(next)
    refs.current[Math.min(5, i + clean.length)]?.focus()
    complete(next)
  }

  return (
    <OnbFrame>
      <div className="grid gap-8">
        <OnbTitle
          eyebrow="Check your inbox"
          title="Enter the 6-digit code"
          text={
            <>
              We sent it to <span className="text-foreground">{acc?.email || "your e-mail"}</span>. It works for 10 minutes.
            </>
          }
        />

        <div className="flex gap-2" role="group" aria-label="Verification code">
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
              }}
              onFocus={(e) => e.target.select()}
              className={cn(
                "h-14 w-full min-w-0 rounded-[var(--radius)] border border-input bg-card text-center font-[family-name:var(--ff-plex-mono)] text-2xl outline-none focus:border-[var(--ts-interactive)] focus:ring-2 focus:ring-[var(--ts-interactive)]/30 disabled:opacity-60",
                i === 3 && "ml-3",
              )}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          {checking ? (
            <span className="flex items-center gap-2 text-foreground">
              <Loader2 className="size-4 animate-spin" /> Checking…
            </span>
          ) : wait > 0 ? (
            <span className="tabular-nums">Resend in 0:{String(wait).padStart(2, "0")}</span>
          ) : (
            <button
              className="text-foreground underline underline-offset-4"
              onClick={() => {
                setWait(30)
                toast("New code sent.")
              }}
            >
              Send a new code
            </button>
          )}
          <Link href="/signup" className="underline underline-offset-4 hover:text-foreground">
            Wrong e-mail?
          </Link>
        </div>

        <ProtoNote>Any six digits work. Paste works too.</ProtoNote>
      </div>
    </OnbFrame>
  )
}
