"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Check, ChevronsUpDown } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { CoachLogo } from "@/components/coach/coach-logo"
import { CommunityMark } from "@/components/coach/community-mark"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { DEMO_STUDENT_COMMUNITIES } from "@/lib/data/account"
import { getCoach } from "@/lib/data/coaches"
import { cn } from "@/lib/utils"

/**
 * The coach's logo, which doubles as the community switcher for traders in
 * more than one community. With one community it is just the logo.
 * Switching keeps the section (Calendar → Calendar) when the other
 * community has it switched on.
 */
export function CommunitySwitcher({ placement }: { placement: "sidebar" | "bar" }) {
  const { coach, base } = useCoach()
  const router = useRouter()
  const path = usePathname()
  const [open, setOpen] = useState(false)
  const communities = DEMO_STUDENT_COMMUNITIES.map((s) => getCoach(s)!).filter(Boolean)
  const logo = <CoachLogo coach={coach} className="group-data-[collapsible=icon]:[&>span:last-child]:hidden" />

  if (communities.length < 2) {
    return placement === "sidebar" ? (
      <Link href={base} className="px-1">{logo}</Link>
    ) : (
      <Link href={base}>{logo}</Link>
    )
  }

  const section = path.split("/")[3]
  const go = (slug: string) => {
    setOpen(false)
    if (slug === coach.slug) return
    const target = getCoach(slug)!
    const keep = section && target.modules[section as keyof typeof target.modules]
    router.push(`/c/${slug}${keep ? `/${section}` : ""}`)
  }

  const chevron = <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {placement === "sidebar" ? (
        <SidebarMenu>
          <SidebarMenuItem>
            <PopoverTrigger
              render={<SidebarMenuButton size="lg" className="data-popup-open:bg-sidebar-accent" aria-label={`${coach.name}. Switch community`} />}
            >
              {logo}
              <span className="ml-auto">{chevron}</span>
            </PopoverTrigger>
          </SidebarMenuItem>
        </SidebarMenu>
      ) : (
        <PopoverTrigger
          render={
            <button
              className="-mx-1.5 flex min-w-0 items-center gap-2 rounded-[min(var(--radius),10px)] px-1.5 py-1 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring data-popup-open:bg-muted"
              aria-label={`${coach.name}. Switch community`}
            />
          }
        >
          {logo}
          {chevron}
        </PopoverTrigger>
      )}
      <PopoverContent align="start" className="w-72 p-0">
        <Command>
          {communities.length > 5 && <CommandInput placeholder="Find a community" />}
          <CommandList>
            <CommandGroup heading="Your communities">
              {communities.map((c) => {
                return (
                  <CommandItem key={c.slug} value={c.name} onSelect={() => go(c.slug)} className="gap-2.5 py-2">
                    <CommunityMark coach={c} className="size-7" />
                    <span className="grid min-w-0 flex-1 leading-tight">
                      <span className="truncate">{c.name}</span>
                      <span className="truncate text-xs text-muted-foreground">with {c.coachName}</span>
                    </span>
                    <Check className={cn("size-4", c.slug !== coach.slug && "invisible")} />
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
