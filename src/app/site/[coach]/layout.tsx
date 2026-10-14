import { Suspense } from "react"
import { notFound } from "next/navigation"
import { CoachProvider } from "@/components/coach/coach-provider"
import { PrototypeBar } from "@/components/prototype/prototype-bar"
import { PublicShell } from "@/components/public/public-shell"
import { COACHES, isCommunitySlug } from "@/lib/data/coaches"

export function generateStaticParams() {
  return COACHES.map((c) => ({ coach: c.slug }))
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
      <PublicShell>{children}</PublicShell>
      <PrototypeBar area="site" />
    </CoachProvider>
  )
}
