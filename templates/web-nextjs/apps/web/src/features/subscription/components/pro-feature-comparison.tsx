'use client'

import { useTranslations } from 'next-intl'
import { Check, X } from 'lucide-react'

interface Feature {
  name: string
  free: boolean | string
  pro: boolean | string
}

interface ProFeatureComparisonProps {
  features?: Feature[]
}

export function ProFeatureComparison({ features }: ProFeatureComparisonProps) {
  const t = useTranslations('subscription')

  const defaultFeatures: Feature[] = [
    { name: t('featureProjects'), free: '3', pro: '50' },
    { name: t('featureApiCalls'), free: '1,000', pro: '100,000' },
    { name: t('featureSupport'), free: false, pro: true },
    { name: t('featureAnalytics'), free: false, pro: true },
  ]

  const displayFeatures = features || defaultFeatures

  return (
    <div className="w-full overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">{t('feature')}</th>
            <th className="px-4 py-3 text-center font-medium">{t('free')}</th>
            <th className="px-4 py-3 text-center font-medium">{t('pro')}</th>
          </tr>
        </thead>
        <tbody>
          {displayFeatures.map((feat, index) => (
            <tr key={index} className="border-b last:border-0">
              <td className="px-4 py-3 font-medium">{feat.name}</td>
              <td className="px-4 py-3 text-center">
                {typeof feat.free === 'boolean' ? (
                  feat.free ? (
                    <Check className="mx-auto h-4 w-4 text-green-500" />
                  ) : (
                    <X className="mx-auto h-4 w-4 text-muted-foreground" />
                  )
                ) : (
                  <span>{feat.free}</span>
                )}
              </td>
              <td className="px-4 py-3 text-center">
                {typeof feat.pro === 'boolean' ? (
                  feat.pro ? (
                    <Check className="mx-auto h-4 w-4 text-green-500" />
                  ) : (
                    <X className="mx-auto h-4 w-4 text-muted-foreground" />
                  )
                ) : (
                  <span className="font-medium">{feat.pro}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
