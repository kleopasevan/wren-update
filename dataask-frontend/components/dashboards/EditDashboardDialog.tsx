'use client'

import { useState, useEffect } from 'react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface EditDashboardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  dashboard: Dashboard | null
  onSuccess: () => void
}

export function EditDashboardDialog({
  open,
  onOpenChange,
  workspaceId,
  dashboard,
  onSuccess,
}: EditDashboardDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Initialize form when dashboard changes
  useEffect(() => {
    if (dashboard) {
      setName(dashboard.name)
      setDescription(dashboard.description || '')
    }
  }, [dashboard])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!dashboard) return

    if (!name.trim()) {
      setError('Dashboard name is required')
      return
    }

    setIsLoading(true)

    try {
      await dashboardsApi.update(workspaceId, dashboard.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      })

      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update dashboard')
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
          <DialogTitle>Edit Dashboard</DialogTitle>
          <DialogDescription>
            Update the name or description of your dashboard.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-name"
                placeholder="My Dashboard"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Input
                id="edit-description"
                placeholder="A brief description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
