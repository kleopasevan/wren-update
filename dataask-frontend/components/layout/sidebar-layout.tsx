"use client"

import { useState } from "react"
import { AppSidebar } from "./app-sidebar"
import { SidebarToggle } from "./sidebar-toggle"

interface SidebarLayoutProps {
  children: React.ReactNode
  workspaces?: { id: string; name: string }[]
  dashboards?: { id: string; name: string }[]
  connections?: { id: string; name: string }[]
}

export function SidebarLayout({ children, workspaces, dashboards, connections }: SidebarLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        workspaces={workspaces}
        dashboards={dashboards}
        connections={connections}
      />

      <SidebarToggle
        isOpen={sidebarOpen}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className={`flex-1 overflow-auto transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {children}
      </main>
    </div>
  )
}
