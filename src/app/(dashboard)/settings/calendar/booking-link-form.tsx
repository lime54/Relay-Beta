"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateSchedulingUrl } from "@/app/(dashboard)/profile/actions";
import { toast } from "sonner";
import { Loader2, ExternalLink, Save } from "lucide-react";

export function BookingLinkForm({ initialUrl }: { initialUrl?: string | null }) {
    const [url, setUrl] = useState(initialUrl ?? "");
    const [saving, setSaving] = useState(false);
    const [savedUrl, setSavedUrl] = useState(initialUrl ?? "");

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await updateSchedulingUrl(url);
            if (res?.error) {
                toast.error(res.error);
            } else {
                const cleaned = url.trim();
                setSavedUrl(cleaned);
                setUrl(cleaned);
                toast.success(cleaned ? "Booking link saved." : "Booking link removed.");
            }
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const openUrl = () => {
        if (!savedUrl) return;
        const full = savedUrl.startsWith("http") ? savedUrl : `https://${savedUrl}`;
        window.open(full, "_blank");
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
                <Input
                    type="url"
                    inputMode="url"
                    placeholder="https://calendly.com/yourname"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="h-11 rounded-xl flex-1"
                />
                <Button onClick={handleSave} disabled={saving} className="h-11 rounded-xl gap-2 sm:w-auto">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save
                </Button>
            </div>

            {savedUrl && (
                <button
                    type="button"
                    onClick={openUrl}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary hover:underline"
                >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Test your link
                </button>
            )}

            <p className="text-xs text-muted-foreground leading-relaxed">
                Paste the booking link from any scheduling tool — Calendly, Cal.com, SavvyCal, or Google
                Appointment Schedule. When someone taps <strong>Book a Meeting</strong> on your profile,
                they&apos;ll open your link, pick a time, and you&apos;ll both get a calendar invite
                automatically. Leave it blank to remove your link.
            </p>
        </div>
    );
}
