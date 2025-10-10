import EnhancedLocationSelector from "../components/enhanced-location-selector"

export default function Home() {
  return (
    <main
      id="main-content"
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
      aria-label="SunMoon Thai Tide"
    >
      {/* Header - Responsive */}
      <header className="px-4 py-4 md:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            🌊SEAPALO
          </h1>
          <p className="text-sm md:text-base lg:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
            ศรีพโล พยากรณ์น้ำขึ้นน้ำลงและสภาพอากาศสำหรับพื้นที่ชายฝั่งไทย 
          </p>
        </div>
      </header>

      {/* Main Content - Fully Responsive */}
      <section className="px-4 pb-8 md:pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-xl md:shadow-2xl border border-white/20 overflow-hidden">
            <EnhancedLocationSelector />
          </div>
        </div>
      </section>
    </main>
  )
}