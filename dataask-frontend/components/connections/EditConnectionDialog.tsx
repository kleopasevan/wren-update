'use client'

import { useState, useEffect } from 'react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface EditConnectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  connection: Connection | null
  onSuccess: () => void
}

export function EditConnectionDialog({
  open,
  onOpenChange,
  workspaceId,
  connection,
  onSuccess,
}: EditConnectionDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Initialize form when connection changes
  useEffect(() => {
    if (connection) {
      setName(connection.name)
      setDescription(connection.description || '')
    }
  }, [connection])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!connection) return

    if (!name.trim()) {
      setError('Connection name is required')
      return
    }

    setIsLoading(true)

    try {
      await connectionsApi.update(workspaceId, connection.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      })

      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update connection')
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
          <DialogTitle>Edit Connection</DialogTitle>
          <DialogDescription>
            Update the name or description of your connection.
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
                placeholder="My Connection"
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

            <div className="text-sm text-muted-foreground">
              <p>
                Note: To change connection credentials, please delete this connection and
                create a new one.
              </p>
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
