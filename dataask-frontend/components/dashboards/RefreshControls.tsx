'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Clock, Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export type RefreshInterval = 0 | 30 | 60 | 300 | 900 | 1800 | 3600

interface RefreshControlsProps {
  onRefresh: () => void
  refreshInterval: RefreshInterval
  onRefreshIntervalChange: (interval: RefreshInterval) => void
  lastUpdated?: Date
  isRefreshing?: boolean
}

const REFRESH_OPTIONS: { label: string; value: RefreshInterval }[] = [
  { label: 'Off', value: 0 },
  { label: '30 seconds', value: 30 },
  { label: '1 minute', value: 60 },
  { label: '5 minutes', value: 300 },
  { label: '15 minutes', value: 900 },
  { label: '30 minutes', value: 1800 },
  { label: '1 hour', value: 3600 },
]

export function RefreshControls({
  onRefresh,
  refreshInterval,
  onRefreshIntervalChange,
  lastUpdated,
  isRefreshing = false,
}: RefreshControlsProps) {
  const [isPaused, setIsPaused] = useState(false)
  const [timeUntilRefresh, setTimeUntilRefresh] = useState<number>(0)

  useEffect(() => {
    if (refreshInterval === 0 || isPaused) {
      return
    }

    // Set up interval to trigger refresh
    const interval = setInterval(() => {
      onRefresh()
    }, refreshInterval * 1000)

    // Update countdown every second
    const countdownInterval = setInterval(() => {
      if (lastUpdated) {
        const elapsed = Math.floor((Date.now() - lastUpdated.getTime()) / 1000)
        const remaining = Math.max(0, refreshInterval - elapsed)
        setTimeUntilRefresh(remaining)
      }
    }, 1000)

    return () => {
      clearInterval(interval)
      clearInterval(countdownInterval)
    }
  }, [refreshInterval, isPaused, onRefresh, lastUpdated])

  function togglePause() {
    setIsPaused(!isPaused)
  }

  function formatTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

    if (seconds < 60) {
      return `${seconds}s ago`
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60)
      return `${minutes}m ago`
    } else {
      const hours = Math.floor(seconds / 3600)
      return `${hours}h ago`
    }
  }

  function formatCountdown(seconds: number): string {
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      return `${hours}h ${minutes}m`
    } else if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${minutes}m ${secs}s`
    } else {
      return `${seconds}s`
    }
  }

  const currentOption = REFRESH_OPTIONS.find((opt) => opt.value === refreshInterval)

  return (
    <div className="flex items-center space-x-2">
      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-xs text-muted-foreground flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <span>Updated {formatTimeAgo(lastUpdated)}</span>
        </div>
      )}

      {/* Countdown */}
      {refreshInterval > 0 && !isPaused && timeUntilRefresh > 0 && (
        <div className="text-xs text-muted-foreground">
          Next: {formatCountdown(timeUntilRefresh)}
        </div>
      )}

      {/* Pause/Resume */}
      {refreshInterval > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={togglePause}
          className="h-8 w-8 p-0"
          title={isPaused ? 'Resume auto-refresh' : 'Pause auto-refresh'}
        >
          {isPaused ? (
            <Play className="h-4 w-4" />
          ) : (
            <Pause className="h-4 w-4" />
          )}
        </Button>
      )}

      {/* Manual Refresh Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="h-8 w-8 p-0"
        title="Refresh now"
      >
        <RefreshCw
          className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
        />
      </Button>

      {/* Refresh Interval Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <Clock className="h-3 w-3 mr-2" />
            {currentOption?.label || 'Off'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Auto-refresh interval</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {REFRESH_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onRefreshIntervalChange(option.value)}
              className={cn(
                'cursor-pointer',
                refreshInterval === option.value && 'bg-accent'
              )}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
