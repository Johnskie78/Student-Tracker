"use client"

import {
  useState,
  useEffect,
  useMemo,
  useId,
  type ReactNode,
} from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getStudentStatistics, type StudentStats } from "@/lib/db"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts"
import {
  Users,
  GraduationCap,
  School,
  Activity,
  ShieldCheck,
  Zap,
  History,
  FileBarChart,
  Info,
} from "lucide-react"
import { HIGHER_EDUCATION_PROGRAMS } from "@/lib/education-programs"
import { useRouter } from "next/navigation"




const COLORS = [
  "#6366f1", "#06b6d4", "#14b8a6", "#10b981", "#f59e0b", 
  "#f97316", "#ef4444", "#d946ef", "#a855f7", "#3b82f6"
]

export default function DashboardStats() {
 const [stats, setStats] = useState<StudentStats | null>(null)
const [isLoading, setIsLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
const [activeTab, setActiveTab] = useState("overview")

const [chartReady, setChartReady] = useState(false)
const chartId = useId()

const router = useRouter()


type StatSummaryCardProps = {
  title: string
  value?: string | number
  icon: ReactNode
  color?: string
}

function StatSummaryCard({
  title,
  value,
  icon,
}: Readonly<StatSummaryCardProps>) {
  return (
    <Card className="border-none rounded-[24px] overflow-hidden bg-[#1f2142] shadow-2xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p
              className="
                text-sm
                font-extrabold
                uppercase
                tracking-[0.12em]
                text-slate-300
              "
            >
              {title}
            </p>

            <h2
              className="
                text-5xl
                font-black
                text-white
                leading-none
              "
            >
              {value ?? 0}
            </h2>
          </div>

          <div
            className="
              p-4
              rounded-2xl
              bg-gradient-to-r
              from-[#63a4ff]
              to-[#0047ab]
              text-white
              shadow-[0_8px_20px_rgba(0,71,171,0.45)]
            "
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

type SystemInfoItemProps = {
  icon: ReactNode
  label: string
  value: string
  isPublic?: boolean

}

function SystemInfoItem({
  icon,
  label,
  value,
  isPublic = false,
}: Readonly<SystemInfoItemProps>) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/40">
      <div className="flex items-center gap-3">
        <div className="text-indigo-400">
          {icon}
        </div>

        <span className="text-sm font-medium text-slate-200">
          {label}
        </span>
      </div>

      <span
        className={`text-[10px] font-black tracking-wider uppercase px-3 py-1 rounded-full ${
          isPublic
            ? "bg-emerald-500/20 text-emerald-400"
            : "bg-rose-500/20 text-rose-400"
        }`}
      >
        {value}
      </span>
    </div>
  )
}
useEffect(() => {
  let mounted = true

  const loadStats = async () => {
    try {
      const studentStats = await getStudentStatistics()

      if (mounted) {
        setStats(studentStats)
      }
    } catch (err) {
      console.error("Error loading statistics:", err)

      if (mounted) {
        setError("Failed to load analytics")
      }
    } finally {
      if (mounted) {
        setIsLoading(false)
      }
    }
  }

  loadStats()

  return () => {
    mounted = false
  }
}, [])
  const programData = useMemo(() => {
    if (!stats) return []
    return Object.entries(stats?.programCounts ?? {})
      .map(([program, count], index) => {
        const programInfo = HIGHER_EDUCATION_PROGRAMS.find(p => p.code === program)
        return {
          name: programInfo ? programInfo.code : program,
          fullName: programInfo ? programInfo.name : program,
          students: Number(count),
          fill: COLORS[index % COLORS.length],
        }
      })
      .sort((a, b) => b.students - a.students)
  }, [stats])

  const schoolDistData = useMemo(() => [
    { name: "Higher Ed", value: stats?.higherEducationCount || 0 },
    { name: "Basic Ed", value: stats?.basicEducationCount || 0 },
  ], [stats])
  
if (error) {
  return (
    <Card className="rounded-[20px] shadow-xl border-none">
      <CardContent className="p-8 text-center">
        <p className="text-red-500 font-bold">
          {error}
        </p>
      </CardContent>
    </Card>
  )
}

if (isLoading) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card
          key={i}
          className="h-[120px] animate-pulse bg-slate-200"
        />
      ))}
    </div>
  )
}


  return (
    <div className="space-y-8">
      {/* ✅ TOP STAT CARDS — MATCHED YOUR DESIGN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatSummaryCard title="TOTAL STUDENTS" value={stats?.totalStudents ?? 0} icon={<Users />} color="text-slate-900" />
        <StatSummaryCard title="CURRENTLY ACTIVE" value={stats?.activeStudents ?? 0} icon={<Activity />} color="text-emerald-600" />
        <StatSummaryCard title="HIGHER EDUCATION" value={stats?.higherEducationCount ?? 0} icon={<GraduationCap />} color="text-indigo-600" />
        <StatSummaryCard title="BASIC EDUCATION" value={stats?.basicEducationCount ?? 0} icon={<School />} color="text-fuchsia-600" />
      </div>

      {/* ✅ CUSTOM TABS — SEPARATED SECTIONS, 3D EFFECT, EXACT STYLE */}
<Tabs
  value={activeTab}
  onValueChange={setActiveTab}
  className="w-full"
>
        <TabsList 
          className="
            grid w-full grid-cols-2 md:grid-cols-4
            bg-slate-200/60 backdrop-blur-md 
            p-1.5 rounded-[14px] h-auto gap-1
            shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)]
          "
        >
          <TabsTrigger 
            value="overview" 
            className="
              rounded-[10px] py-2.5 px-3 
              font-extrabold text-[11px] uppercase tracking-[0.12em]
              transition-all duration-250 ease-out relative
              text-slate-600/90 
              hover:bg-white/50 hover:text-indigo-700/80
              data-[state=active]:bg-white 
              data-[state=active]:text-indigo-700
              data-[state=active]:shadow-[0_4px_12px_rgba(99,102,241,0.12)]
              data-[state=active]:translate-y-[-2px]
            "
          >
            
            OVERVIEW
          </TabsTrigger>

          <TabsTrigger 
            value="programs" 
            className="
              rounded-[10px] py-2.5 px-3 
              font-extrabold text-[11px] uppercase tracking-[0.12em]
              transition-all duration-250 ease-out relative
              text-slate-600/90 
              hover:bg-white/50 hover:text-indigo-700/80
              data-[state=active]:bg-white 
              data-[state=active]:text-indigo-700
              data-[state=active]:shadow-[0_4px_12px_rgba(99,102,241,0.12)]
              data-[state=active]:translate-y-[-2px]
            "
          >
            PROGRAMS
          </TabsTrigger>

          <TabsTrigger 
            value="levels" 
            className="
              rounded-[10px] py-2.5 px-3 
              font-extrabold text-[11px] uppercase tracking-[0.12em]
              transition-all duration-250 ease-out relative
              text-slate-600/90 
              hover:bg-white/50 hover:text-indigo-700/80
              data-[state=active]:bg-white 
              data-[state=active]:text-indigo-700
              data-[state=active]:shadow-[0_4px_12px_rgba(99,102,241,0.12)]
              data-[state=active]:translate-y-[-2px]
            "
          >
            LEVELS
          </TabsTrigger>

          <TabsTrigger 
            value="details" 
            className="
              rounded-[10px] py-2.5 px-3 
              font-extrabold text-[11px] uppercase tracking-[0.12em]
              transition-all duration-250 ease-out relative
              text-slate-600/90 
              hover:bg-white/50 hover:text-indigo-700/80
              data-[state=active]:bg-white 
              data-[state=active]:text-indigo-700
              data-[state=active]:shadow-[0_4px_12px_rgba(99,102,241,0.12)]
              data-[state=active]:translate-y-[-2px]
            "
          >
            DETAILS
          </TabsTrigger>
        </TabsList>

        {/* ✅ OVERVIEW SECTION — SEPARATED */}
        <TabsContent
  value="overview"
  className="mt-6 data-[state=inactive]:hidden"
>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
            <Card className="lg:col-span-2 bg-[#0a0e27] text-white border-none rounded-[20px] shadow-2xl min-w-0 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Program Distribution</CardTitle>
                <CardDescription className="text-slate-300">Student count per academic program</CardDescription>
              </CardHeader>
           <CardContent className="w-full min-w-0 overflow-hidden">
  <div className="w-full min-w-0 h-[350px]">
  <ResponsiveContainer
  width="99%"
  height="100%"
  minWidth={0}
  minHeight={300}
>
               <BarChart
  key={activeTab}
  data={programData.slice(0, 8)}
  margin={{ top: 20, right: 20, left: -10, bottom: 10 }}
>
  <CartesianGrid
    strokeDasharray="0"
    vertical={false}
    stroke="rgba(255,255,255,0.08)"
  />

  <XAxis
    dataKey="name"
    axisLine={false}
    tickLine={false}
    tick={{
      fill: "#cbd5e1",
      fontSize: 13,
      fontWeight: 700,
    }}
  />

  <YAxis
    axisLine={false}
    tickLine={false}
    tick={{
      fill: "#94a3b8",
      fontSize: 13,
      fontWeight: 600,
    }}
  />

 <Tooltip
  cursor={false}
  contentStyle={{
    backgroundColor: "#1f2142",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  }}
  labelStyle={{
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "18px",
  }}
  itemStyle={{
    color: "#ffffff",
    fontWeight: 600,
    fontSize: "16px",
  }}
  formatter={(value) => [
    <span style={{ color: "#ffffff" }}>
      {value}
    </span>,
    "students",
  ]}
/>

  <Bar
    dataKey="students"
    radius={[10, 10, 0, 0]}
    barSize={42}
  >
    {programData.slice(0, 8).map((_, index) => {
      const premiumColors = [
        "#00E5FF", // cyan
        "#3B82F6", // blue
        "#6366F1", // indigo
        "#8B5CF6", // violet
        "#14B8A6", // teal
        "#22C55E", // green
        "#F59E0B", // amber
        "#EC4899", // pink
      ]

      return (
        <Cell
          key={index}
          fill={premiumColors[index % premiumColors.length]}
        />
      )
    })}
  </Bar>
</BarChart>
                    </ResponsiveContainer>
  </div>
</CardContent>
            </Card>

            <Card className="bg-[#0a0e27] text-white border-none rounded-[20px] shadow-2xl min-w-0 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Enrollment Mix</CardTitle>
              </CardHeader>
              <CardContent className="overflow-hidden">
  <div className="w-full min-w-0 h-[300px]">
                  <ResponsiveContainer width="99%" height="100%" >
                   <PieChart key={activeTab}>
                      <Pie
                        data={schoolDistData}
                        innerRadius={60}
                        outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {schoolDistData.map((_, i) => <Cell key={i} fill={COLORS[i]} stroke="none" />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', color: 'white', border: 'none' }} />
                    <Legend verticalAlign="bottom" iconType="circle" formatter={(value) => <span style={{color: '#cbd5e1'}}>{value}</span>} />
                  </PieChart>
                   </ResponsiveContainer>
  </div>
</CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ✅ PROGRAMS SECTION — SEPARATED */}
        <TabsContent
  value="programs"
  className="mt-6 data-[state=inactive]:hidden"
>
          <Card className="bg-[#0a0e27] text-white border-none rounded-[20px] shadow-2xl p-6 min-w-0 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Program List & Statistics</CardTitle>
              <CardDescription className="text-slate-300">Full breakdown of all academic programs</CardDescription>
            </CardHeader>
            <CardContent className="overflow-hidden">
  <div className="w-full min-w-0 h-[450px]">
  <ResponsiveContainer
  width="99%"
  height="100%"
  minWidth={0}
  minHeight={300}
>
  <BarChart
  key={activeTab}
  data={programData}
  layout="vertical"
  margin={{ top: 20, right: 20, left: 20, bottom: 10 }}
>
    <CartesianGrid
      strokeDasharray="0"
      horizontal={false}
      stroke="rgba(255,255,255,0.08)"
    />

    <XAxis
      type="number"
      axisLine={false}
      tickLine={false}
      tick={{
        fill: "#cbd5e1",
        fontSize: 13,
        fontWeight: 700,
      }}
    />

    <YAxis
      dataKey="name"
      type="category"
      width={100}
      axisLine={false}
      tickLine={false}
      tick={{
        fill: "#d1d5db",
        fontSize: 14,
        fontWeight: 700,
      }}
    />

   <Tooltip
  cursor={false}
  contentStyle={{
    backgroundColor: "#1f2142",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  }}
  labelStyle={{
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "18px",
  }}
  itemStyle={{
    color: "#ffffff",
    fontWeight: 600,
    fontSize: "16px",
  }}
  formatter={(value) => [
    <span style={{ color: "#ffffff" }}>
      {value}
    </span>,
    "students",
  ]}
/>

    <Bar
      dataKey="students"
      radius={[0, 10, 10, 0]}
      barSize={30}
    >
      {programData.map((entry, index) => (
        <Cell
          key={index}
          fill={entry.fill}
        />
      ))}
    </Bar>
  </BarChart>
</ResponsiveContainer>
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ✅ LEVELS SECTION — SEPARATED */}
        <TabsContent value="levels"  className="mt-6 data-[state=inactive]:hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
            <Card className="bg-[#0a0e27] text-white border-none rounded-[20px] shadow-2xl p-6">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Education Level Split</CardTitle>
              </CardHeader>
             <CardContent className="overflow-hidden">
  <div className="w-full min-w-0 h-[350px]">
    <ResponsiveContainer
      width="99%"
      height="100%"
      minWidth={0}
      minHeight={300}
    >
                  <PieChart key={activeTab}>
                    <Pie data={schoolDistData} innerRadius={50} outerRadius={90} paddingAngle={5} dataKey="value" label>
                      {schoolDistData.map((_, i) => <Cell key={i} fill={COLORS[i]} stroke="none" />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', color: 'white', border: 'none' }} />
                  </PieChart>
                 </ResponsiveContainer>
  </div>
</CardContent>
            </Card>

            <Card className="bg-[#0a0e27] text-white border-none rounded-[20px] shadow-2xl p-6">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Level Comparison</CardTitle>
              </CardHeader>
             <CardContent className="overflow-hidden">
  <div className="w-full min-w-0 h-[350px]">
    <ResponsiveContainer
      width="99%"
      height="100%"
      minWidth={0}
      minHeight={300}
    >
  <BarChart
  key={activeTab}
  data={programData}
  layout="vertical"
  margin={{ top: 20, right: 20, left: 20, bottom: 10 }}
    
  >
    <CartesianGrid
      strokeDasharray="0"
      horizontal={false}
      stroke="rgba(255,255,255,0.08)"
    />

    <XAxis
      type="number"
      axisLine={false}
      tickLine={false}
      tick={{
        fill: "#cbd5e1",
        fontSize: 13,
        fontWeight: 700,
      }}
    />

    <YAxis
      dataKey="name"
      type="category"
      width={100}
      axisLine={false}
      tickLine={false}
      tick={{
        fill: "#d1d5db",
        fontSize: 14,
        fontWeight: 700,
      }}
    />

 <Tooltip
  cursor={false}
  contentStyle={{
    backgroundColor: "#1f2142",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  }}
  labelStyle={{
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "18px",
  }}
  itemStyle={{
    color: "#ffffff",
    fontWeight: 600,
    fontSize: "16px",
  }}
  formatter={(value) => [
    <span style={{ color: "#ffffff" }}>
      {value}
    </span>,
    "students",
  ]}
/>

    <Bar
      dataKey="students"
      radius={[0, 10, 10, 0]}
      barSize={30}
    >
      {programData.map((entry, index) => (
        <Cell
          key={index}
          fill={entry.fill}
        />
      ))}
    </Bar>
  </BarChart>
</ResponsiveContainer>
  </div>
</CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ✅ DETAILS SECTION — SEPARATED + SIDEBAR INFO */}
        <TabsContent value="details" className="mt-6 data-[state=inactive]:hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
            <div className="lg:col-span-2 min-w-0">
              <Card className="bg-[#0a0e27] text-white border-none rounded-[20px] shadow-2xl p-6">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Detailed Analytics</CardTitle>
                  <CardDescription className="text-slate-300">Complete statistical breakdown</CardDescription>
                </CardHeader>
                <CardContent className="w-full min-w-0 h-[450px] overflow-auto">
                  <div className="space-y-4">
                    {programData.map((item, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                        <span>{item.fullName}</span>
                        <span className="font-bold text-indigo-400">{item.students} students</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ✅ SIDEBAR — ACCESS PERMISSIONS + QUICK ACCESS (like screenshot) */}
            <div className="space-y-6 min-w-0">
              <Card className="bg-[#0a0e27] text-white border-none rounded-[20px] shadow-2xl p-6">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-400" />
                    Access Permissions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SystemInfoItem icon={<Zap />} label="Scanner" value="PUBLIC" isPublic />
                  <SystemInfoItem icon={<Users />} label="Students" value="ADMIN ONLY" />
                  <SystemInfoItem icon={<History />} label="Records" value="ADMIN ONLY" />
                  <SystemInfoItem icon={<FileBarChart />} label="Analytics" value="ADMIN ONLY" />
                </CardContent>
              </Card>

              <Card className="bg-[#0a0e27] text-white border-none rounded-[20px] shadow-2xl p-6">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2"> 
                    <Info className="w-5 h-5 text-indigo-400" />
                    Quick Access
                  </CardTitle>
                    

                </CardHeader>       
               <CardContent className="space-y-4">
  <button
    onClick={() => router.push("/students")}
    className="
      flex items-center gap-3
      p-3 w-full
      bg-slate-800/50
      rounded-lg
      hover:bg-slate-700/70
      transition-all duration-300
      hover:scale-[1.02]
      text-left
    "
  >
    <GraduationCap className="w-4 h-4 text-indigo-400" />
    <span className="font-semibold text-white">
      View Programs
    </span>
  </button>

  <button
    onClick={() => router.push("/scanner")}
    className="
      flex items-center gap-3
      p-3 w-full
      bg-slate-800/50
      rounded-lg
      hover:bg-slate-700/70
      transition-all duration-300
      hover:scale-[1.02]
      text-left
    "
  >
    <Activity className="w-4 h-4 text-emerald-400" />
    <span className="font-semibold text-white">
      Active Students
    </span>
  </button>

  <button
    onClick={() => router.push("/students")}
    className="
      flex items-center gap-3
      p-3 w-full
      bg-slate-800/50
      rounded-lg
      hover:bg-slate-700/70
      transition-all duration-300
      hover:scale-[1.02]
      text-left
    "
  >
    <Users className="w-4 h-4 text-fuchsia-400" />
    <span className="font-semibold text-white">
      Student Directory
    </span>
  </button>
</CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}