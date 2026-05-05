'use client'

import HCaptcha from '@hcaptcha/react-hcaptcha'
import { useRef } from 'react'

interface CaptchaProps {
    onVerify: (token: string) => void
}

export default function Captcha({ onVerify }: CaptchaProps) {
    const captchaRef = useRef<HCaptcha>(null)
    const isDev = process.env.NODE_ENV === 'development'

    return (
        <div className="flex flex-col items-center gap-2 my-4">
            <HCaptcha
                sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
                onVerify={onVerify}
                ref={captchaRef}
            />
            {isDev && (
                <button
                    type="button"
                    onClick={() => onVerify('dev-mock-token')}
                    className="text-[10px] text-muted-foreground hover:text-primary transition-colors border border-dashed border-border px-2 py-1 rounded"
                >
                    [Dev] Skip Captcha
                </button>
            )}
        </div>
    )
}
