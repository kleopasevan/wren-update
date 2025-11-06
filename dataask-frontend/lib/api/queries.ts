import apiClient from './client'

export interface QueryFilter {
  column: string
  operator: '=' | '!=' | '>' | '>=' | '<' | '<=' | 'LIKE' | 'IN' | 'IS NULL' | 'IS NOT NULL'
  value?: any
}

export interface QueryOrderBy {
  column: string
  direction: 'ASC' | 'DESC'
}

export interface QueryDefinition {
  table: string
  columns?: string[]
  filters?: QueryFilter[]
  group_by?: string[]
  order_by?: QueryOrderBy[]
  limit?: number
}

export interface QueryExecuteRequest {
  query?: QueryDefinition
  sql?: string
  limit?: number
}

export interface QueryExecuteResponse {
  sql: string
  data: any
  row_count?: number
}

export const queriesApi = {
  async execute(
    workspaceId: string,
    connectionId: string,
    request: QueryExecuteRequest
  ): Promise<QueryExecuteResponse> {
    const response = await apiClient.post<QueryExecuteResponse>(
      `/workspaces/${workspaceId}/connections/${connectionId}/query`,
      request
    )
    return response.data
  },
}
