import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: boolean
    showCount?: boolean
    maxLength?: number
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, error, showCount, maxLength, value, ...props }, ref) => {
        const [charCount, setCharCount] = React.useState(
            typeof value === 'string' ? value.length : 0
        )

        const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setCharCount(e.target.value.length)
            props.onChange?.(e)
        }

        return (
            <div className="relative">
                <textarea
                    ref={ref}
                    className={cn(
                        "flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-base",
                        "placeholder:text-muted-foreground",
                        "focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        "resize-y",
                        error && "border-red-500 focus:ring-red-500",
                        className
                    )}
                    maxLength={maxLength}
                    value={value}
                    onChange={handleChange}
                    {...props}
                />
                {showCount && maxLength && (
                    <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                        {charCount}/{maxLength}
                    </div>
                )}
            </div>
        )
    }
)
Textarea.displayName = "Textarea"

export { Textarea }
