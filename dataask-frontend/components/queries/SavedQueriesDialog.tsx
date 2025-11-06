'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { savedQueriesApi, SavedQuery } from '@/lib/api/saved-queries'
import { QueryDefinition } from '@/lib/api/queries'
import { Loader2, Search, Calendar, Tag, Trash2 } from 'lucide-react'

interface SavedQueriesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  onSelect: (query: QueryDefinition, connectionId: string) => void
}

export function SavedQueriesDialog({
  open,
  onOpenChange,
  workspaceId,
  onSelect,
}: SavedQueriesDialogProps) {
  const [queries, setQueries] = useState<SavedQuery[]>([])
  const [filteredQueries, setFilteredQueries] = useState<SavedQuery[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      loadQueries()
    }
  }, [open, workspaceId])

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

  async function loadQueries() {
    try {
      setIsLoading(true)
      setError('')
      const data = await savedQueriesApi.list(workspaceId)
      setQueries(data)
      setFilteredQueries(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load saved queries')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(queryId: string) {
    if (!confirm('Are you sure you want to delete this saved query?')) {
      return
    }

    try {
      await savedQueriesApi.delete(workspaceId, queryId)
      await loadQueries()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete query')
    }
  }

  function handleSelect(savedQuery: SavedQuery) {
    onSelect(savedQuery.query, savedQuery.connection_id)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Saved Queries</DialogTitle>
          <DialogDescription>
            Load a previously saved query to reuse it
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, description, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">{error}</div>
          ) : filteredQueries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>
                {searchTerm
                  ? 'No saved queries match your search'
                  : 'No saved queries yet'}
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredQueries.map((query) => (
                <Card
                  key={query.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSelect(query)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          {query.name}
                        </CardTitle>
                        {query.description && (
                          <CardDescription className="mt-1">
                            {query.description}
                          </CardDescription>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(query.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(query.created_at).toLocaleDateString()}
                      </div>
                      {query.tags && query.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {query.tags.join(', ')}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
