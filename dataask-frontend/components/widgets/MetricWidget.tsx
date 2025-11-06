'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Loader2, Database } from 'lucide-react'
import { Widget } from '@/lib/api/widgets'
import { queriesApi } from '@/lib/api/queries'
import { Button } from '@/components/ui/button'

interface MetricWidgetProps {
  widget: Widget
  workspaceId?: string
}

export function MetricWidget({ widget, workspaceId }: MetricWidgetProps) {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const hasQuery = widget.config.connectionId && widget.config.query
  const label = widget.config.label || widget.title || 'Metric'
  const format = widget.config.format || 'number'
  const trend = widget.config.trend || 0

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

  // If no query, use static value from config
  if (!hasQuery) {
    const value = widget.config.value || '0'
    const formattedValue = format === 'currency' ? `$${value}` : value

    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[150px]">
        <div className="text-4xl font-bold mb-2">{formattedValue}</div>
        <div className="text-sm text-muted-foreground mb-2">{label}</div>
        <div className="text-xs text-muted-foreground mt-1">
          Static value
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[150px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground mt-2">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-destructive">
        <p className="text-sm mb-2">{error}</p>
        <Button onClick={executeQuery} size="sm" variant="outline">
          Retry
        </Button>
      </div>
    )
  }

  if (!data || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-muted-foreground">
        <Database className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-sm">No data</p>
      </div>
    )
  }

  // Extract metric value from first row, first column
  const firstRow = data.data[0]
  const keys = Object.keys(firstRow)
  const rawValue = firstRow[keys[0]]

  // Format the value
  let value = rawValue
  if (typeof rawValue === 'number') {
    if (format === 'currency') {
      value = `$${rawValue.toLocaleString()}`
    } else if (format === 'percent') {
      value = `${rawValue.toFixed(1)}%`
    } else {
      value = rawValue.toLocaleString()
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[150px]">
      <div className="text-4xl font-bold mb-2">{value}</div>
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
