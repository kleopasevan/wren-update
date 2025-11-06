'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { workspacesApi, type Workspace } from '@/lib/api/workspaces'
import { connectionsApi, type Connection } from '@/lib/api/connections'
import { dashboardsApi, type Dashboard } from '@/lib/api/dashboards'
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
import { CreateDashboardDialog } from '@/components/dashboards/CreateDashboardDialog'
import { EditDashboardDialog } from '@/components/dashboards/EditDashboardDialog'
import { DeleteDashboardDialog } from '@/components/dashboards/DeleteDashboardDialog'
import { ArrowLeft, Plus, Database, MoreVertical, Pencil, Trash2, TestTube, LayoutDashboard, ListTree, FolderOpen, History } from 'lucide-react'

type Tab = 'connections' | 'dashboards' | 'queries' | 'history' | 'settings'

export default function WorkspaceDetailPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const workspaceId = params.id as string

  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('connections')
  const [connections, setConnections] = useState<Connection[]>([])
  const [dashboards, setDashboards] = useState<Dashboard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Connection dialog states
  const [createConnectionDialogOpen, setCreateConnectionDialogOpen] = useState(false)
  const [editConnectionDialogOpen, setEditConnectionDialogOpen] = useState(false)
  const [deleteConnectionDialogOpen, setDeleteConnectionDialogOpen] = useState(false)
  const [schemaExplorerDialogOpen, setSchemaExplorerDialogOpen] = useState(false)
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null)
  const [testingConnectionId, setTestingConnectionId] = useState<string | null>(null)

  // Dashboard dialog states
  const [createDashboardDialogOpen, setCreateDashboardDialogOpen] = useState(false)
  const [editDashboardDialogOpen, setEditDashboardDialogOpen] = useState(false)
  const [deleteDashboardDialogOpen, setDeleteDashboardDialogOpen] = useState(false)
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Fetch workspace and data
  useEffect(() => {
    if (user && workspaceId) {
      loadWorkspaceData()
    }
  }, [user, workspaceId])

  async function loadWorkspaceData() {
    try {
      setIsLoading(true)
      setError('')

      // Load workspace details
      const workspaceData = await workspacesApi.get(workspaceId)
      setWorkspace(workspaceData)

      // Load connections and dashboards in parallel
      await Promise.all([loadConnections(), loadDashboards()])
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load workspace')
    } finally {
      setIsLoading(false)
    }
  }

  async function loadConnections() {
    const connectionsData = await connectionsApi.list(workspaceId)
    setConnections(connectionsData)
  }

  async function loadDashboards() {
    const dashboardsData = await dashboardsApi.list(workspaceId)
    setDashboards(dashboardsData)
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

  // Dashboard handlers
  function handleEditDashboard(dashboard: Dashboard, e: React.MouseEvent) {
    e.stopPropagation()
    setSelectedDashboard(dashboard)
    setEditDashboardDialogOpen(true)
  }

  function handleDeleteDashboard(dashboard: Dashboard, e: React.MouseEvent) {
    e.stopPropagation()
    setSelectedDashboard(dashboard)
    setDeleteDashboardDialogOpen(true)
  }

  function handleDashboardClick(dashboardId: string) {
    router.push(`/workspaces/${workspaceId}/dashboards/${dashboardId}`)
  }

  // Show loading while checking authentication
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // Show error if workspace failed to load
  if (error) {
    return (
      <div className="min-h-screen p-8">
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
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/workspaces')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Workspaces
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {workspace?.name || 'Loading...'}
              </h1>
              {workspace?.description && (
                <p className="text-muted-foreground mt-2">{workspace.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border mb-6">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('connections')}
              className={`pb-3 border-b-2 text-sm font-medium transition-colors ${
                activeTab === 'connections'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Connections
            </button>
            <button
              onClick={() => setActiveTab('dashboards')}
              className={`pb-3 border-b-2 text-sm font-medium transition-colors ${
                activeTab === 'dashboards'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Dashboards
            </button>
            <button
              onClick={() => setActiveTab('queries')}
              className={`pb-3 border-b-2 text-sm font-medium transition-colors ${
                activeTab === 'queries'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Saved Queries
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 border-b-2 text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Query History
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`pb-3 border-b-2 text-sm font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Settings
            </button>
          </div>
        </div>

        {/* Connections Tab */}
        {activeTab === 'connections' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">Data Connections</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect to your data sources
                </p>
              </div>
              <Button onClick={() => setCreateConnectionDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Connection
              </Button>
            </div>

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
                  <Button onClick={() => setCreateConnectionDialogOpen(true)}>
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
        )}

        {/* Dashboards Tab */}
        {activeTab === 'dashboards' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">Dashboards</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Create and manage your analytics dashboards
                </p>
              </div>
              <Button onClick={() => setCreateDashboardDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Dashboard
              </Button>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground">Loading dashboards...</div>
              </div>
            )}

            {!isLoading && dashboards.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-full bg-muted p-3 mb-4">
                    <LayoutDashboard className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No dashboards yet</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4 max-w-sm">
                    Create your first dashboard to visualize your data with charts, metrics, and tables.
                  </p>
                  <Button onClick={() => setCreateDashboardDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Dashboard
                  </Button>
                </CardContent>
              </Card>
            )}

            {!isLoading && dashboards.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboards.map((dashboard) => (
                  <Card
                    key={dashboard.id}
                    className="hover:bg-muted/50 transition-colors cursor-pointer relative group"
                    onClick={() => handleDashboardClick(dashboard.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{dashboard.name}</CardTitle>
                          {dashboard.description && (
                            <CardDescription className="mt-1">
                              {dashboard.description}
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
                            <DropdownMenuItem onClick={(e) => handleEditDashboard(dashboard, e as any)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => handleDeleteDashboard(dashboard, e as any)}
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
                      <div className="text-xs text-muted-foreground">
                        Created {new Date(dashboard.created_at).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Saved Queries Tab */}
        {activeTab === 'queries' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">Saved Queries</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage and reuse your saved queries
                </p>
              </div>
              <Button onClick={() => router.push(`/workspaces/${workspaceId}/saved-queries`)}>
                <FolderOpen className="mr-2 h-4 w-4" />
                View All Queries
              </Button>
            </div>

            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <FolderOpen className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Saved Queries Library</h3>
                <p className="text-sm text-muted-foreground text-center mb-4 max-w-sm">
                  Save queries from the Query Builder to reuse them later. Access your saved
                  queries from any dashboard or widget.
                </p>
                <Button onClick={() => router.push(`/workspaces/${workspaceId}/saved-queries`)}>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Browse Saved Queries
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Query History Tab */}
        {activeTab === 'history' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">Query Execution History</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  View all executed queries with performance metrics
                </p>
              </div>
              <Button onClick={() => router.push(`/workspaces/${workspaceId}/query-history`)}>
                <History className="mr-2 h-4 w-4" />
                View Full History
              </Button>
            </div>

            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <History className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Query Execution History</h3>
                <p className="text-sm text-muted-foreground text-center mb-4 max-w-sm">
                  All executed queries are automatically tracked with execution time, status,
                  and SQL details. Use this to debug issues or re-run queries.
                </p>
                <Button onClick={() => router.push(`/workspaces/${workspaceId}/query-history`)}>
                  <History className="mr-2 h-4 w-4" />
                  Browse Query History
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">Settings</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage workspace settings
                </p>
              </div>
            </div>
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Settings coming soon</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Connection Dialogs */}
      <CreateConnectionDialog
        open={createConnectionDialogOpen}
        onOpenChange={setCreateConnectionDialogOpen}
        workspaceId={workspaceId}
        onSuccess={loadConnections}
      />

      <EditConnectionDialog
        open={editConnectionDialogOpen}
        onOpenChange={setEditConnectionDialogOpen}
        workspaceId={workspaceId}
        connection={selectedConnection}
        onSuccess={loadConnections}
      />

      <DeleteConnectionDialog
        open={deleteConnectionDialogOpen}
        onOpenChange={setDeleteConnectionDialogOpen}
        workspaceId={workspaceId}
        connection={selectedConnection}
        onSuccess={loadConnections}
      />

      {selectedConnection && (
        <SchemaExplorerDialog
          open={schemaExplorerDialogOpen}
          onOpenChange={setSchemaExplorerDialogOpen}
          workspaceId={workspaceId}
          connectionId={selectedConnection.id}
          connectionName={selectedConnection.name}
        />
      )}

      {/* Dashboard Dialogs */}
      <CreateDashboardDialog
        open={createDashboardDialogOpen}
        onOpenChange={setCreateDashboardDialogOpen}
        workspaceId={workspaceId}
        onSuccess={loadDashboards}
      />

      <EditDashboardDialog
        open={editDashboardDialogOpen}
        onOpenChange={setEditDashboardDialogOpen}
        workspaceId={workspaceId}
        dashboard={selectedDashboard}
        onSuccess={loadDashboards}
      />

      <DeleteDashboardDialog
        open={deleteDashboardDialogOpen}
        onOpenChange={setDeleteDashboardDialogOpen}
        workspaceId={workspaceId}
        dashboard={selectedDashboard}
        onSuccess={loadDashboards}
      />
    </div>
  )
}
