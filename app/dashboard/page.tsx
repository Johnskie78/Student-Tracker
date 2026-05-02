"use client"

import Nav from "@/components/nav"
import Header from "@/components/header"
import ProtectedRoute from "@/components/protected-route"
import DashboardStats from "@/components/dashboard-stats"
import { LayoutDashboard } from "lucide-react"

export default function DashboardPage() {
  return (
    <ProtectedRoute adminOnly={false}>
      <main
        className="
          min-h-screen w-full overflow-x-hidden
          flex flex-col antialiased font-sans
          bg-cover bg-center bg-no-repeat bg-fixed
          animate-in fade-in duration-700
        "
        style={{
          backgroundImage:
            "linear-gradient(rgba(51, 50, 50, 0.53), rgba(51, 50, 50, 0.53)), url('/background.jpg')",
        }}
      >
        <Header />
        <Nav />

        <div className="flex-1 w-full px-3 sm:px-5 md:px-8 py-4">
          <div className="w-full max-w-[1600px] mx-auto space-y-8 px-2 sm:px-4 lg:px-6">

            {/* Page Title */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-lg text-white">
                <LayoutDashboard className="w-6 h-6" />
              </div>

              <div>
                <h2 className="text-3xl font-black tracking-tight text-slate-900">
                  Dashboard
                </h2>

                <p className="text-slate-900 font-medium text-sm uppercase tracking-widest">
                  System Overview
                </p>
              </div>
            </div>

            {/* Dashboard Statistics */}
            <section>
              <DashboardStats />
            </section>

          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
}