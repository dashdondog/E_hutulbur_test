import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/backend/lib/mongodb";
import { getAuthUser } from "@/backend/lib/auth";
import { ObjectId } from "mongodb";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  // Get members
  const members = await db.collection("classroomMembers")
    .find({ classroomId: id })
    .toArray();

  // Get assignments
  const assignments = await db.collection("assignments")
    .find({ classroomId: id })
    .toArray();

  const memberUserIds = members.map((m) => m.userId);
  const assignmentTestIds = assignments.map((a) => a.testId);

  if (memberUserIds.length === 0 || assignmentTestIds.length === 0) {
    return NextResponse.json({ results: [], members, assignments, classAverage: 0 });
  }

  // Get test results for these members and assignments
  const testResults = await db.collection("testResults")
    .find({
      userId: { $in: memberUserIds },
      testId: { $in: assignmentTestIds },
    })
    .toArray();

  // Calculate class average
  const classAverage = testResults.length > 0
    ? Math.round(testResults.reduce((sum, r) => sum + r.percentage, 0) / testResults.length)
    : 0;

  return NextResponse.json({ results: testResults, members, assignments, classAverage });
}
