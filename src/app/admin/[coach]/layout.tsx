import { Suspense } from "react"
import { notFound } from "next/navigation"
import { CoachProvider } from "@/components/coach/coach-provider"
import { PrototypeBar } from "@/components/prototype/prototype-bar"
import { AdminShell } from "@/components/shells/admin-shell"
import { COACHES, getCoach } from "@/lib/data/coaches"

export function generateStaticParams() {
  return COACHES.map((c) => ({ coach: c.slug }))
}

export default function Layout({ children, params }: LayoutProps<"/admin/[coach]">) {
  return (
    <Suspense>
      <CoachLayout params={params}>{children}</CoachLayout>
    </Suspense>
  )
}

async function CoachLayout({ children, params }: { children: React.ReactNode; params: Promise<{ coach: string }> }) {
  const { coach } = await params
  if (!getCoach(coach)) notFound()
  return (
    <CoachProvider slug={coach} base={`/admin/${coach}`} apply={false}>
      <AdminShell studentBase={`/c/${coach}`}>{children}</AdminShell>
      <PrototypeBar area="admin" />
    </CoachProvider>
  )
}
