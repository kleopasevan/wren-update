/**
 * Dashboards API client
 */

import { apiClient } from './client'

export interface Dashboard {
  id: string
  workspace_id: string
  name: string
  description?: string
  layout: any[]
  settings: Record<string, any>
  created_by?: string
  created_at: string
  updated_at: string
}

export interface CreateDashboardData {
  workspace_id: string
  name: string
  description?: string
  layout?: any[]
  settings?: Record<string, any>
}

export interface UpdateDashboardData {
  name?: string
  description?: string
  layout?: any[]
  settings?: Record<string, any>
}

export interface Widget {
  id: string
  dashboard_id: string
  type: string
  title?: string
  config: Record<string, any>
  position: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CreateWidgetData {
  type: string
  title?: string
  config: Record<string, any>
  position: Record<string, any>
}

export interface UpdateWidgetData {
  type?: string
  title?: string
  config?: Record<string, any>
  position?: Record<string, any>
}

export const dashboardsApi = {
  /**
   * List all dashboards for a workspace
   */
  async list(workspaceId: string): Promise<Dashboard[]> {
    const response = await apiClient.get<Dashboard[]>(`/workspaces/${workspaceId}/dashboards`)
    return response.data
  },

  /**
   * Get a specific dashboard by ID
   */
  async get(workspaceId: string, dashboardId: string): Promise<Dashboard> {
    const response = await apiClient.get<Dashboard>(
      `/workspaces/${workspaceId}/dashboards/${dashboardId}`
    )
    return response.data
  },

  /**
   * Create a new dashboard
   */
  async create(workspaceId: string, data: Omit<CreateDashboardData, 'workspace_id'>): Promise<Dashboard> {
    const response = await apiClient.post<Dashboard>(
      `/workspaces/${workspaceId}/dashboards`,
      { ...data, workspace_id: workspaceId }
    )
    return response.data
  },

  /**
   * Update a dashboard
   */
  async update(
    workspaceId: string,
    dashboardId: string,
    data: UpdateDashboardData
  ): Promise<Dashboard> {
    const response = await apiClient.patch<Dashboard>(
      `/workspaces/${workspaceId}/dashboards/${dashboardId}`,
      data
    )
    return response.data
  },

  /**
   * Delete a dashboard
   */
  async delete(workspaceId: string, dashboardId: string): Promise<void> {
    await apiClient.delete(`/workspaces/${workspaceId}/dashboards/${dashboardId}`)
  },

  // Widget operations
  /**
   * List all widgets for a dashboard
   */
  async listWidgets(workspaceId: string, dashboardId: string): Promise<Widget[]> {
    const response = await apiClient.get<Widget[]>(
      `/workspaces/${workspaceId}/dashboards/${dashboardId}/widgets`
    )
    return response.data
  },

  /**
   * Create a new widget
   */
  async createWidget(
    workspaceId: string,
    dashboardId: string,
    data: CreateWidgetData
  ): Promise<Widget> {
    const response = await apiClient.post<Widget>(
      `/workspaces/${workspaceId}/dashboards/${dashboardId}/widgets`,
      data
    )
    return response.data
  },

  /**
   * Update a widget
   */
  async updateWidget(
    workspaceId: string,
    dashboardId: string,
    widgetId: string,
    data: UpdateWidgetData
  ): Promise<Widget> {
    const response = await apiClient.patch<Widget>(
      `/workspaces/${workspaceId}/dashboards/${dashboardId}/widgets/${widgetId}`,
      data
    )
    return response.data
  },

  /**
   * Delete a widget
   */
  async deleteWidget(workspaceId: string, dashboardId: string, widgetId: string): Promise<void> {
    await apiClient.delete(`/workspaces/${workspaceId}/dashboards/${dashboardId}/widgets/${widgetId}`)
  },
}
