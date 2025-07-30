"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  food: "Food Log",
  exercise: "Exercise",
  goals: "Goals",
  progress: "Progress",
  community: "Community",
  settings: "Settings",
  profile: "Profile",
  help: "Help & Support",
  add: "Add",
  edit: "Edit",
}

export function Breadcrumbs() {
  const pathname = usePathname()

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split("/").filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []

    // Always start with Dashboard
    if (segments[0] !== "dashboard") {
      breadcrumbs.push({
        label: "Dashboard",
        href: "/dashboard",
      })
    }

    // Build breadcrumbs from path segments
    segments.forEach((segment, index) => {
      const href = "/" + segments.slice(0, index + 1).join("/")
      const isLast = index === segments.length - 1
      const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)

      breadcrumbs.push({
        label,
        href: isLast ? undefined : href,
        current: isLast,
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  if (breadcrumbs.length <= 1) {
    return null
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-sm text-muted-foreground">
      <Link
        href="/dashboard"
        className="flex items-center hover:text-foreground transition-colors"
        aria-label="Go to dashboard"
      >
        <Home className="h-4 w-4" />
      </Link>

      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          {item.current ? (
            <span className="font-medium text-foreground" aria-current="page">
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href!}
              className="hover:text-foreground transition-colors"
              aria-label={`Go to ${item.label}`}
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
