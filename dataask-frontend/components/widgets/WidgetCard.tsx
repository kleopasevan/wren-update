'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Pencil, Trash2, Database, Download } from 'lucide-react'
import { Widget } from '@/lib/api/widgets'

interface WidgetCardProps {
  widget: Widget
  onEdit: (widget: Widget) => void
  onDelete: (widget: Widget) => void
  onConfigureData?: (widget: Widget) => void
  onExport?: () => void
  children: React.ReactNode
}

export function WidgetCard({ widget, onEdit, onDelete, onConfigureData, onExport, children }: WidgetCardProps) {
  // Only show Configure Data for chart, table, and metric widgets
  const showConfigureData = onConfigureData && (widget.type === 'chart' || widget.type === 'table' || widget.type === 'metric')

  return (
    <Card className="h-full flex flex-col group">
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          {widget.title || `${widget.type.charAt(0).toUpperCase() + widget.type.slice(1)} Widget`}
        </CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {showConfigureData && (
              <>
                <DropdownMenuItem onClick={() => onConfigureData(widget)}>
                  <Database className="mr-2 h-4 w-4" />
                  Configure Data
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {onExport && (
              <>
                <DropdownMenuItem onClick={onExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => onEdit(widget)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(widget)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="flex-1">
        {children}
      </CardContent>
    </Card>
  )
}
