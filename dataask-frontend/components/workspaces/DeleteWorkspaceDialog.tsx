'use client'

import { useState } from 'react'
import { workspacesApi, type Workspace } from '@/lib/api/workspaces'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DeleteWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspace: Workspace | null
  onSuccess: () => void
}

export function DeleteWorkspaceDialog({
  open,
  onOpenChange,
  workspace,
  onSuccess,
}: DeleteWorkspaceDialogProps) {
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleDelete() {
    if (!workspace) return

    setIsLoading(true)
    setError('')

    try {
      await workspacesApi.delete(workspace.id)
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete workspace')
    } finally {
      setIsLoading(false)
    }
  }

  function handleCancel() {
    setError('')
    onOpenChange(false)
  }

  if (!workspace) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Workspace</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{workspace.name}"? This action cannot be undone.
            All dashboards, connections, and data within this workspace will be permanently deleted.
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
            {isLoading ? 'Deleting...' : 'Delete Workspace'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
