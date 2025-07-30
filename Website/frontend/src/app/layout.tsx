import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"

import { Providers } from "@/components/providers"

import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "VitaTrack - Health & Nutrition Tracking",
    template: "%s | VitaTrack",
  },
  description:
    "Track your nutrition, exercise, and health goals with VitaTrack. AI-powered insights, meal planning, and comprehensive health analytics.",
  keywords: ["nutrition tracking", "health app", "calorie counter", "meal planning", "fitness tracker", "diet app"],
  authors: [{ name: "VitaTrack Team" }],
  creator: "VitaTrack",
  publisher: "VitaTrack",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://vitatrack.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://vitatrack.com",
    title: "VitaTrack - Health & Nutrition Tracking",
    description:
      "Track your nutrition, exercise, and health goals with VitaTrack. AI-powered insights, meal planning, and comprehensive health analytics.",
    siteName: "VitaTrack",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "VitaTrack - Health & Nutrition Tracking",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VitaTrack - Health & Nutrition Tracking",
    description: "Track your nutrition, exercise, and health goals with VitaTrack.",
    images: ["/twitter-image.jpg"],
    creator: "@vitatrackapp",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10b981" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
