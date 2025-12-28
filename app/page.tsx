import EnhancedLocationSelector from "../components/enhanced-location-selector";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Home() {
  return (
    <main
      id="main-content"
      className="min-h-screen bg-gradient-to-br from-white via-blue-50/50 to-sky-100 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900 animate-gradient-shift"
      aria-label="SunMoon Thai Tide"
    >
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-10 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-10 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl animate-pulse [animation-delay:1s]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-100/20 rounded-full blur-3xl"></div>
      </div>

      {/* Header - Clean Design */}
      <header className="px-4 py-6 md:py-8 lg:py-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
              <svg className="w-8 h-8 md:w-10 md:h-10 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
                <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
                <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
              </svg>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600 bg-clip-text text-transparent">
              SEAPALO
            </h1>
          </div>
          <p className="text-sm md:text-base lg:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4 font-medium">
            ศรีพโล • พยากรณ์น้ำขึ้นน้ำลงและสภาพอากาศแบบเรียลไทม์สำหรับพื้นที่ชายฝั่งไทย
          </p>
        </div>
      </header>

      {/* Main Content - Fully Responsive */}
      <section className="px-4 pb-8 md:pb-12 lg:pb-16 relative">
        <div className="max-w-7xl mx-auto">
          {/* Main Container - Flat Design */}
          <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-blue-100 dark:border-slate-800 overflow-hidden transition-all duration-500 hover:border-blue-200 dark:hover:border-blue-700/50 shadow-xl shadow-blue-100/50 dark:shadow-none animate-fade-in [animation-delay:0.2s]">
            <div className="relative">
              <EnhancedLocationSelector />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
