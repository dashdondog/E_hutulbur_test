import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/backend/lib/mongodb";
import { getAuthUser } from "@/backend/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "student") {
    return NextResponse.json({ error: "Зөвхөн сурагч ангид нэгдэх боломжтой" }, { status: 403 });
  }

  const { joinCode } = await req.json();
  if (!joinCode?.trim()) {
    return NextResponse.json({ error: "Код шаардлагатай" }, { status: 400 });
  }

  const db = await getDb();
  const classroom = await db.collection("classrooms").findOne({ joinCode: joinCode.trim().toUpperCase() });
  if (!classroom) {
    return NextResponse.json({ error: "Буруу код. Ангийн код шалгана уу." }, { status: 404 });
  }

  const classroomId = classroom._id!.toString();

  // Check if already a member
  const existing = await db.collection("classroomMembers").findOne({
    classroomId,
    userId: user.userId,
  });
  if (existing) {
    return NextResponse.json({ error: "Та энэ ангид аль хэдийн нэгдсэн байна" }, { status: 400 });
  }

  await db.collection("classroomMembers").insertOne({
    classroomId,
    userId: user.userId,
    userName: user.name,
    joinedAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, classroom });
}
