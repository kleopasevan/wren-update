'use client'

import { useState } from 'react'
import { connectionsApi, type Connection } from '@/lib/api/connections'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DeleteConnectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  connection: Connection | null
  onSuccess: () => void
}

export function DeleteConnectionDialog({
  open,
  onOpenChange,
  workspaceId,
  connection,
  onSuccess,
}: DeleteConnectionDialogProps) {
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleDelete() {
    if (!connection) return

    setIsLoading(true)
    setError('')

    try {
      await connectionsApi.delete(workspaceId, connection.id)
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete connection')
    } finally {
      setIsLoading(false)
    }
  }

  function handleCancel() {
    setError('')
    onOpenChange(false)
  }

  if (!connection) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Connection</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{connection.name}"? This action cannot be undone.
            All dashboards and queries using this connection will no longer work.
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
            {isLoading ? 'Deleting...' : 'Delete Connection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
