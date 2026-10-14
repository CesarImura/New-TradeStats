import { redirect } from "next/navigation"

/** The Home builder became Arrange in the Design workspace; old links (the setup wizard's too) land on Home there. */
export default async function Page({ params, searchParams }: PageProps<"/admin/[coach]/design/home">) {
  const { coach } = await params
  const q = new URLSearchParams(Object.entries(await searchParams).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : [])))
  q.set("page", "home")
  redirect(`/admin/${coach}/design/pages?${q}`)
}
