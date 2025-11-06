import apiClient from './client'

export interface Widget {
  id: string
  dashboard_id: string
  type: 'chart' | 'metric' | 'table' | 'text' | 'filter'
  title?: string
  config: Record<string, any>
  position: {
    x: number
    y: number
    w: number
    h: number
  }
  created_at: string
  updated_at: string
}

export interface CreateWidgetData {
  dashboard_id: string
  type: 'chart' | 'metric' | 'table' | 'text' | 'filter'
  title?: string
  config: Record<string, any>
  position: {
    x: number
    y: number
    w: number
    h: number
  }
}

export interface UpdateWidgetData {
  type?: 'chart' | 'metric' | 'table' | 'text' | 'filter'
  title?: string
  config?: Record<string, any>
  position?: {
    x: number
    y: number
    w: number
    h: number
  }
}

export const widgetsApi = {
  async list(workspaceId: string, dashboardId: string): Promise<Widget[]> {
    const response = await apiClient.get<Widget[]>(
      `/workspaces/${workspaceId}/dashboards/${dashboardId}/widgets`
    )
    return response.data
  },

  async get(workspaceId: string, dashboardId: string, widgetId: string): Promise<Widget> {
    const response = await apiClient.get<Widget>(
      `/workspaces/${workspaceId}/dashboards/${dashboardId}/widgets/${widgetId}`
    )
    return response.data
  },

  async create(
    workspaceId: string,
    dashboardId: string,
    data: Omit<CreateWidgetData, 'dashboard_id'>
  ): Promise<Widget> {
    const response = await apiClient.post<Widget>(
      `/workspaces/${workspaceId}/dashboards/${dashboardId}/widgets`,
      { ...data, dashboard_id: dashboardId }
    )
    return response.data
  },

  async update(
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

  async delete(workspaceId: string, dashboardId: string, widgetId: string): Promise<void> {
    await apiClient.delete(
      `/workspaces/${workspaceId}/dashboards/${dashboardId}/widgets/${widgetId}`
    )
  },
}
