"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Plus, Utensils, Activity, Target, MessageSquare, X } from "lucide-react"

import { Button } from "@/components/atoms/Button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/utils/helpers"

interface QuickAction {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

const quickActions: QuickAction[] = [
  {
    name: "Log Meal",
    href: "/food/add",
    icon: Utensils,
    color: "bg-orange-500 hover:bg-orange-600",
  },
  {
    name: "Log Exercise",
    href: "/exercise/add",
    icon: Activity,
    color: "bg-blue-500 hover:bg-blue-600",
  },
  {
    name: "Create Goal",
    href: "/goals/add",
    icon: Target,
    color: "bg-green-500 hover:bg-green-600",
  },
  {
    name: "Send Feedback",
    href: "/feedback",
    icon: MessageSquare,
    color: "bg-purple-500 hover:bg-purple-600",
  },
]

interface QuickActionsProps {
  className?: string
}

export function QuickActions({ className }: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <TooltipProvider>
      <div className={cn("fixed bottom-6 right-6 z-50", className)}>
        {/* Backdrop overlay when open */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black/10 backdrop-blur-[0.7px] transition-opacity duration-300 ease-in-out"
            onClick={() => setIsOpen(false)}
            style={{ zIndex: -1 }}
          />
        )}

        {/* Quick Action Buttons Container */}
        <div className="relative flex flex-col items-end">
          {/* Action Buttons */}
          <div
            className={cn(
              "flex flex-col-reverse items-center gap-4 mb-4 transition-all duration-500 ease-out",
              isOpen 
                ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" 
                : "opacity-0 translate-y-8 scale-95 pointer-events-none",
            )}
          >
            {quickActions.map((action, index) => (
              <div
                key={action.name}
                className={cn(
                  "transition-all duration-300 ease-out",
                  isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
                style={{
                  transitionDelay: isOpen 
                    ? `${index * 80}ms` 
                    : `${(quickActions.length - index - 1) * 50}ms`,
                }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      asChild
                      size="icon"
                      className={cn(
                        "h-12 w-12 rounded-full shadow-lg transition-all duration-200 ease-in-out",
                        action.color,
                        "transform hover:scale-110 hover:shadow-xl",
                        "focus:outline-none focus:ring-2 focus:ring-white/50",
                        "active:scale-95"
                      )}
                    >
                      <Link 
                        href={action.href} 
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-center"
                      >
                        <action.icon className="h-5 w-5 text-white" />
                        <span className="sr-only">{action.name}</span>
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="mr-2">
                    <p>{action.name}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            ))}
          </div>

          {/* Main Toggle Button */}
          <Button
            size="icon"
            className={cn(
              "h-14 w-14 rounded-full shadow-lg transition-all duration-300 ease-in-out",
              "bg-primary hover:bg-primary/90 transform hover:scale-110 hover:shadow-xl",
              "focus:outline-none focus:ring-2 focus:ring-primary/50",
              "active:scale-95",
              isOpen && "rotate-45"
            )}
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close quick actions" : "Open quick actions"}
            aria-expanded={isOpen}
          >
            <div className="relative">
              <Plus 
                className={cn(
                  "h-6 w-6 transition-all duration-200 ease-in-out",
                  isOpen ? "opacity-0 rotate-45" : "opacity-100 rotate-0"
                )} 
              />
              <X 
                className={cn(
                  "h-6 w-6 absolute inset-0 transition-all duration-200 ease-in-out",
                  isOpen ? "opacity-100 rotate-0" : "opacity-0 -rotate-45"
                )} 
              />
            </div>
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}