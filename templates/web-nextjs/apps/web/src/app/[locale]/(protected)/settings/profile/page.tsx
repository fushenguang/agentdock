import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/features/auth/server'
import { ProfileForm } from '@/components/profile/profile-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  const displayName = user.user_metadata?.display_name ?? ''
  const email = user.email ?? ''
  const avatarUrl = user.user_metadata?.avatar_url ?? ''
  const initials = email.charAt(0).toUpperCase()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>
      <Separator />

      {/* Avatar & Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your public profile information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarUrl} alt={displayName || email} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{displayName || 'No display name set'}</p>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Avatar upload feature coming soon.</p>
        </CardContent>
      </Card>

      {/* Display Name */}
      <Card>
        <CardHeader>
          <CardTitle>Display Name</CardTitle>
          <CardDescription>Update your display name shown across the app.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm defaultName={displayName} locale={locale} />
        </CardContent>
      </Card>

      {/* Email */}
      <Card>
        <CardHeader>
          <CardTitle>Email Address</CardTitle>
          <CardDescription>Your primary email address.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{email}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            To change your email, please contact support.
          </p>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your password.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href={`/${locale}/forgot-password`}>Change Password</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
