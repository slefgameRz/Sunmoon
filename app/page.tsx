import EnhancedLocationSelector from "../components/enhanced-location-selector"

export default function Home() {
  return (
    <main
      id="main-content"
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 animate-gradient-shift"
      aria-label="SunMoon Thai Tide"
    >
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-10 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-10 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl animate-pulse [animation-delay:1s]"></div>
      </div>

      {/* Header - Enhanced */}
      <header className="px-4 py-6 md:py-8 lg:py-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="text-4xl md:text-5xl">🌊</div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
              SEAPALO
            </h1>
            <div className="text-4xl md:text-5xl">🌙</div>
          </div>
          <p className="text-sm md:text-base lg:text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto px-4 font-medium">
            ศรีพโล • พยากรณ์น้ำขึ้นน้ำลงและสภาพอากาศแบบเรียลไทม์สำหรับพื้นที่ชายฝั่งไทย
          </p>
          <div className="mt-3 text-xs md:text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-medium">
              <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
              ข้อมูลสดใหม่
            </span>
          </div>
        </div>
      </header>

      {/* Main Content - Fully Responsive */}
      <section className="px-4 pb-8 md:pb-12 lg:pb-16 relative">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl md:rounded-3xl shadow-2xl border border-white/30 dark:border-slate-700/50 overflow-hidden transition-all duration-300 hover:shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20 pointer-events-none rounded-2xl md:rounded-3xl"></div>
            <div className="relative">
              <EnhancedLocationSelector />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}