"use client"

import type React from "react"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { X, Home, Utensils, Activity, Target, TrendingUp, Users, Settings, HelpCircle } from "lucide-react"

import { Button } from "@/components/atoms/Button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/utils/helpers"

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
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
      },
      {
        name: "Exercise",
        href: "/exercise",
        icon: Activity,
      },
      {
        name: "Goals",
        href: "/goals",
        icon: Target,
        badge: "3",
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
      },
    ],
  },
]

const bottomNavigation: NavigationItem[] = [
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    name: "Help & Support",
    href: "/help",
    icon: HelpCircle,
  },
]

interface MobileNavigationProps {
  open: boolean
  onClose: () => void
  className?: string
}

export function MobileNavigation({ open, onClose, className }: MobileNavigationProps) {
  const pathname = usePathname()

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    if (open) {
      document.addEventListener("keydown", handleEscape)
      // Prevent body scroll when menu is open
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [open, onClose])

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href
    }
    return pathname.startsWith(href)
  }


  return (
    <div className={cn(
      "fixed inset-0 z-50 md:hidden",
      !open && "pointer-events-none", // This prevents interaction when closed
      className
    )}>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-background/40 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={cn(
        "fixed inset-y-0 left-0 w-full max-w-sm bg-background shadow-lg transform transition-transform duration-300 ease-in-out",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            <Link href="/dashboard" className="flex items-center gap-2" onClick={onClose}>
              <div className="h-8 w-8 rounded-full bg-primary" />
              <span className="text-lg font-semibold">VitaTrack</span>
            </Link>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close menu">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-4">
            <nav className="space-y-6 py-4" role="navigation" aria-label="Mobile navigation">
              {navigation.map((group) => (
                <div key={group.name}>
                  <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.name}
                  </h3>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const active = isActive(item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                            active && "bg-accent text-accent-foreground",
                          )}
                          aria-current={active ? "page" : undefined}
                        >
                          <item.icon className={cn("h-4 w-4 flex-shrink-0", active && "text-primary")} />
                          <span className="flex-1">{item.name}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </ScrollArea>

          {/* Bottom Navigation */}
          <div className="border-t p-4">
            <div className="space-y-1">
              {bottomNavigation.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                      active && "bg-accent text-accent-foreground",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <item.icon className={cn("h-4 w-4 flex-shrink-0", active && "text-primary")} />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
