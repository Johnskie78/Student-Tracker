"use client"

import { useState, useEffect } from "react"
import { 
  getStudentsBySchool, 
  countStudentsBySchool, 
  countStudents, 
  type Student 
} from "@/lib/db"

export function useStudents(activeTab: "higher" | "basic", studentsPerPage: number) {
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [counts, setCounts] = useState({
    total: 0,
    higher: 0,
    basic: 0,
  })

  // Determine the school string based on the active tab
  const schoolType = activeTab === "higher" ? "Higher Education" : "Basic Education"

  // Function to load statistics (Totals for the cards)
  const loadCounts = async () => {
    try {
      const [total, higher, basic] = await Promise.all([
        countStudents(),
        countStudentsBySchool("Higher Education"),
        countStudentsBySchool("Basic Education"),
      ])
      setCounts({ total, higher, basic })
    } catch (error) {
      console.error("Failed to load student counts:", error)
    }
  }

  // Function to load the actual table data
  const loadStudents = async () => {
    setIsLoading(true)
    try {
      const studentList = await getStudentsBySchool(schoolType, currentPage, studentsPerPage)
      setStudents(studentList)
    } catch (error) {
      console.error("Failed to load students:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load counts once on mount
  useEffect(() => {
    loadCounts()
  }, [])

  // Reload students whenever the tab or page changes
  useEffect(() => {
    loadStudents()
  }, [activeTab, currentPage])

  return {
    students,
    isLoading,
    counts,
    currentPage,
    setCurrentPage,
    refresh: loadStudents,
    refreshCounts: loadCounts,
  }
}