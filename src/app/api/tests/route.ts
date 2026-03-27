import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/backend/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const subjectId = req.nextUrl.searchParams.get("subjectId");
    const topicId = req.nextUrl.searchParams.get("topicId");
    const testId = req.nextUrl.searchParams.get("testId");

    if (testId) {
      const test = await db.collection("tests").findOne({ id: testId });
      return NextResponse.json({ test });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};
    if (subjectId) filter.subjectId = subjectId;
    if (topicId) filter.topicId = topicId;

    const tests = await db.collection("tests").find(filter).toArray();

    return NextResponse.json({ tests });
  } catch (error) {
    console.error("Get tests error:", error);
    return NextResponse.json({ error: "Failed to fetch tests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    const body = await req.json();

    await db.collection("tests").updateOne(
      { id: body.id },
      { $set: body },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save test error:", error);
    return NextResponse.json({ error: "Failed to save test" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = await getDb();
    const { id } = await req.json();

    await db.collection("tests").deleteOne({ id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete test error:", error);
    return NextResponse.json({ error: "Failed to delete test" }, { status: 500 });
  }
}
