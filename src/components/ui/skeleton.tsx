import * as React from "react"
import { cn } from "@/lib/utils"

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "text" | "circular" | "rectangular"
    width?: string | number
    height?: string | number
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
    ({ className, variant = "rectangular", width, height, style, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "bg-muted animate-skeleton",
                    {
                        "rounded-md": variant === "rectangular",
                        "rounded-full": variant === "circular",
                        "rounded h-4": variant === "text",
                    },
                    className
                )}
                style={{
                    width: width,
                    height: height,
                    ...style,
                }}
                {...props}
            />
        )
    }
)
Skeleton.displayName = "Skeleton"

// Preset skeleton patterns
const SkeletonCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn("space-y-3", className)}
                {...props}
            >
                <Skeleton variant="rectangular" height={120} className="w-full" />
                <Skeleton variant="text" className="w-3/4" />
                <Skeleton variant="text" className="w-1/2" />
            </div>
        )
    }
)
SkeletonCard.displayName = "SkeletonCard"

const SkeletonList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { count?: number }>(
    ({ className, count = 3, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn("space-y-4", className)}
                {...props}
            >
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                        <Skeleton variant="circular" width={40} height={40} />
                        <div className="flex-1 space-y-2">
                            <Skeleton variant="text" className="w-3/4" />
                            <Skeleton variant="text" className="w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }
)
SkeletonList.displayName = "SkeletonList"

export { Skeleton, SkeletonCard, SkeletonList }
