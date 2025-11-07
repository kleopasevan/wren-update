'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { workspacesApi, type Workspace } from '@/lib/api/workspaces'
import { connectionsApi, type Connection } from '@/lib/api/connections'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CreateConnectionDialog } from '@/components/connections/CreateConnectionDialog'
import { EditConnectionDialog } from '@/components/connections/EditConnectionDialog'
import { DeleteConnectionDialog } from '@/components/connections/DeleteConnectionDialog'
import { SchemaExplorerDialog } from '@/components/connections/SchemaExplorerDialog'
import { AppLayout } from '@/components/layout/app-layout'
import { ArrowLeft, Plus, Database, MoreVertical, Pencil, Trash2, TestTube, ListTree } from 'lucide-react'

export default function ConnectionsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const workspaceId = params.id as string

  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [connections, setConnections] = useState<Connection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Connection dialog states
  const [createConnectionDialogOpen, setCreateConnectionDialogOpen] = useState(false)
  const [editConnectionDialogOpen, setEditConnectionDialogOpen] = useState(false)
  const [deleteConnectionDialogOpen, setDeleteConnectionDialogOpen] = useState(false)
  const [schemaExplorerDialogOpen, setSchemaExplorerDialogOpen] = useState(false)
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null)
  const [testingConnectionId, setTestingConnectionId] = useState<string | null>(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Fetch workspace and connections
  useEffect(() => {
    if (user && workspaceId) {
      loadData()
    }
  }, [user, workspaceId])

  async function loadData() {
    try {
      setIsLoading(true)
      setError('')

      // Load workspace details and connections
      const [workspaceData, connectionsData] = await Promise.all([
        workspacesApi.get(workspaceId),
        connectionsApi.list(workspaceId),
      ])

      setWorkspace(workspaceData)
      setConnections(connectionsData)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  async function loadConnections() {
    const connectionsData = await connectionsApi.list(workspaceId)
    setConnections(connectionsData)
  }

  // Connection handlers
  function handleEditConnection(connection: Connection, e: React.MouseEvent) {
    e.stopPropagation()
    setSelectedConnection(connection)
    setEditConnectionDialogOpen(true)
  }

  function handleDeleteConnection(connection: Connection, e: React.MouseEvent) {
    e.stopPropagation()
    setSelectedConnection(connection)
    setDeleteConnectionDialogOpen(true)
  }

  async function handleTestConnection(connection: Connection, e: React.MouseEvent) {
    e.stopPropagation()
    setTestingConnectionId(connection.id)

    try {
      const result = await connectionsApi.test(workspaceId, connection.id)

      if (result.status === 'success') {
        alert(`Connection test successful!\n\n${result.message}`)
      } else {
        alert(`Connection test failed!\n\n${result.message}`)
      }

      await loadConnections()
    } catch (err: any) {
      alert(`Connection test failed!\n\n${err.response?.data?.detail || 'Unknown error'}`)
    } finally {
      setTestingConnectionId(null)
    }
  }

  function handleViewSchema(connection: Connection, e: React.MouseEvent) {
    e.stopPropagation()
    setSelectedConnection(connection)
    setSchemaExplorerDialogOpen(true)
  }

  // Show loading while checking authentication
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // Show error if data failed to load
  if (error) {
    return (
      <AppLayout>
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
              {error}
            </div>
            <Button onClick={() => router.push('/workspaces')} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Workspaces
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex-1 overflow-auto p-8 bg-background">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/workspaces/${workspaceId}`)}
              className="mb-4 text-black"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Workspace
            </Button>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-black">
                  Data Connections
                </h1>
                <p className="text-muted-foreground mt-2">
                  Connect to your data sources in {workspace?.name}
                </p>
              </div>
              <Button onClick={() => setCreateConnectionDialogOpen(true)} className="bg-[#ff5001] hover:bg-[#ff5001]/90 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Add Connection
              </Button>
            </div>
          </div>

          {/* Content */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading connections...</div>
            </div>
          )}

          {!isLoading && connections.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <Database className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No connections yet</h3>
                <p className="text-sm text-muted-foreground text-center mb-4 max-w-sm">
                  Connect to your databases like PostgreSQL, MySQL, BigQuery, Snowflake, and more
                  to start analyzing your data.
                </p>
                <Button onClick={() => setCreateConnectionDialogOpen(true)} className="bg-[#ff5001] hover:bg-[#ff5001]/90 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Connection
                </Button>
              </CardContent>
            </Card>
          )}

          {!isLoading && connections.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connections.map((connection) => (
                <Card key={connection.id} className="hover:bg-muted/50 transition-colors relative group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{connection.name}</CardTitle>
                        {connection.description && (
                          <CardDescription className="mt-1">
                            {connection.description}
                          </CardDescription>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => handleTestConnection(connection, e as any)}
                            disabled={testingConnectionId === connection.id}
                          >
                            <TestTube className="mr-2 h-4 w-4" />
                            {testingConnectionId === connection.id ? 'Testing...' : 'Test Connection'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleViewSchema(connection, e as any)}>
                            <ListTree className="mr-2 h-4 w-4" />
                            View Schema
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleEditConnection(connection, e as any)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => handleDeleteConnection(connection, e as any)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="font-mono bg-muted px-2 py-1 rounded">
                          {connection.type}
                        </div>
                        <div
                          className={`px-2 py-1 rounded ${
                            connection.status === 'active'
                              ? 'bg-green-500/10 text-green-500'
                              : 'bg-yellow-500/10 text-yellow-500'
                          }`}
                        >
                          {connection.status}
                        </div>
                      </div>
                    </div>
                    {connection.last_tested_at && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Last tested: {new Date(connection.last_tested_at).toLocaleDateString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <CreateConnectionDialog
        open={createConnectionDialogOpen}
        onOpenChange={setCreateConnectionDialogOpen}
        workspaceId={workspaceId}
        onConnectionCreated={loadConnections}
      />

      {selectedConnection && (
        <>
          <EditConnectionDialog
            open={editConnectionDialogOpen}
            onOpenChange={setEditConnectionDialogOpen}
            workspaceId={workspaceId}
            connection={selectedConnection}
            onConnectionUpdated={loadConnections}
          />

          <DeleteConnectionDialog
            open={deleteConnectionDialogOpen}
            onOpenChange={setDeleteConnectionDialogOpen}
            workspaceId={workspaceId}
            connection={selectedConnection}
            onConnectionDeleted={loadConnections}
          />

          <SchemaExplorerDialog
            open={schemaExplorerDialogOpen}
            onOpenChange={setSchemaExplorerDialogOpen}
            workspaceId={workspaceId}
            connection={selectedConnection}
          />
        </>
      )}
    </AppLayout>
  )
}
