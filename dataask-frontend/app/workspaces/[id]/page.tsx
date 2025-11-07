'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { workspacesApi, type Workspace } from '@/lib/api/workspaces'
import { connectionsApi } from '@/lib/api/connections'
import { dashboardsApi } from '@/lib/api/dashboards'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AppLayout } from '@/components/layout/app-layout'
import {
  ArrowLeft,
  Database,
  LayoutDashboard,
  FileText,
  History,
  Calendar,
  Settings,
  ArrowRight,
} from 'lucide-react'

export default function WorkspaceOverviewPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const workspaceId = params.id as string

  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [stats, setStats] = useState({ connections: 0, dashboards: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Fetch workspace and stats
  useEffect(() => {
    if (user && workspaceId) {
      loadData()
    }
  }, [user, workspaceId])

  async function loadData() {
    try {
      setIsLoading(true)
      setError('')

      // Load workspace details
      const workspaceData = await workspacesApi.get(workspaceId)
      setWorkspace(workspaceData)

      // Load stats in parallel
      const [connectionsData, dashboardsData] = await Promise.all([
        connectionsApi.list(workspaceId),
        dashboardsApi.list(workspaceId),
      ])

      setStats({
        connections: connectionsData.length,
        dashboards: dashboardsData.length,
      })
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

  const quickLinks = [
    {
      icon: Database,
      title: 'Connections',
      description: 'Manage your data source connections',
      href: `/workspaces/${workspaceId}/connections`,
      count: stats.connections,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: LayoutDashboard,
      title: 'Dashboards',
      description: 'View and create analytics dashboards',
      href: `/workspaces/${workspaceId}/dashboards`,
      count: stats.dashboards,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: FileText,
      title: 'Saved Queries',
      description: 'Access your saved SQL queries',
      href: `/workspaces/${workspaceId}/saved-queries`,
      count: null,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: History,
      title: 'Query History',
      description: 'View execution history and performance',
      href: `/workspaces/${workspaceId}/query-history`,
      count: null,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      icon: Calendar,
      title: 'Scheduled Queries',
      description: 'Manage automated query execution',
      href: `/workspaces/${workspaceId}/scheduled-queries`,
      count: null,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      icon: Settings,
      title: 'Settings',
      description: 'Configure workspace settings',
      href: `/workspaces/${workspaceId}/settings`,
      count: null,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
  ]

  return (
    <AppLayout>
      <div className="flex-1 overflow-auto p-8 bg-background">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/workspaces')}
              className="mb-4 text-black"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Workspaces
            </Button>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-black">
                  {workspace?.name || 'Loading...'}
                </h1>
                {workspace?.description && (
                  <p className="text-muted-foreground mt-2">{workspace.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          {!isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Connections</CardDescription>
                  <CardTitle className="text-3xl">{stats.connections}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Dashboards</CardDescription>
                  <CardTitle className="text-3xl">{stats.dashboards}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Workspace Status</CardDescription>
                  <CardTitle className="text-lg">Active</CardTitle>
                </CardHeader>
              </Card>
            </div>
          )}

          {/* Quick Links */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Card
                    key={link.href}
                    className="hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => router.push(link.href)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className={`rounded-lg ${link.bgColor} p-3 mb-4`}>
                          <Icon className={`h-6 w-6 ${link.color}`} />
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <CardTitle className="text-lg">{link.title}</CardTitle>
                      <CardDescription>{link.description}</CardDescription>
                      {link.count !== null && (
                        <div className="mt-2">
                          <span className="text-2xl font-bold text-black">{link.count}</span>
                          <span className="text-sm text-muted-foreground ml-2">items</span>
                        </div>
                      )}
                    </CardHeader>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Welcome Message */}
          {!isLoading && stats.connections === 0 && (
            <Card className="mt-8 border-[#ff5001]">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-2">Welcome to DataAsk! 👋</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by connecting your first data source. Once connected, you can create
                  dashboards, save queries, and explore your data with AI-powered insights.
                </p>
                <Button
                  onClick={() => router.push(`/workspaces/${workspaceId}/connections`)}
                  className="bg-[#ff5001] hover:bg-[#ff5001]/90 text-white"
                >
                  <Database className="mr-2 h-4 w-4" />
                  Connect Your First Data Source
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
