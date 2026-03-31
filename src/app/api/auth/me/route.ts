import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/backend/lib/auth";
import { getDb } from "@/backend/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const db = await getDb();
  const dbUser = await db.collection("users").findOne({ _id: new ObjectId(user.userId) });
  const teacherSubjects: string[] = dbUser?.teacherSubjects ?? [];

  return NextResponse.json({ user: { ...user, teacherSubjects } });
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teacherSubjects } = await req.json();
  if (!Array.isArray(teacherSubjects)) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  const db = await getDb();
  await db.collection("users").updateOne(
    { _id: new ObjectId(user.userId) },
    { $set: { teacherSubjects } }
  );

  return NextResponse.json({ success: true, teacherSubjects });
}
