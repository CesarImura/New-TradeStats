import { Suspense } from "react"
import { notFound } from "next/navigation"
import { CoachProvider } from "@/components/coach/coach-provider"
import { PrototypeBar } from "@/components/prototype/prototype-bar"
import { StudentShell } from "@/components/shells/student-shell"
import { COACHES, isCommunitySlug } from "@/lib/data/coaches"

export function generateStaticParams() {
  return COACHES.map((c) => ({ coach: c.slug }))
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
      <StudentShell>{children}</StudentShell>
      <PrototypeBar area="student" />
    </CoachProvider>
  )
}
