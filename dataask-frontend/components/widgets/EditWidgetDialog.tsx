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
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (widget) {
      setTitle(widget.title || '')
    }
  }, [widget])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!widget) return

    setError('')
    setIsLoading(true)

    try {
      await widgetsApi.update(workspaceId, dashboardId, widget.id, {
        title: title.trim() || undefined,
      })

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
            Update the widget title. Type: {widget?.type}
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
