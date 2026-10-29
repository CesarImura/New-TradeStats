import { Suspense } from "react"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { CoachHead } from "@/components/coach/coach-head"
import { CoachProvider } from "@/components/coach/coach-provider"
import { PrototypeBar } from "@/components/prototype/prototype-bar"
import { StudentShell } from "@/components/shells/student-shell"
import { COACHES, getDemoCoach, isCommunitySlug } from "@/lib/data/coaches"
import { markIcon } from "@/lib/theme/mark-icon"
import { resolveTheme } from "@/lib/theme/resolve"

export function generateStaticParams() {
  return COACHES.map((c) => ({ coach: c.slug }))
}

/** The coach's name and mark in the tab, never ours. Wizard-made communities get theirs in the browser (CoachHead). */
export async function generateMetadata({ params }: LayoutProps<"/c/[coach]">): Promise<Metadata> {
  const coach = getDemoCoach((await params).coach)
  if (!coach) return { title: "Community", icons: { icon: markIcon("·", "#18181b", "#f4f4f5") } }
  const theme = resolveTheme(coach)
  return { title: coach.name, description: coach.tagline, icons: { icon: markIcon(coach.mark, theme.primary, theme.primaryForeground) } }
}

export default function Layout({ children, params }: LayoutProps<"/c/[coach]">) {
  return (
    <Suspense>
      <CoachLayout params={params}>{children}</CoachLayout>
    </Suspense>
  )
}

async function CoachLayout({ children, params }: { children: React.ReactNode; params: Promise<{ coach: string }> }) {
  const { coach } = await params
  // Wizard-made communities exist only in the browser; the provider checks those.
  if (!isCommunitySlug(coach)) notFound()
  return (
    <CoachProvider slug={coach} base={`/c/${coach}`}>
      <CoachHead />
      <StudentShell>{children}</StudentShell>
      <PrototypeBar area="student" />
    </CoachProvider>
  )
}
