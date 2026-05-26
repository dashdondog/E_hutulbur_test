import { NextRequest, NextResponse } from "next/server";
import { getCombinedText } from "@/backend/lib/files";
import { generateTopics } from "@/backend/lib/ai";
import { getAuthUser } from "@/backend/lib/auth";
import { subjects } from "@/shared/subjects";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || (user.role !== "teacher" && user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subjectId } = await req.json();
    if (!subjectId) {
      return NextResponse.json({ error: "subjectId шаардлагатай" }, { status: 400 });
    }

    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) {
      return NextResponse.json({ error: "Хичээл олдсонгүй" }, { status: 404 });
    }

    const text = await getCombinedText(subjectId);
    console.log(`[topics] text length: ${text.length}, preview: "${text.slice(0, 200)}"`);
    if (!text.trim()) {
      return NextResponse.json(
        { error: "Эхлээд PDF файл байршуулна уу" },
        { status: 400 }
      );
    }

    const topics = await generateTopics(subject.name, text);

    return NextResponse.json({ success: true, topics, _textLength: text.length });
  } catch (error) {
    console.error("Generate topics error:", error);
    return NextResponse.json(
      { error: "Сэдвүүд үүсгэхэд алдаа гарлаа: " + (error as Error).message },
      { status: 500 }
    );
  }
}
