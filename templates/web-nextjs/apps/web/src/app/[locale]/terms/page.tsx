import Link from 'next/link'

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Terms of Service</h1>
      <p className="mt-4 text-muted-foreground">
        This template page is a placeholder. Replace it with your actual terms before shipping.
      </p>
      <p className="mt-6">
        <Link href={`/${locale}/signup`} className="underline underline-offset-4">
          Back to sign up
        </Link>
      </p>
    </main>
  )
}
