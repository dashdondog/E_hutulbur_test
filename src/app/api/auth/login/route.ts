import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/backend/lib/mongodb";
import { verifyPassword, signToken } from "@/backend/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Имэйл, нууц үг оруулна уу" }, { status: 400 });
    }

    const db = await getDb();
    const user = await db.collection("users").findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "Нэвтрэх код эсвэл нууц үг буруу" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Нэвтрэх код эсвэл нууц үг буруу" }, { status: 401 });
    }

    const token = await signToken({
      userId: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
    });

    const userData = {
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      teacherSubjects: user.teacherSubjects ?? [],
    };

    const res = NextResponse.json({ user: userData });
    res.cookies.set("token", token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });
    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Нэвтрэхэд алдаа гарлаа" }, { status: 500 });
  }
}
