'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export interface DashboardParameter {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'date_range' | 'dropdown'
  defaultValue?: any
  required: boolean
  options?: string[] // For dropdown type
}

interface DashboardParametersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parameters: DashboardParameter[]
  onSave: (parameters: DashboardParameter[]) => void
}

export function DashboardParametersDialog({
  open,
  onOpenChange,
  parameters,
  onSave,
}: DashboardParametersDialogProps) {
  const [localParameters, setLocalParameters] = useState<DashboardParameter[]>([])

  useEffect(() => {
    if (open) {
      setLocalParameters(parameters.length > 0 ? parameters : [])
    }
  }, [open, parameters])

  function handleAddParameter() {
    setLocalParameters([
      ...localParameters,
      {
        name: '',
        label: '',
        type: 'text',
        required: false,
      },
    ])
  }

  function handleRemoveParameter(index: number) {
    setLocalParameters(localParameters.filter((_, i) => i !== index))
  }

  function handleUpdateParameter(index: number, updates: Partial<DashboardParameter>) {
    setLocalParameters(
      localParameters.map((param, i) => (i === index ? { ...param, ...updates } : param))
    )
  }

  function handleSave() {
    // Validate
    const errors: string[] = []
    localParameters.forEach((param, i) => {
      if (!param.name.trim()) {
        errors.push(`Parameter ${i + 1}: Name is required`)
      }
      if (!param.label.trim()) {
        errors.push(`Parameter ${i + 1}: Label is required`)
      }
      if (param.type === 'dropdown' && (!param.options || param.options.length === 0)) {
        errors.push(`Parameter ${i + 1}: Dropdown requires at least one option`)
      }
    })

    if (errors.length > 0) {
      alert(errors.join('\n'))
      return
    }

    onSave(localParameters)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Dashboard Parameters</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Parameters allow you to create dynamic dashboards where users can filter data
            interactively. Use <code className="bg-muted px-1">{'{{parameter_name}}'}</code> in
            widget filters to reference parameters.
          </p>

          {localParameters.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No parameters defined yet. Click "Add Parameter" to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {localParameters.map((param, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="grid gap-4">
                      {/* Name and Label Row */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`param-name-${index}`}>
                            Name <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id={`param-name-${index}`}
                            value={param.name}
                            onChange={(e) =>
                              handleUpdateParameter(index, { name: e.target.value })
                            }
                            placeholder="e.g., start_date"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Use in queries as: {'{{' + param.name + '}}'}
                          </p>
                        </div>
                        <div>
                          <Label htmlFor={`param-label-${index}`}>
                            Label <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id={`param-label-${index}`}
                            value={param.label}
                            onChange={(e) =>
                              handleUpdateParameter(index, { label: e.target.value })
                            }
                            placeholder="e.g., Start Date"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Display name for users
                          </p>
                        </div>
                      </div>

                      {/* Type and Default Value Row */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`param-type-${index}`}>Type</Label>
                          <Select
                            value={param.type}
                            onValueChange={(value: any) =>
                              handleUpdateParameter(index, { type: value })
                            }
                          >
                            <SelectTrigger id={`param-type-${index}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                              <SelectItem value="date_range">Date Range</SelectItem>
                              <SelectItem value="dropdown">Dropdown</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor={`param-default-${index}`}>Default Value</Label>
                          <Input
                            id={`param-default-${index}`}
                            value={param.defaultValue || ''}
                            onChange={(e) =>
                              handleUpdateParameter(index, { defaultValue: e.target.value })
                            }
                            placeholder="Optional"
                          />
                        </div>
                      </div>

                      {/* Dropdown Options */}
                      {param.type === 'dropdown' && (
                        <div>
                          <Label htmlFor={`param-options-${index}`}>
                            Options (comma-separated) <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id={`param-options-${index}`}
                            value={param.options?.join(', ') || ''}
                            onChange={(e) =>
                              handleUpdateParameter(index, {
                                options: e.target.value.split(',').map((s) => s.trim()),
                              })
                            }
                            placeholder="e.g., Option 1, Option 2, Option 3"
                          />
                        </div>
                      )}

                      {/* Required Switch and Remove Button */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`param-required-${index}`}
                            checked={param.required}
                            onCheckedChange={(checked) =>
                              handleUpdateParameter(index, { required: checked })
                            }
                          />
                          <Label htmlFor={`param-required-${index}`}>Required</Label>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveParameter(index)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Button variant="outline" onClick={handleAddParameter} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Parameter
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Parameters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
