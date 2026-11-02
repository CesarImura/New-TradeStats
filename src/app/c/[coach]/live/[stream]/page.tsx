import { Suspense } from "react"
import { LiveWatch } from "@/components/student/live-watch"

export default function Page({ params }: PageProps<"/c/[coach]/live/[stream]">) {
  return (
    <Suspense>
      <Watch params={params} />
    </Suspense>
  )
}

async function Watch({ params }: { params: Promise<{ stream: string }> }) {
  const { stream } = await params
  return <LiveWatch id={stream} />
}
