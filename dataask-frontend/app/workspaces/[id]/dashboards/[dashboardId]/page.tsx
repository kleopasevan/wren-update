'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dashboard, dashboardsApi } from '@/lib/api/dashboards'
import { Widget as WidgetType, widgetsApi } from '@/lib/api/widgets'
import { Widget } from '@/components/widgets/Widget'
import { CreateWidgetDialog } from '@/components/widgets/CreateWidgetDialog'
import { EditWidgetDialog } from '@/components/widgets/EditWidgetDialog'
import { DeleteWidgetDialog } from '@/components/widgets/DeleteWidgetDialog'
import { ConfigureWidgetDataDialog } from '@/components/widgets/ConfigureWidgetDataDialog'
import { EditDashboardDialog } from '@/components/dashboards/EditDashboardDialog'
import { DeleteDashboardDialog } from '@/components/dashboards/DeleteDashboardDialog'
import { RefreshControls, RefreshInterval } from '@/components/dashboards/RefreshControls'
import { QueryDefinition } from '@/lib/api/queries'
import {
  ArrowLeft,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  LayoutDashboard,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function DashboardDetailPage() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.id as string
  const dashboardId = params.dashboardId as string

  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [widgets, setWidgets] = useState<WidgetType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Refresh state
  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>(0)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Widget dialog states
  const [createWidgetDialogOpen, setCreateWidgetDialogOpen] = useState(false)
  const [editWidgetDialogOpen, setEditWidgetDialogOpen] = useState(false)
  const [deleteWidgetDialogOpen, setDeleteWidgetDialogOpen] = useState(false)
  const [configureDataDialogOpen, setConfigureDataDialogOpen] = useState(false)
  const [selectedWidget, setSelectedWidget] = useState<WidgetType | null>(null)

  // Dashboard dialog states
  const [editDashboardDialogOpen, setEditDashboardDialogOpen] = useState(false)
  const [deleteDashboardDialogOpen, setDeleteDashboardDialogOpen] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [workspaceId, dashboardId])

  async function loadDashboardData() {
    try {
      setIsLoading(true)
      setError('')
      const [dashboardData, widgetsData] = await Promise.all([
        dashboardsApi.get(workspaceId, dashboardId),
        widgetsApi.list(workspaceId, dashboardId),
      ])
      setDashboard(dashboardData)
      setWidgets(widgetsData)

      // Load refresh interval from dashboard settings
      if (dashboardData.settings?.refreshInterval !== undefined) {
        setRefreshInterval(dashboardData.settings.refreshInterval as RefreshInterval)
      }

      setLastUpdated(new Date())
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRefresh() {
    if (isRefreshing) return

    setIsRefreshing(true)
    try {
      // Trigger widget refresh by updating the refresh key
      setRefreshKey((prev) => prev + 1)
      setLastUpdated(new Date())

      // Wait a bit for widgets to refresh
      await new Promise((resolve) => setTimeout(resolve, 500))
    } catch (err: any) {
      console.error('Refresh failed:', err)
    } finally {
      setIsRefreshing(false)
    }
  }

  async function handleRefreshIntervalChange(interval: RefreshInterval) {
    setRefreshInterval(interval)

    if (!dashboard) return

    try {
      // Save refresh interval to dashboard settings
      await dashboardsApi.update(workspaceId, dashboardId, {
        settings: {
          ...dashboard.settings,
          refreshInterval: interval,
        },
      })
    } catch (err: any) {
      console.error('Failed to save refresh interval:', err)
    }
  }

  function handleEditWidget(widget: WidgetType) {
    setSelectedWidget(widget)
    setEditWidgetDialogOpen(true)
  }

  function handleDeleteWidget(widget: WidgetType) {
    setSelectedWidget(widget)
    setDeleteWidgetDialogOpen(true)
  }

  function handleConfigureData(widget: WidgetType) {
    setSelectedWidget(widget)
    setConfigureDataDialogOpen(true)
  }

  async function handleSaveWidgetData(connectionId: string, query: QueryDefinition) {
    if (!selectedWidget) return

    try {
      // Update widget config with connection and query
      await widgetsApi.update(workspaceId, dashboardId, selectedWidget.id, {
        config: {
          ...selectedWidget.config,
          connectionId,
          query,
        },
      })
      await loadDashboardData()
    } catch (err: any) {
      console.error('Failed to save widget data:', err)
    }
  }

  function handleEditDashboard() {
    setEditDashboardDialogOpen(true)
  }

  function handleDeleteDashboard() {
    setDeleteDashboardDialogOpen(true)
  }

  function handleDashboardDeleted() {
    router.push(`/workspaces/${workspaceId}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push(`/workspaces/${workspaceId}`)}>
              Back to Workspace
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Dashboard not found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push(`/workspaces/${workspaceId}`)}>
              Back to Workspace
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/workspaces/${workspaceId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{dashboard.name}</h1>
            {dashboard.description && (
              <p className="text-muted-foreground mt-1">{dashboard.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setCreateWidgetDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Widget
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <LayoutDashboard className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEditDashboard}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Dashboard
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDeleteDashboard}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Dashboard
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Refresh Controls */}
      {widgets.length > 0 && (
        <div className="flex justify-end mb-4">
          <RefreshControls
            onRefresh={handleRefresh}
            refreshInterval={refreshInterval}
            onRefreshIntervalChange={handleRefreshIntervalChange}
            lastUpdated={lastUpdated}
            isRefreshing={isRefreshing}
          />
        </div>
      )}

      {/* Widgets */}
      {widgets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LayoutDashboard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No widgets yet</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Start building your dashboard by adding widgets. Choose from charts, metrics,
              tables, and more.
            </p>
            <Button onClick={() => setCreateWidgetDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Widget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {widgets.map((widget) => (
            <Widget
              key={`${widget.id}-${refreshKey}`}
              widget={widget}
              workspaceId={workspaceId}
              onEdit={handleEditWidget}
              onDelete={handleDeleteWidget}
              onConfigureData={handleConfigureData}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateWidgetDialog
        open={createWidgetDialogOpen}
        onOpenChange={setCreateWidgetDialogOpen}
        workspaceId={workspaceId}
        dashboardId={dashboardId}
        onSuccess={loadDashboardData}
      />
      <EditWidgetDialog
        open={editWidgetDialogOpen}
        onOpenChange={setEditWidgetDialogOpen}
        widget={selectedWidget}
        workspaceId={workspaceId}
        dashboardId={dashboardId}
        onSuccess={loadDashboardData}
      />
      <DeleteWidgetDialog
        open={deleteWidgetDialogOpen}
        onOpenChange={setDeleteWidgetDialogOpen}
        widget={selectedWidget}
        workspaceId={workspaceId}
        dashboardId={dashboardId}
        onSuccess={loadDashboardData}
      />
      <EditDashboardDialog
        open={editDashboardDialogOpen}
        onOpenChange={setEditDashboardDialogOpen}
        dashboard={dashboard}
        workspaceId={workspaceId}
        onSuccess={loadDashboardData}
      />
      <DeleteDashboardDialog
        open={deleteDashboardDialogOpen}
        onOpenChange={setDeleteDashboardDialogOpen}
        dashboard={dashboard}
        workspaceId={workspaceId}
        onSuccess={handleDashboardDeleted}
      />
      <ConfigureWidgetDataDialog
        open={configureDataDialogOpen}
        onOpenChange={setConfigureDataDialogOpen}
        workspaceId={workspaceId}
        onSave={handleSaveWidgetData}
      />
    </div>
  )
}
