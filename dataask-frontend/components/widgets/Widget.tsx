'use client'

import { Widget as WidgetType } from '@/lib/api/widgets'
import { WidgetCard } from './WidgetCard'
import { ChartWidget } from './ChartWidget'
import { MetricWidget } from './MetricWidget'
import { TableWidget } from './TableWidget'
import { TextWidget } from './TextWidget'
import { FilterWidget } from './FilterWidget'

interface WidgetProps {
  widget: WidgetType
  workspaceId?: string
  onEdit: (widget: WidgetType) => void
  onDelete: (widget: WidgetType) => void
  onConfigureData?: (widget: WidgetType) => void
}

export function Widget({ widget, workspaceId, onEdit, onDelete, onConfigureData }: WidgetProps) {
  const renderWidgetContent = () => {
    switch (widget.type) {
      case 'chart':
        return <ChartWidget widget={widget} workspaceId={workspaceId} />
      case 'metric':
        return <MetricWidget widget={widget} workspaceId={workspaceId} />
      case 'table':
        return <TableWidget widget={widget} workspaceId={workspaceId} />
      case 'text':
        return <TextWidget widget={widget} />
      case 'filter':
        return <FilterWidget widget={widget} workspaceId={workspaceId || ''} />
      default:
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">Unknown widget type: {widget.type}</p>
          </div>
        )
    }
  }

  return (
    <WidgetCard
      widget={widget}
      onEdit={onEdit}
      onDelete={onDelete}
      onConfigureData={onConfigureData}
    >
      {renderWidgetContent()}
    </WidgetCard>
  )
}
