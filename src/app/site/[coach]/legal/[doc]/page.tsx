import { LegalPage } from "@/components/public/account-pages"

export default async function Page({ params }: PageProps<"/site/[coach]/legal/[doc]">) {
  const { doc } = await params
  return <LegalPage doc={doc} />
}
