'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Widget, widgetsApi } from '@/lib/api/widgets'
import { Loader2 } from 'lucide-react'

interface EditWidgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  widget: Widget | null
  workspaceId: string
  dashboardId: string
  onSuccess: () => void
}

export function EditWidgetDialog({
  open,
  onOpenChange,
  widget,
  workspaceId,
  dashboardId,
  onSuccess,
}: EditWidgetDialogProps) {
  const [title, setTitle] = useState('')
  const [chartType, setChartType] = useState('bar')
  const [gaugeMin, setGaugeMin] = useState('0')
  const [gaugeMax, setGaugeMax] = useState('100')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (widget) {
      setTitle(widget.title || '')
      if (widget.type === 'chart') {
        setChartType(widget.config.chartType || 'bar')
        setGaugeMin(String(widget.config.gaugeMin || 0))
        setGaugeMax(String(widget.config.gaugeMax || 100))
      }
    }
  }, [widget])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!widget) return

    setError('')
    setIsLoading(true)

    try {
      const updateData: any = {
        title: title.trim() || undefined,
      }

      // Include chart-specific config if this is a chart widget
      if (widget.type === 'chart') {
        updateData.config = {
          ...widget.config,
          chartType,
          gaugeMin: parseFloat(gaugeMin) || 0,
          gaugeMax: parseFloat(gaugeMax) || 100,
        }
      }

      await widgetsApi.update(workspaceId, dashboardId, widget.id, updateData)

      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update widget')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Widget</DialogTitle>
          <DialogDescription>
            Update widget settings. Type: {widget?.type}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Widget"
              />
            </div>

            {/* Chart-specific configuration */}
            {widget?.type === 'chart' && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="chartType">Chart Type</Label>
                  <Select value={chartType} onValueChange={setChartType}>
                    <SelectTrigger id="chartType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                      <SelectItem value="line">Line Chart</SelectItem>
                      <SelectItem value="area">Area Chart</SelectItem>
                      <SelectItem value="pie">Pie Chart</SelectItem>
                      <SelectItem value="scatter">Scatter Chart</SelectItem>
                      <SelectItem value="gauge">Gauge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Gauge-specific fields */}
                {chartType === 'gauge' && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="gaugeMin">Minimum Value</Label>
                      <Input
                        id="gaugeMin"
                        type="number"
                        value={gaugeMin}
                        onChange={(e) => setGaugeMin(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="gaugeMax">Maximum Value</Label>
                      <Input
                        id="gaugeMax"
                        type="number"
                        value={gaugeMax}
                        onChange={(e) => setGaugeMax(e.target.value)}
                        placeholder="100"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
