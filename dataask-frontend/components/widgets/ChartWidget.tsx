'use client'

import { BarChart3 } from 'lucide-react'
import { Widget } from '@/lib/api/widgets'

interface ChartWidgetProps {
  widget: Widget
}

export function ChartWidget({ widget }: ChartWidgetProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground">
      <BarChart3 className="h-12 w-12 mb-3 opacity-50" />
      <p className="text-sm">Chart visualization</p>
      <p className="text-xs mt-1 opacity-70">
        {widget.config.chartType || 'bar'} chart
      </p>
    </div>
  )
}
