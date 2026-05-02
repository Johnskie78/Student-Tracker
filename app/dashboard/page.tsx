"use client"

import Nav from "@/components/nav"
import Header from "@/components/header"
import ProtectedRoute from "@/components/protected-route"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import AdminScannerContainer from "@/components/admin-scanner-container"
import DashboardStats from "@/components/dashboard-stats"
import { LayoutDashboard, Info, Zap, ShieldCheck, FileBarChart, History, Users } from "lucide-react"

export default function DashboardPage() {
  return (
    <ProtectedRoute adminOnly={false}>
      <main className="min-h-screen flex flex-col antialiased font-sans bg-cover bg-center bg-no-repeat bg-fixed animate-in fade-in duration-700"style={{ 
    backgroundImage: "linear-gradient(rgba(51, 50, 50, 0.53), rgba(51, 50, 50, 0.53)), url('/background.jpg')" }}>
        <Header />
        <Nav />

        <div className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Page Title & Welcome */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-lg text-white">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight text-slate-900">Dashboard</h2>
                <p className="text-slate-500 font-medium text-sm uppercase tracking-widest">System Overview</p>
              </div>
            </div>

            {/* Top Level Statistics */}
            <section>
              <DashboardStats />
            </section>

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Primary Action: QR Scanner */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[24px] overflow-hidden">
                  <CardHeader className="border-b border-slate-50 bg-white/50 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-bold text-slate-800">Attendance Terminal</CardTitle>
                        <CardDescription className="text-slate-500">Scan student QR codes for time tracking</CardDescription>
                      </div>
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <AdminScannerContainer />
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar: Information & Quick Access */}
              <div className="space-y-6">
                {/* System Info Card */}
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[24px]">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-indigo-600" />
                      Access Permissions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-4">
                      <SystemInfoItem icon={<Zap className="w-4 h-4" />} label="Scanner" value="Public" isPublic />
                      <SystemInfoItem icon={<Users className="w-4 h-4" />} label="Students" value="Admin Only" />
                      <SystemInfoItem icon={<History className="w-4 h-4" />} label="Records" value="Admin Only" />
                      <SystemInfoItem icon={<FileBarChart className="w-4 h-4" />} label="Reports" value="Admin Only" />
                    </ul>
                  </CardContent>
                </Card>

                {/* Quick Help Card */}
                <Card className="border-none bg-indigo-600 text-white rounded-[24px] shadow-xl shadow-indigo-200 overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Info className="w-24 h-24 rotate-12" />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Quick Access</CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-indigo-100 text-sm leading-relaxed mb-4">
                      The public scanner is accessible without login via the main landing page or the link below.
                    </p>
                    <button className="w-full py-3 bg-white text-indigo-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-50 transition-colors">
                      Copy Public Link
                    </button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
}

/** * Helper Component for Permission List 
 */
function SystemInfoItem({ icon, label, value, isPublic = false }: { icon: React.ReactNode, label: string, value: string, isPublic?: boolean }) {
  return (
    <li className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
          {icon}
        </div>
        <span className="text-sm font-semibold text-slate-600">{label}</span>
      </div>
      <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded-md ${
        isPublic ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
      }`}>
        {value}
      </span>
    </li>
  )
}