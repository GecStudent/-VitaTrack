"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/atoms/Button"
import { useToast } from "@/hooks/use-toast"

interface SocialProvider {
  id: string
  name: string
  icon: string
  color: string
}

const socialProviders: SocialProvider[] = [
  {
    id: "google",
    name: "Google",
    icon: "🔍",
    color: "hover:bg-red-50 hover:border-red-200",
  },
  {
    id: "apple",
    name: "Apple",
    icon: "🍎",
    color: "hover:bg-gray-50 hover:border-gray-200",
  },
]

export function SocialAuthButtons() {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSocialAuth = async (providerId: string) => {
    setLoadingProvider(providerId)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock social auth (for demo purposes)
      toast({
        title: "Social authentication",
        description: `${providerId} authentication would be implemented here.`,
      })
    } catch (error) {
      toast({
        title: "Authentication failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingProvider(null)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {socialProviders.map((provider) => (
        <Button
          key={provider.id}
          variant="outline"
          onClick={() => handleSocialAuth(provider.id)}
          disabled={loadingProvider !== null}
          className={`relative ${provider.color}`}
        >
          {loadingProvider === provider.id ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <span className="mr-2 text-lg">{provider.icon}</span>
          )}
          {provider.name}
        </Button>
      ))}
    </div>
  )
}
