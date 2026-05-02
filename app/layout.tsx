import { Analytics } from "@vercel/analytics/react"
import type { Metadata } from "next"
import type React from "react"
import { Inter, Poppins } from "next/font/google"

import "./globals.css"

import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"

// Fonts
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
})

export const metadata: Metadata = {
  title: "CHRISTIAN COLLEGES OF SOUTHEAST ASIA",
  description: "Track student check-in and check-out times with QR codes",
  generator: "v0.dev",
}

type RootLayoutProps = Readonly<{
  children: React.ReactNode
}>

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
  suppressHydrationWarning
  className={`
    ${inter.variable}
    ${poppins.variable}
    font-sans
    min-h-screen
  `}
>
      
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}

            {/* Vercel Analytics */}
            <Analytics />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}