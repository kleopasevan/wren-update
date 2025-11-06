'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface ParameterValuesContextType {
  parameterValues: Record<string, any>
  setParameterValues: (values: Record<string, any>) => void
}

const ParameterValuesContext = createContext<ParameterValuesContextType | undefined>(undefined)

export function ParameterValuesProvider({ children }: { children: ReactNode }) {
  const [parameterValues, setParameterValues] = useState<Record<string, any>>({})

  return (
    <ParameterValuesContext.Provider value={{ parameterValues, setParameterValues }}>
      {children}
    </ParameterValuesContext.Provider>
  )
}

export function useParameterValues() {
  const context = useContext(ParameterValuesContext)
  if (context === undefined) {
    throw new Error('useParameterValues must be used within a ParameterValuesProvider')
  }
  return context
}
