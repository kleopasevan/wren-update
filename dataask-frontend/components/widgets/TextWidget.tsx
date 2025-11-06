'use client'

import { Type } from 'lucide-react'
import { Widget } from '@/lib/api/widgets'

interface TextWidgetProps {
  widget: Widget
}

export function TextWidget({ widget }: TextWidgetProps) {
  const content = widget.config.content || ''
  const alignment = (widget.config.alignment || 'left') as 'left' | 'center' | 'right'
  const fontSize = (widget.config.fontSize || 'medium') as 'small' | 'medium' | 'large'

  const fontSizeClasses: Record<'small' | 'medium' | 'large', string> = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  }
  const fontSizeClass = fontSizeClasses[fontSize] || 'text-base'

  const alignmentClasses: Record<'left' | 'center' | 'right', string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }
  const alignmentClass = alignmentClasses[alignment] || 'text-left'

  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[100px] text-muted-foreground">
        <Type className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-sm">Text widget</p>
        <p className="text-xs mt-1 opacity-70">No content</p>
      </div>
    )
  }

  return (
    <div className={`${fontSizeClass} ${alignmentClass} whitespace-pre-wrap`}>
      {content}
    </div>
  )
}
