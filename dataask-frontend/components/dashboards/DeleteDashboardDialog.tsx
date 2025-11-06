'use client'

import { useState } from 'react'
import { dashboardsApi, type Dashboard } from '@/lib/api/dashboards'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DeleteDashboardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  dashboard: Dashboard | null
  onSuccess: () => void
}

export function DeleteDashboardDialog({
  open,
  onOpenChange,
  workspaceId,
  dashboard,
  onSuccess,
}: DeleteDashboardDialogProps) {
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleDelete() {
    if (!dashboard) return

    setIsLoading(true)
    setError('')

    try {
      await dashboardsApi.delete(workspaceId, dashboard.id)
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  function handleCancel() {
    setError('')
    onOpenChange(false)
  }

  if (!dashboard) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Dashboard</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{dashboard.name}"? This action cannot be undone.
            All widgets and visualizations in this dashboard will be permanently deleted.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete Dashboard'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
