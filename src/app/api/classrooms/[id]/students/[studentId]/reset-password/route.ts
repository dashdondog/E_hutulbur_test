import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { ObjectId } from "mongodb";
import { getDb } from "@/backend/lib/mongodb";
import { getAuthUser, hashPassword } from "@/backend/lib/auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; studentId: string }> }
) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Зөвхөн багш" }, { status: 403 });
  }

  const { id, studentId } = await params;

  let classroomObjectId: ObjectId;
  let studentObjectId: ObjectId;
  try {
    classroomObjectId = new ObjectId(id);
    studentObjectId = new ObjectId(studentId);
  } catch {
    return NextResponse.json({ error: "id буруу" }, { status: 400 });
  }

  const db = await getDb();

  const classroom = await db.collection("classrooms").findOne({ _id: classroomObjectId });
  if (!classroom || classroom.teacherId !== user.userId) {
    return NextResponse.json({ error: "Зөвшөөрөлгүй" }, { status: 403 });
  }

  const member = await db
    .collection("classroomMembers")
    .findOne({ classroomId: id, userId: studentId });
  if (!member) {
    return NextResponse.json({ error: "Сурагч энэ ангид байхгүй" }, { status: 404 });
  }

  const student = await db
    .collection("users")
    .findOne({ _id: studentObjectId, role: "student" });
  if (!student) {
    return NextResponse.json({ error: "Сурагч олдсонгүй" }, { status: 404 });
  }

  const tempPassword = crypto.randomBytes(9).toString("base64url");
  const passwordHash = await hashPassword(tempPassword);
  await db.collection("users").updateOne(
    { _id: studentObjectId },
    { $set: { passwordHash, mustChangePassword: true } }
  );

  return NextResponse.json({
    loginCode: student.email,
    password: tempPassword,
  });
}
