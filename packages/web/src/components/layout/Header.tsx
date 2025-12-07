export default function Header() {
    return (
        <header className="h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-white">
                    Welcome to NLP Test Toolkit
                </h2>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-400">System Ready</span>
                </div>
            </div>
        </header>
    );
}
