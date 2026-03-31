import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/backend/lib/mongodb";
import { getAuthUser } from "@/backend/lib/auth";
import { ObjectId } from "mongodb";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = await getDb();

  const classroom = await db.collection("classrooms").findOne({ _id: new ObjectId(id) });
  if (!classroom) return NextResponse.json({ error: "Анги олдсонгүй" }, { status: 404 });

  const members = await db.collection("classroomMembers")
    .find({ classroomId: id })
    .toArray();

  const assignments = await db.collection("assignments")
    .find({ classroomId: id })
    .sort({ deadline: -1 })
    .toArray();

  return NextResponse.json({ classroom, members, assignments });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  await Promise.all([
    db.collection("classrooms").deleteOne({ _id: new ObjectId(id) }),
    db.collection("classroomMembers").deleteMany({ classroomId: id }),
    db.collection("assignments").deleteMany({ classroomId: id }),
  ]);

  return NextResponse.json({ success: true });
}
