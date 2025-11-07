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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar"

const navigationItems = [
  { icon: LayoutDashboard, label: "Workspaces", href: "/workspaces", badge: null },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { state } = useSidebar()

  // Extract workspace ID from pathname if we're in a workspace
  const workspaceMatch = pathname.match(/\/workspaces\/([^\/]+)/)
  const workspaceId = workspaceMatch ? workspaceMatch[1] : null

  return (
    <Sidebar>
      {/* Logo Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-transparent">
              <div className="flex items-center gap-2">
                <div className="relative h-8 w-8">
                  <div className="h-8 w-8 rounded bg-[#ff5001] flex items-center justify-center">
                    <span className="text-white font-bold text-sm">DA</span>
                  </div>
                </div>
                <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                  <span className="text-sm font-semibold text-[#ff5001]">DataAsk</span>
                  <span className="text-xs text-sidebar-foreground/70">v1.0.0</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname.startsWith(item.href)

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.label}
                    className={cn(
                      isActive && "bg-[#ff5001] text-white hover:bg-[#ff5001]/90 hover:text-white data-[active=true]:bg-[#ff5001] data-[active=true]:text-white"
                    )}
                  >
                    <Link href={item.href}>
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span
                          className={cn(
                            "ml-auto rounded-full px-2 py-0.5 text-xs",
                            isActive ? "bg-white/20 text-white" : "bg-muted"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>

        {/* Workspace-specific navigation */}
        {workspaceId && (
          <SidebarGroup>
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
              Workspace Menu
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === `/workspaces/${workspaceId}`}
                    tooltip="Overview"
                    className={cn(
                      pathname === `/workspaces/${workspaceId}` && "bg-[#ff5001] text-white hover:bg-[#ff5001]/90 hover:text-white data-[active=true]:bg-[#ff5001] data-[active=true]:text-white"
                    )}
                  >
                    <Link href={`/workspaces/${workspaceId}`}>
                      <BarChart3 className="h-4 w-4" />
                      <span>Overview</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(`/workspaces/${workspaceId}/connections`)}
                    tooltip="Connections"
                    className={cn(
                      pathname.startsWith(`/workspaces/${workspaceId}/connections`) && "bg-[#ff5001] text-white hover:bg-[#ff5001]/90 hover:text-white data-[active=true]:bg-[#ff5001] data-[active=true]:text-white"
                    )}
                  >
                    <Link href={`/workspaces/${workspaceId}/connections`}>
                      <Database className="h-4 w-4" />
                      <span>Connections</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(`/workspaces/${workspaceId}/dashboards`)}
                    tooltip="Dashboards"
                    className={cn(
                      pathname.startsWith(`/workspaces/${workspaceId}/dashboards`) && "bg-[#ff5001] text-white hover:bg-[#ff5001]/90 hover:text-white data-[active=true]:bg-[#ff5001] data-[active=true]:text-white"
                    )}
                  >
                    <Link href={`/workspaces/${workspaceId}/dashboards`}>
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Dashboards</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(`/workspaces/${workspaceId}/saved-queries`)}
                    tooltip="Saved Queries"
                    className={cn(
                      pathname.startsWith(`/workspaces/${workspaceId}/saved-queries`) && "bg-[#ff5001] text-white hover:bg-[#ff5001]/90 hover:text-white data-[active=true]:bg-[#ff5001] data-[active=true]:text-white"
                    )}
                  >
                    <Link href={`/workspaces/${workspaceId}/saved-queries`}>
                      <FileText className="h-4 w-4" />
                      <span>Saved Queries</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(`/workspaces/${workspaceId}/query-history`)}
                    tooltip="Query History"
                    className={cn(
                      pathname.startsWith(`/workspaces/${workspaceId}/query-history`) && "bg-[#ff5001] text-white hover:bg-[#ff5001]/90 hover:text-white data-[active=true]:bg-[#ff5001] data-[active=true]:text-white"
                    )}
                  >
                    <Link href={`/workspaces/${workspaceId}/query-history`}>
                      <History className="h-4 w-4" />
                      <span>Query History</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(`/workspaces/${workspaceId}/scheduled-queries`)}
                    tooltip="Scheduled Queries"
                    className={cn(
                      pathname.startsWith(`/workspaces/${workspaceId}/scheduled-queries`) && "bg-[#ff5001] text-white hover:bg-[#ff5001]/90 hover:text-white data-[active=true]:bg-[#ff5001] data-[active=true]:text-white"
                    )}
                  >
                    <Link href={`/workspaces/${workspaceId}/scheduled-queries`}>
                      <Calendar className="h-4 w-4" />
                      <span>Scheduled Queries</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(`/workspaces/${workspaceId}/settings`)}
                    tooltip="Settings"
                    className={cn(
                      pathname.startsWith(`/workspaces/${workspaceId}/settings`) && "bg-[#ff5001] text-white hover:bg-[#ff5001]/90 hover:text-white data-[active=true]:bg-[#ff5001] data-[active=true]:text-white"
                    )}
                  >
                    <Link href={`/workspaces/${workspaceId}/settings`}>
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* User Profile Footer */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-sidebar-accent">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.email ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}` : undefined} />
                <AvatarFallback className="bg-[#ff5001] text-white text-xs">
                  {user?.full_name
                    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                    : user?.email
                    ? user.email[0].toUpperCase()
                    : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 overflow-hidden group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-medium truncate">{user?.full_name || user?.email?.split('@')[0] || 'User'}</span>
                <span className="text-xs text-sidebar-foreground/70 truncate">{user?.email || ''}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
