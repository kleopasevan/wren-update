'use client'

import { Filter } from 'lucide-react'
import { Widget } from '@/lib/api/widgets'

interface FilterWidgetProps {
  widget: Widget
}

export function FilterWidget({ widget }: FilterWidgetProps) {
  const filterType = widget.config.filterType || 'dropdown'
  const label = widget.config.label || 'Filter'

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[100px] text-muted-foreground">
      <Filter className="h-12 w-12 mb-3 opacity-50" />
      <p className="text-sm">{label}</p>
      <p className="text-xs mt-1 opacity-70">{filterType} filter</p>
    </div>
  )
}
