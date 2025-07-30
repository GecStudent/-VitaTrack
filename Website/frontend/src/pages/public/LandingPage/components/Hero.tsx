import Link from "next/link"
import { ArrowRight, Play } from "lucide-react"

import { Button } from "@/components/atoms/Button"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20 sm:py-32">
      <div className="container">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Transform Your Health Journey with <span className="text-primary">VitaTrack</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Track nutrition, plan meals, monitor exercise, and achieve your wellness goals with AI-powered insights and
            personalized recommendations.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild size="lg">
              <Link href="/register">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg">
              <Play className="mr-2 h-4 w-4" />
              Watch Demo
            </Button>
          </div>
          <div className="mt-16">
            <img
              src="/placeholder.svg?height=600&width=1000"
              alt="VitaTrack Dashboard Preview"
              className="mx-auto rounded-xl shadow-2xl ring-1 ring-gray-900/10"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
