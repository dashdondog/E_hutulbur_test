import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getDb } from "@/backend/lib/mongodb";
import { hashPassword } from "@/backend/lib/auth";
import { getAuthUser } from "@/backend/lib/auth";

function generateTempPassword(): string {
  // 12 chars from URL-safe alphabet — ~71 bits of entropy.
  return crypto.randomBytes(9).toString("base64url");
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAuthUser();
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!name || !email) {
      return NextResponse.json({ error: "Нэр болон имэйл шаардлагатай" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Имэйл буруу байна" }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db.collection("users").findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Энэ имэйл бүртгэлтэй байна" }, { status: 400 });
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    const result = await db.collection("users").insertOne({
      name,
      email,
      passwordHash,
      role: "teacher",
      createdAt: new Date(),
      createdBy: admin.userId,
      mustChangePassword: true,
    });

    return NextResponse.json({
      user: {
        _id: result.insertedId.toString(),
        name,
        email,
        role: "teacher",
      },
      tempPassword,
    });
  } catch (error) {
    console.error("Create teacher error:", error);
    return NextResponse.json({ error: "Багш үүсгэхэд алдаа гарлаа" }, { status: 500 });
  }
}
