import { Suspense } from "react"
import { CustomPageView } from "@/components/student/custom-page"

export default function Page({ params }: PageProps<"/c/[coach]/p/[page]">) {
  return (
    <Suspense>
      <Custom params={params} />
    </Suspense>
  )
}

async function Custom({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params
  return <CustomPageView id={page} />
}
