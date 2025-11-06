'use client'

import { Table } from 'lucide-react'
import { Widget } from '@/lib/api/widgets'

interface TableWidgetProps {
  widget: Widget
}

export function TableWidget({ widget }: TableWidgetProps) {
  const columns = widget.config.columns || []
  const rows = widget.config.rows || []

  if (columns.length === 0 || rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground">
        <Table className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-sm">Table widget</p>
        <p className="text-xs mt-1 opacity-70">No data configured</p>
      </div>
    )
  }

  return (
    <div className="w-full overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col: string, idx: number) => (
              <th key={idx} className="text-left p-2 font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row: any[], rowIdx: number) => (
            <tr key={rowIdx} className="border-b border-border">
              {row.map((cell: any, cellIdx: number) => (
                <td key={cellIdx} className="p-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
