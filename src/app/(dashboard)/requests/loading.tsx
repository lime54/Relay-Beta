import { Skeleton } from "@/components/ui/skeleton"

export default function RequestsLoading() {
    return (
        <div className="container mx-auto p-4 max-w-4xl space-y-6 pt-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>

            <div className="bg-card rounded-3xl border border-border/50 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border/50 flex gap-4">
                    <Skeleton className="h-10 w-32 rounded-full" />
                    <Skeleton className="h-10 w-32 rounded-full" />
                </div>

                <div className="divide-y divide-border/50">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="p-6 flex gap-4 items-start">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="flex-1 space-y-3">
                                <div className="flex justify-between">
                                    <Skeleton className="h-5 w-48" />
                                    <Skeleton className="h-5 w-24" />
                                </div>
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-16 w-full mt-2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
