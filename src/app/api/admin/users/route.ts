import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/backend/lib/mongodb";
import { getAuthUser } from "@/backend/lib/auth";
import { ObjectId } from "mongodb";

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const users = await db
    .collection("users")
    .find({})
    .project({ passwordHash: 0 })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({ users });
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId шаардлагатай" }, { status: 400 });

  const db = await getDb();
  await db.collection("users").deleteOne({ _id: new ObjectId(userId) });

  return NextResponse.json({ success: true });
}
