import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Privacy Policy</CardTitle>
          <CardDescription>How we handle your data.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This template page is a placeholder. Replace it with your actual privacy policy before
            shipping.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
