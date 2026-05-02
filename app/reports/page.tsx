"use client"
import {useState,useEffect,useMemo,type ReactNode, useRef,
} from "react"
import Nav from "@/components/nav"
import Header from "@/components/header"
import ProtectedRoute from "@/components/protected-route"
import {Card,CardContent,CardHeader,CardTitle,CardDescription,} from "@/components/ui/card"
import {getTimeRecords,getStudents,type Student,type TimeRecord,} from "@/lib/db"
import {timeRecordsToCSV,downloadAsFile,formatDateForFilename,} from "@/lib/export-utils"
import {ChartContainer,ChartTooltip,ChartTooltipContent,} from "@/components/ui/chart"
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,ResponsiveContainer,
  Cell} from "recharts"
import { Button } from "@/components/ui/button"
import {FileDown,Calendar,Users,Clock,Loader2,AlertCircle,} from "lucide-react"
import {addDays,format,subDays,startOfDay,} from "date-fns"
import html2canvas from "html2canvas"




// --- Types ---
interface DailyReportData {
  date: string;
  count: number;
}

// --- Main Page Component ---
export default function ReportsPage() {
  return (
    <ProtectedRoute adminOnly>
      <div
  className="
    min-h-screen
    flex
    flex-col
    antialiased
    font-sans
    bg-cover
    bg-center
    bg-no-repeat
    bg-fixed
    animate-in
    fade-in
    duration-700
  "
  style={{
    backgroundImage: "url('/background.jpg')",
  }}
>
        <Header />
        <Nav />
        <ReportsContent />
      </div>
    </ProtectedRoute>
  )
}

// --- Content Logic ---
function ReportsContent() {
  const chartRef = useRef<HTMLDivElement>(null) 
  const [students, setStudents] = useState<Student[]>([])
  const [records, setRecords] = useState<TimeRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
 const handleExportChart = async () => {
  if (!chartRef.current) return

  const canvas = await html2canvas(chartRef.current, {
    scale: 3,
    backgroundColor: null,
    useCORS: true,
  })

  const image = canvas.toDataURL("image/png")

  const link = document.createElement("a")
  link.href = image
  link.download = `analytics-chart-${format(
    new Date(),
    "yyyy-MM-dd"
  )}.png`

  link.click()
}
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
    let curr = new Date(dateRange.from)

while (curr <= dateRange.to) {
  const dateKey = format(curr, "yyyy-MM-dd")

  data.push({
    date: format(curr, "MMM dd"),
    count: dailyCounts[dateKey]?.size ?? 0,
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
        <Button onClick={() => globalThis.location.reload()}> Retry </Button>
      </div>
    )
  }

  return (
  <main className="flex-1 px-3 py-4 sm:px-5 md:px-6 lg:px-8 overflow-x-hidden ">
      <div className="w-full max-w-[1300px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-5xl font-black text-[#0f172a] leading-none">Analytics</h1>
            <p className="text-slate-900">Insights and attendance trends</p>
          </div>
          <Button
  onClick={handleExportChart}
  className="shadow-sm w-full sm:w-auto"
>
  <FileDown className="h-4 w-4 mr-2" />
  Export Analytics
</Button>
        </div>

        <div className="grid grid-cols-1  md:grid-cols-3 gap-6  ">
          <StatCard title="Total Students" value={stats.totalStudents} icon={<Users className="h-5 w-5 " />} />
          <StatCard title="Total Check-ins" value={stats.totalCheckIns} icon={<Clock className="h-5 w-5" />} />
          <StatCard title="Active Today" value={stats.activeToday} icon={<Calendar className="h-5 w-5" />} />
        </div>

   <Card
  className="
    border-none
    rounded-[30px]
    overflow-hidden
    bg-[#1f2142]
    shadow-[0_15px_40px_rgba(0,0,0,0.28)]
  "
>
  <CardHeader className="pb-2">
    <CardTitle className="text-4xl font-black text-white">
  Attendance Trends
</CardTitle>

<CardDescription className="text-slate-300 text-lg font-medium">
  Unique daily check-ins for the last 7 days
</CardDescription>
  </CardHeader>
  <CardContent className="px-2 sm:px-4 md:px-6 pb-6">
            <div className="h-[800px] w-full">
              <ChartContainer config={{ count: { label: "Students", color: "hsl(var(--primary))" } }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
  data={reportData}
  margin={{ top: 20, right: 20, left: 10, bottom: 10 }}
>
  {/* Different colors per bar */}
  <CartesianGrid
    strokeDasharray="0"
    vertical={false}
    stroke="rgba(255,255,255,0.12)"
  />

  <XAxis
    dataKey="date"
    axisLine={false}
    tickLine={false}
    tick={{
      fill: "#d1d5db",
      fontSize: 14,
      fontWeight: 500,
    }}
  />

  <YAxis
    axisLine={false}
    tickLine={false}
    tick={{
      fill: "#d1d5db",
      fontSize: 14,
    }}
  />

  <ChartTooltip
    cursor={false}
    content={
      <ChartTooltipContent
        className="!bg-[#2a2d57] !border-none text-white shadow-xl rounded-xl"
      />
    }
  />

  <Bar
    dataKey="count"
    radius={[8, 8, 0, 0]}
    barSize={38}
  >
    {reportData.map((_, index) => {
      const colors = [
        "#11c5c6",
        "#00f5c4",
        "#8ce3d6",
        "#d5f4f0",
        "#7ea6ff",
        "#a5c8ff",
        "#8d93b0",
      ]

      return (
        <Cell
          key={`cell-${index}`}
          fill={colors[index % colors.length]}
        />
      )
    })}
  </Bar>
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

function StatCard({
  title,
  value,
  icon,
}: Readonly<{
  title: string
  value: number
  icon: ReactNode
}>) {
  return (
    <Card
      className="
        border-none
        rounded-[26px]
        bg-[#1f2142]
        shadow-[0_15px_40px_rgba(0,0,0,0.28)]
        overflow-hidden
      "
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p
              className="
                text-[13px]
                font-extrabold
                uppercase
                tracking-[0.16em]
                text-slate-200
              "
            >
              {title}
            </p>

            <h2
              className="
                text-[56px]
                font-black
                text-white
                leading-none
              "
            >
              {(value ?? 0).toLocaleString()}
            </h2>
          </div>

          <div
            className="
              w-14 h-14
              rounded-[18px]
              bg-gradient-to-br
              from-[#63a4ff]
              via-[#3b82f6]
              to-[#0047ab]
              flex items-center justify-center
              text-white
              shadow-[0_8px_20px_rgba(59,130,246,0.45)]
            "
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}