"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"

// Dynamically import QRScanner with SSR disabled
const PublicQRScanner = dynamic(() => import("@/components/public-qr-scanner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 flex items-center justify-center border rounded-lg bg-white/80">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  ),
})

export default function ScannerContainer() {
  const [mounted, setMounted] = useState(false)

  // Use useEffect to ensure we're on the client side
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  return (
    <>
      {/* ✅ REMOVED: Entire "External Scanner Support" blue card section here */}

      {mounted && (
        <div className="bg-white/95 backdrop-blur-md rounded-[40px] shadow-[0_32px_64px_rgba(0,0,0,0.14)] overflow-hidden">
          <PublicQRScanner />
        </div>
      )}
    </>
  )
}