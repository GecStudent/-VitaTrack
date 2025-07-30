"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Utensils,
  Activity,
  Target,
  TrendingUp,
  Users,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react"

import { Button } from "@/components/atoms/Button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/utils/helpers"

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  description?: string
}

interface NavigationGroup {
  name: string
  items: NavigationItem[]
}

const navigation: NavigationGroup[] = [
  {
    name: "Overview",
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: Home,
        description: "Overview of your health metrics",
      },
    ],
  },
  {
    name: "Tracking",
    items: [
      {
        name: "Food Log",
        href: "/food",
        icon: Utensils,
        description: "Track your meals and nutrition",
      },
      {
        name: "Exercise",
        href: "/exercise",
        icon: Activity,
        description: "Log workouts and activities",
      },
      {
        name: "Goals",
        href: "/goals",
        icon: Target,
        badge: "3",
        description: "Manage your health goals",
      },
    ],
  },
  {
    name: "Analytics",
    items: [
      {
        name: "Progress",
        href: "/progress",
        icon: TrendingUp,
        description: "View your progress over time",
      },
    ],
  },
  {
    name: "Social",
    items: [
      {
        name: "Community",
        href: "/community",
        icon: Users,
        badge: "New",
        description: "Connect with other users",
      },
    ],
  },
]

const bottomNavigation: NavigationItem[] = [
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Account and app settings",
  },
  {
    name: "Help & Support",
    href: "/help",
    icon: HelpCircle,
    description: "Get help and support",
  },
]

interface DashboardSidebarProps {
  open: boolean
  collapsed: boolean
  onToggleCollapse: () => void
  className?: string
}

export function DashboardSidebar({ open, collapsed, onToggleCollapse, className }: DashboardSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const filteredNavigation = navigation.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase())),
  }))

  const NavigationLink = ({ item }: { item: NavigationItem }) => {
    const active = isActive(item.href)

    const linkContent = (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
          active && "bg-accent text-accent-foreground",
          collapsed && "justify-center px-2",
        )}
        aria-current={active ? "page" : undefined}
      >
        <item.icon className={cn("h-4 w-4 flex-shrink-0", active && "text-primary")} />
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.name}</span>
            {item.badge && (
              <Badge variant="secondary" className="ml-auto text-xs">
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </Link>
    )

    if (collapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
            <TooltipContent side="right" className="flex flex-col gap-1">
              <span className="font-medium">{item.name}</span>
              {item.description && <span className="text-xs text-muted-foreground">{item.description}</span>}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return linkContent
  }

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r bg-background transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        !open && "[@media(max-width:768.98px)]:hidden", // Hide on mobile initially
        className,
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center border-b px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary" />
            <span className="text-lg font-semibold">VitaTrack</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="flex items-center justify-center w-full">
            <div className="h-8 w-8 rounded-full bg-primary" />
          </Link>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              aria-label="Search navigation"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4">
        <nav className="space-y-6 py-4" role="navigation" aria-label="Main navigation">
          {filteredNavigation.map((group) => (
            <div key={group.name}>
              {!collapsed && group.items.length > 0 && (
                <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.name}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavigationLink key={item.href} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Bottom Navigation */}
      <div className="border-t p-4">
        <div className="space-y-1">
          {bottomNavigation.map((item) => (
            <NavigationLink key={item.href} item={item} />
          ))}
        </div>
      </div>

      {/* Collapse Toggle */}
      <div className="border-t p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className={cn("w-full", collapsed && "px-2")}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Collapse
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}
