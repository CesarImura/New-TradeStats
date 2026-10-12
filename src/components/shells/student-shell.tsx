"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, LogOut, Search, Settings, User } from "lucide-react"
import { useCoach } from "@/components/coach/coach-provider"
import { CoachLogo } from "@/components/coach/coach-logo"
import { studentNav, type NavItem } from "@/components/coach/nav"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { DEMO_STUDENT } from "@/lib/data/sample"
import { DEMO_STUDENT_COMMUNITIES } from "@/lib/data/account"
import { getCoach } from "@/lib/data/coaches"
import { cn } from "@/lib/utils"

function useActive(base: string) {
  const path = usePathname()
  return (item: NavItem) => (item.href === base ? path === base : path.startsWith(item.href))
}

/** The coach's platform. Same pages, two navigation layouts, one mobile bar. */
export function StudentShell({ children }: { children: React.ReactNode }) {
  const { coach, theme, base } = useCoach()
  const items = studentNav(coach, base)
  const bg = theme.background === "grid" ? "coach-bg-grid" : theme.background === "glow" ? "coach-bg-glow" : ""

  const content = (
    <div className="mx-auto w-full max-w-[1280px] px-4 pt-5 pb-28 sm:px-6 md:pb-12 lg:px-8">{children}</div>
  )

  if (theme.nav.layout === "top") {
    return (
      <div className={cn("min-h-svh bg-background", bg)}>
        <TopNav items={items} />
        {content}
        <MobileBar items={items} />
      </div>
    )
  }

  return (
    <SidebarProvider key={theme.nav.style} defaultOpen={theme.nav.style === "labels"}>
      <Sidebar collapsible="icon" className="max-md:hidden">
        <SidebarHeader className="h-16 justify-center px-3">
          <Link href={base}>
            <CoachLogo coach={coach} className="group-data-[collapsible=icon]:[&>span:last-child]:hidden" />
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SideItems items={items} />
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-3">
          <ProfileMenu compact />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className={cn("bg-background", bg)}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur sm:px-6 lg:px-8">
          <SidebarTrigger className="max-md:hidden" />
          <Link href={base} className="md:hidden">
            <CoachLogo coach={coach} />
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <HeaderActions />
          </div>
        </header>
        {content}
        <MobileBar items={items} />
      </SidebarInset>
    </SidebarProvider>
  )
}

function SideItems({ items }: { items: NavItem[] }) {
  const isActive = useActive(useCoach().base)
  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton
            isActive={isActive(item)}
            tooltip={item.label}
            render={<Link href={item.href} />}
            className="h-10"
          >
            <item.icon />
            <span>{item.label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}

function TopNav({ items }: { items: NavItem[] }) {
  const { coach, theme, base } = useCoach()
  const isActive = useActive(base)
  const centered = theme.nav.logo === "center"
  return (
    <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href={base} className={cn(centered && "md:absolute md:left-1/2 md:-translate-x-1/2")}>
          <CoachLogo coach={coach} />
        </Link>
        <nav className={cn("hidden items-center gap-1 md:flex", centered && "order-first")}>
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              data-active={isActive(item)}
              className="rounded-[min(var(--radius),10px)] px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground data-[active=true]:bg-muted data-[active=true]:text-foreground"
            >
              {theme.nav.style === "icons" ? <item.icon className="size-4" aria-label={item.label} /> : item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <HeaderActions />
        </div>
      </div>
    </header>
  )
}

function HeaderActions() {
  return (
    <>
      <Button variant="ghost" size="icon" aria-label="Search">
        <Search />
      </Button>
      <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
        <Bell />
        <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" />
      </Button>
      <ProfileMenu />
    </>
  )
}

function ProfileMenu({ compact }: { compact?: boolean }) {
  const { base, coach } = useCoach()
  const others = DEMO_STUDENT_COMMUNITIES.filter((s) => s !== coach.slug).map((s) => getCoach(s)!)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            className={cn(
              "flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring",
              compact && "w-full rounded-[min(var(--radius),10px)] p-1 hover:bg-sidebar-accent",
            )}
          />
        }
      >
        <Avatar className="size-8">
          <AvatarFallback className="bg-highlight text-xs text-highlight-foreground">{DEMO_STUDENT.initials}</AvatarFallback>
        </Avatar>
        {compact && (
          <span className="truncate text-sm group-data-[collapsible=icon]:hidden">
            {DEMO_STUDENT.first} {DEMO_STUDENT.last}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            {DEMO_STUDENT.first} {DEMO_STUDENT.last}
          </DropdownMenuLabel>
          <DropdownMenuItem render={<Link href={`${base}/profile`} />}>
            <User /> Profile
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href={`${base}/profile`} />}>
            <Settings /> Subscription & settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        {others.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Your other communities</DropdownMenuLabel>
              {others.map((c) => (
                <DropdownMenuItem key={c.slug} render={<Link href={`/c/${c.slug}`} />}>
                  <span className="grid size-5 place-items-center rounded-sm bg-muted text-[0.6rem] font-semibold">{c.mark}</span>
                  {c.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Phone: both layouts become a bottom bar with the first five items. */
function MobileBar({ items }: { items: NavItem[] }) {
  const isActive = useActive(useCoach().base)
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {items.slice(0, 5).map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              data-active={isActive(item)}
              className="flex flex-col items-center gap-1 py-2.5 text-[0.7rem] text-muted-foreground data-[active=true]:text-primary"
            >
              <item.icon className="size-5" />
              <span className="max-w-full truncate px-1">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
