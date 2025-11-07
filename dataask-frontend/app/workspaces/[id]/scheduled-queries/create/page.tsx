'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { scheduledQueriesApi } from '@/lib/api/scheduled-queries'
import { connectionsApi, Connection } from '@/lib/api/connections'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'

export default function CreateScheduledQueryPage() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.id as string

  const [connections, setConnections] = useState<Connection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [connectionId, setConnectionId] = useState('')
  const [queryType, setQueryType] = useState<'sql' | 'visual'>('sql')
  const [sql, setSql] = useState('')
  const [scheduleType, setScheduleType] = useState<'cron' | 'interval'>('interval')
  const [cronExpression, setCronExpression] = useState('0 9 * * *')
  const [intervalMinutes, setIntervalMinutes] = useState('60')
  const [recipients, setRecipients] = useState('')
  const [subject, setSubject] = useState('')
  const [formatCsv, setFormatCsv] = useState(true)
  const [formatPdf, setFormatPdf] = useState(false)
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    loadConnections()
  }, [workspaceId])

  async function loadConnections() {
    try {
      setIsLoading(true)
      const data = await connectionsApi.list(workspaceId)
      setConnections(data)
      if (data.length > 0) {
        setConnectionId(data[0].id)
      }
    } catch (err: any) {
      setError('Failed to load connections')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Validation
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    if (!connectionId) {
      setError('Connection is required')
      return
    }
    if (queryType === 'sql' && !sql.trim()) {
      setError('SQL query is required')
      return
    }
    if (scheduleType === 'cron' && !cronExpression.trim()) {
      setError('Cron expression is required')
      return
    }
    if (scheduleType === 'interval' && (!intervalMinutes || parseInt(intervalMinutes) < 1)) {
      setError('Interval must be at least 1 minute')
      return
    }
    if (!recipients.trim()) {
      setError('At least one recipient is required')
      return
    }
    if (!formatCsv && !formatPdf) {
      setError('At least one format (CSV or PDF) is required')
      return
    }

    try {
      setIsSaving(true)

      const format: ('csv' | 'pdf')[] = []
      if (formatCsv) format.push('csv')
      if (formatPdf) format.push('pdf')

      const recipientsList = recipients.split(',').map(r => r.trim()).filter(r => r)

      await scheduledQueriesApi.create(workspaceId, {
        name: name.trim(),
        description: description.trim() || undefined,
        connection_id: connectionId,
        query_type: queryType,
        sql: queryType === 'sql' ? sql.trim() : undefined,
        query_definition: queryType === 'visual' ? {} : undefined, // TODO: visual query builder
        schedule_type: scheduleType,
        cron_expression: scheduleType === 'cron' ? cronExpression.trim() : undefined,
        interval_minutes: scheduleType === 'interval' ? parseInt(intervalMinutes) : undefined,
        recipients: recipientsList,
        subject: subject.trim() || undefined,
        format,
        enabled,
      })

      router.push(`/workspaces/${workspaceId}/scheduled-queries`)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create scheduled query')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="flex-1 overflow-auto p-8 bg-background">
        <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/workspaces/${workspaceId}/scheduled-queries`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Scheduled Query</h1>
          <p className="text-muted-foreground mt-1">
            Schedule a query to run automatically and send results via email
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Daily Sales Report"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description of what this scheduled query does"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="connection">
                Connection <span className="text-destructive">*</span>
              </Label>
              <Select value={connectionId} onValueChange={setConnectionId}>
                <SelectTrigger id="connection">
                  <SelectValue placeholder="Select a connection" />
                </SelectTrigger>
                <SelectContent>
                  {connections.map((conn) => (
                    <SelectItem key={conn.id} value={conn.id}>
                      {conn.name} ({conn.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Query Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Query Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="queryType">Query Type</Label>
              <Select value={queryType} onValueChange={(v: any) => setQueryType(v)}>
                <SelectTrigger id="queryType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sql">Raw SQL</SelectItem>
                  <SelectItem value="visual" disabled>
                    Visual Builder (Coming Soon)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {queryType === 'sql' && (
              <div>
                <Label htmlFor="sql">
                  SQL Query <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="sql"
                  value={sql}
                  onChange={(e) => setSql(e.target.value)}
                  placeholder="SELECT * FROM table WHERE ..."
                  rows={8}
                  className="font-mono text-sm"
                  required
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedule Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="scheduleType">Schedule Type</Label>
              <Select value={scheduleType} onValueChange={(v: any) => setScheduleType(v)}>
                <SelectTrigger id="scheduleType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interval">Fixed Interval</SelectItem>
                  <SelectItem value="cron">Cron Expression</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {scheduleType === 'interval' && (
              <div>
                <Label htmlFor="interval">
                  Interval (minutes) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="interval"
                  type="number"
                  min="1"
                  value={intervalMinutes}
                  onChange={(e) => setIntervalMinutes(e.target.value)}
                  placeholder="60"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Query will run every {intervalMinutes} minute(s)
                </p>
              </div>
            )}

            {scheduleType === 'cron' && (
              <div>
                <Label htmlFor="cron">
                  Cron Expression <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cron"
                  value={cronExpression}
                  onChange={(e) => setCronExpression(e.target.value)}
                  placeholder="0 9 * * *"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Examples: <code>0 9 * * *</code> (9 AM daily), <code>0 0 * * 1</code> (Mondays
                  at midnight)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Email Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="recipients">
                Recipients <span className="text-destructive">*</span>
              </Label>
              <Input
                id="recipients"
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                placeholder="email1@example.com, email2@example.com"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Comma-separated email addresses
              </p>
            </div>

            <div>
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Leave empty to use default"
              />
            </div>

            <div>
              <Label>Report Format <span className="text-destructive">*</span></Label>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="formatCsv"
                    checked={formatCsv}
                    onCheckedChange={(checked) => setFormatCsv(!!checked)}
                  />
                  <Label htmlFor="formatCsv" className="font-normal cursor-pointer">
                    CSV
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="formatPdf"
                    checked={formatPdf}
                    onCheckedChange={(checked) => setFormatPdf(!!checked)}
                  />
                  <Label htmlFor="formatPdf" className="font-normal cursor-pointer">
                    PDF
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} />
              <Label htmlFor="enabled" className="font-normal cursor-pointer">
                Enable this schedule
              </Label>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Disabled schedules will not run until re-enabled
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/workspaces/${workspaceId}/scheduled-queries`)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Schedule'
            )}
          </Button>
        </div>
      </form>
        </div>
      </div>
    </AppLayout>
  )
}
