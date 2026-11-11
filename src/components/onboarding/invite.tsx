"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowRight } from "@/components/icons"
import { toast } from "sonner"
import { AdminButton, Callout, adminControl } from "@/components/admin/ui"
import { updateCommunity } from "@/lib/data/communities"
import { useAccount, useCustomCommunities } from "@/lib/data/use-communities"
import { cn } from "@/lib/utils"
import { OnbFrame, OnbTitle, ProtoNote } from "./frame"

/** Onboarding · 09 You're live (Figma 522:7582): a join link, e-mail invites, and the way into the admin. */
export function InviteStep() {
  const acc = useAccount()
  const communities = useCustomCommunities()
  // "?c=<slug>" (from the admin's getting-started list) picks the community; otherwise the one just set up.
  const slug = useSearchParams().get("c") ?? acc?.setupSlug
  const c = communities.find((x) => x.slug === slug)
  const [emails, setEmails] = useState("")
  if (!c) return <OnbFrame>{null}</OnbFrame>

  const link = `${c.slug}.traderhub.io/join`
  const list = [...new Set(emails.split(/[\s,;]+/).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)))]
  const invited = c.setup?.invited ?? 0

  return (
    <OnbFrame
      size="lg"
      right={
        <AdminButton nativeButton={false} render={<Link href={`/admin/${c.slug}`} />} hierarchy="secondary" size="lg">
          <span className="max-sm:hidden">Go to my </span>admin <ArrowRight />
        </AdminButton>
      }>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
        <OnbTitle tone="success" eyebrow="You're live" title={`${c.name} is online.`} text="Bring your first students in. You can do this any time from Students." />

        <div className="grid gap-1.5">
          <span className="t-caption text-a-text">Share your join link</span>
          <div className="flex h-11 items-center gap-2 rounded-a-md border border-a-border-subtle bg-a-field pr-1.5 pl-3">
            <span className="min-w-0 flex-1 truncate t-body-l text-a-text">{link}</span>
            <AdminButton
              hierarchy="secondary"
              size="md"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(`https://${link}`)
                } catch {}
                toast("Link copied")
              }}>
              Copy link
            </AdminButton>
          </div>
        </div>

        <span className="h-px bg-a-border" aria-hidden />

        <div className="grid gap-1.5">
          <span className="flex items-baseline justify-between">
            <label htmlFor="invite-emails" className="t-caption text-a-text">Or invite by e-mail</label>
            {invited > 0 && <span className="t-caption text-a-success">{invited} invited so far</span>}
          </span>
          <textarea id="invite-emails" value={emails} onChange={(e) => setEmails(e.target.value)} placeholder="Paste a list from anywhere" className={cn(adminControl, "block h-24 resize-none py-2.5")} />
          <div className="flex items-center justify-between gap-3">
            <span className="t-caption text-a-text-3">{list.length ? `${list.length} address${list.length === 1 ? "" : "es"} · they join ${c.tiers[0]?.name ?? "your first tier"}` : "One per line or separated by commas"}</span>
            <AdminButton
              hierarchy="secondary"
              disabled={!list.length}
              onClick={() => {
                updateCommunity(c.slug, { setup: { ...c.setup, invited: invited + list.length } })
                toast.success(`${list.length} invite${list.length === 1 ? "" : "s"} sent`, { description: "Prototype: no e-mails actually go out." })
                setEmails("")
              }}>
              Send invites
            </AdminButton>
          </div>
        </div>

        <Callout action={<AdminButton hierarchy="secondary" size="md" nativeButton={false} render={<Link href={`/admin/${c.slug}/students`} />}>Review</AdminButton>}>
          Moving a community over? We import from Discord and Kajabi.
        </Callout>
      </div>
      <div className="mt-5 border-t border-a-border pt-4">
        <ProtoNote>The community is saved in this browser only. It shows up in the admin community switcher and on the start page.</ProtoNote>
      </div>
    </OnbFrame>
  )
}
