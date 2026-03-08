export default function NotFound() {
    return (
        <main className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
            <div className="text-center space-y-4">
                <div className="text-6xl">🔍</div>
                <h1 className="text-3xl font-bold text-white">404 – Not Found</h1>
                <p className="text-gray-400">That table or page doesn&apos;t exist.</p>
                <a href="/" className="inline-block text-violet-400 hover:text-violet-300 underline transition-colors">
                    Go home
                </a>
            </div>
        </main>
    )
}
