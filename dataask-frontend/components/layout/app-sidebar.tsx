"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Database,
  BarChart3,
  FileText,
  History,
  Calendar,
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/contexts/auth-context"

const navigationItems = [
  { icon: LayoutDashboard, label: "Workspaces", href: "/workspaces", badge: null },
]

interface AppSidebarProps {
  isOpen?: boolean
  onToggle?: () => void
}

export function AppSidebar({ isOpen = true, onToggle }: AppSidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  
  // Extract workspace ID from pathname if we're in a workspace
  const workspaceMatch = pathname.match(/\/workspaces\/([^\/]+)/)
  const workspaceId = workspaceMatch ? workspaceMatch[1] : null

  return (
    <aside
      className={cn(
        "flex h-screen w-64 flex-col border-r border-border bg-sidebar transition-transform duration-300",
        !isOpen && "-translate-x-full md:translate-x-0",
      )}
    >
      {/* Logo Header */}
      <div className="flex items-center gap-2 border-b border-sidebar-border p-4">
        <div className="relative h-8 w-8">
          <div className="h-8 w-8 rounded bg-[#ff5001] flex items-center justify-center">
            <span className="text-white font-bold text-sm">DA</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-[#ff5001]">DataAsk</span>
          <span className="text-xs text-black">v1.0.0</span>
        </div>
        <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={onToggle}>
          <ChevronsUpDown className="h-4 w-4 text-black" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 text-sm font-normal text-black",
                    isActive && "bg-[#ff5001] text-white hover:bg-[#ff5001]/90 hover:text-white",
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-black")} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs",
                        isActive ? "bg-white/20 text-white" : "bg-muted text-black",
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

        {/* Workspace-specific navigation - matches the tabs in workspace detail page */}
        {workspaceId && (
          <div className="mt-6 space-y-1">
            <Link href={`/workspaces/${workspaceId}`}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 text-sm font-normal text-black",
                  pathname === `/workspaces/${workspaceId}` && "bg-[#ff5001] text-white hover:bg-[#ff5001]/90 hover:text-white",
                )}
              >
                <BarChart3 className={cn("h-4 w-4", pathname === `/workspaces/${workspaceId}` ? "text-white" : "text-black")} />
                <span className="flex-1 text-left">Overview</span>
              </Button>
            </Link>
            
            <Link href={`/workspaces/${workspaceId}?tab=connections`}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 text-sm font-normal text-black",
                  pathname === `/workspaces/${workspaceId}` && "bg-[#ff5001] text-white hover:bg-[#ff5001]/90 hover:text-white",
                )}
              >
                <Database className={cn("h-4 w-4", pathname === `/workspaces/${workspaceId}` ? "text-white" : "text-black")} />
                <span className="flex-1 text-left">Connections</span>
              </Button>
            </Link>
            
            <Link href={`/workspaces/${workspaceId}?tab=dashboards`}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 text-sm font-normal text-black",
                  pathname === `/workspaces/${workspaceId}` && "bg-[#ff5001] text-white hover:bg-[#ff5001]/90 hover:text-white",
                )}
              >
                <LayoutDashboard className={cn("h-4 w-4", pathname === `/workspaces/${workspaceId}` ? "text-white" : "text-black")} />
                <span className="flex-1 text-left">Dashboards</span>
              </Button>
            </Link>
            
            <Link href={`/workspaces/${workspaceId}/saved-queries`}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 text-sm font-normal text-black",
                  pathname.startsWith(`/workspaces/${workspaceId}/saved-queries`) && "bg-[#ff5001] text-white hover:bg-[#ff5001]/90 hover:text-white",
                )}
              >
                <FileText className={cn("h-4 w-4", pathname.startsWith(`/workspaces/${workspaceId}/saved-queries`) ? "text-white" : "text-black")} />
                <span className="flex-1 text-left">Saved Queries</span>
              </Button>
            </Link>
            
            <Link href={`/workspaces/${workspaceId}/query-history`}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 text-sm font-normal text-black",
                  pathname.startsWith(`/workspaces/${workspaceId}/query-history`) && "bg-[#ff5001] text-white hover:bg-[#ff5001]/90 hover:text-white",
                )}
              >
                <History className={cn("h-4 w-4", pathname.startsWith(`/workspaces/${workspaceId}/query-history`) ? "text-white" : "text-black")} />
                <span className="flex-1 text-left">Query History</span>
              </Button>
            </Link>
            
            <Link href={`/workspaces/${workspaceId}/scheduled-queries`}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 text-sm font-normal text-black",
                  pathname.startsWith(`/workspaces/${workspaceId}/scheduled-queries`) && "bg-[#ff5001] text-white hover:bg-[#ff5001]/90 hover:text-white",
                )}
              >
                <Calendar className={cn("h-4 w-4", pathname.startsWith(`/workspaces/${workspaceId}/scheduled-queries`) ? "text-white" : "text-black")} />
                <span className="flex-1 text-left">Scheduled Queries</span>
              </Button>
            </Link>
          </div>
        )}
      </nav>

      {/* User Profile Footer */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.email ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}` : undefined} />
            <AvatarFallback className="bg-[#ff5001] text-white">
              {user?.full_name 
                ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                : user?.email 
                ? user.email[0].toUpperCase()
                : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-black">{user?.full_name || user?.email?.split('@')[0] || 'User'}</p>
            <p className="text-xs text-black truncate">{user?.email || ''}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggle}>
            <ChevronsUpDown className="h-4 w-4 text-black" />
          </Button>
        </div>
      </div>
    </aside>
  )
}

