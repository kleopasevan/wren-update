'use client'

import { useState } from 'react'
import { workspacesApi, type CreateWorkspaceData } from '@/lib/api/workspaces'
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

interface CreateWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateWorkspaceDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Workspace name is required')
      return
    }

    setIsLoading(true)

    try {
      const data: CreateWorkspaceData = {
        name: name.trim(),
        description: description.trim() || undefined,
      }

      await workspacesApi.create(data)

      // Reset form and close dialog
      setName('')
      setDescription('')
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create workspace')
    } finally {
      setIsLoading(false)
    }
  }

  function handleCancel() {
    setName('')
    setDescription('')
    setError('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
          <DialogDescription>
            Create a new workspace to organize your data connections and dashboards.
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
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="My Workspace"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="A brief description of this workspace"
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
              {isLoading ? 'Creating...' : 'Create Workspace'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
