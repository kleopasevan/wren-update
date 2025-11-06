'use client'

import { useEffect, useState } from 'react'
import { BarChart3, Loader2, Database } from 'lucide-react'
import { Widget } from '@/lib/api/widgets'
import { queriesApi } from '@/lib/api/queries'
import { Button } from '@/components/ui/button'

interface ChartWidgetProps {
  widget: Widget
  workspaceId?: string
}

export function ChartWidget({ widget, workspaceId }: ChartWidgetProps) {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const hasQuery = widget.config.connectionId && widget.config.query

  useEffect(() => {
    if (hasQuery && workspaceId) {
      executeQuery()
    }
  }, [widget.config.connectionId, widget.config.query, workspaceId])

  async function executeQuery() {
    if (!workspaceId || !widget.config.connectionId || !widget.config.query) return

    setIsLoading(true)
    setError('')

    try {
      const result = await queriesApi.execute(
        workspaceId,
        widget.config.connectionId,
        { query: widget.config.query }
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

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground">
        <BarChart3 className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-sm">No data</p>
      </div>
    )
  }

  // Simple data display for now (will be replaced with actual charts)
  const chartType = widget.config.chartType || 'bar'
  const rowCount = Array.isArray(data?.data) ? data.data.length : 0

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
      <BarChart3 className="h-12 w-12 mb-3 text-primary" />
      <p className="text-sm font-medium">{chartType.toUpperCase()} Chart</p>
      <p className="text-xs text-muted-foreground mt-1">
        {rowCount} data points loaded
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Chart visualization coming soon
      </p>
    </div>
  )
}
