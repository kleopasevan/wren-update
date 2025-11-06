'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { workspacesApi, type Workspace } from '@/lib/api/workspaces'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function WorkspacesPage() {
  const { user, isLoading: authLoading, logout } = useAuth()
  const router = useRouter()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Fetch workspaces on mount
  useEffect(() => {
    if (user) {
      loadWorkspaces()
    }
  }, [user])

  async function loadWorkspaces() {
    try {
      setIsLoading(true)
      setError('')
      const data = await workspacesApi.list()
      setWorkspaces(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load workspaces')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleWorkspaceClick(workspaceId: string) {
    router.push(`/workspaces/${workspaceId}`)
  }

  // Show nothing while checking authentication
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Workspaces</h1>
            <p className="text-muted-foreground mt-2">
              Manage your data workspaces and analytics projects
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {user.email}
            </div>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
            <Button onClick={() => {
              // Create workspace dialog - will be implemented in Phase 1.2
              alert('Create workspace functionality will be added in Phase 1.2')
            }}>
              Create Workspace
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading workspaces...</div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && workspaces.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-3 mb-4">
                <svg
                  className="h-6 w-6 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">No workspaces yet</h3>
              <p className="text-sm text-muted-foreground text-center mb-4 max-w-sm">
                Get started by creating your first workspace. Workspaces help you organize
                your data connections, dashboards, and analytics projects.
              </p>
              <Button onClick={() => {
                alert('Create workspace functionality will be added in Phase 1.2')
              }}>
                Create Your First Workspace
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Workspaces Grid */}
        {!isLoading && workspaces.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((workspace) => (
              <Card
                key={workspace.id}
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => handleWorkspaceClick(workspace.id)}
              >
                <CardHeader>
                  <CardTitle>{workspace.name}</CardTitle>
                  {workspace.description && (
                    <CardDescription>{workspace.description}</CardDescription>
                  )}
                </CardHeader>
                <CardFooter className="text-xs text-muted-foreground">
                  Created {new Date(workspace.created_at).toLocaleDateString()}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
