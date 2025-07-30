import { Hero } from "./components/Hero"
import { PublicLayout } from "@/components/templates/PublicLayout"

export function LandingPage() {
  return (
    <PublicLayout>
      <div className="page-transition">
        <Hero />
      </div>
    </PublicLayout>
  )
}
