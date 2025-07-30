import type React from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/atoms/Button"
import { ThemeToggle } from "@/components/ui/theme-toggle"

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  showBackButton?: boolean
}

export function AuthLayout({ children, title, subtitle, showBackButton = false }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-primary" />
              <span className="text-xl font-bold">VitaTrack</span>
            </div>
            <ThemeToggle />
          </div>

          {/* Back button */}
          {showBackButton && (
            <div className="mb-6">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/" className="inline-flex items-center">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Link>
              </Button>
            </div>
          )}

          {/* Title */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
          </div>

          {/* Content */}
          {children}
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-8 bg-muted/30">
        <div className="mx-auto max-w-md text-center">
          <div className="mb-8">
            <div className="mx-auto h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <div className="h-12 w-12 rounded-full bg-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Transform Your Health Journey</h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of users who are achieving their health and nutrition goals with VitaTrack.
            </p>
          </div>

          <div className="space-y-4 text-left">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Track Everything</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor your nutrition, exercise, and health metrics in one place.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div>
                <h3 className="font-semibold">AI-Powered Insights</h3>
                <p className="text-sm text-muted-foreground">
                  Get personalized recommendations based on your goals and progress.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Community Support</h3>
                <p className="text-sm text-muted-foreground">
                  Connect with others on similar health journeys for motivation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
