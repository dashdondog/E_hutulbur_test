import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/backend/lib/mongodb";
import { getAuthUser } from "@/backend/lib/auth";
import crypto from "crypto";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();

  if (user.role === "teacher") {
    const classrooms = await db.collection("classrooms")
      .find({ teacherId: user.userId })
      .sort({ createdAt: -1 })
      .toArray();

    // Get member counts
    const result = await Promise.all(
      classrooms.map(async (c) => {
        const memberCount = await db.collection("classroomMembers").countDocuments({ classroomId: c._id!.toString() });
        return { ...c, memberCount };
      })
    );

    return NextResponse.json({ classrooms: result });
  } else {
    // Student: get classrooms they joined
    const memberships = await db.collection("classroomMembers")
      .find({ userId: user.userId })
      .toArray();

    const classroomIds = memberships.map((m) => m.classroomId);
    if (classroomIds.length === 0) return NextResponse.json({ classrooms: [] });

    const { ObjectId } = await import("mongodb");
    const classrooms = await db.collection("classrooms")
      .find({ _id: { $in: classroomIds.map((id) => new ObjectId(id)) } })
      .toArray();

    // Get assignment counts
    const result = await Promise.all(
      classrooms.map(async (c) => {
        const assignmentCount = await db.collection("assignments").countDocuments({ classroomId: c._id!.toString() });
        return { ...c, assignmentCount };
      })
    );

    return NextResponse.json({ classrooms: result });
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Зөвхөн багш анги үүсгэх боломжтой" }, { status: 403 });
  }

  const { name, subjectId } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Ангийн нэр шаардлагатай" }, { status: 400 });
  }
  if (!subjectId?.trim()) {
    return NextResponse.json({ error: "Хичээлийг сонгоно уу" }, { status: 400 });
  }

  const joinCode = crypto.randomBytes(3).toString("hex").toUpperCase();
  const db = await getDb();

  const classroom = {
    name: name.trim(),
    subjectId: subjectId.trim(),
    teacherId: user.userId,
    teacherName: user.name,
    joinCode,
    createdAt: new Date().toISOString(),
  };

  const result = await db.collection("classrooms").insertOne(classroom);

  return NextResponse.json({
    classroom: { ...classroom, _id: result.insertedId },
  });
}
