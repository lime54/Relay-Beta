import { Resend } from 'resend';

// Helper to get the API key, throwing an error if it's missing
const getResendApiKey = () => {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
        console.warn('RESEND_API_KEY is not set. Email delivery will fail.');
    }
    return key;
};

export const resend = new Resend(getResendApiKey());
