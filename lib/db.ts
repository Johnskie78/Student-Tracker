// IndexedDB database utility

export interface Student {
  id: string
  studentId: string
  lastName: string
  firstName: string
  middleName: string
  yearLevel: string
  course: string
  school: "Higher Education" | "Basic Education"
  program?: string // For Higher Education: BEEd, BSEd, etc.
  major?: string // For Higher Education with majors
  semester?: string // For Higher Education: 1st or 2nd semester
  gradeLevel?: string // For Basic Education
  status: "active" | "inactive"
  photoUrl: string
}

export interface TimeRecord {
  id: string
  studentId: string
  timestamp: Date
  type: "in" | "out" // Type of record: check-in or check-out
  date: string // YYYY-MM-DD format for easy filtering
  school: "Higher Education" | "Basic Education" // Changed to REQUIRED
  purpose?: string // ✅ ADDED: Purpose of visit — for Check In
}

export interface StudentStats {
  totalStudents: number
  activeStudents: number
  inactiveStudents: number
  higherEducationCount: number
  basicEducationCount: number
  programCounts: Record<string, number>
  yearLevelCounts: Record<string, number>
  gradeLevelCounts: Record<string, number>
  semesterCounts: Record<string, number>
  majorCounts: Record<string, number>
}

const DB_NAME = "StudentTimeTrackingDB"
const DB_VERSION = 12 // ✅ INCREMENTED to 12 (important for migration)
const STUDENTS_STORE = "students"
const TIME_RECORDS_STORE = "timeRecords"

// Helper to format a Date object into YYYY-MM-DD local date string
function formatLocalYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to ensure an object store and its indexes exist
async function _ensureStoreAndIndexes(
  db: IDBDatabase,
  transaction: IDBTransaction,
  storeName: string,
  keyPath: string,
  indexes: { name: string; keyPath: string | string[]; options?: IDBIndexParameters }[]
): Promise<IDBObjectStore> {
  let store: IDBObjectStore;

  if (db.objectStoreNames.contains(storeName)) {
    store = transaction.objectStore(storeName);
  } else {
    store = db.createObjectStore(storeName, { keyPath });
  }

  for (const indexDef of indexes) {
    if (!store.indexNames.contains(indexDef.name)) {
      store.createIndex(indexDef.name, indexDef.keyPath, indexDef.options);
    }
  }
  return store;
}

// Helper for migrating TimeRecord data
async function _migrateTimeRecords(db: IDBDatabase, transaction: IDBTransaction): Promise<void> {
  console.log("Starting TimeRecord data migration...");

  const studentsStore = transaction.objectStore(STUDENTS_STORE);
  const timeRecordsStore = transaction.objectStore(TIME_RECORDS_STORE);

  // Fetch all students to efficiently lookup school data
  const studentsMap = new Map<string, Student>();
  await new Promise<void>((resolveStudents, rejectStudents) => {
    const studentsCursorRequest = studentsStore.openCursor();
    studentsCursorRequest.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        studentsMap.set(cursor.value.studentId, cursor.value);
        cursor.continue();
      } else {
        resolveStudents();
      }
    };
    studentsCursorRequest.onerror = (e) => {
      console.error("Error fetching students for migration:", (e.target as IDBRequest).error);
      rejectStudents((e.target as IDBRequest).error);
    };
  }).catch(error => { /* handle or rethrow as needed */ });


  // Migrate time records
  await new Promise<void>((resolveRecords, rejectRecords) => {
    const timeRecordsCursorRequest = timeRecordsStore.openCursor();
    timeRecordsCursorRequest.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        const record: TimeRecord = { ...cursor.value }; // Create a copy to modify
        let updated = false;

        // 1. Ensure 'timestamp' is a valid Date object
        if (typeof record.timestamp === 'string') {
          record.timestamp = new Date(record.timestamp);
          updated = true;
        } else if (!(record.timestamp instanceof Date)) {
          console.warn(`Invalid timestamp type for record ${record.id}, attempting to re-parse.`);
          record.timestamp = new Date(); // Fallback to current time if unparseable
          updated = true;
        }

        // 2. Ensure 'date' is correctly formatted local YYYY-MM-DD
        const correctlyFormattedDate = formatLocalYYYYMMDD(record.timestamp);
        if (record.date !== correctlyFormattedDate) {
          record.date = correctlyFormattedDate;
          updated = true;
        }

        // 3. Ensure 'school' property exists and is correct (now required in interface)
        if (!record.school) {
          const student = studentsMap.get(record.studentId);
          if (student) {
            record.school = student.school;
            updated = true;
          } else {
            console.warn(`Student not found for time record ${record.id}. Defaulting school to 'Higher Education'.`);
            record.school = "Higher Education";
            updated = true;
          }
        }

        // ✅ 4. Ensure 'purpose' exists (default empty if missing)
        if (record.purpose === undefined) {
          record.purpose = "";
          updated = true;
        }

        if (updated) {
          cursor.update(record);
          console.log(`Migrated TimeRecord ${record.id}: updated fields.`);
        }
        cursor.continue();
      } else {
        resolveRecords();
      }
    };
    timeRecordsCursorRequest.onerror = (e) => {
      console.error("Error migrating time records:", (e.target as IDBRequest).error);
      rejectRecords((e.target as IDBRequest).error);
    };
  }).catch(error => { /* handle or rethrow as needed */ });

  console.log("TimeRecord data migration complete.");
}


export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = (event) => {
      console.error("Database error:", (event.target as IDBOpenDBRequest).error);
      reject("Database error: " + (event.target as IDBOpenDBRequest).error)
    }

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result)
    }

    request.onupgradeneeded = async (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = (event.target as IDBOpenDBRequest).transaction!;
      const oldVersion = event.oldVersion;

      console.log(`Upgrading database from version ${oldVersion} to ${DB_VERSION}`);

      // Setup STUDENTS_STORE
      await _ensureStoreAndIndexes(db, transaction, STUDENTS_STORE, "id", [
        { name: "studentId", keyPath: "studentId", options: { unique: true } },
        { name: "lastName", keyPath: "lastName", options: { unique: false } },
        { name: "status", keyPath: "status", options: { unique: false } },
        { name: "school", keyPath: "school", options: { unique: false } },
        { name: "program", keyPath: "program", options: { unique: false } },
        { name: "major", keyPath: "major", options: { unique: false } },
        { name: "semester", keyPath: "semester", options: { unique: false } },
        { name: "gradeLevel", keyPath: "gradeLevel", options: { unique: false } },
        { name: "yearLevel", keyPath: "yearLevel", options: { unique: false } },
      ]);

      // Setup TIME_RECORDS_STORE
      await _ensureStoreAndIndexes(db, transaction, TIME_RECORDS_STORE, "id", [
        { name: "studentId", keyPath: "studentId", options: { unique: false } },
        { name: "date", keyPath: "date", options: { unique: false } },
        { name: "type", keyPath: "type", options: { unique: false } },
        { name: "studentId_date", keyPath: ["studentId", "date"], options: { unique: false } },
        { name: "timestamp", keyPath: "timestamp", options: { unique: false } },
        { name: "school", keyPath: "school", options: { unique: false } },
        { name: "purpose", keyPath: "purpose", options: { unique: false } }, // ✅ ADDED INDEX
      ]);

      // Perform data migration if upgrading from an older version
      if (oldVersion < DB_VERSION) {
        await _migrateTimeRecords(db, transaction);
      }
    }
  })
}


// Student CRUD operations
export async function addStudent(student: Student): Promise<string> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STUDENTS_STORE], "readwrite")
    const store = transaction.objectStore(STUDENTS_STORE)
    const studentWithId = { ...student, id: student.id || crypto.randomUUID() };
    const request = store.add(studentWithId)

    request.onsuccess = () => resolve(studentWithId.id)
    request.onerror = () => reject(request.error)
  })
}

export async function getStudents(page = 1, limit = 100): Promise<Student[]> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STUDENTS_STORE], "readonly")
    const store = transaction.objectStore(STUDENTS_STORE)
    const request = store.getAll()

    request.onsuccess = () => {
      const allStudents = request.result
      // Apply pagination in memory
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedStudents = allStudents.slice(startIndex, endIndex)
      resolve(paginatedStudents)
    }
    request.onerror = () => reject(request.error)
  })
}

export async function getAllStudents(): Promise<Student[]> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STUDENTS_STORE], "readonly")
    const store = transaction.objectStore(STUDENTS_STORE)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getStudentsBySchool(
  school: "Higher Education" | "Basic Education",
  page = 1,
  limit = 100,
): Promise<Student[]> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STUDENTS_STORE], "readonly")
    const store = transaction.objectStore(STUDENTS_STORE)
    const index = store.index("school")
    const request = index.getAll(school)

    request.onsuccess = () => {
      const students = request.result
      // Apply pagination in memory
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedStudents = students.slice(startIndex, endIndex)
      resolve(paginatedStudents)
    }
    request.onerror = () => reject(request.error)
  })
}

export async function countStudentsBySchool(school: "Higher Education" | "Basic Education"): Promise<number> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STUDENTS_STORE], "readonly")
    const store = transaction.objectStore(STUDENTS_STORE)
    const index = store.index("school")
    const request = index.count(school)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getStudentsByStatus(status: "active" | "inactive"): Promise<Student[]> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STUDENTS_STORE], "readonly")
    const store = transaction.objectStore(STUDENTS_STORE)
    const index = store.index("status")
    const request = index.getAll(status)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getStudentByStudentId(studentId: string): Promise<Student | null> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STUDENTS_STORE], "readonly")
    const store = transaction.objectStore(STUDENTS_STORE)
    const index = store.index("studentId")
    const request = index.get(studentId)

    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

export async function getStudentById(id: string): Promise<Student | null> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STUDENTS_STORE], "readonly")
    const store = transaction.objectStore(STUDENTS_STORE)
    const request = store.get(id)

    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

export async function updateStudent(student: Student): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STUDENTS_STORE], "readwrite")
    const store = transaction.objectStore(STUDENTS_STORE)
    const request = store.put(student)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function deleteStudent(id: string): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STUDENTS_STORE], "readwrite")
    const store = transaction.objectStore(STUDENTS_STORE)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Time Records CRUD operations
export async function addTimeRecord(record: TimeRecord): Promise<string> {
  // If school is not provided, try to get it from the student
  if (!record.school) {
    try {
      const student = await getStudentByStudentId(record.studentId)
      if (student) {
        record.school = student.school
      }
    } catch (error) {
      console.error("Error getting student school for record:", error)
    }
  }
  // Ensure date is set if not provided
  if (!record.date) {
    record.date = formatLocalYYYYMMDD(record.timestamp);
  }
  // Ensure ID is set if not provided
  if (!record.id) {
    record.id = crypto.randomUUID();
  }
  // ✅ Ensure purpose is never undefined
  record.purpose ??= "";


  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TIME_RECORDS_STORE], "readwrite")
    const store = transaction.objectStore(TIME_RECORDS_STORE)
    const request = store.add(record)

    request.onsuccess = () => resolve(record.id)
    request.onerror = () => reject(request.error)
  })
}

export async function getTimeRecords(limit = 1000): Promise<TimeRecord[]> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TIME_RECORDS_STORE], "readonly")
    const store = transaction.objectStore(TIME_RECORDS_STORE)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getTimeRecordsBySchool(school: "Higher Education" | "Basic Education"): Promise<TimeRecord[]> {
  const db = await initDB()
  return new Promise(async (resolve, reject) => {
    try {
      const transaction = db.transaction([TIME_RECORDS_STORE], "readonly")
      const store = transaction.objectStore(TIME_RECORDS_STORE)

      // Try to use the school index if it exists
      if (store.indexNames.contains("school")) {
        const index = store.index("school")
        const request = index.getAll(school)

        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      } else {
        // Fallback: get all records and filter by student school
        const allRecords = await getTimeRecords()
        const students = await getAllStudents()

        // Create a map of student IDs to schools
        const studentSchoolMap = students.reduce(
          (map, student) => {
            map[student.studentId] = student.school
            return map
          },
          {} as Record<string, "Higher Education" | "Basic Education">,
        )

        // Filter records by school
        const filteredRecords = allRecords.filter(
          (record) => record.school === school || studentSchoolMap[record.studentId] === school,
        )

        resolve(filteredRecords)
      }
    } catch (error) {
      reject(error)
    }
  })
}

export async function getTimeRecordsByDate(date: string): Promise<TimeRecord[]> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TIME_RECORDS_STORE], "readonly")
    const store = transaction.objectStore(TIME_RECORDS_STORE)
    const index = store.index("date")
    const request = index.getAll(date)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getTimeRecordsByDateAndSchool(
  date: string,
  school: "Higher Education" | "Basic Education",
): Promise<TimeRecord[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const dateRecords = await getTimeRecordsByDate(date)

      // If records have school property, filter directly
      if (dateRecords.length > 0 && dateRecords[0].school !== undefined) {
        const filteredRecords = dateRecords.filter((record) => record.school === school)
        resolve(filteredRecords)
      } else {
        // Otherwise, get student schools and filter
        const students = await getAllStudents()

        // Create a map of student IDs to schools
        const studentSchoolMap = students.reduce(
          (map, student) => {
            map[student.studentId] = student.school
            return map
          },
          {} as Record<string, "Higher Education" | "Basic Education">,
        )

        // Filter records by school
        const filteredRecords = dateRecords.filter((record) => studentSchoolMap[record.studentId] === school)

        resolve(filteredRecords)
      }
    } catch (error) {
      reject(error)
    }
  })
}

export async function getTimeRecordsByStudentId(studentId: string, limit = 100): Promise<TimeRecord[]> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TIME_RECORDS_STORE], "readonly")
    const store = transaction.objectStore(TIME_RECORDS_STORE)
    const index = store.index("studentId")
    const request = index.getAll(studentId)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getTimeRecordsByStudentAndDate(studentId: string, date: string): Promise<TimeRecord[]> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TIME_RECORDS_STORE], "readonly")
    const store = transaction.objectStore(TIME_RECORDS_STORE)
    const index = store.index("studentId_date")
    const request = index.getAll([studentId, date])

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getTimeRecord(id: string): Promise<TimeRecord | null> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TIME_RECORDS_STORE], "readonly")
    const store = transaction.objectStore(TIME_RECORDS_STORE)
    const request = store.get(id)

    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

export async function updateTimeRecord(record: TimeRecord): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TIME_RECORDS_STORE], "readwrite")
    const store = transaction.objectStore(TIME_RECORDS_STORE)
    const request = store.put(record)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function deleteTimeRecord(id: string): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TIME_RECORDS_STORE], "readwrite")
    const store = transaction.objectStore(TIME_RECORDS_STORE)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Bulk operations for better performance with large datasets
export async function bulkAddStudents(students: Student[]): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STUDENTS_STORE], "readwrite")
    const store = transaction.objectStore(STUDENTS_STORE)

    let completed = 0
    let errors = 0

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)

    students.forEach((student) => {
      const request = store.add(student)
      request.onsuccess = () => completed++
      request.onerror = () => errors++
    })
  })
}

export async function bulkAddTimeRecords(records: TimeRecord[]): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TIME_RECORDS_STORE], "readwrite")
    const store = transaction.objectStore(TIME_RECORDS_STORE)

    let completed = 0
    let errors = 0

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)

    records.forEach((record) => {
      const request = store.add(record)
      request.onsuccess = () => completed++
      request.onerror = () => errors++
    })
  })
}

// Count records for pagination
export async function countStudents(): Promise<number> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STUDENTS_STORE], "readonly")
    const store = transaction.objectStore(STUDENTS_STORE)
    const request = store.count()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function countTimeRecords(): Promise<number> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TIME_RECORDS_STORE], "readonly")
    const store = transaction.objectStore(TIME_RECORDS_STORE)
    const request = store.count()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Statistics functions for dashboard
export async function getStudentStatistics(): Promise<StudentStats> {
  const students = await getAllStudents()

  const stats: StudentStats = {
    totalStudents: students.length,
    activeStudents: students.filter((s) => s.status === "active").length,
    inactiveStudents: students.filter((s) => s.status === "inactive").length,
    higherEducationCount: students.filter((s) => s.school === "Higher Education").length,
    basicEducationCount: students.filter((s) => s.school === "Basic Education").length,
    programCounts: {},
    yearLevelCounts: {},
    gradeLevelCounts: {},
    semesterCounts: {},
    majorCounts: {},
  }

  // Count by program
  students.forEach((student) => {
    if (student.program) {
      stats.programCounts[student.program] = (stats.programCounts[student.program] || 0) + 1
    }

    if (student.yearLevel) {
      stats.yearLevelCounts[student.yearLevel] = (stats.yearLevelCounts[student.yearLevel] || 0) + 1
    }

    if (student.gradeLevel) {
      stats.gradeLevelCounts[student.gradeLevel] = (stats.gradeLevelCounts[student.gradeLevel] || 0) + 1
    }

    if (student.semester) {
      stats.semesterCounts[student.semester] = (stats.semesterCounts[student.semester] || 0) + 1
    }

    if (student.major) {
      stats.majorCounts[student.major] = (stats.majorCounts[student.major] || 0) + 1
    }
  })

  return stats
}

// Get students by program
export async function getStudentsByProgram(program: string): Promise<Student[]> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STUDENTS_STORE], "readonly")
    const store = transaction.objectStore(STUDENTS_STORE)
    const index = store.index("program")
    const request = index.getAll(program)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Get students by year level
export async function getStudentsByYearLevel(yearLevel: string): Promise<Student[]> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STUDENTS_STORE], "readonly")
    const store = transaction.objectStore(STUDENTS_STORE)
    const index = store.index("yearLevel")
    const request = index.getAll(yearLevel)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Get students by grade level
export async function getStudentsByGradeLevel(gradeLevel: string): Promise<Student[]> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STUDENTS_STORE], "readonly")
    const store = transaction.objectStore(STUDENTS_STORE)
    const index = store.index("gradeLevel")
    const request = index.getAll(gradeLevel)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Batch update student semesters
export async function updateAllStudentSemesters(
  fromSemester: string,
  toSemester: string,
  school: "Higher Education" | "Basic Education" = "Higher Education",
): Promise<number> {
  const db = await initDB()
  return new Promise(async (resolve, reject) => {
    try {
      // First get all students with the source semester
      const studentsToUpdate = await getStudentsBySemester(fromSemester)

      // Filter by school
      const filteredStudents = studentsToUpdate.filter((student) => student.school === school)

      if (filteredStudents.length === 0) {
        resolve(0)
        return
      }

      const transaction = db.transaction([STUDENTS_STORE], "readwrite")
      const store = transaction.objectStore(STUDENTS_STORE)

      let updatedCount = 0

      transaction.oncomplete = () => resolve(updatedCount)
      transaction.onerror = () => reject(transaction.error)

      // Update each student's semester
      filteredStudents.forEach((student) => {
        const updatedStudent = { ...student, semester: toSemester }
        const request = store.put(updatedStudent)

        request.onsuccess = () => updatedCount++
        request.onerror = (event) => console.error("Error updating student:", event)
      })
    } catch (error) {
      reject(error)
    }
  })
}

// Get students by semester
export async function getStudentsBySemester(semester: string): Promise<Student[]> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STUDENTS_STORE], "readonly")
    const store = transaction.objectStore(STUDENTS_STORE)
    const index = store.index("semester")
    const request = index.getAll(semester)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Delete all time records
export async function deleteAllTimeRecords(school?: "Higher Education" | "Basic Education"): Promise<number> {
  const db = await initDB()
  return new Promise(async (resolve, reject) => {
    try {
      // If no school specified, delete all records
      if (!school) {
        const transaction = db.transaction([TIME_RECORDS_STORE], "readwrite")
        const store = transaction.objectStore(TIME_RECORDS_STORE)
        const request = store.clear()

        request.onsuccess = () => resolve(request.result ?? 0)
        request.onerror = () => reject(request.error)
        return
      }

      // Otherwise, get records for the specified school and delete them
      const recordsToDelete = await getTimeRecordsBySchool(school)

      if (recordsToDelete.length === 0) {
        resolve(0)
        return
      }

      const transaction = db.transaction([TIME_RECORDS_STORE], "readwrite")
      const store = transaction.objectStore(TIME_RECORDS_STORE)

      let deletedCount = 0

      transaction.oncomplete = () => resolve(deletedCount)
      transaction.onerror = () => reject(transaction.error)

      // Delete each record
      recordsToDelete.forEach((record) => {
        const request = store.delete(record.id)
        request.onsuccess = () => deletedCount++
        request.onerror = (event) => console.error("Error deleting record:", event)
      })
    } catch (error) {
      reject(error)
    }
  })
}

// Delete time records by date range
export async function deleteTimeRecordsByDateRange(
  startDate: string,
  endDate: string,
  school?: "Higher Education" | "Basic Education",
): Promise<number> {
  const db = await initDB()
  return new Promise(async (resolve, reject) => {
    try {
      // Get all records
      const allRecords = await getTimeRecords()

      // Filter records within the date range
      let recordsToDelete = allRecords.filter((record) => record.date >= startDate && record.date <= endDate)

      // Further filter by school if specified
      if (school) {
        if (recordsToDelete.some((record) => record.school !== undefined)) {
          // If records have school property, filter directly
          recordsToDelete = recordsToDelete.filter((record) => record.school === school)
        } else {
          // Otherwise, get student schools and filter
          const students = await getAllStudents()

          // Create a map of student IDs to schools
          const studentSchoolMap = students.reduce(
            (map, student) => {
              map[student.studentId] = student.school
              return map
            },
            {} as Record<string, "Higher Education" | "Basic Education">,
          )

          // Filter records by school
          recordsToDelete = recordsToDelete.filter((record) => studentSchoolMap[record.studentId] === school)
        }
      }

      if (recordsToDelete.length === 0) {
        resolve(0)
        return
      }

      const transaction = db.transaction([TIME_RECORDS_STORE], "readwrite")
      const store = transaction.objectStore(TIME_RECORDS_STORE)

      let deletedCount = 0

      transaction.oncomplete = () => resolve(deletedCount)
      transaction.onerror = () => reject(transaction.error)

      // Delete each record
      recordsToDelete.forEach((record) => {
        const request = store.delete(record.id)
        request.onsuccess = () => deletedCount++
        request.onerror = (event) => console.error("Error deleting record:", event)
      })
    } catch (error) {
      reject(error)
    }
  })
}

// Update existing time records to include school information
export async function updateTimeRecordsWithSchool(): Promise<number> {
  const db = await initDB()
  return new Promise(async (resolve, reject) => {
    try {
      const allRecords = await getTimeRecords()
      const students = await getAllStudents()

      // Create a map of student IDs to schools
      const studentSchoolMap = students.reduce(
        (map, student) => {
          map[student.studentId] = student.school
          return map
        },
        {} as Record<string, "Higher Education" | "Basic Education">,
      )

      // Filter records that don't have school property
      const recordsToUpdate = allRecords.filter((record) => !record.school && studentSchoolMap[record.studentId])

      if (recordsToUpdate.length === 0) {
        resolve(0)
        return
      }

      const transaction = db.transaction([TIME_RECORDS_STORE], "readwrite")
      const store = transaction.objectStore(TIME_RECORDS_STORE)

      let updatedCount = 0

      transaction.oncomplete = () => resolve(updatedCount)
      transaction.onerror = () => reject(transaction.error)

      // Update each record
      recordsToUpdate.forEach((record) => {
        const updatedRecord = {
          ...record,
          school: studentSchoolMap[record.studentId],
        }
        const request = store.put(updatedRecord)
        request.onsuccess = () => updatedCount++
        request.onerror = (event) => console.error("Error updating record:", event)
      })
    } catch (error) {
      reject(error)
    }
  })
}
