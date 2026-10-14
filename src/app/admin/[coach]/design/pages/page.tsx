import { redirect } from "next/navigation"

/** Pages lives inside the Design workspace now: old links open it on Arrange, with the page they asked for. */
export default async function Page({ params, searchParams }: PageProps<"/admin/[coach]/design/pages">) {
  const { coach } = await params
  const q = new URLSearchParams(Object.entries(await searchParams).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : [])))
  q.set("mode", "arrange")
  if (!q.has("panel")) q.set("panel", "pages")
  redirect(`/admin/${coach}/design?${q}`)
}
