import { Suspense } from "react"
import { StreamStudio } from "@/components/admin/livestreams/stream-studio"

export default function Page({ params }: PageProps<"/admin/[coach]/livestreams/[stream]">) {
  return (
    <Suspense>
      <Studio params={params} />
    </Suspense>
  )
}

async function Studio({ params }: { params: Promise<{ stream: string }> }) {
  const { stream } = await params
  return <StreamStudio id={stream} />
}
