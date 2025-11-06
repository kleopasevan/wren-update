'use client'

import { useState } from 'react'
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
import { widgetsApi } from '@/lib/api/widgets'
import { Loader2 } from 'lucide-react'

interface CreateWidgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  dashboardId: string
  onSuccess: () => void
}

export function CreateWidgetDialog({
  open,
  onOpenChange,
  workspaceId,
  dashboardId,
  onSuccess,
}: CreateWidgetDialogProps) {
  const [type, setType] = useState<'chart' | 'metric' | 'table' | 'text' | 'filter'>('metric')
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    setIsLoading(true)
    try {
      // Default config and position based on widget type
      const defaultConfig = {
        chart: { chartType: 'bar' },
        metric: { value: '0', label: 'New Metric', format: 'number' },
        table: { columns: [], rows: [] },
        text: { content: '', alignment: 'left', fontSize: 'medium' },
        filter: { filterType: 'dropdown', label: 'Filter' },
      }

      const defaultPosition = {
        x: 0,
        y: 0,
        w: type === 'metric' ? 3 : type === 'filter' ? 2 : 4,
        h: type === 'metric' ? 2 : type === 'filter' ? 2 : 4,
      }

      await widgetsApi.create(workspaceId, dashboardId, {
        type,
        title: title.trim() || undefined,
        config: defaultConfig[type],
        position: defaultPosition,
      })

      setType('metric')
      setTitle('')
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create widget')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Widget</DialogTitle>
          <DialogDescription>
            Add a new widget to your dashboard. Choose a type and give it a title.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Widget Type</Label>
              <Select value={type} onValueChange={(value: any) => setType(value)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="metric">Metric</SelectItem>
                  <SelectItem value="chart">Chart</SelectItem>
                  <SelectItem value="table">Table</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="filter">Filter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Widget"
              />
            </div>
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
              Add Widget
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
