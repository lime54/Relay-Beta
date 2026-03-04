export default function RootLoading() {
    return (
        <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-[9999]">
            <div className="flex flex-col items-center space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-secondary/10 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <img src="/relay-logo.png" alt="Relay" className="w-8 h-8 opacity-20 grayscale invert" />
                    </div>
                </div>
                <div className="flex flex-col items-center space-y-2">
                    <h2 className="text-xl font-bold tracking-tight">RELAY</h2>
                    <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
