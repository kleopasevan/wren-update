'use client'

import React, { createContext, useContext, useState } from 'react'

export interface DashboardFilter {
  id: string
  type: 'date_range' | 'dropdown' | 'multi_select'
  column: string
  value: any
  label?: string
}

interface DashboardFiltersContextType {
  filters: DashboardFilter[]
  setFilter: (id: string, type: DashboardFilter['type'], column: string, value: any, label?: string) => void
  removeFilter: (id: string) => void
  clearFilters: () => void
  getFilterValue: (id: string) => any
  getFiltersByColumn: (column: string) => DashboardFilter[]
}

const DashboardFiltersContext = createContext<DashboardFiltersContextType | undefined>(undefined)

export function DashboardFiltersProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<DashboardFilter[]>([])

  const setFilter = (
    id: string,
    type: DashboardFilter['type'],
    column: string,
    value: any,
    label?: string
  ) => {
    setFilters((prev) => {
      const existing = prev.find((f) => f.id === id)
      if (existing) {
        return prev.map((f) => (f.id === id ? { ...f, type, column, value, label } : f))
      }
      return [...prev, { id, type, column, value, label }]
    })
  }

  const removeFilter = (id: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== id))
  }

  const clearFilters = () => {
    setFilters([])
  }

  const getFilterValue = (id: string) => {
    const filter = filters.find((f) => f.id === id)
    return filter?.value
  }

  const getFiltersByColumn = (column: string) => {
    return filters.filter((f) => f.column === column)
  }

  return (
    <DashboardFiltersContext.Provider
      value={{
        filters,
        setFilter,
        removeFilter,
        clearFilters,
        getFilterValue,
        getFiltersByColumn,
      }}
    >
      {children}
    </DashboardFiltersContext.Provider>
  )
}

export function useDashboardFilters() {
  const context = useContext(DashboardFiltersContext)
  if (context === undefined) {
    throw new Error('useDashboardFilters must be used within a DashboardFiltersProvider')
  }
  return context
}
