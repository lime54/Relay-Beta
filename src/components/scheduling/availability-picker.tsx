"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

function localDateKey(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function startOfToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

export function AvailabilityPicker({
    recipientId,
    recipientName,
}: {
    recipientId: string;
    recipientName: string;
}) {
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => startOfToday());
    const [slots, setSlots] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [message, setMessage] = useState("");
    const [booking, setBooking] = useState(false);

    const fetchAvailability = useCallback(
        async (startDate: Date) => {
            setLoading(true);
            setErrorMsg(null);
            try {
                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + 7);

                const res = await fetch("/api/scheduling/availability", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: recipientId,
                        startDate: startDate.toISOString(),
                        endDate: endDate.toISOString(),
                    }),
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || "Failed to fetch availability");
                }
                setSlots(data.slots || []);
            } catch (err: unknown) {
                console.error(err);
                setSlots([]);
                setErrorMsg(
                    err instanceof Error ? err.message : "Failed to load availability"
                );
            } finally {
                setLoading(false);
            }
        },
        [recipientId]
    );

    useEffect(() => {
        fetchAvailability(currentWeekStart);
    }, [currentWeekStart, fetchAvailability]);

    const handleNextWeek = () => {
        const next = new Date(currentWeekStart);
        next.setDate(next.getDate() + 7);
        setCurrentWeekStart(next);
        setSelectedSlot(null);
    };

    const handlePrevWeek = () => {
        const prev = new Date(currentWeekStart);
        prev.setDate(prev.getDate() - 7);
        if (prev < startOfToday()) return;
        setCurrentWeekStart(prev);
        setSelectedSlot(null);
    };

    const handleBook = async () => {
        if (!selectedSlot) return;

        setBooking(true);
        try {
            const start = new Date(selectedSlot);
            const end = new Date(start.getTime() + 30 * 60000);
            const idempotencyKey = crypto.randomUUID();

            const res = await fetch("/api/scheduling/book", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    recipientId,
                    startTime: start.toISOString(),
                    endTime: end.toISOString(),
                    message,
                    idempotencyKey,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Booking failed");

            toast.success("Meeting booked. We sent a calendar invite if your accounts are connected.");
            setSelectedSlot(null);
            setMessage("");
            fetchAvailability(currentWeekStart);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Booking failed");
        } finally {
            setBooking(false);
        }
    };

    // Group slots by their LOCAL date so the column matches what the user sees.
    const slotsByDay: Record<string, Date[]> = {};
    for (let i = 0; i < 7; i++) {
        const d = new Date(currentWeekStart);
        d.setDate(d.getDate() + i);
        slotsByDay[localDateKey(d)] = [];
    }

    slots.forEach((slot) => {
        const d = new Date(slot);
        const key = localDateKey(d);
        if (slotsByDay[key]) {
            slotsByDay[key].push(d);
        }
    });

    const dates = Object.keys(slotsByDay).sort();
    const today = startOfToday();

    return (
        <Card className="w-full border-border/50 shadow-lg">
            <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-primary" />
                        Book a meeting with {recipientName}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handlePrevWeek}
                            disabled={loading || currentWeekStart <= today}
                            aria-label="Previous week"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-xs font-medium text-muted-foreground min-w-[100px] text-center">
                            {currentWeekStart.toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                            })}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleNextWeek}
                            disabled={loading}
                            aria-label="Next week"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin mb-4" />
                        <p className="text-sm">Finding available times...</p>
                    </div>
                ) : errorMsg ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground px-6 text-center">
                        <p className="text-sm font-medium text-foreground mb-1">
                            We couldn't load availability.
                        </p>
                        <p className="text-xs text-muted-foreground mb-4">{errorMsg}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchAvailability(currentWeekStart)}
                        >
                            Try again
                        </Button>
                    </div>
                ) : slots.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground px-6 text-center">
                        <CalendarIcon className="h-8 w-8 mb-3 text-muted-foreground/60" />
                        <p className="text-sm font-medium text-foreground mb-1">
                            No times available this week
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Try the next week, or reach out to {recipientName} directly.
                        </p>
                    </div>
                ) : (
                    <div className="flex overflow-x-auto p-4 snap-x divide-x divide-border/50">
                        {dates.map((dateStr) => {
                            // dateStr is a local date key — parse it back to a local Date
                            const [y, m, d] = dateStr.split("-").map(Number);
                            const dateObj = new Date(y, m - 1, d);
                            const daySlots = slotsByDay[dateStr];

                            return (
                                <div key={dateStr} className="flex-none w-[140px] px-2 snap-center">
                                    <div className="text-center mb-4">
                                        <div className="text-xs uppercase font-bold text-muted-foreground mb-1">
                                            {dateObj.toLocaleDateString(undefined, {
                                                weekday: "short",
                                            })}
                                        </div>
                                        <div className="text-lg font-bold text-foreground">
                                            {dateObj.getDate()}
                                        </div>
                                    </div>

                                    <div className="space-y-2 h-[300px] overflow-y-auto pr-1 pb-4">
                                        {daySlots.length === 0 ? (
                                            <div className="text-xs text-center text-muted-foreground/50 py-4 font-medium">
                                                No times
                                            </div>
                                        ) : (
                                            daySlots.map((slot) => {
                                                const slotStr = slot.toISOString();
                                                const isSelected = selectedSlot === slotStr;
                                                return (
                                                    <Button
                                                        key={slotStr}
                                                        variant={isSelected ? "default" : "outline"}
                                                        className={`w-full h-10 text-xs font-medium transition-all ${
                                                            isSelected
                                                                ? "shadow-md shadow-primary/20 scale-105"
                                                                : "hover:border-primary/50 text-muted-foreground hover:text-foreground"
                                                        }`}
                                                        onClick={() => setSelectedSlot(slotStr)}
                                                    >
                                                        {slot.toLocaleTimeString(undefined, {
                                                            hour: "numeric",
                                                            minute: "2-digit",
                                                        })}
                                                    </Button>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>

            {selectedSlot && (
                <div className="border-t border-border/50 p-6 bg-muted/20 animate-in slide-in-from-bottom-4 fade-in">
                    <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        Confirming for{" "}
                        {new Date(selectedSlot).toLocaleString(undefined, {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                        })}
                    </h4>
                    <div className="space-y-4">
                        <textarea
                            className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/60 min-h-[80px]"
                            placeholder="Add a short message to let them know what you want to talk about (optional)"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            maxLength={1000}
                        />
                        <div className="flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setSelectedSlot(null)} disabled={booking}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleBook}
                                disabled={booking}
                                className="min-w-[120px] rounded-full shadow-lg shadow-primary/20"
                            >
                                {booking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Booking"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}
