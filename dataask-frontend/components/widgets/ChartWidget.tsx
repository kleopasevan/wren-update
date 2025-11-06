'use client'

import { useEffect, useState, useRef } from 'react'
import { BarChart3, Loader2, Database } from 'lucide-react'
import { Widget } from '@/lib/api/widgets'
import { queriesApi } from '@/lib/api/queries'
import { Button } from '@/components/ui/button'
import { BarChartComponent } from '@/components/charts/BarChartComponent'
import { LineChartComponent } from '@/components/charts/LineChartComponent'
import { PieChartComponent } from '@/components/charts/PieChartComponent'
import { useDashboardFilters } from '@/contexts/DashboardFiltersContext'
import { applyDashboardFilters } from '@/lib/utils/applyDashboardFilters'
import { exportToPNG, generateFilename } from '@/lib/utils/export'

interface ChartWidgetProps {
  widget: Widget
  workspaceId?: string
  onExportReady?: (exportFn: () => void) => void
}

export function ChartWidget({ widget, workspaceId, onExportReady }: ChartWidgetProps) {
  const { filters } = useDashboardFilters()
  const chartRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const hasQuery = widget.config.connectionId && widget.config.query

  // Expose export function to parent
  useEffect(() => {
    if (data && data.data && chartRef.current && onExportReady) {
      onExportReady(() => handleExport())
    }
  }, [data, onExportReady])

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

  async function handleExport() {
    if (!chartRef.current) {
      return
    }

    try {
      const filename = generateFilename(
        widget.title || 'chart',
        'png'
      )
      await exportToPNG(chartRef.current, filename, {
        backgroundColor: '#ffffff',
        scale: 2,
      })
    } catch (error) {
      console.error('Export failed:', error)
      // Could show a toast notification here
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
        <BarChart3 className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-sm">No data</p>
      </div>
    )
  }

  const chartType = widget.config.chartType || 'bar'
  const chartData = data.data

  // Auto-detect keys from data if not configured
  const firstRow = chartData[0]
  const keys = Object.keys(firstRow)

  // Use configured keys or auto-detect
  const xKey = widget.config.xKey || keys[0]
  const yKey = widget.config.yKey || keys[1] || keys[0]

  // Render appropriate chart type
  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return <BarChartComponent data={chartData} xKey={xKey} yKey={yKey} />
      case 'line':
        return <LineChartComponent data={chartData} xKey={xKey} yKey={yKey} />
      case 'pie':
        return <PieChartComponent data={chartData} nameKey={xKey} valueKey={yKey} />
      default:
        return <BarChartComponent data={chartData} xKey={xKey} yKey={yKey} />
    }
  }

  return (
    <div ref={chartRef} className="w-full h-full min-h-[250px]">
      {renderChart()}
    </div>
  )
}
