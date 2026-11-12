"use client"

import { useId, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Loader2, X } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { addressTaken, suggestAddress } from "@/components/onboarding/setup-community"
import { AdminButton } from "@/components/admin/ui"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { customCommunities, renameSlug, setAccount, slugify, updateCommunity } from "@/lib/data/communities"
import { publish } from "@/lib/prototype-store"
import { cn } from "@/lib/utils"
import { EmailChips, validChips, type Chip } from "./email-chips"
import { useSetupSteps } from "./use-setup-steps"

const HOST = ".traderhub.io"

/** The Go live and You're live dialogs (Figma 1050:871, 1053:2, 1056:148): a 560 px Admin / Panel over the scrim. */
function Shell({ open, onOpenChange, title, text, close, children }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; text: string; close?: boolean; children: React.ReactNode }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="flex max-h-[calc(100svh-2rem)] flex-col gap-6 overflow-y-auto rounded-a-lg border border-a-border bg-a-panel p-5 text-a-text ring-0 sm:max-w-[560px]">
        <div className={cn("flex flex-col gap-2", close && "pr-8")}>
          <DialogTitle className="t-heading-s! text-a-text">{title}</DialogTitle>
          <DialogDescription className="t-body-m! text-a-text-2">{text}</DialogDescription>
        </div>
        {close && (
          <AdminButton hierarchy="ghost" size="md" iconOnly aria-label="Close" onClick={() => onOpenChange(false)} className="absolute top-4 right-4">
            <X />
          </AdminButton>
        )}
        {children}
      </DialogContent>
    </Dialog>
  )
}

const checkboxClass = "mt-px border-a-border-strong data-checked:border-a-accent data-checked:bg-a-accent data-checked:text-[var(--admin-component-button-primary-content)]"

/**
 * Go live (Figma 1050:871; address taken 1066:879). The address suggested at sign-up, checked as it is typed, and the
 * coach's responsibility for content and legal details (the TraderHub terms were accepted at sign-up). Going live
 * publishes the draft, moves the platform to the address and opens You're live.
 */
export function GoLiveModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter()
  const { community, ready } = useSetupSteps()
  const slug = community?.slug ?? ""
  const [address, setAddress] = useState<string>()
  const [agreed, setAgreed] = useState(false)
  const [busy, setBusy] = useState(false)
  const value = address ?? community?.address ?? slug
  const clean = slugify(value)
  const taken = clean.length > 0 && addressTaken(clean, slug)
  const tooShort = clean.length < 3
  const id = useId()

  const go = () => {
    if (!community || taken || tooShort || !agreed || !ready) return
    setBusy(true)
    setTimeout(() => {
      publish(slug, "Went live")
      updateCommunity(slug, { status: "live", address: clean })
      renameSlug(slug, clean)
      setAccount({ setupSlug: clean })
      setBusy(false)
      onOpenChange(false)
      router.replace(`/admin/${clean}/getting-started?live=1`)
    }, 700)
  }

  const hint = tooShort ? "At least 3 letters or numbers." : taken ? `This address is taken. Try ${suggestAddress(clean, slug)} or ${clean.split("-")[0]}-trading.` : "Available. You can connect your own domain later in Settings."

  return (
    <Shell open={open} onOpenChange={(o) => !busy && onOpenChange(o)} title="Go live" text="Confirm your web address. Your platform opens right after.">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="t-caption text-a-text">
          Web address
        </label>
        <div className={cn("flex h-11 items-stretch overflow-hidden rounded-a-md border bg-a-field transition-colors duration-300 hover:border-a-border-strong focus-within:border-a-border-focus", taken || tooShort ? "border-a-border-danger" : "border-a-border-subtle")}>
          <span className="flex items-center border-r border-a-border-subtle px-3 t-body-l text-a-text-3">https://</span>
          <input id={id} value={value} onChange={(e) => setAddress(e.target.value.toLowerCase())} aria-invalid={taken || tooShort || undefined} aria-describedby={`${id}-hint`} className="min-w-0 flex-1 bg-transparent px-3 t-body-l text-a-text outline-none" />
          <span className="flex items-center pr-3 t-body-l text-a-text-3">{HOST}</span>
        </div>
        <span id={`${id}-hint`} className={cn("t-caption", taken || tooShort ? "text-a-danger" : "text-a-text-3")} aria-live="polite">
          {hint}
        </span>
      </div>
      <label className="flex items-start gap-2.5 t-body-m text-a-text-2">
        <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} className={checkboxClass} />
        I’m responsible for my content and for the legal details I entered.
      </label>
      <div className="flex justify-end gap-2">
        <AdminButton hierarchy="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
          Cancel
        </AdminButton>
        <AdminButton onClick={go} disabled={busy || taken || tooShort || !agreed || !ready}>
          {busy ? (
            <>
              <Loader2 className="animate-spin" /> Going live…
            </>
          ) : (
            "Go live"
          )}
        </AdminButton>
      </div>
    </Shell>
  )
}

/**
 * You're live (Figma 1053:2, invite list 1056:148). The join link to copy and, optionally, e-mails to invite. Opens after
 * Go live (the page is reached with ?live=1, because the address and so the URL change).
 */
export function LiveModal() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const { coach } = useCoach()
  // Open while the page carries ?live=1; closing drops it.
  const open = params.get("live") === "1"
  const [chips, setChips] = useState<Chip[]>([])
  const labelId = useId()
  const hintId = useId()
  const link = `${coach.slug}${HOST}/join`
  const good = validChips(chips)
  const bad = chips.length - good.length

  const close = (o: boolean) => {
    if (!o) router.replace(pathname)
  }
  const copy = () => {
    navigator.clipboard?.writeText(`https://${link}`).then(
      () => toast("Link copied."),
      () => toast("Couldn't copy. Select the link and copy it."),
    )
  }
  const send = () => {
    toast(`${good.length} invite${good.length === 1 ? "" : "s"} sent.`)
    const c = customCommunities().find((x) => x.slug === coach.slug)
    if (c) updateCommunity(coach.slug, { setup: { ...c.setup, invited: (c.setup?.invited ?? 0) + good.length } })
    setChips([])
    close(false)
  }

  return (
    <Shell open={open} onOpenChange={close} close title={`${coach.name} is live`} text="Share your link or invite students by e-mail. You can also do this later from Students.">
      <div className="flex flex-col gap-1.5">
        <span className="t-caption text-a-text">Your join link</span>
        <div className="flex h-11 items-center overflow-hidden rounded-a-md border border-a-border-subtle bg-a-field">
          <span className="flex h-full items-center border-r border-a-border-subtle px-3 t-body-l text-a-text-3">https://</span>
          <span className="min-w-0 flex-1 truncate px-3 t-body-l text-a-text select-all">{link}</span>
          <AdminButton hierarchy="secondary" size="md" className="mr-2" onClick={copy}>
            Copy
          </AdminButton>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <span id={labelId} className="flex items-baseline gap-1.5 t-caption text-a-text">
          Invite by e-mail <span className="text-a-text-3">Optional</span>
        </span>
        <EmailChips chips={chips} onChange={setChips} labelId={labelId} hintId={hintId} />
        <span id={hintId} className={cn("t-caption", bad ? "text-a-danger" : "text-a-text-3")} aria-live="polite">
          {bad ? `${bad} e-mail${bad === 1 ? " looks" : "s look"} wrong. Click ${bad === 1 ? "it" : "them"} to fix, or remove ${bad === 1 ? "it" : "them"}.` : "Paste a list or press Enter after each one. They get an e-mail with your join link."}
        </span>
      </div>
      <div className="flex justify-end gap-2">
        <AdminButton hierarchy="ghost" onClick={() => close(false)}>
          Done
        </AdminButton>
        <AdminButton onClick={send} disabled={good.length === 0}>
          {good.length ? `Send ${good.length} invite${good.length === 1 ? "" : "s"}` : "Send invites"}
        </AdminButton>
      </div>
    </Shell>
  )
}
