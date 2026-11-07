import { Suspense } from "react"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { CoachHead } from "@/components/coach/coach-head"
import { CoachProvider } from "@/components/coach/coach-provider"
import { PrototypeBar } from "@/components/prototype/prototype-bar"
import { StudentShell } from "@/components/shells/student-shell"
import { COACHES, isCommunitySlug } from "@/lib/data/coaches"
import { markIcon } from "@/lib/theme/mark-icon"

export function generateStaticParams() {
  return COACHES.map((c) => ({ coach: c.slug }))
}

/**
 * The tab's title and icon are the coach's, set in the browser by CoachHead (as for wizard-made communities). Read
 * from the address here, they would block the route's prefetch (Next's URL data in generateMetadata), so the server
 * sends a neutral title.
 */
export const metadata: Metadata = { title: "Community", icons: { icon: markIcon("·", "#18181b", "#f4f4f5") } }

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
