"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { adminWorkspaces, adminWorkspacesByOrg } from "@/lib/data/account"
import type { Coach } from "@/lib/data/coaches"
import { resolveTheme } from "@/lib/theme/resolve"
import { cn } from "@/lib/utils"

function Mark({ coach, className }: { coach: Coach; className?: string }) {
  const t = resolveTheme(coach)
  return (
    <span
      className={cn("grid size-8 shrink-0 place-items-center rounded-md text-xs font-semibold", className)}
      style={{ background: t.primary, color: t.primaryForeground }}
    >
      {coach.mark}
    </span>
  )
}

/**
 * Top of the admin sidebar. Owners, team members and operators often run
 * several communities; this is how they move between them. Switching keeps
 * the section they're in (e.g. Students → Students).
 */
export function WorkspaceSwitcher() {
  const { coach } = useCoach()
  const router = useRouter()
  const path = usePathname()
  const [open, setOpen] = useState(false)
  const section = path.split("/").slice(3).join("/")
  const current = adminWorkspaces().find((w) => w.slug === coach.slug)
  const groups = adminWorkspacesByOrg()
  const many = adminWorkspaces().length > 5

  const go = (slug: string) => {
    setOpen(false)
    if (slug !== coach.slug) router.push(`/admin/${slug}${section ? `/${section}` : ""}`)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-popup-open:bg-sidebar-accent"
                aria-label={`Current community: ${coach.name}. Switch community`}
              />
            }
          >
            <Mark coach={coach} />
            <span className="grid min-w-0 flex-1 text-left leading-tight">
              <span className="truncate text-sm font-semibold">{coach.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {coach.org} · {current?.role ?? "Owner"}
              </span>
            </span>
            <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
          </PopoverTrigger>
          <PopoverContent align="start" side="bottom" className="w-(--anchor-width) min-w-72 p-0">
            <Command>
              <CommandInput placeholder="Find a community" autoFocus={many} />
              <CommandList className="max-h-80">
                <CommandEmpty>No community with that name.</CommandEmpty>
                {groups.map((g) => (
                  <CommandGroup key={g.org} heading={g.org}>
                    {g.items.map((w) => {
                      const members = w.coach.tiers.reduce((n, t) => n + t.members, 0)
                      return (
                        <CommandItem key={w.slug} value={`${w.coach.name} ${g.org}`} onSelect={() => go(w.slug)} className="gap-2.5 py-2">
                          <Mark coach={w.coach} className="size-7" />
                          <span className="grid min-w-0 flex-1 leading-tight">
                            <span className="truncate">{w.coach.name}</span>
                            <span className="truncate text-xs text-muted-foreground">
                              {w.role} · {members.toLocaleString("en")} {w.coach.wording.students.toLowerCase()}
                            </span>
                          </span>
                          {w.slug === coach.slug && <Check className="size-4" />}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                ))}
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false)
                      toast("The setup wizard for a new community comes next in the prototype.")
                    }}
                    className="gap-2.5"
                  >
                    <span className="grid size-7 place-items-center rounded-md border border-dashed">
                      <Plus className="size-4" />
                    </span>
                    Create a new community
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
