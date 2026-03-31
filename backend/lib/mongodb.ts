import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/education-system";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getDb(): Promise<Db> {
  if (cachedDb) return cachedDb;

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();

  cachedClient = client;
  cachedDb = db;

  // Create indexes
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("testResults").createIndex({ userId: 1, submittedAt: -1 });

  // Classroom indexes
  await db.collection("classrooms").createIndex({ teacherId: 1 });
  await db.collection("classrooms").createIndex({ joinCode: 1 }, { unique: true });
  await db.collection("classroomMembers").createIndex({ classroomId: 1 });
  await db.collection("classroomMembers").createIndex({ userId: 1 });
  await db.collection("classroomMembers").createIndex({ classroomId: 1, userId: 1 }, { unique: true });
  await db.collection("assignments").createIndex({ classroomId: 1, deadline: -1 });

  return db;
}
