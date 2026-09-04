"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { runAiVerification } from "./ai-verify-actions";
import { Loader2, ShieldCheck, Clock, AlertCircle } from "lucide-react";

type Outcome =
    | { kind: "verified"; message: string }
    | { kind: "pending"; message: string }
    | { kind: "error"; message: string };

export function VerifyPanel({ school, sport }: { school?: string; sport?: string }) {
    const [rosterUrl, setRosterUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [outcome, setOutcome] = useState<Outcome | null>(null);

    const handleVerify = async () => {
        setLoading(true);
        setOutcome(null);
        try {
            const res = await runAiVerification(rosterUrl);
            if (!res.ok) setOutcome({ kind: "error", message: res.message });
            else if (res.verified) setOutcome({ kind: "verified", message: res.message });
            else setOutcome({ kind: "pending", message: res.message });
        } catch {
            setOutcome({ kind: "error", message: "Something went wrong. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    if (outcome?.kind === "verified") {
        return (
            <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-5 dark:border-green-900/40 dark:bg-green-900/20">
                <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5 text-green-600" />
                <div>
                    <p className="font-semibold text-green-900 dark:text-green-200">You&apos;re verified</p>
                    <p className="text-sm text-green-800/90 dark:text-green-300/90 mt-0.5">{outcome.message}</p>
                </div>
            </div>
        );
    }

    if (outcome?.kind === "pending") {
        return (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/40 dark:bg-amber-900/20">
                <Clock className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" />
                <div>
                    <p className="font-semibold text-amber-900 dark:text-amber-200">Manual review in progress</p>
                    <p className="text-sm text-amber-800/90 dark:text-amber-300/90 mt-0.5">{outcome.message}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
                We&apos;ll confirm you as an athlete by checking
                {school && sport ? <> your <strong>{sport}</strong> roster at <strong>{school}</strong></> : <> your school&apos;s official roster</>}{" "}
                online. If we can&apos;t auto-confirm it, a Relay teammate will verify you by hand.
            </p>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">Roster or athletics bio link <span className="text-muted-foreground font-normal">(optional, speeds things up)</span></label>
                <Input
                    type="url"
                    placeholder="https://goharvard.com/sports/.../roster/..."
                    value={rosterUrl}
                    onChange={(e) => setRosterUrl(e.target.value)}
                    className="h-11 rounded-xl"
                />
            </div>

            {outcome?.kind === "error" && (
                <div className="flex items-start gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    {outcome.message}
                </div>
            )}

            <Button onClick={handleVerify} disabled={loading} className="w-full h-11 rounded-xl gap-2">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Checking your roster…</> : <><ShieldCheck className="h-4 w-4" /> Verify me</>}
            </Button>
        </div>
    );
}
