import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/backend/lib/mongodb";
import { getAuthUser, hashPassword } from "@/backend/lib/auth";
import { ObjectId } from "mongodb";
import crypto from "crypto";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Зөвхөн багш" }, { status: 403 });
  }

  const { id } = await params;
  const db = await getDb();

  const classroom = await db.collection("classrooms").findOne({ _id: new ObjectId(id) });
  if (!classroom || classroom.teacherId !== user.userId) {
    return NextResponse.json({ error: "Зөвшөөрөлгүй" }, { status: 403 });
  }

  const members = await db.collection("classroomMembers").find({ classroomId: id }).toArray();
  const userIds = members.map((m) => m.userId);

  const studentUsers = userIds.length
    ? await db
        .collection("users")
        .find({ _id: { $in: userIds.map((uid) => new ObjectId(uid)) }, role: "student" })
        .project({ name: 1, email: 1 }) // email field stores the loginCode
        .toArray()
    : [];

  const studentMap: Record<string, { loginCode: string }> = {};
  for (const s of studentUsers) {
    studentMap[s._id.toString()] = { loginCode: s.email };
  }

  const result = members.map((m) => ({
    ...m,
    loginCode: studentMap[m.userId]?.loginCode ?? null,
  }));

  return NextResponse.json({ students: result });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Зөвхөн багш" }, { status: 403 });
  }

  const { id } = await params;
  const { name } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Нэрийг оруулна уу" }, { status: 400 });
  }

  const db = await getDb();

  const classroom = await db.collection("classrooms").findOne({ _id: new ObjectId(id) });
  if (!classroom || classroom.teacherId !== user.userId) {
    return NextResponse.json({ error: "Зөвшөөрөлгүй" }, { status: 403 });
  }

  // Generate unique login code like S-AB12CD
  let loginCode: string;
  let attempts = 0;
  do {
    loginCode = "S-" + crypto.randomBytes(3).toString("hex").toUpperCase();
    attempts++;
    if (attempts > 10) break;
  } while (await db.collection("users").findOne({ email: loginCode }));

  // Default password — same for all new students, they change it after first login
  const plainPassword = "Solikh123";
  const passwordHash = await hashPassword(plainPassword);

  const insertResult = await db.collection("users").insertOne({
    name: name.trim(),
    email: loginCode,
    passwordHash,
    role: "student",
    createdBy: user.userId,
    classroomId: id,
    createdAt: new Date(),
  });

  await db.collection("classroomMembers").insertOne({
    classroomId: id,
    userId: insertResult.insertedId.toString(),
    userName: name.trim(),
    joinedAt: new Date().toISOString(),
  });

  return NextResponse.json({ name: name.trim(), loginCode, password: plainPassword });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Зөвхөн багш" }, { status: 403 });
  }

  const { id } = await params;
  const { userId } = await req.json();

  if (!userId) return NextResponse.json({ error: "userId шаардлагатай" }, { status: 400 });

  const db = await getDb();

  const classroom = await db.collection("classrooms").findOne({ _id: new ObjectId(id) });
  if (!classroom || classroom.teacherId !== user.userId) {
    return NextResponse.json({ error: "Зөвшөөрөлгүй" }, { status: 403 });
  }

  await Promise.all([
    db.collection("classroomMembers").deleteOne({ classroomId: id, userId }),
    db.collection("users").deleteOne({ _id: new ObjectId(userId), role: "student" }),
  ]);

  return NextResponse.json({ success: true });
}
