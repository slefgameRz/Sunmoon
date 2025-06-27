import type React from "react"
import type { Metadata } from "next"
import { Sarabun } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const sarabun = Sarabun({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-sarabun",
})

export const metadata: Metadata = {
  title: "Thai Weather App",
  description: "Real-time weather and tide forecast for Thailand",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={`${sarabun.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
