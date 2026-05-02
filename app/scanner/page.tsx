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

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    // Changed background to a soft slate to make the white kiosk "pop"
    <main className="min-h-screen flex flex-col antialiased font-sans bg-cover bg-center bg-no-repeat bg-fixed animate-in fade-in duration-700"style={{ 
    backgroundImage: "linear-gradient(rgba(51, 50, 50, 0.53), rgba(51, 50, 50, 0.53)), url('/background.jpg')" }}>
      {/* PROFESSIONAL KIOSK HEADER */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
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
              <p className="text-[10px] font-bold tracking-[0.2em] text-indigo-600 uppercase">
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

      {/* MAIN KIOSK AREA */}
      <div className="flex-1 p-6 lg:p-12 flex flex-col items-center justify-center relative">
        {/* Subtle Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full -z-10" />
        
        {/* THE CURVED CONTAINER (Matches your screenshots) */}
        <div className="
                bg-black/40 backdrop-blur-md 
                rounded-[1rem] 
                shadow-[0_8px_30px_rgb(0,0,0,0.1)] 
                border border-white/10 
                overflow-hidden 
                /* THIS IS THE FIX: Uniform padding for all sides */
                p-8 
  
                /* Adds spacing between the header and the search bar/table */
                flex flex-col gap-6">
           {/* Inside ScannerContainer, ensure your left panel has 'bg-black/40' 
             and the right panel has 'bg-[#0c0e17]' 
           */}
           <ScannerContainer />
        </div>
      </div>

      {/* MINIMAL FOOTER */}

      <footer className="py-6 bg-white border-t border-slate-100">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400">
          <div className="flex gap-6 text-[11px] font-bold uppercase tracking-widest">
            <span className="text-indigo-600/60">System Active</span>
            <span className="hover:text-slate-600 cursor-help transition-colors">Privacy Policy</span>
            <span className="hover:text-slate-600 cursor-help transition-colors">Support</span>
          </div>
          
          <p className="text-xs font-medium">
            © {mounted ? new Date().getFullYear() : "2024"} <span className="text-slate-600 font-bold">Student Time Tracking</span> 
            <span className="hidden md:inline mx-2 text-slate-200">|</span> 
            v2.4.0
          </p>
        </div>
      </footer>
    </main>
  )
}