'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { workspacesApi, type Workspace } from '@/lib/api/workspaces'
import { connectionsApi, type Connection } from '@/lib/api/connections'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Plus, Database } from 'lucide-react'

export default function WorkspaceDetailPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const workspaceId = params.id as string

  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [connections, setConnections] = useState<Connection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Fetch workspace and connections
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

      // Load connections
      const connectionsData = await connectionsApi.list(workspaceId)
      setConnections(connectionsData)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load workspace')
    } finally {
      setIsLoading(false)
    }
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

        {/* Tabs / Sections */}
        <div className="border-b border-border mb-6">
          <div className="flex space-x-6">
            <button className="pb-3 border-b-2 border-primary text-sm font-medium">
              Connections
            </button>
            <button className="pb-3 border-b-2 border-transparent text-sm font-medium text-muted-foreground hover:text-foreground">
              Dashboards
            </button>
            <button className="pb-3 border-b-2 border-transparent text-sm font-medium text-muted-foreground hover:text-foreground">
              Settings
            </button>
          </div>
        </div>

        {/* Connections Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Data Connections</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Connect to your data sources
              </p>
            </div>
            <Button onClick={() => {
              // TODO: Open create connection dialog
              alert('Create connection dialog will be implemented next')
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Connection
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading connections...</div>
            </div>
          )}

          {/* Empty State */}
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
                <Button onClick={() => {
                  alert('Create connection dialog will be implemented next')
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Connection
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Connections Grid */}
          {!isLoading && connections.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connections.map((connection) => (
                <Card key={connection.id} className="hover:bg-muted/50 transition-colors">
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
