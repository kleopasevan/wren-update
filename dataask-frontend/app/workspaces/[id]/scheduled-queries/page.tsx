'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { scheduledQueriesApi, ScheduledQuery } from '@/lib/api/scheduled-queries'
import { AppLayout } from '@/components/layout/app-layout'
import {
  Loader2,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Clock,
  Mail,
  CheckCircle,
  XCircle,
  Calendar,
  ArrowLeft,
} from 'lucide-react'

export default function ScheduledQueriesPage() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.id as string

  const [queries, setQueries] = useState<ScheduledQuery[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadQueries()
  }, [workspaceId])

  async function loadQueries() {
    try {
      setIsLoading(true)
      setError('')
      const data = await scheduledQueriesApi.list(workspaceId)
      setQueries(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load scheduled queries')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(queryId: string) {
    if (!confirm('Are you sure you want to delete this scheduled query?')) {
      return
    }

    try {
      await scheduledQueriesApi.delete(workspaceId, queryId)
      await loadQueries()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete scheduled query')
    }
  }

  async function handleToggleEnabled(query: ScheduledQuery) {
    try {
      await scheduledQueriesApi.update(workspaceId, query.id, {
        enabled: !query.enabled,
      })
      await loadQueries()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update scheduled query')
    }
  }

  function getScheduleDisplay(query: ScheduledQuery): string {
    if (query.schedule_type === 'cron') {
      return `Cron: ${query.cron_expression}`
    } else {
      return `Every ${query.interval_minutes} minutes`
    }
  }

  return (
    <AppLayout>
      <div className="flex-1 overflow-auto p-8 bg-background">
        <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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
            <h1 className="text-3xl font-bold">Scheduled Queries</h1>
            <p className="text-muted-foreground mt-1">
              Automate query execution and email reports
            </p>
          </div>
        </div>
        <Button onClick={() => router.push(`/workspaces/${workspaceId}/scheduled-queries/create`)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Schedule
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-destructive">{error}</p>
            <Button onClick={loadQueries} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : queries.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No scheduled queries yet</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md mx-auto">
              Schedule queries to run automatically and receive results via email on a regular basis.
            </p>
            <Button onClick={() => router.push(`/workspaces/${workspaceId}/scheduled-queries/create`)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Schedule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {queries.map((query) => (
            <Card key={query.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle>{query.name}</CardTitle>
                      <Badge variant={query.enabled ? 'default' : 'secondary'}>
                        {query.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      {query.last_run_status && (
                        <Badge variant={query.last_run_status === 'success' ? 'default' : 'destructive'}>
                          {query.last_run_status === 'success' ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {query.last_run_status}
                        </Badge>
                      )}
                    </div>
                    {query.description && (
                      <CardDescription>{query.description}</CardDescription>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleToggleEnabled(query)}>
                        {query.enabled ? 'Disable' : 'Enable'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/workspaces/${workspaceId}/scheduled-queries/${query.id}/edit`)
                        }
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(query.id)}
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
                <div className="grid gap-3 text-sm">
                  {/* Schedule */}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Schedule:</span>
                    <span className="text-muted-foreground">{getScheduleDisplay(query)}</span>
                  </div>

                  {/* Recipients */}
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Recipients:</span>
                    <span className="text-muted-foreground">{query.recipients.join(', ')}</span>
                  </div>

                  {/* Format */}
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Format:</span>
                    <span className="text-muted-foreground">{query.format.join(', ').toUpperCase()}</span>
                  </div>

                  {/* Next Run */}
                  {query.next_run_at && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Next run:</span>
                      <span className="text-muted-foreground">
                        {new Date(query.next_run_at).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Last Run */}
                  {query.last_run_at && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Last run:</span>
                      <span className="text-muted-foreground">
                        {new Date(query.last_run_at).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Error */}
                  {query.last_run_error && (
                    <div className="mt-2 p-3 bg-destructive/10 rounded text-xs text-destructive">
                      <span className="font-medium">Error:</span> {query.last_run_error}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
        </div>
      </div>
    </AppLayout>
  )
}
