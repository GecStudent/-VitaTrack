"use client"

import type React from "react"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { useState } from "react"


import { DashboardSidebar } from "../DashboardSidebar"
import { DashboardHeader } from "../DashboardHeader"
import { Breadcrumbs } from "../Breadcrumbs"
import { MobileNavigation } from "../MobileNavigation"
import { NotificationArea } from "../NotificationArea"
import { QuickActions } from "../QuickActions"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useDashboardLayout } from "@/hooks/use-dashboard-layout"
import { cn } from "@/utils/helpers"

interface DashboardLayoutProps {
  children: React.ReactNode
}
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const pathname = usePathname()
  const isMobile = useMediaQuery("(max-width: 768.98px)")
  const { sidebarOpen, sidebarCollapsed, mobileMenuOpen, setSidebarOpen, setSidebarCollapsed, setMobileMenuOpen } =
    useDashboardLayout()

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname, setMobileMenuOpen])


  
  // Auto-collapse sidebar on mobile
  useEffect(() => {
    
    setIsInitialized(true)
    
    if (isMobile) {
      setSidebarOpen(false)
    } else {
      setSidebarOpen(true)
    }
  }, [isMobile, setSidebarOpen])
  
  if (!isInitialized) {
    return null // or a loading spinner
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Navigation Overlay */}
      {isMobile && mobileMenuOpen && (
        <div
        className="fixed inset-0 z-50 bg-background/40 backdrop-blur-[0.5px] md:hidden"
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />
      )}

      {/* Sidebar */}
      <DashboardSidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        className={cn(
          "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out",
          isMobile && !mobileMenuOpen && "-translate-x-full",
        )}
      />

      {/* Mobile Navigation */}
      <MobileNavigation open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} className="md:hidden" />

      {/* Main Content Area */}
      <div
        className={cn(
          "flex flex-col transition-all duration-300 ease-in-out",
          !isMobile && sidebarOpen && !sidebarCollapsed && "ml-64",
          !isMobile && sidebarOpen && sidebarCollapsed && "ml-16",
          isMobile && "ml-0", // Explicitly set for mobile
        )}
        style={
          {
            '--sidebar-width': !isMobile && sidebarOpen && !sidebarCollapsed ? '256px' :
              !isMobile && sidebarOpen && sidebarCollapsed ? '64px' : '0px'
          } as React.CSSProperties
        }
      >
        {/* Header */}
        <DashboardHeader
          onMenuClick={() => setMobileMenuOpen(true)}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          sidebarCollapsed={sidebarCollapsed}
          className="sticky top-0 z-40"
        />

        {/* Breadcrumbs */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container py-3">
            <Breadcrumbs />
          </div>
        </div>

        {/* Notification Area */}
        <NotificationArea />

        {/* Main Content */}
        <main
          className="flex-1 container py-6"
          role="main"
          aria-label="Dashboard content"
          tabIndex={-1}
          id="main-content"
        >
          {children}
        </main>

        {/* Quick Actions (Floating) */}
        <QuickActions className="fixed bottom-6 right-6 z-30" />
      </div>

      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:font-medium"
      >
        Skip to main content
      </a>
    </div>
  )
}
