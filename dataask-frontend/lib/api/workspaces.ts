/**
 * Workspace API client
 */

import { apiClient } from './client'

export interface Workspace {
  id: string
  name: string
  description?: string
  owner_id: string
  created_at: string
  updated_at: string
}

export interface CreateWorkspaceData {
  name: string
  description?: string
}

export interface UpdateWorkspaceData {
  name?: string
  description?: string
}

export const workspacesApi = {
  /**
   * Get all workspaces for the current user
   */
  async list(): Promise<Workspace[]> {
    const response = await apiClient.get<Workspace[]>('/workspaces')
    return response.data
  },

  /**
   * Get a specific workspace by ID
   */
  async get(id: string): Promise<Workspace> {
    const response = await apiClient.get<Workspace>(`/workspaces/${id}`)
    return response.data
  },

  /**
   * Create a new workspace
   */
  async create(data: CreateWorkspaceData): Promise<Workspace> {
    const response = await apiClient.post<Workspace>('/workspaces', data)
    return response.data
  },

  /**
   * Update a workspace
   */
  async update(id: string, data: UpdateWorkspaceData): Promise<Workspace> {
    const response = await apiClient.patch<Workspace>(`/workspaces/${id}`, data)
    return response.data
  },

  /**
   * Delete a workspace
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/workspaces/${id}`)
  },
}
