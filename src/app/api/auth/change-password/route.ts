import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/backend/lib/mongodb";
import { getAuthUser, hashPassword, verifyPassword } from "@/backend/lib/auth";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Бүх талбарыг бөглөнө үү" }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: "Нууц үг 6-аас дээш тэмдэгт байна" }, { status: 400 });
  }

  const db = await getDb();
  const dbUser = await db.collection("users").findOne({ _id: new ObjectId(user.userId) });

  if (!dbUser) return NextResponse.json({ error: "Хэрэглэгч олдсонгүй" }, { status: 404 });

  const valid = await verifyPassword(currentPassword, dbUser.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Одоогийн нууц үг буруу байна" }, { status: 400 });
  }

  const newHash = await hashPassword(newPassword);
  await db.collection("users").updateOne({ _id: new ObjectId(user.userId) }, { $set: { passwordHash: newHash } });

  return NextResponse.json({ success: true });
}
