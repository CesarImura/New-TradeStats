import { Suspense } from "react"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { CoachHead } from "@/components/coach/coach-head"
import { CoachProvider } from "@/components/coach/coach-provider"
import { PrototypeBar } from "@/components/prototype/prototype-bar"
import { PublicShell } from "@/components/public/public-shell"
import { COACHES, getDemoCoach, isCommunitySlug } from "@/lib/data/coaches"
import { markIcon } from "@/lib/theme/mark-icon"
import { resolveTheme } from "@/lib/theme/resolve"

export function generateStaticParams() {
  return COACHES.map((c) => ({ coach: c.slug }))
}

/** The coach's name and mark in the tab, never ours. Wizard-made communities get theirs in the browser (CoachHead). */
export async function generateMetadata({ params }: LayoutProps<"/site/[coach]">): Promise<Metadata> {
  const coach = getDemoCoach((await params).coach)
  if (!coach) return { title: "Community", icons: { icon: markIcon("·", "#18181b", "#f4f4f5") } }
  const theme = resolveTheme(coach)
  return { title: coach.name, description: coach.tagline, icons: { icon: markIcon(coach.mark, theme.primary, theme.primaryForeground) } }
}

/** PUB-01 to PUB-12 and STO-01 to STO-03: what people see before and right after they join, on the coach's own address. */
export default function Layout({ children, params }: LayoutProps<"/site/[coach]">) {
  return (
    <Suspense>
      <SiteLayout params={params}>{children}</SiteLayout>
    </Suspense>
  )
}

async function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ coach: string }> }) {
  const { coach } = await params
  if (!isCommunitySlug(coach)) notFound()
  return (
    <CoachProvider slug={coach} base={`/site/${coach}`}>
      <CoachHead />
      <PublicShell>{children}</PublicShell>
      <PrototypeBar area="site" />
    </CoachProvider>
  )
}
