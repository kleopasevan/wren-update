import apiClient from './client'

export interface ScheduledQuery {
  id: string
  workspace_id: string
  connection_id: string
  name: string
  description?: string
  query_type: 'visual' | 'sql'
  query_definition?: any
  sql?: string
  schedule_type: 'cron' | 'interval'
  cron_expression?: string
  interval_minutes?: number
  recipients: string[]
  subject?: string
  format: ('csv' | 'pdf')[]
  enabled: boolean
  last_run_at?: string
  last_run_status?: string
  last_run_error?: string
  next_run_at?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface ScheduledQueryCreate {
  name: string
  description?: string
  connection_id: string
  query_type: 'visual' | 'sql'
  query_definition?: any
  sql?: string
  schedule_type: 'cron' | 'interval'
  cron_expression?: string
  interval_minutes?: number
  recipients: string[]
  subject?: string
  format: ('csv' | 'pdf')[]
  enabled?: boolean
}

export interface ScheduledQueryUpdate {
  name?: string
  description?: string
  connection_id?: string
  query_type?: 'visual' | 'sql'
  query_definition?: any
  sql?: string
  schedule_type?: 'cron' | 'interval'
  cron_expression?: string
  interval_minutes?: number
  recipients?: string[]
  subject?: string
  format?: ('csv' | 'pdf')[]
  enabled?: boolean
}

export const scheduledQueriesApi = {
  async list(workspaceId: string): Promise<ScheduledQuery[]> {
    const response = await apiClient.get<ScheduledQuery[]>(
      `/workspaces/${workspaceId}/scheduled-queries`
    )
    return response.data
  },

  async get(workspaceId: string, queryId: string): Promise<ScheduledQuery> {
    const response = await apiClient.get<ScheduledQuery>(
      `/workspaces/${workspaceId}/scheduled-queries/${queryId}`
    )
    return response.data
  },

  async create(workspaceId: string, data: ScheduledQueryCreate): Promise<ScheduledQuery> {
    const response = await apiClient.post<ScheduledQuery>(
      `/workspaces/${workspaceId}/scheduled-queries`,
      data
    )
    return response.data
  },

  async update(
    workspaceId: string,
    queryId: string,
    data: ScheduledQueryUpdate
  ): Promise<ScheduledQuery> {
    const response = await apiClient.patch<ScheduledQuery>(
      `/workspaces/${workspaceId}/scheduled-queries/${queryId}`,
      data
    )
    return response.data
  },

  async delete(workspaceId: string, queryId: string): Promise<void> {
    await apiClient.delete(`/workspaces/${workspaceId}/scheduled-queries/${queryId}`)
  },
}
