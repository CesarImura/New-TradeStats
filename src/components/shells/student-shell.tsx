"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, LogOut, Search, Settings, User } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { CommunitySwitcher } from "@/components/student/community-switcher"
import { PreviewAsBanner, Tour } from "@/components/student/getting-started"
import { PreviewPicker } from "@/components/student/preview-picker"
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
import { backdropStyle, dimOf } from "@/lib/theme/backdrops"
import { cn } from "@/lib/utils"

function useActive(base: string) {
  const path = usePathname()
  return (item: NavItem) => (item.href === base ? path === base : path.startsWith(item.href))
}

/** The coach's platform. Same pages, two navigation layouts, one mobile bar. */
export function StudentShell({ children }: { children: React.ReactNode }) {
  const { coach, theme, base, preview } = useCoach()
  const items = studentNav(coach, base)
  const path = usePathname()
  const texture = { grid: "coach-bg-grid", glow: "coach-bg-glow", dots: "coach-bg-dots" } as Record<string, string>
  // An image or gradient sits on its own layer behind the page, so the page itself turns see-through.
  const where = theme.bgWhere ?? "all"
  const backdrop = backdropStyle(theme) && (where === "all" || (where === "home" && path === base)) ? backdropStyle(theme) : null
  const bg = backdrop ? "bg-transparent" : cn("bg-background", texture[theme.background])

  // The Charts terminal uses the full width, like a trading screen.
  const wide = path.startsWith(`${base}/charts`)
  const content = (
    <div data-edit-root className={cn("mx-auto w-full px-4 pt-5 pb-28 sm:px-6 md:pb-12 lg:px-8", wide ? "max-w-none pt-3 lg:px-4" : "max-w-[1280px]")}>
      {children}
      <Tour />
      {preview && <PreviewPicker />}
    </div>
  )

  // Floating: the page is a rounded canvas on the menu's ground, with a gutter around it (like the admin area).
  const floating = theme.nav.frame === "floating"
  const canvas = "md:rounded-[min(calc(var(--radius)*1.5),20px)] md:overflow-clip md:shadow-[0_0_0_1px_var(--border),0_1px_3px_rgb(0_0_0/0.08)]"

  if (theme.nav.layout === "top") {
    if (floating)
      return (
        <div className="min-h-svh bg-[var(--ground)]">
          <PreviewAsBanner />
          <TopNav items={items} floating />
          <div className={cn("relative isolate min-h-[calc(100svh-4.75rem)] md:mx-3 md:mb-3", bg, canvas)}>
            {backdrop && <Backdrop style={backdrop} dim={theme.background === "image" ? dimOf(theme) : 0} />}
            {content}
          </div>
          <MobileBar items={items} />
        </div>
      )
    return (
      <div className={cn("min-h-svh", bg)}>
        <PreviewAsBanner />
        {backdrop && <Backdrop style={backdrop} dim={theme.background === "image" ? dimOf(theme) : 0} />}
        <TopNav items={items} />
        {content}
        <MobileBar items={items} />
      </div>
    )
  }

  return (
    <SidebarProvider key={theme.nav.style} defaultOpen={theme.nav.style === "labels"} style={floating ? ({ "--sidebar": "var(--ground)" } as React.CSSProperties) : undefined}>
      <Sidebar collapsible="icon" variant={floating ? "inset" : "sidebar"} className="max-md:hidden" data-edit="nav">
        <SidebarHeader className="h-16 justify-center" data-edit="logo">
          <CommunitySwitcher placement="sidebar" />
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
      <SidebarInset className={cn(bg, floating && canvas)}>
        <PreviewAsBanner />
        {backdrop && <Backdrop style={backdrop} dim={theme.background === "image" ? dimOf(theme) : 0} />}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur sm:px-6 lg:px-8">
          <SidebarTrigger className="max-md:hidden" />
          <div className="min-w-0 md:hidden" data-edit="logo">
            <CommunitySwitcher placement="bar" />
          </div>
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

/** The coach's image or gradient, fixed behind the page, with page colour over it so text stays readable. */
function Backdrop({ style, dim }: { style: React.CSSProperties; dim: number }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0" style={style} />
      {dim > 0 && <div className="absolute inset-0 bg-background" style={{ opacity: dim / 100 }} />}
    </div>
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
            render={<Link href={item.href} data-tour={item.id} data-edit={`menu:${item.id}`} />}
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

function TopNav({ items, floating }: { items: NavItem[]; floating?: boolean }) {
  const { theme, base } = useCoach()
  const isActive = useActive(base)
  const centered = theme.nav.logo === "center"
  return (
    <header className={cn("sticky top-0 z-20", floating ? "bg-[var(--ground)]" : "border-b bg-background/85 backdrop-blur")} data-edit="nav">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-6 px-4 sm:px-6 lg:px-8">
        <div className={cn("min-w-0", centered && "md:absolute md:left-1/2 md:-translate-x-1/2")} data-edit="logo">
          <CommunitySwitcher placement="bar" />
        </div>
        <nav className={cn("hidden items-center gap-1 md:flex", centered && "order-first")}>
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              data-active={isActive(item)}
              data-tour={item.id}
              data-edit={`menu:${item.id}`}
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
          <DropdownMenuItem render={<Link href={`${base}/profile?tab=billing`} />}>
            <Settings /> Subscription & settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href={`/site/${coach.slug}/login`} />}>
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
    <nav data-edit="nav" className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {items.slice(0, 5).map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              data-active={isActive(item)}
              data-tour={item.id}
              data-edit={`menu:${item.id}`}
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
