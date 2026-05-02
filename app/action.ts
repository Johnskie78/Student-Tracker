
import { neon } from '@neondatabase/serverless';

// Connect to your database
const sql = neon('${process.env.DATABASE_URL}');

// Function to save your record
export async function saveRecord(data: FormData) {
  // Change this to match your actual data fields (name, id, etc.)
  const studentId = data.get('studentId');
  const time = data.get('time');

  // Save to database
  await sql('INSERT INTO records (student_id, time) VALUES ($1, $2)', [studentId, time]);
}