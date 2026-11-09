"use client"

import { useState } from "react"
import { Copy, Plus } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { COUPONS } from "@/lib/data/people"
import { Field, NativeSelect, useCommunityData } from "../kit"

// ---------- ADM-32 Coupons

export function Coupons() {
  const { coach } = useCoach()
  const [list, setList] = useCommunityData(coach.slug, "coupons", COUPONS)
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState("")
  const [kind, setKind] = useState("percent")
  const [amount, setAmount] = useState("20")
  const [months, setMonths] = useState("1")
  const [limit, setLimit] = useState("")

  return (
    <div className="grid gap-3">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus /> New coupon
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Used</TableHead>
              <TableHead className="hidden sm:table-cell">Ends</TableHead>
              <TableHead>Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((c) => (
              <TableRow key={c.code}>
                <TableCell>
                  <button onClick={() => toast(`${c.code} copied`)} className="flex items-center gap-1.5 font-mono">
                    {c.code} <Copy className="size-3 text-muted-foreground" />
                  </button>
                </TableCell>
                <TableCell>{c.discount}</TableCell>
                <TableCell className="tabular-nums">{c.uses}</TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">{c.expires}</TableCell>
                <TableCell>
                  <Switch checked={c.active} onCheckedChange={(v) => setList((l) => l.map((x) => (x.code === c.code ? { ...x, active: v } : x)))} aria-label={`${c.code} active`} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New coupon</DialogTitle>
            <DialogDescription>Students enter it at checkout. A wrong code never blocks the purchase.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label="Code">
              <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ""))} placeholder="AUTUMN20" className="font-mono" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Discount">
                <NativeSelect value={kind} onChange={(e) => setKind(e.target.value)}>
                  <option value="percent">% off</option>
                  <option value="amount">€ off</option>
                  <option value="trial">Free days</option>
                </NativeSelect>
              </Field>
              <Field label={kind === "trial" ? "Days" : "Amount"}>
                <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" />
              </Field>
            </div>
            {kind !== "trial" && (
              <Field label="For how long">
                <NativeSelect value={months} onChange={(e) => setMonths(e.target.value)}>
                  <option value="1">First payment</option>
                  <option value="3">3 months</option>
                  <option value="12">12 months</option>
                  <option value="forever">Forever</option>
                </NativeSelect>
              </Field>
            )}
            <Field label="Limit" hint="Optional">
              <Input value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="No limit" inputMode="numeric" />
            </Field>
          </div>
          <DialogFooter>
            <Button
              disabled={!code}
              onClick={() => {
                const discount = kind === "trial" ? `${amount}-day free trial` : `${kind === "percent" ? `${amount}%` : `€${amount}`} off ${months === "1" ? "first payment" : months === "forever" ? "forever" : `for ${months} months`}`
                setList((l) => [{ code, discount, uses: limit ? `0 of ${limit}` : "0", expires: "never", active: true }, ...l])
                setOpen(false)
                setCode("")
                toast(`${code} created`)
              }}
            >
              Create coupon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
