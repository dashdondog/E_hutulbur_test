import { NextResponse } from "next/server";
import { getDb } from "@/backend/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();

    const [totalTopics, totalTests, questionsAgg] = await Promise.all([
      db.collection("topics").countDocuments(),
      db.collection("tests").countDocuments(),
      db
        .collection("tests")
        .aggregate([
          { $project: { count: { $size: "$questions" } } },
          { $group: { _id: null, total: { $sum: "$count" } } },
        ])
        .toArray(),
    ]);

    const totalQuestions = questionsAgg[0]?.total ?? 0;

    return NextResponse.json({ totalTopics, totalTests, totalQuestions });
  } catch (error) {
    console.error("Get stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
