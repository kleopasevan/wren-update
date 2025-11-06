"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useParams } from "next/navigation"
import {
  Home,
  PieChart,
  Database,
  History,
  BookmarkIcon,
  Clock,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface AppSidebarProps {
  isOpen?: boolean
  onToggle?: () => void
  workspaces?: { id: string; name: string }[]
  dashboards?: { id: string; name: string }[]
  connections?: { id: string; name: string }[]
}

export function AppSidebar({
  isOpen = true,
  onToggle,
  workspaces = [],
  dashboards = [],
  connections = []
}: AppSidebarProps) {
  const pathname = usePathname()
  const params = useParams()
  const workspaceId = params?.id as string | undefined

  const [dashboardsExpanded, setDashboardsExpanded] = useState(true)
  const [connectionsExpanded, setConnectionsExpanded] = useState(false)

  const baseNavigationItems = [
    { icon: Home, label: "Workspaces", href: "/workspaces", badge: null },
  ]

  // Workspace-specific navigation (only shown when inside a workspace)
  const workspaceNavigationItems = workspaceId ? [
    { icon: PieChart, label: "Dashboards", href: `/workspaces/${workspaceId}`, badge: dashboards?.length?.toString() || null },
    { icon: History, label: "Query History", href: `/workspaces/${workspaceId}/query-history`, badge: null },
    { icon: BookmarkIcon, label: "Saved Queries", href: `/workspaces/${workspaceId}/saved-queries`, badge: null },
    { icon: Clock, label: "Scheduled Queries", href: `/workspaces/${workspaceId}/scheduled-queries`, badge: null },
    { icon: Database, label: "Connections", href: `/workspaces/${workspaceId}`, badge: connections?.length?.toString() || null },
  ] : []

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-sidebar transition-transform duration-300",
        !isOpen && "-translate-x-full",
      )}
    >
      {/* Logo Header */}
      <div className="flex items-center gap-2 border-b border-sidebar-border p-4">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-[#ff5001]">
          <span className="text-lg font-bold text-white">D</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-[#ff5001]">DataAsk</span>
          <span className="text-xs text-muted-foreground">v1.0.0</span>
        </div>
        <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={onToggle}>
          <ChevronsUpDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        {/* Base Navigation */}
        <div className="space-y-1">
          {baseNavigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (!workspaceId && pathname.startsWith(item.href))

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 text-sm font-normal",
                    isActive && "bg-[#ff5001] text-white hover:bg-[#ff5001]/90 hover:text-white",
                  )}
                >
                  <Icon className={cn("h-4 w-4")} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs",
                        isActive ? "bg-white/20 text-white" : "bg-muted",
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Button>
              </Link>
            )
          })}
        </div>

        {/* Workspace Navigation (shown when inside a workspace) */}
        {workspaceId && (
          <>
            <div className="mt-4 mb-2 px-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Workspace
              </p>
            </div>

            <div className="space-y-1">
              {workspaceNavigationItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href ||
                  (item.label === "Connections" && pathname.startsWith(`/workspaces/${workspaceId}/connections`))

                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 text-sm font-normal",
                        isActive && "bg-[#ff5001] text-white hover:bg-[#ff5001]/90 hover:text-white",
                      )}
                    >
                      <Icon className={cn("h-4 w-4")} />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs",
                            isActive ? "bg-white/20 text-white" : "bg-muted",
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Button>
                  </Link>
                )
              })}
            </div>

            {/* Dashboards List */}
            {dashboards && dashboards.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setDashboardsExpanded(!dashboardsExpanded)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-accent rounded-md"
                >
                  {dashboardsExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span>Your Dashboards</span>
                </button>

                {dashboardsExpanded && (
                  <div className="mt-1 space-y-0.5 pl-2">
                    {dashboards.map((dashboard) => {
                      const isActive = pathname.includes(dashboard.id)
                      return (
                        <Link key={dashboard.id} href={`/workspaces/${workspaceId}/dashboards/${dashboard.id}`}>
                          <button
                            className={cn(
                              "w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent transition-colors",
                              isActive && "bg-accent",
                            )}
                          >
                            {dashboard.name}
                          </button>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Connections List */}
            {connections && connections.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setConnectionsExpanded(!connectionsExpanded)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-accent rounded-md"
                >
                  {connectionsExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span>Connections</span>
                </button>

                {connectionsExpanded && (
                  <div className="mt-1 space-y-0.5 pl-2">
                    {connections.map((connection) => (
                      <button
                        key={connection.id}
                        className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Database className="h-3 w-3" />
                          <span className="truncate">{connection.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </nav>

      {/* User Profile Footer */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-[#ff5001] text-white">U</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium">User</p>
            <p className="text-xs text-muted-foreground truncate">user@dataask.io</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggle}>
            <ChevronsUpDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
