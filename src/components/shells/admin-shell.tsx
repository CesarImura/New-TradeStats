"use client"

import { Fragment, Suspense, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CalendarCheck,
  Eye,
  LifeBuoy,
  Mail,
  MessageCircle,
  Phone,
  PlayCircle,
  Search,
  Menu,
  Wand2,
  UserPlus,
  X,
  ChevronLeft,
  ChevronRight,
} from "@/components/icons"
import { TS_ADMIN_CSS, TS_SYSTEM_CSS } from "@/lib/theme/ts-system"
import { TS_ADMIN_V2_CSS } from "@/lib/theme/admin-v2"
import { cn } from "@/lib/utils"
import { AdminButton as Button } from "@/components/admin/ui"
import { useCoach } from "@/components/coach/coach-provider"
import { Logo } from "@/components/brand/logo"
import { WorkspaceSwitcher } from "@/components/admin/workspace-switcher"
import { TourLayer } from "@/components/admin/tour/tour"
import { NotificationsMenu } from "@/components/admin/notifications-menu"
import { CommandPalette } from "@/components/admin/command-palette"
import { DEMO_ADMIN } from "@/lib/data/account"
import { adminNav } from "@/components/coach/nav"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const ADMIN_CSS = TS_SYSTEM_CSS + TS_ADMIN_CSS + TS_ADMIN_V2_CSS

/**
 * Desktop sidebar size (Figma Admin / Sidebar, Size=Expanded | Collapsed), kept per browser. CSS reads it from
 * <html data-admin-sb> through arbitrary variants on html[data-admin-sb=collapsed] (scoped to .admin-side, so the drawer never collapses); React reads it for tooltips, labels and the switcher.
 */
const SIDEBAR_KEY = "admin:sidebar"
const sidebarListeners = new Set<() => void>()
function readCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === "collapsed"
  } catch {
    return false
  }
}
/** The size lives on <html data-admin-sb> (set before first paint by the root layout), so CSS draws it without waiting for React. */
function markCollapsed(collapsed: boolean) {
  document.documentElement.setAttribute("data-admin-sb", collapsed ? "collapsed" : "expanded")
}
function setCollapsedStored(collapsed: boolean) {
  markCollapsed(collapsed)
  try {
    localStorage.setItem(SIDEBAR_KEY, collapsed ? "collapsed" : "expanded")
  } catch {}
  sidebarListeners.forEach((l) => l())
}
function subscribeSidebar(l: () => void) {
  sidebarListeners.add(l)
  const onStorage = (e: StorageEvent) => {
    if (e.key !== SIDEBAR_KEY) return
    markCollapsed(readCollapsed())
    l()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    sidebarListeners.delete(l)
    window.removeEventListener("storage", onStorage)
  }
}
function useSidebarCollapsed() {
  return useSyncExternalStore(subscribeSidebar, readCollapsed, () => false)
}

/**
 * The admin area, Admin v2 (Figma "Admin / Sidebar" + "Admin / Topbar").
 * Identical in every community: same layout, same colours, same words, so people
 * who run several communities always know where things are. Only the switcher at
 * the top says which community is open.
 *
 * Desktop (xl, 1280px and up): a floating 255px sidebar card and a 56px topbar.
 * Tablet and phone: the sidebar becomes a drawer opened from the topbar.
 */
export function AdminShell({ studentBase, children }: { studentBase: string; children: React.ReactNode }) {
  const { coach, base } = useCoach()
  const path = usePathname()
  const groups = adminNav(coach, base)
  const isOpen = (href: string) => (href === base ? path === base : path.startsWith(href))
  const current = groups.flatMap((g) => g.items).find((i) => isOpen(i.href))
  const [drawer, setDrawer] = useState(false)
  // Any way of leaving the screen (a link, the search, the browser's back) closes the menu drawer.
  const [drawerPath, setDrawerPath] = useState(path)
  if (drawerPath !== path) {
    setDrawerPath(path)
    setDrawer(false)
  }
  const [searchOpen, setSearchOpen] = useState(false)
  const topbarRef = useRef<HTMLElement>(null) // the notifications panel hangs from the topbar
  // Lifted here so the sidebar and the drawer share one dismissal.
  const [invite, setInvite] = useState(true)

  useLayoutEffect(() => {
    const html = document.documentElement
    const had = html.classList.contains("dark")
    html.classList.add("dark")
    return () => {
      if (!had) html.classList.remove("dark")
    }
  }, [])

  const showInvite = invite && (coach as { status?: string }).status !== "setup"
  const menu = <SidebarBody groups={groups} base={base} studentBase={studentBase} isOpen={isOpen} invite={showInvite} onDismissInvite={() => setInvite(false)} />
  const sideMenu = (collapsed: boolean) => <SidebarBody groups={groups} base={base} studentBase={studentBase} isOpen={isOpen} invite={showInvite} onDismissInvite={() => setInvite(false)} collapsed={collapsed} />

  return (
    <SidebarProvider className="dark ts-ui ts-admin ts-admin-v2 bg-a-page font-a-sans text-a-text" style={{ "--sidebar-width": "255px" } as React.CSSProperties}>
      <style dangerouslySetInnerHTML={{ __html: ADMIN_CSS }} />
      <BrandGradients />
      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} base={base} />
      {/* Getting started tours: the coachmark, the pill and its panel (only while one is in progress). */}
      <Suspense fallback={null}>
        <TourLayer />
      </Suspense>
      <div className="flex min-h-svh w-full">
        <DesktopSidebar>{sideMenu}</DesktopSidebar>
        <Sheet open={drawer} onOpenChange={setDrawer}>
          <SheetContent side="left" showCloseButton={false} className="w-[min(320px,calc(100vw-48px))] gap-0 data-[side=left]:w-[min(320px,calc(100vw-48px))] border-a-border bg-a-page p-0 sm:max-w-none">
            <SheetHeader className="sr-only">
              <SheetTitle>Menu</SheetTitle>
              <SheetDescription>Admin navigation</SheetDescription>
            </SheetHeader>
            {/* A tap on a link closes the drawer. */}
            <div className="flex h-full flex-col pt-5 pr-4 pb-4 pl-4" onClickCapture={(e) => (e.target as HTMLElement).closest("a") && setDrawer(false)}>
              {menu}
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex min-w-0 flex-1 flex-col">
          <header ref={topbarRef} className="ts-admin-bar sticky top-0 z-20 flex h-14 items-center gap-2 px-4 md:px-8">
            <Button hierarchy="ghost" iconOnly aria-label="Open menu" className="xl:hidden" onClick={() => setDrawer(true)}>
              <Menu />
            </Button>
            <span className="t-body-l-medium truncate xl:hidden">{current?.label}</span>
            <button
              type="button"
              className="hidden h-11 w-80 max-w-full items-center gap-2 rounded-a-md border border-a-border-subtle bg-a-field px-3 text-left text-a-text-3 t-body-l transition-colors duration-300 hover:border-a-border-strong focus-visible:ring-2 focus-visible:ring-a-border-focus focus-visible:outline-none xl:flex"
              aria-keyshortcuts="Meta+K Control+K"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="size-4 text-a-icon" />
              <span className="flex-1">Search</span>
              {/* The shortcut is announced through aria-keyshortcuts; the name is the visible "Search". */}
              <kbd aria-hidden className="t-mono-meta rounded-a-xs bg-a-selected px-1.5 py-0.5 text-a-text-2">⌘K</kbd>
            </button>
            <div className="ml-auto flex items-center gap-2">
              <Button hierarchy="secondary" iconOnly aria-label="Search" className="xl:hidden" onClick={() => setSearchOpen(true)}>
                <Search />
              </Button>
              <HelpButton />
              <NotificationsMenu base={base} anchorRef={topbarRef} paused={searchOpen} />
              <Avatar className="ml-1 size-8">
                <AvatarFallback className="text-xs">{DEMO_ADMIN.initials}</AvatarFallback>
              </Avatar>
            </div>
          </header>
          <main className="mx-auto w-full max-w-[1264px] min-w-0 flex-1 px-4 pt-6 pb-16 md:px-8 md:pt-10 xl:pt-12">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}

/**
 * Desktop sidebar (xl and up). Its own component so collapsing re-renders only the menu, not the topbar, the tours
 * or the page.
 */
function DesktopSidebar({ children }: { children: (collapsed: boolean) => React.ReactNode }) {
  const collapsed = useSidebarCollapsed()
  // Transitions switch on after the first paint, so a stored "collapsed" does not animate in on load.
  const [animate, setAnimate] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)))
    return () => cancelAnimationFrame(id)
  }, [])
  // A 255px card, or 64px collapsed (icons only). Only the width animates; the page beside it reflows with it.
  return (
    <aside
      className={cn(
        "admin-side sticky top-0 z-30 hidden h-svh w-[271px] shrink-0 p-2 [html[data-admin-sb=collapsed]_&]:w-20 xl:block",
        animate && "transition-[width] duration-200 ease-out motion-reduce:transition-none"
      )}
      aria-label="Main menu"
    >
      <TooltipProvider delay={0}>
        <div className="flex h-full flex-col overflow-hidden rounded-a-xl border border-a-border bg-a-page pt-5 pr-4 pb-4 pl-4 [html[data-admin-sb=collapsed]_.admin-side_&]:px-[11px]">{children(collapsed)}</div>
      </TooltipProvider>
      {/* Same round button in both sizes, on the card's right edge level with the logo (Figma Collapse / Expand). */}
      <Button
        hierarchy="secondary"
        size="sm"
        iconOnly
        aria-label={collapsed ? "Expand menu" : "Collapse menu"}
        aria-expanded={!collapsed}
        onClick={() => setCollapsedStored(!collapsed)}
        className="absolute top-7 -right-[5px] rounded-full bg-a-panel text-a-text-2 hover:bg-a-hover hover:text-a-text active:scale-[0.97] transition-[background-color,color,scale]"
      >
        {collapsed ? <ChevronRight /> : <ChevronLeft />}
      </Button>
    </aside>
  )
}

type Groups = ReturnType<typeof adminNav>

/**
 * Brand gradient (Figma: brand gradient start to end, top to bottom). One hidden <svg> holds the gradient so the
 * active nav icon can paint with url(#…) from both the sidebar and the drawer. It is not display:none,
 * because a gradient inside a hidden svg does not render.
 */
function BrandGradients() {
  const stops = (
    <>
      <stop style={{ stopColor: "var(--admin-color-brand-gradient-start)" }} />
      <stop offset="1" style={{ stopColor: "var(--admin-color-brand-gradient-end)" }} />
    </>
  )
  return (
    <svg aria-hidden width="0" height="0" className="pointer-events-none absolute size-0">
      <defs>
        {/* Carbon icons draw on a 32 grid; their shapes span roughly 2 to 30. */}
        <linearGradient id="admin-icon-grad" gradientUnits="userSpaceOnUse" x1="16" y1="2" x2="16" y2="30">
          {stops}
        </linearGradient>
      </defs>
    </svg>
  )
}

/** Admin / Logo: the shared brand mark and wordmark (components/brand/logo.tsx). Collapsed, the wordmark fades out and the card clips it. */
function AdminLogo() {
  return (
    <Link href="/" aria-label="Traderhub" className="flex items-center px-2">
      <Logo wordClassName="whitespace-nowrap transition-opacity duration-150 ease-out [html[data-admin-sb=collapsed]_.admin-side_&]:opacity-0" />
    </Link>
  )
}

/**
 * Admin / Nav item (Figma 581:631, State x Icon Only). Expanded: 36px tall, label, a bar on the right when active.
 * Collapsed (desktop only): 40 x 40, icon only, the label in a tooltip. The icon keeps its place (card padding and
 * item padding swap together), so only the width moves.
 */
function NavLink({ href, label, icon: Icon, active, collapsed }: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; active?: boolean; collapsed: boolean }) {
  const link = (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-9 shrink-0 items-center gap-3 rounded-a-md border px-2 t-body-l outline-none transition-[height,background-color,border-color,color] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-a-border-focus [html[data-admin-sb=collapsed]_.admin-side_&]:h-10 [html[data-admin-sb=collapsed]_.admin-side_&]:px-3",
        active ? "border-a-border bg-a-panel text-a-text after:absolute after:top-2 after:right-2 after:bottom-2 after:w-0.5 after:rounded-full after:bg-[var(--admin-component-nav-indicator)] [html[data-admin-sb=collapsed]_.admin-side_&]:after:hidden" : "border-transparent text-a-text-nav hover:bg-a-hover hover:text-a-text"
      )}
    >
      <Icon className={cn("size-4 shrink-0", active ? "fill-[url(#admin-icon-grad)]" : "text-a-text-nav")} />
      <span className="min-w-0 overflow-hidden whitespace-nowrap transition-opacity duration-150 ease-out [html[data-admin-sb=collapsed]_.admin-side_&]:opacity-0">{label}</span>
    </Link>
  )
  // Always wrapped (disabled while expanded), so collapsing does not remount every link.
  return (
    <Tooltip disabled={!collapsed}>
      <TooltipTrigger render={link} />
      <TooltipContent side="right" sideOffset={10} className="rounded-a-sm bg-a-panel t-caption text-a-text shadow-lg ring-1 ring-a-border [&>div:last-child]:hidden">
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

/** Sidebar content, shared by the desktop card and the drawer (the drawer is never collapsed). */
function SidebarBody({ groups, base, studentBase, isOpen, invite, onDismissInvite, collapsed = false }: { groups: Groups; base: string; studentBase: string; isOpen: (href: string) => boolean; invite: boolean; onDismissInvite: () => void; collapsed?: boolean }) {
  return (
    <>
      <div className="flex items-center pr-1">
        <AdminLogo />
      </div>
      <nav aria-label="Admin" className="-mx-1 mt-2 flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-1 pb-2">
        {groups.map((g, i) => (
          <div key={g.group} className="flex flex-col gap-0.5">
            {/* The first page (Overview) sits on its own at the top, like a home link. Collapsed, a group's name turns into a line in the same space. */}
            {i > 0 ? (
              <span className="t-mono-label-s relative whitespace-nowrap px-2 pt-5 pb-2 text-a-text-3 transition-colors duration-150 ease-out after:absolute after:inset-x-1 after:bottom-[calc(50%-10px)] after:h-px after:bg-a-border after:opacity-0 after:transition-opacity after:duration-150 [html[data-admin-sb=collapsed]_.admin-side_&]:text-transparent [html[data-admin-sb=collapsed]_.admin-side_&]:after:opacity-100">
                {g.group}
              </span>
            ) : (
              <span className="h-2" />
            )}
            {g.items.map((item) => (
              <Fragment key={item.id}>
                <NavLink href={item.href} label={item.label} icon={item.icon} active={isOpen(item.href)} collapsed={collapsed} />
                {/* Platform: View as student sits right under Design (Figma Admin / Sidebar). */}
                {item.id === "design" && <NavLink href={studentBase} label="View as student" icon={Eye} collapsed={collapsed} />}
              </Fragment>
            ))}
          </div>
        ))}
      </nav>
      <div className="flex flex-col gap-2 pt-2">
        {invite && !collapsed && <InviteCard href={`${base}/settings?tab=team`} onDismiss={onDismissInvite} />}
        <WorkspaceSwitcher compact={collapsed} />
      </div>
    </>
  )
}

/** A quiet card above the footer links, as in ElevenLabs. Dismissed for this visit only. */
function InviteCard({ href, onDismiss }: { href: string; onDismiss: () => void }) {
  return (
    <div className="relative rounded-a-lg bg-a-subtle p-3 [html[data-admin-sb=collapsed]_.admin-side_&]:hidden [@media(max-height:820px)]:hidden">
      <button type="button" onClick={onDismiss} aria-label="Dismiss" className="absolute top-2 right-2 text-muted-foreground after:absolute after:-inset-[5px] after:content-[''] hover:text-foreground">
        <X className="size-3.5" />
      </button>
      <span className="grid size-7 place-items-center rounded-a-md bg-a-accent-strong/15 text-a-accent-strong">
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
      <SheetTrigger render={<Button hierarchy="secondary" />}>
        <LifeBuoy /> Help
      </SheetTrigger>
      <SheetContent className="w-full data-[side=right]:w-full sm:max-w-md">
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
            <Button className="mt-3" size="lg">Order a setup</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
