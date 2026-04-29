import { NextRequest, NextResponse } from "next/server";
import { editViaChat } from "@/backend/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const {
      targetType,
      target,
      history,
      message,
    }: {
      targetType?: "curriculum" | "test";
      target?: unknown;
      history?: { role: "user" | "assistant"; content: string }[];
      message?: string;
    } = await req.json();

    if (!targetType || (targetType !== "curriculum" && targetType !== "test")) {
      return NextResponse.json({ error: "targetType буруу" }, { status: 400 });
    }
    if (!target) {
      return NextResponse.json({ error: "Засах зүйл сонгоно уу" }, { status: 400 });
    }
    if (!message?.trim()) {
      return NextResponse.json({ error: "Хүсэлт хоосон байна" }, { status: 400 });
    }

    const result = await editViaChat(
      targetType,
      target,
      history || [],
      message.trim()
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Chat edit error:", error);
    const errMsg = (error as Error).message || "";
    if (errMsg.includes("429") || errMsg.includes("rate_limit")) {
      return NextResponse.json(
        { error: "AI хязгаарт хүрлээ. Дараа дахин оролдоно уу." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "Чатаар засахад алдаа: " + errMsg },
      { status: 500 }
    );
  }
}
