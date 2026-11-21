"use client"

import Link from "next/link"
import { Clock } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { AdminButton } from "./button"
import { AdminPageHeader } from "./page-header"
import { EmptyState } from "./empty-state"

/** Admin / Coming soon screen (Figma 'Journal · 00 Coming soon' 1680:72979): page header, Empty state with the clock icon, one short line and a secondary Back to Overview. Features not available yet use this and the grey 'Soon' badge in the menu. */
export function AdminComingSoon({ title, subtitle, name }: { title: string; subtitle?: string; name: string }) {
  const { base } = useCoach()
  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader title={title} subtitle={subtitle} />
      <EmptyState
        icon={Clock}
        title="Coming soon"
        description={`${name} will be available here soon.`}
        actions={
          <AdminButton hierarchy="secondary" size="xl" nativeButton={false} render={<Link href={base} />}>
            Back to Overview
          </AdminButton>
        }
      />
    </div>
  )
}
