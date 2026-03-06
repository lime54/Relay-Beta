import { Skeleton } from "@/components/ui/skeleton"

export default function ProfileLoading() {
    return (
        <div className="bg-[#f4f2ee] min-h-screen py-6">
            <div className="container mx-auto px-4 max-w-[1128px]">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
                    {/* Main Content Skeleton */}
                    <main className="space-y-6">
                        {/* Header Skeleton */}
                        <div className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border/50">
                            <Skeleton className="h-48 w-full" />
                            <div className="px-6 pb-6 pt-4">
                                <Skeleton className="h-32 w-32 rounded-full -mt-20 border-4 border-background mb-4" />
                                <Skeleton className="h-8 w-1/3 mb-2" />
                                <Skeleton className="h-4 w-1/4 mb-4" />
                                <Skeleton className="h-4 w-2/3" />
                            </div>
                        </div>
                        {/* Experience Skeleton */}
                        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50">
                            <Skeleton className="h-6 w-32 mb-6" />
                            <div className="space-y-6">
                                {[1, 2].map((i) => (
                                    <div key={i} className="flex gap-4">
                                        <Skeleton className="h-12 w-12 rounded-lg" />
                                        <div className="space-y-2 flex-1">
                                            <Skeleton className="h-5 w-1/3" />
                                            <Skeleton className="h-4 w-1/4" />
                                            <Skeleton className="h-4 w-1/5" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </main>

                    {/* Sidebar Skeleton */}
                    <aside className="hidden md:block space-y-6">
                        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50">
                            <Skeleton className="h-6 w-32 mb-4" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    )
}
