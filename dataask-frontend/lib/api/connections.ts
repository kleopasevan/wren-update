/**
 * Connections API client
 */

import { apiClient } from './client'

export interface Connection {
  id: string
  workspace_id: string
  name: string
  description?: string
  type: string
  connection_info?: Record<string, any>
  settings: Record<string, any>
  status: string
  last_tested_at?: string
  test_status?: string
  test_message?: string
  created_at: string
  updated_at: string
  created_by?: string
}

export interface CreateConnectionData {
  workspace_id: string
  name: string
  description?: string
  type: string
  connection_info: Record<string, any>
  settings?: Record<string, any>
}

export interface UpdateConnectionData {
  name?: string
  description?: string
  type?: string
  connection_info?: Record<string, any>
  settings?: Record<string, any>
  status?: string
}

export interface TestConnectionResponse {
  status: string
  message: string
  tested_at?: string
}

export interface TableColumn {
  name: string
  type: string
  notNull: boolean
  description?: string
  properties?: Record<string, any>
  nestedColumns?: TableColumn[]
}

export interface Table {
  name: string
  columns: TableColumn[]
  description?: string
  properties?: {
    schema?: string
    catalog?: string
    table?: string
    path?: string
  }
  primaryKey?: string
}

export interface Constraint {
  constraintName: string
  constraintType: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE'
  constraintTable: string
  constraintColumn: string
  constraintedTable: string
  constraintedColumn: string
}

export interface QueryHistory {
  question: string
  sql: string
}

export interface TextToSQLRequest {
  question: string
  mdl_hash?: string
  histories?: QueryHistory[]
  custom_instruction?: string
  enable_column_pruning?: boolean
}

export interface AIError {
  code: 'NO_RELEVANT_DATA' | 'NO_RELEVANT_SQL' | 'OTHERS'
  message: string
}

export interface TextToSQLResponse {
  status: 'finished' | 'failed'
  sql?: string
  rephrased_question?: string
  type?: 'GENERAL' | 'TEXT_TO_SQL'
  retrieved_tables?: string[]
  error?: AIError
  invalid_sql?: string
}

export const connectionsApi = {
  /**
   * List all connections for a workspace
   */
  async list(workspaceId: string): Promise<Connection[]> {
    const response = await apiClient.get<Connection[]>(`/workspaces/${workspaceId}/connections`)
    return response.data
  },

  /**
   * Get a specific connection by ID
   */
  async get(workspaceId: string, connectionId: string): Promise<Connection> {
    const response = await apiClient.get<Connection>(
      `/workspaces/${workspaceId}/connections/${connectionId}`
    )
    return response.data
  },

  /**
   * Create a new connection
   */
  async create(workspaceId: string, data: Omit<CreateConnectionData, 'workspace_id'>): Promise<Connection> {
    const response = await apiClient.post<Connection>(
      `/workspaces/${workspaceId}/connections`,
      { ...data, workspace_id: workspaceId }
    )
    return response.data
  },

  /**
   * Update a connection
   */
  async update(
    workspaceId: string,
    connectionId: string,
    data: UpdateConnectionData
  ): Promise<Connection> {
    const response = await apiClient.patch<Connection>(
      `/workspaces/${workspaceId}/connections/${connectionId}`,
      data
    )
    return response.data
  },

  /**
   * Delete a connection
   */
  async delete(workspaceId: string, connectionId: string): Promise<void> {
    await apiClient.delete(`/workspaces/${workspaceId}/connections/${connectionId}`)
  },

  /**
   * Test a connection
   */
  async test(workspaceId: string, connectionId: string): Promise<TestConnectionResponse> {
    const response = await apiClient.post<TestConnectionResponse>(
      `/workspaces/${workspaceId}/connections/${connectionId}/test`
    )
    return response.data
  },

  /**
   * Get tables from a connection
   */
  async getTables(workspaceId: string, connectionId: string): Promise<Table[]> {
    const response = await apiClient.get<Table[]>(
      `/workspaces/${workspaceId}/connections/${connectionId}/tables`
    )
    return response.data
  },

  /**
   * Get constraints from a connection
   */
  async getConstraints(workspaceId: string, connectionId: string): Promise<Constraint[]> {
    const response = await apiClient.get<Constraint[]>(
      `/workspaces/${workspaceId}/connections/${connectionId}/constraints`
    )
    return response.data
  },

  /**
   * Preview data from a table
   */
  async previewTable(
    workspaceId: string,
    connectionId: string,
    tableName: string,
    limit: number = 10
  ): Promise<any> {
    const response = await apiClient.get(
      `/workspaces/${workspaceId}/connections/${connectionId}/tables/${encodeURIComponent(tableName)}/preview`,
      { params: { limit } }
    )
    return response.data
  },

  /**
   * Convert natural language to SQL using Wren AI
   */
  async textToSql(
    workspaceId: string,
    connectionId: string,
    request: Omit<TextToSQLRequest, 'mdl_hash'>
  ): Promise<TextToSQLResponse> {
    const response = await apiClient.post<TextToSQLResponse>(
      `/workspaces/${workspaceId}/connections/${connectionId}/text-to-sql`,
      request
    )
    return response.data
  },
}
