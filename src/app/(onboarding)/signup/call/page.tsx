"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check } from "@/components/icons"
import { OnbFrame, mono } from "@/components/onboarding/frame"
import { TOOLS } from "@/components/onboarding/suggest"
import { AdminButton, Tag } from "@/components/admin/ui"
import { setAccount } from "@/lib/data/communities"
import { useAccount } from "@/lib/data/use-communities"
import { cn } from "@/lib/utils"

/** The week of 9 November; the first time of the day and the last are taken. */
const SLOTS = ["09:00", "10:00", "11:30", "14:00", "16:30", "17:30"]
const DAYS = [
  { id: "mon", label: "Mon", n: 9, full: "Monday", taken: ["09:00", "10:00", "11:30", "14:00", "16:30", "17:30"] },
  { id: "tue", label: "Tue", n: 10, full: "Tuesday", taken: ["09:00", "17:30"] },
  { id: "wed", label: "Wed", n: 11, full: "Wednesday", taken: ["11:30"] },
  { id: "thu", label: "Thu", n: 12, full: "Thursday", taken: ["09:00", "16:30"] },
  { id: "fri", label: "Fri", n: 13, full: "Friday", taken: ["14:00", "16:30", "17:30"] },
]

/** Onboarding · 04 Book a setup call (Figma 521:7318): free, for big communities and coaches switching platforms. */
export default function Call() {
  const router = useRouter()
  const acc = useAccount()
  const [day, setDay] = useState("tue")
  const [time, setTime] = useState<string>()
  const d = DAYS.find((x) => x.id === day)!
  const from = TOOLS.find((t) => acc?.answers?.tools.includes(t.id) && t.platform)?.label ?? "where you sell today"
  const book = () => {
    if (!time) return
    setAccount({ call: { date: `${d.label} ${d.n}`, time }, route: "B" })
    router.push("/signup/welcome")
  }

  return (
    <OnbFrame
      right={
        <>
          <span className={cn(mono, "hidden text-a-text-3 sm:inline")}>Step 4 of 4</span>
          <Link href="/signup/about" className="rounded-a-xs outline-none hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus">← Back</Link>
        </>
      }
      size="xl">
      <div className="-m-6 grid md:-m-8 md:grid-cols-[1fr_1fr] max-md:gap-0">
        <div className="grid content-start gap-5 p-6 md:p-8">
          <div className="grid gap-2">
            <span className="t-mono-label-s text-a-text-accent">Free · white-glove setup</span>
            <h1 className="t-title leading-[1.15]! text-a-text">Let us set it up with you.</h1>
            <p className="t-body-m text-a-text-2">30 minutes on a call. We copy your tiers, prices and students from where you sell today.</p>
          </div>
          <div className="grid gap-2">
            <span className="t-mono-label-s text-a-text-2">What we&apos;ll have ready</span>
            <ul className="grid gap-2 t-body-m text-a-text">
              {[`Your tiers and prices, copied from ${from}`, "Your students, invited with their tier", "Your videos, moved into courses"].map((p) => (
                <li key={p} className="flex gap-2"><span aria-hidden className="text-a-text-3">•</span>{p}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="grid content-start gap-4 border-t border-a-border p-6 md:border-t-0 md:border-l md:p-8">
          <div className="flex items-center gap-2">
            <h2 className="t-heading-s text-a-text">Setup call</h2>
            <Tag>30 min</Tag>
          </div>
          <p className="t-caption text-a-text-2">Times in your zone · CET</p>
          <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="Day">
            {DAYS.map((x) => (
              <button key={x.id} type="button" role="radio" aria-checked={day === x.id} onClick={() => (setDay(x.id), setTime(undefined))} className={cn("grid gap-0.5 rounded-a-md border py-2 text-center outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-a-border-focus", day === x.id ? "border-a-accent bg-a-accent text-[var(--admin-component-button-primary-content)]" : "border-a-border hover:border-a-border-strong")}>
                <span className="t-caption">{x.label}</span>
                <span className="t-body-m tabular-nums">{x.n}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Time">
            {SLOTS.map((t) => {
              const off = d.taken.includes(t)
              return (
                <button key={t} type="button" role="radio" aria-checked={time === t} disabled={off} onClick={() => setTime(t)} className={cn("h-9 rounded-a-md border t-body-m tabular-nums outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-a-border-focus disabled:pointer-events-none disabled:opacity-40", time === t ? "border-a-border-active bg-a-raised" : "border-a-border hover:border-a-border-strong")}>
                  {t}
                </button>
              )
            })}
          </div>
          {time && (
            <div className="flex items-center gap-2.5 rounded-a-md border border-a-border bg-a-subtle px-3 py-2.5">
              <span aria-hidden className="grid size-5 shrink-0 place-items-center rounded-full bg-a-success-soft text-a-success"><Check className="size-3" strokeWidth={3} /></span>
              <span className="grid">
                <span className="t-body-m text-a-text">{d.full} {d.n} · {time} · Europe/Berlin</span>
                <span className="t-caption text-a-text-2">We confirm by email with the first version already up.</span>
              </span>
            </div>
          )}
          <AdminButton className="h-11 w-full" disabled={!time} onClick={book}>{time ? `Book ${d.label} ${d.n} at ${time}` : "Pick a time"}</AdminButton>
          <Link href="/setup" onClick={() => setAccount({ route: "C" })} className="w-fit rounded-a-xs t-body-m text-a-text-2 outline-none hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus">
            Or skip and set it up yourself
          </Link>
        </div>
      </div>
    </OnbFrame>
  )
}
