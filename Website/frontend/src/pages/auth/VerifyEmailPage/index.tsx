"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Mail, CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react"

import { AuthLayout } from "@/components/templates/AuthLayout"
import { Button } from "@/components/atoms/Button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

type VerificationStatus = "pending" | "verifying" | "success" | "error" | "expired"

export function VerifyEmailPage() {
  const [status, setStatus] = useState<VerificationStatus>("pending")
  const [isResending, setIsResending] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const email = searchParams.get("email") || ""
  const token = searchParams.get("token")

  useEffect(() => {
    if (token) {
      verifyEmail(token)
    }
  }, [token])

  const verifyEmail = async (verificationToken: string) => {
    setStatus("verifying")

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock verification logic
      if (verificationToken === "valid-token") {
        setStatus("success")
        toast({
          title: "Email verified successfully!",
          description: "Your account is now active. You can sign in.",
        })

        // Redirect to login after a delay
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      } else if (verificationToken === "expired-token") {
        setStatus("expired")
      } else {
        setStatus("error")
      }
    } catch (error) {
      setStatus("error")
    }
  }

  const resendVerification = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please provide your email address to resend verification.",
        variant: "destructive",
      })
      return
    }

    setIsResending(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Verification email sent!",
        description: "Please check your email for the new verification link.",
      })
    } catch (error) {
      toast({
        title: "Failed to resend",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsResending(false)
    }
  }

  const renderContent = () => {
    switch (status) {
      case "verifying":
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Verifying your email...</h2>
              <p className="text-muted-foreground">Please wait while we verify your email address.</p>
            </div>
          </div>
        )

      case "success":
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-success">Email verified successfully!</h2>
              <p className="text-muted-foreground">
                Your account is now active. You'll be redirected to sign in shortly.
              </p>
            </div>

            <Button asChild className="w-full">
              <Link href="/login">Continue to sign in</Link>
            </Button>
          </div>
        )

      case "error":
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-destructive">Verification failed</h2>
              <p className="text-muted-foreground">The verification link is invalid or has already been used.</p>
            </div>

            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>If you continue to have problems, please contact our support team.</AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button onClick={resendVerification} disabled={isResending || !email} className="w-full">
                {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <RefreshCw className="mr-2 h-4 w-4" />
                Resend verification email
              </Button>

              <Button variant="outline" asChild className="w-full bg-transparent">
                <Link href="/register">Create new account</Link>
              </Button>
            </div>
          </div>
        )

      case "expired":
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-warning" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-warning">Link expired</h2>
              <p className="text-muted-foreground">This verification link has expired. Please request a new one.</p>
            </div>

            <Button onClick={resendVerification} disabled={isResending || !email} className="w-full">
              {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <RefreshCw className="mr-2 h-4 w-4" />
              Send new verification email
            </Button>
          </div>
        )

      default:
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Verify your email address</h2>
              <p className="text-muted-foreground">We've sent a verification link to your email address.</p>
              {email && <p className="font-medium">{email}</p>}
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Click the link in your email to verify your account. If you don't see it, check your spam folder.
              </p>

              <Button
                onClick={resendVerification}
                disabled={isResending || !email}
                variant="outline"
                className="w-full bg-transparent"
              >
                {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <RefreshCw className="mr-2 h-4 w-4" />
                Resend verification email
              </Button>
            </div>

            <div className="pt-4">
              <Link href="/login" className="text-sm text-primary hover:text-primary/80">
                Back to sign in
              </Link>
            </div>
          </div>
        )
    }
  }

  return (
    <AuthLayout
      title="Email Verification"
      subtitle="Complete your account setup"
      showBackButton={status !== "verifying"}
    >
      {renderContent()}
    </AuthLayout>
  )
}
