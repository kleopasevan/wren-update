import apiClient from './client'

export interface QueryHistory {
  id: string
  workspace_id: string
  connection_id: string
  user_id: string
  query_type: 'visual' | 'ai' | 'sql'
  query_definition?: any
  sql: string
  status: 'success' | 'error'
  error_message?: string
  row_count?: number
  execution_time_ms?: number
  executed_at: string
}

export const queryHistoryApi = {
  async list(
    workspaceId: string,
    params?: { limit?: number; offset?: number }
  ): Promise<QueryHistory[]> {
    const response = await apiClient.get<QueryHistory[]>(
      `/workspaces/${workspaceId}/query-history`,
      { params }
    )
    return response.data
  },

  async get(workspaceId: string, historyId: string): Promise<QueryHistory> {
    const response = await apiClient.get<QueryHistory>(
      `/workspaces/${workspaceId}/query-history/${historyId}`
    )
    return response.data
  },

  async delete(workspaceId: string, historyId: string): Promise<void> {
    await apiClient.delete(`/workspaces/${workspaceId}/query-history/${historyId}`)
  },
}
