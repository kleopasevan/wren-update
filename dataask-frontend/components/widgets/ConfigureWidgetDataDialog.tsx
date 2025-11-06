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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'
import { connectionsApi, Connection } from '@/lib/api/connections'
import { QueryBuilder } from '@/components/queries/QueryBuilder'
import { QueryDefinition } from '@/lib/api/queries'

interface ConfigureWidgetDataDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  onSave: (connectionId: string, query: QueryDefinition) => void
}

export function ConfigureWidgetDataDialog({
  open,
  onOpenChange,
  workspaceId,
  onSave,
}: ConfigureWidgetDataDialogProps) {
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>('')
  const [isLoadingConnections, setIsLoadingConnections] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      loadConnections()
    }
  }, [open, workspaceId])

  async function loadConnections() {
    try {
      setIsLoadingConnections(true)
      setError('')
      const data = await connectionsApi.list(workspaceId)
      setConnections(data)
      if (data.length > 0 && !selectedConnectionId) {
        setSelectedConnectionId(data[0].id)
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load connections')
    } finally {
      setIsLoadingConnections(false)
    }
  }

  function handleSaveQuery(query: QueryDefinition) {
    if (!selectedConnectionId) {
      setError('Please select a connection')
      return
    }
    onSave(selectedConnectionId, query)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Widget Data Source</DialogTitle>
          <DialogDescription>
            Select a connection and build a query to power this widget
          </DialogDescription>
        </DialogHeader>

        {isLoadingConnections ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error && connections.length === 0 ? (
          <div className="text-destructive py-4">{error}</div>
        ) : connections.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No connections found. Please create a connection first.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Connection Selection */}
            <div className="space-y-2">
              <Label>Connection</Label>
              <Select
                value={selectedConnectionId}
                onValueChange={setSelectedConnectionId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a connection..." />
                </SelectTrigger>
                <SelectContent>
                  {connections.map((conn) => (
                    <SelectItem key={conn.id} value={conn.id}>
                      {conn.name} ({conn.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Query Builder */}
            {selectedConnectionId && (
              <QueryBuilder
                workspaceId={workspaceId}
                connectionId={selectedConnectionId}
                onSave={handleSaveQuery}
              />
            )}

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                {error}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
