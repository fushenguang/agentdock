import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>About Us</CardTitle>
          <CardDescription>Learn more about AgentDock.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This page is a placeholder. Replace it with your actual about information before
            shipping.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
