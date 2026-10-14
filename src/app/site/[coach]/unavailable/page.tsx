import { Unavailable } from "@/components/public/account-pages"

export default async function Page({ searchParams }: PageProps<"/site/[coach]/unavailable">) {
  const { reason } = await searchParams
  return <Unavailable reason={reason === "suspended" || reason === "missing" ? reason : "unpublished"} />
}
