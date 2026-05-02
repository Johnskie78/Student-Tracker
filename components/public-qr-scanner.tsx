"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { v4 as uuidv4 } from "uuid"
import {
  CheckCircle, XCircle, ScanIcon as Scanner,
  Loader2, Camera, Keyboard, ArrowRight, Info, X
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

import {
  getStudentByStudentId,
  addTimeRecord,
  getTimeRecordsByStudentAndDate,
  type Student,
  type TimeRecord,
} from "@/lib/db"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


export default function PublicQRScanner() {
  const [activeTab, setActiveTab] = useState("camera")
  const [isScanning, setIsScanning] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [continuousMode, setContinuousMode] = useState(true)
  
  // ✅ POPUP STATE
  const [showPurposeModal, setShowPurposeModal] = useState(false)
  const [warning, setWarning] = useState<{
  show: boolean
  message: string
}>({
  show: false,
  message: "",
})
  const [purpose, setPurpose] = useState("")
  const pendingStudent = useRef<Student | null>(null)
  const pendingType = useRef<"in" | "out" | null>(null)

  const [status, setStatus] = useState<{
    student: Student | null;
    type: "in" | "out" | null;
    message: string | null;
    variant: "success" | "error" | null;
    timestamp: Date | null;
  }>({
    student: null,
    type: null,
    message: null,
    variant: null,
    timestamp: null
  })

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const cooldownRef = useRef<boolean>(false)
  const scannerBuffer = useRef<string>("")
  const lastKeyTime = useRef<number>(0)

  const getTodayLocalYYYYMMDD = useCallback(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // ✅ MAIN LOGIC — AFTER SCAN/INPUT → SHOW POPUP
  const processData = useCallback(async (studentId: string) => {
    const cleanId = studentId.trim()
    if (!cleanId || cooldownRef.current || isProcessing) return

    cooldownRef.current = true
    setIsProcessing(true)
    setPurpose("")

    try {
      const student = await getStudentByStudentId(cleanId)

      if (!student) {
  setStatus({
    student: null,
    type: null,
    variant: "error",
    timestamp: new Date(),
    message: `UNRECOGNIZED ID: ${cleanId}`,
  })

  // warning popup
  setWarning({
    show: true,
    message: `Invalid or Unregistered ID: ${cleanId}`,
  })

  // auto close
  setTimeout(() => {
    setWarning({
      show: false,
      message: "",
    })
  }, 3000)

  setIsProcessing(false)

  setTimeout(() => {
    cooldownRef.current = false
  }, 2500)

  return
}

      const today = getTodayLocalYYYYMMDD();
      const records = await getTimeRecordsByStudentAndDate(student.studentId, today)
      const latestRecord = records?.toSorted((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0]

      const nextType: "in" | "out" = latestRecord?.type === "in" ? "out" : "in"

      // ✅ IF CHECK IN → OPEN POPUP
      if (nextType === "in") {
        pendingStudent.current = student
        pendingType.current = "in"
        setShowPurposeModal(true) // ✅ SHOW FULL PAGE POPUP
        setIsProcessing(false)
        return
      }

      // ✅ IF CHECK OUT → DIRECT SAVE
      const newTimestamp = new Date();
      await addTimeRecord({
        id: uuidv4(),
        studentId: student.studentId,
        timestamp: newTimestamp,
        type: nextType,
        date: today,
        school: student.school,
        purpose: ""
      })

      setStatus({
        student, type: nextType, variant: "success", timestamp: newTimestamp,
        message: `${student.firstName} ${student.lastName} — CHECK ${nextType.toUpperCase()}`,
      })

    } catch (error) {
      console.error("Error processing scan:", error)
      setStatus(prev => ({ ...prev, message: "SYSTEM CONNECTION ERROR", variant: "error" }))
    } finally {
      setIsProcessing(false)
      setTimeout(() => { cooldownRef.current = false }, 2500)
    }
  }, [isProcessing, getTodayLocalYYYYMMDD])

  // ✅ SAVE AFTER POPUP SUBMIT
  const saveAttendance = useCallback(async (student: Student, type: "in" | "out", purposeText: string) => {
    try {
      const today = getTodayLocalYYYYMMDD();
      const newTimestamp = new Date();

      await addTimeRecord({
        id: uuidv4(),
        studentId: student.studentId,
        timestamp: newTimestamp,
        type: type,
        date: today,
        school: student.school,
        purpose: purposeText
      })

      setStatus({
        student, type, variant: "success", timestamp: newTimestamp,
        message: `${student.firstName} ${student.lastName} — CHECK ${type.toUpperCase()}`,
      })

      // Reset all
      pendingStudent.current = null
      pendingType.current = null
      setShowPurposeModal(false)
      setPurpose("")

    } catch (error) {
      console.error("Error saving:", error)
      setStatus(prev => ({ ...prev, message: "SYSTEM CONNECTION ERROR", variant: "error" }))
    } finally {
      setIsProcessing(false)
      setTimeout(() => { cooldownRef.current = false }, 2500)
    }
  }, [getTodayLocalYYYYMMDD])
const handlePurposeSubmit = useCallback(
  (e: React.FormEvent) => {
    e.preventDefault()

    if (!purpose) {
      alert("⚠️ Please select a purpose")
      return
    }

    setIsProcessing(true)

    saveAttendance(
      pendingStudent.current!,
      "in",
      purpose
    )
  },
  [purpose, saveAttendance]
)


  useEffect(() => {
    if (activeTab === "manual") {
      const timer = setTimeout(() => {
        const input = document.getElementById("terminal-input");
        if (input) (input as HTMLInputElement).focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (showPurposeModal) return // ❌ BLOCK SCAN WHILE POPUP OPEN
      if (e.key === "Shift" || e.key === "Control" || e.key === "Alt" || e.metaKey || e.ctrlKey) return;

      const currentTime = Date.now();
      if (currentTime - lastKeyTime.current > 200) scannerBuffer.current = "";

      if (e.key === "Enter") {
        if (scannerBuffer.current.length > 2) {
          const cleanedId = scannerBuffer.current.replaceAll(/[^a-zA-Z0-9]/g, "");
          processData(cleanedId);
          scannerBuffer.current = "";
        }
      } else if (e.key?.length === 1) scannerBuffer.current += e.key;
      lastKeyTime.current = currentTime;
    }

    globalThis.addEventListener("keydown", handleGlobalKeyDown);
    return () => globalThis.removeEventListener("keydown", handleGlobalKeyDown);
  }, [processData, showPurposeModal]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop()
      setIsScanning(false)
    }
  }, [])

  const startScanner = async () => {
    try {
      const html5QrCode = new Html5Qrcode("reader")
      scannerRef.current = html5QrCode
      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 15,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1,
          disableFlip: false,
        },
        (text) => {
          if (!showPurposeModal) { // ✅ ONLY SCAN IF POPUP CLOSED
            processData(text)
            if (!continuousMode) stopScanner()
          }
        },
        () => { }
      )
      setIsScanning(true)
    } catch (err) { console.error(err) }
  }

  const formatTime = (date: Date | null) =>
    date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : "--:--:--"

  return (
    <div className="flex p-2 sm:p-4 lg:p-4 overflow-hidden rounded-[32px] shadow-2xl mx-auto bg-gradient-to-br from-slate-900 to-indigo-900"> {/* BACKGROUND MATCHED */}
      {/* ✅ FULL PAGE POPUP — WITH BACK BUTTON */}
{showPurposeModal && (
  <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md sm:max-w-lg p-6 border-4 border-amber-400 animate-in zoom-in duration-300 relative">
      {/* ✅ BACK BUTTON — TOP LEFT */}
      <button
        onClick={() => {
          setShowPurposeModal(false);
          pendingStudent.current = null;
          pendingType.current = null;
          setPurpose("");
        }}
        className="absolute top-4 left-4 flex items-center gap-1 text-amber-700 hover:text-amber-900 font-medium transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
        </svg>
        Back
      </button>

      <div className="text-center mb-4 mt-6"> {/* added margin-top to avoid overlap */}
        <h2 className="text-xl font-bold text-amber-800 flex items-center justify-center gap-2">
          <Info className="w-5 h-5 text-amber-600" />
          PURPOSE OF VISIT
        </h2>
        <p className="text-sm text-red-600 font-medium mt-1">* Cannot check-in without purpose</p>
      </div>

      <form onSubmit={handlePurposeSubmit} className="space-y-4">
        
<div className="mt-5">
  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
    
  </Label>

  <Select
    value={purpose}
    onValueChange={setPurpose}
  >
    <SelectTrigger
      className={cn(
        "h-12 w-full rounded-xl border-2 bg-white text-black",
        "focus:ring-2 focus:ring-amber-300",
        purpose
          ? "border-amber-400"
          : "border-red-500"
      )}
    >
      <SelectValue
        placeholder="Select purpose"
        className="text-black"
      />
    </SelectTrigger>

    <SelectContent
      side="bottom"
      align="center"
      className="mt-2 bg-white text-black border border-gray-200 rounded-xl shadow-xl"
    >
      <SelectItem value="Study" className="text-black">
        Study
      </SelectItem>

      <SelectItem value="Research" className="text-black">
        Research
      </SelectItem>

      <SelectItem value="Borrow Book" className="text-black">
        Borrow Book
      </SelectItem>

      <SelectItem value="Return Book" className="text-black">
        Return Book
      </SelectItem>

      <SelectItem value="Print Documents" className="text-black">
        Print Documents
      </SelectItem>

      <SelectItem value="Internet Use" className="text-black">
        Internet Use
      </SelectItem>

      <SelectItem value="Group Study" className="text-black">
        Group Study
      </SelectItem>

      <SelectItem value="Assignment" className="text-black">
        Assignment
      </SelectItem>

      <SelectItem value="Thesis" className="text-black">
        Thesis / Capstone
      </SelectItem>

      <SelectItem value="Reading" className="text-black">
        Reading
      </SelectItem>

      <SelectItem value="Consultation" className="text-black">
        Consultation
      </SelectItem>

      <SelectItem value="Visitor" className="text-black">
        Visitor
      </SelectItem>

 <SelectItem value="Use Computer" className="text-black">
        Use Computer
      </SelectItem>

    </SelectContent>
  </Select>

  {!purpose && (
    <p className="text-xs text-red-500 mt-2">
      Please select a purpose before checking in.
    </p>
  )}
</div>
        <Button
          type="submit"
          className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg text-base"
          disabled={isProcessing || !purpose.trim()}
        >
          {isProcessing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
          Save & Check In
        </Button>
      </form>
    </div>
  </div>
)}
    {/* INVALID ID WARNING */}
{warning.show && (
  <div
    className="
      fixed
      top-6
      left-1/2
      -translate-x-1/2
      z-[9999]
      animate-in
      slide-in-from-top-5
      duration-300
    "
  >
    <div
      className="
        flex
        items-center
        gap-3
        bg-red-600
        text-white
        px-6
        py-4
        rounded-2xl
        shadow-xl
      "
    >
      <XCircle className="w-6 h-6" />

      <div>
        <h3 className="font-bold uppercase text-sm">
          Access Denied
        </h3>

        <p className="text-sm text-red-100">
          {warning.message}
        </p>
      </div>
    </div>
  </div>
)}  

      {/* ✅ MAIN CONTAINER — FULL HEIGHT, NO WHITE GAP IN F11 */}
      {/* ✅ MAIN CONTAINER — FULLY ADJUSTABLE WIDTH / HEIGHT / GAP */}
<div
  className="
    w-full
    max-w-[1800px]
    mx-auto
    bg-white
    rounded-[24px]
    shadow-2xl
    overflow-hidden

    grid
    grid-cols-1
    lg:grid-cols-[380px_1fr]

    min-h-screen
    lg:min-h-[82vh]
  "
>
        {/* LEFT PANEL — FULL HEIGHT */}
        <div
  className="
    p-4 sm:p-6 lg:p-8
    bg-white
    flex
    flex-col
    border-b
    lg:border-b-0
    lg:border-r
    border-slate-200
    overflow-hidden
  "
>
          <header className="mb-4 shrink-0">
            <h1 className="text-xl font-bold tracking-[0.2em] text-slate-900 uppercase mb-1">Attendance System</h1>
            <p className="text-xl font-semibold text-slate-900 tracking-tight">Kiosk Terminal</p>
          </header>

          <Tabs 
  value={activeTab} 
  onValueChange={(v) => { setActiveTab(v); stopScanner(); }} 
  className="w-full flex-1 flex flex-col overflow-hidden"
>
  {/* ✅ TABS LIST — 3D CONTAINER */}
  <TabsList 
    className="
      grid grid-cols-2 
      mb-6 h-12 
      bg-indigo-50/70 
      p-1.5 
      rounded-[16px] 
      shrink-0
      border border-indigo-100/50

      /* ✅ 3D SHADOWS — OUTER + INNER DEPTH */
      shadow-[
        0_8px_20px_rgba(99,102,241,0.08),
        inset_0_1px_3px_rgba(255,255,255,0.8),
        inset_0_-1px_2px_rgba(99,102,241,0.04)
      ]

      backdrop-blur-sm
    "
  >
    {/* ✅ VISUAL SCAN TAB — 3D ACTIVE STATE */}
    <TabsTrigger 
      value="camera" 
      className="
        rounded-[12px] 
        gap-2 
        font-medium 
        text-sm 

        /* ✅ INACTIVE STATE */
        text-black-600/80 
        bg-transparent
        hover:bg-white/50
        hover:text-indigo-700

        /* ✅ ACTIVE STATE — RAISED 3D */
        data-[state=active]:bg-white 
        data-[state=active]:text-indigo-700
        data-[state=active]:shadow-[
          0_4px_12px_rgba(99,102,241,0.12),
          inset_0_1px_2px_rgba(255,255,255,0.9)
        ]
        data-[state=active]:border border-indigo-50/60

        transition-all duration-200 ease-out
      "
    >
      <Camera className="w-4 h-4  text-black" /> Visual Scan
    </TabsTrigger>

    {/* ✅ TERMINAL INPUT TAB — SAME STYLE */}
    <TabsTrigger 
      value="manual" 
      className="
        rounded-[12px] 
        gap-2 
        font-medium 
        text-sm

        /* ✅ INACTIVE STATE */
        text-black-600/80 
        bg-transparent
        hover:bg-white/50
        hover:text-indigo-700

        /* ✅ ACTIVE STATE — RAISED 3D */
        data-[state=active]:bg-white 
        data-[state=active]:text-indigo-700
        data-[state=active]:shadow-[
          0_4px_12px_rgba(99,102,241,0.12),
          inset_0_1px_2px_rgba(255,255,255,0.9)
        ]
        data-[state=active]:border border-indigo-50/60

        transition-all duration-200 ease-out
      "
    >
      <Keyboard className="w-4 h-4 text-black" /> Terminal Input
    </TabsTrigger>
  </TabsList>

     <TabsContent value="camera" className="space-y-4 flex-1 overflow-hidden ">
  {/* ✅ CAMERA BOX — 3D EFFECT */}
  <div className="relative group w-fullaspect-[4/5] sm:aspect-square rounded-[24px] overflow-hidden bg-slate-950 border-[8px] border-slate-500
                  shadow-[rounded-[24px] 0_10px_25px_rgba(0,0,0,0.15),inset_0_2px_10px_rgba(255,255,255,0.08)] 
                  transform transition-all duration-300 group-hover:scale-[0.99] group-hover:shadow-[0_15px_30px_rgba(0,0,0,0.2)]">
    <div id="reader" className="w-full h-full object-cover" />
    {!isScanning && (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] rounded-[24px]">
        <Button 
          size="lg" 
          onClick={startScanner} 
          className="rounded-full h-12 px-6 text-sm font-bold 
                     shadow-[0_8px_20px_rgba(79,70,229,0.3)] 
                     bg-indigo-600 hover:bg-indigo-700 
                     transform hover:-translate-y-1 transition-all duration-200"
        >
          Activate Camera
        </Button>
      </div>
    )}
  </div>

  {/* ✅ CONTINUOUS MODE BAR — 3D SOFT EFFECT */}
  <div className="flex items-center justify-between px-4 py-3 bg-slate-200 rounded-[16px] border border-slate-200  shrink-0
                  shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)] transition-shadow">
    <div className="flex items-center space-x-2">
      <Switch id="cont" checked={continuousMode} onCheckedChange={setContinuousMode} />
      <Label htmlFor="cont" className="text-xs font-bold text-slate-600 cursor-pointer">Continuous Mode</Label>
    </div>
    {isScanning && (
      <Button 
        variant="ghost" 
        onClick={stopScanner} 
        className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-bold text-xs h-8 px-2
                   shadow-sm hover:shadow-md transition-shadow"
      >
        Stop
      </Button>
    )}
  </div>
</TabsContent>

<TabsContent value="manual" className="space-y-4 flex-2 overflow-hidden flex flex-col">
  {/* ✅ MANUAL INPUT CARD — ENHANCED PREMIUM 3D EFFECT */}
  <div 
    className="
      p-6 
      bg-indigo-50/80 
      rounded-[24px] 
      border border-indigo-100/70 
      h-full 
      flex flex-col justify-center
      backdrop-blur-md

      /* ✅ MAIN 3D SHADOWS — OUTER + INNER DEPTH */
      shadow-[
        0_20px_40px_rgba(99,102,241,0.15),
        0_8px_16px_rgba(99,102,241,0.08),
        inset_0_2px_6px_rgba(255,255,255,0.8),
        inset_0_-2px_4px_rgba(99,102,241,0.05)
      ]

      /* ✅ HOVER ANIMATION — LIFT + DEEPER SHADOW */
      transform hover:translate-y-[-4px] hover:scale-[1.01]
      hover:shadow-[
        0_25px_50px_rgba(99,102,241,0.2),
        0_12px_24px_rgba(99,102,241,0.12),
        inset_0_2px_6px_rgba(255,255,255,0.9),
        inset_0_-2px_4px_rgba(99,102,241,0.07)
      ]

      transition-all duration-300 ease-out
    "
  >
    {/* ✅ HEADER SECTION — 3D CARD INSIDE */}
    <div 
      className="
        flex items-start gap-3 
        text-indigo-700 
        mb-5
        bg-white/70 
        p-5 
        rounded-[18px] 
        border border-indigo-50/60

        /* ✅ INNER CARD 3D */
        shadow-[
          0_8px_20px_rgba(99,102,241,0.1),
          inset_0_1px_3px_rgba(255,255,255,0.9)
        ]
        hover:shadow-[0_10px_25px_rgba(99,102,241,0.14)]
        transition-shadow duration-200
      "
    >
      <div 
        className="
          mt-1 
          p-2.5 
          bg-indigo-100 
          rounded-[12px]
          shadow-[inset_0_2px_4px_rgba(99,102,241,0.15)]
        "
      >
        <Scanner className="w-5 h-5 text-indigo-600" />
      </div>
      <p className="text-sm font-medium leading-relaxed">
        Tap your physical ID card against the scanner. The system will auto-detect the input.
      </p>
    </div>

    {/* ✅ INPUT FORM — FLOATING 3D INPUT */}
    <form onSubmit={(e) => {
      e.preventDefault();
      const val = new FormData(e.currentTarget).get("studentId") as string;
      processData(val);
      e.currentTarget.reset();
    }}>
      <div className="relative">
        <Input
          id="terminal-input"
          name="studentId"
          autoFocus
          placeholder="Input Student ID"
          className="
            h-12 
            pl-4 
            pr-12 
            text-base 
            font-mono 
            rounded-[14px] 
            border-indigo-200/60 
            text-gray-900
            bg-white/90 
            backdrop-blur-sm

            /* ✅ INPUT 3D EFFECT — PRESSED LOOK */
            shadow-[
              inset_0_3px_6px_rgba(0,0,0,0.07),
              0_4px_12px_rgba(99,102,241,0.06)
            ]

            focus:outline-none 
            focus:border-indigo-300 
            focus:bg-white
            focus:shadow-[
              inset_0_3px_6px_rgba(0,0,0,0.05),
              0_6px_20px_rgba(99,102,241,0.15)
            ]

            transition-all duration-200
          "
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={isProcessing} 
          className="
            absolute right-2 top-2 
            h-8 w-8 
            rounded-[10px] 
            bg-slate-900 
            text-white

            /* ✅ BUTTON 3D — RAISED */
            shadow-[0_4px_12px_rgba(0,0,0,0.25)]
            hover:shadow-[0_6px_16px_rgba(0,0,0,0.3)]
            hover:bg-slate-800
            active:translate-y-[1px] 
            active:shadow-[0_2px_6px_rgba(0,0,0,0.2)]

            transform transition-all duration-150
          "
        >
          {isProcessing ? <Loader2 className="animate-spin w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
        </Button>
      </div>
    </form>
  </div>
</TabsContent>
          </Tabs>
        </div>

       {/* RIGHT PANEL — STUDENT INFO & STATUS */}
<div
  className="
    relative
    p-4 sm:p-6 lg:p-8
    min-h-[420px]
    lg:min-h-full

    text-white
    flex
    flex-col
    items-center
    justify-center
    transition-all
    duration-700
  "
  style={{
    // ✅ FIX: removed invalid `□` characters
    background: status.type === null 
      ? "linear-gradient(to bottom, #16213e, #0f172a)" 
      : status.type === "in" 
        ? "linear-gradient(to bottom, #10b981, #059669)" 
        : "linear-gradient(to bottom, #ef4444, #dc2626)"
  }}
>
        <div className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_70%)]" />

        {status.student ? (
  <div className="w-full max-w-none space-y-10 text-center animate-in zoom-in-95 duration-500 relative z-10 px-4 lg:px-8">
    {/* ✅ AVATAR / PROFILE PHOTO — ADJUST SIZE HERE */}
<div className="relative inline-block">
  <div className={cn(
    "absolute inset-0 rounded-full blur-3xl animate-pulse",
    status.type === "in" ? "bg-emerald-200/40" : "bg-rose-200/40"
  )} />
  <Avatar
  className="
    h-36 w-36
    sm:h-48 sm:w-48
    md:h-60 md:w-60
    lg:h-80 lg:w-80
    mx-auto
    border-[6px]
    border-white
    shadow-[0_20px_40px_rgba(0,0,0,0.25)]
  "
>
    {/* ⬆️ CHANGE h-60 w-60 TO ADJUST SIZE:
      h-48 w-48 = smaller
      h-60 w-60 = medium (current)
      h-72 w-72 = bigger
      h-80 w-80 = very big
    */}
    <AvatarImage src={status.student.photoUrl} className="object-cover" />
    <AvatarFallback className="text-6xl font-black bg-slate-100 text-slate-800 italic">
      {status.student.firstName[0]}
    </AvatarFallback>
  </Avatar>
</div>

    <div className="text-white space-y-2 w-full rounded-[32px] p-6 lg:p-10 overflow-hidden shadow-2xl">
      {/* ✅ FULL NAME — MAX SIZE, FULL WIDTH */}
    <h2 
    className="font-black uppercase tracking-widest leading-none break-words text-center"
    style={{
      // ✅ MAX SIZE: 4rem = 64px (biggest possible), shrink only when needed
      fontSize: `clamp(1.5rem, calc(5rem - ${(
        status.student.firstName.length + 
        (status.student.middleName?.length || 0) + 
        status.student.lastName.length
      ) * 0.1}rem), 4rem)`,
      width: "100%",
      maxWidth: "100%",
      overflow: "hidden",
      textOverflow: "ellipsis",
      letterSpacing: "0.05em", // ✅ Exact wide spacing like your screenshot
      lineHeight: "1"
    }}
  >
    {status.student.firstName}
    {status.student.middleName && ` ${status.student.middleName.charAt(0)}.`}
    {" "}
    {status.student.lastName}
  </h2>

    {/* ✅ COURSE — EXACT SAVED FORMAT */}
<p className="text-lg font-medium text-white/80 uppercase tracking-wider whitespace-nowrap">
  {status.student.course && status.student.course.trim() !== "" 
    ? status.student.course 
    : "COURSE NOT SET"}
</p>

      {/* ✅ YEAR + SEMESTER — MAX SIZE, FULL WIDTH, STRAIGHT, HIDE IF EMPTY */}
{((status.student.yearLevel && status.student.yearLevel.trim() !== "") || 
  (status.student.semester && status.student.semester.trim() !== "")) && (
  <p className="text-[clamp(1.1rem,2.5vw,1.3rem)] font-medium uppercase tracking-wider w-full whitespace-nowrap text-center text-white/90">
    {status.student.yearLevel?.trim() && `${status.student.yearLevel.toUpperCase()} YEAR`}
    {(status.student.yearLevel?.trim() && status.student.semester?.trim()) && " | "}
    {status.student.semester?.trim() && status.student.semester.toUpperCase()}
  </p>
)}
    </div>

    {/* ✅ CHECK IN / OUT BOX — ADJUST SIZE HERE */}
<div className="bg-white/10 backdrop-blur-xl rounded-[20px] p-6 lg:p-2 text-white border border-white/20 shadow-xl w-full max-w-[700px] mx-auto">
  {/* ⬆️ CHANGE max-w: max-w-[800px] = wider, max-w-[600px] = narrower */}
  <div className="flex items-center justify-center gap-2 mb-3">
    <span className="text-base lg:text-lg font-black uppercase tracking-[0.2em] opacity-90">
      CHECK {status.type === "in" ? "IN" : "OUT"} • CONFIRMED
    </span>
  </div>
  <p className="text-[clamp(2.2rem,6vw,4rem)] font-bold tracking-tighter tabular-nums leading-none">
    {formatTime(status.timestamp)}
  </p>
</div>
  </div>
) : (
          <div className="text-center space-y-6 relative z-10">
            <div className="relative w-[100px] h-[100px] mx-auto">
              <div className="absolute top-0 left-0 w-6 h-6 border-[3px] border-slate-500 border-r-0 border-b-0 rounded-tl-md" />
              <div className="absolute top-0 right-0 w-6 h-8 border-[3px] border-slate-600 border-l-0 border-b-0 rounded-tr-md" />
              <div className="absolute bottom-0 left-0 w-6 h-8 border-[3px] border-slate-600 border-r-0 border-t-0 rounded-bl-md" />
              <div className="absolute bottom-0 right-0 w-6 h-8 border-[3px] border-slate-600 border-l-0 border-t-0 rounded-br-md" />
            </div>
                            <div className="space-y-2">
                  <h3 className="text-white/40 text-xl font-bold uppercase tracking-widest">System Standby</h3>
                  <p className="text-white/60 text-sm">Ready to scan ID card</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
   
  );
}