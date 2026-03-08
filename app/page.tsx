import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo */}
        <div className="space-y-2">
          <div className="text-6xl mb-4">⚡</div>
          <h1 className="text-4xl font-bold text-white">
            Hackathon QR System
          </h1>
          <p className="text-gray-400 text-lg">
            Dynamic QR code redirects for your event
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-4 mt-8">
          <Link href="/admin" className="group">
            <div className="bg-gray-900 border border-gray-800 hover:border-violet-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10">
              <div className="flex items-center gap-4">
                <div className="text-3xl">🎛️</div>
                <div className="text-left">
                  <div className="text-white font-semibold text-lg group-hover:text-violet-400 transition-colors">Admin Dashboard</div>
                  <div className="text-gray-400 text-sm">Manage redirect rules for all tables</div>
                </div>
                <div className="ml-auto text-gray-600 group-hover:text-violet-400 transition-colors">→</div>
              </div>
            </div>
          </Link>

          <Link href="/admin/qrcodes" className="group">
            <div className="bg-gray-900 border border-gray-800 hover:border-emerald-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10">
              <div className="flex items-center gap-4">
                <div className="text-3xl">🔲</div>
                <div className="text-left">
                  <div className="text-white font-semibold text-lg group-hover:text-emerald-400 transition-colors">QR Code Generator</div>
                  <div className="text-gray-400 text-sm">Print QR codes for all tables</div>
                </div>
                <div className="ml-auto text-gray-600 group-hover:text-emerald-400 transition-colors">→</div>
              </div>
            </div>
          </Link>
        </div>

        <div className="text-gray-600 text-sm">
          Scan any table QR to be redirected instantly
        </div>
      </div>
    </main>
  )
}
