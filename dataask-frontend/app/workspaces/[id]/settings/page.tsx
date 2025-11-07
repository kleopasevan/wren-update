'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { workspacesApi, type Workspace } from '@/lib/api/workspaces'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AppLayout } from '@/components/layout/app-layout'
import { ArrowLeft } from 'lucide-react'

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const workspaceId = params.id as string

  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Fetch workspace
  useEffect(() => {
    if (user && workspaceId) {
      loadWorkspace()
    }
  }, [user, workspaceId])

  async function loadWorkspace() {
    try {
      setIsLoading(true)
      setError('')

      const workspaceData = await workspacesApi.get(workspaceId)
      setWorkspace(workspaceData)
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
                  Settings
                </h1>
                <p className="text-muted-foreground mt-2">
                  Manage workspace settings for {workspace?.name}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Settings coming soon</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
