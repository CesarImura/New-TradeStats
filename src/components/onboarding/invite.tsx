"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowRight, Check, Copy, ExternalLink, Upload } from "@/components/icons"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { updateCommunity } from "@/lib/data/communities"
import { useAccount, useCustomCommunities } from "@/lib/data/use-communities"
import { cn } from "@/lib/utils"
import { OnbFrame, OnbTitle, ProtoNote, mono } from "./frame"

const SOURCES = ["Discord", "Whop", "Skool", "Kajabi", "CSV file"]

/** ONB-16 · Invite students: a join link, e-mail invites, or an import. */
export function InviteStep() {
  const acc = useAccount()
  const communities = useCustomCommunities()
  // "?c=<slug>" (from the admin's getting-started list) picks the community; otherwise the one just set up.
  const slug = useSearchParams().get("c") ?? acc?.setupSlug
  const c = communities.find((x) => x.slug === slug)
  const [copied, setCopied] = useState(false)
  const [emails, setEmails] = useState("")
  if (!c) return <OnbFrame>{null}</OnbFrame>

  const link = `https://${c.slug}.tradestats.app/join`
  const list = [...new Set(emails.split(/[\s,;]+/).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)))]
  const invited = c.setup?.invited ?? 0

  return (
    <OnbFrame>
      <div className="grid gap-5">
        <OnbTitle
          eyebrow="You're live"
          title={<>{c.name} is published.</>}
          text={`Now bring your first ${c.wording.students.toLowerCase()} in. They get an e-mail, set a password, and land on your ${c.wording.home.toLowerCase()} page.`}
        />

        <section className="grid gap-2.5">
          <span className={cn(mono, "text-muted-foreground")}>Share your join link</span>
          <div className="flex h-8 items-center gap-2 rounded-[4px] border border-[#2a2a2f] bg-[#0e0e10] pr-0.5 pl-2.5 text-[0.8125rem] shadow-[inset_0_1px_2px_rgb(0_0_0/0.35)]">
            <span className="min-w-0 flex-1 truncate text-sm">{link}</span>
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(link)
                } catch {}
                setCopied(true)
                setTimeout(() => setCopied(false), 1600)
              }}
            >
              {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <span className="text-xs text-muted-foreground">Post it in your Discord, Telegram or bio. It opens your sales page with your tiers.</span>
        </section>

        <section className="grid gap-2.5">
          <div className="flex items-baseline justify-between">
            <span className={cn(mono, "text-muted-foreground")}>Or invite by e-mail</span>
            {invited > 0 && <span className="text-xs text-[var(--ts-cta)]">{invited} invited so far</span>}
          </div>
          <Textarea
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder={"anna@example.com, ben@example.com\nOne per line or separated by commas"}
            className="min-h-24 bg-card"
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {list.length ? `${list.length} address${list.length === 1 ? "" : "es"} · they join ${c.tiers[0]?.name ?? "your first tier"}` : "Paste a list from anywhere"}
            </span>
            <Button
              size="sm"
              disabled={!list.length}
              onClick={() => {
                updateCommunity(c.slug, { setup: { ...c.setup, invited: invited + list.length } })
                toast.success(`${list.length} invite${list.length === 1 ? "" : "s"} sent`, { description: "Prototype: no e-mails actually go out." })
                setEmails("")
              }}
            >
              Send invites
            </Button>
          </div>
        </section>

        <section className="grid gap-2.5">
          <span className={cn(mono, "text-muted-foreground")}>Moving a community over?</span>
          <div className="flex flex-wrap gap-2">
            {SOURCES.map((s) => (
              <Button key={s} variant="outline" size="sm" onClick={() => toast(`Import from ${s} comes with the student import screen (ADM-15).`)}>
                <Upload /> {s}
              </Button>
            ))}
          </div>
        </section>

        <div className="grid gap-3 border-t pt-6">
          <Button className="w-full justify-between" nativeButton={false} render={<Link href={`/admin/${c.slug}`} />}>
            Go to my dashboard <ArrowRight />
          </Button>
          <div className="flex justify-between gap-3 text-sm">
            <Link href={`/c/${c.slug}`} className="flex items-center gap-1.5 text-muted-foreground underline underline-offset-4 hover:text-foreground">
              See it as a student <ExternalLink className="size-3.5" />
            </Link>
            <Link href={`/admin/${c.slug}`} className="text-muted-foreground underline underline-offset-4 hover:text-foreground">
              Skip for now
            </Link>
          </div>
        </div>

        <ProtoNote>The community is saved in this browser only. It shows up in the admin community switcher and on the start page.</ProtoNote>
      </div>
    </OnbFrame>
  )
}
