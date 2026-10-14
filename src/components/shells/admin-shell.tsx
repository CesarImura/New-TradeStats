"use client"

import { useLayoutEffect } from "react"
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
} from "lucide-react"
import { useCoach } from "@/components/coach/coach-provider"
import { WorkspaceSwitcher } from "@/components/admin/workspace-switcher"
import { DEMO_ADMIN } from "@/lib/data/account"
import { adminNav } from "@/components/coach/nav"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
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
 * The admin area's own look: dark, near-square corners, TradeStats yellow for
 * the main action and orange for focus. Fixed for every community. The tokens
 * sit on :root while the admin is open, so menus and dialogs (rendered outside
 * this tree) match.
 */
const ADMIN_TOKENS = `
:root:has(.ts-admin) {
  --background: #0a0a0a; --foreground: #f2f2ef;
  --card: #111111; --card-foreground: #f2f2ef;
  --popover: #141414; --popover-foreground: #f2f2ef;
  --primary: #f8ff9e; --primary-foreground: #0a0a0a;
  --secondary: #1b1b1b; --secondary-foreground: #f2f2ef;
  --muted: #191919; --muted-foreground: rgb(242 242 239 / 0.56);
  --accent: #1d1d1d; --accent-foreground: #f2f2ef;
  --destructive: #ff5a4f;
  --border: rgb(255 255 255 / 0.09); --input: rgb(255 255 255 / 0.14);
  --ring: #ff5500; --radius: 5px;
  --chart-1: #ff5500; --chart-2: #f8ff9e; --chart-3: #3ddc97; --chart-4: #ff5a4f; --chart-5: rgb(242 242 239 / 0.4);
  --highlight: #f8ff9e; --highlight-foreground: #0a0a0a;
  --profit: #3ddc97; --loss: #ff5a4f;
  --sidebar: #070707; --sidebar-foreground: #f2f2ef;
  --sidebar-primary: #f8ff9e; --sidebar-primary-foreground: #0a0a0a;
  --sidebar-accent: rgb(255 255 255 / 0.06); --sidebar-accent-foreground: #f2f2ef;
  --sidebar-border: rgb(255 255 255 / 0.08); --sidebar-ring: #ff5500;
  --ts-orange: #ff5500; --ts-yellow: #f8ff9e;
  color-scheme: dark;
}
:root:has(.ts-admin) body { background: #0a0a0a; }
`

/**
 * The admin area. Identical in every community: same layout, same colours,
 * same words, so people who run several communities always know where things
 * are. Only the switcher at the top says which community is open.
 */
export function AdminShell({ studentBase, children }: { studentBase: string; children: React.ReactNode }) {
  const { coach, base } = useCoach()
  const path = usePathname()
  const groups = adminNav(coach, base)

  useLayoutEffect(() => {
    const html = document.documentElement
    const had = html.classList.contains("dark")
    html.classList.add("dark")
    return () => {
      if (!had) html.classList.remove("dark")
    }
  }, [])

  return (
    <SidebarProvider className="ts-admin">
      <style dangerouslySetInnerHTML={{ __html: ADMIN_TOKENS }} />
      <Sidebar collapsible="icon">
        <SidebarHeader className="py-3">
          <WorkspaceSwitcher />
        </SidebarHeader>
        <SidebarContent>
          {groups.map((g) => (
            <SidebarGroup key={g.group}>
              <SidebarGroupLabel>{g.group}</SidebarGroupLabel>
              <SidebarMenu>
                {g.items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={item.href === base ? path === base : path.startsWith(item.href)}
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
        <SidebarFooter>
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
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mx-1 h-5" />
          <button className="hidden h-8 w-full max-w-sm min-w-0 items-center gap-2 rounded-md border bg-muted/40 px-2.5 text-sm whitespace-nowrap text-muted-foreground sm:flex">
            <Search className="size-4" />
            <span className="truncate">Search students, lessons, events</span>
            <kbd className="ml-auto rounded border bg-background px-1.5 font-mono text-[0.7rem]">⌘K</kbd>
          </button>
          <div className="ml-auto flex items-center gap-1">
            <HelpButton />
            <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
              <Bell />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" />
            </Button>
            <Avatar className="ml-1 size-8">
              <AvatarFallback className="text-xs">{DEMO_ADMIN.initials}</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
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
      <SheetTrigger render={<Button variant="outline" size="sm" />}>
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
