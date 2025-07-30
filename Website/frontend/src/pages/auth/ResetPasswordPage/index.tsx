"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2, Eye, EyeOff, Lock } from "lucide-react"
import { z } from "zod"

import { AuthLayout } from "@/components/templates/AuthLayout"
import { Button } from "@/components/atoms/Button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"

const resetRequestSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
})

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type ResetRequestFormData = z.infer<typeof resetRequestSchema>
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

const passwordRequirements = [
  { regex: /.{8,}/, text: "At least 8 characters" },
  { regex: /[A-Z]/, text: "One uppercase letter" },
  { regex: /[a-z]/, text: "One lowercase letter" },
  { regex: /[0-9]/, text: "One number" },
  { regex: /[^A-Za-z0-9]/, text: "One special character" },
]

export function ResetPasswordPage() {
  const [step, setStep] = useState<"request" | "sent" | "reset">("request")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Check if we have a reset token in the URL
  const token = searchParams.get("token")
  const initialStep = token ? "reset" : "request"

  const requestForm = useForm<ResetRequestFormData>({
    resolver: zodResolver(resetRequestSchema),
  })

  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const password = resetForm.watch("password", "")

  const getPasswordStrength = (password: string) => {
    const requirements = passwordRequirements.filter((req) => req.regex.test(password))
    return (requirements.length / passwordRequirements.length) * 100
  }

  const onRequestSubmit = async (data: ResetRequestFormData) => {
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setEmail(data.email)
      setStep("sent")
      toast({
        title: "Reset link sent!",
        description: "Check your email for password reset instructions.",
      })
    } catch (error) {
      requestForm.setError("root", {
        message: "Something went wrong. Please try again later.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const onResetSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Password reset successful!",
        description: "Your password has been updated. You can now sign in.",
      })
      router.push("/login")
    } catch (error) {
      resetForm.setError("root", {
        message: "Something went wrong. Please try again later.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const passwordStrength = getPasswordStrength(password)

  if (step === "sent") {
    return (
      <AuthLayout title="Check your email" subtitle="We've sent a password reset link to your email" showBackButton>
        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>

          <div className="space-y-2">
            <p className="text-muted-foreground">We've sent a password reset link to:</p>
            <p className="font-medium">{email}</p>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or try again.
            </p>

            <Button variant="outline" onClick={() => setStep("request")} className="w-full">
              Try different email
            </Button>

            <Button variant="ghost" onClick={() => onRequestSubmit({ email })} disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Resend email
            </Button>
          </div>

          <div className="pt-4">
            <Link href="/login" className="inline-flex items-center text-sm text-primary hover:text-primary/80">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to sign in
            </Link>
          </div>
        </div>
      </AuthLayout>
    )
  }

  if (step === "reset" || token) {
    return (
      <AuthLayout title="Reset your password" subtitle="Enter your new password below" showBackButton>
        <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-6" noValidate>
          {resetForm.formState.errors.root && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{resetForm.formState.errors.root.message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  className="pl-10 pr-10"
                  autoComplete="new-password"
                  autoFocus
                  {...resetForm.register("password")}
                  aria-invalid={resetForm.formState.errors.password ? "true" : "false"}
                  aria-describedby={
                    resetForm.formState.errors.password
                      ? "password-error password-requirements"
                      : "password-requirements"
                  }
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Password strength:</span>
                    <span
                      className={`font-medium ${
                        passwordStrength < 40
                          ? "text-destructive"
                          : passwordStrength < 80
                            ? "text-warning"
                            : "text-success"
                      }`}
                    >
                      {passwordStrength < 40 ? "Weak" : passwordStrength < 80 ? "Fair" : "Strong"}
                    </span>
                  </div>
                  <Progress value={passwordStrength} className="h-1" />
                </div>
              )}

              <div id="password-requirements" className="space-y-1">
                {passwordRequirements.map((req, index) => (
                  <div key={index} className="flex items-center space-x-2 text-xs">
                    <div
                      className={`w-3 h-3 rounded-full flex items-center justify-center ${
                        req.regex.test(password) ? "bg-success text-white" : "bg-muted"
                      }`}
                    >
                      {req.regex.test(password) && <CheckCircle className="w-2 h-2" />}
                    </div>
                    <span className={req.regex.test(password) ? "text-success" : "text-muted-foreground"}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>

              {resetForm.formState.errors.password && (
                <p id="password-error" className="text-sm text-destructive" role="alert">
                  {resetForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your new password"
                  className="pl-10 pr-10"
                  autoComplete="new-password"
                  {...resetForm.register("confirmPassword")}
                  aria-invalid={resetForm.formState.errors.confirmPassword ? "true" : "false"}
                  aria-describedby={resetForm.formState.errors.confirmPassword ? "confirm-password-error" : undefined}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {resetForm.formState.errors.confirmPassword && (
                <p id="confirm-password-error" className="text-sm text-destructive" role="alert">
                  {resetForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={resetForm.formState.isSubmitting || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reset password
          </Button>
        </form>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email address and we'll send you a reset link"
      showBackButton
    >
      <form onSubmit={requestForm.handleSubmit(onRequestSubmit)} className="space-y-6" noValidate>
        {requestForm.formState.errors.root && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{requestForm.formState.errors.root.message}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="pl-10"
              autoComplete="email"
              autoFocus
              {...requestForm.register("email")}
              aria-invalid={requestForm.formState.errors.email ? "true" : "false"}
              aria-describedby={requestForm.formState.errors.email ? "email-error" : undefined}
            />
          </div>
          {requestForm.formState.errors.email && (
            <p id="email-error" className="text-sm text-destructive" role="alert">
              {requestForm.formState.errors.email.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={requestForm.formState.isSubmitting || isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send reset link
        </Button>

        <div className="text-center">
          <Link href="/login" className="inline-flex items-center text-sm text-primary hover:text-primary/80">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}
