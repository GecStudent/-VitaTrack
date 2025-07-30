import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/utils/helpers"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 flex items-start gap-3",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border",
        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        warning: "bg-yellow-100 text-yellow-900 border-yellow-200 dark:bg-yellow-800 dark:text-yellow-100 dark:border-yellow-700",
        error: "bg-red-100 text-red-900 border-red-200 dark:bg-red-800 dark:text-red-100 dark:border-red-700",
        info: "bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-800 dark:text-blue-100 dark:border-blue-700",
        success: "bg-green-100 text-green-900 border-green-200 dark:bg-green-800 dark:text-green-100 dark:border-green-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  icon?: React.ReactNode
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, icon, children, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {icon && (
        <span className="mt-0.5 flex-shrink-0 text-xl leading-none" aria-hidden="true">{icon}</span>
      )}
      <div className="flex-1">{children}</div>
    </div>
  )
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props} />
  ),
)
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
  ),
)
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
