"use client"

import { Check, MoreHorizontal } from "@/components/icons"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useCommunityData } from "../kit"
import { AdminButton, AdminTable, AdminTableFooter, AdminTableHead, AdminTd, AdminTh, AdminTr, EmptyState, Panel } from "../ui"
import { Report, REPORTS, NO_REPORTS, MOD_RULES, SwitchCard } from "./community-parts"

/* ---------- 06 Moderation ---------- */

export function ModerationTab({ slug }: { slug: string }) {
  const [list, setList] = useCommunityData<Report[]>(slug, "reports", REPORTS, NO_REPORTS)
  const [rules, setRules] = useCommunityData<Record<string, boolean>>(slug, "mod-rules", Object.fromEntries(MOD_RULES.map(([id, , , on]) => [id, on])))
  return (
    <>
      {list.length === 0 ? (
        <EmptyState icon={Check} title="Nothing reported" description="Posts your students report show up here for you to review." />
      ) : (
        <AdminTable minWidth={820} footer={<AdminTableFooter>Removed posts stay hidden from students for 30 days</AdminTableFooter>}>
          <AdminTableHead>
            <AdminTh>Reported post</AdminTh>
            <AdminTh width={200}>Reason</AdminTh>
            <AdminTh width={230}>Reports</AdminTh>
            <AdminTh width={64} />
          </AdminTableHead>
          <tbody>
            {list.map((r) => (
              <AdminTr key={r.id}>
                <AdminTd>
                  <div className="grid min-w-0 gap-0.5">
                    <span className="truncate t-body-m text-a-text">{r.title}</span>
                    <span className="truncate t-caption text-a-text-2">{r.where}</span>
                  </div>
                </AdminTd>
                <AdminTd className="text-a-text-2">{r.reason}</AdminTd>
                <AdminTd className="whitespace-nowrap text-a-text-3">{r.reports} {r.reports === 1 ? "report" : "reports"} · {r.when}</AdminTd>
                <AdminTd align="end">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<AdminButton hierarchy="ghost" size="md" iconOnly aria-label={`Actions for ${r.title}`} />}><MoreHorizontal /></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => (setList((l) => l.filter((x) => x.id !== r.id)), toast("Reports dismissed"))}>Keep post</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => (setList((l) => l.filter((x) => x.id !== r.id)), toast("Post removed"))}>Remove post</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </AdminTd>
              </AdminTr>
            ))}
          </tbody>
        </AdminTable>
      )}
      <Panel className="gap-4">
        <h2 className="t-heading-s text-a-text">Moderation rules</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {MOD_RULES.map(([id, label, text]) => (
            <SwitchCard key={id} label={label} text={text} checked={!!rules[id]} onChange={(v) => setRules((x) => ({ ...x, [id]: v }))} />
          ))}
        </div>
      </Panel>
    </>
  )
}

