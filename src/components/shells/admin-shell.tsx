"use client"

import { useLayoutEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CalendarCheck,
  ExternalLink,
  LifeBuoy,
  Mail,
  MessageCircle,
  Phone,
  PlayCircle,
  Search,
  Bell,
  Wand2,
  UserPlus,
  X,
} from "@/components/icons"
import { TS_ADMIN_CSS, TS_SYSTEM_CSS } from "@/lib/theme/ts-system"
import { useCoach } from "@/components/coach/coach-provider"
import { WorkspaceSwitcher } from "@/components/admin/workspace-switcher"
import { TsLogo } from "@/components/onboarding/frame"
import { DEMO_ADMIN } from "@/lib/data/account"
import { adminNav } from "@/components/coach/nav"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

/**
 * The admin area. Identical in every community: same layout, same colours,
 * same words, so people who run several communities always know where things
 * are. Only the switcher at the top says which community is open.
 */
export function AdminShell({ studentBase, children }: { studentBase: string; children: React.ReactNode }) {
  const { coach, base } = useCoach()
  const path = usePathname()
  const groups = adminNav(coach, base)
  const isOpen = (href: string) => (href === base ? path === base : path.startsWith(href))
  const current = groups.flatMap((g) => g.items).find((i) => isOpen(i.href))

  useLayoutEffect(() => {
    const html = document.documentElement
    const had = html.classList.contains("dark")
    html.classList.add("dark")
    return () => {
      if (!had) html.classList.remove("dark")
    }
  }, [])

  return (
    <SidebarProvider className="ts-ui ts-admin" style={{ "--sidebar-width": "16rem" } as React.CSSProperties}>
      {/* Our own look, with the admin's calmer, roomier layer on top: see src/lib/theme/ts-system.ts. */}
      <style dangerouslySetInnerHTML={{ __html: TS_SYSTEM_CSS + TS_ADMIN_CSS }} />
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="gap-3 px-2 pt-0 pb-2 group-data-[collapsible=icon]:px-0">
          <div className="flex h-14 items-center px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <TsLogo className="gap-2.5 [&>span]:text-[1.0625rem] [&>span]:group-data-[collapsible=icon]:hidden [&>svg]:size-5" />
          </div>
          <WorkspaceSwitcher />
        </SidebarHeader>
        <SidebarContent>
          {groups.map((g, i) => (
            <SidebarGroup key={g.group}>
              {/* The first page (Overview) sits on its own at the top, like a home link. */}
              {i > 0 && <SidebarGroupLabel>{g.group}</SidebarGroupLabel>}
              <SidebarMenu>
                {g.items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={isOpen(item.href)}
                      tooltip={item.label}
                      render={<Link href={item.href} />}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter className="gap-2 px-2 pb-2 group-data-[collapsible=icon]:px-0">
          <InviteCard href={`${base}/settings`} />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="View as student" render={<Link href={studentBase} />}>
                <ExternalLink />
                <span>View as student</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="ts-admin-bar sticky top-0 z-20 flex h-14 items-center gap-3 rounded-t-xl px-4 backdrop-blur-md md:px-6">
          <SidebarTrigger className="text-muted-foreground" />
          <span className="truncate text-[0.9375rem] font-medium">{current?.label}</span>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" className="hidden w-56 justify-start text-muted-foreground sm:inline-flex" aria-label="Search">
              <Search /> <span className="font-normal">Search</span>
              <kbd className="ml-auto rounded-[5px] bg-white/[0.06] px-1.5 text-[0.65rem]">⌘K</kbd>
            </Button>
            <HelpButton />
            <Button variant="outline" size="icon" aria-label="Notifications" className="relative">
              <Bell />
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-[var(--ts-interactive)]" />
            </Button>
            <Avatar className="ml-1 size-8">
              <AvatarFallback className="text-xs">{DEMO_ADMIN.initials}</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 px-4 pt-6 pb-10 md:px-10 md:pt-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}

/** A quiet card above the footer links, as in ElevenLabs. Dismissed for this visit only. */
function InviteCard({ href }: { href: string }) {
  const [open, setOpen] = useState(true)
  if (!open) return null
  return (
    <div className="relative rounded-xl bg-white/[0.04] p-3 group-data-[collapsible=icon]:hidden">
      <button onClick={() => setOpen(false)} aria-label="Dismiss" className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
        <X className="size-3.5" />
      </button>
      <span className="grid size-7 place-items-center rounded-full bg-white/[0.07]">
        <UserPlus className="size-3.5" />
      </span>
      <Link href={href} className="mt-2.5 block text-sm font-medium hover:underline">Invite your team</Link>
      <p className="mt-0.5 text-xs text-muted-foreground">Add coaches and moderators to help run your community.</p>
    </div>
  )
}

/** One help button on every admin screen: video guides and every way to reach us. */
function HelpButton() {
  const ways = [
    { icon: MessageCircle, label: "Chat with us", note: "Usually replies in a few minutes" },
    { icon: Phone, label: "WhatsApp", note: "+41 44 000 00 00" },
    { icon: Mail, label: "E-mail", note: "help@tradestats.io" },
    { icon: CalendarCheck, label: "Book a call", note: "Pick a time that suits you" },
  ]
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>
        <LifeBuoy /> Help
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Help</SheetTitle>
          <SheetDescription>Watch a short guide, or reach us however you like.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-4 pb-6">
          <button className="group relative grid aspect-video place-items-center overflow-hidden rounded-lg bg-muted text-left">
            <PlayCircle className="size-12 text-foreground/70 transition group-hover:scale-105" />
            <span className="absolute bottom-3 left-3 text-sm font-medium">Getting started · 2 min</span>
          </button>
          <div className="grid gap-2">
            {ways.map((w) => (
              <button key={w.label} className="flex items-center gap-3 rounded-lg border p-3 text-left hover:bg-muted">
                <w.icon className="size-5 text-muted-foreground" />
                <span className="flex flex-col">
                  <span className="text-sm font-medium">{w.label}</span>
                  <span className="text-xs text-muted-foreground">{w.note}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="rounded-lg bg-primary/8 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Wand2 className="size-4 text-primary" /> Let us set it up for you
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              We build your whole platform on a call: design, tiers, first course. Included on Scale and Enterprise.
            </p>
            <Button className="mt-3" size="sm">Order a setup</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
