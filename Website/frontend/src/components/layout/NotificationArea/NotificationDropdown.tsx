import React, { useState, useRef, useEffect } from "react"
import { Bell, CheckCircle, Info, AlertTriangle, XCircle, Goal } from "lucide-react"
import { Button } from "@/components/atoms/Button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/utils/helpers"

const mockNotifications = [
  {
    id: "1",
    type: "success",
    title: "Goal reached!",
    message: "You hit your daily step goal.",
    time: "5 min ago",
    read: false,
    icon: <Goal className="h-5 w-5 text-green-500" />,
  },
  {
    id: "2",
    type: "info",
    title: "New update available",
    message: "Check out the new meal planner feature.",
    time: "1 hr ago",
    read: false,
    icon: <Info className="h-5 w-5 text-blue-500" />,
  },
  {
    id: "3",
    type: "warning",
    title: "Sync Issue",
    message: "Some data may not be up to date.",
    time: "2 hr ago",
    read: true,
    icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  },
  {
    id: "4",
    type: "error",
    title: "Failed to log food",
    message: "Please try again later.",
    time: "Yesterday",
    read: true,
    icon: <XCircle className="h-5 w-5 text-red-500" />,
  },
]

export function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState(mockNotifications)
  const [prevUnreadCount, setPrevUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  // Track previous unread count for animation
  useEffect(() => {
    setPrevUnreadCount(unreadCount)
  }, [unreadCount])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    } else {
      document.removeEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  // Mark a single notification as read
  const markOneAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    setOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className={cn(
              "absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center min-w-[20px] transition-all duration-300",
              prevUnreadCount > unreadCount ? "animate-fadeOut" : "animate-fadeIn"
            )}
            style={{
              opacity: unreadCount === 0 ? 0 : 1,
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>
      {open && (
        <div
          className={cn(
            "absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-border z-50",
            "animate-in fade-in-0 zoom-in-95"
          )}
        >
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold pr-2">Notifications</h3>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
              >
                Mark all read
              </Button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto p-2 space-y-2">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  className={cn(
                    "w-full flex items-start gap-3 text-left p-3 rounded-lg hover:bg-accent transition-colors",
                    !notification.read && "bg-muted/50"
                  )}
                  onClick={() => markOneAsRead(notification.id)}
                >
                  {notification.icon}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{notification.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {notification.time}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 