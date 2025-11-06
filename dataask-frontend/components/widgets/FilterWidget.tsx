'use client'

import { useState, useEffect } from 'react'
import { Filter, Calendar, ChevronDown } from 'lucide-react'
import { Widget } from '@/lib/api/widgets'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDashboardFilters } from '@/contexts/DashboardFiltersContext'
import { queriesApi } from '@/lib/api/queries'

interface FilterWidgetProps {
  widget: Widget
  workspaceId: string
}

export function FilterWidget({ widget, workspaceId }: FilterWidgetProps) {
  const { setFilter } = useDashboardFilters()
  const filterType = widget.config.filterType || 'dropdown'
  const label = widget.config.label || 'Filter'
  const column = widget.config.column || ''
  const connectionId = widget.config.connectionId

  // Dropdown filter state
  const [options, setOptions] = useState<string[]>([])
  const [selectedValue, setSelectedValue] = useState<string>('')
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)

  // Date range filter state
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  // Load dropdown options from query results
  useEffect(() => {
    if (filterType === 'dropdown' && connectionId && widget.config.query && workspaceId) {
      loadDropdownOptions()
    }
  }, [filterType, connectionId, widget.config.query, workspaceId])

  async function loadDropdownOptions() {
    try {
      setIsLoadingOptions(true)
      const result = await queriesApi.execute(workspaceId, connectionId, {
        query: widget.config.query,
      })

      // Extract unique values from the query results
      if (result.data && result.data.data && result.data.data.length > 0) {
        const firstColumn = Object.keys(result.data.data[0])[0]
        const uniqueValues = [
          ...new Set(result.data.data.map((row: any) => String(row[firstColumn]))),
        ]
        setOptions(uniqueValues)
      }
    } catch (err) {
      console.error('Failed to load filter options:', err)
    } finally {
      setIsLoadingOptions(false)
    }
  }

  function handleDropdownChange(value: string) {
    setSelectedValue(value)
    setFilter(widget.id, 'dropdown', column, value, label)
  }

  function handleDateRangeChange() {
    if (startDate && endDate) {
      setFilter(widget.id, 'date_range', column, { start: startDate, end: endDate }, label)
    }
  }

  function handleClearFilter() {
    setSelectedValue('')
    setStartDate('')
    setEndDate('')
    setFilter(widget.id, filterType, column, null, label)
  }

  if (filterType === 'date_range') {
    return (
      <div className="flex flex-col h-full p-4 space-y-3">
        <div className="flex items-center space-x-2 mb-2">
          <Calendar className="h-4 w-4 text-primary" />
          <Label className="font-semibold">{label}</Label>
        </div>

        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex space-x-2 mt-auto">
          <Button
            onClick={handleDateRangeChange}
            size="sm"
            className="flex-1"
            disabled={!startDate || !endDate}
          >
            Apply
          </Button>
          <Button onClick={handleClearFilter} size="sm" variant="outline">
            Clear
          </Button>
        </div>

        {column && (
          <div className="text-xs text-muted-foreground mt-2">
            Filtering: <span className="font-mono">{column}</span>
          </div>
        )}
      </div>
    )
  }

  if (filterType === 'dropdown') {
    return (
      <div className="flex flex-col h-full p-4 space-y-3">
        <div className="flex items-center space-x-2 mb-2">
          <ChevronDown className="h-4 w-4 text-primary" />
          <Label className="font-semibold">{label}</Label>
        </div>

        {isLoadingOptions ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading options...</div>
          </div>
        ) : options.length > 0 ? (
          <>
            <Select value={selectedValue} onValueChange={handleDropdownChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an option..." />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedValue && (
              <Button onClick={handleClearFilter} size="sm" variant="outline" className="w-full">
                Clear Filter
              </Button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Filter className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Configure data source</p>
            <p className="text-xs mt-1 opacity-70">to load filter options</p>
          </div>
        )}

        {column && (
          <div className="text-xs text-muted-foreground mt-auto">
            Filtering: <span className="font-mono">{column}</span>
          </div>
        )}
      </div>
    )
  }

  // Fallback for unconfigured filters
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[100px] text-muted-foreground">
      <Filter className="h-12 w-12 mb-3 opacity-50" />
      <p className="text-sm">{label}</p>
      <p className="text-xs mt-1 opacity-70">Configure filter settings</p>
    </div>
  )
}
