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
}
