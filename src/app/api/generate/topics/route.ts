import { NextRequest, NextResponse } from "next/server";
import { getCombinedText } from "@/backend/lib/files";
import { generateTopics } from "@/backend/lib/ai";
import { subjects } from "@/shared/subjects";

export async function POST(req: NextRequest) {
  try {
    const { subjectId } = await req.json();
    if (!subjectId) {
      return NextResponse.json({ error: "subjectId шаардлагатай" }, { status: 400 });
    }

    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) {
      return NextResponse.json({ error: "Хичээл олдсонгүй" }, { status: 404 });
    }

    const text = getCombinedText(subjectId);
    if (!text.trim()) {
      return NextResponse.json(
        { error: "Эхлээд PDF файл байршуулна уу" },
        { status: 400 }
      );
    }

    const topics = await generateTopics(subject.name, text);

    return NextResponse.json({ success: true, topics });
  } catch (error) {
    console.error("Generate topics error:", error);
    return NextResponse.json(
      { error: "Сэдвүүд үүсгэхэд алдаа гарлаа: " + (error as Error).message },
      { status: 500 }
    );
  }
}
