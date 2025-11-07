'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { workspacesApi, type Workspace } from '@/lib/api/workspaces'
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
import { CreateDashboardDialog } from '@/components/dashboards/CreateDashboardDialog'
import { EditDashboardDialog } from '@/components/dashboards/EditDashboardDialog'
import { DeleteDashboardDialog } from '@/components/dashboards/DeleteDashboardDialog'
import { AppLayout } from '@/components/layout/app-layout'
import { ArrowLeft, Plus, LayoutDashboard, MoreVertical, Pencil, Trash2 } from 'lucide-react'

export default function DashboardsListPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const workspaceId = params.id as string

  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [dashboards, setDashboards] = useState<Dashboard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

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

  // Fetch workspace and dashboards
  useEffect(() => {
    if (user && workspaceId) {
      loadData()
    }
  }, [user, workspaceId])

  async function loadData() {
    try {
      setIsLoading(true)
      setError('')

      // Load workspace details and dashboards
      const [workspaceData, dashboardsData] = await Promise.all([
        workspacesApi.get(workspaceId),
        dashboardsApi.list(workspaceId),
      ])

      setWorkspace(workspaceData)
      setDashboards(dashboardsData)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  async function loadDashboards() {
    const dashboardsData = await dashboardsApi.list(workspaceId)
    setDashboards(dashboardsData)
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
                  Dashboards
                </h1>
                <p className="text-muted-foreground mt-2">
                  Create and manage your analytics dashboards in {workspace?.name}
                </p>
              </div>
              <Button onClick={() => setCreateDashboardDialogOpen(true)} className="bg-[#ff5001] hover:bg-[#ff5001]/90 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Create Dashboard
              </Button>
            </div>
          </div>

          {/* Content */}
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
                <Button onClick={() => setCreateDashboardDialogOpen(true)} className="bg-[#ff5001] hover:bg-[#ff5001]/90 text-white">
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
      </div>

      {/* Dialogs */}
      <CreateDashboardDialog
        open={createDashboardDialogOpen}
        onOpenChange={setCreateDashboardDialogOpen}
        workspaceId={workspaceId}
        onDashboardCreated={loadDashboards}
      />

      {selectedDashboard && (
        <>
          <EditDashboardDialog
            open={editDashboardDialogOpen}
            onOpenChange={setEditDashboardDialogOpen}
            workspaceId={workspaceId}
            dashboard={selectedDashboard}
            onDashboardUpdated={loadDashboards}
          />

          <DeleteDashboardDialog
            open={deleteDashboardDialogOpen}
            onOpenChange={setDeleteDashboardDialogOpen}
            workspaceId={workspaceId}
            dashboard={selectedDashboard}
            onDashboardDeleted={loadDashboards}
          />
        </>
      )}
    </AppLayout>
  )
}
