'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Play, Plus, Trash2, Code, Sparkles, Blocks, Save, FolderOpen } from 'lucide-react'
import { connectionsApi, Table } from '@/lib/api/connections'
import { queriesApi, QueryDefinition, QueryFilter, QueryOrderBy, QueryJoin } from '@/lib/api/queries'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AskAI } from '@/components/ai/AskAI'
import { JoinBuilder } from '@/components/queries/JoinBuilder'
import { SavedQueriesDialog } from '@/components/queries/SavedQueriesDialog'
import { SaveQueryDialog } from '@/components/queries/SaveQueryDialog'

type QueryMode = 'visual' | 'ai'

interface QueryBuilderProps {
  workspaceId: string
  connectionId: string
  onSave?: (query: QueryDefinition) => void
}

export function QueryBuilder({ workspaceId, connectionId, onSave }: QueryBuilderProps) {
  const [mode, setMode] = useState<QueryMode>('visual')
  const [tables, setTables] = useState<Table[]>([])
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [joins, setJoins] = useState<QueryJoin[]>([])
  const [filters, setFilters] = useState<QueryFilter[]>([])
  const [orderBy, setOrderBy] = useState<QueryOrderBy[]>([])
  const [limit, setLimit] = useState<number>(100)

  const [isLoadingTables, setIsLoadingTables] = useState(true)
  const [isExecuting, setIsExecuting] = useState(false)
  const [error, setError] = useState('')

  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)
  const [previewSql, setPreviewSql] = useState('')

  // AI mode state
  const [aiGeneratedSql, setAiGeneratedSql] = useState<string>('')
  const [aiQuestion, setAiQuestion] = useState<string>('')

  // Saved queries dialog state
  const [savedQueriesDialogOpen, setSavedQueriesDialogOpen] = useState(false)
  const [saveQueryDialogOpen, setSaveQueryDialogOpen] = useState(false)

  useEffect(() => {
    loadTables()
  }, [workspaceId, connectionId])

  async function loadTables() {
    try {
      setIsLoadingTables(true)
      setError('')
      const tablesData = await connectionsApi.getTables(workspaceId, connectionId)
      setTables(tablesData)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load tables')
    } finally {
      setIsLoadingTables(false)
    }
  }

  function handleTableSelect(tableName: string) {
    const table = tables.find((t) => t.name === tableName)
    setSelectedTable(table || null)
    setSelectedColumns([])
    setJoins([])
    setFilters([])
    setOrderBy([])
  }

  function toggleColumn(columnName: string) {
    if (selectedColumns.includes(columnName)) {
      setSelectedColumns(selectedColumns.filter((c) => c !== columnName))
    } else {
      setSelectedColumns([...selectedColumns, columnName])
    }
  }

  function addFilter() {
    if (!selectedTable || selectedTable.columns.length === 0) return
    setFilters([
      ...filters,
      {
        column: selectedTable.columns[0].name,
        operator: '=',
        value: '',
      },
    ])
  }

  function removeFilter(index: number) {
    setFilters(filters.filter((_, i) => i !== index))
  }

  function updateFilter(index: number, updates: Partial<QueryFilter>) {
    const newFilters = [...filters]
    newFilters[index] = { ...newFilters[index], ...updates }
    setFilters(newFilters)
  }

  function addOrderBy() {
    if (!selectedTable || selectedTable.columns.length === 0) return
    setOrderBy([
      ...orderBy,
      {
        column: selectedTable.columns[0].name,
        direction: 'ASC',
      },
    ])
  }

  function removeOrderBy(index: number) {
    setOrderBy(orderBy.filter((_, i) => i !== index))
  }

  function updateOrderBy(index: number, updates: Partial<QueryOrderBy>) {
    const newOrderBy = [...orderBy]
    newOrderBy[index] = { ...newOrderBy[index], ...updates }
    setOrderBy(newOrderBy)
  }

  async function handleExecute() {
    if (!selectedTable) return

    setIsExecuting(true)
    setError('')

    try {
      const query: QueryDefinition = {
        table: selectedTable.name,
        joins: joins.length > 0 ? joins : undefined,
        columns: selectedColumns.length > 0 ? selectedColumns : undefined,
        filters: filters.length > 0 ? filters : undefined,
        order_by: orderBy.length > 0 ? orderBy : undefined,
        limit,
      }

      const result = await queriesApi.execute(workspaceId, connectionId, { query })

      setPreviewSql(result.sql)
      setPreviewData(result.data)
      setPreviewDialogOpen(true)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to execute query')
    } finally {
      setIsExecuting(false)
    }
  }

  function handleSave() {
    if (!selectedTable || !onSave) return

    const query: QueryDefinition = {
      table: selectedTable.name,
      joins: joins.length > 0 ? joins : undefined,
      columns: selectedColumns.length > 0 ? selectedColumns : undefined,
      filters: filters.length > 0 ? filters : undefined,
      order_by: orderBy.length > 0 ? orderBy : undefined,
      limit,
    }

    onSave(query)
  }

  function handleLoadSavedQuery(query: QueryDefinition, connectionIdFromQuery: string) {
    // Load the query definition into the visual builder
    setMode('visual')

    // Set table
    const table = tables.find((t) => t.name === query.table)
    setSelectedTable(table || null)

    // Set columns
    setSelectedColumns(query.columns || [])

    // Set joins
    setJoins(query.joins || [])

    // Set filters
    setFilters(query.filters || [])

    // Set order by
    setOrderBy(query.order_by || [])

    // Set limit
    setLimit(query.limit || 100)
  }

  function getCurrentQueryDefinition(): QueryDefinition | null {
    if (mode === 'visual' && selectedTable) {
      return {
        table: selectedTable.name,
        joins: joins.length > 0 ? joins : undefined,
        columns: selectedColumns.length > 0 ? selectedColumns : undefined,
        filters: filters.length > 0 ? filters : undefined,
        order_by: orderBy.length > 0 ? orderBy : undefined,
        limit,
      }
    }
    return null
  }

  if (isLoadingTables) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error && tables.length === 0) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={loadTables}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  function handleAISQLGenerated(sql: string, question: string) {
    setAiGeneratedSql(sql)
    setAiQuestion(question)
  }

  async function handleExecuteAIQuery() {
    if (!aiGeneratedSql) return

    setIsExecuting(true)
    setError('')

    try {
      const result = await queriesApi.execute(workspaceId, connectionId, { sql: aiGeneratedSql })
      setPreviewSql(aiGeneratedSql)
      setPreviewData(result.data)
      setPreviewDialogOpen(true)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to execute query')
    } finally {
      setIsExecuting(false)
    }
  }

  function handleSaveAIQuery() {
    if (!aiGeneratedSql || !onSave) return

    // For AI queries, we'll store the SQL as a raw query
    // This is a simplified approach - ideally we'd parse it back to QueryDefinition
    onSave({
      table: '',  // AI query doesn't have a single table
      sql: aiGeneratedSql,  // Store raw SQL
    } as any)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Query Builder</CardTitle>
              <CardDescription>
                {mode === 'visual'
                  ? 'Build and execute queries visually'
                  : 'Generate queries with AI from natural language'}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSavedQueriesDialogOpen(true)}
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Load Query
              </Button>
              {mode === 'visual' && selectedTable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSaveQueryDialogOpen(true)}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Query
                </Button>
              )}
              <div className="h-4 w-px bg-border" />
              <Button
                variant={mode === 'visual' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('visual')}
              >
                <Blocks className="h-4 w-4 mr-2" />
                Visual
              </Button>
              <Button
                variant={mode === 'ai' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('ai')}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                AI Query
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {mode === 'ai' ? (
            <>
              {/* AI Query Mode */}
              <AskAI
                workspaceId={workspaceId}
                connectionId={connectionId}
                onSQLGenerated={handleAISQLGenerated}
                placeholder="Ask a question about your data in plain English..."
                showPreview={true}
              />

              {aiGeneratedSql && (
                <>
                  {error && (
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                      {error}
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Button onClick={handleExecuteAIQuery} disabled={isExecuting}>
                      {isExecuting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Execute Query
                    </Button>
                    {onSave && (
                      <Button onClick={handleSaveAIQuery} variant="outline">
                        Save Query
                      </Button>
                    )}
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              {/* Visual Query Mode */}
          {/* Table Selection */}
          <div className="space-y-2">
            <Label>Select Table</Label>
            <Select
              value={selectedTable?.name || ''}
              onValueChange={handleTableSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a table..." />
              </SelectTrigger>
              <SelectContent>
                {tables.map((table) => (
                  <SelectItem key={table.name} value={table.name}>
                    {table.name} ({table.columns.length} columns)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTable && (
            <>
              {/* Column Selection */}
              <div className="space-y-2">
                <Label>Select Columns (leave empty for SELECT *)</Label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {selectedTable.columns.map((column) => (
                    <div key={column.name} className="flex items-center space-x-2">
                      <Checkbox
                        id={`col-${column.name}`}
                        checked={selectedColumns.includes(column.name)}
                        onCheckedChange={() => toggleColumn(column.name)}
                      />
                      <label
                        htmlFor={`col-${column.name}`}
                        className="text-sm font-mono cursor-pointer flex-1"
                      >
                        {column.name}
                        <span className="text-muted-foreground ml-2">
                          ({column.type})
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Join Builder */}
              <JoinBuilder
                primaryTable={selectedTable}
                availableTables={tables}
                joins={joins}
                onChange={setJoins}
              />

              {/* Filters */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Filters (WHERE)</Label>
                  <Button onClick={addFilter} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Filter
                  </Button>
                </div>
                {filters.map((filter, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Select
                      value={filter.column}
                      onValueChange={(value) => updateFilter(index, { column: value })}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedTable.columns.map((col) => (
                          <SelectItem key={col.name} value={col.name}>
                            {col.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={filter.operator}
                      onValueChange={(value: any) => updateFilter(index, { operator: value })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="=">=</SelectItem>
                        <SelectItem value="!=">!=</SelectItem>
                        <SelectItem value=">">{'>'}</SelectItem>
                        <SelectItem value=">=">{'>='}</SelectItem>
                        <SelectItem value="<">{'<'}</SelectItem>
                        <SelectItem value="<=">{'<='}</SelectItem>
                        <SelectItem value="LIKE">LIKE</SelectItem>
                        <SelectItem value="IN">IN</SelectItem>
                        <SelectItem value="IS NULL">IS NULL</SelectItem>
                        <SelectItem value="IS NOT NULL">IS NOT NULL</SelectItem>
                      </SelectContent>
                    </Select>

                    {!['IS NULL', 'IS NOT NULL'].includes(filter.operator) && (
                      <Input
                        value={filter.value || ''}
                        onChange={(e) => updateFilter(index, { value: e.target.value })}
                        placeholder="Value"
                        className="flex-1"
                      />
                    )}

                    <Button
                      onClick={() => removeFilter(index)}
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Order By */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Order By</Label>
                  <Button onClick={addOrderBy} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Sort
                  </Button>
                </div>
                {orderBy.map((order, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Select
                      value={order.column}
                      onValueChange={(value) => updateOrderBy(index, { column: value })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedTable.columns.map((col) => (
                          <SelectItem key={col.name} value={col.name}>
                            {col.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={order.direction}
                      onValueChange={(value: any) => updateOrderBy(index, { direction: value })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ASC">Ascending</SelectItem>
                        <SelectItem value="DESC">Descending</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      onClick={() => removeOrderBy(index)}
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Limit */}
              <div className="space-y-2">
                <Label htmlFor="limit">Limit</Label>
                <Input
                  id="limit"
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value) || 100)}
                  min={1}
                  max={10000}
                  className="w-32"
                />
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <Button onClick={handleExecute} disabled={isExecuting}>
                  {isExecuting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Execute Query
                </Button>
                {onSave && (
                  <Button onClick={handleSave} variant="outline">
                    Save Query
                  </Button>
                )}
              </div>
            </>
          )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Query Results</DialogTitle>
            <DialogDescription>
              <div className="flex items-start space-x-2 mt-2">
                <Code className="h-4 w-4 mt-0.5" />
                <code className="text-xs bg-muted px-2 py-1 rounded">{previewSql}</code>
              </div>
            </DialogDescription>
          </DialogHeader>
          {previewData && (
            <div className="overflow-x-auto">
              <pre className="text-xs bg-muted p-4 rounded max-h-[60vh] overflow-auto">
                {JSON.stringify(previewData, null, 2)}
              </pre>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Saved Queries Dialog */}
      <SavedQueriesDialog
        open={savedQueriesDialogOpen}
        onOpenChange={setSavedQueriesDialogOpen}
        workspaceId={workspaceId}
        onSelect={handleLoadSavedQuery}
      />

      {/* Save Query Dialog */}
      {getCurrentQueryDefinition() && (
        <SaveQueryDialog
          open={saveQueryDialogOpen}
          onOpenChange={setSaveQueryDialogOpen}
          workspaceId={workspaceId}
          connectionId={connectionId}
          query={getCurrentQueryDefinition()!}
        />
      )}
    </>
  )
}
