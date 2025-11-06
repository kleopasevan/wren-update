"use client"

import { useState } from "react"
import { AppSidebar } from "./app-sidebar"
import { SidebarToggle } from "./sidebar-toggle"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen relative">
      <AppSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      {sidebarOpen && (
        <SidebarToggle onClick={() => setSidebarOpen(!sidebarOpen)} />
      )}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}

