import type { Metadata } from "next"

import { LandingPage } from "@/pages/public/LandingPage"

export const metadata: Metadata = {
  title: "VitaTrack - Your Personal Health & Nutrition Companion",
  description:
    "Transform your health journey with VitaTrack. Track nutrition, plan meals, monitor exercise, and achieve your wellness goals with AI-powered insights.",
}

export default function Home() {
  return <LandingPage />
}
