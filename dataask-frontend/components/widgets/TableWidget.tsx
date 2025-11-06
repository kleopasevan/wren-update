'use client'

import { useEffect, useState } from 'react'
import { Table as TableIcon, Loader2, Database } from 'lucide-react'
import { Widget } from '@/lib/api/widgets'
import { queriesApi } from '@/lib/api/queries'
import { Button } from '@/components/ui/button'
import { useDashboardFilters } from '@/contexts/DashboardFiltersContext'
import { applyDashboardFilters } from '@/lib/utils/applyDashboardFilters'

interface TableWidgetProps {
  widget: Widget
  workspaceId?: string
}

export function TableWidget({ widget, workspaceId }: TableWidgetProps) {
  const { filters } = useDashboardFilters()
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const hasQuery = widget.config.connectionId && widget.config.query

  useEffect(() => {
    if (hasQuery && workspaceId) {
      executeQuery()
    }
  }, [widget.config.connectionId, widget.config.query, workspaceId, filters])

  async function executeQuery() {
    if (!workspaceId || !widget.config.connectionId || !widget.config.query) return

    setIsLoading(true)
    setError('')

    try {
      // Apply dashboard filters to the query
      const queryWithFilters = applyDashboardFilters(widget.config.query, filters)

      const result = await queriesApi.execute(
        workspaceId,
        widget.config.connectionId,
        { query: queryWithFilters }
      )
      setData(result.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  if (!hasQuery) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground">
        <Database className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-sm">No data source configured</p>
        <p className="text-xs mt-1 opacity-70">
          Edit widget to add a query
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground mt-2">Loading data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-destructive">
        <p className="text-sm mb-2">{error}</p>
        <Button onClick={executeQuery} size="sm" variant="outline">
          Retry
        </Button>
      </div>
    )
  }

  if (!data || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground">
        <TableIcon className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-sm">No data</p>
      </div>
    )
  }

  // Extract columns from first row
  const firstRow = data.data[0]
  const columns = Object.keys(firstRow)

  return (
    <div className="w-full h-full overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-background">
          <tr className="border-b border-border">
            {columns.map((col, idx) => (
              <th key={idx} className="text-left p-2 font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.data.map((row: any, rowIdx: number) => (
            <tr key={rowIdx} className="border-b border-border hover:bg-muted/50">
              {columns.map((col, cellIdx) => (
                <td key={cellIdx} className="p-2">
                  {row[col] !== null && row[col] !== undefined
                    ? String(row[col])
                    : <span className="text-muted-foreground italic">null</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
