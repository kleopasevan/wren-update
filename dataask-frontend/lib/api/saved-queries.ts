import apiClient from './client'
import { QueryDefinition } from './queries'

export interface SavedQuery {
  id: string
  workspace_id: string
  name: string
  description?: string
  connection_id: string
  query: QueryDefinition
  tags?: string[]
  created_by: string
  created_at: string
  updated_at: string
}

export interface SavedQueryCreate {
  name: string
  description?: string
  connection_id: string
  query: QueryDefinition
  tags?: string[]
}

export interface SavedQueryUpdate {
  name?: string
  description?: string
  connection_id?: string
  query?: QueryDefinition
  tags?: string[]
}

export const savedQueriesApi = {
  async list(workspaceId: string): Promise<SavedQuery[]> {
    const response = await apiClient.get<SavedQuery[]>(
      `/workspaces/${workspaceId}/saved-queries`
    )
    return response.data
  },

  async get(workspaceId: string, queryId: string): Promise<SavedQuery> {
    const response = await apiClient.get<SavedQuery>(
      `/workspaces/${workspaceId}/saved-queries/${queryId}`
    )
    return response.data
  },

  async create(
    workspaceId: string,
    data: SavedQueryCreate
  ): Promise<SavedQuery> {
    const response = await apiClient.post<SavedQuery>(
      `/workspaces/${workspaceId}/saved-queries`,
      data
    )
    return response.data
  },

  async update(
    workspaceId: string,
    queryId: string,
    data: SavedQueryUpdate
  ): Promise<SavedQuery> {
    const response = await apiClient.patch<SavedQuery>(
      `/workspaces/${workspaceId}/saved-queries/${queryId}`,
      data
    )
    return response.data
  },

  async delete(workspaceId: string, queryId: string): Promise<void> {
    await apiClient.delete(`/workspaces/${workspaceId}/saved-queries/${queryId}`)
  },
}
