import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: "default" | "success" | "warning" | "destructive" | "outline"
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className, variant = "default", ...props }, ref) => {
        return (
            <span
                ref={ref}
                className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                    {
                        "bg-primary text-primary-foreground": variant === "default",
                        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100": variant === "success",
                        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100": variant === "warning",
                        "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100": variant === "destructive",
                        "border border-input bg-background": variant === "outline",
                    },
                    className
                )}
                {...props}
            />
        )
    }
)
Badge.displayName = "Badge"

export { Badge }
