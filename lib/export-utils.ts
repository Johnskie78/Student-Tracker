import { type TimeRecord, type Student } from "./db"
import { format } from "date-fns"

export function timeRecordsToCSV(records: TimeRecord[], studentsMap: Record<string, Student>): string {
  const headers = [
    "Date",
    "Time",
    "Type",
    "Student ID",
    "Last Name",
    "First Name",
    "Middle Name",
    "Year Level",
    "Course",
    "Major",
    "Semester",
    "Grade Level",
    "School",
    "Purpose"
  ]

  const lines: string[] = [headers.join(",")]

  records.forEach((record) => {
    const student = studentsMap[record.studentId]
    if (!student) return

    const date = record.date
    const time = format(new Date(record.timestamp), "h:mm:ss a")
    const type = record.type === "in" ? "Check In" : "Check Out"
    const purpose = record.purpose ?? "" // ✅ Now works because we added it to type

    const row = [
      date,
      time,
      type,
      student.studentId,
      student.lastName,
      student.firstName,
      student.middleName ?? "",
      student.yearLevel ?? "",
      student.course ?? "",
      student.major ?? "",
      student.semester ?? "",
      student.gradeLevel ?? "",
      student.school ?? "",
      purpose
    ]

    const escapedRow = row.map(field => `"${String(field).replaceAll('"', '""')}"`)
    lines.push(escapedRow.join(","))
  })

  return lines.join("\n")
}

export function downloadAsFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([`\uFEFF${content}`], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// Format date for filenames
export function formatDateForFilename(date: Date): string {
  return format(date, "yyyyMMdd")
}
