import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/backend/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const subjectId = req.nextUrl.searchParams.get("subjectId");

    const filter = subjectId ? { subjectId } : {};
    const curricula = await db.collection("curricula").find(filter).toArray();

    return NextResponse.json({ curricula });
  } catch (error) {
    console.error("Get curricula error:", error);
    return NextResponse.json({ error: "Failed to fetch curricula" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    const body = await req.json();

    await db.collection("curricula").insertOne(body);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save curriculum error:", error);
    return NextResponse.json({ error: "Failed to save curriculum" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = await getDb();
    const { id } = await req.json();

    await db.collection("curricula").deleteOne({ id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete curriculum error:", error);
    return NextResponse.json({ error: "Failed to delete curriculum" }, { status: 500 });
  }
}
