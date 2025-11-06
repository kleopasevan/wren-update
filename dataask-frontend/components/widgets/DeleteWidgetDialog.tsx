'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Widget, widgetsApi } from '@/lib/api/widgets'
import { Loader2 } from 'lucide-react'

interface DeleteWidgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  widget: Widget | null
  workspaceId: string
  dashboardId: string
  onSuccess: () => void
}

export function DeleteWidgetDialog({
  open,
  onOpenChange,
  widget,
  workspaceId,
  dashboardId,
  onSuccess,
}: DeleteWidgetDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleDelete() {
    if (!widget) return

    setIsLoading(true)
    try {
      await widgetsApi.delete(workspaceId, dashboardId, widget.id)
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      console.error('Failed to delete widget:', err)
      // Keep dialog open to show error
      setIsLoading(false)
    }
  }

  const widgetTitle = widget?.title || `${widget?.type || 'Widget'}`

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Widget</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{widgetTitle}&quot;? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
