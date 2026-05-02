"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Pencil, Trash2, LogIn, LogOut, Clock, Filter,
  ChevronDown, FileDown, GraduationCap, School
} from "lucide-react"

import {
  getTimeRecordsByDateAndSchool,
  getStudents,
  updateTimeRecord,
  deleteTimeRecord,
  type TimeRecord,
  type Student,
} from "@/lib/db"
import { timeRecordsToCSV, downloadAsFile } from "@/lib/export-utils"

// --- Types ---
interface PairedRecord {
  studentId: string
  student: Student | null
  checkIns: TimeRecord[]
  checkOuts: TimeRecord[]
  totalHours: string
}

// --- Helper Functions ---
const formatTime = (date: Date | string) =>
  new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

const getInitials = (firstName?: string, lastName?: string) =>
  `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`.toUpperCase() || "??";

// NEW HELPER FUNCTION: To format Date objects correctly for <input type="datetime-local">
const formatForDateTimeLocal = (date: Date | string): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// --- Sub-Component: Record Table ---
// This removes the massive code duplication between tabs
interface RecordTableProps {
  records: PairedRecord[]
  isLoading: boolean
  onEdit: (record: TimeRecord) => void
  onDelete: (id: string) => void
}

function RecordTable({ records, isLoading, onEdit, onDelete }: Readonly<RecordTableProps>) {
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-gray-500">Loading records...</p>
      </div>
    );
  }

  if (records.length === 0) {
    return <div className="p-8 text-center text-gray-500">No records found for this date.</div>;
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-semibold">Student</TableHead>
            <TableHead className="font-semibold"><div className="flex items-center text-green-600"><LogIn className="h-4 w-4 mr-1"/>In</div></TableHead>
            <TableHead className="font-semibold"><div className="flex items-center text-red-600"><LogOut className="h-4 w-4 mr-1"/>Out</div></TableHead>
            <TableHead className="font-semibold"><div className="flex items-center"><Clock className="h-4 w-4 mr-1"/>Total</div></TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((paired) => (
            <TableRow key={paired.studentId}>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={paired.student?.photoUrl} />
                    <AvatarFallback>{getInitials(paired.student?.firstName, paired.student?.lastName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {paired.student ? `${paired.student.lastName}, ${paired.student.firstName}` : "Unknown Student"}
                    </div>
                    <div className="text-xs text-muted-foreground">{paired.studentId}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-green-600">{paired.checkIns.map(r => formatTime(r.timestamp)).join(", ") || "-"}</TableCell>
              <TableCell className="text-red-600">{paired.checkOuts.map(r => formatTime(r.timestamp)).join(", ") || "-"}</TableCell>
              <TableCell className="font-medium">{paired.totalHours}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">Actions <ChevronDown className="ml-1 h-3 w-3"/></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {[...paired.checkIns, ...paired.checkOuts].map((record) => (
                      <DropdownMenuItem key={record.id} className="flex justify-between gap-4">
                        <span className="flex items-center gap-2">
                          {record.type === 'in' ? <LogIn className="h-3 w-3 text-green-500"/> : <LogOut className="h-3 w-3 text-red-500"/>}
                          {formatTime(record.timestamp)}
                        </span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(record)}><Pencil className="h-3 w-3"/></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onDelete(record.id)}><Trash2 className="h-3 w-3"/></Button>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// --- Main Component ---
export default function TimeRecords() {
  const [activeTab, setActiveTab] = useState<"higher" | "basic">("higher")
  const [higherRecords, setHigherRecords] = useState<TimeRecord[]>([])
  const [basicRecords, setBasicRecords] = useState<TimeRecord[]>([])
  const [studentsMap, setStudentsMap] = useState<Record<string, Student>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  // This produces the 'YYYY-MM-DD' string your <Input type="date" /> needs
  return new Date(now.getTime() - offset).toISOString().split("T")[0];
});
  const [filterType, setFilterType] = useState<"all" | "in" | "out">("all")

  // Dialog State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentRecord, setCurrentRecord] = useState<TimeRecord | null>(null)
  const [formData, setFormData] = useState({ timestamp: "", type: "in" as "in" | "out" })

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [higher, basic, allStudents] = await Promise.all([
        getTimeRecordsByDateAndSchool(selectedDate, "Higher Education"),
        getTimeRecordsByDateAndSchool(selectedDate, "Basic Education"),
        getStudents()
      ]);

      setHigherRecords(higher)
      setBasicRecords(basic)
      setStudentsMap(allStudents.reduce((acc, s) => ({ ...acc, [s.studentId]: s }), {}))
    } catch (error) {
      console.error("Failed to load records", error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedDate]);

  useEffect(() => { loadData() }, [loadData])

  // --- Logic for Pairing ---
  const processPairs = useCallback((rawRecords: TimeRecord[]) => {
    const filtered = filterType === "all" ? rawRecords : rawRecords.filter(r => r.type === filterType);

    const grouped: Record<string, { ins: TimeRecord[], outs: TimeRecord[] }> = {};

    filtered.forEach(record => {
      if (!grouped[record.studentId]) grouped[record.studentId] = { ins: [], outs: [] };
      if (record.type === "in") grouped[record.studentId].ins.push(record);
      else grouped[record.studentId].outs.push(record);
    });

    return Object.entries(grouped).map(([studentId, { ins, outs }]) => {
      const student = studentsMap[studentId] || null;

      // Calculate Hours
      let ms = 0;
      const sortedIns = [...ins].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const sortedOuts = [...outs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      sortedIns.forEach(checkIn => {
        const inTime = new Date(checkIn.timestamp).getTime();
        const matchIdx = sortedOuts.findIndex(co => new Date(co.timestamp).getTime() > inTime);
        if (matchIdx !== -1) {
          ms += new Date(sortedOuts[matchIdx].timestamp).getTime() - inTime;
          sortedOuts.splice(matchIdx, 1);
        }
      });

      return {
        studentId,
        student,
        checkIns: ins,
        checkOuts: outs,
        totalHours: `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`
      };
    }).sort((a, b) => (a.student?.lastName || "").localeCompare(b.student?.lastName || ""));
  }, [filterType, studentsMap]);

  const higherPaired = useMemo(() => processPairs(higherRecords), [higherRecords, processPairs]);
  const basicPaired = useMemo(() => processPairs(basicRecords), [basicRecords, processPairs]);

  // --- Handlers ---
  const handleEditClick = (record: TimeRecord) => {
    setCurrentRecord(record)
    setFormData({
      // UPDATED: Use the new helper to correctly format for datetime-local input
      timestamp: formatForDateTimeLocal(record.timestamp),
      type: record.type,
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!currentRecord) return;
    // When creating a new Date from a "YYYY-MM-DDTHH:mm" string,
    // JavaScript interprets it as a local time. This is correct here.
    await updateTimeRecord({ ...currentRecord, timestamp: new Date(formData.timestamp), type: formData.type });
    setIsEditDialogOpen(false);
    loadData();
  }

  const handleDelete = async (id: string) => {
    if (confirm("Delete this record?")) {
      await deleteTimeRecord(id);
      loadData();
    }
  }

  const exportCSV = () => {
    const records = activeTab === "higher" ? higherRecords : basicRecords;
    const csv = timeRecordsToCSV(records, studentsMap);
    downloadAsFile(csv, `Records-${activeTab}-${selectedDate}.csv`, "text/csv");
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Time Management</h2>
        <div className="flex flex-wrap gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline"><Filter className="h-4 w-4 mr-2"/> Filter</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterType("all")}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("in")}>Check-ins</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("out")}>Check-outs</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="secondary" onClick={exportCSV}><FileDown className="h-4 w-4 mr-2"/>Export</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="higher"><GraduationCap className="h-4 w-4 mr-2"/> Higher Ed</TabsTrigger>
          <TabsTrigger value="basic"><School className="h-4 w-4 mr-2"/> Basic Ed</TabsTrigger>
        </TabsList>

        <TabsContent value="higher">
          <Card>
            <CardHeader><CardTitle>Higher Education Records</CardTitle></CardHeader>
            <CardContent>
              <RecordTable records={higherPaired} isLoading={isLoading} onEdit={handleEditClick} onDelete={handleDelete} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="basic">
          <Card>
            <CardHeader><CardTitle>Basic Education Records</CardTitle></CardHeader>
            <CardContent>
              <RecordTable records={basicPaired} isLoading={isLoading} onEdit={handleEditClick} onDelete={handleDelete} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Time Record</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Timestamp</Label>
              <Input
                type="datetime-local"
                value={formData.timestamp}
                onChange={e => setFormData({...formData, timestamp: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(v: any) => setFormData({...formData, type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Check In</SelectItem>
                  <SelectItem value="out">Check Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}