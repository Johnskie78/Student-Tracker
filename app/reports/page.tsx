"use client"

import { useState, useEffect, useMemo } from "react"
import Nav from "@/components/nav"
import Header from "@/components/header"
import ProtectedRoute from "@/components/protected-route"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getTimeRecords, getStudents, type Student, type TimeRecord } from "@/lib/db"
import { timeRecordsToCSV, downloadAsFile, formatDateForFilename } from "@/lib/export-utils"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { Button } from "@/components/ui/button"
import { FileDown, Calendar, Users, Clock, Loader2, AlertCircle } from "lucide-react"
import { addDays, format, subDays, startOfDay } from "date-fns"

// --- Types ---
interface DailyReportData {
  date: string;
  count: number;
}

// --- Main Page Component ---
export default function ReportsPage() {
  return (
    <ProtectedRoute adminOnly>
      <div className="min-h-screen flex flex-col antialiased font-sans bg-cover bg-center bg-no-repeat bg-fixed animate-in fade-in duration-700"style={{ 
    backgroundImage: "linear-gradient(rgba(51, 50, 50, 0.53), rgba(51, 50, 50, 0.53)), url('/background.jpg')" }}>
        <Header />
        <Nav />
        <ReportsContent />
      </div>
    </ProtectedRoute>
  )
}

// --- Content Logic ---
function ReportsContent() {
  const [students, setStudents] = useState<Student[]>([])
  const [records, setRecords] = useState<TimeRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const dateRange = useMemo(() => ({
    from: subDays(startOfDay(new Date()), 6),
    to: new Date(),
  }), [])

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [studentsList, timeRecordsList] = await Promise.all([
          getStudents(),
          getTimeRecords()
        ])
        setStudents(studentsList)
        setRecords(timeRecordsList)
        setError(null)
      } catch (err) {
        setError("Failed to load report data. Please try again.")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const stats = useMemo(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd")
    const studentsMap: Record<string, Student> = {}
    students.forEach((s: Student) => { studentsMap[s.studentId] = s })

    let totalCheckIns = 0
    const activeTodaySet = new Set<string>()

    records.forEach((r: TimeRecord) => {
      if (r.type === "in") {
        totalCheckIns++
        if (r.date === todayStr) {
          activeTodaySet.add(r.studentId)
        }
      }
    })

    return {
      totalStudents: students.length,
      totalCheckIns,
      activeToday: activeTodaySet.size,
      studentsMap
    }
  }, [students, records])

  const reportData = useMemo(() => {
    const dailyCounts: Record<string, Set<string>> = {}
    records.forEach((r: TimeRecord) => {
      if (r.type === "in") {
        if (!dailyCounts[r.date]) dailyCounts[r.date] = new Set()
        dailyCounts[r.date].add(r.studentId)
      }
    })

    const data: DailyReportData[] = []
    let curr = dateRange.from
    while (curr <= dateRange.to) {
      const dateKey = format(curr, "yyyy-MM-dd")
      data.push({
        date: format(curr, "MMM dd"),
        count: dailyCounts[dateKey]?.size || 0
      })
      curr = addDays(curr, 1)
    }
    return data
  }, [records, dateRange])

  const handleExport = () => {
    const fromStr = format(dateRange.from, "yyyy-MM-dd")
    const toStr = format(dateRange.to, "yyyy-MM-dd")
    const filtered = records.filter((r: TimeRecord) => r.date >= fromStr && r.date <= toStr)
    const csvData = timeRecordsToCSV(filtered, stats.studentsMap)
    const filename = `report_${formatDateForFilename(dateRange.from)}_to_${formatDateForFilename(dateRange.to)}.csv`
    downloadAsFile(csvData, filename, "text/csv;charset=utf-8;")
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-slate-600 font-medium">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <main className="flex-1 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Analytics</h1>
            <p className="text-slate-500">Insights and attendance trends</p>
          </div>
          <Button onClick={handleExport} variant="default" className="shadow-sm w-full sm:w-auto">
            <FileDown className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Total Students" value={stats.totalStudents} icon={<Users className="h-5 w-5" />} />
          <StatCard title="Total Check-ins" value={stats.totalCheckIns} icon={<Clock className="h-5 w-5" />} />
          <StatCard title="Active Today" value={stats.activeToday} icon={<Calendar className="h-5 w-5" />} />
        </div>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Attendance Trends</CardTitle>
            <CardDescription>Unique daily check-ins for the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ChartContainer config={{ count: { label: "Students", color: "hsl(var(--primary))" } }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="currentColor" className="fill-primary" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function StatCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
            <div className="text-3xl font-bold text-slate-900">{value.toLocaleString()}</div>
          </div>
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}