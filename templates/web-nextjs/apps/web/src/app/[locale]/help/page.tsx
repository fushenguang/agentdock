import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function HelpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Help Center</CardTitle>
          <CardDescription>Find answers to common questions.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            We are currently compiling our help documentation. Please check back later.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
