import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/education-system";

// Cache the connection PROMISE — concurrent first-callers share one connect() instead
// of racing. Survives hot-reload via globalThis so dev mode doesn't reconnect on every
// module re-eval.
declare global {
  // eslint-disable-next-line no-var
  var __mongo_db_promise: Promise<Db> | undefined;
  // eslint-disable-next-line no-var
  var __mongo_indexes_done: boolean | undefined;
}

async function ensureIndexes(db: Db): Promise<void> {
  if (globalThis.__mongo_indexes_done) return;
  globalThis.__mongo_indexes_done = true;
  try {
    await Promise.all([
      db.collection("users").createIndex({ email: 1 }, { unique: true }),
      db.collection("testResults").createIndex({ userId: 1, submittedAt: -1 }),
      db.collection("classrooms").createIndex({ teacherId: 1 }),
      db.collection("classrooms").createIndex({ joinCode: 1 }, { unique: true }),
      db.collection("classroomMembers").createIndex({ classroomId: 1 }),
      db.collection("classroomMembers").createIndex({ userId: 1 }),
      db.collection("classroomMembers").createIndex({ classroomId: 1, userId: 1 }, { unique: true }),
      db.collection("assignments").createIndex({ classroomId: 1, deadline: -1 }),
      db.collection("subjectFiles").createIndex({ subjectId: 1, uploadedAt: -1 }),
      db.collection("subjectFiles").createIndex({ id: 1 }, { unique: true }),
    ]);
  } catch (err) {
    // Index creation must not block requests if it fails (e.g. duplicate races).
    console.warn("Index creation warning:", (err as Error).message);
  }
}

async function connect(): Promise<Db> {
  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10,
  });
  await client.connect();
  const db = client.db();
  // Run indexes in the background — don't make the first request wait on them.
  void ensureIndexes(db);
  return db;
}

export async function getDb(): Promise<Db> {
  if (!globalThis.__mongo_db_promise) {
    globalThis.__mongo_db_promise = connect().catch(err => {
      // Reset on failure so the next call retries instead of caching the error.
      globalThis.__mongo_db_promise = undefined;
      throw err;
    });
  }
  return globalThis.__mongo_db_promise;
}
