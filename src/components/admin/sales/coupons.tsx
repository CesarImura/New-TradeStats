"use client"

import { useEffect, useRef, useState } from "react"
import { MoreHorizontal, Plus } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { isFreeTier, useTiers } from "@/lib/data/access"
import { COUPONS, couponEnded, couponLabel, type Coupon } from "@/lib/data/people"
import { cn } from "@/lib/utils"
import { useCommunityData } from "../kit"
import { AdminButton, AdminField, AdminModal, AdminSegmented, AdminTable, AdminTableHead, AdminTd, AdminTh, AdminTr, EmptyState, Tag, adminControl } from "../ui"

const TODAY = "2026-10-12"
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const day = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number)
  return { y, m, d }
}
const short = (iso: string) => `${day(iso).d} ${MONTHS[day(iso).m - 1]}`
const long = (iso: string) => `${short(iso)} ${day(iso).y}`

const discountText = couponLabel
const isEnded = couponEnded
const endsText = (c: Coupon) => (c.ends ? (c.ends < TODAY ? `Ended ${long(c.ends)}` : `Ends ${short(c.ends)}`) : isEnded(c) ? "Limit reached" : "No end")

export function NewCouponButton({ onClick }: { onClick: () => void }) {
  return (
    <AdminButton onClick={onClick}>
      <Plus /> New coupon
    </AdminButton>
  )
}

/** Sales · 07 Coupons (Figma 536:7402) and 08 New coupon (536:7623). */
export function Coupons({ newSignal }: { newSignal: number }) {
  const { coach } = useCoach()
  const tiers = useTiers(coach)
  const [saved, setList] = useCommunityData<Coupon[]>(coach.slug, "coupons", COUPONS)
  // Saved before the redesign the list has no kind: start from the samples then.
  const list = Array.isArray(saved) && saved.every((c) => "kind" in c) ? saved : COUPONS
  const [open, setOpen] = useState(false)
  const seen = useRef(newSignal)
  useEffect(() => {
    if (newSignal === seen.current) return
    seen.current = newSignal
    setOpen(true)
  }, [newSignal])

  const tierText = (c: Coupon) => (c.tiers.length === 0 ? "All tiers" : c.tiers.map((id) => tiers.find((t) => t.id === id)?.name ?? id).join(", "))
  const copy = (code: string) => {
    void navigator.clipboard?.writeText(code).catch(() => {})
    toast(`${code} copied`)
  }

  return (
    <div className="flex flex-col gap-4">
      {list.length === 0 ? (
        <EmptyState title="No coupons yet" description="Students enter a code at checkout. A wrong code never blocks the purchase." actions={<NewCouponButton onClick={() => setOpen(true)} />} />
      ) : (
        <AdminTable minWidth={820}>
          <AdminTableHead>
            <AdminTh width={170}>Code</AdminTh>
            <AdminTh width={250}>Discount</AdminTh>
            <AdminTh width={190}>Tier</AdminTh>
            <AdminTh width={100} align="end">Used</AdminTh>
            <AdminTh width={170}>Ends</AdminTh>
            <AdminTh width={120}>Status</AdminTh>
            <AdminTh width={64} />
          </AdminTableHead>
          <tbody>
            {list.map((c) => {
              const ended = isEnded(c)
              return (
                <AdminTr key={c.code}>
                  <AdminTd className="font-mono text-a-text">{c.code}</AdminTd>
                  <AdminTd className="text-a-text">{discountText(c)}</AdminTd>
                  <AdminTd className="truncate">{tierText(c)}</AdminTd>
                  <AdminTd align="end">{c.used}{c.limit !== undefined ? ` / ${c.limit}` : ""}</AdminTd>
                  <AdminTd>{endsText(c)}</AdminTd>
                  <AdminTd>{ended ? <Tag>Ended</Tag> : c.paused ? <Tag tone="warning" dot>Paused</Tag> : <Tag tone="success" dot>Active</Tag>}</AdminTd>
                  <AdminTd align="end">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<AdminButton aria-label={`Actions for ${c.code}`} hierarchy="ghost" size="md" iconOnly />}>
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => copy(c.code)}>Copy code</DropdownMenuItem>
                        {!ended && (
                          <DropdownMenuItem onClick={() => (setList((l) => l.map((x) => (x.code === c.code ? { ...x, paused: !x.paused, active: !!x.paused } : x))), toast(c.paused ? `${c.code} is active again` : `${c.code} paused`))}>
                            {c.paused ? "Resume" : "Pause"}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => {
                            setList((l) => l.filter((x) => x.code !== c.code))
                            toast(`${c.code} deleted`, { action: { label: "Undo", onClick: () => setList((l) => (l.some((x) => x.code === c.code) ? l : [c, ...l])) } })
                          }}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </AdminTd>
                </AdminTr>
              )
            })}
          </tbody>
        </AdminTable>
      )}
      <CouponModal open={open} onClose={() => setOpen(false)} taken={list.map((c) => c.code)} onCreate={(c) => setList((l) => [c, ...l])} />
    </div>
  )
}

function CouponModal({ open, onClose, taken, onCreate }: { open: boolean; onClose: () => void; taken: string[]; onCreate: (c: Coupon) => void }) {
  const { coach } = useCoach()
  const tiers = useTiers(coach).filter((t) => !isFreeTier(t))
  const blank = { code: "", kind: "percent" as Coupon["kind"], amount: "20", duration: "first" as Coupon["duration"], pick: false, picked: [] as string[], limit: "", ends: "" }
  const [f, setF] = useState(blank)
  const [tried, setTried] = useState(false)
  const set = (p: Partial<typeof blank>) => setF((v) => ({ ...v, ...p }))
  const close = () => {
    onClose()
    setTimeout(() => (setF(blank), setTried(false)), 200)
  }

  const amount = Number(f.amount)
  const limit = f.limit.trim() === "" ? undefined : Math.floor(Number(f.limit))
  const errors = {
    code: !f.code ? "Give it a code" : taken.includes(f.code) ? "That code already exists" : "",
    amount: !(amount > 0) ? "Enter a discount" : f.kind === "percent" && amount > 100 ? "100% is the most" : "",
    limit: limit !== undefined && !(limit > 0) ? "Use a number above 0" : "",
    tiers: f.pick && f.picked.length === 0 ? "Pick at least one tier" : "",
    ends: f.ends && f.ends < TODAY ? "Pick a date that isn't past" : "",
  }
  const bad = Object.values(errors).some(Boolean)
  const create = () => {
    setTried(true)
    if (bad) return
    onCreate({ discount: couponLabel({ kind: f.kind, amount, duration: f.duration } as Coupon), active: true, code: f.code, kind: f.kind, amount, duration: f.duration, tiers: f.pick ? f.picked : [], used: 0, ...(limit !== undefined ? { limit } : {}), ...(f.ends ? { ends: f.ends } : {}) })
    toast(`${f.code} created`)
    close()
  }

  return (
    <AdminModal
      open={open}
      onOpenChange={(o) => !o && close()}
      title="New coupon"
      subtitle="Students enter it at checkout. A wrong code never blocks the purchase."
      className="sm:max-w-[560px]"
      bodyClassName="gap-5"
      footer={
        <>
          <AdminButton hierarchy="ghost" onClick={close}>Cancel</AdminButton>
          <AdminButton onClick={create}>Create coupon</AdminButton>
        </>
      }>
      <div className="contents" onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); create() } }}>
        <div className="grid grid-cols-2 items-start gap-3 max-sm:grid-cols-1">
          <AdminField label="Code" error={tried ? errors.code : undefined}>
            <input value={f.code} maxLength={24} onChange={(e) => set({ code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") })} placeholder="AUTUMN20" aria-invalid={tried && !!errors.code} className={cn(adminControl, "h-11 font-mono")} />
          </AdminField>
          <AdminField label="Discount" error={tried ? errors.amount : undefined}>
            <span className="flex h-11 items-center rounded-a-md border border-a-border-subtle bg-a-field pr-2 transition-colors duration-300 focus-within:border-a-border-focus hover:border-a-border-strong">
              <input value={f.amount} onChange={(e) => set({ amount: e.target.value.replace(/[^\d.]/g, "") })} inputMode="decimal" aria-label="Discount" className="min-w-0 flex-1 bg-transparent px-3 t-body-l text-a-text tabular-nums outline-none" />
              <button type="button" aria-label={`Discount in ${f.kind === "percent" ? "percent" : "euros"}. Switch`} onClick={() => set({ kind: f.kind === "percent" ? "amount" : "percent" })} className="grid h-7 min-w-7 place-items-center rounded-a-sm px-1.5 t-caption text-a-text-3 outline-none hover:bg-a-hover hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus">
                {f.kind === "percent" ? "%" : "€"}
              </button>
            </span>
          </AdminField>
        </div>
        <span className="h-px bg-a-border" aria-hidden />
        <div className="grid gap-1.5">
          <span className="t-caption text-a-text">For how long</span>
          <AdminSegmented label="For how long" value={f.duration} onChange={(v) => set({ duration: v })} options={[{ value: "first", label: "First payment" }, { value: "3", label: "3 months" }, { value: "forever", label: "Forever" }]} />
        </div>
        <div className="grid gap-1.5">
          <span className="t-caption text-a-text">Tier</span>
          <AdminSegmented label="Tier" value={f.pick ? "pick" : "all"} onChange={(v) => set({ pick: v === "pick" })} options={[{ value: "all", label: "All tiers" }, { value: "pick", label: "Pick tiers" }]} />
          {f.pick && (
            <div className="mt-1 flex flex-wrap gap-x-5 gap-y-2">
              {tiers.map((t) => (
                <label key={t.id} className="flex items-center gap-2.5 t-body-m text-a-text">
                  <Checkbox checked={f.picked.includes(t.id)} onCheckedChange={(v) => set({ picked: v ? [...f.picked, t.id] : f.picked.filter((x) => x !== t.id) })} />
                  {t.name}
                </label>
              ))}
              {tried && errors.tiers && <span className="w-full t-caption text-a-danger">{errors.tiers}</span>}
            </div>
          )}
        </div>
        <span className="h-px bg-a-border" aria-hidden />
        <div className="grid grid-cols-2 items-start gap-3 max-sm:grid-cols-1">
          <AdminField label="Limit" hint="Leave empty for no limit" error={tried ? errors.limit : undefined}>
            {(p) => <input {...p} value={f.limit} onChange={(e) => set({ limit: e.target.value.replace(/\D/g, "") })} inputMode="numeric" placeholder="No limit" className={cn(adminControl, "h-11 tabular-nums")} />}
          </AdminField>
          <AdminField label="Ends" optional error={tried ? errors.ends : undefined}>
            {(p) => <input {...p} type="date" min={TODAY} value={f.ends} onChange={(e) => set({ ends: e.target.value })} className={cn(adminControl, "h-11")} />}
          </AdminField>
        </div>
      </div>
    </AdminModal>
  )
}
