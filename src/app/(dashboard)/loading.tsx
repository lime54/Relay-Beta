export default function DashboardLoading() {
    return (
        <div className="w-full h-[60vh] flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-500">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-secondary/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-muted-foreground animate-pulse font-medium">Loading Relay dashboard...</p>
        </div>
    );
}
