"use client"

import { PanelLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SidebarToggleProps {
  isOpen?: boolean
  onClick: () => void
}

export function SidebarToggle({ isOpen = true, onClick }: SidebarToggleProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn(
        "fixed top-4 z-50 h-10 w-10 rounded-lg hover:bg-gray-100 active:bg-[#ff5001] active:text-white transition-all duration-300",
        isOpen ? "left-[272px]" : "left-4"
      )}
      aria-label="Toggle sidebar"
    >
      <PanelLeft className="h-6 w-6" />
    </Button>
  )
}
