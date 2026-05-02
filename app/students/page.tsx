"use client"

import StudentManagement from "@/components/student-management"
import Nav from "@/components/nav"
import Header from "@/components/header"
import ProtectedRoute from "@/components/protected-route"
import { Users, ChevronRight, ShieldCheck } from "lucide-react"
import Link from "next/link"

export default function StudentsPage() {
  return (
    <ProtectedRoute adminOnly={true}>
      <main className="min-h-screen flex flex-col antialiased font-sans bg-cover bg-center bg-no-repeat bg-fixed animate-in fade-in duration-700"style={{ 
    backgroundImage: "linear-gradient(rgba(51, 50, 50, 0.53), rgba(51, 50, 50, 0.53)), url('/background.jpg')" }}>
        <Header />
        <Nav />

        <div className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Breadcrumbs & Security Badge */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <nav className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
                <ChevronRight className="w-4 h-4 opacity-50" />
                <span className="text-slate-900">Student Directory</span>
              </nav>
              
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-200 w-fit">
                <ShieldCheck className="w-3 h-3" />
                Admin Restricted Area
              </div>
            </div>

            {/* Section Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-6 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-600 rounded-lg text-white">
                    <Users className="w-6 h-6" />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Student Directory</h1>
                </div>
                <p className="text-slate-500 max-w-2xl text-sm font-medium">
                  Add, edit, and manage student profiles for Christian Colleges of Southeast Asia. 
                  Ensure all information matches official registrar records.
                </p>
              </div>
            </div>

            {/* Main Management Component */}
            <div className="
                 bg-black/40 
                backdrop-blur-md 
                rounded-[1rem] 
                shadow-[0_8px_30px_rgb(0,0,0,0.1)] 
                border border-white/10 
                 overflow-hidden
  
                /* THIS IS THE FIX: Uniform padding for all sides */
                p-8 
  
                /* Adds spacing between the header and the search bar/table */
                flex flex-col gap-6
              ">
              <StudentManagement />
            </div>
            

            {/* Footer Note */}
            <p className="text-center text-[black] text-[12px] font-bold uppercase tracking-[0.2em]">
              CCSA Integrated System • 2026
            </p>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
}