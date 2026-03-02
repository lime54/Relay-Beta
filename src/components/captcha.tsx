'use client'

import HCaptcha from '@hcaptcha/react-hcaptcha'
import { useRef, useEffect } from 'react'

interface CaptchaProps {
    onVerify: (token: string) => void
}

export default function Captcha({ onVerify }: CaptchaProps) {
    const captchaRef = useRef<HCaptcha>(null)

    return (
        <div className="flex justify-center my-4">
            <HCaptcha
                sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || '77aa5102-3b9c-40b8-ae7a-44dca8e6a5e6'}
                onVerify={onVerify}
                ref={captchaRef}
            />
        </div>
    )
}
