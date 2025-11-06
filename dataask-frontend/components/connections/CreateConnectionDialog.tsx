'use client'

import { useState } from 'react'
import { connectionsApi } from '@/lib/api/connections'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface CreateConnectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  onSuccess: () => void
}

type DatabaseType = 'postgres' | 'mysql' | 'bigquery' | 'snowflake' | 'redshift' | 'clickhouse' | 'mssql' | 'trino'

const DATABASE_TYPES: { value: DatabaseType; label: string }[] = [
  { value: 'postgres', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'bigquery', label: 'BigQuery' },
  { value: 'snowflake', label: 'Snowflake' },
  { value: 'redshift', label: 'Amazon Redshift' },
  { value: 'clickhouse', label: 'ClickHouse' },
  { value: 'mssql', label: 'Microsoft SQL Server' },
  { value: 'trino', label: 'Trino' },
]

export function CreateConnectionDialog({
  open,
  onOpenChange,
  workspaceId,
  onSuccess,
}: CreateConnectionDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [dbType, setDbType] = useState<DatabaseType>('postgres')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // PostgreSQL/Redshift fields
  const [host, setHost] = useState('')
  const [port, setPort] = useState('')
  const [database, setDatabase] = useState('')
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [schema, setSchema] = useState('')

  // BigQuery fields
  const [projectId, setProjectId] = useState('')
  const [datasetId, setDatasetId] = useState('')
  const [credentialsJson, setCredentialsJson] = useState('')

  // Snowflake fields
  const [account, setAccount] = useState('')
  const [warehouse, setWarehouse] = useState('')
  const [role, setRole] = useState('')

  // Trino fields
  const [catalog, setCatalog] = useState('')

  function resetForm() {
    setName('')
    setDescription('')
    setDbType('postgres')
    setHost('')
    setPort('')
    setDatabase('')
    setUser('')
    setPassword('')
    setSchema('')
    setProjectId('')
    setDatasetId('')
    setCredentialsJson('')
    setAccount('')
    setWarehouse('')
    setRole('')
    setCatalog('')
    setError('')
  }

  function getConnectionInfo(): Record<string, any> {
    switch (dbType) {
      case 'postgres':
      case 'redshift':
        return {
          host,
          port: parseInt(port) || (dbType === 'redshift' ? 5439 : 5432),
          database,
          user,
          password,
          schema: schema || 'public',
        }
      case 'mysql':
        return {
          host,
          port: parseInt(port) || 3306,
          database,
          user,
          password,
        }
      case 'bigquery':
        return {
          project_id: projectId,
          dataset_id: datasetId || undefined,
          credentials_json: credentialsJson,
        }
      case 'snowflake':
        return {
          account,
          user,
          password,
          database: database || undefined,
          schema: schema || undefined,
          warehouse: warehouse || undefined,
          role: role || undefined,
        }
      case 'clickhouse':
        return {
          host,
          port: parseInt(port) || 9000,
          database,
          user,
          password,
        }
      case 'mssql':
        return {
          host,
          port: parseInt(port) || 1433,
          database,
          user,
          password,
          schema: schema || 'dbo',
        }
      case 'trino':
        return {
          host,
          port: parseInt(port) || 8080,
          catalog,
          schema: schema || undefined,
          user: user || undefined,
          password: password || undefined,
        }
      default:
        return {}
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Connection name is required')
      return
    }

    // Basic validation
    if (['postgres', 'mysql', 'redshift', 'clickhouse', 'mssql', 'trino'].includes(dbType)) {
      if (!host.trim()) {
        setError('Host is required')
        return
      }
      if (['postgres', 'mysql', 'redshift', 'clickhouse', 'mssql'].includes(dbType) && !database.trim()) {
        setError('Database is required')
        return
      }
      if (dbType !== 'trino' && !user.trim()) {
        setError('User is required')
        return
      }
    }

    if (dbType === 'bigquery') {
      if (!projectId.trim()) {
        setError('Project ID is required')
        return
      }
      if (!credentialsJson.trim()) {
        setError('Credentials JSON is required')
        return
      }
    }

    if (dbType === 'snowflake') {
      if (!account.trim() || !user.trim() || !password.trim()) {
        setError('Account, user, and password are required')
        return
      }
    }

    setIsLoading(true)

    try {
      const connectionInfo = getConnectionInfo()

      await connectionsApi.create(workspaceId, {
        name: name.trim(),
        description: description.trim() || undefined,
        type: dbType,
        connection_info: connectionInfo,
      })

      // Reset form and close dialog
      resetForm()
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create connection')
    } finally {
      setIsLoading(false)
    }
  }

  function handleCancel() {
    resetForm()
    onOpenChange(false)
  }

  function renderDatabaseFields() {
    switch (dbType) {
      case 'postgres':
      case 'mysql':
      case 'redshift':
      case 'clickhouse':
      case 'mssql':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="host">
                  Host <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="host"
                  placeholder="localhost"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  placeholder={
                    dbType === 'redshift' ? '5439' :
                    dbType === 'mysql' ? '3306' :
                    dbType === 'clickhouse' ? '9000' :
                    dbType === 'mssql' ? '1433' :
                    '5432'
                  }
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="database">
                Database <span className="text-destructive">*</span>
              </Label>
              <Input
                id="database"
                placeholder="mydb"
                value={database}
                onChange={(e) => setDatabase(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user">
                User <span className="text-destructive">*</span>
              </Label>
              <Input
                id="user"
                placeholder="username"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {(dbType === 'postgres' || dbType === 'redshift' || dbType === 'mssql') && (
              <div className="space-y-2">
                <Label htmlFor="schema">Schema (Optional)</Label>
                <Input
                  id="schema"
                  placeholder={dbType === 'mssql' ? 'dbo' : 'public'}
                  value={schema}
                  onChange={(e) => setSchema(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}
          </>
        )

      case 'bigquery':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="projectId">
                Project ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="projectId"
                placeholder="my-project-id"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="datasetId">Dataset ID (Optional)</Label>
              <Input
                id="datasetId"
                placeholder="my_dataset"
                value={datasetId}
                onChange={(e) => setDatasetId(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="credentialsJson">
                Service Account JSON <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="credentialsJson"
                placeholder='{"type": "service_account", ...}'
                value={credentialsJson}
                onChange={(e) => setCredentialsJson(e.target.value)}
                disabled={isLoading}
                required
                className="font-mono text-xs"
                rows={6}
              />
            </div>
          </>
        )

      case 'snowflake':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="account">
                Account <span className="text-destructive">*</span>
              </Label>
              <Input
                id="account"
                placeholder="abc12345.us-east-1"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user">
                User <span className="text-destructive">*</span>
              </Label>
              <Input
                id="user"
                placeholder="username"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="database">Database (Optional)</Label>
              <Input
                id="database"
                placeholder="MYDB"
                value={database}
                onChange={(e) => setDatabase(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schema">Schema (Optional)</Label>
              <Input
                id="schema"
                placeholder="PUBLIC"
                value={schema}
                onChange={(e) => setSchema(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warehouse">Warehouse (Optional)</Label>
              <Input
                id="warehouse"
                placeholder="COMPUTE_WH"
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role (Optional)</Label>
              <Input
                id="role"
                placeholder="SYSADMIN"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </>
        )

      case 'trino':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="host">
                  Host <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="host"
                  placeholder="localhost"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  placeholder="8080"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="catalog">
                Catalog <span className="text-destructive">*</span>
              </Label>
              <Input
                id="catalog"
                placeholder="hive"
                value={catalog}
                onChange={(e) => setCatalog(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schema">Schema (Optional)</Label>
              <Input
                id="schema"
                placeholder="default"
                value={schema}
                onChange={(e) => setSchema(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user">User (Optional)</Label>
              <Input
                id="user"
                placeholder="username"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password (Optional)</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Connection</DialogTitle>
          <DialogDescription>
            Connect to a database to start analyzing your data.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="My Database"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="A brief description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">
                Database Type <span className="text-destructive">*</span>
              </Label>
              <Select value={dbType} onValueChange={(value) => setDbType(value as DatabaseType)} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select database type" />
                </SelectTrigger>
                <SelectContent>
                  {DATABASE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {renderDatabaseFields()}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Connection'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
