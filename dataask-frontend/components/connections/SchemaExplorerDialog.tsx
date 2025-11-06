'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SchemaExplorer } from '@/components/connections/SchemaExplorer'

interface SchemaExplorerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  connectionId: string
  connectionName: string
}

export function SchemaExplorerDialog({
  open,
  onOpenChange,
  workspaceId,
  connectionId,
  connectionName,
}: SchemaExplorerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Schema Explorer</DialogTitle>
          <DialogDescription>
            Browse tables and columns from {connectionName}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <SchemaExplorer
            workspaceId={workspaceId}
            connectionId={connectionId}
            connectionName={connectionName}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
