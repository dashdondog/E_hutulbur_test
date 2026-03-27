import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/backend/lib/mongodb";
import { getAuthUser } from "@/backend/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
    }

    const body = await req.json();
    const db = await getDb();

    await db.collection("testResults").insertOne({
      userId: user.userId,
      userName: user.name,
      testId: body.testId,
      subjectId: body.subjectId,
      topicName: body.topicName,
      testName: body.testName,
      correctCount: body.correctCount,
      totalQuestions: body.totalQuestions,
      earnedPoints: body.earnedPoints,
      totalPoints: body.totalPoints,
      percentage: body.percentage,
      submittedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save test result error:", error);
    return NextResponse.json({ error: "Дүн хадгалахад алдаа" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
    }

    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const testId = searchParams.get("testId");
    const subjectId = searchParams.get("subjectId");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};

    // Students see only their own results
    if (user.role === "student") {
      filter.userId = user.userId;
    }

    if (testId) filter.testId = testId;
    if (subjectId) filter.subjectId = subjectId;

    const results = await db
      .collection("testResults")
      .find(filter)
      .sort({ submittedAt: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Get test results error:", error);
    return NextResponse.json({ error: "Дүн татахад алдаа" }, { status: 500 });
  }
}
