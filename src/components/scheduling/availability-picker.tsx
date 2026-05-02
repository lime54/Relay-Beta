"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function AvailabilityPicker({ recipientId, recipientName }: { recipientId: string, recipientName: string }) {
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
        const d = new Date();
        // Start from today
        d.setHours(0, 0, 0, 0);
        return d;
    });
    
    const [slots, setSlots] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [message, setMessage] = useState("");
    const [booking, setBooking] = useState(false);
    const router = useRouter();

    const fetchAvailability = async (startDate: Date) => {
        setLoading(true);
        try {
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 7); // Fetch 1 week at a time

            const res = await fetch('/api/scheduling/availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: recipientId,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to fetch availability");
            }

            const data = await res.json();
            setSlots(data.slots || []);
        } catch (error: any) {
            console.error(error);
            // Ignore missing rules error and show empty state
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAvailability(currentWeekStart);
    }, [currentWeekStart, recipientId]);

    const handleNextWeek = () => {
        const next = new Date(currentWeekStart);
        next.setDate(next.getDate() + 7);
        setCurrentWeekStart(next);
        setSelectedSlot(null);
    };

    const handlePrevWeek = () => {
        const prev = new Date(currentWeekStart);
        prev.setDate(prev.getDate() - 7);
        
        // Don't go to past weeks
        const today = new Date();
        today.setHours(0,0,0,0);
        if (prev < today) return;
        
        setCurrentWeekStart(prev);
        setSelectedSlot(null);
    };

    const handleBook = async () => {
        if (!selectedSlot) return;
        
        setBooking(true);
        try {
            const start = new Date(selectedSlot);
            const end = new Date(start.getTime() + 30 * 60000); // Assume 30 mins
            const idempotencyKey = crypto.randomUUID();

            const res = await fetch('/api/scheduling/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientId,
                    startTime: start.toISOString(),
                    endTime: end.toISOString(),
                    message,
                    idempotencyKey
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Booking failed");

            toast.success("Meeting booked successfully!");
            // router.push(`/dashboard`); // Or show success state
            setSelectedSlot(null);
            setMessage("");
            
            // Re-fetch to remove the booked slot
            fetchAvailability(currentWeekStart);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setBooking(false);
        }
    };

    // Group slots by Day
    const slotsByDay: Record<string, Date[]> = {};
    for (let i = 0; i < 7; i++) {
        const d = new Date(currentWeekStart);
        d.setDate(d.getDate() + i);
        slotsByDay[d.toISOString().split('T')[0]] = [];
    }

    slots.forEach(slot => {
        const d = new Date(slot);
        const key = slot.split('T')[0]; // Using UTC string for grouping might shift timezone, let's use local
        
        const localDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        
        if (slotsByDay[localDate]) {
            slotsByDay[localDate].push(d);
        } else {
            slotsByDay[localDate] = [d];
        }
    });

    const dates = Object.keys(slotsByDay).sort();

    return (
        <Card className="w-full border-border/50 shadow-lg">
            <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-primary" />
                        Book a meeting with {recipientName}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={handlePrevWeek} disabled={loading || currentWeekStart <= new Date(new Date().setHours(0,0,0,0))}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-xs font-medium text-muted-foreground min-w-[100px] text-center">
                            {currentWeekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        <Button variant="outline" size="icon" onClick={handleNextWeek} disabled={loading}>
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
                ) : (
                    <div className="flex overflow-x-auto p-4 snap-x divide-x divide-border/50">
                        {dates.map((dateStr) => {
                            const dateObj = new Date(dateStr + 'T12:00:00Z'); // force midday to avoid tz shift
                            const daySlots = slotsByDay[dateStr];
                            
                            return (
                                <div key={dateStr} className="flex-none w-[140px] px-2 snap-center">
                                    <div className="text-center mb-4">
                                        <div className="text-xs uppercase font-bold text-muted-foreground mb-1">
                                            {dateObj.toLocaleDateString(undefined, { weekday: 'short' })}
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
                                            daySlots.map(slot => {
                                                const slotStr = slot.toISOString();
                                                const isSelected = selectedSlot === slotStr;
                                                return (
                                                    <Button
                                                        key={slotStr}
                                                        variant={isSelected ? "default" : "outline"}
                                                        className={`w-full h-10 text-xs font-medium transition-all ${
                                                            isSelected ? "shadow-md shadow-primary/20 scale-105" : "hover:border-primary/50 text-muted-foreground hover:text-foreground"
                                                        }`}
                                                        onClick={() => setSelectedSlot(slotStr)}
                                                    >
                                                        {slot.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                                                    </Button>
                                                )
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
                        Confirming for {new Date(selectedSlot).toLocaleString(undefined, { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </h4>
                    <div className="space-y-4">
                        <textarea 
                            className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/60 min-h-[80px]"
                            placeholder="Add a short message to let them know what you want to talk about (optional)"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                        <div className="flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setSelectedSlot(null)}>Cancel</Button>
                            <Button onClick={handleBook} disabled={booking} className="min-w-[120px] rounded-full shadow-lg shadow-primary/20">
                                {booking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Booking"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}
