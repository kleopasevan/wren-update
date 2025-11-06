'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { savedQueriesApi, SavedQuery } from '@/lib/api/saved-queries'
import { connectionsApi, Connection } from '@/lib/api/connections'
import {
  ArrowLeft,
  Loader2,
  Search,
  Calendar,
  Tag,
  Trash2,
  Database,
  FolderOpen,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function SavedQueriesPage() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.id as string

  const [queries, setQueries] = useState<SavedQuery[]>([])
  const [filteredQueries, setFilteredQueries] = useState<SavedQuery[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [queryToDelete, setQueryToDelete] = useState<SavedQuery | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadData()
  }, [workspaceId])

  useEffect(() => {
    // Filter queries by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      setFilteredQueries(
        queries.filter(
          (q) =>
            q.name.toLowerCase().includes(term) ||
            q.description?.toLowerCase().includes(term) ||
            q.tags?.some((tag) => tag.toLowerCase().includes(term))
        )
      )
    } else {
      setFilteredQueries(queries)
    }
  }, [searchTerm, queries])

  async function loadData() {
    try {
      setIsLoading(true)
      setError('')
      const [queriesData, connectionsData] = await Promise.all([
        savedQueriesApi.list(workspaceId),
        connectionsApi.list(workspaceId),
      ])
      setQueries(queriesData)
      setFilteredQueries(queriesData)
      setConnections(connectionsData)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  function getConnectionName(connectionId: string): string {
    const connection = connections.find((c) => c.id === connectionId)
    return connection?.name || 'Unknown'
  }

  function handleDeleteClick(query: SavedQuery) {
    setQueryToDelete(query)
    setDeleteDialogOpen(true)
  }

  async function handleConfirmDelete() {
    if (!queryToDelete) return

    setIsDeleting(true)
    try {
      await savedQueriesApi.delete(workspaceId, queryToDelete.id)
      await loadData()
      setDeleteDialogOpen(false)
      setQueryToDelete(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete query')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error && queries.length === 0) {
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

  return (
    <div className="container mx-auto p-6">
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
            <h1 className="text-3xl font-bold">Saved Queries</h1>
            <p className="text-muted-foreground mt-1">
              Manage and organize your saved queries
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, description, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Queries List */}
      {filteredQueries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'No queries match your search' : 'No saved queries yet'}
            </h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              {searchTerm
                ? 'Try adjusting your search term'
                : 'Save queries from the Query Builder to access them later'}
            </p>
            {!searchTerm && (
              <Button onClick={() => router.push(`/workspaces/${workspaceId}`)}>
                Go to Workspace
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredQueries.map((query) => (
            <Card key={query.id} className="hover:bg-muted/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{query.name}</CardTitle>
                    {query.description && (
                      <CardDescription className="mt-2">
                        {query.description}
                      </CardDescription>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteClick(query)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Database className="h-4 w-4" />
                    {getConnectionName(query.connection_id)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(query.created_at).toLocaleDateString()}
                  </div>
                  {query.tags && query.tags.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Tag className="h-4 w-4" />
                      {query.tags.join(', ')}
                    </div>
                  )}
                </div>

                {/* Query Details */}
                <div className="mt-4 p-3 bg-muted rounded text-xs">
                  <div className="font-medium mb-1">Query Definition:</div>
                  <div className="text-muted-foreground">
                    Table: {query.query.table || 'N/A'}
                    {query.query.columns && query.query.columns.length > 0 && (
                      <> • Columns: {query.query.columns.length}</>
                    )}
                    {query.query.joins && query.query.joins.length > 0 && (
                      <> • Joins: {query.query.joins.length}</>
                    )}
                    {query.query.filters && query.query.filters.length > 0 && (
                      <> • Filters: {query.query.filters.length}</>
                    )}
                    {query.query.limit && <> • Limit: {query.query.limit}</>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Saved Query</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{queryToDelete?.name}"? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
