"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import ScannerContainer from "@/components/scanner-container"
import { LockKeyhole, Clock } from "lucide-react"

export default function PublicScannerPage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [mounted, setMounted] = useState(false)
  // ✅ Added states for show/hide text
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [showSupport, setShowSupport] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <main 
      
  className="
    min-h-screen
    flex
    flex-col
    relative
    overflow-hidden
    antialiased
    font-sans
    pb-[70px]
  "
      style={{
        backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.53), rgba(0, 50, 50, 0.53)), url('/background.jpg')" 
      }}
    >
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b  border-slate-200/60">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-5">
            <div className="relative h-14 w-14 group">
              <Image
                src="/Logo.png"
                alt="CCSA Logo"
                fill
                className="object-contain transition-transform group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black tracking-tighter text-slate-900 leading-none">
                CCSA
              </h1>
              <p className="text-[20px] font-bold tracking-[0.2em] text-indigo-600 uppercase">
                Christian Colleges of Southeast Asia
              </p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-3 px-5 py-2 bg-slate-100 rounded-2xl border border-slate-200/50">
              <Clock className="w-4 h-4 text-slate-500" />
              <div className="flex flex-col leading-none">
                <span className="text-sm font-bold text-slate-900 tabular-nums">
                  {/* Hydration Fix: Only render time after mount */}
                  {mounted ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "--:--:--"}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  {mounted ? currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }) : "Loading..."}
                </span>
              </div>
            </div>

            <Link href="/login">
              <Button
                variant="ghost"
                className="group gap-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl px-4 transition-all"
              >
                <LockKeyhole className="w-4 h-4 transition-transform group-hover:-rotate-12" />
                <span className="text-sm font-bold">Admin Portal</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

     {/* MAIN CONTENT */}

<div className="flex-1 relative flex items-center justify-center px-4 sm:px-6 lg:px-12 overflow-hidden pt-4">

  {/* Background Glow */}
  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-indigo-500/10 blur-[140px] rounded-full pointer-events-none" />

  {/* CENTER WRAPPER */}
  <div className="relative z-10 w-full flex items-center justify-center">
    
    <div className="w-full max-w-6xl mx-auto items-center justify-center">
      <ScannerContainer />
    </div>

  </div>
</div>

      {/* FOOTER */}
      <footer
  className="
    absolute
    bottom-0
    left-0
    right-0
    z-50

    py-5
    bg-white/95
    backdrop-blur-md
    border-t
    border-slate-200/50

    shadow-[0_-6px_20px_rgba(0,0,0,0.06)]
  "
>
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-slate-400">
          <div className="flex flex-col gap-2">
            <div className="flex gap-6 text-[11px] font-bold uppercase tracking-widest items-center">
              {/* ✅ Green online dot + System Active */}
              <span className="flex items-center gap-2 text-green-600/80">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                System Active
              </span>

              {/* ✅ Privacy Policy — click to show paragraph */}
              <span 
                className="hover:text-slate-600 cursor-pointer transition-colors"
                onClick={() => setShowPrivacy(!showPrivacy)}
              >
                Privacy Policy
              </span>

              {/* ✅ Support — click to show paragraph */}
              <span 
                className="hover:text-slate-600 cursor-pointer transition-colors"
                onClick={() => setShowSupport(!showSupport)}
              >
                Support
              </span>
            </div>

            {/* ✅ Privacy Policy Paragraph — shows when clicked */}
            {showPrivacy && (
              <p className="text-xs text-slate-600 max-w-md mt-1 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
                We value your privacy. All student data and attendance records are securely stored, encrypted, and used only for official attendance and tracking purposes. We never share personal information with third parties without consent.
              </p>
            )}

            {/* ✅ Support Paragraph — shows when clicked */}
            {showSupport && (
              <p className="text-xs text-slate-600 max-w-md mt-1 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
                Need help? Contact our system administrator at <strong>ccsaictmicrosoft2024@gmail.com</strong> or visit the IT office during office hours. Available Monday–Friday, 8:00 AM – 5:00 PM.
              </p>
            )}
          </div>

          <p className="text-xs font-medium">
            © {mounted ? new Date().getFullYear() : "2026"} <span className="text-slate-600 font-bold">Student Time Tracking</span>
            <span className="hidden md:inline mx-2 text-slate-200">|</span>
            v2.4.0
          </p>
        </div>
      </footer>
    </main>
  )
}