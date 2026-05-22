import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { ObjectId } from "mongodb";
import { getDb } from "@/backend/lib/mongodb";
import { getAuthUser, hashPassword } from "@/backend/lib/auth";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAuthUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return NextResponse.json({ error: "userId буруу" }, { status: 400 });
  }

  const db = await getDb();
  const target = await db.collection("users").findOne({ _id: objectId });
  if (!target) {
    return NextResponse.json({ error: "Хэрэглэгч олдсонгүй" }, { status: 404 });
  }

  const tempPassword = crypto.randomBytes(9).toString("base64url");
  const passwordHash = await hashPassword(tempPassword);
  await db.collection("users").updateOne(
    { _id: objectId },
    { $set: { passwordHash, mustChangePassword: true } }
  );

  return NextResponse.json({ tempPassword });
}
