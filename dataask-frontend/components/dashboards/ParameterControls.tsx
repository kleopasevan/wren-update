'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { DashboardParameter } from './DashboardParametersDialog'

interface ParameterControlsProps {
  parameters: DashboardParameter[]
  values: Record<string, any>
  onChange: (values: Record<string, any>) => void
}

export function ParameterControls({ parameters, values, onChange }: ParameterControlsProps) {
  const [localValues, setLocalValues] = useState<Record<string, any>>(values)

  useEffect(() => {
    setLocalValues(values)
  }, [values])

  function handleChange(name: string, value: any) {
    const newValues = { ...localValues, [name]: value }
    setLocalValues(newValues)
    onChange(newValues)
  }

  if (parameters.length === 0) {
    return null
  }

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {parameters.map((param) => (
            <div key={param.name} className="space-y-2">
              <Label htmlFor={`param-${param.name}`}>
                {param.label}
                {param.required && <span className="text-destructive ml-1">*</span>}
              </Label>

              {param.type === 'text' && (
                <Input
                  id={`param-${param.name}`}
                  type="text"
                  value={localValues[param.name] || ''}
                  onChange={(e) => handleChange(param.name, e.target.value)}
                  placeholder={param.defaultValue || ''}
                />
              )}

              {param.type === 'number' && (
                <Input
                  id={`param-${param.name}`}
                  type="number"
                  value={localValues[param.name] || ''}
                  onChange={(e) => handleChange(param.name, e.target.value)}
                  placeholder={param.defaultValue || ''}
                />
              )}

              {param.type === 'date' && (
                <Input
                  id={`param-${param.name}`}
                  type="date"
                  value={localValues[param.name] || ''}
                  onChange={(e) => handleChange(param.name, e.target.value)}
                />
              )}

              {param.type === 'date_range' && (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    id={`param-${param.name}-start`}
                    type="date"
                    value={localValues[param.name]?.start || ''}
                    onChange={(e) =>
                      handleChange(param.name, {
                        ...localValues[param.name],
                        start: e.target.value,
                      })
                    }
                    placeholder="Start"
                  />
                  <Input
                    id={`param-${param.name}-end`}
                    type="date"
                    value={localValues[param.name]?.end || ''}
                    onChange={(e) =>
                      handleChange(param.name, {
                        ...localValues[param.name],
                        end: e.target.value,
                      })
                    }
                    placeholder="End"
                  />
                </div>
              )}

              {param.type === 'dropdown' && (
                <Select
                  value={localValues[param.name] || ''}
                  onValueChange={(value) => handleChange(param.name, value)}
                >
                  <SelectTrigger id={`param-${param.name}`}>
                    <SelectValue placeholder={param.defaultValue || 'Select...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {param.options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
