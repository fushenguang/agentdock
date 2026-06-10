'use client'

import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Zap } from 'lucide-react'

interface UpgradeButtonProps {
  source?: string
  feature?: string
  trigger?: string
  icon?: boolean
  text?: string
  highlight?: boolean
}

export function UpgradeButton({
  source = 'default',
  feature,
  trigger,
  icon = true,
  text = 'Upgrade',
  highlight = false,
}: UpgradeButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    const params = new URLSearchParams()
    if (source) params.set('source', source)
    if (feature) params.set('feature', feature)
    if (trigger) params.set('trigger', trigger)

    const queryString = params.toString()
    router.push(`/pricing${queryString ? `?${queryString}` : ''}`)
  }

  return (
    <Button onClick={handleClick} variant={highlight ? 'default' : 'outline'} size="sm">
      {icon && <Zap className="mr-1 h-4 w-4" />}
      {text}
    </Button>
  )
}
