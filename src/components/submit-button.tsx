'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { ComponentProps } from 'react'

interface SubmitButtonProps extends ComponentProps<typeof Button> {
    loadingText?: string
}

export function SubmitButton({ children, loadingText = "Submitting...", ...props }: SubmitButtonProps) {
    const { pending } = useFormStatus()
    return (
        <Button {...props} disabled={props.disabled || pending} type="submit">
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {loadingText}
                </>
            ) : (
                children
            )}
        </Button>
    )
}
