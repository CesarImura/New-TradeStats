import { Suspense } from "react"
import { Placeholder } from "@/components/prototype/placeholder"

export default function Page({ params }: PageProps<"/admin/[coach]/[section]">) {
  return (
    <Suspense>
      <Section params={params} />
    </Suspense>
  )
}

async function Section({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  return <Placeholder area="admin" section={section} />
}
