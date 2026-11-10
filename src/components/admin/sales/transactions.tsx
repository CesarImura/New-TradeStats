"use client"

import { useState } from "react"
import { Download, MoreHorizontal, RotateCcw } from "@/components/icons"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TRANSACTIONS, type Txn } from "@/lib/data/people"
import { AdminButton, AdminSearch, AdminTabs, AdminToolbar, Tag } from "../ui"

const TXN_TONE = { paid: "success", failed: "danger", retrying: "warning", refunded: "neutral", disputed: "danger" } as const
const LABEL: Record<Txn["status"], string> = { paid: "Paid", failed: "Failed", retrying: "Retrying", refunded: "Refunded", disputed: "Disputed" }

// ---------- ADM-36 Transactions & problems

export function Transactions() {
  const [filter, setFilter] = useState<"all" | "failed" | "disputed" | "refunded">("all")
  const [q, setQ] = useState("")
  const [rows, setRows] = useState(TRANSACTIONS)
  const count = (st: string) => rows.filter((t) => t.status === st).length
  const shown = rows.filter((t) => (filter === "all" || t.status === filter) && (!q.trim() || `${t.who} ${t.what}`.toLowerCase().includes(q.trim().toLowerCase())))
  return (
    <div className="grid gap-3">
      <AdminToolbar>
        <AdminTabs
          label="Payment status"
          value={filter}
          onChange={setFilter}
          tabs={[
            { id: "all", label: "All payments", count: rows.length },
            { id: "failed", label: "Failed", count: count("failed") },
            { id: "disputed", label: "Disputed", count: count("disputed") },
            { id: "refunded", label: "Refunded", count: count("refunded") },
          ]}
        />
        <div className="flex-1" />
        <AdminSearch value={q} onChange={setQ} placeholder="Search name or e-mail" label="Search payments" hint="⌘K" className="w-72" />
      </AdminToolbar>
      <div className="overflow-x-auto rounded-a-lg border border-a-border bg-a-panel">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Student</TableHead>
              <TableHead className="hidden md:table-cell">What</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">When</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-10 text-center text-a-text-2">No payments match.</TableCell>
              </TableRow>
            )}
            {shown.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.who}</TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">{t.what}</TableCell>
                <TableCell className="text-right tabular-nums">€{t.amount.toLocaleString("en")}</TableCell>
                <TableCell><Tag tone={TXN_TONE[t.status]} dot>{LABEL[t.status]}</Tag></TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">{t.when}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                  {t.status === "disputed" ? (
                    <AdminButton hierarchy="secondary" size="lg" onClick={() => toast("Send proof", { description: "We add the login history and course progress for you." })}>
                      Answer the dispute
                    </AdminButton>
                  ) : (
                    <AdminButton hierarchy="ghost" size="lg" onClick={() => toast("Invoice downloaded")}>
                      <Download /> Invoice
                    </AdminButton>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<AdminButton aria-label="Actions" hierarchy="ghost" size="md" iconOnly />}>
                      <MoreHorizontal />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {(t.status === "failed" || t.status === "retrying") && (
                        <>
                          <DropdownMenuItem
                            onClick={() => {
                              setRows((r) => r.map((x) => (x.id === t.id ? { ...x, status: "paid" } : x)))
                              toast(`Charged ${t.who} again`, { description: "The payment went through." })
                            }}
                          >
                            <RotateCcw /> Try again now
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast(`Payment link sent to ${t.who}`)}>Send payment link</DropdownMenuItem>
                        </>
                      )}
                      {t.status === "disputed" && <DropdownMenuItem onClick={() => toast("Send proof", { description: "We add the login history and course progress for you." })}>Answer the dispute</DropdownMenuItem>}
                      {t.status === "paid" && (
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => {
                            setRows((r) => r.map((x) => (x.id === t.id ? { ...x, status: "refunded" } : x)))
                            toast(`€${t.amount} refunded to ${t.who}`)
                          }}
                        >
                          Refund
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => toast("Invoice downloaded")}>Download invoice</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">When a payment fails, the student sees “Update payment” and gets e-mails. They keep access during the retries, then it pauses.</p>
    </div>
  )
}
