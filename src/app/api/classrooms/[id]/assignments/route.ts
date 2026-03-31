import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/backend/lib/mongodb";
import { getAuthUser } from "@/backend/lib/auth";
import { ObjectId } from "mongodb";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = await getDb();

  const assignments = await db.collection("assignments")
    .find({ classroomId: id })
    .sort({ deadline: -1 })
    .toArray();

  return NextResponse.json({ assignments });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Зөвхөн багш" }, { status: 403 });
  }

  const { id } = await params;
  const db = await getDb();

  // Verify teacher owns this classroom
  const classroom = await db.collection("classrooms").findOne({ _id: new ObjectId(id) });
  if (!classroom || classroom.teacherId !== user.userId) {
    return NextResponse.json({ error: "Зөвшөөрөлгүй" }, { status: 403 });
  }

  const { testId, subjectId, testName, topicName, deadline } = await req.json();
  if (!testId || !subjectId || !testName || !deadline) {
    return NextResponse.json({ error: "Бүх талбар шаардлагатай" }, { status: 400 });
  }

  const assignment = {
    classroomId: id,
    testId,
    subjectId,
    testName,
    topicName: topicName || "",
    assignedBy: user.userId,
    deadline,
    createdAt: new Date().toISOString(),
  };

  const result = await db.collection("assignments").insertOne(assignment);

  return NextResponse.json({ assignment: { ...assignment, _id: result.insertedId } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Зөвхөн багш" }, { status: 403 });
  }

  const { id } = await params;
  const { assignmentId, deadline } = await req.json();
  if (!assignmentId || !deadline) {
    return NextResponse.json({ error: "Бүх талбар шаардлагатай" }, { status: 400 });
  }

  const db = await getDb();
  const classroom = await db.collection("classrooms").findOne({ _id: new ObjectId(id) });
  if (!classroom || classroom.teacherId !== user.userId) {
    return NextResponse.json({ error: "Зөвшөөрөлгүй" }, { status: 403 });
  }

  await db.collection("assignments").updateOne(
    { _id: new ObjectId(assignmentId) },
    { $set: { deadline } }
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Зөвхөн багш" }, { status: 403 });
  }

  const { id } = await params;
  const { assignmentId } = await req.json();
  const db = await getDb();

  const classroom = await db.collection("classrooms").findOne({ _id: new ObjectId(id) });
  if (!classroom || classroom.teacherId !== user.userId) {
    return NextResponse.json({ error: "Зөвшөөрөлгүй" }, { status: 403 });
  }

  await db.collection("assignments").deleteOne({ _id: new ObjectId(assignmentId) });

  return NextResponse.json({ success: true });
}
