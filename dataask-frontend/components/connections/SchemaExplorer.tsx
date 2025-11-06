'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Database, Table as TableIcon, ChevronDown, ChevronRight, Eye } from 'lucide-react'
import { connectionsApi, Table, TableColumn } from '@/lib/api/connections'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface SchemaExplorerProps {
  workspaceId: string
  connectionId: string
  connectionName: string
}

export function SchemaExplorer({ workspaceId, connectionId, connectionName }: SchemaExplorerProps) {
  const [tables, setTables] = useState<Table[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)
  const [previewTableName, setPreviewTableName] = useState('')
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)

  useEffect(() => {
    loadTables()
  }, [workspaceId, connectionId])

  async function loadTables() {
    try {
      setIsLoading(true)
      setError('')
      const tablesData = await connectionsApi.getTables(workspaceId, connectionId)
      setTables(tablesData)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load tables')
    } finally {
      setIsLoading(false)
    }
  }

  function toggleTable(tableName: string) {
    const newExpanded = new Set(expandedTables)
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName)
    } else {
      newExpanded.add(tableName)
    }
    setExpandedTables(newExpanded)
  }

  async function handlePreview(tableName: string) {
    setPreviewTableName(tableName)
    setPreviewDialogOpen(true)
    setIsLoadingPreview(true)
    setPreviewData(null)

    try {
      const data = await connectionsApi.previewTable(workspaceId, connectionId, tableName, 10)
      setPreviewData(data)
    } catch (err: any) {
      setPreviewData({ error: err.response?.data?.detail || 'Failed to preview table' })
    } finally {
      setIsLoadingPreview(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={loadTables}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Schema Explorer
              </CardTitle>
              <CardDescription>
                {connectionName} - {tables.length} tables found
              </CardDescription>
            </div>
            <Button onClick={loadTables} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tables.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No tables found in this connection</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {tables.map((table) => {
                const isExpanded = expandedTables.has(table.name)
                return (
                  <div key={table.name} className="border rounded-lg">
                    <div className="flex items-center justify-between p-3 hover:bg-muted/50">
                      <button
                        onClick={() => toggleTable(table.name)}
                        className="flex items-center flex-1 text-left"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 mr-2" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mr-2" />
                        )}
                        <TableIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="font-medium">{table.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({table.columns.length} columns)
                        </span>
                      </button>
                      <Button
                        onClick={() => handlePreview(table.name)}
                        variant="ghost"
                        size="sm"
                        className="ml-2"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                    </div>
                    {isExpanded && (
                      <div className="border-t px-3 py-2 bg-muted/20">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs text-muted-foreground">
                              <th className="pb-2 pr-4">Column</th>
                              <th className="pb-2 pr-4">Type</th>
                              <th className="pb-2">Nullable</th>
                            </tr>
                          </thead>
                          <tbody>
                            {table.columns.map((column) => (
                              <tr key={column.name} className="border-t border-border">
                                <td className="py-1 pr-4 font-mono text-xs">{column.name}</td>
                                <td className="py-1 pr-4 text-muted-foreground">{column.type}</td>
                                <td className="py-1">
                                  {column.notNull ? (
                                    <span className="text-destructive">No</span>
                                  ) : (
                                    <span className="text-green-500">Yes</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Table Preview: {previewTableName}</DialogTitle>
            <DialogDescription>Showing first 10 rows</DialogDescription>
          </DialogHeader>
          {isLoadingPreview ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : previewData?.error ? (
            <div className="text-destructive py-4">{previewData.error}</div>
          ) : previewData ? (
            <div className="overflow-x-auto">
              <pre className="text-xs bg-muted p-4 rounded">
                {JSON.stringify(previewData, null, 2)}
              </pre>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
