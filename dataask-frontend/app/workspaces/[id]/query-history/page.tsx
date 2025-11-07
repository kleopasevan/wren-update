'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { queryHistoryApi, QueryHistory } from '@/lib/api/query-history'
import { connectionsApi, Connection } from '@/lib/api/connections'
import { AppLayout } from '@/components/layout/app-layout'
import {
  Loader2,
  Search,
  Calendar,
  Database,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  Code,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

export default function QueryHistoryPage() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.id as string

  const [history, setHistory] = useState<QueryHistory[]>([])
  const [filteredHistory, setFilteredHistory] = useState<QueryHistory[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadData()
  }, [workspaceId])

  useEffect(() => {
    // Filter history
    let filtered = history

    // Search by SQL
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter((h) => h.sql.toLowerCase().includes(term))
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((h) => h.status === statusFilter)
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter((h) => h.query_type === typeFilter)
    }

    setFilteredHistory(filtered)
  }, [searchTerm, statusFilter, typeFilter, history])

  async function loadData() {
    try {
      setIsLoading(true)
      setError('')

      const [historyData, connectionsData] = await Promise.all([
        queryHistoryApi.list(workspaceId, { limit: 100, offset: 0 }),
        connectionsApi.list(workspaceId),
      ])

      setHistory(historyData)
      setFilteredHistory(historyData)
      setConnections(connectionsData)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load query history')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(historyId: string) {
    if (!confirm('Are you sure you want to delete this query history entry?')) {
      return
    }

    try {
      await queryHistoryApi.delete(workspaceId, historyId)
      await loadData()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete query history')
    }
  }

  function getConnectionName(connectionId: string): string {
    const connection = connections.find((c) => c.id === connectionId)
    return connection?.name || 'Unknown'
  }

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  function formatExecutionTime(ms?: number): string {
    if (!ms) return 'N/A'
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(2)}s`
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
                  Query Execution History
                </h1>
                <p className="text-muted-foreground mt-2">
                  View all executed queries with details and performance metrics
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search SQL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="visual">Visual Builder</SelectItem>
                <SelectItem value="sql">Raw SQL</SelectItem>
                <SelectItem value="ai">AI Generated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-destructive">{error}</p>
            <Button onClick={loadData} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : filteredHistory.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'No query history matches your filters'
                : 'No query history yet. Execute some queries to see them here.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item) => {
            const isExpanded = expandedIds.has(item.id)

            return (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {/* Status Badge */}
                        <Badge
                          variant={item.status === 'success' ? 'default' : 'destructive'}
                        >
                          {item.status === 'success' ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {item.status}
                        </Badge>

                        {/* Query Type Badge */}
                        <Badge variant="outline">
                          <Code className="h-3 w-3 mr-1" />
                          {item.query_type}
                        </Badge>
                      </div>

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(item.executed_at).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Database className="h-4 w-4" />
                          {getConnectionName(item.connection_id)}
                        </div>
                        {item.execution_time_ms && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatExecutionTime(item.execution_time_ms)}
                          </div>
                        )}
                        {item.row_count !== null && item.row_count !== undefined && (
                          <div className="text-sm">
                            Rows: <span className="font-medium">{item.row_count}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(item.id)}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-1" />
                            Hide SQL
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1" />
                            Show SQL
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent>
                    {/* SQL Query */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">SQL Query:</h4>
                      <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                        <code>{item.sql}</code>
                      </pre>
                    </div>

                    {/* Error Message */}
                    {item.error_message && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2 text-destructive">
                          Error Message:
                        </h4>
                        <pre className="bg-destructive/10 p-3 rounded text-xs overflow-x-auto text-destructive">
                          <code>{item.error_message}</code>
                        </pre>
                      </div>
                    )}

                    {/* Query Definition (if visual) */}
                    {item.query_definition && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">
                          Query Definition (Visual Builder):
                        </h4>
                        <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                          <code>{JSON.stringify(item.query_definition, null, 2)}</code>
                        </pre>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
        </div>
      </div>
    </AppLayout>
  )
}
