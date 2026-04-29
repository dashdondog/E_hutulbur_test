import { NextRequest, NextResponse } from "next/server";
import { getCombinedText } from "@/backend/lib/files";
import { generateTestForTopic } from "@/backend/lib/ai";
import { subjects } from "@/shared/subjects";

export async function POST(req: NextRequest) {
  try {
    const { subjectId, topicName, subtopics, questionCount } = await req.json();

    if (!subjectId || !topicName) {
      return NextResponse.json(
        { error: "subjectId болон topicName шаардлагатай" },
        { status: 400 }
      );
    }

    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) {
      return NextResponse.json({ error: "Хичээл олдсонгүй" }, { status: 404 });
    }

    const text = await getCombinedText(subjectId);
    if (!text.trim()) {
      return NextResponse.json(
        { error: "Эхлээд PDF файл байршуулна уу" },
        { status: 400 }
      );
    }

    const test = await generateTestForTopic(
      subject.name,
      topicName,
      subtopics || [],
      text,
      questionCount || 10
    );

    return NextResponse.json({ success: true, test });
  } catch (error) {
    console.error("Generate test error:", error);
    return NextResponse.json(
      { error: "Тест үүсгэхэд алдаа гарлаа: " + (error as Error).message },
      { status: 500 }
    );
  }
}
