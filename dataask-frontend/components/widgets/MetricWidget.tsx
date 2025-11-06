'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import { Widget } from '@/lib/api/widgets'

interface MetricWidgetProps {
  widget: Widget
}

export function MetricWidget({ widget }: MetricWidgetProps) {
  const value = widget.config.value || '0'
  const label = widget.config.label || 'Metric'
  const trend = widget.config.trend || 0
  const format = widget.config.format || 'number'

  const formattedValue = format === 'currency' ? `$${value}` : value

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[150px]">
      <div className="text-4xl font-bold mb-2">{formattedValue}</div>
      <div className="text-sm text-muted-foreground mb-2">{label}</div>
      {trend !== 0 && (
        <div className={`flex items-center text-xs ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend > 0 ? (
            <TrendingUp className="h-3 w-3 mr-1" />
          ) : (
            <TrendingDown className="h-3 w-3 mr-1" />
          )}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
  )
}
