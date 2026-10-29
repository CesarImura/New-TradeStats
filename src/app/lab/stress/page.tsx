import { Suspense } from "react"
import { StressBench } from "@/components/lab/stress-bench"

export const metadata = { title: "Widget stress bench · Prototype" }

type Search = Promise<{ type?: string; content?: string; mode?: string; detail?: string; range?: string }>

/** Prototype only: one widget's layouts at many grid sizes and amounts of content, to find what breaks. */
export default function StressPage({ searchParams }: { searchParams: Search }) {
  // Reading the URL is runtime data, so it sits inside the Suspense boundary.
  return (
    <Suspense>
      <Bench searchParams={searchParams} />
    </Suspense>
  )
}

async function Bench({ searchParams }: { searchParams: Search }) {
  const { type, content, mode, detail, range } = await searchParams
  return <StressBench type={type} content={content} mode={mode === "dark" ? "dark" : "light"} detail={detail} range={range === "1" ? "grid" : range === "axes" ? "axes" : range === "natural" ? "natural" : undefined} />
}
