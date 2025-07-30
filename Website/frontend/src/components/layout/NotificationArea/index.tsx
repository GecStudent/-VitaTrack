"use client"

import { useState, useEffect } from "react"
import { X, Info, CheckCircle, AlertTriangle, XCircle } from "lucide-react"

import { Button } from "@/components/atoms/Button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/utils/helpers"

interface SystemNotification {
  id: string
  type: "info" | "success" | "warning" | "error"
  title: string
  message: string
  dismissible?: boolean
  autoHide?: boolean
  duration?: number
}

const mockNotifications: SystemNotification[] = [
  {
    id: "1",
    type: "info",
    title: "New Feature Available",
    message: "Check out our new meal planning feature in the Food Log section!",
    dismissible: true,
  },
  {
    id: "2",
    type: "warning",
    title: "Sync Issue",
    message: "Some data may not be up to date. We're working to resolve this.",
    dismissible: true,
  },
]

const iconMap = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
}

const variantMap = {
  info: "default",
  success: "default",
  warning: "default",
  error: "destructive",
} as const

export function NotificationArea() {
  const [notifications, setNotifications] = useState<SystemNotification[]>([])

  useEffect(() => {
    // Simulate loading notifications
    const timer = setTimeout(() => {
      setNotifications(mockNotifications)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Auto-hide notifications
    notifications.forEach((notification) => {
      if (notification.autoHide) {
        const timer = setTimeout(() => {
          dismissNotification(notification.id)
        }, notification.duration || 5000)

        return () => clearTimeout(timer)
      }
    })
  }, [notifications])

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  if (notifications.length === 0) {
    return null
  }

  return (
    <div className="border-b bg-muted/30">
      <div className="container py-2 space-y-2">
        {notifications.map((notification) => {
          const Icon = iconMap[notification.type]
          return (
            <Alert
              key={notification.id}
              variant={variantMap[notification.type]}
              className={cn(
                "relative pr-12",
                notification.type === "success" &&
                  "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200",
                notification.type === "warning" &&
                  "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
                notification.type === "info" &&
                  "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
              )}
            >
              <Icon className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">{notification.title}</span>
                {notification.message && (
                  <>
                    <br />
                    <span className="text-sm">{notification.message}</span>
                  </>
                )}
              </AlertDescription>
              {notification.dismissible && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-6 w-6 hover:bg-transparent"
                  onClick={() => dismissNotification(notification.id)}
                  aria-label="Dismiss notification"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </Alert>
          )
        })}
      </div>
    </div>
  )
}
