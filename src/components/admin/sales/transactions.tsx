"use client"

import { useState } from "react"
import { Download, MoreHorizontal, RotateCcw } from "@/components/icons"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { TRANSACTIONS, TXN_COUNTS, type Txn } from "@/lib/data/people"
import { AdminButton, AdminFilter, AdminSearch, AdminTable, AdminTableFooter, AdminTableHead, AdminTabs, AdminTd, AdminTh, AdminTr, AdminToolbar, Tag } from "../ui"

const TXN_TONE = { paid: "success", failed: "danger", retrying: "warning", refunded: "neutral", disputed: "danger" } as const
const LABEL: Record<Txn["status"], string> = { paid: "Paid", failed: "Failed", retrying: "Retrying", refunded: "Refunded", disputed: "Disputed" }
const money = (n: number) => `€${Number.isInteger(n) ? n.toLocaleString("en") : n.toFixed(2)}`
const MONTHS = [{ value: "oct", label: "October" }, { value: "sep", label: "September" }, { value: "aug", label: "August" }]

/** Sales · 09 Transactions (Figma 536:7904): every payment, the ones that need you first. */
export function Transactions() {
  const [filter, setFilter] = useState<"all" | "failed" | "disputed" | "refunded">("all")
  const [month, setMonth] = useState("oct")
  const [q, setQ] = useState("")
  const [rows, setRows] = useState(TRANSACTIONS)
  // The list is the newest few; the counts are the whole month, moved by what you do here.
  const count = (st: "failed" | "disputed" | "refunded") => TXN_COUNTS[st] + rows.filter((t) => t.status === st).length - TRANSACTIONS.filter((t) => t.status === st).length
  const inMonth = month === "oct" ? rows : []
  const shown = inMonth.filter((t) => (filter === "all" || t.status === filter) && (!q.trim() || `${t.who} ${t.what}`.toLowerCase().includes(q.trim().toLowerCase())))
  const dispute = () => toast("Send proof", { description: "We add the login history and course progress for you." })

  return (
    <div className="flex flex-col gap-4">
      <AdminToolbar>
        <AdminTabs
          label="Payment status"
          value={filter}
          onChange={setFilter}
          tabs={[
            { id: "all", label: "All payments", count: TXN_COUNTS.all.toLocaleString("en") },
            { id: "failed", label: "Failed", count: count("failed") },
            { id: "disputed", label: "Disputed", count: count("disputed") },
            { id: "refunded", label: "Refunded", count: count("refunded") },
          ]}
        />
        <div className="flex-1" />
        <AdminSearch value={q} onChange={setQ} placeholder="Search name or e-mail" label="Search payments" hint="⌘K" className="w-full sm:w-[220px]" />
        <AdminFilter ariaLabel="Month" value={month} onValueChange={setMonth} options={MONTHS} />
      </AdminToolbar>
      <AdminTable minWidth={820} footer={<AdminTableFooter>Card and payment fees are taken before payout · Our share · 5%</AdminTableFooter>}>
        <AdminTableHead>
          <AdminTh width={190}>Student</AdminTh>
          <AdminTh>What</AdminTh>
          <AdminTh width={110} align="end">Amount</AdminTh>
          <AdminTh width={140}>Status</AdminTh>
          <AdminTh width={130}>When</AdminTh>
          <AdminTh width={210} />
        </AdminTableHead>
        <tbody>
          {shown.length === 0 && (
            <tr className="border-t border-a-border">
              <td colSpan={6} className="px-5 py-10 text-center t-body-m text-a-text-2">{month === "oct" ? "No payments match." : "Older months aren't in this prototype."}</td>
            </tr>
          )}
          {shown.map((t) => (
            <AdminTr key={t.id}>
              <AdminTd className="text-a-text">{t.who}</AdminTd>
              <AdminTd>{t.what}</AdminTd>
              <AdminTd align="end" className="text-a-text">{money(t.amount)}</AdminTd>
              <AdminTd><Tag tone={TXN_TONE[t.status]} dot>{LABEL[t.status]}</Tag></AdminTd>
              <AdminTd>{t.when}</AdminTd>
              <AdminTd align="end">
                <div className="flex items-center justify-end gap-1">
                  {t.status === "disputed" ? (
                    <AdminButton hierarchy="secondary" size="lg" onClick={dispute}>Answer the dispute</AdminButton>
                  ) : (
                    <AdminButton hierarchy="ghost" size="lg" onClick={() => toast("Invoice downloaded")}>
                      <Download /> Invoice
                    </AdminButton>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<AdminButton aria-label={`Actions for ${t.who}`} hierarchy="ghost" size="md" iconOnly />}>
                      <MoreHorizontal />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {(t.status === "failed" || t.status === "retrying") && (
                        <>
                          <DropdownMenuItem onClick={() => (setRows((r) => r.map((x) => (x.id === t.id ? { ...x, status: "paid" } : x))), toast(`Charged ${t.who} again`, { description: "The payment went through." }))}>
                            <RotateCcw /> Try again now
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast(`Payment link sent to ${t.who}`)}>Send payment link</DropdownMenuItem>
                        </>
                      )}
                      {t.status === "disputed" && <DropdownMenuItem onClick={dispute}>Answer the dispute</DropdownMenuItem>}
                      {t.status === "paid" && (
                        <DropdownMenuItem variant="destructive" onClick={() => (setRows((r) => r.map((x) => (x.id === t.id ? { ...x, status: "refunded" } : x))), toast(`${money(t.amount)} refunded to ${t.who}`))}>
                          Refund
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => toast("Invoice downloaded")}>Download invoice</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </AdminTd>
            </AdminTr>
          ))}
        </tbody>
      </AdminTable>
    </div>
  )
}
