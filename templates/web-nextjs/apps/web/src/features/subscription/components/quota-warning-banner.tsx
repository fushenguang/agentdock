'use client'

import { useRouter } from '@/i18n/navigation'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QuotaWarningBannerProps {
  quotaName?: string
  currentUsage?: number
  maxQuota?: number
}

export function QuotaWarningBanner({
  quotaName = 'API calls',
  currentUsage = 0,
  maxQuota = 1000,
}: QuotaWarningBannerProps) {
  const router = useRouter()
  const percentage = (currentUsage / maxQuota) * 100
  const isNearLimit = percentage >= 80

  if (!isNearLimit) return null

  return (
    <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
      <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
          You are using {currentUsage} of {maxQuota} {quotaName} ({percentage.toFixed(0)}%)
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={() => router.push('/pricing')}>
        Upgrade
      </Button>
    </div>
  )
}
