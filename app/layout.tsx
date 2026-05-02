import { Analytics } from "@vercel/analytics/react"
import type React from "react"
import type { Metadata } from "next"
import { Inter, Poppins } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"

// Define fonts
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
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
  className={`${inter.variable} ${poppins.variable} font-sans`}
  style={{ 
    backgroundImage: "url('/background.JPG')", 
    backgroundSize: 'cover', 
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    backgroundRepeat: 'no-repeat'
  }}
  suppressHydrationWarning
>
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
    <AuthProvider>{children}
<Analytics /> {/* Add this line here */}

    </AuthProvider>
  </ThemeProvider>
</body>
    </html>
  )
}
