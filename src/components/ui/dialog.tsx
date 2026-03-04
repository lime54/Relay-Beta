'use client'

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface DialogContextValue {
    open: boolean
    setOpen: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined)

const useDialog = () => {
    const context = React.useContext(DialogContext)
    if (!context) {
        throw new Error("Dialog components must be used within a Dialog provider")
    }
    return context
}

// Root Dialog component
interface DialogProps {
    children: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

const Dialog = ({ children, open: controlledOpen, onOpenChange }: DialogProps) => {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : uncontrolledOpen

    const setOpen = React.useCallback((value: boolean) => {
        if (!isControlled) {
            setUncontrolledOpen(value)
        }
        onOpenChange?.(value)
    }, [isControlled, onOpenChange])

    return (
        <DialogContext.Provider value={{ open, setOpen }}>
            {children}
        </DialogContext.Provider>
    )
}

// Trigger to open dialog
interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    asChild?: boolean
}

const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
    ({ children, asChild, onClick, ...props }, ref) => {
        const { setOpen } = useDialog()

        const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
            onClick?.(e)
            setOpen(true)
        }

        const Comp = asChild ? Slot : "button"

        return (
            <Comp ref={ref} onClick={handleClick} {...props}>
                {children}
            </Comp>
        )
    }
)
DialogTrigger.displayName = "DialogTrigger"

// Dialog content
type DialogContentProps = React.HTMLAttributes<HTMLDivElement>

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
    ({ className, children, ...props }, ref) => {
        const { open, setOpen } = useDialog()

        // Handle escape key
        React.useEffect(() => {
            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === 'Escape') setOpen(false)
            }
            if (open) {
                document.addEventListener('keydown', handleEscape)
                document.body.style.overflow = 'hidden'
            }
            return () => {
                document.removeEventListener('keydown', handleEscape)
                document.body.style.overflow = ''
            }
        }, [open, setOpen])

        if (!open) return null

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black/50 animate-fade-in"
                    onClick={() => setOpen(false)}
                />
                {/* Content */}
                <div
                    ref={ref}
                    className={cn(
                        "relative z-50 w-full max-w-lg max-h-[85vh] overflow-auto rounded-lg bg-background p-6 shadow-lg animate-fade-in",
                        "border border-border",
                        className
                    )}
                    onClick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    {...props}
                >
                    {children}
                    <button
                        onClick={() => setOpen(false)}
                        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </button>
                </div>
            </div>
        )
    }
)
DialogContent.displayName = "DialogContent"

// Dialog header
const DialogHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn("flex flex-col space-y-1.5 text-center sm:text-left mb-4", className)}
            {...props}
        />
    )
)
DialogHeader.displayName = "DialogHeader"

// Dialog title
const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
        <h2
            ref={ref}
            className={cn("text-lg font-semibold leading-none tracking-tight", className)}
            {...props}
        />
    )
)
DialogTitle.displayName = "DialogTitle"

// Dialog description
const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => (
        <p
            ref={ref}
            className={cn("text-sm text-muted-foreground", className)}
            {...props}
        />
    )
)
DialogDescription.displayName = "DialogDescription"

// Dialog footer
const DialogFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4", className)}
            {...props}
        />
    )
)
DialogFooter.displayName = "DialogFooter"

export {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
}
