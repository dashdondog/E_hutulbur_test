import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/backend/lib/mongodb";
import { hashPassword, signToken } from "@/backend/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Бүх талбарыг бөглөнө үү" }, { status: 400 });
    }

    if (role !== "teacher") {
      return NextResponse.json({ error: "Зөвхөн багш бүртгүүлэх боломжтой" }, { status: 403 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Нууц үг 6-аас дээш тэмдэгт байна" }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db.collection("users").findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Энэ имэйл бүртгэлтэй байна" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const result = await db.collection("users").insertOne({
      name,
      email,
      passwordHash,
      role,
      createdAt: new Date(),
    });

    const token = await signToken({
      userId: result.insertedId.toString(),
      role,
      name,
      email,
    });

    const res = NextResponse.json({
      user: { userId: result.insertedId.toString(), name, email, role },
    });
    res.cookies.set("token", token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
    });
    return res;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Бүртгэлд алдаа гарлаа" }, { status: 500 });
  }
}
