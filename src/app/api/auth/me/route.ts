import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/backend/lib/auth";
import { getDb } from "@/backend/lib/mongodb";
import { ObjectId } from "mongodb";

// Fast path: return JWT user immediately. teacherSubjects fetched lazily
// from the DB only when the caller passes ?withSubjects=1 (settings page,
// classroom create flow). This keeps every page-load /me hit DB-free.
export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  if (req.nextUrl.searchParams.get("withSubjects") !== "1") {
    return NextResponse.json({ user });
  }

  try {
    const db = await getDb();
    const dbUser = await db
      .collection("users")
      .findOne(
        { _id: new ObjectId(user.userId) },
        { projection: { teacherSubjects: 1 } }
      );
    return NextResponse.json({
      user: { ...user, teacherSubjects: dbUser?.teacherSubjects ?? [] },
    });
  } catch (err) {
    console.warn("/api/auth/me DB lookup failed:", (err as Error).message);
    return NextResponse.json({ user: { ...user, teacherSubjects: [] } });
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teacherSubjects } = await req.json();
  if (!Array.isArray(teacherSubjects)) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  const db = await getDb();
  await db.collection("users").updateOne(
    { _id: new ObjectId(user.userId) },
    { $set: { teacherSubjects } }
  );

  return NextResponse.json({ success: true, teacherSubjects });
}
