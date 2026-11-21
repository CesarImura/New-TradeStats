"use client"

import Link from "next/link"
import { Bell, CreditCard, Eye, LogOut, Settings, Users } from "@/components/icons"
import { AdminMenu, AdminMenuContent, AdminMenuGroup, AdminMenuItem, AdminMenuLabel, AdminMenuSeparator, AdminMenuTrigger } from "@/components/admin/ui"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DEMO_ADMIN } from "@/lib/data/account"

/**
 * The avatar in the top bar (Overview decision 21/11: it was a dead picture). It opens the account menu: who you are, the settings you reach
 * most (account, notifications, team, plan), the way to the student view and Log out. Uses Admin / Menu, so it looks and moves like the other menus.
 */
export function AccountMenu({ base, studentBase }: { base: string; studentBase: string }) {
  return (
    <AdminMenu>
      <AdminMenuTrigger aria-label={`Account, ${DEMO_ADMIN.name}`} className="rounded-full outline-none transition-opacity duration-150 ease-out focus-visible:ring-2 focus-visible:ring-a-border-focus data-popup-open:opacity-80 motion-reduce:transition-none">
        <Avatar className="size-8">
          <AvatarFallback className="bg-a-track t-micro text-a-text ring-1 ring-inset ring-a-border">{DEMO_ADMIN.initials}</AvatarFallback>
        </Avatar>
      </AdminMenuTrigger>
      <AdminMenuContent align="end" className="min-w-60">
        <div className="flex flex-col px-2.5 pt-1.5 pb-2">
          <span className="t-body-m-medium text-a-text">{DEMO_ADMIN.name}</span>
          <span className="truncate t-caption text-a-text-2">{DEMO_ADMIN.email}</span>
        </div>
        <AdminMenuSeparator className="mt-0" />
        <AdminMenuGroup>
          <AdminMenuLabel>Account</AdminMenuLabel>
          <AdminMenuItem render={<Link href={`${base}/settings`} />}><Settings /> Settings</AdminMenuItem>
          <AdminMenuItem render={<Link href={`${base}/settings?tab=notifications`} />}><Bell /> Notification settings</AdminMenuItem>
          <AdminMenuItem render={<Link href={`${base}/settings?tab=team`} />}><Users /> Team and roles</AdminMenuItem>
          <AdminMenuItem render={<Link href={`${base}/settings?tab=plan`} />}><CreditCard /> Plan and invoices</AdminMenuItem>
        </AdminMenuGroup>
        <AdminMenuSeparator />
        <AdminMenuItem render={<Link href={studentBase} />}><Eye /> View as student</AdminMenuItem>
        <AdminMenuItem render={<Link href="/" />}><LogOut /> Log out</AdminMenuItem>
      </AdminMenuContent>
    </AdminMenu>
  )
}
