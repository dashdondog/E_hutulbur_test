import { NextRequest, NextResponse } from "next/server";
import { getCombinedText } from "@/backend/lib/files";
import { extractSchedule, generateChapterPlan } from "@/backend/lib/ai";
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
      return NextResponse.json({ error: "Эхлээд PDF файл байршуулна уу" }, { status: 400 });
    }

    // Step 1: Extract schedule (chapters + topics distributed across 10 weeks)
    let schedule;
    try {
      schedule = await extractSchedule(subject.name, text);
    } catch (err) {
      console.error("First extractSchedule attempt failed, retrying...", err);
      // Retry once
      schedule = await extractSchedule(subject.name, text);
    }

    if (!schedule.chapters || schedule.chapters.length === 0) {
      return NextResponse.json({ error: "Бүлэг олдсонгүй" }, { status: 400 });
    }

    // Step 2: Generate detailed plan for each chapter
    const plans = [];
    for (const ch of schedule.chapters) {
      try {
        const plan = await generateChapterPlan(subject.name, ch.name, ch.topics, text);
        // Ensure name is never empty
        if (!plan.name || !plan.name.trim()) {
          plan.name = `Нэгж хөтөлбөр - ${ch.name}`;
        }
        if (plan.content && !plan.content.chapter) {
          plan.content.chapter = ch.name;
        }
        plans.push(plan);
      } catch (err) {
        console.error(`Error generating plan for "${ch.name}":`, err);
        // Still include with basic info if generation fails
        plans.push({
          name: `Нэгж хөтөлбөр - ${ch.name}`,
          goal: ch.name,
          content: {
            subject: subject.name,
            grade: "11-р анги",
            chapter: ch.name,
            topicSchedule: ch.topics,
            duration: "80 минут (2 цаг)",
            goal: ch.name,
            objectives: [],
            lessonForm: "",
            methods: [],
            materials: [],
            steps: [
              { time: "5 мин", phase: "Хичээлийн эхлэл", teacherActivity: "", studentActivity: "", methods: "", assessment: "" },
              { time: "25 мин", phase: "Шинэ мэдлэг олгох", teacherActivity: "", studentActivity: "", methods: "", assessment: "" },
              { time: "20 мин", phase: "Бататгах", teacherActivity: "", studentActivity: "", methods: "", assessment: "" },
              { time: "15 мин", phase: "Чадвар хөгжүүлэх", teacherActivity: "", studentActivity: "", methods: "", assessment: "" },
              { time: "10 мин", phase: "Дүгнэлт", teacherActivity: "", studentActivity: "", methods: "", assessment: "" },
              { time: "5 мин", phase: "Гэрийн даалгавар", teacherActivity: "", studentActivity: "", methods: "", assessment: "" },
            ],
            homework: "",
            reflection: "",
          },
          criteria: [
            { name: "Идэвхтэй оролцоо", percentage: 10, description: "Хичээлд идэвхтэй оролцох" },
            { name: "Даалгаврын гүйцэтгэл", percentage: 30, description: "Хичээл дээрх дадлага ажил" },
            { name: "Бие даасан ажил", percentage: 20, description: "Гэрийн даалгавар" },
            { name: "Явцын шалгалт", percentage: 20, description: "Бүлгийн шалгалт" },
            { name: "Улирлын шалгалт", percentage: 20, description: "Нэгдсэн шалгалт" },
          ],
        });
      }
    }

    return NextResponse.json({ success: true, plans });
  } catch (error) {
    console.error("Generate curriculum error:", error);
    const errMsg = (error as Error).message || "";
    if (errMsg.includes("429") || errMsg.includes("rate_limit")) {
      return NextResponse.json(
        { error: "AI хязгаарт хүрлээ. 20 минутын дараа дахин оролдоно уу." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "Хөтөлбөр үүсгэхэд алдаа: " + errMsg },
      { status: 500 }
    );
  }
}
