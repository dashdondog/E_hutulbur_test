import { NextRequest, NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse");
import {
  saveFileWithText,
  getFilesBySubject,
  deleteFile,
  UploadedFile,
} from "@/backend/lib/files";
import { getAuthUser } from "@/backend/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || (user.role !== "teacher" && user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const subjectId = formData.get("subjectId") as string | null;

    if (!subjectId || !file) {
      return NextResponse.json(
        { error: "subjectId болон файл шаардлагатай" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isText = file.type === "text/plain" || /\.(txt|md)$/i.test(file.name);

    let text = "";
    if (isPdf) {
      const data = await pdfParse(buffer);
      text = data.text || "";
    } else if (isText) {
      text = buffer.toString("utf-8");
    } else {
      text = `[Файл: ${file.name}]`;
    }

    console.log(`[upload] ${file.name}: extracted ${text.length} chars`);

    const fileMeta: UploadedFile = {
      id: crypto.randomUUID(),
      subjectId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
    };
    await saveFileWithText(fileMeta, text);

    return NextResponse.json({
      success: true,
      file: fileMeta,
      textLength: text.length,
      warning: text.trim()
        ? undefined
        : "Файлаас текст гаргаж авч чадсангүй. Файлыг дахин байршуулна уу.",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Файл байршуулахад алдаа гарлаа: " + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subjectId = req.nextUrl.searchParams.get("subjectId");
  if (!subjectId) {
    return NextResponse.json(
      { error: "subjectId шаардлагатай" },
      { status: 400 }
    );
  }
  const files = await getFilesBySubject(subjectId);
  return NextResponse.json({ files });
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || (user.role !== "teacher" && user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = await req.json();
    if (!fileId) {
      return NextResponse.json(
        { error: "fileId шаардлагатай" },
        { status: 400 }
      );
    }
    await deleteFile(fileId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Файл устгахад алдаа гарлаа" },
      { status: 500 }
    );
  }
}
