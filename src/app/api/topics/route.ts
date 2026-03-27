import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/backend/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const subjectId = req.nextUrl.searchParams.get("subjectId");

    const filter = subjectId ? { subjectId } : {};
    const topics = await db
      .collection("topics")
      .find(filter)
      .sort({ order: 1 })
      .toArray();

    return NextResponse.json({ topics });
  } catch (error) {
    console.error("Get topics error:", error);
    return NextResponse.json({ error: "Failed to fetch topics" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    const body = await req.json();

    await db.collection("topics").updateOne(
      { id: body.id },
      { $set: body },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save topic error:", error);
    return NextResponse.json({ error: "Failed to save topic" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = await getDb();
    const { id } = await req.json();

    await db.collection("topics").deleteOne({ id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete topic error:", error);
    return NextResponse.json({ error: "Failed to delete topic" }, { status: 500 });
  }
}
