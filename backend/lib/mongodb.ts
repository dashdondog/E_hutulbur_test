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
  await db.collection("curricula").createIndex({ subjectId: 1 });
  await db.collection("topics").createIndex({ subjectId: 1, order: 1 });
  await db.collection("tests").createIndex({ subjectId: 1 });
  await db.collection("tests").createIndex({ topicId: 1 });
  await db.collection("files").createIndex({ subjectId: 1 });
  await db.collection("extractedTexts").createIndex({ subjectId: 1 });

  return db;
}
